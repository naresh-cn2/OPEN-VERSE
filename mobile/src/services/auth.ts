/**
 * OPEN-VERSE Mobile Identity & Authentication
 * Supports Google & GitHub OAuth and Local Offline Mode
 */

export interface OpenVerseMobileUser {
  id: string;
  email: string;
  displayName?: string;
  avatarUrl?: string;
  provider: "google" | "github" | "local";
  isOfflineMode: boolean;
  createdAt: string;
}

export interface OpenVerseMobileSession {
  accessToken?: string;
  refreshToken?: string;
  user: OpenVerseMobileUser;
}

const AUTH_STORAGE_KEY = "openverse.mobile.auth_session.v1";

export function getMobileSession(): OpenVerseMobileSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function saveMobileSession(session: OpenVerseMobileSession | null): void {
  if (typeof window === "undefined") return;
  try {
    if (session) {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
    } else {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    }
    window.dispatchEvent(new CustomEvent("openverse:auth-change", { detail: { session } }));
  } catch (err) {
    console.error("Failed to update auth session:", err);
  }
}

export function startMobileOAuth(provider: "google" | "github"): string {
  const authEndpoint = "https://open-verse-website.vercel.app/api/auth";
  const redirectUri = "openverse://auth/callback";
  const authUrl = `${authEndpoint}/authorize?provider=${provider}&redirect_to=${encodeURIComponent(redirectUri)}`;

  // Use native bridge if available (Android/iOS)
  if (window.AndroidInterface && typeof window.AndroidInterface.openExternalUrl === "function") {
    window.AndroidInterface.openExternalUrl(authUrl);
  } else if (window.webkit && window.webkit.messageHandlers && window.webkit.messageHandlers.openExternalUrl) {
    window.webkit.messageHandlers.openExternalUrl.postMessage({ url: authUrl });
  } else {
    window.open(authUrl, "_blank");
  }

  return authUrl;
}

export function handleDeepLinkCallback(url: string): OpenVerseMobileSession {
  const parsed = new URL(url.replace("openverse://", "http://localhost/"));
  const params = new URLSearchParams(parsed.search || parsed.hash.replace("#", "?"));

  const accessToken = params.get("access_token") || params.get("code") || "demo-token";
  const email = params.get("email") || "user@openverse.account";
  const displayName = params.get("name") || email.split("@")[0];
  const provider = (params.get("provider") as "google" | "github") || "google";

  const session: OpenVerseMobileSession = {
    accessToken,
    user: {
      id: `ov-mob-${Date.now()}`,
      email,
      displayName,
      provider,
      isOfflineMode: false,
      createdAt: new Date().toISOString(),
    },
  };

  saveMobileSession(session);
  return session;
}

export function loginOfflineMode(): OpenVerseMobileSession {
  const session: OpenVerseMobileSession = {
    user: {
      id: "openverse-mobile-offline",
      email: "local@openverse.internal",
      displayName: "Local Mobile User",
      provider: "local",
      isOfflineMode: true,
      createdAt: new Date().toISOString(),
    },
  };

  saveMobileSession(session);
  return session;
}

// Global declaration for Native Android/iOS bridges
declare global {
  interface Window {
    AndroidInterface?: {
      openExternalUrl: (url: string) => void;
      performHapticFeedback: (type?: string) => void;
      showToast: (msg: string) => void;
    };
    webkit?: {
      messageHandlers?: {
        openExternalUrl?: { postMessage: (msg: { url: string }) => void };
        performHapticFeedback?: { postMessage: (msg: { type: string }) => void };
      };
    };
  }
}

