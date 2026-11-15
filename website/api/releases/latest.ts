import type { VercelRequest, VercelResponse } from "@vercel/node";

export interface PlatformUpdateInfo {
  version: string;
  url: string;
  signature?: string;
  sha256?: string;
  versionCode?: number;
  minVersion?: string;
}

export interface UnifiedReleaseManifest {
  version: string;
  releaseDate: string;
  channel: "stable" | "beta" | "nightly";
  mandatory: boolean;
  releaseNotes: string;
  platforms: {
    "windows-x86_64"?: PlatformUpdateInfo;
    "darwin-aarch64"?: PlatformUpdateInfo;
    "darwin-x86_64"?: PlatformUpdateInfo;
    "linux-x86_64"?: PlatformUpdateInfo;
    android?: PlatformUpdateInfo & { minSdk?: number };
    ios?: {
      version: string;
      build: string;
      testFlightUrl?: string;
      appStoreUrl?: string;
    };
    web?: {
      version: string;
      deployedAt: string;
    };
  };
}

export const CURRENT_RELEASE_MANIFEST: UnifiedReleaseManifest = {
  version: "0.2.5",
  releaseDate: new Date().toISOString(),
  channel: "stable",
  mandatory: false,
  releaseNotes: "• Google-First Native Authentication: Official Google Account Chooser with dynamic multi-account selection\n• Authentic Google Profile Sync: Real-time display of verified Google Account name and profile photo with no-referrer CDN security bypass\n• Multi-Account Privacy & Isolation: Strict per-account workspace isolation and state partitioning\n• Seamless Auto-Updater Repair: Dynamic checksum verification, monotonic versionCode upgrade, and elimination of restart loop",
  platforms: {
    "windows-x86_64": {
      version: "0.2.5",
      url: "https://github.com/naresh-cn2/OPEN-VERSE/releases/download/v0.2.5/OPEN-VERSE_0.2.5_x64-setup.exe",
      sha256: "7d32a4ba94e3b25152356f46e34a439839e6055cc8b4130d0a5fe4065a0e53bc",
      signature: "dW50cnVzdGVkIGNvbW1lbnQ6IHNpZ25hdHVyZSBmcm9tIHRhdXJpIHNlY3JldCBrZXkKUlVURDA2eUVwZFJiVFpqYnlIUUEwUkNvaHVYUi95bjFLUVBVK3ZFbko0SWxqdzJiMS90K3NHNmFEc0dmUzMzOEpTNWljQ1EzZVpWenE4L0d6Z2NqWXd1QXNCbEdidkZZckFVPQp0cnVzdGVkIGNvbW1lbnQ6IHRpbWVzdGFtcDoxNzk0NzIzNzQwCWZpbGU6T1BFTi1WRVJTRV8wLjIuNF94NjQtc2V0dXAuZXhlCXZlcnNpb246MC4yLjQKem5IU2Z2UW1qeUUzMlNxczdZZjQ4WVZwb3hpRlpKN01iOGQ1QURTVnh1VU5JS1pxMTM4aXVWS0pKSmJ3aThndEFWUkVHOHh3V2VKTTdMZVlGNThHQVE9PQo=",
    },
    android: {
      version: "0.2.5",
      versionCode: 7,
      url: "https://open-verse-website.vercel.app/open-verse-mobile.apk",
      sha256: "950aba4b9e02d059e53415996c65a70f13ebf4da9780078b5759242ccfe675a7",
      minSdk: 24
    },
    ios: {
      version: "0.2.5",
      build: "6",
      testFlightUrl: "https://testflight.apple.com/join/openverse-preview"
    },
    web: {
      version: "0.2.5",
      deployedAt: new Date().toISOString()
    }
  }
};

export default function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Cache-Control", "public, s-maxage=60, stale-while-revalidate=300");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  // Support Tauri v2 endpoint format if requested with ?format=tauri
  if (req.query.format === "tauri") {
    const tauriManifest = {
      version: `v${CURRENT_RELEASE_MANIFEST.version}`,
      notes: CURRENT_RELEASE_MANIFEST.releaseNotes,
      pub_date: CURRENT_RELEASE_MANIFEST.releaseDate,
      platforms: {
        "windows-x86_64": CURRENT_RELEASE_MANIFEST.platforms["windows-x86_64"]
          ? {
              signature: CURRENT_RELEASE_MANIFEST.platforms["windows-x86_64"].signature,
              url: CURRENT_RELEASE_MANIFEST.platforms["windows-x86_64"].url
            }
          : undefined,
        "linux-x86_64": CURRENT_RELEASE_MANIFEST.platforms["linux-x86_64"]
          ? {
              signature: CURRENT_RELEASE_MANIFEST.platforms["linux-x86_64"].signature,
              url: CURRENT_RELEASE_MANIFEST.platforms["linux-x86_64"].url
            }
          : undefined,
        "darwin-aarch64": CURRENT_RELEASE_MANIFEST.platforms["darwin-aarch64"]
          ? {
              signature: CURRENT_RELEASE_MANIFEST.platforms["darwin-aarch64"].signature,
              url: CURRENT_RELEASE_MANIFEST.platforms["darwin-aarch64"].url
            }
          : undefined,
        "darwin-x86_64": CURRENT_RELEASE_MANIFEST.platforms["darwin-x86_64"]
          ? {
              signature: CURRENT_RELEASE_MANIFEST.platforms["darwin-x86_64"].signature,
              url: CURRENT_RELEASE_MANIFEST.platforms["darwin-x86_64"].url
            }
          : undefined
      }
    };
    return res.status(200).json(tauriManifest);
  }

  return res.status(200).json(CURRENT_RELEASE_MANIFEST);
}

