import subprocess
import time

ADB = r"C:\Users\nares\AppData\Local\Android\Sdk\platform-tools\adb.exe"

def ensure_device():
    for _ in range(15):
        res = subprocess.run([ADB, "devices"], capture_output=True, text=True)
        if "emulator-5554\tdevice" in res.stdout:
            return True
        time.sleep(0.5)
    return False

def run_adb(args):
    ensure_device()
    return subprocess.run([ADB, "-s", "emulator-5554"] + args, capture_output=True, text=True)

# Tap 'Wait' on the ANR dialog (around x=400, y=1350)
# Look at the screenshot: the dialog center is around y=1200.
# The 'Close app' row is around y=1100-1150.
# The 'Wait' row is around y=1330-1370!
print("Tapping 'Wait' (400, 1360)...")
run_adb(["shell", "input", "tap", "400", "1360"])
time.sleep(2)

# Screencap after dismissing dialog
run_adb(["shell", "screencap", "-p", "/data/local/tmp/screen_dismissed.png"])
run_adb(["pull", "/data/local/tmp/screen_dismissed.png", r"C:\Users\nares\.gemini\antigravity\brain\93ce855d-86e9-462b-9f77-f7705c0157af\screen_dismissed.png"])

# Tap 'Offline & Local Mode' at (540, 1710)
print("Tapping 'Offline & Local Mode' (540, 1710)...")
run_adb(["shell", "input", "tap", "540", "1710"])
time.sleep(3)

# Screencap after local mode
run_adb(["shell", "screencap", "-p", "/data/local/tmp/screen_workspace.png"])
run_adb(["pull", "/data/local/tmp/screen_workspace.png", r"C:\Users\nares\.gemini\antigravity\brain\93ce855d-86e9-462b-9f77-f7705c0157af\screen_workspace.png"])
print("Done!")
