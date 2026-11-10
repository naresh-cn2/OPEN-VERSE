import type { VercelRequest, VercelResponse } from "@vercel/node";
import {
	loadUserState,
	mergeMessages,
	mergeSessions,
	resolveUserId,
	saveUserState,
	type SyncMessage,
	type SyncSession,
	type SyncSettings,
} from "../_store.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
	res.setHeader("Access-Control-Allow-Origin", "*");
	res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
	res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

	if (req.method === "OPTIONS") {
		return res.status(200).end();
	}

	if (req.method !== "POST") {
		return res.status(405).json({ error: "Method not allowed. Use POST." });
	}

	const { userId, email } = resolveUserId(req.headers.authorization);
	const userState = await loadUserState(userId, email);

	const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body || {};
	const incomingSessions: SyncSession[] = Array.isArray(body.sessions) ? body.sessions : [];
	const incomingMessages: Record<string, SyncMessage[]> =
		body.messages && typeof body.messages === "object" ? body.messages : {};
	const incomingSettings: SyncSettings =
		body.settings && typeof body.settings === "object" ? body.settings : {};

	if (incomingSessions.length > 0) {
		userState.sessions = mergeSessions(userState.sessions, incomingSessions);
	}

	if (Object.keys(incomingMessages).length > 0) {
		userState.messages = mergeMessages(userState.messages, incomingMessages);
	}

	if (incomingSettings.providers && Array.isArray(incomingSettings.providers)) {
		// Clean and store providers without raw secret leakage
		const existingProviders = Array.isArray(userState.settings.providers)
			? userState.settings.providers
			: [];
		const providerMap = new Map<string, Record<string, unknown>>();
		for (const p of existingProviders) {
			const id = String(p.id || "");
			if (id) providerMap.set(id, p);
		}
		for (const p of incomingSettings.providers) {
			const id = String(p.id || "");
			if (id) {
				const existing = providerMap.get(id) || {};
				providerMap.set(id, {
					...existing,
					...p,
					apiKey: undefined, // Never store raw keys in cloud sync payload
				});
			}
		}
		userState.settings.providers = Array.from(providerMap.values());
	}

	if (incomingSettings.favoriteModels) {
		userState.settings.favoriteModels = incomingSettings.favoriteModels;
	}

	if (typeof incomingSettings.defaultModelId === "string") {
		userState.settings.defaultModelId = incomingSettings.defaultModelId;
	}

	await saveUserState(userState);

	return res.status(200).json({
		success: true,
		userId,
		sessionsCount: Object.keys(userState.sessions).length,
		timestamp: userState.lastSyncTimestamp,
	});
}

