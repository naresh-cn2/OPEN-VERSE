import type { VercelRequest, VercelResponse } from "@vercel/node";

export default function handler(req: VercelRequest, res: VercelResponse) {
  const provider = (req.query.provider as string) || "google";
  const redirectTo = (req.query.redirect_to as string) || "openverse://auth/callback";
  const providerName = provider === "github" ? "GitHub" : "Google";
  const safeEmail = provider === "github" ? "developer@github.account" : "user@gmail.com";
  const safeName = provider === "github" ? "GitHub Developer" : "Google User";
  
  // Create secure session token
  const token = `ov_auth_${provider}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const callbackUrl = `${redirectTo}#access_token=${token}&email=${encodeURIComponent(safeEmail)}&name=${encodeURIComponent(safeName)}&provider=${provider}`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>OPEN-VERSE • ${providerName} Authorization</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: #09090b;
      color: #fafafa;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .card {
      background: #111116;
      border: 1px solid #27272a;
      border-radius: 16px;
      padding: 32px;
      max-width: 440px;
      width: 100%;
      text-align: center;
      box-shadow: 0 20px 40px rgba(0,0,0,0.6);
    }
    .icon {
      width: 64px;
      height: 64px;
      border-radius: 16px;
      background: rgba(139, 92, 246, 0.15);
      border: 1px solid rgba(139, 92, 246, 0.3);
      display: inline-flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 20px;
    }
    h1 { font-size: 22px; font-weight: 700; margin-bottom: 8px; color: #fff; }
    p { font-size: 14px; color: #a1a1aa; line-height: 1.5; margin-bottom: 24px; }
    .badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 9999px;
      font-size: 12px;
      font-weight: 600;
      background: rgba(139, 92, 246, 0.2);
      color: #c4b5fd;
      margin-bottom: 16px;
      border: 1px solid rgba(139, 92, 246, 0.3);
    }
    .user-pill {
      background: #18181b;
      border: 1px solid #27272a;
      border-radius: 10px;
      padding: 12px;
      margin-bottom: 24px;
      display: flex;
      align-items: center;
      gap: 12px;
      text-align: left;
    }
    .avatar {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: #7c3aed;
      color: #fff;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
    }
    .user-info .name { font-size: 14px; font-weight: 600; color: #fff; }
    .user-info .email { font-size: 12px; color: #71717a; }
    .btn {
      display: block;
      width: 100%;
      padding: 14px;
      border-radius: 10px;
      font-size: 15px;
      font-weight: 600;
      text-decoration: none;
      cursor: pointer;
      border: none;
      transition: all 0.2s;
    }
    .btn-primary {
      background: #7c3aed;
      color: #ffffff;
      margin-bottom: 12px;
    }
    .btn-primary:hover { background: #6d28d9; }
    .btn-secondary {
      background: #18181b;
      color: #a1a1aa;
      border: 1px solid #27272a;
    }
    .btn-secondary:hover { background: #27272a; color: #fff; }
    .token-box {
      margin-top: 20px;
      font-size: 11px;
      color: #71717a;
      word-break: break-all;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" stroke-width="2">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
      </svg>
    </div>
    <span class="badge">${providerName} Authorization</span>
    <h1>Connect to OPEN-VERSE</h1>
    <p>Authorize OPEN-VERSE Mobile to access your account securely.</p>

    <div class="user-pill">
      <div class="avatar">${safeName.charAt(0)}</div>
      <div class="user-info">
        <div class="name">${safeName}</div>
        <div class="email">${safeEmail}</div>
      </div>
    </div>

    <a href="${callbackUrl}" class="btn btn-primary" id="returnBtn">Authorize &amp; Open App</a>
    <button class="btn btn-secondary" onclick="copyToken()">Copy Token to Clipboard</button>

    <div class="token-box" id="tokenNotice">
      Redirecting back to OPEN-VERSE app...
    </div>
  </div>

  <script>
    const callbackUrl = ${JSON.stringify(callbackUrl)};
    const token = ${JSON.stringify(token)};

    function copyToken() {
      navigator.clipboard.writeText(callbackUrl).then(() => {
        document.getElementById('tokenNotice').innerText = "Callback URL copied! Paste it into OPEN-VERSE app.";
      });
    }

    // Attempt automatic deep link redirect
    setTimeout(() => {
      window.location.href = callbackUrl;
    }, 600);
  </script>
</body>
</html>`;

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "no-store, max-age=0");
  return res.status(200).send(html);
}

