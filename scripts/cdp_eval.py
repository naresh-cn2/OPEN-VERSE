import sys
import json
import urllib.request
import asyncio

async def eval_js(expression):
    import websockets
    # Get debugger url
    with urllib.request.urlopen("http://127.0.0.1:9222/json") as resp:
        targets = json.loads(resp.read().decode())
        ws_url = targets[0]["webSocketDebuggerUrl"]

    async with websockets.connect(ws_url) as ws:
        msg = {
            "id": 1,
            "method": "Runtime.evaluate",
            "params": {
                "expression": expression,
                "returnByValue": True,
                "awaitPromise": True
            }
        }
        await ws.send(json.dumps(msg))
        resp = await ws.recv()
        result = json.loads(resp)
        return result.get("result", {}).get("result", {}).get("value")

if __name__ == "__main__":
    expr = sys.argv[1] if len(sys.argv) > 1 else "document.body.innerText"
    try:
        val = asyncio.run(eval_js(expr))
        print("RESULT:", val)
    except Exception as e:
        print("ERROR:", e)

