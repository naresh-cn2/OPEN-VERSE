/**
 * OPEN-VERSE Unified Cross-Platform Update Client
 *
 * Supports:
 * - Android in-app APK download & package installer prompt
 * - Desktop (Windows, macOS, Linux) Tauri v2 updater integration
 * - iOS TestFlight / App Store redirect
 * - Web app stale-session detection & reload prompt
 */

export interface UpdatePlatformInfo {
	version: string;
	url?: string;
	signature?: string;
	sha256?: string;
	versionCode?: number;
	testFlightUrl?: string;
	appStoreUrl?: string;
}

export interface UnifiedReleaseInfo {
	version: string;
	releaseDate: string;
	channel: "stable" | "beta" | "nightly";
	mandatory: boolean;
	releaseNotes: string;
	platforms: {
		"windows-x86_64"?: UpdatePlatformInfo;
		"darwin-aarch64"?: UpdatePlatformInfo;
		"darwin-x86_64"?: UpdatePlatformInfo;
		"linux-x86_64"?: UpdatePlatformInfo;
		android?: UpdatePlatformInfo;
		ios?: UpdatePlatformInfo;
		web?: { version: string; deployedAt: string };
	};
}

export interface UpdateCheckResult {
	updateAvailable: boolean;
	currentVersion: string;
	latestVersion: string;
	mandatory: boolean;
	releaseNotes: string;
	downloadUrl?: string;
	platform: "android" | "desktop-windows" | "desktop-mac" | "desktop-linux" | "ios" | "web";
	manifest?: UnifiedReleaseInfo;
}

export const CURRENT_APP_VERSION = "0.2.3";

export function detectPlatform(): UpdateCheckResult["platform"] {
	if (typeof window === "undefined") return "web";

	// 1. Android Native Webview
	if (
		(window as any).AndroidInterface ||
		navigator.userAgent.includes("OPEN-VERSE-Mobile") ||
		/android/i.test(navigator.userAgent)
	) {
		return "android";
	}

	// 2. iOS Native Webview / Device
	if (
		/iPad|iPhone|iPod/.test(navigator.userAgent) &&
		!(window as any).MSStream
	) {
		return "ios";
	}

	// 3. Tauri Desktop
	if ((window as any).__TAURI_INTERNALS__ || (window as any).__TAURI__) {
		const ua = navigator.userAgent.toLowerCase();
		if (ua.includes("mac") || ua.includes("darwin")) return "desktop-mac";
		if (ua.includes("linux")) return "desktop-linux";
		return "desktop-windows";
	}

	// 4. Standard Web Browser
	return "web";
}

/**
 * Compare two semver strings (e.g. "0.2.0" vs "0.2.1")
 * Returns > 0 if v2 is greater than v1
 */
export function compareVersions(v1: string, v2: string): number {
	const clean = (v: string) => v.replace(/^v/, "").trim();
	const parts1 = clean(v1).split(".").map((n) => parseInt(n, 10) || 0);
	const parts2 = clean(v2).split(".").map((n) => parseInt(n, 10) || 0);

	for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
		const p1 = parts1[i] ?? 0;
		const p2 = parts2[i] ?? 0;
		if (p2 > p1) return 1;
		if (p2 < p1) return -1;
	}
	return 0;
}

/**
 * Fetch release manifest from primary or fallback endpoints
 */
export async function fetchReleaseManifest(): Promise<UnifiedReleaseInfo> {
	const endpoints = [
		"https://open-verse-website.vercel.app/api/releases/latest",
		"https://open-verse-website.vercel.app/open-verse-releases.json",
		"https://raw.githubusercontent.com/naresh-cn2/OPEN-VERSE/main/website/public/open-verse-releases.json",
	];

	for (const ep of endpoints) {
		try {
			const controller = new AbortController();
			const timeoutId = setTimeout(() => controller.abort(), 6000);
			const res = await fetch(ep, {
				headers: { Accept: "application/json" },
				cache: "no-store",
				signal: controller.signal,
			});
			clearTimeout(timeoutId);
			if (res.ok) {
				const data = (await res.json()) as UnifiedReleaseInfo;
				if (data && data.version) {
					return data;
				}
			}
		} catch {
			// Try next endpoint
		}
	}

	throw new Error("Unable to reach OPEN-VERSE release update servers.");
}

/**
 * Check if an update is available for current client
 */
export async function checkForAppUpdate(): Promise<UpdateCheckResult> {
	const platform = detectPlatform();
	let currentVer = CURRENT_APP_VERSION;
	let currentVersionCode: number | null = null;

	// In Android, try reading live installed app version & versionCode from native PackageManager
	if (typeof window !== "undefined" && (window as any).AndroidInterface?.getAppVersion) {
		try {
			const nativeVer = (window as any).AndroidInterface.getAppVersion();
			if (nativeVer) currentVer = nativeVer;
		} catch {}
	}
	if (typeof window !== "undefined" && (window as any).AndroidInterface?.getAppVersionCode) {
		try {
			const nativeCode = Number((window as any).AndroidInterface.getAppVersionCode());
			if (Number.isFinite(nativeCode) && nativeCode > 0) currentVersionCode = nativeCode;
		} catch {}
	}

	const manifest = await fetchReleaseManifest();
	const latestVer = manifest.version;
	let isHigher = compareVersions(currentVer, latestVer) > 0;

	// In Android, if manifest specifies versionCode and we have native versionCode, also verify code
	if (platform === "android" && manifest.platforms.android?.versionCode && currentVersionCode !== null) {
		if (currentVersionCode >= manifest.platforms.android.versionCode) {
			isHigher = false;
		}
	}

	// Prevent loop if current version matches or exceeds latest
	if (compareVersions(currentVer, latestVer) <= 0 && isHigher === false) {
		isHigher = false;
	}

	let downloadUrl: string | undefined;

	switch (platform) {
		case "android":
			downloadUrl =
				manifest.platforms.android?.url ||
				"https://open-verse-website.vercel.app/open-verse-mobile.apk";
			break;
		case "desktop-windows":
			downloadUrl = manifest.platforms["windows-x86_64"]?.url;
			break;
		case "desktop-mac":
			downloadUrl =
				manifest.platforms["darwin-aarch64"]?.url ||
				manifest.platforms["darwin-x86_64"]?.url;
			break;
		case "desktop-linux":
			downloadUrl = manifest.platforms["linux-x86_64"]?.url;
			break;
		case "ios":
			downloadUrl =
				manifest.platforms.ios?.testFlightUrl ||
				manifest.platforms.ios?.appStoreUrl;
			break;
		case "web":
			downloadUrl = "https://open-verse-website.vercel.app";
			break;
	}

	return {
		updateAvailable: isHigher,
		currentVersion: currentVer,
		latestVersion: latestVer,
		mandatory: Boolean(manifest.mandatory),
		releaseNotes: manifest.releaseNotes || "Performance improvements and bug fixes.",
		downloadUrl,
		platform,
		manifest,
	};
}

/**
 * Perform installation based on platform
 */
export async function installAvailableUpdate(
	info: UpdateCheckResult,
): Promise<{ success: boolean; message: string }> {
	if (!info.downloadUrl) {
		throw new Error("No download URL available for this platform.");
	}

	// 1. Android: Trigger verified native PackageInstaller bridge with checksum & versionCode
	if (
		typeof window !== "undefined" &&
		(window as any).AndroidInterface?.downloadAndInstallApk
	) {
		const androidPlatform = info.manifest?.platforms?.android;
		const sha256 = androidPlatform?.sha256;
		const versionCode = androidPlatform?.versionCode || 0;

		if (sha256 && typeof (window as any).AndroidInterface.downloadAndInstallApkWithChecksum === "function") {
			(window as any).AndroidInterface.downloadAndInstallApkWithChecksum(info.downloadUrl, sha256, versionCode);
		} else {
			(window as any).AndroidInterface.downloadAndInstallApk(info.downloadUrl);
		}
		return {
			success: true,
			message: "Downloading update. You will be prompted to confirm installation.",
		};
	}

	// 2. Tauri Desktop
	if (
		typeof window !== "undefined" &&
		((window as any).__TAURI_INTERNALS__ || (window as any).__TAURI__)
	) {
		try {
			// Call Tauri's built-in check_for_update_now command
			const { invoke } = await import("@tauri-apps/api/core");
			await invoke("check_for_update_now");
			return {
				success: true,
				message: "Update download initiated via desktop updater.",
			};
		} catch {
			// Fallback: open browser release download
			window.open(info.downloadUrl, "_blank");
			return {
				success: true,
				message: "Opening browser to download the latest desktop installer.",
			};
		}
	}

	// 3. iOS: Open TestFlight or App Store
	if (info.platform === "ios") {
		window.open(info.downloadUrl, "_blank");
		return {
			success: true,
			message: "Opening TestFlight / App Store to update OPEN-VERSE.",
		};
	}

	// 4. Web Browser: Reload to fetch newest deployed assets
	if (info.platform === "web") {
		if (typeof window !== "undefined") {
			window.location.reload();
		}
		return {
			success: true,
			message: "Reloading application...",
		};
	}

	// Fallback for any other environment
	if (typeof window !== "undefined") {
		window.open(info.downloadUrl, "_blank");
	}
	return {
		success: true,
		message: "Opening update package.",
	};
}

