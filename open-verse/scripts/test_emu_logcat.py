import subprocess
import time
import sys

ADB = r"C:\Users\nares\AppData\Local\Android\Sdk\platform-tools\adb.exe"

def run_adb(args, timeout=15):
    res = subprocess.run([ADB, "-s", "emulator-5554"] + args, capture_output=True, text=True, timeout=timeout)
    return res.stdout, res.stderr

print("Checking device...")
# start server and wait
subprocess.run([ADB, "start-server"], capture_output=True)
for i in range(10):
    out, _ = run_adb(["devices"])
    if "emulator-5554\tdevice" in out:
        print("Device connected!")
        break
    time.sleep(1)

# Clear logcat
run_adb(["logcat", "-c"])

# Dismiss any ANR dialog with tap or keyevent
run_adb(["shell", "input", "keyevent", "KEYCODE_BACK"])
run_adb(["shell", "input", "keyevent", "KEYCODE_BACK"])

# Start activity
print("Starting activity...")
out, err = run_adb(["shell", "am", "start", "-a", "android.intent.action.MAIN", "-c", "android.intent.category.LAUNCHER", "-n", "ai.openverse.mobile.debug/ai.openverse.mobile.MainActivity"])
print("am start:", out, err)

# Wait 5 seconds
time.sleep(5)

# Dump logcat
print("Dumping logcat...")
out, _ = run_adb(["logcat", "-d"])
lines = out.splitlines()

print(f"Total logcat lines: {len(lines)}")
# Filter for OPEN-VERSE or chromium or Console or error
interesting = [l for l in lines if any(k in l for k in ["OPEN-VERSE", "chromium", "Console", "FATAL", "AndroidRuntime", "System.err"])]
print(f"Found {len(interesting)} interesting lines:")
for l in interesting[-60:]:
    print(l)

# Screencap
run_adb(["shell", "screencap", "-p", "/data/local/tmp/emu_live.png"])
run_adb(["pull", "/data/local/tmp/emu_live.png", r"C:\Users\nares\.gemini\antigravity\brain\93ce855d-86e9-462b-9f77-f7705c0157af\emu_live.png"])
print("Captured emu_live.png")

