/**
 * OPEN-VERSE Mobile Client Device Network & Cross-Device Execution Service
 *
 * Runs on Android Phone / Tablet / iOS:
 * - Generates & persists unique device identity
 * - Maintains active heartbeat with user's Google account
 * - Listens for incoming commands destined for this device
 * - Executes native actions (open YouTube, phone call intent, notifications)
 * - Dispatches commands to other authorized devices (e.g. Windows Laptop)
 */

import { getMobileSession } from "./auth";

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

const DEVICE_ID_KEY = "openverse.mobile.device_id.v1";
const DEVICE_NAME_KEY = "openverse.mobile.device_name.v1";

declare global {
	interface Window {
		AndroidInterface?: {
			getAppVersion?: () => string;
			openExternalUrl?: (url: string) => void;
			openApplication?: (pkg: string) => boolean;
			initiatePhoneCall?: (number: string) => boolean;
			showNotification?: (title: string, message: string) => boolean;
			getDeviceDetails?: () => string;
			downloadAndInstallApk?: (url: string) => void;
			showToast?: (message: string) => void;
			performHapticFeedback?: (type?: string) => void;
		};
	}
}

class MobileDeviceNetwork {
	private deviceId: string = "";
	private platform: DevicePlatform = "android";
	private deviceName: string = "Android Phone";
	private knownDevices: OpenVerseDevice[] = [];
	private heartbeatTimer: any = null;
	private pollTimer: any = null;
	private apiEndpoint: string = "https://open-verse-website.vercel.app/api/devices";

	constructor() {
		if (typeof window !== "undefined") {
			this.init();
		}
	}

	public init() {
		this.detectPlatform();
		this.loadOrCreateIdentity();
		this.startHeartbeatLoop();
		this.startCommandPollLoop();
	}

	private detectPlatform() {
		if (typeof window === "undefined") return;
		const ua = navigator.userAgent.toLowerCase();
		if (window.AndroidInterface || ua.includes("android")) {
			this.platform = "android";
		} else if (ua.includes("iphone") || ua.includes("ipad") || ua.includes("ios")) {
			this.platform = "ios";
		} else {
			this.platform = "web";
		}
	}

	private loadOrCreateIdentity() {
		if (typeof window === "undefined") return;
		let id = localStorage.getItem(DEVICE_ID_KEY);
		if (!id) {
			id = `ov-dev-and-${Math.random().toString(36).slice(2, 8)}`;
			localStorage.setItem(DEVICE_ID_KEY, id);
		}
		this.deviceId = id;

		let name = localStorage.getItem(DEVICE_NAME_KEY);
		if (!name) {
			name = this.platform === "ios" ? "iPhone" : "Android Phone";
			localStorage.setItem(DEVICE_NAME_KEY, name);
		}
		this.deviceName = name;
	}

	public getDeviceId(): string {
		return this.deviceId;
	}

	public getPlatform(): DevicePlatform {
		return this.platform;
	}

	public getDeviceName(): string {
		return this.deviceName;
	}

	public setDeviceName(name: string) {
		this.deviceName = name;
		if (typeof window !== "undefined") {
			localStorage.setItem(DEVICE_NAME_KEY, name);
			this.heartbeat();
		}
	}

	public getKnownDevices(): OpenVerseDevice[] {
		return this.knownDevices;
	}

	public getLocalCapabilities(): DeviceCapability[] {
		return [
			"open_application",
			"open_browser_url",
			"phone_call_intent",
			"send_notification",
			"share_content",
		];
	}

	private getAuthToken(): string {
		const session = getMobileSession();
		return session?.accessToken || session?.user?.email || "anonymous_mobile_user";
	}

	public async heartbeat(): Promise<void> {
		if (!this.deviceId) return;
		try {
			const res = await fetch(`${this.apiEndpoint}/register`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${this.getAuthToken()}`,
				},
				body: JSON.stringify({
					deviceId: this.deviceId,
					deviceName: this.deviceName,
					platform: this.platform,
					capabilities: this.getLocalCapabilities(),
					appVersion: "0.2.0",
				}),
			});

			if (res.ok) {
				const data = await res.json();
				if (Array.isArray(data.devices)) {
					this.knownDevices = data.devices;
					window.dispatchEvent(
						new CustomEvent("openverse:devices-updated", {
							detail: { devices: this.knownDevices },
						}),
					);
				}
			}
		} catch {}
	}

	private startHeartbeatLoop() {
		if (this.heartbeatTimer) clearInterval(this.heartbeatTimer);
		this.heartbeat();
		this.heartbeatTimer = setInterval(() => this.heartbeat(), 20_000);
	}

	public async pollCommands(): Promise<void> {
		if (!this.deviceId) return;
		try {
			const res = await fetch(`${this.apiEndpoint}/poll?deviceId=${this.deviceId}`, {
				headers: {
					Authorization: `Bearer ${this.getAuthToken()}`,
				},
			});

			if (res.ok) {
				const data = await res.json();
				if (Array.isArray(data.commands) && data.commands.length > 0) {
					for (const cmd of data.commands) {
						await this.executeIncomingCommand(cmd);
					}
				}
			}
		} catch {}
	}

	private startCommandPollLoop() {
		if (this.pollTimer) clearInterval(this.pollTimer);
		this.pollCommands();
		this.pollTimer = setInterval(() => this.pollCommands(), 3_000);
	}

	private async executeIncomingCommand(cmd: CrossDeviceCommand): Promise<void> {
		window.dispatchEvent(
			new CustomEvent("openverse:command-received", {
				detail: { command: cmd },
			}),
		);

		let success = false;
		let resultMessage = "";
		let errorMessage = "";

		try {
			switch (cmd.type) {
				case "open_url": {
					const url = cmd.payload.url || "https://youtube.com";
					if (window.AndroidInterface && typeof window.AndroidInterface.openExternalUrl === "function") {
						window.AndroidInterface.openExternalUrl(url);
					} else {
						window.open(url, "_blank");
					}
					success = true;
					resultMessage = `Opened URL '${url}' on ${this.deviceName}`;
					break;
				}

				case "open_application": {
					const pkg = cmd.payload.packageName || cmd.payload.url || "com.google.android.youtube";
					if (window.AndroidInterface?.openApplication) {
						success = window.AndroidInterface.openApplication(pkg);
					} else if (window.AndroidInterface?.openExternalUrl) {
						window.AndroidInterface.openExternalUrl(cmd.payload.url || "https://youtube.com");
						success = true;
					} else {
						window.open(cmd.payload.url || "https://youtube.com", "_blank");
						success = true;
					}
					resultMessage = `Opened application '${pkg}' on ${this.deviceName}`;
					break;
				}

				case "phone_call": {
					const phone = cmd.payload.phoneNumber || "";
					if (window.AndroidInterface?.initiatePhoneCall) {
						success = window.AndroidInterface.initiatePhoneCall(phone);
						resultMessage = `Dialer opened for ${cmd.payload.contactName || phone} on ${this.deviceName}`;
					} else {
						errorMessage = `Phone calling requires Android native bridge.`;
					}
					break;
				}

				case "send_notification": {
					const title = cmd.payload.title || "OPEN-VERSE";
					const message = cmd.payload.message || "";
					if (window.AndroidInterface?.showNotification) {
						window.AndroidInterface.showNotification(title, message);
					} else if (window.AndroidInterface?.showToast) {
						window.AndroidInterface.showToast(`${title}: ${message}`);
					}
					success = true;
					resultMessage = `Notification displayed on ${this.deviceName}`;
					break;
				}

				default:
					errorMessage = `Unsupported command: ${cmd.type}`;
			}
		} catch (err) {
			success = false;
			errorMessage = String(err);
		}

		await this.acknowledge(cmd.id, success ? "executed" : "failed", resultMessage, errorMessage);
	}

	public async acknowledge(
		commandId: string,
		status: "executed" | "failed",
		resultMessage?: string,
		errorMessage?: string,
	): Promise<void> {
		try {
			await fetch(`${this.apiEndpoint}/ack`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${this.getAuthToken()}`,
				},
				body: JSON.stringify({
					deviceId: this.deviceId,
					commandId,
					status,
					resultMessage,
					errorMessage,
				}),
			});
		} catch {}
	}

	public async sendCommand(
		targetDeviceId: string,
		type: CrossDeviceCommand["type"],
		payload: CrossDeviceCommand["payload"],
	): Promise<{ success: boolean; command?: CrossDeviceCommand; error?: string }> {
		try {
			const res = await fetch(`${this.apiEndpoint}/command`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${this.getAuthToken()}`,
				},
				body: JSON.stringify({
					sourceDeviceId: this.deviceId,
					sourceDeviceName: this.deviceName,
					targetDeviceId,
					type,
					payload,
				}),
			});

			return await res.json();
		} catch (err) {
			return { success: false, error: String(err) };
		}
	}
}

export const mobileDeviceNetwork = new MobileDeviceNetwork();
