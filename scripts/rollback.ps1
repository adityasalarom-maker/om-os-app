[CmdletBinding(SupportsShouldProcess = $true)]
param(
    [string]$SnapshotName
)
$ErrorActionPreference = "Stop"
$projectRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$backupDir = Join-Path $projectRoot "version_backups"

if (-not $SnapshotName) {
    Write-Host "Available snapshots:"
    Get-ChildItem -Path $backupDir -Directory -Filter "snapshot_*" | Sort-Object Name -Descending | Select-Object -First 10 Name
    Write-Host "To restore, run: powershell scripts\rollback.ps1 -SnapshotName <SnapshotFolderName>"
    return
}

$target = [IO.Path]::GetFullPath((Join-Path $backupDir $SnapshotName))
$backupRoot = [IO.Path]::GetFullPath($backupDir).TrimEnd([IO.Path]::DirectorySeparatorChar) + [IO.Path]::DirectorySeparatorChar
if (-not $target.StartsWith($backupRoot, [StringComparison]::OrdinalIgnoreCase)) {
    throw "Snapshot path must remain inside version_backups."
}
if (-not (Test-Path -LiteralPath $target -PathType Container)) {
    throw "Snapshot not found: $target"
}

$manifestPath = Join-Path $target "snapshot-manifest.json"
if (Test-Path -LiteralPath $manifestPath -PathType Leaf) {
    $manifest = Get-Content -LiteralPath $manifestPath -Raw | ConvertFrom-Json
    $relativePaths = @($manifest.includedPaths)
} else {
    # Backward compatibility for snapshots made before manifestVersion 2.
    $relativePaths = @("src", "public", "package.json", "index.html", "vite.config.ts")
}

$restoreItems = @()
foreach ($relativePath in $relativePaths) {
    if ([IO.Path]::IsPathRooted([string]$relativePath) -or ([string]$relativePath -split '[\\/]') -contains "..") {
        throw "Unsafe restore path in snapshot manifest: $relativePath"
    }
    $sourcePath = Join-Path $target $relativePath
    if (-not (Test-Path -LiteralPath $sourcePath)) {
        throw "Snapshot is incomplete; required path is missing: $relativePath"
    }
    $restoreItems += [PSCustomObject]@{ RelativePath = [string]$relativePath; SourcePath = $sourcePath }
}

Write-Host "Snapshot: $target"
Write-Host "Restore scope: $($restoreItems.Count) recorded paths. No files will be deleted."
foreach ($item in $restoreItems) {
    $destination = Join-Path $projectRoot $item.RelativePath
    if ($PSCmdlet.ShouldProcess($destination, "Overwrite from snapshot $SnapshotName")) {
        $parent = Split-Path -Parent $destination
        if ($parent) { New-Item -ItemType Directory -Path $parent -Force | Out-Null }
        if (Test-Path -LiteralPath $item.SourcePath -PathType Container) {
            New-Item -ItemType Directory -Path $destination -Force | Out-Null
            Get-ChildItem -LiteralPath $item.SourcePath -Force | Copy-Item -Destination $destination -Recurse -Force
        } else {
            Copy-Item -LiteralPath $item.SourcePath -Destination $destination -Force
        }
        Write-Host "Restored: $($item.RelativePath)"
    }
}
Write-Host "Restore operation finished. Review the restored app and run npm run build."
