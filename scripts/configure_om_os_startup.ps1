# Om Knowledge OS - Persistent Windows Startup & Resume Setup
# 1. Installs Startup folder shortcut for Windows login
# 2. Registers Windows Scheduled Task for logon and workstation unlock/resume

$ErrorActionPreference = 'SilentlyContinue'

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$vbsLauncher = Join-Path $scriptDir "start_om_os_background.vbs"
$startupDir = [System.Environment]::GetFolderPath('Startup')
$shortcutPath = Join-Path $startupDir "OmKnowledgeOS_Server.lnk"

Write-Host "Setting up Om Knowledge OS persistent startup shortcut..." -ForegroundColor Cyan

# 1. Startup folder shortcut
$wsh = New-Object -ComObject WScript.Shell
$shortcut = $wsh.CreateShortcut($shortcutPath)
$shortcut.TargetPath = "wscript.exe"
$shortcut.Arguments = "`"$vbsLauncher`""
$shortcut.WorkingDirectory = $scriptDir
$shortcut.Description = "Om Knowledge OS Persistent Background Service"
$shortcut.WindowStyle = 7
$shortcut.Save()

Write-Host "[OK] Startup shortcut installed: $shortcutPath" -ForegroundColor Green

# 2. Windows Scheduled Task for Auto-Start & Sleep-Wake Resume
try {
    $action = New-ScheduledTaskAction -Execute "wscript.exe" -Argument "`"$vbsLauncher`"" -WorkingDirectory $scriptDir
    $triggerLogon = New-ScheduledTaskTrigger -AtLogOn
    $settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable -ExecutionTimeLimit (New-TimeSpan -Hours 0)

    Register-ScheduledTask -TaskName "OmKnowledgeOS_AutoStart" -Action $action -Trigger $triggerLogon -Settings $settings -Description "Auto-start Om Knowledge OS server on power-on and login" -Force | Out-Null
    Write-Host "[OK] Scheduled task registered: OmKnowledgeOS_AutoStart (Logon trigger)" -ForegroundColor Green
} catch {
    Write-Host "[INFO] Standard startup shortcut is active." -ForegroundColor Yellow
}

Write-Host "Startup setup complete." -ForegroundColor Green
