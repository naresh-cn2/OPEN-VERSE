import { writeFileSync } from "fs";

async function main() {
  const targetsRes = await fetch("http://127.0.0.1:9222/json");
  const targets = (await targetsRes.json()) as any[];
  const pageTarget = targets.find((t) => t.type === "page");
  if (!pageTarget) {
    console.error("No page target found");
    process.exit(1);
  }
  console.log("Connecting to:", pageTarget.webSocketDebuggerUrl);

  const ws = new WebSocket(pageTarget.webSocketDebuggerUrl);

  let idCounter = 1;
  const pending = new Map<number, { resolve: (val: any) => void; reject: (err: any) => void }>();

  function sendCommand(method: string, params: any = {}): Promise<any> {
    const id = idCounter++;
    return new Promise((resolve, reject) => {
      pending.set(id, { resolve, reject });
      ws.send(JSON.stringify({ id, method, params }));
    });
  }

  await new Promise<void>((resolve, reject) => {
    ws.onopen = () => resolve();
    ws.onerror = (e) => reject(e);
  });

  ws.onmessage = (event) => {
    const msg = JSON.parse(event.data.toString());
    if (msg.id && pending.has(msg.id)) {
      const { resolve, reject } = pending.get(msg.id)!;
      pending.delete(msg.id);
      if (msg.error) {
        reject(new Error(msg.error.message));
      } else {
        resolve(msg.result);
      }
    }
  };

  await sendCommand("Runtime.enable");
  await sendCommand("Page.enable");

  const titleRes = await sendCommand("Runtime.evaluate", {
    expression: "document.title",
  });
  console.log("Document Title:", titleRes.result?.value);

  const innerTextRes = await sendCommand("Runtime.evaluate", {
    expression: "document.body.innerText.slice(0, 500)",
  });
  console.log("Body text snippet after relaunch:\n", innerTextRes.result?.value);

  const lsRes = await sendCommand("Runtime.evaluate", {
    expression: "JSON.stringify(Object.keys(localStorage))",
  });
  console.log("Persisted LocalStorage keys:\n", lsRes.result?.value);

  // Take screenshot
  const screenshotRes = await sendCommand("Page.captureScreenshot", { format: "png" });
  if (screenshotRes.data) {
    const buffer = Buffer.from(screenshotRes.data, "base64");
    writeFileSync("tests/native-qa/stage5_relaunch_persistence.png", buffer);
    console.log("Saved screenshot to tests/native-qa/stage5_relaunch_persistence.png");
  }

  ws.close();
}

main().catch(console.error);
