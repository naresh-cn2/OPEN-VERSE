import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const mobileRoot = path.join(__dirname, "..");
const repoRoot = path.join(mobileRoot, "..");
const canonicalWebviewRoot = path.join(repoRoot, "desktop/apps/examples/desktop-app/webview");
const canonicalOutDir = path.join(canonicalWebviewRoot, "out");

const targetDist = path.join(mobileRoot, "dist");
const targetAndroidAssets = path.join(mobileRoot, "android/app/src/main/assets");
const targetIosWww = path.join(mobileRoot, "ios/OPEN-VERSE/www");

console.log("=== ONE OPEN-VERSE: Syncing Canonical Frontend Assets ===");

// 1. Ensure canonical webview is built
if (!fs.existsSync(path.join(canonicalOutDir, "index.html"))) {
  console.log("Canonical webview out/ not found. Building canonical webview via Next.js...");
  execSync("bun run build:web", {
    cwd: path.join(repoRoot, "desktop/apps/examples/desktop-app"),
    stdio: "inherit",
  });
}

function copyDirectoryRecursive(src: string, dest: string) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }

  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDirectoryRecursive(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

function countFilesAndSize(dir: string): { count: number; totalBytes: number } {
  let count = 0;
  let totalBytes = 0;
  if (!fs.existsSync(dir)) return { count, totalBytes };

  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      const sub = countFilesAndSize(fullPath);
      count += sub.count;
      totalBytes += sub.totalBytes;
    } else {
      count++;
      totalBytes += fs.statSync(fullPath).size;
    }
  }
  return { count, totalBytes };
}

// 2. Clean and sync into mobile/dist
console.log(`Syncing canonical assets to ${targetDist}...`);
fs.rmSync(targetDist, { recursive: true, force: true });
copyDirectoryRecursive(canonicalOutDir, targetDist);

// 3. Clean and sync into mobile/android/app/src/main/assets
console.log(`Syncing canonical assets to Android: ${targetAndroidAssets}...`);
fs.rmSync(targetAndroidAssets, { recursive: true, force: true });
copyDirectoryRecursive(canonicalOutDir, targetAndroidAssets);

// 4. Clean and sync into mobile/ios/OPEN-VERSE/www
console.log(`Syncing canonical assets to iOS: ${targetIosWww}...`);
fs.rmSync(targetIosWww, { recursive: true, force: true });
copyDirectoryRecursive(canonicalOutDir, targetIosWww);

const distStats = countFilesAndSize(targetDist);
const androidStats = countFilesAndSize(targetAndroidAssets);
const iosStats = countFilesAndSize(targetIosWww);

console.log(`\nSync Verification:`);
console.log(`  mobile/dist:               ${distStats.count} files, ${(distStats.totalBytes / 1024 / 1024).toFixed(2)} MB`);
console.log(`  Android assets:            ${androidStats.count} files, ${(androidStats.totalBytes / 1024 / 1024).toFixed(2)} MB`);
console.log(`  iOS www:                   ${iosStats.count} files, ${(iosStats.totalBytes / 1024 / 1024).toFixed(2)} MB`);
console.log("\nONE OPEN-VERSE canonical asset sync completed successfully!");
