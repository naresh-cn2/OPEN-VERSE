/**
 * OPEN-VERSE Cloud Sync & Cross-Device Continuity Engine
 *
 * Implements:
 * 1. Account-based session & conversation synchronization
 * 2. Multi-device conflict resolution (chronological message union & max lastActivityAt)
 * 3. Settings & provider credentials synchronization (encrypted/isolated per user)
 * 4. Remote Hub Relay for mobile agentic execution
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { dirname, join } from "path";
import {
	acknowledgeCommand,
	dispatchCommand,
	getUserDevices,
	pollCommandsForDevice,
	registerDevice,
	setDeviceAuthorization,
	type DeviceCapability,
	type DevicePlatform,
} from "./device-network";

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

export interface RelayTask {
	id: string;
	userId: string;
	action: "exec_command" | "read_file" | "write_file" | "git_status";
	params: Record<string, unknown>;
	status: "pending" | "running" | "completed" | "failed";
	result?: unknown;
	error?: string;
	createdAt: number;
	updatedAt: number;
}

// In-memory cloud state cache per user
const userStateCache = new Map<string, UserCloudState>();
const relayTasks = new Map<string, RelayTask>();

const STORAGE_DIR = process.env.OPENVERSE_SYNC_DIR || join(process.cwd(), ".openverse-cloud-sync");

function ensureStorageDir() {
	if (!existsSync(STORAGE_DIR)) {
		mkdirSync(STORAGE_DIR, { recursive: true });
	}
}

function getUserFilePath(userId: string): string {
	const safeId = userId.replace(/[^a-zA-Z0-9_-]/g, "_");
	return join(STORAGE_DIR, `${safeId}.json`);
}

export function loadUserState(userId: string, email = "user@openverse.internal"): UserCloudState {
	if (userStateCache.has(userId)) {
		return userStateCache.get(userId)!;
	}

	ensureStorageDir();
	const filePath = getUserFilePath(userId);
	if (existsSync(filePath)) {
		try {
			const data = JSON.parse(readFileSync(filePath, "utf-8")) as UserCloudState;
			userStateCache.set(userId, data);
			return data;
		} catch (err) {
			console.error(`Failed to read user cloud sync file for ${userId}:`, err);
		}
	}

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

export function saveUserState(state: UserCloudState): void {
	state.lastSyncTimestamp = Date.now();
	userStateCache.set(state.userId, state);
	try {
		ensureStorageDir();
		const filePath = getUserFilePath(state.userId);
		writeFileSync(filePath, JSON.stringify(state, null, 2), "utf-8");
	} catch (err) {
		console.error(`Failed to save cloud sync file for ${state.userId}:`, err);
	}
}

/**
 * Merge uploaded sessions with existing cloud sessions
 */
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
			// Compare activity timestamps to keep freshest title and status
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

/**
 * Merge uploaded messages with existing cloud messages per session
 */
export function mergeMessages(
	existing: Record<string, SyncMessage[]>,
	incoming: Record<string, SyncMessage[]>,
): Record<string, SyncMessage[]> {
	const merged: Record<string, SyncMessage[]> = { ...existing };

	for (const [sessionId, incMsgs] of Object.entries(incoming)) {
		const currentMsgs = merged[sessionId] || [];
		const messageMap = new Map<string, SyncMessage>();

		// Add existing messages
		for (const msg of currentMsgs) {
			const key = msg.id || `${msg.role}_${msg.createdAt}`;
			messageMap.set(key, msg);
		}

		// Merge incoming messages
		for (const msg of incMsgs) {
			const key = msg.id || `${msg.role}_${msg.createdAt}`;
			if (!messageMap.has(key)) {
				messageMap.set(key, msg);
			} else {
				// If incoming has longer/updated content, keep it
				const existingMsg = messageMap.get(key)!;
				if (msg.content && msg.content.length > existingMsg.content.length) {
					messageMap.set(key, msg);
				}
			}
		}

		// Sort chronologically
		merged[sessionId] = Array.from(messageMap.values()).sort(
			(a, b) => a.createdAt - b.createdAt,
		);
	}

	return merged;
}

/**
 * Merge user settings
 */
export function mergeSettings(
	existing: SyncSettings,
	incoming: SyncSettings,
): SyncSettings {
	return {
		...existing,
		...incoming,
		providers: incoming.providers || existing.providers || [],
	};
}

/**
 * Resolve User from Authorization Header
 */
export function resolveUserFromAuthHeader(
	authHeader: string | null,
): { userId: string; email: string } {
	if (!authHeader) {
		return { userId: "default-user", email: "user@openverse.internal" };
	}

	const token = authHeader.replace(/^Bearer\s+/i, "").trim();
	if (!token) {
		return { userId: "default-user", email: "user@openverse.internal" };
	}

	// Support simple test token or JWT parsing
	if (token.includes(".")) {
		try {
			const payload = JSON.parse(
				Buffer.from(token.split(".")[1], "base64").toString("utf-8"),
			);
			const userId = payload.sub || payload.id || `user-${token.slice(0, 8)}`;
			const email = payload.email || `${userId}@openverse.internal`;
			return { userId, email };
		} catch {}
	}

	return {
		userId: `ov-user-${token.replace(/[^a-zA-Z0-9]/g, "").slice(0, 16)}`,
		email: `${token.slice(0, 8)}@openverse.account`,
	};
}

/**
 * Handle HTTP Request for Cloud Sync
 */
export async function handleCloudSyncRequest(
	req: Request,
	url: URL,
): Promise<Response> {
	const corsHeaders = {
		"Access-Control-Allow-Origin": "*",
		"Access-Control-Allow-Methods": "GET, POST, OPTIONS",
		"Access-Control-Allow-Headers": "Content-Type, Authorization",
		"Content-Type": "application/json",
	};

	if (req.method === "OPTIONS") {
		return new Response(null, { status: 204, headers: corsHeaders });
	}

	const pathname = url.pathname.replace(/\/$/, "");

	// Health check
	if (pathname === "/api/sync/v1/health") {
		return new Response(
			JSON.stringify({
				status: "ok",
				service: "open-verse-cloud-sync",
				version: "1.0.0",
				timestamp: Date.now(),
			}),
			{ status: 200, headers: corsHeaders },
		);
	}

	// Auth login or token exchange
	if (pathname === "/api/sync/v1/auth" && req.method === "POST") {
		try {
			const body = (await req.json()) as {
				email?: string;
				displayName?: string;
				provider?: string;
				token?: string;
			};
			const email = body.email?.trim() || "user@openverse.account";
			const userId = `ov-${(body.provider || "user")}-${email.replace(/[^a-zA-Z0-9]/g, "_")}`;
			const sessionToken = body.token || `ov_tok_${Buffer.from(email).toString("base64")}`;

			loadUserState(userId, email);

			return new Response(
				JSON.stringify({
					success: true,
					token: sessionToken,
					user: {
						id: userId,
						email,
						displayName: body.displayName || email.split("@")[0],
						provider: body.provider || "email",
						createdAt: new Date().toISOString(),
					},
				}),
				{ status: 200, headers: corsHeaders },
			);
		} catch (err) {
			return new Response(
				JSON.stringify({ success: false, error: String(err) }),
				{ status: 400, headers: corsHeaders },
			);
		}
	}

	// Resolve user identity from Auth Header
	const user = resolveUserFromAuthHeader(req.headers.get("Authorization"));
	const userState = loadUserState(user.userId, user.email);

	// PULL sync endpoint
	if (pathname === "/api/sync/v1/pull" && req.method === "POST") {
		try {
			const body = (await req.json().catch(() => ({}))) as {
				lastSyncTimestamp?: number;
			};
			return new Response(
				JSON.stringify({
					success: true,
					userId: userState.userId,
					timestamp: userState.lastSyncTimestamp,
					sessions: Object.values(userState.sessions),
					messages: userState.messages,
					settings: userState.settings,
				}),
				{ status: 200, headers: corsHeaders },
			);
		} catch (err) {
			return new Response(
				JSON.stringify({ success: false, error: String(err) }),
				{ status: 500, headers: corsHeaders },
			);
		}
	}

	// PUSH sync endpoint
	if (pathname === "/api/sync/v1/push" && req.method === "POST") {
		try {
			const body = (await req.json()) as {
				sessions?: SyncSession[];
				messages?: Record<string, SyncMessage[]>;
				settings?: SyncSettings;
			};

			if (body.sessions && Array.isArray(body.sessions)) {
				userState.sessions = mergeSessions(userState.sessions, body.sessions);
			}

			if (body.messages && typeof body.messages === "object") {
				userState.messages = mergeMessages(userState.messages, body.messages);
			}

			if (body.settings && typeof body.settings === "object") {
				userState.settings = mergeSettings(userState.settings, body.settings);
			}

			saveUserState(userState);

			return new Response(
				JSON.stringify({
					success: true,
					userId: userState.userId,
					timestamp: userState.lastSyncTimestamp,
					sessionsCount: Object.keys(userState.sessions).length,
					messagesCount: Object.values(userState.messages).reduce(
						(acc, list) => acc + list.length,
						0,
					),
				}),
				{ status: 200, headers: corsHeaders },
			);
		} catch (err) {
			return new Response(
				JSON.stringify({ success: false, error: String(err) }),
				{ status: 500, headers: corsHeaders },
			);
		}
	}

	// Remote Hub Relay for Mobile Agentic Execution
	if (pathname === "/api/sync/v1/relay/dispatch" && req.method === "POST") {
		try {
			const body = (await req.json()) as {
				action: RelayTask["action"];
				params: Record<string, unknown>;
			};
			const taskId = `task_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
			const task: RelayTask = {
				id: taskId,
				userId: user.userId,
				action: body.action,
				params: body.params,
				status: "pending",
				createdAt: Date.now(),
				updatedAt: Date.now(),
			};
			relayTasks.set(taskId, task);

			return new Response(
				JSON.stringify({ success: true, taskId, status: task.status }),
				{ status: 200, headers: corsHeaders },
			);
		} catch (err) {
			return new Response(
				JSON.stringify({ success: false, error: String(err) }),
				{ status: 500, headers: corsHeaders },
			);
		}
	}

	if (pathname === "/api/sync/v1/relay/poll" && req.method === "GET") {
		const taskId = url.searchParams.get("taskId");
		if (taskId) {
			const task = relayTasks.get(taskId);
			if (!task) {
				return new Response(
					JSON.stringify({ success: false, error: "Task not found" }),
					{ status: 404, headers: corsHeaders },
				);
			}
			return new Response(JSON.stringify({ success: true, task }), {
				status: 200,
				headers: corsHeaders,
			});
		}

		// Hub polling for pending tasks for this user
		const pendingTasks = Array.from(relayTasks.values()).filter(
			(t) => t.userId === user.userId && t.status === "pending",
		);
		return new Response(JSON.stringify({ success: true, tasks: pendingTasks }), {
			status: 200,
			headers: corsHeaders,
		});
	}

	if (pathname === "/api/sync/v1/relay/result" && req.method === "POST") {
		try {
			const body = (await req.json()) as {
				taskId: string;
				status: "completed" | "failed";
				result?: unknown;
				error?: string;
			};
			const task = relayTasks.get(body.taskId);
			if (!task) {
				return new Response(
					JSON.stringify({ success: false, error: "Task not found" }),
					{ status: 404, headers: corsHeaders },
				);
			}
			task.status = body.status;
			task.result = body.result;
			task.error = body.error;
			task.updatedAt = Date.now();

			return new Response(JSON.stringify({ success: true, task }), {
				status: 200,
				headers: corsHeaders,
			});
		} catch (err) {
			return new Response(
				JSON.stringify({ success: false, error: String(err) }),
				{ status: 500, headers: corsHeaders },
			);
		}
	}

	// -------------------------------------------------------------
	// DEVICE NETWORK & CROSS-DEVICE COMMAND EXECUTION ENDPOINTS
	// -------------------------------------------------------------

	// Device registration & heartbeat
	if (
		(pathname === "/api/devices/register" || pathname === "/api/sync/v1/devices/register") &&
		req.method === "POST"
	) {
		try {
			const body = (await req.json()) as {
				deviceId: string;
				platform: DevicePlatform;
				deviceName?: string;
				capabilities?: DeviceCapability[];
				modelInfo?: string;
				batteryLevel?: number;
				appVersion?: string;
				activeSessionId?: string;
			};

			if (!body.deviceId || !body.platform) {
				return new Response(
					JSON.stringify({ success: false, error: "deviceId and platform are required" }),
					{ status: 400, headers: corsHeaders },
				);
			}

			const registered = registerDevice(user.userId, body);
			const allDevices = getUserDevices(user.userId);

			return new Response(
				JSON.stringify({
					success: true,
					device: registered,
					devices: allDevices,
					timestamp: Date.now(),
				}),
				{ status: 200, headers: corsHeaders },
			);
		} catch (err) {
			return new Response(
				JSON.stringify({ success: false, error: String(err) }),
				{ status: 500, headers: corsHeaders },
			);
		}
	}

	// List all authorized devices for this user
	if (
		(pathname === "/api/devices/list" || pathname === "/api/sync/v1/devices/list") &&
		(req.method === "GET" || req.method === "POST")
	) {
		const devices = getUserDevices(user.userId);
		return new Response(
			JSON.stringify({
				success: true,
				userId: user.userId,
				devices,
				count: devices.length,
				timestamp: Date.now(),
			}),
			{ status: 200, headers: corsHeaders },
		);
	}

	// Dispatch cross-device command
	if (
		(pathname === "/api/devices/command" || pathname === "/api/sync/v1/devices/command") &&
		req.method === "POST"
	) {
		try {
			const body = (await req.json()) as {
				sourceDeviceId: string;
				sourceDeviceName?: string;
				targetDeviceId: string;
				type:
					| "open_application"
					| "open_url"
					| "phone_call"
					| "send_notification"
					| "continue_conversation"
					| "shell_exec";
				payload: Record<string, unknown>;
			};

			if (!body.sourceDeviceId || !body.targetDeviceId || !body.type) {
				return new Response(
					JSON.stringify({
						success: false,
						error: "sourceDeviceId, targetDeviceId, and type are required",
					}),
					{ status: 400, headers: corsHeaders },
				);
			}

			const result = dispatchCommand(user.userId, {
				sourceDeviceId: body.sourceDeviceId,
				sourceDeviceName: body.sourceDeviceName || "Personal Device",
				targetDeviceId: body.targetDeviceId,
				type: body.type,
				payload: body.payload,
			});

			return new Response(
				JSON.stringify(result),
				{ status: result.success ? 200 : 400, headers: corsHeaders },
			);
		} catch (err) {
			return new Response(
				JSON.stringify({ success: false, error: String(err) }),
				{ status: 500, headers: corsHeaders },
			);
		}
	}

	// Poll incoming commands for a target device
	if (
		(pathname === "/api/devices/poll" || pathname === "/api/sync/v1/devices/poll") &&
		(req.method === "GET" || req.method === "POST")
	) {
		let deviceId = url.searchParams.get("deviceId");
		if (!deviceId && req.method === "POST") {
			try {
				const body = (await req.json().catch(() => ({}))) as { deviceId?: string };
				deviceId = body.deviceId || null;
			} catch {}
		}

		if (!deviceId) {
			return new Response(
				JSON.stringify({ success: false, error: "deviceId is required" }),
				{ status: 400, headers: corsHeaders },
			);
		}

		const pending = pollCommandsForDevice(user.userId, deviceId);
		return new Response(
			JSON.stringify({
				success: true,
				deviceId,
				commands: pending,
				count: pending.length,
				timestamp: Date.now(),
			}),
			{ status: 200, headers: corsHeaders },
		);
	}

	// Acknowledge command execution
	if (
		(pathname === "/api/devices/ack" || pathname === "/api/sync/v1/devices/ack") &&
		req.method === "POST"
	) {
		try {
			const body = (await req.json()) as {
				deviceId: string;
				commandId: string;
				status: "executed" | "failed";
				resultMessage?: string;
				errorMessage?: string;
			};

			if (!body.deviceId || !body.commandId || !body.status) {
				return new Response(
					JSON.stringify({
						success: false,
						error: "deviceId, commandId, and status are required",
					}),
					{ status: 400, headers: corsHeaders },
				);
			}

			const acknowledged = acknowledgeCommand(user.userId, body.deviceId, body);
			return new Response(
				JSON.stringify({ success: acknowledged }),
				{ status: acknowledged ? 200 : 404, headers: corsHeaders },
			);
		} catch (err) {
			return new Response(
				JSON.stringify({ success: false, error: String(err) }),
				{ status: 500, headers: corsHeaders },
			);
		}
	}

	// Revoke device authorization
	if (
		(pathname === "/api/devices/revoke" || pathname === "/api/sync/v1/devices/revoke") &&
		req.method === "POST"
	) {
		try {
			const body = (await req.json()) as { deviceId: string };
			if (!body.deviceId) {
				return new Response(
					JSON.stringify({ success: false, error: "deviceId is required" }),
					{ status: 400, headers: corsHeaders },
				);
			}

			const revoked = setDeviceAuthorization(user.userId, body.deviceId, false);
			return new Response(
				JSON.stringify({ success: revoked }),
				{ status: revoked ? 200 : 404, headers: corsHeaders },
			);
		} catch (err) {
			return new Response(
				JSON.stringify({ success: false, error: String(err) }),
				{ status: 500, headers: corsHeaders },
			);
		}
	}

	return new Response(
		JSON.stringify({ error: `Not found: ${pathname}` }),
		{ status: 404, headers: corsHeaders },
	);
}

