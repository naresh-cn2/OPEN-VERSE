import type { VercelRequest, VercelResponse } from "@vercel/node";
import crypto from "node:crypto";

/**
 * OPEN-VERSE Identity Service - OAuth Callback Handler
 *
 * Exchanges authorization code with real Google / GitHub token endpoints,
 * verifies provider identity, and mints an authenticated OPEN-VERSE session token.
 */

const CANONICAL_CALLBACK_URL =
  "https://open-verse-website.vercel.app/api/auth/callback";

const SESSION_SECRET =
  process.env.OPENVERSE_SESSION_SECRET || "openverse-secure-session-key-dev-only";

function mintSessionToken(userId: string, email: string, provider: string): string {
  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
  const payload = Buffer.from(
    JSON.stringify({
      sub: userId,
      email,
      provider,
      iss: "openverse-identity-service",
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600 * 24 * 30, // 30 days
    })
  ).toString("base64url");

  const signature = crypto
    .createHmac("sha256", SESSION_SECRET)
    .update(`${header}.${payload}`)
    .digest("base64url");

  return `${header}.${payload}.${signature}`;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const code = (req.query.code as string) || "";
  const state = (req.query.state as string) || "";

  let provider = (req.query.provider as string) || "google";
  let redirectTo = "openverse://auth/callback";

  // Decode provider and redirectTo from state if packed
  if (state) {
    try {
      const decoded = JSON.parse(Buffer.from(state, "base64url").toString("utf8"));
      if (decoded.provider) provider = decoded.provider;
      if (decoded.redirectTo) redirectTo = decoded.redirectTo;
    } catch {
      if (state.startsWith("gh_")) provider = "github";
    }
  }

  if (!code) {
    return res.status(400).send("Missing authorization code from OAuth provider.");
  }

  let verifiedEmail = "";
  let verifiedName = "";
  let verifiedUserId = "";
  let verifiedPicture = "";
  let verifiedSub = "";

  try {
    if (provider === "google") {
      const clientId = (process.env.GOOGLE_CLIENT_ID || "").trim();
      const clientSecret = (process.env.GOOGLE_CLIENT_SECRET || "").trim();

      if (!clientId || !clientSecret) {
        throw new Error("GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET is not configured on server.");
      }

      // 1. Exchange authorization code for Google tokens
      const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          code,
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uri: CANONICAL_CALLBACK_URL,
          grant_type: "authorization_code",
        }),
      });

      if (!tokenRes.ok) {
        const errBody = await tokenRes.text();
        throw new Error(`Google token exchange failed: ${errBody}`);
      }

      const tokens = await tokenRes.json();

      // 2. Fetch and verify user info with Google access token
      const userRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
        headers: { Authorization: `Bearer ${tokens.access_token}` },
      });

      if (!userRes.ok) {
        throw new Error("Failed to fetch verified user profile from Google.");
      }

      const profile = await userRes.json();
      verifiedEmail = profile.email || "";
      verifiedName = profile.name || profile.given_name || "Google User";
      verifiedSub = profile.sub || "";
      verifiedUserId = `google_${profile.sub}`;
      if (profile.picture && !profile.picture.includes("dicebear.com")) {
        verifiedPicture = profile.picture;
      }
    } else if (provider === "github") {
      const clientId = process.env.GITHUB_CLIENT_ID;
      const clientSecret = process.env.GITHUB_CLIENT_SECRET;

      if (!clientId || !clientSecret) {
        throw new Error("GITHUB_CLIENT_ID or GITHUB_CLIENT_SECRET not configured on server.");
      }

      // 1. Exchange authorization code for GitHub token
      const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          client_id: clientId,
          client_secret: clientSecret,
          code,
        }),
      });

      if (!tokenRes.ok) {
        throw new Error("GitHub token exchange failed.");
      }

      const tokens = await tokenRes.json();
      if (!tokens.access_token) {
        throw new Error(tokens.error_description || "Missing access token from GitHub.");
      }

      // 2. Fetch verified GitHub user profile
      const userRes = await fetch("https://api.github.com/user", {
        headers: {
          Authorization: `Bearer ${tokens.access_token}`,
          "User-Agent": "OPEN-VERSE-Identity-Service",
        },
      });

      if (!userRes.ok) {
        throw new Error("Failed to fetch user profile from GitHub.");
      }

      const profile = await userRes.json();
      verifiedName = profile.name || profile.login;
      verifiedSub = String(profile.id);
      verifiedUserId = `github_${profile.id}`;
      if (profile.avatar_url && !profile.avatar_url.includes("dicebear.com")) {
        verifiedPicture = profile.avatar_url;
      }

      // 3. Fetch verified primary email
      const emailRes = await fetch("https://api.github.com/user/emails", {
        headers: {
          Authorization: `Bearer ${tokens.access_token}`,
          "User-Agent": "OPEN-VERSE-Identity-Service",
        },
      });

      if (emailRes.ok) {
        const emails: Array<{ email: string; primary: boolean; verified: boolean }> =
          await emailRes.json();
        const primary = emails.find((e) => e.primary && e.verified) || emails[0];
        if (primary) verifiedEmail = primary.email;
      }

      if (!verifiedEmail) {
        verifiedEmail = profile.email || `${profile.login}@github.account`;
      }
    }

    // 4. Mint signed session token
    const sessionToken = mintSessionToken(verifiedUserId, verifiedEmail, provider);
    const callbackHash = `#access_token=${sessionToken}&email=${encodeURIComponent(
      verifiedEmail
    )}&name=${encodeURIComponent(verifiedName)}&picture=${encodeURIComponent(
      verifiedPicture
    )}&sub=${encodeURIComponent(verifiedSub)}&provider=${provider}`;
    const callbackUrl = `${redirectTo}${callbackHash}`;

    // Return HTML bridging to deep link, loopback notification, and button
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Signed In • OPEN-VERSE</title>
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
      padding: 36px;
      max-width: 440px;
      width: 100%;
      text-align: center;
      box-shadow: 0 20px 40px rgba(0,0,0,0.6);
    }
    .avatar {
      width: 72px;
      height: 72px;
      border-radius: 50%;
      margin: 0 auto 20px;
      border: 2px solid #7c3aed;
      object-fit: cover;
      display: block;
    }
    .avatar-fallback {
      width: 72px;
      height: 72px;
      border-radius: 50%;
      margin: 0 auto 20px;
      background: rgba(124, 58, 237, 0.2);
      border: 2px solid #7c3aed;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 26px;
      font-weight: 700;
      color: #c4b5fd;
    }
    h1 { font-size: 22px; font-weight: 700; margin-bottom: 6px; color: #fff; }
    p.email { font-size: 14px; color: #a1a1aa; margin-bottom: 24px; }
    .badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 9999px;
      font-size: 12px;
      font-weight: 500;
      background: rgba(34, 197, 94, 0.15);
      color: #22c55e;
      border: 1px solid rgba(34, 197, 94, 0.3);
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
      background: #7c3aed;
      color: #ffffff;
      margin-top: 8px;
    }
    .btn:hover {
      background: #6d28d9;
      transform: translateY(-1px);
    }
    .footnote {
      font-size: 12px;
      color: #71717a;
      margin-top: 16px;
      line-height: 1.4;
    }
  </style>
</head>
<body>
  <div class="card">
    ${
      verifiedPicture
        ? `<img class="avatar" src="${verifiedPicture}" alt="${verifiedName}" referrerpolicy="no-referrer" />`
        : `<div class="avatar-fallback">${(verifiedName || verifiedEmail || "U")[0].toUpperCase()}</div>`
    }
    <div class="badge">✓ Identity Verified</div>
    <h1>Welcome, ${verifiedName}!</h1>
    <p class="email">${verifiedEmail}</p>

    <a href="${callbackUrl}" class="btn" id="launch-btn">Return to OPEN-VERSE</a>

    <div class="footnote">
      If OPEN-VERSE didn't open automatically, tap the button above. You can now close this tab.
    </div>
  </div>

  <script>
    const targetUrl = ${JSON.stringify(callbackUrl)};
    const cleanParams = ${JSON.stringify(callbackHash.slice(1))};

    // 1. Trigger native deep link to app
    setTimeout(function() {
      window.location.href = targetUrl;
    }, 200);

    // 2. Loopback ping for local desktop app if open
    try {
      fetch("http://localhost:3125/api/auth-notify?" + cleanParams, { mode: "no-cors" });
    } catch (e) {}
  </script>
</body>
</html>`;

    res.setHeader("Content-Type", "text/html; charset=utf-8");
    return res.status(200).send(html);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).send(`Authentication error: ${message}`);
  }
}
