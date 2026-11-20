import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getCommandsMap, resolveUserId } from "./_store.js";

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
		deviceId: string;
		commandId: string;
		status: "executed" | "failed";
		resultMessage?: string;
		errorMessage?: string;
	};

	if (!body.deviceId || !body.commandId || !body.status) {
		return res.status(400).json({
			success: false,
			error: "deviceId, commandId, and status are required",
		});
	}

	const commands = getCommandsMap(userId);
	const cmd = commands.get(body.commandId);

	if (!cmd) {
		return res.status(404).json({ success: false, error: "Command not found" });
	}

	cmd.status = body.status;
	cmd.executedAt = new Date().toISOString();
	cmd.resultMessage = body.resultMessage;
	cmd.errorMessage = body.errorMessage;

	return res.status(200).json({ success: true, command: cmd });
}

