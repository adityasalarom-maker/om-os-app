param(
    [string]$SnapshotName
)
$projectRoot = "C:\Users\adity\AI projects planner\ai selection planner"
$backupDir = "$projectRoot\version_backups"

if (-not $SnapshotName) {
    Write-Host "Available snapshots:"
    Get-ChildItem -Path $backupDir -Directory -Filter "snapshot_*" | Sort-Object Name -Descending | Select-Object -First 10 Name
    Write-Host "To restore, run: powershell scripts\rollback.ps1 -SnapshotName <SnapshotFolderName>"
    return
}

$target = Join-Path $backupDir $SnapshotName
if (-not (Test-Path $target)) {
    Write-Error "Snapshot $target not found!"
    return
}

Write-Host "Restoring from $target ..."
Copy-Item -Path "$target\src" -Destination "$projectRoot\" -Recurse -Force
Copy-Item -Path "$target\public" -Destination "$projectRoot\" -Recurse -Force
Copy-Item -Path "$target\package.json" -Destination "$projectRoot\" -Force
Copy-Item -Path "$target\index.html" -Destination "$projectRoot\" -Force
Copy-Item -Path "$target\vite.config.ts" -Destination "$projectRoot\" -Force
Write-Host "Restore complete."
