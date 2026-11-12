/**
 * OPEN-VERSE Cross-Device Updater Repair Test Suite
 *
 * Verifies:
 * 1. Windows: Fix for the Tauri updater restart loop
 *    - NSIS pre-install and pre-uninstall hooks check file existence before RestartManager registration
 *    - Legacy executables (cline-app.exe, code-sidecar.exe) are safely stopped and purged
 *    - latest.json manifest matches signed v0.2.2 installer
 * 2. Android: Fix for physical device update delivery
 *    - AndroidManifest.xml contains <queries> for package installer
 *    - FileProvider Uri uses Intent.FLAG_GRANT_READ_URI_PERMISSION + clipData
 *    - Loop prevention: archiveVersionCode == currentCode suppresses re-downloading
 *    - No hardcoded v0.2.0 in desktopClient or native bridge
 *    - APK checksum strictly matches release manifest
 * 3. Cross-Platform Manifest Consistency
 *    - Website, API, and package metadata all agree on v0.2.2
 */

import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createHash } from "node:crypto";
import { compareVersions } from "../desktop/apps/examples/desktop-app/webview/lib/open-verse-updater";

const ROOT = resolve(__dirname, "..");

function computeSha256(filePath: string): string {
	const buffer = readFileSync(filePath);
	return createHash("sha256").update(buffer).digest("hex");
}

let passedTests = 0;
let totalTests = 0;

function assert(condition: boolean, testName: string, details?: string) {
	totalTests++;
	if (!condition) {
		console.error(`  ❌ [FAIL] ${testName}`);
		if (details) console.error(`     Details: ${details}`);
		throw new Error(`Assertion failed for: ${testName}`);
	}
	passedTests++;
	console.log(`  ✅ [PASS] ${testName}${details ? ` (${details})` : ""}`);
}

async function runSuite() {
	console.log("\n==================================================================");
	console.log("   OPEN-VERSE CROSS-DEVICE UPDATER REPAIR TEST SUITE");
	console.log("==================================================================\n");

	// --- 1. WINDOWS TAURI UPDATER LIFECYCLE ---
	console.log("--- 1. Windows Tauri Updater Lifecycle & Restart Loop Fix ---");
	const nsisHookPath = resolve(ROOT, "desktop/apps/examples/desktop-app/src-tauri/nsis/installer-hooks.nsh");
	assert(existsSync(nsisHookPath), "NSIS hook file exists");

	const hookContent = readFileSync(nsisHookPath, "utf8");

	// Check conditional existence guard
	assert(
		hookContent.includes('${If} ${FileExists} "$INSTDIR\\${MAINBINARYNAME}.exe"') &&
		hookContent.includes('${If} ${FileExists} "$INSTDIR\\OPEN-VERSE.exe"') &&
		hookContent.includes('${If} ${FileExists} "$INSTDIR\\cline-app.exe"') &&
		hookContent.includes('${If} ${FileExists} "$INSTDIR\\code-sidecar.exe"'),
		"NSIS hook guards RestartManager_RegisterFile with FileExists",
		"Non-existent executables do not trigger ERROR_FILE_NOT_FOUND abort"
	);

	// Check legacy executable cleanup
	assert(
		hookContent.includes('Delete "$INSTDIR\\code-sidecar.exe"') &&
		hookContent.includes('Delete "$INSTDIR\\cline-app.exe"'),
		"NSIS hook cleans up legacy cline-app.exe and code-sidecar.exe binaries"
	);

	// Check latest.json updater manifest
	const releasesJsonPath = resolve(ROOT, "website/public/open-verse-releases.json");
	assert(existsSync(releasesJsonPath), "open-verse-releases.json exists");
	const releasesData = JSON.parse(readFileSync(releasesJsonPath, "utf8"));
	assert(
		releasesData.version === "0.2.3" &&
		releasesData.platforms["windows-x86_64"]?.url?.includes("OPEN-VERSE_0.2.3_x64-setup.exe") &&
		releasesData.platforms["windows-x86_64"]?.sha256 === "7d32a4ba94e3b25152356f46e34a439839e6055cc8b4130d0a5fe4065a0e53bc" &&
		Boolean(releasesData.platforms["windows-x86_64"]?.signature),
		"Windows x86_64 update metadata points to signed v0.2.3 installer with verified sha256"
	);

	// --- 2. ANDROID PHYSICAL DEVICE UPDATE DELIVERY ---
	console.log("\n--- 2. Android Physical Device Update Delivery ---");
	const manifestXmlPath = resolve(ROOT, "mobile/android/app/src/main/AndroidManifest.xml");
	assert(existsSync(manifestXmlPath), "AndroidManifest.xml exists");
	const manifestXml = readFileSync(manifestXmlPath, "utf8");

	// Check <queries> for package installer visibility
	assert(
		manifestXml.includes("<queries>") &&
		manifestXml.includes("android.intent.action.VIEW") &&
		manifestXml.includes("application/vnd.android.package-archive"),
		"AndroidManifest.xml includes <queries> for package installer",
		"Required for Android 11+ (API 30+) package visibility"
	);

	// Check OpenVerseWebAppInterface
	const webAppInterfacePath = resolve(ROOT, "mobile/android/app/src/main/java/ai/openverse/mobile/OpenVerseWebAppInterface.kt");
	assert(existsSync(webAppInterfacePath), "OpenVerseWebAppInterface.kt exists");
	const interfaceContent = readFileSync(webAppInterfacePath, "utf8");

	// Verify intent flags and clipData
	assert(
		interfaceContent.includes("clipData = android.content.ClipData.newRawUri") &&
		interfaceContent.includes("Intent.FLAG_GRANT_READ_URI_PERMISSION") &&
		interfaceContent.includes("Intent.FLAG_GRANT_PREFIX_URI_PERMISSION"),
		"launchApkInstaller configures clipData and grant read URI permissions",
		"Supports modern Samsung/Pixel/Xiaomi PackageInstaller security models"
	);

	// Verify explicit permission grants
	assert(
		interfaceContent.includes("com.google.android.packageinstaller") &&
		interfaceContent.includes("com.android.packageinstaller"),
		"launchApkInstaller explicitly grants read URI permission to standard system installers"
	);

	// Verify loop prevention logic (versionCode comparison)
	assert(
		interfaceContent.includes("archiveVersionCode == currentCode") &&
		interfaceContent.includes("is already up to date"),
		"OpenVerseWebAppInterface suppresses update loop if archive version matches installed",
		"Prevents infinite download cycle on phones already on latest version"
	);

	// Verify dynamic version detection in desktopClient (no hardcoded v0.2.0)
	const desktopClientPath = resolve(ROOT, "desktop/apps/examples/desktop-app/webview/lib/desktop-client.ts");
	assert(existsSync(desktopClientPath), "desktop-client.ts exists");
	const desktopClientContent = readFileSync(desktopClientPath, "utf8");
	assert(
		!desktopClientContent.includes("https://github.com/naresh-cn2/OPEN-VERSE/releases/download/v0.2.0/open-verse-mobile.apk"),
		"desktopClient no longer downloads hardcoded v0.2.0 APK in restart_to_apply_update"
	);
	assert(
		desktopClientContent.includes("AndroidInterface.getAppVersion"),
		"desktopClient dynamically queries native AndroidInterface for running version"
	);

	// --- 3. BINARY ARTIFACT INTEGRITY & MANIFEST AGREEMENT ---
	console.log("\n--- 3. Binary Artifact Integrity & Manifest Agreement ---");
	const mobileApkPath = resolve(ROOT, "mobile/artifacts/open-verse-mobile.apk");
	assert(existsSync(mobileApkPath), "Built release APK exists in mobile/artifacts");

	const apkHash = computeSha256(mobileApkPath);
	assert(
		releasesData.platforms.android?.sha256?.toLowerCase() === apkHash.toLowerCase(),
		"open-verse-releases.json SHA-256 matches actual built APK artifact",
		`SHA-256: ${apkHash}`
	);

	const websiteReleasesTs = resolve(ROOT, "website/api/releases/latest.ts");
	const websiteReleasesTsContent = readFileSync(websiteReleasesTs, "utf8");
	assert(
		websiteReleasesTsContent.includes(apkHash),
		"website/api/releases/latest.ts delivers verified APK SHA-256"
	);

	const downloadCenterTsx = resolve(ROOT, "website/src/components/DownloadCenter.tsx");
	const downloadCenterContent = readFileSync(downloadCenterTsx, "utf8");
	assert(
		downloadCenterContent.includes(apkHash),
		"Website DownloadCenter delivers verified APK SHA-256"
	);

	// Compare versions logic
	assert(compareVersions("0.2.0", "0.2.3") > 0, "compareVersions recognizes 0.2.3 is newer than 0.2.0");
	assert(compareVersions("0.2.2", "0.2.3") > 0, "compareVersions recognizes 0.2.3 is newer than 0.2.2");
	assert(compareVersions("0.2.3", "0.2.3") === 0, "compareVersions recognizes 0.2.3 matches 0.2.3");

	console.log("\n==================================================================");
	console.log(`  ALL UPDATER REPAIR TESTS PASSED: ${passedTests}/${totalTests} (100% SUCCESS)`);
	console.log("==================================================================\n");
}

runSuite().catch((err) => {
	console.error("\n❌ Test Suite Failed:", err);
	process.exit(1);
});

