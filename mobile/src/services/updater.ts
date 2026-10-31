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
}

export const CURRENT_MOBILE_VERSION = "0.2.0";
const UPDATE_FEED_URL = "https://raw.githubusercontent.com/naresh-cn2/OPEN-VERSE/main/desktop/latest.json";
const GITHUB_RELEASE_API = "https://api.github.com/repos/naresh-cn2/OPEN-VERSE/releases/tags/desktop-latest";

export async function checkMobileUpdate(): Promise<MobileUpdateInfo> {
  const result: MobileUpdateInfo = {
    available: false,
    currentVersion: CURRENT_MOBILE_VERSION,
    latestVersion: CURRENT_MOBILE_VERSION,
    downloadUrl: `https://github.com/naresh-cn2/OPEN-VERSE/releases/download/v${CURRENT_MOBILE_VERSION}/open-verse-mobile.apk`,
  };

  try {
    // 1. Try reading official feed
    const res = await fetch(UPDATE_FEED_URL, { cache: "no-store" });
    if (res.ok) {
      const data = await res.json();
      if (data && data.version) {
        result.latestVersion = data.version.replace(/^v/, "");
        result.releaseNotes = data.notes || "New performance improvements and features.";
        result.downloadUrl = "https://github.com/naresh-cn2/OPEN-VERSE/releases/download/desktop-latest/open-verse-mobile.apk";
        result.available = compareVersions(result.latestVersion, CURRENT_MOBILE_VERSION) > 0;
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

