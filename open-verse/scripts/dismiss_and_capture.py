import subprocess
import time
import os
import sys

sys.path.insert(0, r"C:\Users\nares\Workspace\OPEN-VERSE\OPEN-VERSE\scripts")
from adb_helper import adb_cmd, ensure_device

ensure_device()
# Tap "Wait" button on dialog
adb_cmd(["shell", "input", "tap", "350", "565"])
time.sleep(2)

# Also ensure app is in foreground
adb_cmd(["shell", "am", "start", "-n", "ai.openverse.mobile.debug/ai.openverse.mobile.MainActivity"])
time.sleep(2)

# Screenshot
adb_cmd(["shell", "screencap", "-p", "/data/local/tmp/screen_after_dialog.png"])
out_png = r"C:\Users\nares\.gemini\antigravity\brain\93ce855d-86e9-462b-9f77-f7705c0157af\screen_after_dialog.png"
ADB = r"C:\Users\nares\AppData\Local\Android\Sdk\platform-tools\adb.exe"
subprocess.run([ADB, "-s", "emulator-5554", "pull", "/data/local/tmp/screen_after_dialog.png", out_png], capture_output=True)
print("Screenshot captured successfully to:", out_png, flush=True)

