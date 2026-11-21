import { spawnSync } from "node:child_process";

const ADB = "C:\\Users\\nares\\AppData\\Local\\Android\\Sdk\\platform-tools\\adb.exe";

// Wait for device
for (let i = 0; i < 15; i++) {
  const devs = spawnSync(ADB, ["devices"], { encoding: "utf-8" }).stdout;
  if (devs.includes("emulator-5554\tdevice")) break;
  spawnSync("powershell", ["-Command", "Start-Sleep -Milliseconds 500"]);
}

// Get webview unix socket
const unixSocketRes = spawnSync(ADB, ["-s", "emulator-5554", "shell", "grep devtools_remote /proc/net/unix"], { encoding: "utf-8" });
const match = unixSocketRes.stdout.match(/@(webview_devtools_remote_\d+)/);
if (!match) {
  console.error("No webview devtools socket found:", unixSocketRes.stdout, unixSocketRes.stderr);
  process.exit(1);
}
const socketName = match[1];
console.log("Found socket:", socketName);

spawnSync(ADB, ["-s", "emulator-5554", "forward", "tcp:9222", `localabstract:${socketName}`], { encoding: "utf-8" });

const resp = await fetch("http://127.0.0.1:9222/json");
const targets = await resp.json();
const wsUrl = targets[0].webSocketDebuggerUrl;

const ws = new WebSocket(wsUrl);

ws.onopen = () => {
  const expr = process.argv[2] || "document.body.innerText";
  ws.send(JSON.stringify({
    id: 1,
    method: "Runtime.evaluate",
    params: {
      expression: expr,
      returnByValue: true,
      awaitPromise: true,
    }
  }));
};

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  if (data.id === 1) {
    console.log("EVAL RESULT:\n", data.result?.result?.value);
    ws.close();
    process.exit(0);
  }
};
