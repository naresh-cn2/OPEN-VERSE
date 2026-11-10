/**
 * In-memory & Edge device network store for Vercel Serverless
 */

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
	targetDeviceId: string;
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

// Global in-memory storage for serverless edge / node instances
const globalDevices = new Map<string, Map<string, OpenVerseDevice>>();
const globalCommands = new Map<string, Map<string, CrossDeviceCommand>>();

export function resolveUserId(authHeader?: string): string {
	if (!authHeader) return "default-user";
	const token = authHeader.replace(/^Bearer\s+/i, "").trim();
	if (!token) return "default-user";
	if (token.includes(".")) {
		try {
			const payload = JSON.parse(
				Buffer.from(token.split(".")[1], "base64").toString("utf-8"),
			);
			return payload.sub || payload.id || `ov-${token.slice(0, 8)}`;
		} catch {}
	}
	return `ov-${token.replace(/[^a-zA-Z0-9]/g, "").slice(0, 16)}`;
}

export function getDevicesMap(userId: string): Map<string, OpenVerseDevice> {
	if (!globalDevices.has(userId)) {
		globalDevices.set(userId, new Map());
	}
	return globalDevices.get(userId)!;
}

export function getCommandsMap(userId: string): Map<string, CrossDeviceCommand> {
	if (!globalCommands.has(userId)) {
		globalCommands.set(userId, new Map());
	}
	return globalCommands.get(userId)!;
}

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
