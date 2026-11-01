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

# Launch
print("Bringing OPEN-VERSE to foreground...", flush=True)
adb_cmd(["shell", "am", "start", "-n", "ai.openverse.mobile.debug/ai.openverse.mobile.MainActivity"])
time.sleep(2)

capture("final_01_workspace_clean")

# Dump UI to inspect WebView bounds
adb_cmd(["shell", "uiautomator", "dump", "/data/local/tmp/app_wv.xml"])
dump_res = subprocess.run([ADB, "-s", "emulator-5554", "exec-out", "cat", "/data/local/tmp/app_wv.xml"], capture_output=True, text=True)
print("Dump contains 'OPEN - VERSE':", "OPEN - VERSE" in dump_res.stdout)
for line in dump_res.stdout.split("><"):
    if "bounds=" in line and ("button" in line.lower() or "text=" in line.lower() or "view" in line.lower()):
        # print interesting elements
        if any(w in line for w in ["Chat", "Connect", "model", "OPEN"]):
            print("Element:", line[:150])

# Tap sidebar button next to Chat: bounds from previous dump were [28,740][96,812] or similar
print("Tapping sidebar button...", flush=True)
adb_cmd(["shell", "input", "tap", "75", "780"])
time.sleep(1.5)
capture("final_02_sidebar_open")

# Tap Settings or Models in sidebar
# In desktop/mobile sidebar, settings is usually at the bottom left or top
# Let's tap the main chat area to close sidebar (tap at 800, 1000)
print("Tapping backdrop to close sidebar...", flush=True)
adb_cmd(["shell", "input", "tap", "800", "1000"])
time.sleep(1.5)
capture("final_03_sidebar_closed")

# Focus chat input and type
print("Focusing chat input...", flush=True)
adb_cmd(["shell", "input", "tap", "400", "1300"])
time.sleep(1)
adb_cmd(["shell", "input", "text", "Build\\ and\\ run\\ OPEN-VERSE\\ cross-platform"])
time.sleep(1)
capture("final_04_chat_input_filled")

print("Full demonstration executed successfully!", flush=True)
