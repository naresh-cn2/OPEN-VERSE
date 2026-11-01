import { cpSync, existsSync, mkdirSync, rmSync } from "node:fs";
import { resolve } from "node:path";

const srcDir = resolve(__dirname, "../../desktop/apps/examples/desktop-app/webview/out");
const androidAssets = resolve(__dirname, "../android/app/src/main/assets");
const iosAssets = resolve(__dirname, "../ios/OPEN-VERSE/www");

if (!existsSync(srcDir) || !existsSync(resolve(srcDir, "index.html"))) {
  console.error("Canonical webview export not found at:", srcDir);
  process.exit(1);
}

console.log("Syncing canonical OPEN-VERSE webview assets from:", srcDir);

// Sync to Android
rmSync(androidAssets, { recursive: true, force: true });
mkdirSync(androidAssets, { recursive: true });
cpSync(srcDir, androidAssets, { recursive: true, force: true });
console.log("Synced canonical assets to Android:", androidAssets);

// Sync to iOS
rmSync(iosAssets, { recursive: true, force: true });
mkdirSync(iosAssets, { recursive: true });
cpSync(srcDir, iosAssets, { recursive: true, force: true });
console.log("Synced canonical assets to iOS:", iosAssets);

