/**
 * Automated Live Android Form-Factor & Resolution Testing
 * Tests Standard Phone (1080x2400), Tablet (2560x1600), and Compact Phone (720x1600)
 */

import { execSync } from "child_process";
import { writeFileSync } from "fs";

interface CdpTarget {
  id: string;
  type: string;
  webSocketDebuggerUrl: string;
}

class AndroidDevTools {
  private ws!: WebSocket;
  private idCounter = 1;
  private pending = new Map<number, { resolve: (val: any) => void; reject: (err: any) => void }>();

  async connect() {
    const res = await fetch("http://127.0.0.1:9222/json");
    const targets = (await res.json()) as CdpTarget[];
    const pageTarget = targets.find((t) => t.type === "page");
    if (!pageTarget) throw new Error("No page target found on Android DevTools");

    this.ws = new WebSocket(pageTarget.webSocketDebuggerUrl);
    await new Promise<void>((resolve, reject) => {
      this.ws.onopen = () => resolve();
      this.ws.onerror = (e) => reject(e);
    });

    this.ws.onmessage = (event) => {
      const msg = JSON.parse(event.data.toString());
      if (msg.id && this.pending.has(msg.id)) {
        const { resolve, reject } = this.pending.get(msg.id)!;
        this.pending.delete(msg.id);
        if (msg.error) reject(new Error(msg.error.message));
        else resolve(msg.result);
      }
    };
  }

  send(method: string, params: any = {}): Promise<any> {
    const id = this.idCounter++;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  async screenshot(path: string) {
    const res = await this.send("Page.captureScreenshot", { format: "png" });
    if (res.data) {
      writeFileSync(path, Buffer.from(res.data, "base64"));
      console.log(`Saved screenshot: ${path}`);
    }
  }

  close() {
    this.ws.close();
  }
}

async function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function run() {
  console.log("=== Testing Android Live Form Factors & Resolutions ===");

  const devtools = new AndroidDevTools();
  await devtools.connect();

  const profiles = [
    { name: "Standard Phone", size: "1080x2400", density: "420", output: "tests/native-qa/formfactor_phone_1080x2400.png" },
    { name: "Android Tablet", size: "2560x1600", density: "320", output: "tests/native-qa/formfactor_tablet_2560x1600.png" },
    { name: "Compact Phone", size: "720x1600", density: "280", output: "tests/native-qa/formfactor_compact_720x1600.png" },
  ];

  for (const p of profiles) {
    console.log(`\nTesting Profile: ${p.name} (${p.size} @ ${p.density}dpi)...`);
    execSync(`adb shell wm size ${p.size}`);
    execSync(`adb shell wm density ${p.density}`);
    await sleep(2500);

    // Verify window dimensions inside webview
    const viewport = await devtools.send("Runtime.evaluate", {
      expression: "({ width: window.innerWidth, height: window.innerHeight, dpr: window.devicePixelRatio })",
      returnByValue: true,
    });
    console.log(`- Webview Viewport: ${viewport.result?.value?.width}x${viewport.result?.value?.height} (DPR: ${viewport.result?.value?.dpr})`);

    await devtools.screenshot(p.output);
  }

  // Reset back to original native resolution
  console.log("\nResetting device display back to native default...");
  execSync("adb shell wm size reset");
  execSync("adb shell wm density reset");
  await sleep(1500);

  devtools.close();
  console.log("=== All Android Form-Factor Tests Complete! ===");
}

run().catch(console.error);

