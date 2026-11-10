import type { VercelRequest, VercelResponse } from "@vercel/node";
import {
	getDefaultCapabilities,
	getDevicesMap,
	resolveUserId,
	type OpenVerseDevice,
} from "./_store";

export default function handler(req: VercelRequest, res: VercelResponse) {
	res.setHeader("Access-Control-Allow-Origin", "*");
	res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
	res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

	if (req.method === "OPTIONS") {
		return res.status(200).end();
	}

	if (req.method !== "POST") {
		return res.status(405).json({ error: "Method not allowed" });
	}

	const userId = resolveUserId(req.headers.authorization);
	const body = req.body as Partial<OpenVerseDevice> & { deviceId: string; platform: any };

	if (!body.deviceId || !body.platform) {
		return res.status(400).json({ error: "deviceId and platform are required" });
	}

	const devices = getDevicesMap(userId);
	const existing = devices.get(body.deviceId);
	const now = new Date().toISOString();

	const device: OpenVerseDevice = {
		deviceId: body.deviceId,
		userId,
		deviceName: body.deviceName || existing?.deviceName || `My ${body.platform} Device`,
		platform: body.platform,
		isOnline: true,
		lastSeenAt: now,
		capabilities: body.capabilities || existing?.capabilities || getDefaultCapabilities(body.platform),
		authorized: existing ? existing.authorized : true,
		modelInfo: body.modelInfo || existing?.modelInfo,
		batteryLevel: body.batteryLevel ?? existing?.batteryLevel,
		appVersion: body.appVersion || existing?.appVersion,
		activeSessionId: body.activeSessionId || existing?.activeSessionId,
	};

	devices.set(body.deviceId, device);

	return res.status(200).json({
		success: true,
		device,
		devices: Array.from(devices.values()),
		timestamp: Date.now(),
	});
}
