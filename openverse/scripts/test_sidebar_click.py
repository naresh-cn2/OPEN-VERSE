import subprocess
import time
import os
import sys

sys.path.insert(0, r"C:\Users\nares\Workspace\OPEN-VERSE\OPEN-VERSE\scripts")
from adb_helper import adb_cmd, ensure_device

ensure_device()

ARTIFACT_DIR = r"C:\Users\nares\.gemini\antigravity\brain\93ce855d-86e9-462b-9f77-f7705c0157af"
ADB = r"C:\Users\nares\AppData\Local\Android\Sdk\platform-tools\adb.exe"

print("Tapping top split icon at (214, 90)...", flush=True)
adb_cmd(["shell", "input", "tap", "214", "90"])
time.sleep(1.5)

adb_cmd(["shell", "screencap", "-p", "/data/local/tmp/screen_split.png"])
out = os.path.join(ARTIFACT_DIR, "screen_split_tap.png")
subprocess.run([ADB, "-s", "emulator-5554", "pull", "/data/local/tmp/screen_split.png", out], capture_output=True)
print("Saved to:", out, flush=True)

