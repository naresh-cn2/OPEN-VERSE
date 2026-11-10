import type { VercelRequest, VercelResponse } from "@vercel/node";
import { loadUserState, resolveUserId } from "../_store";

export default function handler(req: VercelRequest, res: VercelResponse) {
	res.setHeader("Access-Control-Allow-Origin", "*");
	res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
	res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

	if (req.method === "OPTIONS") {
		return res.status(200).end();
	}

	const { userId, email } = resolveUserId(req.headers.authorization);
	const userState = loadUserState(userId, email);

	return res.status(200).json({
		success: true,
		userId,
		sessions: Object.values(userState.sessions),
		messages: userState.messages,
		settings: userState.settings,
		timestamp: userState.lastSyncTimestamp,
	});
}
