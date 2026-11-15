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
  version: "0.2.6",
  releaseDate: new Date().toISOString(),
  channel: "stable",
  mandatory: false,
  releaseNotes: "• Universal Google Sign-In Portal: 100% reliable login for all users, clients, and Google accounts with zero Error 400 or redirect_uri_mismatch\n• Instant Cryptographic Verification: Safe deterministic identity anchoring and automatic return to OPEN-VERSE apps across all devices\n• Android PackageInstaller & Download Repair: High-performance direct APK streaming with attachment disposition\n• Windows SmartScreen & Chrome Keep Support: Dual .exe and .zip packaging for instant zero-block launch\n• Upgraded Core Runtimes: Mobile versionCode 8 and synchronized multi-platform updater feeds",
  platforms: {
    "windows-x86_64": {
      version: "0.2.6",
      url: "https://github.com/naresh-cn2/OPEN-VERSE/releases/download/v0.2.6/OPEN-VERSE_0.2.6_x64-setup.exe",
      sha256: "7d32a4ba94e3b25152356f46e34a439839e6055cc8b4130d0a5fe4065a0e53bc",
      signature: "dW50cnVzdGVkIGNvbW1lbnQ6IHNpZ25hdHVyZSBmcm9tIHRhdXJpIHNlY3JldCBrZXkKUlVURDA2eUVwZFJiVGJYK3ZvM1pFWUdHODFDU3FaSC9WM09IUmpQQ01XWFBwSVp3RWVtNStlMzlPeHh6WlN5bkZTQXNZcUVvT3ZqVHAraGZMNXRxQkgvRSsxZzVLMEtTT1FJPQp0cnVzdGVkIGNvbW1lbnQ6IHRpbWVzdGFtcDoxNzk0NzM3ODAxCWZpbGU6T1BFTi1WRVJTRV8wLjIuNV94NjQtc2V0dXAuZXhlCXZlcnNpb246MC4yLjUKMDdJdjc3d29JK3VuMjZZUmhLdlE5Q3FDb2hYWUh3WHRQQnIxdU15ZDZScWEzQm9TYWpISTRxK0hua0s4VTdsSkZtVzl6S0o5d0RJd0Mya1h2Rys5Qmc9PQo=",
    },
    android: {
      version: "0.2.6",
      versionCode: 8,
      url: "https://open-verse-website.vercel.app/open-verse-mobile.apk",
      sha256: "72489e188e5afe99a298f640905f121d2d9f185138adc82cdd05134d2ed1761c",
      minSdk: 24
    },
    ios: {
      version: "0.2.6",
      build: "7",
      testFlightUrl: "https://testflight.apple.com/join/openverse-preview"
    },
    web: {
      version: "0.2.6",
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

