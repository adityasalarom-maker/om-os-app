$key = [Microsoft.Win32.Registry]::CurrentUser.OpenSubKey('Software\Microsoft\Windows\CurrentVersion\Run', $true)
$val = 'wscript.exe "' + (Resolve-Path "C:\Users\adity\Ag Folder\om_os_app\scripts\start_om_os_background.vbs") + '"'
$key.SetValue('OmKnowledgeOS', $val)
$key.Close()

$current = (Get-ItemProperty -Path 'HKCU:\Software\Microsoft\Windows\CurrentVersion\Run').OmKnowledgeOS
Write-Host "REGISTERED: $current"
