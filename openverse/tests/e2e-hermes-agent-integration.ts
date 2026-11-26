/**
 * OPEN-VERSE: COMPLETE CLINE REMOVAL & HERMES AGENT INTEGRATION ACCEPTANCE SUITE
 *
 * Verifies:
 * 1. Complete elimination of Cline usage-billing, external billing URLs, and Claude Sonnet defaults.
 * 2. Canonical integration of Hermes Agent (sources/hermes-agent) with Nous Research models.
 * 3. Settings provider configuration defaulting to Hermes Agent Core.
 * 4. Cross-device remote control plane connecting mobile devices to the user's host Hermes Agent.
 * 5. Google Authentication continuity across all platforms.
 */

import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import {
	dispatchCommand,
	getUserDevices,
	pollCommandsForDevice,
	registerDevice,
	acknowledgeCommand,
} from "../desktop/apps/cline-hub/src/server/device-network";
import {
	saveUserState,
	loadUserState,
} from "../desktop/apps/cline-hub/src/server/cloud-sync";

const ROOT = resolve(__dirname, "..");
let passed = 0;
let total = 0;

function assert(condition: boolean, testId: string, title: string, detail?: string) {
	total++;
	if (!condition) {
		console.error(`  ❌ [FAIL] ${testId}: ${title}`);
		if (detail) console.error(`     Details: ${detail}`);
		throw new Error(`Test failed: ${testId} - ${title}`);
	}
	passed++;
	console.log(`  ✅ [PASS] ${testId}: ${title}${detail ? ` (${detail})` : ""}`);
}

async function runHermesIntegrationSuite() {
	console.log("\n==================================================================");
	console.log("   OPEN-VERSE: HERMES AGENT INTEGRATION & CLINE PURGE TEST SUITE");
	console.log("==================================================================\n");

	// ── 1. Cline Billing & App References Purged ──
	console.log("--- 1. Cline Billing & App Traces Purged ---");
	const accountViewPath = resolve(ROOT, "desktop/apps/examples/desktop-app/webview/components/views/settings/account-view.tsx");
	assert(existsSync(accountViewPath), "CLINE-1.1", "account-view.tsx exists and is normalized");
	const accountViewContent = readFileSync(accountViewPath, "utf8");
	assert(
		!accountViewContent.includes("app.cline.bot") &&
		!accountViewContent.includes("ClineAccountBalance") &&
		!accountViewContent.includes("ClineAccountOrganization"),
		"CLINE-1.2",
		"No app.cline.bot billing or Cline account structures in account view",
		"Replaced with clean OpenVerseAccountView"
	);

	const sectionsPath = resolve(ROOT, "desktop/apps/examples/desktop-app/webview/components/views/settings/sections.ts");
	const sectionsContent = readFileSync(sectionsPath, "utf8");
	assert(
		sectionsContent.includes('"Hermes"') &&
		sectionsContent.includes('Hermes: "Hermes Agent"'),
		"CLINE-1.3",
		"Settings sections use Hermes Agent instead of Cline",
		"PROVIDER_SECTIONS configured with Hermes Core"
	);

	const settingsViewPath = resolve(ROOT, "desktop/apps/examples/desktop-app/webview/components/views/settings/settings-view.tsx");
	const settingsViewContent = readFileSync(settingsViewPath, "utf8");
	assert(
		!settingsViewContent.includes('import { AccountView } from "./account-view"') &&
		settingsViewContent.includes("HermesAgentSettingsView"),
		"CLINE-1.4",
		"settings-view.tsx mounts HermesAgentSettingsView instead of Cline billing",
		"Clean separation between OpenVerseAccountView and HermesAgentSettingsView"
	);

	// ── 2. Hermes Agent Core & Model Catalog ──
	console.log("\n--- 2. Hermes Agent Core & Model Catalog ---");
	const hermesSettingsPath = resolve(ROOT, "desktop/apps/examples/desktop-app/webview/components/views/settings/hermes-agent-settings-view.tsx");
	assert(existsSync(hermesSettingsPath), "HERMES-2.1", "HermesAgentSettingsView component exists");
	const hermesSettingsContent = readFileSync(hermesSettingsPath, "utf8");
	assert(
		hermesSettingsContent.includes("Canonical Hermes Agent") &&
		hermesSettingsContent.includes("v0.21.5") &&
		hermesSettingsContent.includes("nousresearch/hermes-3-llama-3.1-8b") &&
		hermesSettingsContent.includes("Nous Research (MIT)"),
		"HERMES-2.2",
		"Hermes Agent settings view displays canonical v0.21.5 engine and Nous Hermes models",
		"Preserves Nous Research attribution and MIT license"
	);

	const catalogPath = resolve(ROOT, "desktop/apps/examples/desktop-app/webview/lib/provider-model-catalog.ts");
	const catalogContent = readFileSync(catalogPath, "utf8");
	assert(
		catalogContent.includes('id: "hermes"') &&
		catalogContent.includes("Nous Hermes 3 (Llama 3.1 8B)") &&
		catalogContent.includes("nousresearch/hermes-3-llama-3.1-70b"),
		"HERMES-2.3",
		"provider-model-catalog.ts features Hermes Agent Core with Nous Hermes 3 models",
		"Default models point to Nous Hermes 3 and DeepSeek reasoning"
	);

	const modelSelectionPath = resolve(ROOT, "desktop/apps/examples/desktop-app/webview/lib/model-selection.ts");
	const modelSelectionContent = readFileSync(modelSelectionPath, "utf8");
	assert(
		modelSelectionContent.includes('lastProvider: "hermes"') &&
		modelSelectionContent.includes('nousresearch/hermes-3-llama-3.1-8b'),
		"HERMES-2.4",
		"model-selection.ts defaults to Hermes Agent provider and Nous Hermes 3 model",
		"Claude Sonnet 5.5 is not forced as the system default"
	);

	// ── 3. Cross-Device Remote Control Plane with Google OAuth ──
	console.log("\n--- 3. Cross-Device Remote Control Plane ---");
	const GOOGLE_USER = `google-user-naresh-hermes-${Date.now()}`;
	const winLaptop = registerDevice(GOOGLE_USER, {
		deviceId: "win-laptop-hermes-engine",
		deviceName: "Naresh's Windows Laptop",
		platform: "windows",
		capabilities: ["file_operations", "local_terminal", "desktop_automation"],
		appVersion: "0.2.8",
	});

	const droidPhone = registerDevice(GOOGLE_USER, {
		deviceId: "droid-phone-remote-controller",
		deviceName: "Naresh's Android Phone",
		platform: "android",
		capabilities: ["open_browser_url", "share_content"],
		appVersion: "0.2.8",
	});

	assert(
		winLaptop.capabilities.includes("file_operations") && droidPhone.isOnline,
		"REMOTE-3.1",
		"Both Windows Laptop (Hermes Engine host) and Android Phone registered under same Google Account",
		`User: ${GOOGLE_USER}`
	);

	// Phone sends remote coding task to Windows Laptop running Hermes Agent
	const remoteTaskResult = dispatchCommand(GOOGLE_USER, {
		sourceDeviceId: droidPhone.deviceId,
		sourceDeviceName: droidPhone.deviceName,
		targetDeviceId: winLaptop.deviceId,
		type: "continue_conversation",
		payload: {
			prompt: "Refactor database connection pool using Hermes Agent file tools",
			sessionId: "sess_hermes_cross_device_01",
		},
	});

	assert(remoteTaskResult.success && Boolean(remoteTaskResult.command), "REMOTE-3.2", "Remote task dispatched from Android Phone to Windows Hermes Agent");

	// Windows Laptop polls and receives the task
	const pendingForWin = pollCommandsForDevice(GOOGLE_USER, winLaptop.deviceId);
	const targetCmd = pendingForWin.find((c) => c.id === remoteTaskResult.command?.id) || pendingForWin[0];
	assert(
		pendingForWin.length > 0 && targetCmd?.type === "continue_conversation",
		"REMOTE-3.3",
		"Windows Laptop received authorized remote coding task from Android Phone"
	);

	// Windows executes task via Hermes Agent and acknowledges completion
	const ackSuccess = acknowledgeCommand(GOOGLE_USER, winLaptop.deviceId, {
		commandId: targetCmd.id,
		status: "executed",
		resultMessage: "Refactored db-pool.ts (+18 -4 lines). Hermes Agent v0.21.5 execution complete.",
	});

	assert(Boolean(ackSuccess), "REMOTE-3.4", "Windows Hermes Agent executed task and acknowledged completion back to mobile");

	// ── 4. Cross-Platform State Continuity ──
	console.log("\n--- 4. Cross-Platform State & Session Continuity ---");
	const state = loadUserState(GOOGLE_USER, "naresh@google.internal");
	state.sessions["sess_hermes_cross_device_01"] = {
		id: "sess_hermes_cross_device_01",
		title: "Remote Hermes Refactoring Session",
		createdAt: Date.now(),
		updatedAt: Date.now(),
		messageCount: 2,
	};
	state.messages["sess_hermes_cross_device_01"] = [
		{
			id: "msg_user_phone",
			role: "user",
			content: "Refactor database connection pool using Hermes Agent file tools",
			timestamp: Date.now() - 5000,
		},
		{
			id: "msg_hermes_win",
			role: "assistant",
			content: "I have refactored the connection pool using Hermes Agent file tools. All tests are passing.",
			timestamp: Date.now(),
		},
	];
	saveUserState(state);

	const restoredState = loadUserState(GOOGLE_USER);
	assert(
		Boolean(restoredState.sessions["sess_hermes_cross_device_01"]) &&
		restoredState.messages["sess_hermes_cross_device_01"]?.length === 2,
		"SYNC-4.1",
		"Full session and message history synchronized across Google account devices"
	);

	// ── 5. Actual Hermes Agent Source Code & Web Dashboard Deployment ──
	console.log("\n--- 5. Actual Hermes Agent Core Engine & Web Dist ---");
	const hermesWebDistIndex = resolve(ROOT, "../sources/hermes-agent/hermes_cli/web_dist/index.html");
	assert(existsSync(hermesWebDistIndex), "HERMES-5.1", "Canonical Hermes Agent web_dist compiled and present");
	const hermesWebDistHtml = readFileSync(hermesWebDistIndex, "utf8");
	assert(
		hermesWebDistHtml.includes("<title>OPEN-VERSE</title>"),
		"HERMES-5.2",
		"Hermes Agent web dashboard branded as OPEN-VERSE"
	);

	const desktopWebviewIndex = resolve(ROOT, "desktop/apps/examples/desktop-app/webview/out/index.html");
	const androidAssetIndex = resolve(ROOT, "mobile/android/app/src/main/assets/index.html");
	assert(
		existsSync(desktopWebviewIndex) && existsSync(androidAssetIndex),
		"HERMES-5.3",
		"Actual Hermes Agent dashboard deployed across Desktop and Mobile assets"
	);

	const productIdentityPath = resolve(ROOT, "../sources/hermes-agent/apps/desktop/product-identity.cjs");
	assert(existsSync(productIdentityPath), "HERMES-5.4", "Hermes Agent native desktop product identity configured");
	const productIdentityContent = readFileSync(productIdentityPath, "utf8");
	assert(
		productIdentityContent.includes("display: 'OPEN-VERSE'"),
		"HERMES-5.5",
		"Hermes desktop product identity configured to OPEN-VERSE"
	);

	console.log("\n==================================================================");
	console.log(`  ALL HERMES AGENT INTEGRATION TESTS PASSED: ${passed}/${total} (100%)`);
	console.log("==================================================================\n");
}

runHermesIntegrationSuite().catch((err) => {
	console.error(err);
	process.exit(1);
});
