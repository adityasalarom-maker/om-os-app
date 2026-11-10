# Om Knowledge OS - Persistent Background Service Launcher
# Checks port 8080, launches serve_production.mjs if not active, and verifies health.

$ErrorActionPreference = 'SilentlyContinue'

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$appDir = Resolve-Path (Join-Path $scriptDir "..")
$logDir = Join-Path $env:LOCALAPPDATA "OmKnowledgeOS\logs"

if (-not (Test-Path $logDir)) {
    New-Item -ItemType Directory -Path $logDir -Force | Out-Null
}

$logFile = Join-Path $logDir "server_service.log"
$stdoutLog = Join-Path $logDir "server_stdout.log"
$stderrLog = Join-Path $logDir "server_stderr.log"
$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"

Add-Content -Path $logFile -Value "[$timestamp] Checking Om OS background service on port 8080..."

# Check if port 8080 is already active
$conn = Get-NetTCPConnection -LocalPort 8080 -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1

if ($conn) {
    Add-Content -Path $logFile -Value "[$timestamp] Port 8080 already active (PID: $($conn.OwningProcess)). Service running."
    exit 0
}

Add-Content -Path $logFile -Value "[$timestamp] Port 8080 has no active listener. Starting production server..."

$nodeCmd = Get-Command node -ErrorAction SilentlyContinue
if ($nodeCmd) {
    $nodeExe = $nodeCmd.Source
} else {
    $nodeExe = "node.exe"
}

$serveScript = Join-Path $scriptDir "serve_production.mjs"

# Start Node process completely detached with file redirection
$proc = Start-Process -FilePath $nodeExe `
    -ArgumentList "`"$serveScript`" --enable-notes-pro-sync" `
    -WorkingDirectory $appDir `
    -WindowStyle Hidden `
    -RedirectStandardOutput $stdoutLog `
    -RedirectStandardError $stderrLog `
    -PassThru

Add-Content -Path $logFile -Value "[$timestamp] Spawned Node server process (PID: $($proc.Id)). Waiting for health check..."

# Wait up to 10 seconds for health check
$healthy = $false
for ($i = 0; $i -lt 20; $i++) {
    Start-Sleep -Milliseconds 500
    try {
        $res = Invoke-RestMethod -Uri "http://localhost:8080/api/health" -Method Get -TimeoutSec 2 -ErrorAction Stop
        if ($res.status -eq 'ok') {
            $healthy = $true
            break
        }
    } catch {
        # Keep waiting
    }
}

$endTimestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
if ($healthy) {
    Add-Content -Path $logFile -Value "[$endTimestamp] [OK] Health check passed. Om OS server active on http://localhost:8080/ (PID: $($proc.Id))."
} else {
    Add-Content -Path $logFile -Value "[$endTimestamp] [WARN] Health check did not respond within 10s. Process state: $($proc.HasExited)."
}
