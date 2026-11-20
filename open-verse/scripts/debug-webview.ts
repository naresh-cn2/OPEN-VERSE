import WebSocket from "ws";

async function main() {
  const tabsRes = await fetch("http://localhost:9222/json");
  const tabs = await tabsRes.json();
  const pageTab = tabs.find((t: any) => t.type === "page");
  const ws = new WebSocket(pageTab.webSocketDebuggerUrl);

  function send(method: string, params: any): Promise<any> {
    return new Promise((resolve) => {
      const id = Math.floor(Math.random() * 1000000);
      const onMsg = (data: any) => {
        const msg = JSON.parse(data.toString());
        if (msg.id === id) {
          ws.off("message", onMsg);
          resolve(msg.result);
        }
      };
      ws.on("message", onMsg);
      ws.send(JSON.stringify({ id, method, params }));
    });
  }

  ws.on("open", async () => {
    // Let's call the actual checkForUpdateNow or fetch endpoints
    const evalRes = await send("Runtime.evaluate", {
      expression: `
        (async function() {
          const results = {};
          // 1. Test fetching each endpoint from WebView
          const endpoints = [
            "https://open-verse-website.vercel.app/api/releases/latest",
            "https://open-verse-website.vercel.app/open-verse-releases.json",
            "https://raw.githubusercontent.com/naresh-cn2/OPEN-VERSE/main/website/public/open-verse-releases.json"
          ];
          for (const ep of endpoints) {
            try {
              const start = Date.now();
              const r = await fetch(ep, { headers: { Accept: "application/json" }, cache: "no-store" });
              const text = await r.text();
              results[ep] = { ok: r.ok, status: r.status, duration: Date.now() - start, length: text.length, json: JSON.parse(text) };
            } catch (err) {
              results[ep] = { error: err.message || String(err) };
            }
          }

          // 2. Test reading appVersion from AndroidInterface
          results.nativeVersion = window.AndroidInterface?.getAppVersion ? window.AndroidInterface.getAppVersion() : "none";
          results.nativeVersionCode = window.AndroidInterface?.getAppVersionCode ? window.AndroidInterface.getAppVersionCode() : "none";

          return JSON.stringify(results);
        })()
      `,
      awaitPromise: true,
      returnByValue: true
    });

    console.log("Evaluation Results:\n", JSON.parse(evalRes.result.value));
    process.exit(0);
  });
}

main().catch(console.error);
