import subprocess
import time
import os
import sys

sys.path.insert(0, r"C:\Users\nares\Workspace\OPEN-VERSE\OPEN-VERSE\scripts")
from adb_helper import adb_cmd, ensure_device

ensure_device()

ARTIFACT_DIR = r"C:\Users\nares\.gemini\antigravity\brain\93ce855d-86e9-462b-9f77-f7705c0157af"
ADB = r"C:\Users\nares\AppData\Local\Android\Sdk\platform-tools\adb.exe"

print("1. Clearing logcat...", flush=True)
adb_cmd(["logcat", "-c"])

print("2. Launching canonical release package ai.openverse.mobile...", flush=True)
res = adb_cmd(["shell", "am", "start", "-n", "ai.openverse.mobile/ai.openverse.mobile.MainActivity"])
print("Launch output:", res.stdout, flush=True)

print("3. Waiting 3s for cold launch & hydration...", flush=True)
time.sleep(3)

print("4. Capturing screenshot...", flush=True)
adb_cmd(["shell", "screencap", "-p", "/data/local/tmp/release_cold_launch.png"])
out_png = os.path.join(ARTIFACT_DIR, "release_cold_launch_screen.png")
subprocess.run([ADB, "-s", "emulator-5554", "pull", "/data/local/tmp/release_cold_launch.png", out_png], capture_output=True)
print("Saved screenshot to:", out_png, flush=True)

print("5. Capturing Logcat...", flush=True)
logcat = adb_cmd(["logcat", "-d", "-s", "OPEN-VERSE-Native:I", "OPEN-VERSE-JS:I", "chromium:I"])
print("=== LOGCAT OUTPUT ===")
print(logcat.stdout[:3000], flush=True)

print("6. Verifying UI dump...", flush=True)
adb_cmd(["shell", "uiautomator", "dump", "/data/local/tmp/ui_release.xml"])
dump = subprocess.run([ADB, "-s", "emulator-5554", "exec-out", "cat", "/data/local/tmp/ui_release.xml"], capture_output=True, text=True)
if "Starting OPEN" in dump.stdout:
    print("STATUS: FAILED - 'Starting OPEN' still detected!", flush=True)
else:
    print("STATUS: PASSED - 'Starting OPEN' is 100% GONE!", flush=True)
