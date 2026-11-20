import { existsSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";

/**
 * Resilient, idempotent GitHub Release publisher for OPEN-VERSE Android deliverables.
 * Handles transient GitHub 5xx errors with exponential backoff.
 */

const TARGET_TAG = process.env.RELEASE_TAG || "v0.2.0";
const ARTIFACTS_DIR = path.resolve(process.cwd(), "mobile/artifacts");

interface AssetToUpload {
  name: string;
  path: string;
  required: boolean;
}

const ASSETS: AssetToUpload[] = [
  { name: "open-verse-mobile.apk", path: path.join(ARTIFACTS_DIR, "open-verse-mobile.apk"), required: true },
  { name: "open-verse-mobile.apk.sha256", path: path.join(ARTIFACTS_DIR, "open-verse-mobile.apk.sha256"), required: true },
  { name: "open-verse-mobile.aab", path: path.join(ARTIFACTS_DIR, "open-verse-mobile.aab"), required: false },
  { name: "open-verse-mobile.aab.sha256", path: path.join(ARTIFACTS_DIR, "open-verse-mobile.aab.sha256"), required: false },
];

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function runCommand(cmd: string): string {
  return execSync(cmd, { encoding: "utf-8", stdio: ["pipe", "pipe", "pipe"] }).trim();
}

async function uploadWithRetry(tag: string, filePath: string, fileName: string, maxRetries = 3): Promise<void> {
  const localSize = statSync(filePath).size;
  console.log(`Checking asset ${fileName} (${localSize} bytes) for release ${tag}...`);

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // 1. Check if release exists
      runCommand(`gh release view "${tag}" > /dev/null 2>&1`);

      // 2. Fetch existing release asset list
      const rawAssets = runCommand(`gh release view "${tag}" --json assets -q .assets`);
      const assets = JSON.parse(rawAssets) as Array<{ name: string; size: number; id: string }>;
      const existing = assets.find((a) => a.name === fileName);

      if (existing) {
        if (existing.size === localSize) {
          console.log(`✓ ${fileName} already uploaded with matching size (${localSize} bytes). Skipping.`);
          return;
        }
        console.log(`Existing ${fileName} size mismatch (${existing.size} vs local ${localSize}). Replacing...`);
        try {
          runCommand(`gh release delete-asset "${tag}" "${fileName}" -y`);
          await sleep(1500);
        } catch (delErr) {
          console.warn(`Warning deleting existing asset: ${String(delErr)}`);
        }
      }

      // 3. Upload asset
      console.log(`Uploading ${fileName} (attempt ${attempt}/${maxRetries})...`);
      runCommand(`gh release upload "${tag}" "${filePath}" --clobber`);

      // 4. Verify post-upload
      await sleep(1000);
      const postCheck = runCommand(`gh release view "${tag}" --json assets -q .assets`);
      const updatedAssets = JSON.parse(postCheck) as Array<{ name: string; size: number }>;
      const verified = updatedAssets.find((a) => a.name === fileName);

      if (!verified) {
        throw new Error(`Asset ${fileName} not found on release ${tag} after upload.`);
      }

      console.log(`✓ Successfully verified ${fileName} on ${tag} (${verified.size} bytes).`);
      return;
    } catch (error) {
      console.error(`Attempt ${attempt} failed for ${fileName}:`, error instanceof Error ? error.message : String(error));
      if (attempt < maxRetries) {
        const backoffMs = attempt * 2500;
        console.log(`Waiting ${backoffMs}ms before retry...`);
        await sleep(backoffMs);
      } else {
        throw new Error(`Failed to publish ${fileName} to ${tag} after ${maxRetries} attempts.`);
      }
    }
  }
}

async function main() {
  console.log(`=== Publishing Android Deliverables to GitHub Release [${TARGET_TAG}] ===`);

  if (!process.env.GITHUB_TOKEN) {
    throw new Error("GITHUB_TOKEN environment variable is required.");
  }

  for (const asset of ASSETS) {
    if (!existsSync(asset.path)) {
      if (asset.required) {
        throw new Error(`Required asset not found on disk: ${asset.path}`);
      }
      console.log(`Optional asset missing, skipping: ${asset.name}`);
      continue;
    }

    await uploadWithRetry(TARGET_TAG, asset.path, asset.name);
  }

  console.log(`=== Android Release Publication Complete & Verified ===`);
}

main().catch((err) => {
  console.error("FATAL: Release publication failed:", err);
  process.exit(1);
});

