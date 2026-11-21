$ErrorActionPreference = "Continue"
$adb = "C:\Users\nares\AppData\Local\Android\Sdk\platform-tools\adb.exe"
$outDir = "C:\Users\nares\Workspace\OPEN-VERSE\tests\native-qa"
$artDir = "C:\Users\nares\.gemini\antigravity\brain\93ce855d-86e9-462b-9f77-f7705c0157af"
if (-not (Test-Path $outDir)) { New-Item -ItemType Directory -Force -Path $outDir }

Write-Host "=== Waiting for emulator to boot with 2GB RAM ==="
& $adb start-server

$booted = $false
for ($i = 0; $i -lt 40; $i++) {
    $devs = & $adb devices
    if ($devs -match "emulator-5554\s+device" -or $devs -match "127\.0\.0\.1:5555\s+device") {
        $bootProp = (& $adb shell getprop sys.boot_completed 2>$null)
        if ($bootProp -and $bootProp.Trim() -eq "1") {
            Write-Host "Android system boot completed!"
            $booted = $true
            break
        }
    } else {
        & $adb connect 127.0.0.1:5555 2>$null
    }
    Start-Sleep -Seconds 3
    Write-Host "Booting... ($i/40)"
}

Write-Host "=== Installing OPEN-VERSE APK ==="
$apk = "C:\Users\nares\Workspace\OPEN-VERSE\OPEN-VERSE\mobile\artifacts\open-verse-mobile.apk"
$inst = & $adb install -r -d $apk
Write-Host "Install: $inst"

Write-Host "=== Clearing Logcat & Launching App ==="
& $adb logcat -c
$launch = & $adb shell am start -a android.intent.action.MAIN -c android.intent.category.LAUNCHER -n ai.openverse.mobile.debug/ai.openverse.mobile.MainActivity -W
Write-Host "Launch output: $launch"

# Step 1: Cold Startup & Render
Write-Host "=== Step 1: Waiting 10s for Webview and React Mount ==="
Start-Sleep -Seconds 10
& $adb shell screencap -p /data/local/tmp/step1.png
& $adb pull /data/local/tmp/step1.png "$outDir\step1_startup.png"
Copy-Item "$outDir\step1_startup.png" -Destination "$artDir\native_demo_01_startup.png" -Force

# Step 2: Check Logs
& $adb logcat -d -s "OPEN-VERSE-Native:*" "OPEN-VERSE-JS:*" "chromium:*" "ActivityTaskManager:*" > "$outDir\step1_logcat.txt"
Write-Host "Captured Step 1 screenshot and logs"

# Step 3: Dismiss any notice or click through onboarding if present
# Screen resolution is 1080x2400. Let's tap the central action or buttons
Write-Host "=== Step 2: Workspace interaction ==="
Start-Sleep -Seconds 3
& $adb shell input tap 540 1200
Start-Sleep -Seconds 3
& $adb shell screencap -p /data/local/tmp/step2.png
& $adb pull /data/local/tmp/step2.png "$outDir\step2_workspace.png"
Copy-Item "$outDir\step2_workspace.png" -Destination "$artDir\native_demo_02_workspace.png" -Force

# Step 4: UI dump
& $adb shell uiautomator dump /data/local/tmp/demo_ui.xml
& $adb pull /data/local/tmp/demo_ui.xml "$outDir\demo_ui.xml"

Write-Host "=== DEMO COMPLETE ==="

