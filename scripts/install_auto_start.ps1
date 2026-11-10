# Om Knowledge OS - Auto-Start & Sleep-Wake Resilience Installer
# Installs persistent startup shortcut and registers background service.

$ErrorActionPreference = 'Stop'

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$vbsLauncher = Join-Path $scriptDir "start_om_os_background.vbs"
$startupDir = [System.Environment]::GetFolderPath('Startup')
$shortcutPath = Join-Path $startupDir "OmKnowledgeOS_Server.lnk"

Write-Host "Installing Om Knowledge OS persistent startup shortcut..." -ForegroundColor Cyan

$wsh = New-Object -ComObject WScript.Shell
$shortcut = $wsh.CreateShortcut($shortcutPath)
$shortcut.TargetPath = "wscript.exe"
$shortcut.Arguments = "`"$vbsLauncher`""
$shortcut.WorkingDirectory = $scriptDir
$shortcut.Description = "Om Knowledge OS Persistent Background Service"
$shortcut.WindowStyle = 7
$shortcut.Save()

Write-Host "[OK] Startup shortcut created at: $shortcutPath" -ForegroundColor Green

# Launch the service immediately
Write-Host "Triggering background service launcher now..." -ForegroundColor Cyan
& wscript.exe "$vbsLauncher"

Start-Sleep -Seconds 3

# Verify health
try {
    $res = Invoke-RestMethod -Uri "http://localhost:8080/api/health" -Method Get -TimeoutSec 3 -ErrorAction Stop
    Write-Host "[OK] Om Knowledge OS Server is healthy and active on http://localhost:8080/ (Mode: $($res.mode), Uptime: $($res.uptime)s)" -ForegroundColor Green
}
catch {
    Write-Host "[INFO] Server is initializing in background. Check logs at %LOCALAPPDATA%\OmKnowledgeOS\logs\server_service.log" -ForegroundColor Yellow
}
