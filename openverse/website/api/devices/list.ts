import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getDevicesMap, resolveUserId } from "./_store.js";

export default function handler(req: VercelRequest, res: VercelResponse) {
	res.setHeader("Access-Control-Allow-Origin", "*");
	res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
	res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

	if (req.method === "OPTIONS") {
		return res.status(200).end();
	}

	const userId = resolveUserId(req.headers.authorization);
	const devices = getDevicesMap(userId);
	const now = Date.now();

	const list = Array.from(devices.values()).map((d) => {
		const lastSeen = new Date(d.lastSeenAt).getTime();
		const isOnline = now - lastSeen < 30_000;
		return { ...d, isOnline };
	});

	return res.status(200).json({
		success: true,
		userId,
		devices: list,
		count: list.length,
		timestamp: Date.now(),
	});
}

