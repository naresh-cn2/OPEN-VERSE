import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const srcDir = resolve(__dirname, "../../desktop/apps/examples/desktop-app/webview/out");
const androidAssets = resolve(__dirname, "../android/app/src/main/assets");
const iosAssets = resolve(__dirname, "../ios/OPEN-VERSE/www");

if (!existsSync(srcDir) || !existsSync(resolve(srcDir, "index.html"))) {
  console.error("Canonical webview export not found at:", srcDir);
  process.exit(1);
}

console.log("Syncing canonical OPEN-VERSE webview assets from:", srcDir);

function sanitizeIndexHtml(targetPath: string) {
  const file = resolve(targetPath, "index.html");
  if (existsSync(file)) {
    let html = readFileSync(file, "utf8");
    // Strip any pre-rendered fixed SSR startup screen overlay from static export
    html = html.replace(/<main class="fixed inset-0 z-40[^>]*>[\s\S]*?<\/main>/g, "");
    writeFileSync(file, html, "utf8");
    console.log("Sanitized index.html at:", file);
  }
}

// Sync to Android
rmSync(androidAssets, { recursive: true, force: true });
mkdirSync(androidAssets, { recursive: true });
cpSync(srcDir, androidAssets, { recursive: true, force: true });
sanitizeIndexHtml(androidAssets);
console.log("Synced canonical assets to Android:", androidAssets);

// Sync to iOS
rmSync(iosAssets, { recursive: true, force: true });
mkdirSync(iosAssets, { recursive: true });
cpSync(srcDir, iosAssets, { recursive: true, force: true });
sanitizeIndexHtml(iosAssets);
console.log("Synced canonical assets to iOS:", iosAssets);

