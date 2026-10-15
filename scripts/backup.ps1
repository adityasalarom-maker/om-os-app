param(
    [string]$Reason = "manual_checkpoint"
)
$projectRoot = "C:\Users\adity\AI projects planner\ai selection planner"
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$snapshotDir = Join-Path $projectRoot "version_backups\snapshot_$timestamp"

New-Item -ItemType Directory -Path $snapshotDir -Force | Out-Null
Copy-Item -Path "$projectRoot\src" -Destination "$snapshotDir\src" -Recurse -Force
Copy-Item -Path "$projectRoot\public" -Destination "$snapshotDir\public" -Recurse -Force
Copy-Item -Path "$projectRoot\package.json" -Destination "$snapshotDir\package.json" -Force
Copy-Item -Path "$projectRoot\index.html" -Destination "$snapshotDir\index.html" -Force
Copy-Item -Path "$projectRoot\vite.config.ts" -Destination "$snapshotDir\vite.config.ts" -Force

$commitHash = ""
try {
    $commitHash = (git rev-parse HEAD 2>$null)
} catch {}

$logEntry = [PSCustomObject]@{
    timestamp = $timestamp
    reason = $Reason
    snapshotDir = "snapshot_$timestamp"
    commitHash = $commitHash
} | ConvertTo-Json -Compress

Add-Content -Path "$projectRoot\version_backups\manifest.jsonl" -Value $logEntry
Write-Host "Snapshot successfully created at: $snapshotDir"
