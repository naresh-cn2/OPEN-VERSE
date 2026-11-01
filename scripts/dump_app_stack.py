import sys
sys.path.insert(0, r"C:\Users\nares\Workspace\OPEN-VERSE\OPEN-VERSE\scripts")
from adb_helper import adb_cmd
import time

adb_cmd(["root"])
time.sleep(1)

pid_res = adb_cmd(["shell", "pidof", "ai.openverse.mobile.debug"])
pid = pid_res.stdout.strip()
print("App PID:", pid)

if pid:
    adb_cmd(["shell", "su", "0", "kill", "-3", pid])
    time.sleep(2)
    traces = adb_cmd(["shell", "su", "0", "ls", "-t", "/data/anr/"])
    first_trace = traces.stdout.splitlines()[0].strip()
    print("Latest trace file:", first_trace)
    content = adb_cmd(["shell", "su", "0", "head", "-n", "80", f"/data/anr/{first_trace}"])
    print("Trace content:")
    print(content.stdout)

