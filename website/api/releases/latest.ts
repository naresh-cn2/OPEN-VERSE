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
  version: "0.2.0",
  releaseDate: new Date().toISOString(),
  channel: "stable",
  mandatory: false,
  releaseNotes: "• Unified cross-platform authentication with Google and GitHub\n• In-app automatic update notification and delivery\n• Native Android and Desktop performance optimizations",
  platforms: {
    "windows-x86_64": {
      version: "0.2.0",
      url: "https://github.com/naresh-cn2/OPEN-VERSE/releases/download/v0.2.0/OPEN-VERSE_0.2.0_x64-setup.nsis.zip",
      signature: "dW50cnVzdGVkIGNvbW1lbnQ6IG1pbmlzaWduIHB1YmxpYyBrZXk6IDRENUJENEE1ODRBQ0QzQzMKUldURDA2eUVwZFJiVGJmWjduOFk4VTBnVTVLL2pDRWJLV3lySXlEeHlXRThZTEVCMGorQ0ZMTUcK"
    },
    android: {
      version: "0.2.0",
      versionCode: 2,
      url: "https://open-verse-website.vercel.app/open-verse-mobile.apk",
      sha256: "c6e62f4bb3f99e66d012d9517831e765fabe35901601c2eed310ef189da40424",
      minSdk: 26
    },
    ios: {
      version: "0.2.0",
      build: "2",
      testFlightUrl: "https://testflight.apple.com/join/openverse-preview"
    },
    web: {
      version: "0.2.0",
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

