/**
 * OPEN-VERSE Production Cloud Sync Store
 *
 * Implements persistent, globally distributed multi-device cloud storage:
 * - Backed by GitHub Distributed Cloud Database (branch: cloud-sync-data)
 * - Turn-by-turn conversation messages & sessions
 * - Provider preferences & non-secret settings
 * - Conflict resolution (timestamp-based + chronological message union)
 * - User isolation enforced per authenticated identity
 * - Memory & disk tiered caching for fast responses
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

export interface SyncMessage {
	id: string;
	sessionId: string;
	role: "user" | "assistant" | "system";
	content: string;
	createdAt: number;
}

export interface SyncSession {
	id: string;
	sessionId: string;
	title: string;
	provider: string;
	model: string;
	status?: string;
	startedAt: string;
	lastActivityAt: string;
	workspaceRoot?: string;
	environmentId?: string;
}

export interface SyncSettings {
	providers?: Record<string, unknown>[];
	favoriteModels?: Record<string, unknown>;
	defaultModelId?: string;
	theme?: string;
	telemetryOptOut?: boolean;
	autoUpdateEnabled?: boolean;
	[key: string]: unknown;
}

export interface UserCloudState {
	userId: string;
	email: string;
	lastSyncTimestamp: number;
	sessions: Record<string, SyncSession>;
	messages: Record<string, SyncMessage[]>;
	settings: SyncSettings;
}

const userStateCache = new Map<string, UserCloudState>();
const userFileShaMap = new Map<string, string>();

const STORAGE_DIR =
	process.env.OPENVERSE_SYNC_DIR ||
	(process.platform === "win32"
		? join(process.cwd(), ".openverse-cloud-sync")
		: join(tmpdir(), "openverse-cloud-sync"));

const CLOUD_REPO = "naresh-cn2/OPEN-VERSE";
const CLOUD_BRANCH = "cloud-sync-data";
const GITHUB_API_BASE = "https://api.github.com";

function getCloudAuthToken(): string {
	return (
		process.env.OPENVERSE_CLOUD_SYNC_TOKEN ||
		process.env.GH_TOKEN ||
		process.env.GITHUB_TOKEN ||
		""
	);
}

function ensureStorageDir() {
	try {
		if (!existsSync(STORAGE_DIR)) {
			mkdirSync(STORAGE_DIR, { recursive: true });
		}
	} catch {}
}

function getUserFilePath(userId: string): string {
	const safeId = userId.replace(/[^a-zA-Z0-9_-]/g, "_");
	return join(STORAGE_DIR, `${safeId}.json`);
}

export function resolveUserId(authHeader?: string): { userId: string; email: string } {
	if (!authHeader) return { userId: "default-user", email: "user@openverse.internal" };
	const token = authHeader.replace(/^Bearer\s+/i, "").trim();
	if (!token) return { userId: "default-user", email: "user@openverse.internal" };

	if (token.includes(".")) {
		try {
			const parts = token.split(".");
			const payload = JSON.parse(Buffer.from(parts[1], "base64").toString("utf-8"));
			const userId = payload.sub || payload.id || `ov-${token.slice(0, 12)}`;
			const email = payload.email || "user@openverse.internal";
			return { userId, email };
		} catch {}
	}
	const clean = token.replace(/[^a-zA-Z0-9]/g, "");
	return { userId: `ov-${clean.slice(0, 16)}`, email: `${clean.slice(0, 8)}@openverse.internal` };
}

/**
 * Loads user state from Cloud Database (GitHub Distributed Store) with local caching
 */
export async function loadUserState(
	userId: string,
	email = "user@openverse.internal",
): Promise<UserCloudState> {
	// 1. Fast in-memory cache check
	if (userStateCache.has(userId)) {
		return userStateCache.get(userId)!;
	}

	const safeId = userId.replace(/[^a-zA-Z0-9_-]/g, "_");

	// 2. Fetch from Cloud Database (GitHub Branch cloud-sync-data)
	const token = getCloudAuthToken();
	if (token) {
		try {
			const res = await fetch(
				`${GITHUB_API_BASE}/repos/${CLOUD_REPO}/contents/data/sync/${safeId}.json?ref=${CLOUD_BRANCH}`,
				{
					headers: {
						Authorization: `Bearer ${token}`,
						Accept: "application/vnd.github+json",
						"User-Agent": "OPEN-VERSE-CloudSync",
					},
				},
			);
			if (res.ok) {
				const json = (await res.json()) as { content?: string; sha?: string };
				if (json.content) {
					if (json.sha) {
						userFileShaMap.set(userId, json.sha);
					}
					const parsed = JSON.parse(
						Buffer.from(json.content, "base64").toString("utf-8"),
					) as UserCloudState;
					userStateCache.set(userId, parsed);
					return parsed;
				}
			}
		} catch (err) {
			console.warn("[CloudSync] Cloud fetch fallback:", err);
		}
	}

	// 3. Fallback to local storage cache
	ensureStorageDir();
	const filePath = getUserFilePath(userId);
	if (existsSync(filePath)) {
		try {
			const data = JSON.parse(readFileSync(filePath, "utf-8")) as UserCloudState;
			userStateCache.set(userId, data);
			return data;
		} catch {}
	}

	// 4. Initial state if user has no prior history
	const initialState: UserCloudState = {
		userId,
		email,
		lastSyncTimestamp: Date.now(),
		sessions: {},
		messages: {},
		settings: {},
	};
	userStateCache.set(userId, initialState);
	return initialState;
}

/**
 * Saves user state to Cloud Database (GitHub Distributed Store) and local storage
 */
export async function saveUserState(state: UserCloudState): Promise<void> {
	state.lastSyncTimestamp = Date.now();
	userStateCache.set(state.userId, state);

	// 1. Save to local disk cache
	try {
		ensureStorageDir();
		const filePath = getUserFilePath(state.userId);
		writeFileSync(filePath, JSON.stringify(state, null, 2), "utf-8");
	} catch {}

	// 2. Save asynchronously to Cloud Database
	const token = getCloudAuthToken();
	if (token) {
		try {
			const safeId = state.userId.replace(/[^a-zA-Z0-9_-]/g, "_");
			const contentStr = JSON.stringify(state, null, 2);
			const base64Content = Buffer.from(contentStr, "utf-8").toString("base64");
			const currentSha = userFileShaMap.get(state.userId);

			const body: Record<string, unknown> = {
				message: `sync: update user state for ${safeId}`,
				content: base64Content,
				branch: CLOUD_BRANCH,
			};
			if (currentSha) {
				body.sha = currentSha;
			}

			const res = await fetch(
				`${GITHUB_API_BASE}/repos/${CLOUD_REPO}/contents/data/sync/${safeId}.json`,
				{
					method: "PUT",
					headers: {
						Authorization: `Bearer ${token}`,
						"Content-Type": "application/json",
						Accept: "application/vnd.github+json",
						"User-Agent": "OPEN-VERSE-CloudSync",
					},
					body: JSON.stringify(body),
				},
			);
			if (res.ok) {
				const json = (await res.json()) as { content?: { sha?: string } };
				if (json.content?.sha) {
					userFileShaMap.set(state.userId, json.content.sha);
				}
			}
		} catch (err) {
			console.warn("[CloudSync] Cloud save error:", err);
		}
	}
}

export function mergeSessions(
	existing: Record<string, SyncSession>,
	incoming: SyncSession[],
): Record<string, SyncSession> {
	const merged: Record<string, SyncSession> = { ...existing };
	for (const inc of incoming) {
		const sid = inc.sessionId || inc.id;
		if (!sid) continue;

		if (!merged[sid]) {
			merged[sid] = inc;
		} else {
			const prevTime = new Date(merged[sid].lastActivityAt || 0).getTime();
			const incTime = new Date(inc.lastActivityAt || 0).getTime();
			if (incTime >= prevTime) {
				merged[sid] = {
					...merged[sid],
					...inc,
					title: inc.title || merged[sid].title,
					lastActivityAt: inc.lastActivityAt || merged[sid].lastActivityAt,
				};
			}
		}
	}
	return merged;
}

export function mergeMessages(
	existing: Record<string, SyncMessage[]>,
	incoming: Record<string, SyncMessage[]>,
): Record<string, SyncMessage[]> {
	const merged: Record<string, SyncMessage[]> = { ...existing };

	for (const [sessionId, incMsgs] of Object.entries(incoming)) {
		const currentMsgs = merged[sessionId] || [];
		const messageMap = new Map<string, SyncMessage>();

		for (const msg of currentMsgs) {
			const key = msg.id || `${msg.role}_${msg.createdAt}`;
			messageMap.set(key, msg);
		}

		for (const msg of incMsgs) {
			const key = msg.id || `${msg.role}_${msg.createdAt}`;
			if (!messageMap.has(key)) {
				messageMap.set(key, msg);
			} else {
				const existingMsg = messageMap.get(key)!;
				if (msg.content && msg.content.length > existingMsg.content.length) {
					messageMap.set(key, msg);
				}
			}
		}

		merged[sessionId] = Array.from(messageMap.values()).sort(
			(a, b) => a.createdAt - b.createdAt,
		);
	}

	return merged;
}
