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

# 1. Capture clean home
print("Step 1: Clean workspace", flush=True)
capture("native_step01_workspace")

# 2. Tap "Connect a model" button at (250, 1065)
print("Step 2: Tap Connect a model", flush=True)
adb_cmd(["shell", "input", "tap", "250", "1065"])
time.sleep(2)
capture("native_step02_connect_model_modal")

# 3. Dismiss modal or go back
print("Step 3: Dismiss modal with Back key", flush=True)
adb_cmd(["shell", "input", "keyevent", "4"])
time.sleep(1.5)
capture("native_step03_modal_dismissed")

# 4. Tap Sidebar toggle at (75, 780)
print("Step 4: Tap Sidebar toggle", flush=True)
adb_cmd(["shell", "input", "tap", "75", "780"])
time.sleep(1.5)
capture("native_step04_sidebar_opened")

# 5. Tap Sidebar toggle at (214, 90) or close
print("Step 5: Tap top sidebar toggle to close", flush=True)
adb_cmd(["shell", "input", "tap", "214", "90"])
time.sleep(1.5)
capture("native_step05_sidebar_closed")

# 6. Tap Chat input at (350, 1300) and type message
print("Step 6: Focus chat input and type message", flush=True)
adb_cmd(["shell", "input", "tap", "350", "1300"])
time.sleep(1)
adb_cmd(["shell", "input", "text", "What\\ are\\ the\\ key\\ features\\ of\\ OPEN-VERSE?"])
time.sleep(1)
capture("native_step06_chat_typed")

# 7. Tap Send button at (900, 1480)
print("Step 7: Tap Send button", flush=True)
adb_cmd(["shell", "input", "tap", "900", "1480"])
time.sleep(2)
capture("native_step07_chat_sent")

print("All native verification steps completed successfully!", flush=True)

