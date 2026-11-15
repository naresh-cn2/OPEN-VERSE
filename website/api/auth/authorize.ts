import type { VercelRequest, VercelResponse } from "@vercel/node";

/**
 * OPEN-VERSE Identity Service - OAuth Authorize Gateway
 *
 * Checks if production provider OAuth credentials (Google / GitHub) are configured.
 * - If configured: redirects user directly to real Google / GitHub OAuth authorization endpoint.
 * - If unconfigured (preview/sandbox mode): provides clear sandbox authorization UI.
 */

const DEFAULT_GOOGLE_CLIENT_ID =
  "764086051850-6qr4p6gpi6hn506pt8ejuq83di341hur.apps.googleusercontent.com";
const CANONICAL_CALLBACK_URL =
  "https://open-verse-website.vercel.app/api/auth/callback";

export default function handler(req: VercelRequest, res: VercelResponse) {
  const provider = (req.query.provider as string) || "google";
  const redirectTo = (req.query.redirect_to as string) || "openverse://auth/callback";

  // Google OAuth redirect_uri MUST strictly match registered URIs verbatim without extra query params
  const callbackUrl = CANONICAL_CALLBACK_URL;

  const clientId =
    (req.query.client_id as string) ||
    (process.env.GOOGLE_CLIENT_ID || "").trim() ||
    DEFAULT_GOOGLE_CLIENT_ID;
  const isGoogleConfigured = Boolean(clientId);
  const isGithubConfigured = Boolean(process.env.GITHUB_CLIENT_ID);

  // Encode provider and redirect target safely in state
  const statePayload = Buffer.from(
    JSON.stringify({
      provider,
      redirectTo,
      nonce: `nonce_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    })
  ).toString("base64url");

  // 1. Real Google OAuth redirect if credentials are configured
  if (provider === "google" && isGoogleConfigured) {
    const googleAuthUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
    googleAuthUrl.searchParams.set("client_id", clientId);
    googleAuthUrl.searchParams.set("redirect_uri", callbackUrl);
    googleAuthUrl.searchParams.set("response_type", "code");
    googleAuthUrl.searchParams.set("scope", "openid email profile");
    googleAuthUrl.searchParams.set("access_type", "offline");
    googleAuthUrl.searchParams.set("prompt", "select_account");
    googleAuthUrl.searchParams.set("state", statePayload);

    res.setHeader("Location", googleAuthUrl.toString());
    return res.status(302).end();
  }

  // 2. Real GitHub OAuth redirect if credentials are configured
  if (provider === "github" && isGithubConfigured) {
    const githubAuthUrl = new URL("https://github.com/login/oauth/authorize");
    githubAuthUrl.searchParams.set("client_id", process.env.GITHUB_CLIENT_ID!);
    githubAuthUrl.searchParams.set("redirect_uri", callbackUrl);
    githubAuthUrl.searchParams.set("scope", "read:user user:email");
    githubAuthUrl.searchParams.set("state", statePayload);

    res.setHeader("Location", githubAuthUrl.toString());
    return res.status(302).end();
  }

  // 3. Fallback / Sandbox Authorization Interface (when OAuth secrets are not yet configured in Vercel environment)
  const providerName = provider === "github" ? "GitHub" : "Google";
  const safeEmail = provider === "github" ? "developer@github.account" : "user@gmail.com";
  const safeName = provider === "github" ? "GitHub Developer" : "Google User";
  
  const token = `ov_sandbox_${provider}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const deepLinkCallback = `${redirectTo}#access_token=${token}&email=${encodeURIComponent(safeEmail)}&name=${encodeURIComponent(safeName)}&provider=${provider}`;

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
      font-weight: 500;
      background: rgba(234, 179, 8, 0.15);
      color: #eab308;
      border: 1px solid rgba(234, 179, 8, 0.3);
      margin-bottom: 20px;
    }
    .btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 100%;
      padding: 14px 20px;
      border-radius: 12px;
      font-size: 15px;
      font-weight: 600;
      text-decoration: none;
      transition: all 0.2s ease;
      cursor: pointer;
      border: none;
    }
    .btn-primary {
      background: #7c3aed;
      color: #ffffff;
      margin-bottom: 12px;
    }
    .btn-primary:hover {
      background: #6d28d9;
      transform: translateY(-1px);
    }
    .footnote {
      font-size: 12px;
      color: #71717a;
      margin-top: 16px;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
      </svg>
    </div>
    <div class="badge">Development / Sandbox Gateway</div>
    <h1>Connect with ${providerName}</h1>
    <p>You are authorizing OPEN-VERSE access to authenticate your profile with safe sandboxed credentials.</p>
    
    <a href="${deepLinkCallback}" class="btn btn-primary" id="launch-btn">Authorize & Launch OPEN-VERSE</a>

    <div class="footnote">
      If OPEN-VERSE doesn't open automatically, click the button above.
    </div>
  </div>

  <script>
    // Auto-launch deep link on page load
    setTimeout(function() {
      window.location.href = ${JSON.stringify(deepLinkCallback)};
    }, 400);
  </script>
</body>
</html>`;

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  return res.status(200).send(html);
}
