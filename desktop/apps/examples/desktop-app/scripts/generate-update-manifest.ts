import { existsSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

// Generates and validates the Tauri v2 latest.json update manifest.
const APP_ROOT = fileURLToPath(new URL("..", import.meta.url));
const NSIS_DIR = path.join(APP_ROOT, "src-tauri", "target", "release", "bundle", "nsis");

interface ManifestPlatform {
	signature: string;
	url: string;
}

interface UpdateManifest {
	version: string;
	notes: string;
	pub_date: string;
	platforms: Record<string, ManifestPlatform>;
}

export function generateManifest(
	version: string,
	repo: string,
	releaseTag: string,
	notes = `OPEN-VERSE v${version} update`,
): UpdateManifest {
	if (!existsSync(NSIS_DIR)) {
		throw new Error(`NSIS directory does not exist: ${NSIS_DIR}`);
	}

	const files = readdirSync(NSIS_DIR);
	const zipFile = files.find((f) => f.endsWith(".nsis.zip") || (f.endsWith(".zip") && !f.endsWith(".sig")));
	const sigFile = files.find((f) => f.endsWith(".nsis.zip.sig") || f.endsWith(".zip.sig"));

	if (!zipFile) {
		throw new Error(`No updater zip archive found in ${NSIS_DIR}`);
	}
	if (!sigFile) {
		throw new Error(`No signature file (.sig) found for updater zip in ${NSIS_DIR}`);
	}

	const signature = readFileSync(path.join(NSIS_DIR, sigFile), "utf8").trim();
	const downloadUrl = `https://github.com/${repo}/releases/download/${releaseTag}/${zipFile}`;

	const manifest: UpdateManifest = {
		version: version.startsWith("v") ? version : `v${version}`,
		notes,
		pub_date: new Date().toISOString(),
		platforms: {
			"windows-x86_64": {
				signature,
				url: downloadUrl,
			},
		},
	};

	const manifestPath = path.join(NSIS_DIR, "latest.json");
	writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), "utf8");
	console.log(`Generated updater manifest at: ${manifestPath}`);
	console.log(JSON.stringify(manifest, null, 2));

	return manifest;
}

if (import.meta.main) {
	const version = process.argv[2] || "0.1.0";
	const repo = process.env.GITHUB_REPOSITORY || "naresh-cn2/OPEN-VERSE";
	const releaseTag = process.argv[3] || `v${version}`;
	const notes = process.argv[4] || `OPEN-VERSE v${version} release`;

	try {
		generateManifest(version, repo, releaseTag, notes);
	} catch (error) {
		console.error("Failed to generate update manifest:", error);
		process.exit(1);
	}
}
