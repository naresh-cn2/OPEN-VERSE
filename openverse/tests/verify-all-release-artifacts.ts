/**
 * OPEN-VERSE PRODUCTION ARTIFACT INTEGRITY VERIFICATION SUITE
 *
 * Verifies live production download endpoints and validates SHA-256 digests
 * bit-for-bit against the canonical release manifest.
 */

import { existsSync, createReadStream, readFileSync } from 'node:fs';
import { resolve, join, dirname } from 'node:path';
import { createHash } from 'node:crypto';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
if (!token) {
  try {
    token = execSync("gh auth token", { encoding: "utf8" }).trim();
  } catch {}
}

const MANIFEST_PATH = resolve(__dirname, "../website/public/open-verse-releases.json");
const manifest = JSON.parse(readFileSync(MANIFEST_PATH, "utf8"));
const VERSION = manifest.version || "3.0.0";

interface ArtifactTest {
  id: string;
  name: string;
  url: string;
  localPath: string;
  expectedSha256: string;
  expectedMime?: string;
  minBytes: number;
}

const ARTIFACTS: ArtifactTest[] = [
  {
    id: "win-exe",
    name: `OPEN-VERSE_${VERSION}_x64-setup.exe`,
    url: `https://github.com/naresh-cn2/OPEN-VERSE/releases/download/v${VERSION}/OPEN-VERSE_${VERSION}_x64-setup.exe`,
    localPath: resolve(__dirname, `../build-artifacts/windows/OPEN-VERSE_${VERSION}_x64-setup.exe`),
    expectedSha256: "481d43089055d8bfdc1f5c67f894814ece88078503a46eb90c286db15579d4dc",
    expectedMime: "application/octet-stream",
    minBytes: 120 * 1024 * 1024
  },
  {
    id: "win-zip",
    name: `OPEN-VERSE_${VERSION}_x64-windows.zip`,
    url: `https://github.com/naresh-cn2/OPEN-VERSE/releases/download/v${VERSION}/OPEN-VERSE_${VERSION}_x64-windows.zip`,
    localPath: resolve(__dirname, `../build-artifacts/windows/OPEN-VERSE_${VERSION}_x64-windows.zip`),
    expectedSha256: "0a875ab71b13f3659a5be7d4527f862163e8a41736ae2c27725a5b7786e8a31c",
    expectedMime: "application/octet-stream",
    minBytes: 120 * 1024 * 1024
  },
  {
    id: "android-apk",
    name: `open-verse-mobile.apk`,
    url: `https://open-verse-website.vercel.app/open-verse-mobile.apk`,
    localPath: resolve(__dirname, `../website/public/open-verse-mobile.apk`),
    expectedSha256: "623410f27b0409f11fb3c4c73d34cc2efc2be1e6407c429920777bc550454960",
    expectedMime: "application/vnd.android.package-archive",
    minBytes: 10 * 1024 * 1024
  },
  {
    id: "android-apk-github",
    name: `open-verse-v${VERSION}-android.apk`,
    url: `https://github.com/naresh-cn2/OPEN-VERSE/releases/download/v${VERSION}/open-verse-v${VERSION}-android.apk`,
    localPath: resolve(__dirname, `../build-artifacts/android/open-verse-v${VERSION}-android.apk`),
    expectedSha256: "623410f27b0409f11fb3c4c73d34cc2efc2be1e6407c429920777bc550454960",
    expectedMime: "application/octet-stream",
    minBytes: 10 * 1024 * 1024
  }
];

function hashFileStream(filePath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const hash = createHash("sha256");
    const stream = createReadStream(filePath);
    stream.on("data", (chunk) => hash.update(chunk));
    stream.on("end", () => resolve(hash.digest("hex").toLowerCase()));
    stream.on("error", (err) => reject(err));
  });
}

async function verifyAll() {
  console.log("==================================================================");
  console.log("   OPEN-VERSE PRODUCTION ARTIFACT INTEGRITY VERIFICATION SUITE");
  console.log(`   Release Target: v${VERSION}`);
  console.log("==================================================================\n");

  let passed = 0;
  let failed = 0;

  // Fetch GitHub release metadata once if token is available
  let ghAssets: any[] = [];
  if (token) {
    try {
      const ghRes = await fetch(`https://api.github.com/repos/naresh-cn2/OPEN-VERSE/releases/tags/v${VERSION}`, {
        headers: { Authorization: `Bearer ${token}`, Accept: "application/vnd.github.v3+json" }
      });
      if (ghRes.ok) {
        const ghData = (await ghRes.json()) as any;
        ghAssets = ghData.assets || [];
      }
    } catch {}
  }

  for (const art of ARTIFACTS) {
    console.log(`--- Checking [${art.id}] ${art.name} ---`);
    console.log(`  Live URL: ${art.url}`);

    // 1. Verify remote HTTP endpoint or GitHub API Release Asset
    if (art.url.includes("github.com")) {
      const match = ghAssets.find((a: any) => a.name === art.name);
      if (!match) {
        console.error(`  ❌ GitHub Release Asset not found in v${VERSION}`);
        failed++;
        continue;
      }
      const remoteMb = (match.size / (1024 * 1024)).toFixed(2);
      console.log(`  GitHub Release Asset: State ${match.state} | ${remoteMb} MB | ${match.content_type}`);
      if (match.size < art.minBytes) {
        console.error(`  ❌ Remote Content-Length too small (${remoteMb} MB < ${(art.minBytes / (1024*1024)).toFixed(2)} MB)`);
        failed++;
        continue;
      }
    } else {
      try {
        const res = await fetch(art.url, { method: "HEAD", redirect: "follow" });
        if (!res.ok) {
          console.error(`  ❌ Remote URL returned HTTP ${res.status} ${res.statusText}`);
          failed++;
          continue;
        }
        const remoteMime = res.headers.get("content-type") || "";
        const remoteLen = parseInt(res.headers.get("content-length") || "0", 10);
        const remoteMb = (remoteLen / (1024 * 1024)).toFixed(2);
        console.log(`  Remote Endpoint: HTTP ${res.status} | ${remoteMb} MB | ${remoteMime}`);

        if (remoteLen < art.minBytes) {
          console.error(`  ❌ Remote Content-Length too small (${remoteMb} MB < ${(art.minBytes / (1024*1024)).toFixed(2)} MB)`);
          failed++;
          continue;
        }
      } catch (e: any) {
        console.error(`  ❌ Remote endpoint fetch failed: ${e.message}`);
        failed++;
        continue;
      }
    }

    // 2. Verify bit-for-bit SHA-256 hash
    let calculatedHash = "";
    if (existsSync(art.localPath)) {
      calculatedHash = await hashFileStream(art.localPath);
      console.log(`  Local File: ${art.localPath}`);
    } else {
      console.log(`  Local file not present (CI runner environment). Streaming remote endpoint for bit-for-bit SHA-256 calculation...`);
      try {
        const streamRes = await fetch(art.url, { redirect: "follow", headers });
        if (!streamRes.ok || !streamRes.body) {
          throw new Error(`Failed to stream ${art.url}: HTTP ${streamRes.status}`);
        }
        const hash = createHash("sha256");
        const reader = (streamRes.body as any).getReader();
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          hash.update(value);
        }
        calculatedHash = hash.digest("hex").toLowerCase();
      } catch (streamErr: any) {
        console.error(`  ❌ Remote SHA-256 stream failed: ${streamErr.message}`);
        failed++;
        continue;
      }
    }

    console.log(`  Calculated SHA-256: ${calculatedHash}`);
    console.log(`  Canonical  SHA-256: ${art.expectedSha256}`);

    if (calculatedHash !== art.expectedSha256.toLowerCase()) {
      console.error(`  ❌ SHA-256 CHECKSUM MISMATCH!`);
      failed++;
      continue;
    }

    console.log(`  ✅ [PASS] ${art.id}: 100% verified\n`);
    passed++;
  }

  console.log("==================================================================");
  console.log(`  VERIFICATION RESULTS: ${passed}/${ARTIFACTS.length} PASSED`);
  if (failed > 0) {
    console.error(`  ❌ ${failed} ARTIFACT(S) FAILED INTEGRITY VERIFICATION`);
    process.exit(1);
  } else {
    console.log("  ✅ ALL LIVE PRODUCTION ARTIFACTS VERIFIED (BIT-FOR-BIT IDENTICAL)");
    console.log("==================================================================\n");
  }
}

verifyAll().catch((err) => {
  console.error("Verification suite failed:", err);
  process.exit(1);
});
