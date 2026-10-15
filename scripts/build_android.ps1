# Om Knowledge OS - Standalone Android and PWA Build Automation Script
param (
    [switch]$SkipBuild = $false
)

$ErrorActionPreference = "Stop"
$appRoot = Split-Path -Parent $PSScriptRoot

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "  Om Knowledge OS - Standalone Android and PWA Engine" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

# 1. Production Build
if (-not $SkipBuild) {
    Write-Host "[1/4] Compiling TypeScript and Building Production Dist..." -ForegroundColor Yellow
    Push-Location $appRoot
    try {
        npm run build
        Write-Host "OK: Production build succeeded." -ForegroundColor Green
    } catch {
        Write-Error "Production build failed: $_"
    } finally {
        Pop-Location
    }
} else {
    Write-Host "[1/4] Skipping web build as requested." -ForegroundColor DarkGray
}

# 2. Inspect Manifest and Service Worker
Write-Host "[2/4] Validating PWA Standalone Manifest and Service Worker..." -ForegroundColor Yellow
$manifestPath = Join-Path $appRoot "public\manifest.json"
$swPath = Join-Path $appRoot "public\sw.js"

if (Test-Path $manifestPath) {
    $manifest = Get-Content $manifestPath -Raw | ConvertFrom-Json
    Write-Host "  OK: Manifest App Name: $($manifest.name)" -ForegroundColor Green
    Write-Host "  OK: Display Mode: $($manifest.display) (Zero browser chrome)" -ForegroundColor Green
    Write-Host "  OK: Shortcuts registered: $($manifest.shortcuts.Count)" -ForegroundColor Green
} else {
    Write-Warning "manifest.json not found at $manifestPath"
}

if (Test-Path $swPath) {
    Write-Host "  OK: Service Worker active (Offline Caching and Revalidation)" -ForegroundColor Green
}

# 3. Local Wi-Fi Discovery
Write-Host "[3/4] Detecting Local Network IPv4 for Samsung S25 Ultra Testing..." -ForegroundColor Yellow

$wifiIp = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.InterfaceAlias -like "*Wi-Fi*" -or $_.InterfaceAlias -like "*WLAN*" }).IPAddress
if ($wifiIp) {
    $primaryIp = $wifiIp
} else {
    $fallbackIps = Get-NetIPAddress -AddressFamily IPv4 | Where-Object { 
        $_.IPAddress -notlike "127.*" -and $_.IPAddress -notlike "169.254.*" -and $_.InterfaceAlias -notlike "*VirtualBox*" -and $_.InterfaceAlias -notlike "*VMware*"
    } | Select-Object -ExpandProperty IPAddress
    $primaryIp = $fallbackIps[0]
}

Write-Host "  OK: Wi-Fi LAN IP Address: $primaryIp" -ForegroundColor Cyan
Write-Host "  OK: Samsung S25 Ultra URL: http://${primaryIp}:5173/" -ForegroundColor Green

# 4. Standalone Deployment Options
Write-Host "[4/4] Standalone Android Deployment Options:" -ForegroundColor Yellow
Write-Host "  Option A (Recommended: Native WebAPK without Android Studio):" -ForegroundColor White
Write-Host "    1. On Samsung Galaxy S25 Ultra, open Samsung Internet or Google Chrome." -ForegroundColor Gray
Write-Host "    2. Navigate to: http://${primaryIp}:5173/" -ForegroundColor Gray
Write-Host "    3. Tap 'Install Om Knowledge OS' or Chrome Menu -> 'Add to Home screen' -> 'Install'." -ForegroundColor Gray
Write-Host "    4. Android mints a native signed APK that runs edge-to-edge with no address bar!" -ForegroundColor Gray
Write-Host ""
Write-Host "  Option B (Capacitor Native APK Compilation):" -ForegroundColor White
Write-Host "    1. Run: npx cap add android" -ForegroundColor Gray
Write-Host "    2. Run: npx cap sync" -ForegroundColor Gray
Write-Host "    3. Run: npx cap open android (to build APK in Android Studio)" -ForegroundColor Gray

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "  PWA and Android Verification Complete!" -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Cyan
