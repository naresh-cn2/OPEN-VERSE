$ErrorActionPreference = "Continue"
$adb = "C:\Users\nares\AppData\Local\Android\Sdk\platform-tools\adb.exe"

Write-Host "=== Step 1: Connecting to emulator ==="
& $adb start-server
Start-Sleep -Seconds 2

# Wait for emulator to show as 'device'
$deviceReady = $false
for ($i = 0; $i -lt 30; $i++) {
    $devs = & $adb devices
    Write-Host $devs
    if ($devs -match "emulator-5554\s+device") {
        $deviceReady = $true
        Write-Host "Emulator is in 'device' state!"
        break
    }
    Start-Sleep -Seconds 2
}

if (-not $deviceReady) {
    Write-Host "Trying connect 127.0.0.1:5555..."
    & $adb connect 127.0.0.1:5555
    Start-Sleep -Seconds 2
}

Write-Host "=== Step 2: Waiting for boot completed ==="
for ($i = 0; $i -lt 60; $i++) {
    $boot = (& $adb shell getprop sys.boot_completed 2>$null)
    if ($boot -and $boot.Trim() -eq "1") {
        Write-Host "Android Boot Completed successfully!"
        break
    }
    Write-Host "Waiting for sys.boot_completed... ($i/60)"
    Start-Sleep -Seconds 3
}

Write-Host "=== Step 3: Installing APK ==="
$apkPath = "C:\Users\nares\Workspace\OPEN-VERSE\OPEN-VERSE\mobile\artifacts\open-verse-mobile.apk"
$installOut = & $adb install -r -d $apkPath
Write-Host "Install output: $installOut"

Write-Host "=== Step 4: Clear Logcat & Launch Application ==="
& $adb logcat -c
$launchOut = & $adb shell am start -n ai.openverse.mobile/.MainActivity -W
Write-Host "Launch output: $launchOut"

Write-Host "=== Step 5: Waiting 8s for app rendering ==="
Start-Sleep -Seconds 8

Write-Host "=== Step 6: Capturing Screenshot & Logs ==="
$outDir = "C:\Users\nares\Workspace\OPEN-VERSE\tests\native-qa"
if (-not (Test-Path $outDir)) { New-Item -ItemType Directory -Force -Path $outDir }

& $adb exec-out screencap -p > "$outDir\native_android_01_startup.png"
Write-Host "Captured $outDir\native_android_01_startup.png"

& $adb logcat -d -s "OPEN-VERSE-Native:*" "OPEN-VERSE-JS:*" "Chromium:*" "ActivityTaskManager:*" > "$outDir\native_android_logcat.txt"
Write-Host "Captured $outDir\native_android_logcat.txt"

# Check UI hierarchy
& $adb shell uiautomator dump /data/local/tmp/uidump.xml
& $adb pull /data/local/tmp/uidump.xml "$outDir\native_android_ui.xml"
Write-Host "Captured UI dump"

Write-Host "=== COMPLETED NATIVE ANDROID TEST ==="

