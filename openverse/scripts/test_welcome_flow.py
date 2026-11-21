import sys
sys.path.insert(0, r"C:\Users\nares\Workspace\OPEN-VERSE\OPEN-VERSE\scripts")
from adb_helper import adb_cmd
import time

print("1. Tapping Wait at (540, 1358)...")
adb_cmd(["shell", "input", "tap", "540", "1358"])
time.sleep(1)

print("2. Tapping Continue in Offline / Local Mode at (540, 1460)...")
adb_cmd(["shell", "input", "tap", "540", "1460"])
time.sleep(3)

print("3. Capturing screenshot...")
adb_cmd(["shell", "screencap", "-p", "/data/local/tmp/step04_workspace.png"])
adb_cmd(["pull", "/data/local/tmp/step04_workspace.png", r"C:\Users\nares\.gemini\antigravity\brain\93ce855d-86e9-462b-9f77-f7705c0157af\step04_workspace.png"])
print("Captured step04_workspace.png")

