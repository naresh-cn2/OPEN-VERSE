import subprocess
import time
import os
import sys

sys.path.insert(0, r"C:\Users\nares\Workspace\OPEN-VERSE\OPEN-VERSE\scripts")
from adb_helper import adb_cmd, ensure_device

ensure_device()
adb_cmd(["shell", "input", "tap", "350", "1360"])
time.sleep(1)
adb_cmd(["shell", "screencap", "-p", "/data/local/tmp/screen_clean.png"])
out_png = r"C:\Users\nares\.gemini\antigravity\brain\93ce855d-86e9-462b-9f77-f7705c0157af\screen_clean.png"
ADB = r"C:\Users\nares\AppData\Local\Android\Sdk\platform-tools\adb.exe"
subprocess.run([ADB, "-s", "emulator-5554", "pull", "/data/local/tmp/screen_clean.png", out_png], capture_output=True)
print("Screen clean saved to:", out_png, flush=True)

