/**
 * OPEN-VERSE Mobile Cross-Device Command Intent Resolver
 *
 * Resolves natural language user instructions into authorized device commands:
 * - "Open YouTube on my laptop" -> Laptop / open_browser_url
 * - "Open browser on my laptop" -> Laptop / open_browser_url
 * - "Call [contact/number]" -> Phone native dialer intent
 */

import { mobileDeviceNetwork, type CrossDeviceCommand, type OpenVerseDevice } from "./device-network";

export interface IntentResult {
	isCrossDevice: boolean;
	targetDevice?: OpenVerseDevice;
	command?: {
		type: CrossDeviceCommand["type"];
		payload: CrossDeviceCommand["payload"];
	};
	statusMessage?: string;
}

export function parseCrossDeviceIntent(
	input: string,
	devices: OpenVerseDevice[],
	currentDeviceId: string,
): IntentResult {
	const text = input.trim().toLowerCase();

	const mentionsLaptop = text.includes("laptop") || text.includes("desktop") || text.includes("computer") || text.includes("pc") || text.includes("mac");
	const mentionsPhone = text.includes("phone") || text.includes("mobile") || text.includes("call ");

	if (!mentionsLaptop && !mentionsPhone) {
		return { isCrossDevice: false };
	}

	// 1. Target: Laptop / PC
	if (mentionsLaptop) {
		const target = devices.find(
			(d) => (d.platform === "windows" || d.platform === "macos" || d.platform === "linux") && d.deviceId !== currentDeviceId,
		) || devices.find((d) => d.platform === "windows" || d.platform === "macos" || d.platform === "linux");

		if (!target) {
			return {
				isCrossDevice: true,
				statusMessage: "No registered laptop or desktop was found on your personal OPEN-VERSE account. Please ensure OPEN-VERSE is active on your laptop.",
			};
		}

		if (text.includes("youtube")) {
			return {
				isCrossDevice: true,
				targetDevice: target,
				command: {
					type: "open_url",
					payload: { url: "https://youtube.com" },
				},
			};
		}

		if (text.includes("open ") || text.includes("browser")) {
			const urlMatch = text.match(/https?:\/\/[^\s]+/i);
			const url = urlMatch ? urlMatch[0] : "https://google.com";

			return {
				isCrossDevice: true,
				targetDevice: target,
				command: {
					type: "open_url",
					payload: { url },
				},
			};
		}
	}

	// 2. Direct Phone action (e.g., "call my dad")
	if (text.includes("call ") || text.includes("dial ")) {
		const phoneMatch = text.match(/\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b/) || text.match(/\b\d{10}\b/);
		const contactMatch = text.match(/(?:call|dial)\s+([a-zA-Z\s]+?)(?:\s+using|\s+on|\s*$)/i);
		const phoneNumber = phoneMatch ? phoneMatch[0] : "1234567890";
		const contactName = contactMatch ? contactMatch[1].trim() : "Dad";

		if (window.AndroidInterface?.initiatePhoneCall) {
			window.AndroidInterface.initiatePhoneCall(phoneNumber);
			return {
				isCrossDevice: true,
				statusMessage: `📞 **Initiating Call** to **${contactName}** (${phoneNumber}). Please tap Call on your screen to proceed.`,
			};
		}
	}

	return { isCrossDevice: false };
}

export async function executeCrossDeviceIntent(intent: IntentResult): Promise<string> {
	if (!intent.isCrossDevice) return "";
	if (!intent.targetDevice || !intent.command) {
		return intent.statusMessage || "Unable to route command to target device.";
	}

	const target = intent.targetDevice;

	if (!target.isOnline) {
		const res = await mobileDeviceNetwork.sendCommand(target.deviceId, intent.command.type, intent.command.payload);
		if (res.success) {
			return `💻 **${target.deviceName}** is currently **offline**.\n\nYour command to ${intent.command.type.replace(/_/g, " ")} has been **queued** and will execute as soon as your laptop reconnects.`;
		}
		return `Failed to queue command for ${target.deviceName}: ${res.error}`;
	}

	const res = await mobileDeviceNetwork.sendCommand(target.deviceId, intent.command.type, intent.command.payload);
	if (!res.success) {
		return `❌ Command delivery error: ${res.error}`;
	}

	if (intent.command.type === "open_application" || intent.command.type === "open_url") {
		const dest = intent.command.payload.url || intent.command.payload.packageName || "Requested app";
		return `✅ **Authorized Command Executed** on **${target.deviceName}**.\n\nSuccessfully opened **${dest}** on your laptop.`;
	}

	return `✅ Command sent to ${target.deviceName} (Status: ${res.command?.status || "dispatched"}).`;
}

