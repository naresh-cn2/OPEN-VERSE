$ErrorActionPreference = "Continue"
$adb = "C:\Users\nares\AppData\Local\Android\Sdk\platform-tools\adb.exe"
$outDir = "C:\Users\nares\Workspace\OPEN-VERSE\tests\native-qa"
$artDir = "C:\Users\nares\.gemini\antigravity\brain\93ce855d-86e9-462b-9f77-f7705c0157af"
if (-not (Test-Path $outDir)) { New-Item -ItemType Directory -Force -Path $outDir }

Write-Host ">>> [1/7] Ensuring adb daemon connection to emulator-5554..."
& $adb start-server
Start-Sleep -Seconds 2

$ready = $false
for ($i = 0; $i -lt 30; $i++) {
    $devs = & $adb devices
    Write-Host $devs
    if ($devs -match "emulator-5554\s+device") {
        $ready = $true
        Write-Host "Device is online!"
        break
    }
    Start-Sleep -Seconds 2
}

Write-Host ">>> [2/7] Waiting for Android 14 sys.boot_completed..."
for ($i = 0; $i -lt 60; $i++) {
    $boot = (& $adb -s emulator-5554 shell getprop sys.boot_completed 2>$null)
    if ($boot -and $boot.Trim() -eq "1") {
        Write-Host "System boot completed successfully!"
        break
    }
    Start-Sleep -Seconds 2
}

Write-Host ">>> [3/7] Installing OPEN-VERSE Android APK..."
$apk = "C:\Users\nares\Workspace\OPEN-VERSE\OPEN-VERSE\mobile\artifacts\open-verse-mobile.apk"
$instOut = & $adb -s emulator-5554 install -r -d $apk
Write-Host "Install Result: $instOut"

Write-Host ">>> [4/7] Launching OPEN-VERSE Native Application..."
& $adb -s emulator-5554 logcat -c
$launchOut = & $adb -s emulator-5554 shell am start -a android.intent.action.MAIN -c android.intent.category.LAUNCHER -n ai.openverse.mobile.debug/ai.openverse.mobile.MainActivity -W
Write-Host "Launch Result: $launchOut"

Write-Host ">>> [5/7] Waiting 12s for WebView rendering..."
Start-Sleep -Seconds 12

# Capture Step 1: Initial Launch
& $adb -s emulator-5554 shell screencap -p /data/local/tmp/step1.png
& $adb -s emulator-5554 pull /data/local/tmp/step1.png "$outDir\step1_startup.png"
Copy-Item "$outDir\step1_startup.png" -Destination "$artDir\native_demo_01_startup.png" -Force
Write-Host "Saved step1_startup.png"

# Dump logs to check webview and JS status
& $adb -s emulator-5554 logcat -d -s "OPEN-VERSE-Native:*" "OPEN-VERSE-JS:*" "chromium:*" > "$outDir\step1_logcat.txt"

# Step 6: Test UI interactions
# Let's send a click to focus / dismiss onboarding or enter workspace
Write-Host ">>> [6/7] Interacting with UI controls..."
# Tap "Enter OPEN-VERSE Workspace" or center screen if delayed startup button appears
& $adb -s emulator-5554 shell input tap 540 1350
Start-Sleep -Seconds 4
& $adb -s emulator-5554 shell screencap -p /data/local/tmp/step2.png
& $adb -s emulator-5554 pull /data/local/tmp/step2.png "$outDir\step2_workspace.png"
Copy-Item "$outDir\step2_workspace.png" -Destination "$artDir\native_demo_02_workspace.png" -Force
Write-Host "Saved step2_workspace.png"

# Step 7: UI hierarchy dump
& $adb -s emulator-5554 shell uiautomator dump /data/local/tmp/step2_ui.xml
& $adb -s emulator-5554 pull /data/local/tmp/step2_ui.xml "$outDir\step2_ui.xml"

Write-Host ">>> [7/7] NATIVE ANDROID RUN COMPLETE!"

