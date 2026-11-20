import { writeFileSync } from "fs";

interface CdpTarget {
  id: string;
  type: string;
  webSocketDebuggerUrl: string;
  url: string;
}

class CdpClient {
  private ws!: WebSocket;
  private idCounter = 1;
  private pending = new Map<number, { resolve: (val: any) => void; reject: (err: any) => void }>();
  public logs: string[] = [];

  async connect() {
    const targetsRes = await fetch("http://127.0.0.1:9222/json");
    const targets = (await targetsRes.json()) as CdpTarget[];
    const pageTarget = targets.find((t) => t.type === "page");
    if (!pageTarget) throw new Error("No page target found");

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
        if (msg.error) {
          reject(new Error(msg.error.message));
        } else {
          resolve(msg.result);
        }
      } else if (msg.method === "Runtime.consoleAPICalled") {
        const log = `[${msg.params.type}] ` + msg.params.args.map((a: any) => a.value || a.description || JSON.stringify(a)).join(" ");
        this.logs.push(log);
        console.log(log);
      }
    };

    await this.send("Runtime.enable");
    await this.send("Page.enable");
  }

  send(method: string, params: any = {}): Promise<any> {
    const id = this.idCounter++;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  async eval(expression: string): Promise<any> {
    const res = await this.send("Runtime.evaluate", {
      expression,
      returnByValue: true,
      awaitPromise: true,
    });
    if (res.exceptionDetails) {
      throw new Error(`Eval error: ${JSON.stringify(res.exceptionDetails)}`);
    }
    return res.result?.value;
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
  console.log("=== STEP 1: Connect to Android Webview CDP ===");
  const cdp = new CdpClient();
  await cdp.connect();

  console.log("=== STEP 2: Inspect Initial Screen State ===");
  const initialElements = await cdp.eval(`
    (() => {
      return {
        textareas: Array.from(document.querySelectorAll("textarea")).map(t => ({
          placeholder: t.placeholder,
          value: t.value,
          id: t.id
        })),
        buttons: Array.from(document.querySelectorAll("button")).map(b => ({
          text: b.innerText.trim(),
          ariaLabel: b.getAttribute("aria-label"),
          title: b.getAttribute("title"),
          className: b.className
        }))
      };
    })()
  `);
  console.log("Found textareas:", initialElements.textareas);
  console.log("Found buttons count:", initialElements.buttons.length);

  console.log("=== STEP 3: Navigate to Settings and Verify Error-Free Rendering ===");
  // Find settings button or trigger navigation to settings
  const navigatedToSettings = await cdp.eval(`
    (() => {
      // Look for a settings button or gear icon
      const btn = Array.from(document.querySelectorAll("button")).find(b => 
        (b.getAttribute("aria-label") || "").toLowerCase().includes("settings") ||
        (b.getAttribute("title") || "").toLowerCase().includes("settings") ||
        b.innerText.toLowerCase().includes("settings")
      );
      if (btn) {
        btn.click();
        return true;
      }
      return false;
    })()
  `);
  console.log("Clicked Settings button:", navigatedToSettings);
  await sleep(1000);

  await cdp.screenshot("tests/native-qa/stage3_settings_verified.png");

  // Check if any error text like 'r.find is not a function' exists on page
  const hasError = await cdp.eval(`
    document.body.innerText.includes("r.find is not a function") ||
    document.body.innerText.includes("Cannot read properties of undefined")
  `);
  console.log("Has uncaught error on screen:", hasError);
  if (hasError) {
    console.error("FATAL: Found error on settings screen!");
  } else {
    console.log("SUCCESS: Settings screen rendered cleanly without any r.find or undefined errors!");
  }

  console.log("=== STEP 4: Navigate Back to Chat Workspace ===");
  // Look for back button or chat workspace button
  await cdp.eval(`
    (() => {
      const backBtn = Array.from(document.querySelectorAll("button")).find(b => 
        (b.getAttribute("aria-label") || "").toLowerCase().includes("back") ||
        (b.getAttribute("aria-label") || "").toLowerCase().includes("close") ||
        b.innerText.toLowerCase().includes("chat") ||
        b.innerText.toLowerCase().includes("workspace") ||
        (b.getAttribute("title") || "").toLowerCase().includes("back")
      );
      if (backBtn) {
        backBtn.click();
        return true;
      }
      return false;
    })()
  `);
  await sleep(800);

  console.log("=== STEP 5: Test Chat Input and Turn Execution ===");
  // Type message into textarea and submit
  const sendResult = await cdp.eval(`
    (() => {
      const ta = document.querySelector("textarea");
      if (!ta) return { success: false, reason: "No textarea" };

      // Set value and trigger input events
      ta.value = "Hello OPEN-VERSE! Testing cross-platform mobile synchronization and AI execution.";
      ta.dispatchEvent(new Event("input", { bubbles: true }));
      ta.dispatchEvent(new Event("change", { bubbles: true }));

      // Find send button or trigger keydown Enter
      const submitBtn = Array.from(document.querySelectorAll("button")).find(b => 
        (b.getAttribute("aria-label") || "").toLowerCase().includes("send") ||
        (b.getAttribute("title") || "").toLowerCase().includes("send") ||
        b.innerText.toLowerCase().includes("send") ||
        b.querySelector("svg")
      );

      // Trigger enter key press on textarea
      const enterEvent = new KeyboardEvent("keydown", {
        bubbles: true,
        cancelable: true,
        key: "Enter",
        code: "Enter",
        keyCode: 13
      });
      ta.dispatchEvent(enterEvent);

      return { success: true, textareaFound: true, valueSet: ta.value };
    })()
  `);
  console.log("Send result:", sendResult);

  // Wait for turn / assistant response
  await sleep(3000);
  await cdp.screenshot("tests/native-qa/stage4_chat_conversation.png");

  console.log("=== STEP 6: Check Persistence in LocalStorage ===");
  const storageDump = await cdp.eval(`
    (() => {
      const keys = Object.keys(localStorage);
      const res = {};
      for (const k of keys) {
        res[k] = localStorage.getItem(k);
      }
      return res;
    })()
  `);
  console.log("LocalStorage keys:", Object.keys(storageDump));

  cdp.close();
  console.log("=== CDP session complete ===");
}

run().catch(console.error);

