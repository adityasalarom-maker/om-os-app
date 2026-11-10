param(
    [string]$Reason = "manual_checkpoint"
)
$ErrorActionPreference = "Stop"
$projectRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$snapshotDir = Join-Path $projectRoot "version_backups\snapshot_$timestamp"

New-Item -ItemType Directory -Path $snapshotDir -Force | Out-Null

$includedPaths = @(
    "src", "public", "scripts", "docs", ".agents",
    "android\app\src", "android\gradle\wrapper",
    "android\app\build.gradle", "android\app\proguard-rules.pro",
    "android\build.gradle", "android\settings.gradle", "android\gradle.properties",
    "package.json", "package-lock.json", "index.html", "vite.config.ts",
    "capacitor.config.json", "tsconfig.json", "tsconfig.app.json", "tsconfig.node.json",
    ".oxlintrc.json", ".gitignore", "README.md", "AGENTS.md"
)

$copiedPaths = @()
foreach ($relativePath in $includedPaths) {
    $sourcePath = Join-Path $projectRoot $relativePath
    if (-not (Test-Path -LiteralPath $sourcePath)) { continue }

    $snapshotPath = Join-Path $snapshotDir $relativePath
    $snapshotParent = Split-Path -Parent $snapshotPath
    New-Item -ItemType Directory -Path $snapshotParent -Force | Out-Null
    Copy-Item -LiteralPath $sourcePath -Destination $snapshotPath -Recurse -Force
    $copiedPaths += $relativePath
}

$commitHash = ""
try {
    $commitHash = (git rev-parse HEAD 2>$null)
} catch {}

$snapshotFiles = @(Get-ChildItem -LiteralPath $snapshotDir -Recurse -File)
$snapshotManifest = [PSCustomObject]@{
    manifestVersion = 2
    timestamp = $timestamp
    createdAtUtc = [DateTime]::UtcNow.ToString("o")
    reason = $Reason
    snapshotDir = "snapshot_$timestamp"
    commitHash = $commitHash
    includedPaths = $copiedPaths
    fileCount = $snapshotFiles.Count
    totalBytes = [long](($snapshotFiles | Measure-Object -Property Length -Sum).Sum)
    excluded = @("node_modules", "dist", "logs", "generated APK/build output", "browser/WebView note data", "private sync runtime files")
}

$snapshotManifest | ConvertTo-Json -Depth 5 | Set-Content -LiteralPath (Join-Path $snapshotDir "snapshot-manifest.json") -Encoding UTF8
$logEntry = $snapshotManifest | ConvertTo-Json -Depth 5 -Compress

Add-Content -LiteralPath (Join-Path $projectRoot "version_backups\manifest.jsonl") -Value $logEntry -Encoding UTF8
Write-Host "Snapshot successfully created at: $snapshotDir"
Write-Host "Included $($snapshotFiles.Count) files across $($copiedPaths.Count) paths; $([math]::Round($snapshotManifest.totalBytes / 1MB, 2)) MiB."
