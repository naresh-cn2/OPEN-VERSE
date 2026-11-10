import type { VercelRequest, VercelResponse } from "@vercel/node";
import {
	getCommandsMap,
	getDevicesMap,
	resolveUserId,
	type CrossDeviceCommand,
} from "./_store.js";

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
	const body = req.body as {
		sourceDeviceId: string;
		sourceDeviceName?: string;
		targetDeviceId: string;
		type: CrossDeviceCommand["type"];
		payload: CrossDeviceCommand["payload"];
	};

	if (!body.sourceDeviceId || !body.targetDeviceId || !body.type) {
		return res.status(400).json({
			success: false,
			error: "sourceDeviceId, targetDeviceId, and type are required",
		});
	}

	const devices = getDevicesMap(userId);
	const commands = getCommandsMap(userId);

	if (body.targetDeviceId !== "all") {
		const target = devices.get(body.targetDeviceId);
		if (!target) {
			return res.status(404).json({
				success: false,
				error: `Target device '${body.targetDeviceId}' not found in user network.`,
			});
		}
		if (!target.authorized) {
			return res.status(403).json({
				success: false,
				error: `Target device '${target.deviceName}' is not authorized.`,
			});
		}

		const isOnline = Date.now() - new Date(target.lastSeenAt).getTime() < 30_000;
		const commandId = `cmd_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
		const command: CrossDeviceCommand = {
			id: commandId,
			userId,
			sourceDeviceId: body.sourceDeviceId,
			sourceDeviceName: body.sourceDeviceName || "Personal Device",
			targetDeviceId: body.targetDeviceId,
			targetDeviceName: target.deviceName,
			type: body.type,
			payload: body.payload || {},
			status: isOnline ? "dispatched" : "queued",
			createdAt: new Date().toISOString(),
		};

		commands.set(commandId, command);

		return res.status(200).json({
			success: true,
			command,
		});
	}

	// Broadcast to all
	const commandId = `cmd_bcast_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
	const command: CrossDeviceCommand = {
		id: commandId,
		userId,
		sourceDeviceId: body.sourceDeviceId,
		sourceDeviceName: body.sourceDeviceName || "Personal Device",
		targetDeviceId: "all",
		targetDeviceName: "All Authorized Devices",
		type: body.type,
		payload: body.payload || {},
		status: "dispatched",
		createdAt: new Date().toISOString(),
	};

	commands.set(commandId, command);

	return res.status(200).json({
		success: true,
		command,
	});
}

