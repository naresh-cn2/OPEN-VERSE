import subprocess
import time
import sys
import os

from adb_helper import adb_cmd, ensure_device

ARTIFACT_DIR = r"C:\Users\nares\.gemini\antigravity\brain\93ce855d-86e9-462b-9f77-f7705c0157af"

print("0. Ensuring device...", flush=True)
if not ensure_device():
    print("Device not ready!", flush=True)
    sys.exit(1)

print("1. Force stopping...", flush=True)
adb_cmd(["shell", "am", "force-stop", "ai.openverse.mobile.debug"])
adb_cmd(["shell", "am", "force-stop", "ai.openverse.mobile"])
time.sleep(1)

print("2. Clearing logcat...", flush=True)
adb_cmd(["logcat", "-c"])

print("3. Launching MainActivity...", flush=True)
res = adb_cmd(["shell", "am", "start", "-n", "ai.openverse.mobile.debug/ai.openverse.mobile.MainActivity"])
print("Launch result:", res.stdout, flush=True)

print("4. Waiting 4s for startup & hydration...", flush=True)
time.sleep(4)

print("5. Capturing screenshot...", flush=True)
adb_cmd(["shell", "screencap", "-p", "/data/local/tmp/cold_launch.png"])
out_png = os.path.join(ARTIFACT_DIR, "screen_cold_launch_fixed.png")
ADB = r"C:\Users\nares\AppData\Local\Android\Sdk\platform-tools\adb.exe"
subprocess.run([ADB, "-s", "emulator-5554", "pull", "/data/local/tmp/cold_launch.png", out_png], capture_output=True)
print("Screenshot saved to:", out_png, flush=True)

print("6. Dumping UI hierarchy...", flush=True)
adb_cmd(["shell", "uiautomator", "dump", "/data/local/tmp/ui_cold.xml"])
dump_res = subprocess.run([ADB, "-s", "emulator-5554", "exec-out", "cat", "/data/local/tmp/ui_cold.xml"], capture_output=True, text=True)
if "Starting OPEN" in dump_res.stdout:
    print("ALERT: 'Starting OPEN' still found in UI!", flush=True)
else:
    print("SUCCESS: 'Starting OPEN' is NOT in UI dump!", flush=True)

if "OPEN - VERSE" in dump_res.stdout or "Connect a model" in dump_res.stdout or "Welcome" in dump_res.stdout:
    print("CANONICAL APP UI DETECTED!", flush=True)
