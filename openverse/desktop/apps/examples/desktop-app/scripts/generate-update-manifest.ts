import { existsSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

// Generates and validates the Tauri v2 latest.json update manifest.
const APP_ROOT = fileURLToPath(new URL("..", import.meta.url));
const NSIS_DIR = path.join(APP_ROOT, "src-tauri", "target", "release", "bundle", "nsis");
const DEB_DIR = path.join(APP_ROOT, "src-tauri", "target", "release", "bundle", "deb");

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
	const platforms: Record<string, ManifestPlatform> = {};

	// Windows NSIS
	if (existsSync(NSIS_DIR)) {
		const files = readdirSync(NSIS_DIR);
		const zipFile =
			files.find((f) => f.endsWith(".nsis.zip")) ??
			files.find((f) => f.endsWith(".zip") && !f.endsWith(".sig")) ??
			files.find((f) => f.endsWith("-setup.exe"));
		const sigFile =
			files.find((f) => f.endsWith(".nsis.zip.sig")) ??
			files.find((f) => f.endsWith(".zip.sig")) ??
			files.find((f) => f.endsWith("-setup.exe.sig"));

		if (zipFile && sigFile) {
			const signature = readFileSync(path.join(NSIS_DIR, sigFile), "utf8").trim();
			platforms["windows-x86_64"] = {
				signature,
				url: `https://github.com/${repo}/releases/download/${releaseTag}/${zipFile}`,
			};
		}
	}

	// Linux DEB
	if (existsSync(DEB_DIR)) {
		const files = readdirSync(DEB_DIR);
		const debFile = files.find((f) => f.endsWith(".deb") && !f.endsWith(".sig"));
		const sigFile = files.find((f) => f.endsWith(".deb.sig"));

		if (debFile && sigFile) {
			const signature = readFileSync(path.join(DEB_DIR, sigFile), "utf8").trim();
			platforms["linux-x86_64"] = {
				signature,
				url: `https://github.com/${repo}/releases/download/${releaseTag}/${debFile}`,
			};
		}
	}

	if (Object.keys(platforms).length === 0) {
		throw new Error(`No updater artifacts found in ${NSIS_DIR} or ${DEB_DIR}`);
	}

	const manifest: UpdateManifest = {
		version: version.startsWith("v") ? version : `v${version}`,
		notes,
		pub_date: new Date().toISOString(),
		platforms,
	};

	const outDir = existsSync(NSIS_DIR) ? NSIS_DIR : APP_ROOT;
	const manifestPath = path.join(outDir, "latest.json");
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
