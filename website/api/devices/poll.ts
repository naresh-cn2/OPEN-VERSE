import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getCommandsMap, resolveUserId, type CrossDeviceCommand } from "./_store";

export default function handler(req: VercelRequest, res: VercelResponse) {
	res.setHeader("Access-Control-Allow-Origin", "*");
	res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
	res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

	if (req.method === "OPTIONS") {
		return res.status(200).end();
	}

	const userId = resolveUserId(req.headers.authorization);
	const deviceId = (req.query.deviceId as string) || (req.body?.deviceId as string);

	if (!deviceId) {
		return res.status(400).json({ success: false, error: "deviceId is required" });
	}

	const commands = getCommandsMap(userId);
	const pending: CrossDeviceCommand[] = [];

	for (const cmd of commands.values()) {
		if (
			(cmd.targetDeviceId === deviceId || cmd.targetDeviceId === "all") &&
			(cmd.status === "queued" || cmd.status === "dispatched")
		) {
			pending.push(cmd);
			cmd.status = "dispatched";
		}
	}

	return res.status(200).json({
		success: true,
		deviceId,
		commands: pending,
		count: pending.length,
		timestamp: Date.now(),
	});
}

