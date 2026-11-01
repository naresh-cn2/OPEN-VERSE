import subprocess
import time
import os
import sys

sys.path.insert(0, r"C:\Users\nares\Workspace\OPEN-VERSE\OPEN-VERSE\scripts")
from adb_helper import adb_cmd, ensure_device

ensure_device()

ARTIFACT_DIR = r"C:\Users\nares\.gemini\antigravity\brain\93ce855d-86e9-462b-9f77-f7705c0157af"
ADB = r"C:\Users\nares\AppData\Local\Android\Sdk\platform-tools\adb.exe"

url = "https://github.com/naresh-cn2/OPEN-VERSE/releases/download/v0.2.0/open-verse-mobile.apk"

print("1. Opening URL in Chrome...", flush=True)
adb_cmd(["shell", "am", "start", "-a", "android.intent.action.VIEW", "-d", url, "com.android.chrome"])
time.sleep(6)

print("2. Capturing Chrome screenshot...", flush=True)
adb_cmd(["shell", "screencap", "-p", "/data/local/tmp/chrome_download.png"])
out_png = os.path.join(ARTIFACT_DIR, "chrome_download_screen.png")
subprocess.run([ADB, "-s", "emulator-5554", "pull", "/data/local/tmp/chrome_download.png", out_png], capture_output=True)
print("Screenshot saved to:", out_png, flush=True)

print("3. Dumping UI...", flush=True)
adb_cmd(["shell", "uiautomator", "dump", "/data/local/tmp/chrome_ui.xml"])
res = subprocess.run([ADB, "-s", "emulator-5554", "exec-out", "cat", "/data/local/tmp/chrome_ui.xml"], capture_output=True, text=True)
for line in res.stdout.split("><"):
    if any(k in line.lower() for k in ["download", "harmful", "keep", "cancel", "detail", "file", "open"]):
        print(line[:140], flush=True)
