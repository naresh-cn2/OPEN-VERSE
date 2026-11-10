import { describe, expect, it } from "vitest";
import {
	handleCloudSyncRequest,
	mergeMessages,
	mergeSessions,
	mergeSettings,
	type SyncMessage,
	type SyncSession,
} from "./cloud-sync";

describe("Cloud Sync Core Logic", () => {
	it("merges sessions by sessionId and updates with latest activity timestamp", () => {
		const existing: Record<string, SyncSession> = {
			s1: {
				id: "s1",
				sessionId: "s1",
				title: "Old Title",
				provider: "gemini",
				model: "gemini-2.5-flash",
				startedAt: "2026-11-10T00:00:00Z",
				lastActivityAt: "2026-11-10T00:00:00Z",
			},
		};

		const incoming: SyncSession[] = [
			{
				id: "s1",
				sessionId: "s1",
				title: "Updated Title",
				provider: "gemini",
				model: "gemini-2.5-flash",
				startedAt: "2026-11-10T00:00:00Z",
				lastActivityAt: "2026-11-10T01:00:00Z",
			},
			{
				id: "s2",
				sessionId: "s2",
				title: "New Session From Android",
				provider: "anthropic",
				model: "claude-3-7-sonnet",
				startedAt: "2026-11-10T01:05:00Z",
				lastActivityAt: "2026-11-10T01:05:00Z",
			},
		];

		const merged = mergeSessions(existing, incoming);
		expect(Object.keys(merged)).toHaveLength(2);
		expect(merged.s1.title).toBe("Updated Title");
		expect(merged.s2.title).toBe("New Session From Android");
	});

	it("merges messages chronologically without losing turns across devices", () => {
		const existing: Record<string, SyncMessage[]> = {
			s1: [
				{
					id: "m1",
					sessionId: "s1",
					role: "user",
					content: "Hello from Windows",
					createdAt: 1000,
				},
				{
					id: "m2",
					sessionId: "s1",
					role: "assistant",
					content: "Response on Windows",
					createdAt: 2000,
				},
			],
		};

		const incoming: Record<string, SyncMessage[]> = {
			s1: [
				{
					id: "m3",
					sessionId: "s1",
					role: "user",
					content: "Continuing from Android",
					createdAt: 3000,
				},
				{
					id: "m4",
					sessionId: "s1",
					role: "assistant",
					content: "Response on Android",
					createdAt: 4000,
				},
			],
		};

		const merged = mergeMessages(existing, incoming);
		expect(merged.s1).toHaveLength(4);
		expect(merged.s1[0].content).toBe("Hello from Windows");
		expect(merged.s1[1].content).toBe("Response on Windows");
		expect(merged.s1[2].content).toBe("Continuing from Android");
		expect(merged.s1[3].content).toBe("Response on Android");
	});

	it("merges user settings and preserves provider configurations", () => {
		const existing = {
			theme: "dark",
			telemetryOptOut: false,
			providers: [{ id: "gemini", apiKey: "key-1" }],
		};

		const incoming = {
			theme: "system",
			providers: [{ id: "gemini", apiKey: "key-1" }, { id: "openai", apiKey: "key-2" }],
		};

		const merged = mergeSettings(existing, incoming);
		expect(merged.theme).toBe("system");
		expect(merged.telemetryOptOut).toBe(false);
		expect(merged.providers).toHaveLength(2);
	});
});

describe("Cloud Sync HTTP Endpoints", () => {
	it("responds to /api/sync/v1/health", async () => {
		const req = new Request("http://localhost/api/sync/v1/health", { method: "GET" });
		const res = await handleCloudSyncRequest(req, new URL(req.url));
		expect(res.status).toBe(200);
		const data = (await res.json()) as any;
		expect(data.status).toBe("ok");
		expect(data.service).toBe("open-verse-cloud-sync");
	});

	it("authenticates and syncs push/pull cycle across devices", async () => {
		// 1. Auth
		const authReq = new Request("http://localhost/api/sync/v1/auth", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ email: "test-dev@openverse.ai", displayName: "Test Dev" }),
		});
		const authRes = await handleCloudSyncRequest(authReq, new URL(authReq.url));
		expect(authRes.status).toBe(200);
		const authData = (await authRes.json()) as any;
		expect(authData.success).toBe(true);
		const token = authData.token;

		// 2. Windows pushes conversation
		const pushReq = new Request("http://localhost/api/sync/v1/push", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${token}`,
			},
			body: JSON.stringify({
				sessions: [
					{
						id: "sess_cross_platform_1",
						sessionId: "sess_cross_platform_1",
						title: "Architecture Planning",
						provider: "gemini",
						model: "gemini-2.5-flash",
						startedAt: "2026-11-10T00:00:00Z",
						lastActivityAt: "2026-11-10T00:00:00Z",
					},
				],
				messages: {
					sess_cross_platform_1: [
						{
							id: "m_win_1",
							sessionId: "sess_cross_platform_1",
							role: "user",
							content: "Start conversation on Windows",
							createdAt: Date.now() - 5000,
						},
					],
				},
			}),
		});
		const pushRes = await handleCloudSyncRequest(pushReq, new URL(pushReq.url));
		expect(pushRes.status).toBe(200);
		const pushData = (await pushRes.json()) as any;
		expect(pushData.success).toBe(true);
		expect(pushData.sessionsCount).toBeGreaterThanOrEqual(1);

		// 3. Android pulls conversation
		const pullReq = new Request("http://localhost/api/sync/v1/pull", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${token}`,
			},
			body: JSON.stringify({}),
		});
		const pullRes = await handleCloudSyncRequest(pullReq, new URL(pullReq.url));
		expect(pullRes.status).toBe(200);
		const pullData = (await pullRes.json()) as any;
		expect(pullData.success).toBe(true);
		expect(pullData.sessions.some((s: any) => s.id === "sess_cross_platform_1")).toBe(true);
		expect(pullData.messages.sess_cross_platform_1[0].content).toBe("Start conversation on Windows");
	});

	it("dispatches and polls relay tasks for remote agentic execution", async () => {
		const token = "test_relay_token";
		// 1. Dispatch
		const dispatchReq = new Request("http://localhost/api/sync/v1/relay/dispatch", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${token}`,
			},
			body: JSON.stringify({
				action: "exec_command",
				params: { command: "git status" },
			}),
		});
		const dispatchRes = await handleCloudSyncRequest(dispatchReq, new URL(dispatchReq.url));
		expect(dispatchRes.status).toBe(200);
		const dispatchData = (await dispatchRes.json()) as any;
		expect(dispatchData.success).toBe(true);
		expect(dispatchData.taskId).toBeDefined();

		// 2. Poll
		const pollReq = new Request(`http://localhost/api/sync/v1/relay/poll?taskId=${dispatchData.taskId}`, {
			method: "GET",
			headers: { Authorization: `Bearer ${token}` },
		});
		const pollRes = await handleCloudSyncRequest(pollReq, new URL(pollReq.url));
		expect(pollRes.status).toBe(200);
		const pollData = (await pollRes.json()) as any;
		expect(pollData.task.status).toBe("pending");
		expect(pollData.task.action).toBe("exec_command");
	});
});

