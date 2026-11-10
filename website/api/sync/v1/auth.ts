import type { VercelRequest, VercelResponse } from "@vercel/node";
import { loadUserState, resolveUserId } from "../_store.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
	res.setHeader("Access-Control-Allow-Origin", "*");
	res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
	res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

	if (req.method === "OPTIONS") {
		return res.status(200).end();
	}

	const authHeader = req.headers.authorization;
	if (!authHeader) {
		return res.status(401).json({ success: false, error: "Authorization header required" });
	}

	const { userId, email } = resolveUserId(authHeader);
	const userState = await loadUserState(userId, email);

	return res.status(200).json({
		success: true,
		authenticated: true,
		userId,
		email,
		sessionsCount: Object.keys(userState.sessions).length,
		timestamp: Date.now(),
	});
}

