/**
 * OPEN-VERSE Personal Device Network & Cross-Device Execution Engine
 *
 * Implements:
 * 1. User-scoped Device Registry (Windows, Android, iOS, Web, macOS, Linux)
 * 2. Real-time online/offline presence tracking (30s heartbeat timeout)
 * 3. Platform Capability discovery & pre-flight verification
 * 4. Secure Cross-Device Command Routing, Queuing, and Execution Confirmation
 * 5. Authorization and Revocation controls
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";

export type DevicePlatform = "windows" | "android" | "ios" | "macos" | "linux" | "web";

export type DeviceCapability =
	| "open_application"
	| "open_browser_url"
	| "phone_call_intent"
	| "send_notification"
	| "share_content"
	| "file_operations"
	| "desktop_automation"
	| "local_terminal";

export interface OpenVerseDevice {
	deviceId: string;
	userId: string;
	deviceName: string;
	platform: DevicePlatform;
	isOnline: boolean;
	lastSeenAt: string;
	capabilities: DeviceCapability[];
	authorized: boolean;
	modelInfo?: string;
	batteryLevel?: number;
	appVersion?: string;
	activeSessionId?: string;
}

export interface CrossDeviceCommand {
	id: string;
	userId: string;
	sourceDeviceId: string;
	sourceDeviceName: string;
	targetDeviceId: string; // Specific deviceId or "all"
	targetDeviceName?: string;
	type:
		| "open_application"
		| "open_url"
		| "phone_call"
		| "send_notification"
		| "continue_conversation"
		| "shell_exec";
	payload: {
		url?: string;
		packageName?: string;
		phoneNumber?: string;
		contactName?: string;
		title?: string;
		message?: string;
		conversationId?: string;
		command?: string;
		args?: Record<string, unknown>;
	};
	status: "queued" | "dispatched" | "executed" | "failed";
	createdAt: string;
	executedAt?: string;
	resultMessage?: string;
	errorMessage?: string;
}

const STORAGE_DIR =
	process.env.OPENVERSE_SYNC_DIR || join(process.cwd(), ".openverse-cloud-sync");

function ensureStorageDir() {
	if (!existsSync(STORAGE_DIR)) {
		mkdirSync(STORAGE_DIR, { recursive: true });
	}
}

// In-memory caches per user
const userDevicesCache = new Map<string, Map<string, OpenVerseDevice>>();
const userCommandsCache = new Map<string, Map<string, CrossDeviceCommand>>();

const HEARTBEAT_TIMEOUT_MS = 30_000; // 30 seconds

function getDevicesFilePath(userId: string): string {
	const safeId = userId.replace(/[^a-zA-Z0-9_-]/g, "_");
	return join(STORAGE_DIR, `devices_${safeId}.json`);
}

function getCommandsFilePath(userId: string): string {
	const safeId = userId.replace(/[^a-zA-Z0-9_-]/g, "_");
	return join(STORAGE_DIR, `commands_${safeId}.json`);
}

function loadUserDevices(userId: string): Map<string, OpenVerseDevice> {
	if (userDevicesCache.has(userId)) {
		return userDevicesCache.get(userId)!;
	}

	ensureStorageDir();
	const map = new Map<string, OpenVerseDevice>();
	const filePath = getDevicesFilePath(userId);

	if (existsSync(filePath)) {
		try {
			const data = JSON.parse(readFileSync(filePath, "utf-8")) as OpenVerseDevice[];
			for (const dev of data) {
				map.set(dev.deviceId, dev);
			}
		} catch (err) {
			console.error(`Failed to read devices for ${userId}:`, err);
		}
	}

	userDevicesCache.set(userId, map);
	return map;
}

function saveUserDevices(userId: string): void {
	const map = userDevicesCache.get(userId);
	if (!map) return;
	ensureStorageDir();
	try {
		const filePath = getDevicesFilePath(userId);
		writeFileSync(filePath, JSON.stringify(Array.from(map.values()), null, 2), "utf-8");
	} catch (err) {
		console.error(`Failed to save devices for ${userId}:`, err);
	}
}

function loadUserCommands(userId: string): Map<string, CrossDeviceCommand> {
	if (userCommandsCache.has(userId)) {
		return userCommandsCache.get(userId)!;
	}

	ensureStorageDir();
	const map = new Map<string, CrossDeviceCommand>();
	const filePath = getCommandsFilePath(userId);

	if (existsSync(filePath)) {
		try {
			const data = JSON.parse(readFileSync(filePath, "utf-8")) as CrossDeviceCommand[];
			for (const cmd of data) {
				map.set(cmd.id, cmd);
			}
		} catch (err) {
			console.error(`Failed to read commands for ${userId}:`, err);
		}
	}

	userCommandsCache.set(userId, map);
	return map;
}

function saveUserCommands(userId: string): void {
	const map = userCommandsCache.get(userId);
	if (!map) return;
	ensureStorageDir();
	try {
		const filePath = getCommandsFilePath(userId);
		writeFileSync(filePath, JSON.stringify(Array.from(map.values()), null, 2), "utf-8");
	} catch (err) {
		console.error(`Failed to save commands for ${userId}:`, err);
	}
}

/**
 * Register or update a device's heartbeat and capabilities
 */
export function registerDevice(
	userId: string,
	deviceData: Partial<OpenVerseDevice> & { deviceId: string; platform: DevicePlatform },
): OpenVerseDevice {
	const devices = loadUserDevices(userId);
	const now = new Date().toISOString();

	const existing = devices.get(deviceData.deviceId);
	const lastSeenAt = deviceData.lastSeenAt || now;
	const isOnline = Date.now() - new Date(lastSeenAt).getTime() < HEARTBEAT_TIMEOUT_MS;

	const updated: OpenVerseDevice = {
		deviceId: deviceData.deviceId,
		userId,
		deviceName:
			deviceData.deviceName ||
			existing?.deviceName ||
			`My ${deviceData.platform.toUpperCase()} Device`,
		platform: deviceData.platform,
		isOnline,
		lastSeenAt,
		capabilities: deviceData.capabilities || existing?.capabilities || getDefaultCapabilities(deviceData.platform),
		authorized: existing ? existing.authorized : true, // Authorized by default when signed in
		modelInfo: deviceData.modelInfo || existing?.modelInfo,
		batteryLevel: deviceData.batteryLevel ?? existing?.batteryLevel,
		appVersion: deviceData.appVersion || existing?.appVersion,
		activeSessionId: deviceData.activeSessionId || existing?.activeSessionId,
	};

	devices.set(deviceData.deviceId, updated);
	saveUserDevices(userId);
	return updated;
}

/**
 * Get all devices for user with live computed online status
 */
export function getUserDevices(userId: string): OpenVerseDevice[] {
	const devices = loadUserDevices(userId);
	const now = Date.now();
	const list: OpenVerseDevice[] = [];

	for (const dev of devices.values()) {
		const lastSeen = new Date(dev.lastSeenAt).getTime();
		const isOnline = now - lastSeen < HEARTBEAT_TIMEOUT_MS;
		list.push({
			...dev,
			isOnline,
		});
	}

	return list.sort((a, b) => (b.isOnline ? 1 : 0) - (a.isOnline ? 1 : 0));
}

/**
 * Set authorization state for a device
 */
export function setDeviceAuthorization(
	userId: string,
	deviceId: string,
	authorized: boolean,
): boolean {
	const devices = loadUserDevices(userId);
	const dev = devices.get(deviceId);
	if (!dev) return false;

	dev.authorized = authorized;
	saveUserDevices(userId);
	return true;
}

/**
 * Dispatch a cross-device command
 */
export function dispatchCommand(
	userId: string,
	input: {
		sourceDeviceId: string;
		sourceDeviceName: string;
		targetDeviceId: string;
		type: CrossDeviceCommand["type"];
		payload: CrossDeviceCommand["payload"];
	},
): { success: boolean; command?: CrossDeviceCommand; error?: string } {
	const devices = getUserDevices(userId);
	const source = devices.find((d) => d.deviceId === input.sourceDeviceId);

	// Validate target device exists and is authorized
	if (input.targetDeviceId !== "all") {
		const target = devices.find((d) => d.deviceId === input.targetDeviceId);
		if (!target) {
			return {
				success: false,
				error: `Target device '${input.targetDeviceId}' not found in user network.`,
			};
		}
		if (!target.authorized) {
			return {
				success: false,
				error: `Target device '${target.deviceName}' is not authorized.`,
			};
		}

		// Capability verification
		const requiredCap = mapCommandTypeToCapability(input.type);
		if (requiredCap && !target.capabilities.includes(requiredCap)) {
			return {
				success: false,
				error: `Target device '${target.deviceName}' does not support '${requiredCap}'.`,
			};
		}

		const isTargetOnline = target.isOnline;
		const commandId = `cmd_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
		const command: CrossDeviceCommand = {
			id: commandId,
			userId,
			sourceDeviceId: input.sourceDeviceId,
			sourceDeviceName: input.sourceDeviceName || source?.deviceName || "Personal Device",
			targetDeviceId: input.targetDeviceId,
			targetDeviceName: target.deviceName,
			type: input.type,
			payload: input.payload,
			status: isTargetOnline ? "dispatched" : "queued",
			createdAt: new Date().toISOString(),
		};

		const commands = loadUserCommands(userId);
		commands.set(commandId, command);
		saveUserCommands(userId);

		return {
			success: true,
			command,
		};
	}

	// Target "all"
	const commandId = `cmd_broadcast_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
	const command: CrossDeviceCommand = {
		id: commandId,
		userId,
		sourceDeviceId: input.sourceDeviceId,
		sourceDeviceName: input.sourceDeviceName || "Personal Device",
		targetDeviceId: "all",
		targetDeviceName: "All Authorized Devices",
		type: input.type,
		payload: input.payload,
		status: "dispatched",
		createdAt: new Date().toISOString(),
	};

	const commands = loadUserCommands(userId);
	commands.set(commandId, command);
	saveUserCommands(userId);

	return { success: true, command };
}

/**
 * Poll commands destined for a specific target device
 */
export function pollCommandsForDevice(
	userId: string,
	deviceId: string,
): CrossDeviceCommand[] {
	const commands = loadUserCommands(userId);
	const pending: CrossDeviceCommand[] = [];

	for (const cmd of commands.values()) {
		if (
			(cmd.targetDeviceId === deviceId || cmd.targetDeviceId === "all") &&
			(cmd.status === "queued" || cmd.status === "dispatched")
		) {
			pending.push(cmd);
			cmd.status = "dispatched"; // Mark as actively dispatched
		}
	}

	if (pending.length > 0) {
		saveUserCommands(userId);
	}

	return pending;
}

/**
 * Acknowledge command execution with real confirmation
 */
export function acknowledgeCommand(
	userId: string,
	deviceId: string,
	input: {
		commandId: string;
		status: "executed" | "failed";
		resultMessage?: string;
		errorMessage?: string;
	},
): boolean {
	const commands = loadUserCommands(userId);
	const cmd = commands.get(input.commandId);
	if (!cmd) return false;

	// Security: only target device or owner can ack
	if (cmd.targetDeviceId !== "all" && cmd.targetDeviceId !== deviceId) {
		return false;
	}

	cmd.status = input.status;
	cmd.executedAt = new Date().toISOString();
	cmd.resultMessage = input.resultMessage;
	cmd.errorMessage = input.errorMessage;

	saveUserCommands(userId);
	return true;
}

/**
 * Map command type to required capability
 */
function mapCommandTypeToCapability(type: CrossDeviceCommand["type"]): DeviceCapability | null {
	switch (type) {
		case "open_application":
			return "open_application";
		case "open_url":
			return "open_browser_url";
		case "phone_call":
			return "phone_call_intent";
		case "send_notification":
			return "send_notification";
		case "shell_exec":
			return "local_terminal";
		default:
			return null;
	}
}

/**
 * Default capabilities by platform
 */
export function getDefaultCapabilities(platform: DevicePlatform): DeviceCapability[] {
	switch (platform) {
		case "windows":
		case "macos":
		case "linux":
			return [
				"open_application",
				"open_browser_url",
				"file_operations",
				"desktop_automation",
				"send_notification",
				"local_terminal",
			];
		case "android":
			return [
				"open_application",
				"open_browser_url",
				"phone_call_intent",
				"send_notification",
				"share_content",
			];
		case "ios":
			return ["open_application", "open_browser_url", "send_notification", "share_content"];
		case "web":
			return ["open_browser_url", "send_notification"];
	}
}
