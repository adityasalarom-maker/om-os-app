[CmdletBinding(SupportsShouldProcess = $true, ConfirmImpact = 'Medium')]
param(
  [string[]]$Ports = @('8080', '5173')
)

$ErrorActionPreference = 'Stop'
$ruleName = 'Om Knowledge OS Notes Pro sync from S25 hotspot'

$wifiProfiles = @(Get-NetConnectionProfile -InterfaceAlias 'Wi-Fi' -ErrorAction Stop)
if ($wifiProfiles.Count -eq 0) {
  throw 'No active Wi-Fi network profile was found. Connect the laptop to the S25 hotspot and try again.'
}
$wifiProfile = $wifiProfiles |
  Sort-Object -Property IPv4Connectivity -Descending |
  Select-Object -First 1
$wifiAddresses = @(Get-NetIPAddress -InterfaceIndex $wifiProfile.InterfaceIndex -AddressFamily IPv4 |
  Where-Object { $_.IPAddress -notlike '127.*' -and $_.PrefixLength -le 30 } |
  Select-Object -First 1)
$wifiAddress = $wifiAddresses | Select-Object -First 1

if (-not $wifiProfile -or -not $wifiAddress) {
  throw 'Could not identify the active IPv4 Wi-Fi network. Connect the laptop to the S25 hotspot and try again.'
}

$addressBytes = [System.Net.IPAddress]::Parse($wifiAddress.IPAddress).GetAddressBytes()
$isPrivate = $addressBytes[0] -eq 10 -or
  ($addressBytes[0] -eq 172 -and $addressBytes[1] -ge 16 -and $addressBytes[1] -le 31) -or
  ($addressBytes[0] -eq 192 -and $addressBytes[1] -eq 168)

if (-not $isPrivate) {
  throw "Wi-Fi address $($wifiAddress.IPAddress) is not a private IPv4 address; no firewall rule was created."
}

$prefixLength = [int]$wifiAddress.PrefixLength
$networkBytes = [byte[]]::new(4)
for ($index = 0; $index -lt 4; $index++) {
  $bitsInByte = [Math]::Max(0, [Math]::Min(8, $prefixLength - ($index * 8)))
  $mask = if ($bitsInByte -eq 0) { 0 } else { (255 -shl (8 - $bitsInByte)) -band 255 }
  $networkBytes[$index] = [byte]([int]$addressBytes[$index] -band $mask)
}
$networkAddress = [System.Net.IPAddress]::new($networkBytes).ToString()
$remoteSubnet = "$networkAddress/$prefixLength"
$remoteSubnets = @($remoteSubnet, '10.0.0.0/8', '172.16.0.0/12', '192.168.0.0/16', 'LocalSubnet')
$nodePath = (Get-Command node.exe -ErrorAction Stop).Source
$profiles = @('Public', 'Private')

$identity = [Security.Principal.WindowsIdentity]::GetCurrent()
$principal = [Security.Principal.WindowsPrincipal]::new($identity)
$isAdministrator = $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdministrator -and -not $WhatIfPreference) {
  Write-Host "`n[!] Administrator privileges required to configure Windows Firewall for mobile access." -ForegroundColor Yellow
  Write-Host "    Requesting UAC elevation prompt (click 'Yes' when prompted)..." -ForegroundColor Cyan
  try {
    $proc = Start-Process powershell.exe -Verb RunAs -ArgumentList "-NoProfile -ExecutionPolicy Bypass -File `"$PSCommandPath`"" -PassThru -Wait
    if ($proc.ExitCode -eq 0) {
      Write-Host "`n[OK] Windows Firewall successfully configured with Administrator privileges!" -ForegroundColor Green
      return
    }
  } catch {
    Write-Warning "Could not automatically elevate. Please open PowerShell as Administrator and run:"
    Write-Host "powershell -ExecutionPolicy Bypass -File `"$PSCommandPath`"" -ForegroundColor Green
    return
  }
}

$existingRule = Get-NetFirewallRule -DisplayName $ruleName -ErrorAction SilentlyContinue
if ($existingRule) {
  if ($PSCmdlet.ShouldProcess($ruleName, "Update scope to $remoteSubnet, TCP $($Ports -join ','), $nodePath, Public/Private profiles")) {
    Set-NetFirewallRule -DisplayName $ruleName -Enabled True -Direction Inbound -Action Allow -Profile $profiles
    $existingRule | Get-NetFirewallPortFilter | Set-NetFirewallPortFilter -Protocol TCP -LocalPort $Ports
    $existingRule | Get-NetFirewallAddressFilter | Set-NetFirewallAddressFilter -RemoteAddress $remoteSubnets
    $existingRule | Get-NetFirewallApplicationFilter | Set-NetFirewallApplicationFilter -Program $nodePath
  }
} elseif ($PSCmdlet.ShouldProcess($ruleName, "Create inbound TCP $($Ports -join ',') rule for $nodePath from $remoteSubnet on Public/Private profiles")) {
  New-NetFirewallRule `
    -DisplayName $ruleName `
    -Direction Inbound `
    -Action Allow `
    -Protocol TCP `
    -LocalPort $Ports `
    -RemoteAddress $remoteSubnets `
    -Program $nodePath `
    -Profile $profiles `
    -Description 'Allow Om Knowledge OS web server and Notes Studio Pro sync from the active private Wi-Fi subnet.' | Out-Null
}

Write-Output "Wi-Fi address: $($wifiAddress.IPAddress)/$($wifiAddress.PrefixLength)"
Write-Output "Allowed peer subnets: $($remoteSubnets -join ', ')"
Write-Output "Allowed process: $nodePath"
Write-Output "Allowed destination: TCP $($Ports -join ',') (Public, Private profiles)"
if ($WhatIfPreference) {
  Write-Output 'Preview only; no firewall rule was changed.'
} else {
  Get-NetFirewallRule -DisplayName $ruleName |
    Select-Object DisplayName, Enabled, Direction, Action, Profile |
    Format-List
}
