import sys
sys.path.insert(0, r"C:\Users\nares\Workspace\OPEN-VERSE\OPEN-VERSE\scripts")
from adb_helper import adb_cmd
import urllib.request
import json
import time

# Forward devtools port
adb_cmd(["forward", "tcp:9222", "localabstract:webview_devtools_remote_11161"])
time.sleep(1)

# Query /json
try:
    with urllib.request.urlopen("http://127.0.0.1:9222/json", timeout=5) as resp:
        targets = json.loads(resp.read().decode())
        print(f"Targets ({len(targets)}):")
        for t in targets:
            print("Target:", t.get("title"), t.get("url"), t.get("webSocketDebuggerUrl"))
except Exception as e:
    print("Error querying devtools:", e)

