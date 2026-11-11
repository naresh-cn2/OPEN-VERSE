/**
 * OPEN-VERSE Mobile In-App Automatic Updater
 * Checks GitHub Releases & official website for new mobile APK releases.
 */

export interface MobileUpdateInfo {
  available: boolean;
  currentVersion: string;
  latestVersion: string;
  releaseNotes?: string;
  downloadUrl: string;
  publishedAt?: string;
  sha256?: string;
  versionCode?: number;
}

export const CURRENT_MOBILE_VERSION = "0.2.2";
const UPDATE_FEED_URL = "https://open-verse-website.vercel.app/api/releases/latest";
const GITHUB_RELEASE_API = "https://api.github.com/repos/naresh-cn2/OPEN-VERSE/releases/tags/desktop-latest";

export async function checkMobileUpdate(): Promise<MobileUpdateInfo> {
  let installedVersion = CURRENT_MOBILE_VERSION;
  let installedVersionCode: number | null = null;

  if (typeof window !== "undefined" && window.AndroidInterface?.getAppVersion) {
    try {
      const v = window.AndroidInterface.getAppVersion();
      if (v) installedVersion = v;
    } catch {}
  }

  if (typeof window !== "undefined" && (window.AndroidInterface as any)?.getAppVersionCode) {
    try {
      const code = Number((window.AndroidInterface as any).getAppVersionCode());
      if (Number.isFinite(code) && code > 0) installedVersionCode = code;
    } catch {}
  }

  const result: MobileUpdateInfo = {
    available: false,
    currentVersion: installedVersion,
    latestVersion: installedVersion,
    downloadUrl: `https://open-verse-website.vercel.app/open-verse-mobile.apk`,
  };

  try {
    // 1. Try reading official unified release manifest
    const res = await fetch(UPDATE_FEED_URL, { cache: "no-store" });
    if (res.ok) {
      const data = await res.json();
      if (data && data.version) {
        result.latestVersion = data.version.replace(/^v/, "");
        result.releaseNotes = data.releaseNotes || data.notes || "New performance improvements and features.";
        result.downloadUrl = data.platforms?.android?.url || "https://open-verse-website.vercel.app/open-verse-mobile.apk";
        result.sha256 = data.platforms?.android?.sha256;
        result.versionCode = data.platforms?.android?.versionCode;

        let hasNewerVersion = compareVersions(result.latestVersion, installedVersion) > 0;
        if (result.versionCode && installedVersionCode !== null) {
          if (installedVersionCode >= result.versionCode) {
            hasNewerVersion = false;
          }
        }
        result.available = hasNewerVersion;
        return result;
      }
    }
  } catch (err) {
    console.warn("Failed to check update feed, trying GitHub API fallback:", err);
  }

  try {
    // 2. Fallback to GitHub Release API
    const res = await fetch(GITHUB_RELEASE_API);
    if (res.ok) {
      const data = await res.json();
      const tagName = (data.tag_name || "").replace(/^v/, "");
      if (tagName) {
        result.latestVersion = tagName;
        result.releaseNotes = data.body || "New update released.";
        result.publishedAt = data.published_at;
        result.available = compareVersions(result.latestVersion, CURRENT_MOBILE_VERSION) > 0;
      }
    }
  } catch (err) {
    console.error("Update check failed:", err);
  }

  return result;
}

function compareVersions(v1: string, v2: string): number {
  const p1 = v1.split(".").map((n) => parseInt(n, 10) || 0);
  const p2 = v2.split(".").map((n) => parseInt(n, 10) || 0);
  for (let i = 0; i < Math.max(p1.length, p2.length); i++) {
    const num1 = p1[i] || 0;
    const num2 = p2[i] || 0;
    if (num1 > num2) return 1;
    if (num1 < num2) return -1;
  }
  return 0;
}

