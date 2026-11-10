# [OM] Om Knowledge OS - Samsung Galaxy S25 Ultra Wireless Deployment & ADB Engine
#
# Supports:
# 1. Browser preview of the Om Knowledge OS web app over a private LAN.
# 2. Capacitor Android APK build and install/update when JDK, Android SDK, and ADB are available.
# 3. USB or wireless ADB device selection; browser preview is not a native app install.
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
Write-Host "  [OM] OM KNOWLEDGE OS - SAMSUNG GALAXY S25 ULTRA WIRELESS DEPLOYMENT" -ForegroundColor Cyan
Write-Host "========================================================================" -ForegroundColor Cyan
Write-Host ""

# 1. Detect Wi-Fi LAN IP. Get-NetIPAddress may be unavailable in restricted shells;
# use .NET network interfaces as a fallback and keep building even without an IP.
$wifiIp = $null
try {
    $wifiIp = (Get-NetIPAddress -AddressFamily IPv4 -ErrorAction Stop | Where-Object { $_.InterfaceAlias -like "*Wi-Fi*" -or $_.InterfaceAlias -like "*WLAN*" } | Select-Object -First 1).IPAddress
} catch { }
if (-not $wifiIp) {
    try {
        $wifiIp = [System.Net.NetworkInformation.NetworkInterface]::GetAllNetworkInterfaces() |
            Where-Object { $_.OperationalStatus -eq 'Up' -and $_.NetworkInterfaceType -notin @('Loopback', 'Tunnel') } |
            ForEach-Object { $_.GetIPProperties().UnicastAddresses } |
            Where-Object { $_.Address.AddressFamily -eq [System.Net.Sockets.AddressFamily]::InterNetwork -and -not $_.Address.IsLoopback -and $_.Address.ToString() -notlike '169.254.*' } |
            Select-Object -First 1 -ExpandProperty Address
        if ($wifiIp) { $wifiIp = $wifiIp.ToString() }
    } catch { }
}
if (-not $wifiIp) { $wifiIp = '127.0.0.1' }

Write-Host "[>] STEP 1: Network and Endpoint Topology" -ForegroundColor Magenta
Write-Host "  - Local Host PC:           http://localhost:5173/ (Dev) | http://localhost:8080/ (Prod)" -ForegroundColor Gray
Write-Host "  - Samsung S25 Ultra Wi-Fi: http://${wifiIp}:5173/ (Dev) | http://${wifiIp}:8080/ (Prod)" -ForegroundColor Green
Write-Host ""

# 2. Sync Capacitor Web Assets
Write-Host "[>] STEP 2: Syncing Web Assets to Native Android Project..." -ForegroundColor Magenta
Push-Location $appRoot
try {
    & npm run build
    if ($LASTEXITCODE -ne 0) { throw "npm run build failed with exit code $LASTEXITCODE" }
    & npx cap sync android
    if ($LASTEXITCODE -ne 0) { throw "npx cap sync android failed with exit code $LASTEXITCODE" }
    Write-Host "  [OK] Assets synced to android/app/src/main/assets/public" -ForegroundColor Green
} catch {
    throw "Failed to sync Capacitor assets: $_"
} finally {
    Pop-Location
}

if ($SyncOnly) {
    Write-Host "`nSync complete. Exiting per -SyncOnly parameter." -ForegroundColor Yellow
    exit 0
}

$apkPath = Join-Path $appRoot "android\app\build\outputs\apk\debug\app-debug.apk"
if ($InstallApk) {
    Write-Host "`n[>] STEP 3: Building the updated native Android app..." -ForegroundColor Magenta
    $gradleWrapper = Join-Path $appRoot "android\gradlew.bat"
    if (-not (Test-Path -LiteralPath $gradleWrapper)) {
        throw "Gradle wrapper not found at $gradleWrapper"
    }
    # Capacitor's current Android toolchain compiles with Java 21. Do not trust
    # an unrelated JAVA_HOME: validate its actual version and prefer the cached
    # project JDK 21 when the inherited environment points at Java 17 or older.
    $configuredJavaExe = if ($env:JAVA_HOME) { Join-Path $env:JAVA_HOME "bin\java.exe" } else { (Get-Command "java" -ErrorAction SilentlyContinue).Source }
    $configuredJavaText = if ($configuredJavaExe -and (Test-Path -LiteralPath $configuredJavaExe)) { (& $configuredJavaExe -version 2>&1 | Out-String) } else { "" }
    $javaVersionMatch = [regex]::Match($configuredJavaText, 'version\s+"(?:1\.)?(?<major>\d+)')
    $javaMajor = if ($javaVersionMatch.Success) { [int]$javaVersionMatch.Groups["major"].Value } else { 0 }

    if ($javaMajor -lt 21) {
        $cachedJdkRoot = Join-Path $appRoot "node_modules\.cache\android-build-tools\jdk"
        $studioJdk = Get-ChildItem -LiteralPath $cachedJdkRoot -Directory -ErrorAction SilentlyContinue |
            Where-Object { $_.Name -match '(^|[-_])21([.-]|$)' -and (Test-Path -LiteralPath (Join-Path $_.FullName "bin\java.exe")) } |
            Sort-Object Name -Descending |
            Select-Object -First 1 -ExpandProperty FullName
        if (-not $studioJdk) {
            $studioJdkPaths = @(
                "$env:ProgramFiles\Android\Android Studio\jbr",
                "$env:LOCALAPPDATA\Programs\Android Studio\jbr",
                "${env:ProgramFiles(x86)}\Android\Android Studio\jbr"
            )
            $studioJdk = $studioJdkPaths | Where-Object { Test-Path -LiteralPath (Join-Path $_ "bin\java.exe") } | Select-Object -First 1
        }
        if ($studioJdk) {
            $env:JAVA_HOME = $studioJdk
            $env:PATH = (Join-Path $studioJdk "bin") + ";" + $env:PATH
            $configuredJavaExe = Join-Path $studioJdk "bin\java.exe"
            $configuredJavaText = (& $configuredJavaExe -version 2>&1 | Out-String)
            $javaVersionMatch = [regex]::Match($configuredJavaText, 'version\s+"(?:1\.)?(?<major>\d+)')
            $javaMajor = if ($javaVersionMatch.Success) { [int]$javaVersionMatch.Groups["major"].Value } else { 0 }
        }
    }
    if ($javaMajor -lt 21) {
        throw "JDK 21 or newer is required to build this APK; found Java $javaMajor. Install Android Studio with its bundled JDK or restore the cached project JDK 21. The web assets are already synced."
    }

    $androidSdkRoot = $env:ANDROID_SDK_ROOT
    if (-not $androidSdkRoot) { $androidSdkRoot = $env:ANDROID_HOME }
    if (-not $androidSdkRoot) {
        $localProperties = Join-Path $appRoot "android\local.properties"
        if (Test-Path -LiteralPath $localProperties) {
            $sdkLine = Get-Content -LiteralPath $localProperties | Where-Object { $_ -match '^sdk\.dir=' } | Select-Object -First 1
            if ($sdkLine) { $androidSdkRoot = ($sdkLine -replace '^sdk\.dir=', '').Replace('\\', '\') }
        }
    }
    if (-not $androidSdkRoot) {
        $sdkCandidates = @(
            "$env:LOCALAPPDATA\Android\Sdk",
            "$env:ProgramFiles\Android\Sdk",
            "C:\Android\Sdk",
            (Join-Path $appRoot "node_modules\.cache\android-build-tools\sdk")
        )
        $androidSdkRoot = $sdkCandidates | Where-Object { Test-Path -LiteralPath (Join-Path $_ "platform-tools") } | Select-Object -First 1
    }
    if (-not $androidSdkRoot -or -not (Test-Path -LiteralPath (Join-Path $androidSdkRoot "platform-tools"))) {
        throw "Android SDK not found. Install Android Studio and its Android SDK, or set ANDROID_HOME/ANDROID_SDK_ROOT, then rerun with -InstallApk. The web assets are already synced."
    }
    $env:ANDROID_HOME = $androidSdkRoot
    $env:ANDROID_SDK_ROOT = $androidSdkRoot
    if (-not $env:GRADLE_USER_HOME) {
        $env:GRADLE_USER_HOME = Join-Path $appRoot "node_modules\.cache\gradle-user-home"
        New-Item -ItemType Directory -Force -Path $env:GRADLE_USER_HOME | Out-Null
    }
    Push-Location (Join-Path $appRoot "android")
    $previousJavaToolOptions = $env:JAVA_TOOL_OPTIONS
    if ($env:JAVA_TOOL_OPTIONS -notmatch 'trustStoreType=Windows-ROOT') {
        $env:JAVA_TOOL_OPTIONS = (($env:JAVA_TOOL_OPTIONS + " -Djavax.net.ssl.trustStoreType=Windows-ROOT").Trim())
    }
    try {
        & $gradleWrapper assembleDebug
        if ($LASTEXITCODE -ne 0) { throw "Gradle APK build failed with exit code $LASTEXITCODE" }
    } finally {
        $env:JAVA_TOOL_OPTIONS = $previousJavaToolOptions
        Pop-Location
    }
    if (-not (Test-Path -LiteralPath $apkPath)) { throw "Gradle reported success but APK was not found: $apkPath" }
    Write-Host "  [OK] Updated debug APK built: $apkPath" -ForegroundColor Green
}

# 4. Find ADB executable
Write-Host "`n[>] STEP 4: Probing Android Debug Bridge (ADB)..." -ForegroundColor Magenta
$adbPath = $null
if (Get-Command "adb" -ErrorAction SilentlyContinue) {
    $adbPath = "adb"
} else {
    $commonSdkPaths = @(
        "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe",
        "$env:ProgramFiles\Android\Android Studio\platform-tools\adb.exe",
        "${env:ProgramFiles(x86)}\Android\Android Studio\platform-tools\adb.exe",
        "C:\Android\platform-tools\adb.exe"
    )
    if ($androidSdkRoot) { $commonSdkPaths = @((Join-Path $androidSdkRoot "platform-tools\adb.exe")) + $commonSdkPaths }
    foreach ($p in $commonSdkPaths) {
        if (Test-Path $p) {
            $adbPath = $p
            break
        }
    }
}

if ($adbPath) {
    Write-Host "  [OK] ADB found: $adbPath" -ForegroundColor Green
    
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

    if ($InstallApk) {
        $connectedDevices = @($devices -match '\bdevice$')
        if ($connectedDevices.Count -eq 0) {
            Write-Warning "No authorized Android device is connected. Transfer this APK to the S25 and tap it to install: $apkPath"
        } else {
            Write-Host "  Installing update without uninstalling the app (keeps its app data if the signing key matches)..." -ForegroundColor Yellow
            & $adbPath install -r $apkPath
            if ($LASTEXITCODE -ne 0) {
                throw "APK installation failed. Do not uninstall the existing app to work around a signature mismatch; that can erase its local data. Check the signing key and back up app data first."
            }
            Write-Host "  [OK] Updated Om Knowledge OS installed on the connected S25." -ForegroundColor Green
            & $adbPath shell monkey -p "com.omknowledge.os" 1 | Out-Null
        }
    } else {
        # This is a browser preview, not a native app installation.
        Write-Host "  Browser preview only: http://${wifiIp}:8080/?view=notes-pro (start the server separately)." -ForegroundColor Gray
        Write-Host "  Do not use the plain-HTTP LAN page for Pro sync; use the updated Capacitor app for WebCrypto." -ForegroundColor Yellow
    }
} else {
    Write-Host "  [INFO] Note: ADB is not installed in standard PATH." -ForegroundColor Yellow
    if ($InstallApk -and (Test-Path -LiteralPath $apkPath)) {
        Write-Host "    Transfer the APK to the S25 and tap it to install: $apkPath" -ForegroundColor Gray
    } elseif ($InstallApk) {
        Write-Host "    The APK could not be built yet. Install Android Studio/JDK/SDK, then rerun with -InstallApk." -ForegroundColor Gray
    } else {
        Write-Host "    A browser preview is not a native APK; Pro sync requires the updated Capacitor app." -ForegroundColor Gray
    }
}

# 4. Standalone Installation Instructions
Write-Host ""
Write-Host "========================================================================" -ForegroundColor Cyan
Write-Host "  SAMSUNG GALAXY S25 ULTRA - INSTALL AND UPDATE GUIDE" -ForegroundColor Cyan
Write-Host "========================================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "  METHOD 1: Open a browser preview (not a native app install)" -ForegroundColor White
Write-Host "    1. Start the production server on the laptop with: npm run serve:notes-sync" -ForegroundColor Gray
Write-Host "    2. Open http://${wifiIp}:8080/?view=notes-pro on the S25 while on the same private network." -ForegroundColor Yellow
Write-Host "    3. Plain-HTTP LAN pages cannot use secure browser cryptography; Pro Sync is blocked in this browser preview." -ForegroundColor Yellow
Write-Host ""
Write-Host "  METHOD 2: Build and install/update the native Android app" -ForegroundColor White
Write-Host "    1. Install Android Studio with its bundled JDK and Android SDK, or keep this project's cached JDK/SDK; connect the S25 and enable USB debugging." -ForegroundColor Gray
Write-Host "    2. After code changes, from the app folder run: npm run deploy:s25 -- -InstallApk" -ForegroundColor Yellow
Write-Host "    3. The script builds android/app/build/outputs/apk/debug/app-debug.apk and runs adb install -r when a device is connected." -ForegroundColor Gray
Write-Host "    4. If installing manually, copy that APK to the S25 and open it. Android may ask to allow installs from that source." -ForegroundColor Gray
Write-Host "    5. Never uninstall an existing app to bypass a signature error until its local data is backed up." -ForegroundColor Yellow
Write-Host ""
Write-Host "========================================================================" -ForegroundColor Cyan
