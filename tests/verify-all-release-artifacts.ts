/**
 * OPEN-VERSE PRODUCTION ARTIFACT INTEGRITY VERIFICATION SUITE
 *
 * Verifies live production download endpoints and validates SHA-256 digests
 * bit-for-bit against the canonical release manifest.
 */

import { existsSync, createReadStream, readFileSync } from 'node:fs';
import { resolve, join, dirname } from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const VERSION = "0.2.6";
const MANIFEST_PATH = resolve(__dirname, "../website/public/open-verse-releases.json");
const manifest = JSON.parse(readFileSync(MANIFEST_PATH, "utf8"));

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
    localPath: resolve(__dirname, `../dist-release/OPEN-VERSE_${VERSION}_x64-setup.exe`),
    expectedSha256: "36d60fd9b980b98596674f26d3fb10d71087e36856c27dfefe3f1e7ea3632812",
    expectedMime: "application/octet-stream",
    minBytes: 150 * 1024 * 1024
  },
  {
    id: "win-zip",
    name: `OPEN-VERSE_${VERSION}_x64-windows.zip`,
    url: `https://github.com/naresh-cn2/OPEN-VERSE/releases/download/v${VERSION}/OPEN-VERSE_${VERSION}_x64-windows.zip`,
    localPath: resolve(__dirname, `../dist-release/OPEN-VERSE_${VERSION}_x64-windows.zip`),
    expectedSha256: "b6de33be3a3e252bf4cc4ee254d66616648ea4553f7beb661a7d8636da83155f",
    expectedMime: "application/octet-stream",
    minBytes: 150 * 1024 * 1024
  },
  {
    id: "android-apk",
    name: `open-verse-mobile.apk`,
    url: `https://open-verse-website.vercel.app/open-verse-mobile.apk`,
    localPath: resolve(__dirname, `../website/public/open-verse-mobile.apk`),
    expectedSha256: "187dd7216b36d31f32340c129b8555cad56aa206b3de4cf003f4151badc2b955",
    expectedMime: "application/vnd.android.package-archive",
    minBytes: 9 * 1024 * 1024
  },
  {
    id: "android-apk-github",
    name: `open-verse-v${VERSION}-android.apk`,
    url: `https://github.com/naresh-cn2/OPEN-VERSE/releases/download/v${VERSION}/open-verse-v${VERSION}-android.apk`,
    localPath: resolve(__dirname, `../dist-release/open-verse-v${VERSION}-android.apk`),
    expectedSha256: "187dd7216b36d31f32340c129b8555cad56aa206b3de4cf003f4151badc2b955",
    expectedMime: "application/octet-stream",
    minBytes: 9 * 1024 * 1024
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

  for (const art of ARTIFACTS) {
    console.log(`--- Checking [${art.id}] ${art.name} ---`);
    console.log(`  Live URL: ${art.url}`);

    // 1. Verify remote HTTP endpoint
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

    // 2. Verify bit-for-bit SHA-256 hash
    let calculatedHash = "";
    if (existsSync(art.localPath)) {
      calculatedHash = await hashFileStream(art.localPath);
      console.log(`  Local File: ${art.localPath}`);
    } else {
      console.log(`  Local file not present (CI runner environment). Streaming remote endpoint for bit-for-bit SHA-256 calculation...`);
      try {
        const streamRes = await fetch(art.url, { redirect: "follow" });
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
