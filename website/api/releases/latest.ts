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
  version: "0.2.2",
  releaseDate: new Date().toISOString(),
  channel: "stable",
  mandatory: false,
  releaseNotes: "• Native Android Package Manager Bridge (v0.2.2 / versionCode 4) permanently breaking all update loops\n• Secure Internal Cache APK Downloader with verified SHA-256 integrity\n• Desktop Tauri v0.2.2 NSIS installer and signed updater bundle with Minisign cryptography",
  platforms: {
    "windows-x86_64": {
      version: "0.2.2",
      url: "https://github.com/naresh-cn2/OPEN-VERSE/releases/download/v0.2.2/OPEN-VERSE_0.2.2_x64-setup.exe",
      signature: "dW50cnVzdGVkIGNvbW1lbnQ6IHNpZ25hdHVyZSBmcm9tIHRhdXJpIHNlY3JldCBrZXkKUlVURDA2eUVwZFJiVFN3UFFFUDdwNnkxM2hWM3c1aVVLM0sxNEEyWnNCOFNzbUVFRzdXZU5mTkZFbEF4RUxtNVNkUUkzR29xb2xFNTYzcEZUaVRrNDJob28rTC9xcTNTVXcwPQp0cnVzdGVkIGNvbW1lbnQ6IHRpbWVzdGFtcDoxNzk0NDEzNjkwCWZpbGU6T1BFTi1WRVJTRV8wLjIuMl94NjQtc2V0dXAuZXhlCXZlcnNpb246MC4yLjIKWEE2aWYzQ1ZwWFRaWS9Db3hRTUNWZVB5NDZrZEJCdGJlT3JXdmhVZmx4d3habGY0aGJYaldCOW9ITnRtektveUpSVnhqRFJDbTBHRTJ0TndBaGpxQkE9PQo=",
    },
    android: {
      version: "0.2.2",
      versionCode: 4,
      url: "https://open-verse-website.vercel.app/open-verse-mobile.apk",
      sha256: "8cce5d94bfa3066daac5ae0361e125a8294fac1f3dd390f7cef0c47366d0308c",
      minSdk: 26
    },
    ios: {
      version: "0.2.2",
      build: "3",
      testFlightUrl: "https://testflight.apple.com/join/openverse-preview"
    },
    web: {
      version: "0.2.2",
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

