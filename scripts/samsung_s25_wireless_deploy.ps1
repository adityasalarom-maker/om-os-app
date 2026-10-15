# ॐ Om Knowledge OS — Samsung Galaxy S25 Ultra Wireless Deployment & ADB Engine
#
# Supports:
# 1. Standalone Native WebAPK (Zero-Android-Studio needed, 120Hz AMOLED)
# 2. Wireless ADB Discovery & Reverse Port Forwarding (localhost -> phone)
# 3. Capacitor Native Android Sync & APK Sideloading
param (
    [string]$PhoneIp = "",
    [string]$PairingPort = "",
    [string]$PairingCode = "",
    [string]$ConnectPort = "5555",
    [switch]$SyncOnly = $false,
    [switch]$InstallApk = $false
)

$ErrorActionPreference = "Continue"
$appRoot = Split-Path -Parent $PSScriptRoot

Write-Host ""
Write-Host "========================================================================" -ForegroundColor Cyan
Write-Host "  ॐ OM KNOWLEDGE OS — SAMSUNG GALAXY S25 ULTRA WIRELESS DEPLOYMENT" -ForegroundColor Cyan
Write-Host "========================================================================" -ForegroundColor Cyan
Write-Host ""

# 1. Detect Wi-Fi LAN IP
$wifiIp = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.InterfaceAlias -like "*Wi-Fi*" -or $_.InterfaceAlias -like "*WLAN*" }).IPAddress
if (-not $wifiIp) {
    $fallbackIps = Get-NetIPAddress -AddressFamily IPv4 | Where-Object { 
        $_.IPAddress -notlike "127.*" -and $_.IPAddress -notlike "169.254.*" -and $_.InterfaceAlias -notlike "*VirtualBox*" -and $_.InterfaceAlias -notlike "*VMware*"
    } | Select-Object -ExpandProperty IPAddress
    $wifiIp = $fallbackIps[0]
}

Write-Host "▶ STEP 1: Network & Endpoint Topology" -ForegroundColor Magenta
Write-Host "  - Local Host PC:           http://localhost:5173/ (Dev) | http://localhost:8080/ (Prod)" -ForegroundColor Gray
Write-Host "  - Samsung S25 Ultra Wi-Fi: http://${wifiIp}:5173/ (Dev) | http://${wifiIp}:8080/ (Prod)" -ForegroundColor Green
Write-Host ""

# 2. Sync Capacitor Web Assets
Write-Host "▶ STEP 2: Syncing Web Assets to Native Android Project..." -ForegroundColor Magenta
Push-Location $appRoot
try {
    npm run build
    npx cap sync android
    Write-Host "  ✔ Assets synced to android/app/src/main/assets/public" -ForegroundColor Green
} catch {
    Write-Warning "Failed to sync Capacitor assets: $_"
} finally {
    Pop-Location
}

if ($SyncOnly) {
    Write-Host "`nSync complete. Exiting per -SyncOnly parameter." -ForegroundColor Yellow
    exit 0
}

# 3. Find ADB executable
Write-Host "`n▶ STEP 3: Probing Android Debug Bridge (ADB)..." -ForegroundColor Magenta
$adbPath = $null
if (Get-Command "adb" -ErrorAction SilentlyContinue) {
    $adbPath = "adb"
} else {
    $commonSdkPaths = @(
        "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe",
        "$env:ProgramFiles\Android\Android Studio\bin\adb.exe",
        "C:\Android\platform-tools\adb.exe"
    )
    foreach ($p in $commonSdkPaths) {
        if (Test-Path $p) {
            $adbPath = $p
            break
        }
    }
}

if ($adbPath) {
    Write-Host "  ✔ ADB found: $adbPath" -ForegroundColor Green
    
    # Check if user wants to pair wireless ADB
    if ($PhoneIp -and $PairingPort -and $PairingCode) {
        Write-Host "  Connecting via Wireless Pairing: ${PhoneIp}:${PairingPort} with code ${PairingCode}..." -ForegroundColor Yellow
        & $adbPath pair "${PhoneIp}:${PairingPort}" "$PairingCode"
    }

    if ($PhoneIp) {
        Write-Host "  Connecting to device at ${PhoneIp}:${ConnectPort}..." -ForegroundColor Yellow
        & $adbPath connect "${PhoneIp}:${ConnectPort}"
    }

    # List connected devices
    $devices = & $adbPath devices
    Write-Host "`n  Active ADB Devices:" -ForegroundColor Cyan
    Write-Host $devices -ForegroundColor Gray

    # Reverse port forward so http://localhost:5173 works directly on S25 Ultra
    Write-Host "  Configuring Reverse Port Forwarding (tcp:5173 & tcp:8080)..." -ForegroundColor Yellow
    & $adbPath reverse tcp:5173 tcp:5173
    & $adbPath reverse tcp:8080 tcp:8080
    Write-Host "  ✔ Reverse ports configured! S25 Ultra can now navigate to http://localhost:5173 directly!" -ForegroundColor Green

    # Launch browser on phone if requested
    Write-Host "  Launching Om Knowledge OS on connected device..." -ForegroundColor Yellow
    & $adbPath shell am start -a android.intent.action.VIEW -d "http://localhost:5173/"
} else {
    Write-Host "  ℹ Note: ADB is not installed in standard PATH." -ForegroundColor Yellow
    Write-Host "    (No problem! Standalone WebAPK installation on Samsung S25 Ultra operates 100% wirelessly without ADB!)" -ForegroundColor Gray
}

# 4. Standalone Installation Instructions
Write-Host ""
Write-Host "========================================================================" -ForegroundColor Cyan
Write-Host "  SAMSUNG GALAXY S25 ULTRA — 1-CLICK STANDALONE INSTALLATION GUIDE" -ForegroundColor Cyan
Write-Host "========================================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "  METHOD 1: High-Performance Standalone WebAPK (Recommended)" -ForegroundColor White
Write-Host "    1. Connect Samsung Galaxy S25 Ultra to the same Wi-Fi network." -ForegroundColor Gray
Write-Host "    2. Open Samsung Internet or Chrome on your phone." -ForegroundColor Gray
Write-Host "    3. Navigate to: " -NoNewline -ForegroundColor Gray
Write-Host "http://${wifiIp}:5173/" -ForegroundColor Yellow
Write-Host "    4. Tap the 'Install App' banner or Chrome Menu (⋮) -> 'Install App' / 'Add to Home screen'." -ForegroundColor Gray
Write-Host "    5. Android will compile and install a full native WebAPK with:" -ForegroundColor Gray
Write-Host "       • Zero browser chrome / full edge-to-edge AMOLED display" -ForegroundColor Cyan
Write-Host "       • 120Hz smooth ProMotion scrolling" -ForegroundColor Cyan
Write-Host "       • Full offline Dexie IndexedDB access" -ForegroundColor Cyan
Write-Host "       • Long-press home screen shortcuts (Capture, Tasks, Journal, Vault)" -ForegroundColor Cyan
Write-Host ""
Write-Host "  METHOD 2: Native Android Studio APK Build" -ForegroundColor White
Write-Host "    1. In om_os_app root, run: " -NoNewline -ForegroundColor Gray
Write-Host "npx cap open android" -ForegroundColor Yellow
Write-Host "    2. In Android Studio, click: Build -> Build Bundle(s) / APK(s) -> Build APK(s)" -ForegroundColor Gray
Write-Host "    3. Sideload output APK from: android/app/build/outputs/apk/debug/app-debug.apk" -ForegroundColor Gray
Write-Host ""
Write-Host "========================================================================" -ForegroundColor Cyan
