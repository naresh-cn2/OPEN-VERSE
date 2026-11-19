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
  version: "0.2.7",
  releaseDate: "2026-11-19T13:55:00Z",
  channel: "stable",
  mandatory: false,
  releaseNotes: "• Synchronized Native Distribution: Official v0.2.7 release artifacts across Windows, Android, Linux, macOS, and iOS\n• Truth-First Platform Status Taxonomy: Clear labeling of signing requirements and known OS security restrictions\n• Windows Smart App Control Diagnostics: Full forensic documentation of Code Integrity policies (Event 3077/3118) and Azure Trusted Signing / Microsoft Store MSIX paths\n• High-Performance Direct Streaming: Direct APK distribution and synchronized desktop auto-updater manifests",
  platforms: {
    "windows-x86_64": {
      version: "0.2.7",
      url: "https://github.com/naresh-cn2/OPEN-VERSE/releases/download/v0.2.7/OPEN-VERSE_0.2.7_x64-setup.exe",
      sha256: "36d60fd9b980b98596674f26d3fb10d71087e36856c27dfefe3f1e7ea3632812",
      signature: "dW50cnVzdGVkIGNvbW1lbnQ6IHNpZ25hdHVyZSBmcm9tIHRhdXJpIHNlY3JldCBrZXkKUlVURDA2eUVwZFJiVGRkTnR4Y3BNYW04YThuVXBXOVRKSGxRUVFHY2xxRjRvYXAvS1JSNEI5aU9FUUJXczBUYzltVUNNRWkweHdpSWdxd1RvSkFoUmpQWnVXUzNUdDd3aEFBPQp0cnVzdGVkIGNvbW1lbnQ6IHRpbWVzdGFtcDoxNzk0ODU1MTYyCWZpbGU6T1BFTi1WRVJTRV8wLjIuNl94NjQtc2V0dXAuZXhlCXZlcnNpb246MC4yLjYKWWhTMmUweHBLT0NYVDZxTGFsVW5BLzFFTm9TL25DUUQ0VFZPTCtvUnMzZ3JaSjVpeG9BMXZzV0dMNjFZK3BueTZTeHI4RG9seU5FYWQ4ejdIRjBmQ0E9PQo=",
    },
    android: {
      version: "0.2.7",
      versionCode: 9,
      url: "https://open-verse-website.vercel.app/open-verse-mobile.apk",
      sha256: "187dd7216b36d31f32340c129b8555cad56aa206b3de4cf003f4151badc2b955",
      minSdk: 24
    },
    ios: {
      version: "0.2.7",
      build: "9",
      status: "in-preview",
      betaWaitlistUrl: "https://github.com/naresh-cn2/OPEN-VERSE/issues/new?title=iOS+TestFlight+Beta+Invite+Request&body=Please+grant+TestFlight+beta+access+for+my+Apple+ID."
    },
    web: {
      version: "0.2.7",
      deployedAt: "2026-11-19T13:55:00Z"
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

