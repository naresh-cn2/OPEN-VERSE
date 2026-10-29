import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { generateManifest } from "./generate-update-manifest";

describe("generate-update-manifest", () => {
	const nsisDir = fileURLToPath(new URL("../src-tauri/target/release/bundle/nsis", import.meta.url));

	beforeEach(() => {
		mkdirSync(nsisDir, { recursive: true });
		writeFileSync(path.join(nsisDir, "OPEN-VERSE_0.1.0_x64_en-US.nsis.zip"), "mock-zip-content");
		writeFileSync(path.join(nsisDir, "OPEN-VERSE_0.1.0_x64_en-US.nsis.zip.sig"), "mock-signature-base64");
	});

	afterEach(() => {
		try {
			rmSync(nsisDir, { recursive: true, force: true });
		} catch {}
	});

	it("generates a valid Tauri v2 latest.json manifest", () => {
		const manifest = generateManifest("0.1.0", "naresh-cn2/OPEN-VERSE", "v0.1.0", "Test release notes");

		expect(manifest.version).toBe("v0.1.0");
		expect(manifest.notes).toBe("Test release notes");
		expect(manifest.platforms["windows-x86_64"].signature).toBe("mock-signature-base64");
		expect(manifest.platforms["windows-x86_64"].url).toBe(
			"https://github.com/naresh-cn2/OPEN-VERSE/releases/download/v0.1.0/OPEN-VERSE_0.1.0_x64_en-US.nsis.zip",
		);

		const written = JSON.parse(readFileSync(path.join(nsisDir, "latest.json"), "utf8"));
		expect(written.version).toBe("v0.1.0");
		expect(written.platforms["windows-x86_64"].signature).toBe("mock-signature-base64");
	});
});
