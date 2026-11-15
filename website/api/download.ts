import type { VercelRequest, VercelResponse } from "@vercel/node";

const VERSION = "0.2.5";
const GITHUB_REPO = "naresh-cn2/OPEN-VERSE";

export const DOWNLOAD_MAP: Record<string, { filename: string; contentType: string; url: string }> = {
  windows: {
    filename: `OPEN-VERSE_${VERSION}_x64-setup.exe`,
    contentType: "application/octet-stream",
    url: `https://github.com/${GITHUB_REPO}/releases/download/v${VERSION}/OPEN-VERSE_${VERSION}_x64-setup.exe`,
  },
  "windows-zip": {
    filename: `OPEN-VERSE_${VERSION}_x64-windows.zip`,
    contentType: "application/zip",
    url: `https://github.com/${GITHUB_REPO}/releases/download/v${VERSION}/OPEN-VERSE_${VERSION}_x64-windows.zip`,
  },
  android: {
    filename: "open-verse-mobile.apk",
    contentType: "application/vnd.android.package-archive",
    url: "https://open-verse-website.vercel.app/open-verse-mobile.apk",
  },
  "android-apk": {
    filename: `open-verse-v${VERSION}-android.apk`,
    contentType: "application/vnd.android.package-archive",
    url: `https://github.com/${GITHUB_REPO}/releases/download/v${VERSION}/open-verse-v${VERSION}-android.apk`,
  },
  "android-zip": {
    filename: `open-verse-mobile-v${VERSION}.zip`,
    contentType: "application/zip",
    url: `https://github.com/${GITHUB_REPO}/releases/download/v${VERSION}/open-verse-mobile-v${VERSION}.zip`,
  },
  mac: {
    filename: `OPEN-VERSE_${VERSION}_aarch64.dmg`,
    contentType: "application/x-apple-diskimage",
    url: `https://github.com/${GITHUB_REPO}/releases/download/desktop-latest/OPEN-VERSE_0.2.0_aarch64.dmg`,
  },
  "linux-deb": {
    filename: `OPEN-VERSE_${VERSION}_amd64.deb`,
    contentType: "application/vnd.debian.binary-package",
    url: `https://github.com/${GITHUB_REPO}/releases/download/desktop-latest/OPEN-VERSE_0.2.0_amd64.deb`,
  },
  "linux-rpm": {
    filename: `OPEN-VERSE-${VERSION}-1.x86_64.rpm`,
    contentType: "application/x-rpm",
    url: `https://github.com/${GITHUB_REPO}/releases/download/desktop-latest/OPEN-VERSE-0.2.0-1.x86_64.rpm`,
  },
};

export default function handler(req: VercelRequest, res: VercelResponse) {
  const platformQuery = (req.query.platform as string)?.toLowerCase();
  const ua = (req.headers["user-agent"] || "").toLowerCase();

  let targetKey = platformQuery;
  if (!targetKey || !DOWNLOAD_MAP[targetKey]) {
    if (ua.includes("android")) {
      targetKey = "android";
    } else if (ua.includes("win")) {
      targetKey = "windows";
    } else if (ua.includes("mac")) {
      targetKey = "mac";
    } else if (ua.includes("linux")) {
      targetKey = "linux-deb";
    } else {
      targetKey = "windows";
    }
  }

  const asset = DOWNLOAD_MAP[targetKey] || DOWNLOAD_MAP.windows;

  res.setHeader("Content-Disposition", `attachment; filename="${asset.filename}"`);
  res.setHeader("Content-Type", asset.contentType);
  res.setHeader("Cache-Control", "public, max-age=300, must-revalidate");
  res.setHeader("Access-Control-Allow-Origin", "*");

  // 302 redirect directly to verified downloadable binary
  return res.redirect(302, asset.url);
}
