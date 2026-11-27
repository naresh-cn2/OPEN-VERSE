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
      status: string;
      betaWaitlistUrl?: string;
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
  version: "0.2.8",
  releaseDate: "2026-11-27T12:00:00Z",
  channel: "stable",
  mandatory: false,
  releaseNotes: "• Complete Hermes Agent AI Core: Canonical v0.21.5 engine with Nous Hermes 3 models (8B, 70B, Hermes 2 Pro, DeepSeek R1)\n• Purged Cline: Completely eliminated Cline usage-billing, billing redirects, and Cline provider references\n• Full Dashboard UI: Complete Hermes Agent interface (Chat, Sessions, Files, Models, Logs, Cron, Skills, Plugins, MCP, Channels, Webhooks)\n• Universal Google Sign-In: Cross-device device mesh and remote task dispatch between Android phone and Windows desktop\n• Verified Cross-Platform Release: Native NSIS Windows setup installer, Android APK, and release manifests",
  platforms: {
    "windows-x86_64": {
      version: "0.2.8",
      url: "https://github.com/naresh-cn2/OPEN-VERSE/releases/download/v0.2.8/OPEN-VERSE_0.2.8_x64-setup.exe",
      sha256: "481d43089055d8bfdc1f5c67f894814ece88078503a46eb90c286db15579d4dc",
      signature: "dW50cnVzdGVkIGNvbW1lbnQ6IHNpZ25hdHVyZSBmcm9tIHRhdXJpIHNlY3JldCBrZXkKUlVURDA2eUVwZFJiVFJYLzJESEVnelR3SEY4eW1yamFscnhmT1dyY1JhVUtJMnRvaUFWa3lIRHk5bHVhSXhJTCtRRTM4VlpaR0hybVJ4bEFBSUEvUWgxbmRsZW9KNWd1UHdNPQp0cnVzdGVkIGNvbW1lbnQ6IHRpbWVzdGFtcDoxNzk1MTA5NDIwCWZpbGU6T1BFTi1WRVJTRV8wLjIuOF94NjQtc2V0dXAuZXhlCXZlcnNpb246MC4yLjgKMU80K042WGxPMWE4SmgyZ1RnTFJ2d0FBZW1MUXZBOVNYQmkvaVdMYjdLMWFsWWt3ZTdEWjVOdkZ1RFRnZmpOS3pHNmphczRaUlh4bGYzeVJwNVU2QlE9PQo=",
    },
    android: {
      version: "0.2.8",
      versionCode: 10,
      url: "https://open-verse-website.vercel.app/open-verse-mobile.apk",
      sha256: "623410f27b0409f11fb3c4c73d34cc2efc2be1e6407c429920777bc550454960",
      minSdk: 24
    },
    ios: {
      version: "0.2.8",
      build: "10",
      status: "in-preview",
      betaWaitlistUrl: "https://github.com/naresh-cn2/OPEN-VERSE/issues/new?title=iOS+TestFlight+Beta+Invite+Request&body=Please+grant+TestFlight+beta+access+for+my+Apple+ID."
    },
    web: {
      version: "0.2.8",
      deployedAt: "2026-11-20T04:00:00Z"
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

