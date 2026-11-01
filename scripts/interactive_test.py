import subprocess
import time
import os
import sys

sys.path.insert(0, r"C:\Users\nares\Workspace\OPEN-VERSE\OPEN-VERSE\scripts")
from adb_helper import adb_cmd, ensure_device

ensure_device()

ARTIFACT_DIR = r"C:\Users\nares\.gemini\antigravity\brain\93ce855d-86e9-462b-9f77-f7705c0157af"
ADB = r"C:\Users\nares\AppData\Local\Android\Sdk\platform-tools\adb.exe"

def capture(name):
    adb_cmd(["shell", "screencap", "-p", f"/data/local/tmp/{name}.png"])
    out = os.path.join(ARTIFACT_DIR, f"{name}.png")
    subprocess.run([ADB, "-s", "emulator-5554", "pull", f"/data/local/tmp/{name}.png", out], capture_output=True)
    print(f"Captured: {name} -> {out}", flush=True)

# 1. Tap sidebar toggle at (75, 345)
print("Tapping sidebar toggle...", flush=True)
adb_cmd(["shell", "input", "tap", "75", "345"])
time.sleep(1.5)
capture("demo_01_sidebar")

# 2. Close sidebar by tapping toggle again or tap backdrop
print("Tapping sidebar toggle to close...", flush=True)
adb_cmd(["shell", "input", "tap", "75", "345"])
time.sleep(1.5)
capture("demo_02_sidebar_closed")

# 3. Tap "Model settings" button at (530, 500)
print("Tapping Model settings...", flush=True)
adb_cmd(["shell", "input", "tap", "530", "500"])
time.sleep(1.5)
capture("demo_03_model_settings")

# 4. Tap Chat textarea at (400, 600) and type something
print("Tapping chat textarea...", flush=True)
adb_cmd(["shell", "input", "tap", "400", "600"])
time.sleep(1)
adb_cmd(["shell", "input", "text", "Hello\\ from\\ OPEN-VERSE\\ Mobile!"])
time.sleep(1)
capture("demo_04_chat_typing")

print("Interactive test complete!", flush=True)
