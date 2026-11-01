import subprocess
import time
import sys

ADB = r"C:\Users\nares\AppData\Local\Android\Sdk\platform-tools\adb.exe"

def ensure_device():
    for _ in range(15):
        res = subprocess.run([ADB, "devices"], capture_output=True, text=True)
        if "emulator-5554\tdevice" in res.stdout:
            return True
        time.sleep(0.5)
    return False

def adb_cmd(args):
    ensure_device()
    return subprocess.run([ADB, "-s", "emulator-5554"] + args, capture_output=True, text=True)

if __name__ == "__main__":
    ensure_device()
    res = adb_cmd(sys.argv[1:])
    sys.stdout.write(res.stdout)
    sys.stderr.write(res.stderr)
    sys.exit(res.returncode)

