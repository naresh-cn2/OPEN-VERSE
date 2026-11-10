import type { VercelRequest, VercelResponse } from "@vercel/node";
import crypto from "node:crypto";

/**
 * OPEN-VERSE Identity Service - OAuth Callback Handler
 *
 * Exchanges authorization code with real Google / GitHub token endpoints,
 * verifies provider identity, and mints an authenticated OPEN-VERSE session token.
 */

const SESSION_SECRET = process.env.OPENVERSE_SESSION_SECRET || "openverse-secure-session-key-dev-only";

function mintSessionToken(userId: string, email: string, provider: string): string {
  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
  const payload = Buffer.from(JSON.stringify({
    sub: userId,
    email,
    provider,
    iss: "openverse-identity-service",
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (3600 * 24 * 30), // 30 days
  })).toString("base64url");

  const signature = crypto
    .createHmac("sha256", SESSION_SECRET)
    .update(`${header}.${payload}`)
    .digest("base64url");

  return `${header}.${payload}.${signature}`;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const code = (req.query.code as string) || "";
  const state = (req.query.state as string) || "";
  const provider = (req.query.provider as string) || (state.startsWith("gh_") ? "github" : "google");
  const redirectTo = "openverse://auth/callback";

  if (!code) {
    return res.status(400).send("Missing authorization code from OAuth provider.");
  }

  let verifiedEmail = "";
  let verifiedName = "";
  let verifiedUserId = "";

  try {
    if (provider === "google") {
      const clientId = process.env.GOOGLE_CLIENT_ID;
      const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

      if (!clientId || !clientSecret) {
        throw new Error("GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET not configured on server.");
      }

      // 1. Exchange authorization code for Google tokens
      const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          code,
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uri: `https://${req.headers.host}/api/auth/callback`,
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
      verifiedEmail = profile.email;
      verifiedName = profile.name || profile.given_name || "Google User";
      verifiedUserId = `google_${profile.sub}`;

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
      verifiedUserId = `github_${profile.id}`;

      // 3. Fetch verified primary email
      const emailRes = await fetch("https://api.github.com/user/emails", {
        headers: {
          Authorization: `Bearer ${tokens.access_token}`,
          "User-Agent": "OPEN-VERSE-Identity-Service",
        },
      });

      if (emailRes.ok) {
        const emails: Array<{ email: string; primary: boolean; verified: boolean }> = await emailRes.json();
        const primary = emails.find((e) => e.primary && e.verified) || emails[0];
        if (primary) verifiedEmail = primary.email;
      }

      if (!verifiedEmail) {
        verifiedEmail = profile.email || `${profile.login}@github.account`;
      }
    }

    // 4. Mint signed session token
    const sessionToken = mintSessionToken(verifiedUserId, verifiedEmail, provider);
    const callbackUrl = `${redirectTo}#access_token=${sessionToken}&email=${encodeURIComponent(verifiedEmail)}&name=${encodeURIComponent(verifiedName)}&provider=${provider}`;

    // 5. Redirect back to mobile application
    res.setHeader("Location", callbackUrl);
    return res.status(302).send(`Redirecting to OPEN-VERSE...`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).send(`Authentication error: ${message}`);
  }
}

