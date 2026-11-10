"use client";

import type {
	AgendaAutomationPolicy,
	AgendaTaskListInput,
	AgendaTaskRecord,
	AgendaTaskRunRecord,
	DesktopDebugLogPayload,
	HubTaskCreateInput,
	HubTaskUpdateInput,
} from "@cline/shared";
import type {
	DesktopTransportEvent,
	DesktopTransportMessage,
	DesktopTransportRequest,
	DesktopTransportResponse,
	DesktopTransportState,
} from "@/lib/desktop-transport";
import type { Provider, ProviderModel } from "@/lib/provider-schema";

// Lazily import the Tauri invoke API only when available. When running in
// sidecar/web mode (without Tauri), this module may not exist or the bridge
// may not be initialised, so we fall back to a hardcoded local WS endpoint.
async function tryTauriInvoke<T>(
	command: string,
	args?: Record<string, unknown>,
): Promise<T> {
	try {
		const { invoke } = await import("@tauri-apps/api/core");
		return await invoke<T>(command, args);
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error);
		throw new Error(`Tauri invoke failed for ${command}: ${message}`);
	}
}

/** Resolved once on first call; cached for subsequent calls. */
let resolvedEndpointCache: string | null = null;

/**
 * Resolve the backend WebSocket endpoint.
 *
 * Priority order:
 * 1. `window.__SIDECAR_WS_ENDPOINT__` — injected by the sidecar's HTML scaffold
 *    or an integration test harness.
 * 2. Tauri `get_desktop_backend_endpoint` command — used when running inside
 *    the full Tauri app shell.
 * 3. `NEXT_PUBLIC_SIDECAR_WS_ENDPOINT` (inlined at build time), then fallback
 *    to `ws://127.0.0.1:3126/transport` — the sidecar's default port when
 *    running in plain web/dev mode (`bun run dev:sidecar` + `bun run dev:web`).
 */
export async function resolveDesktopBackendWsEndpoint(): Promise<string> {
	if (resolvedEndpointCache) return resolvedEndpointCache;

	// 1. Explicit injection from sidecar or test harness.
	const injected =
		typeof window !== "undefined"
			? (window as unknown as Record<string, unknown>).__SIDECAR_WS_ENDPOINT__
			: undefined;
	if (typeof injected === "string" && injected.trim()) {
		resolvedEndpointCache = injected.trim();
		return resolvedEndpointCache;
	}

	// 2. Tauri command (full desktop app).
	if (isTauriAvailable()) {
		const endpoint = await tryTauriInvoke<string>(
			"get_desktop_backend_endpoint",
		);
		const trimmed = endpoint.trim();
		if (trimmed) {
			resolvedEndpointCache = trimmed;
			return resolvedEndpointCache;
		}
		throw new Error("Tauri returned an empty desktop backend endpoint");
	}

	// 3. Env override, then default sidecar port for local dev mode without
	// the Tauri bridge.
	const envEndpoint = process.env.NEXT_PUBLIC_SIDECAR_WS_ENDPOINT?.trim();
	resolvedEndpointCache = envEndpoint || "ws://127.0.0.1:3126/transport";
	return resolvedEndpointCache;
}

export async function resolveDesktopBackendHttpEndpoint(): Promise<string> {
	const wsEndpoint = await resolveDesktopBackendWsEndpoint();
	const endpoint = new URL(wsEndpoint);
	endpoint.protocol = endpoint.protocol === "wss:" ? "https:" : "http:";
	if (endpoint.pathname.endsWith("/transport")) {
		endpoint.pathname = endpoint.pathname.slice(0, -"/transport".length);
	}
	endpoint.search = "";
	endpoint.hash = "";
	return endpoint.toString().replace(/\/$/, "");
}

type PendingRequest = {
	resolve: (value: unknown) => void;
	reject: (error: Error) => void;
	timeoutId?: ReturnType<typeof setTimeout>;
};

type EventHandler = (payload: unknown) => void;
type TransportStateHandler = (state: DesktopTransportState) => void;

export type DesktopInvokeOptions = {
	/** Prevent sending a queued command after cancellation. Does not cancel a sent command. */
	signal?: AbortSignal;
	/**
	 * Override the default command deadline. Use `null` for commands whose
	 * response represents completion of a legitimately long-running operation.
	 */
	timeoutMs?: number | null;
	/**
	 * Override how long the command waits for the transport to connect before
	 * failing (see CONNECT_WAIT_TIMEOUT_MS). The command deadline only starts
	 * once the transport is up.
	 */
	connectTimeoutMs?: number;
};

export type AgendaTaskIdInput = {
	taskId: string;
};

export type AgendaTaskRevisionInput = AgendaTaskIdInput & {
	expectedRevision: number;
};

export type AgendaTaskCancelInput = AgendaTaskRevisionInput & {
	reason?: string;
};

export type AgendaAutomationSetInput = {
	policy: Omit<AgendaAutomationPolicy, "updatedAt">;
};

export type DesktopErrorReport = {
	operation: string;
	error: unknown;
	handled?: boolean;
	command?: string;
	timeoutMs?: number;
	/** Failing resource URL from an ErrorEvent's `filename`. */
	sourceUrl?: string;
	lineno?: number;
	colno?: number;
};

/**
 * Upper bound for free-form attribution strings (source URLs, stack traces)
 * so a single report stays small on the wire and in telemetry storage.
 */
const ERROR_REPORT_FIELD_LIMIT = 500;

function boundedReportString(value: unknown): string | undefined {
	return typeof value === "string" && value.trim()
		? value.slice(0, ERROR_REPORT_FIELD_LIMIT)
		: undefined;
}

function finiteReportNumber(value: unknown): number | undefined {
	return typeof value === "number" && Number.isFinite(value)
		? value
		: undefined;
}

/**
 * Settle with `promise`, or reject with `onTimeout()` once `timeoutMs` has
 * elapsed. The underlying promise is left running; only this waiter gives up.
 */
function raceDeadline<T>(
	promise: Promise<T>,
	timeoutMs: number,
	onTimeout: () => Error,
): Promise<T> {
	let timer: ReturnType<typeof setTimeout> | undefined;
	const timeout = new Promise<never>((_, reject) => {
		timer = setTimeout(() => reject(onTimeout()), timeoutMs);
	});
	return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

const REQUEST_TIMEOUT_MS = 120_000;
const RECONNECT_BASE_DELAY_MS = 400;
const RECONNECT_MAX_DELAY_MS = 4_000;
/**
 * How long invoke() waits for a usable transport before failing the command.
 * At app launch the sidecar may still be booting (login-shell PATH probe,
 * hub-runtime spawn) or being respawned after a failed first start, and the
 * Tauri endpoint command reports "not ready" until then (cline/cline#14201,
 * #14129). Each connect attempt can itself block for the Tauri shell's 30s
 * endpoint wait, so this budget covers a couple of full attempts.
 */
const CONNECT_WAIT_TIMEOUT_MS = 90_000;
const CONNECT_RETRY_DELAY_MS = 500;
/**
 * Upper bound on a single WebSocket handshake. A socket that never leaves
 * CONNECTING (and so never fires onclose) would otherwise keep the shared
 * connect promise pending forever and wedge every command behind it; closing
 * it fails the attempt so the normal reconnect path takes over.
 */
const WS_HANDSHAKE_TIMEOUT_MS = 15_000;
const DESKTOP_DEBUG_LOG_EVENT = "desktop_debug_log";
// Commands that should be routed to Tauri's native invoke bridge instead of
// the WebSocket transport — only applicable in the full Tauri app shell.
// In sidecar/web mode these commands are handled by the sidecar over WebSocket.
export function isTauriAvailable(): boolean {
	return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
}

export function isMobileEnvironment(): boolean {
	if (typeof window === "undefined") return false;
	if ("AndroidInterface" in window) return true;
	if (
		"webkit" in window &&
		typeof (window as unknown as { webkit?: { messageHandlers?: Record<string, unknown> } }).webkit?.messageHandlers?.openverse === "object"
	) {
		return true;
	}
	if (Boolean((window as unknown as Record<string, unknown>).__OPENVERSE_MOBILE__)) {
		return true;
	}
	const ua = navigator.userAgent || "";
	return /Android|iPhone|iPad|iPod|Mobile|OPEN-VERSE-Mobile/i.test(ua);
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return value !== null && typeof value === "object" && !Array.isArray(value);
}

function parseDesktopDebugLogPayload(
	payload: unknown,
): DesktopDebugLogPayload | null {
	if (!isRecord(payload)) return null;
	const { level, message, metadata, scope, timestamp } = payload;
	if (
		(level !== "debug" && level !== "info" && level !== "error") ||
		typeof message !== "string" ||
		typeof scope !== "string" ||
		typeof timestamp !== "string"
	) {
		return null;
	}
	return {
		level,
		message,
		scope,
		timestamp,
		metadata: isRecord(metadata) ? metadata : undefined,
	};
}

function webviewDebugLoggingEnabled(): boolean {
	let runtimeEnabled = false;
	try {
		runtimeEnabled =
			typeof window !== "undefined" &&
			window.localStorage.getItem("cline.debugLogs") === "1";
	} catch {
		// Some embedded/privacy contexts deny localStorage access.
	}
	return (
		process.env.NODE_ENV !== "production" ||
		process.env.NEXT_PUBLIC_CLINE_DEBUG_LOGS === "1" ||
		runtimeEnabled
	);
}

export function writeDesktopDebugLog(payload: unknown): void {
	const entry = parseDesktopDebugLogPayload(payload);
	if (!entry || !webviewDebugLoggingEnabled()) {
		return;
	}
	const prefix = `[desktop:${entry.scope}] ${entry.message}`;
	const details = {
		timestamp: entry.timestamp,
		...(entry.metadata ?? {}),
	};
	if (entry.level === "error") {
		console.error("%s %o", prefix, details);
	} else if (entry.level === "info") {
		console.info("%s %o", prefix, details);
	} else {
		console.debug("%s %o", prefix, details);
	}
}

const NATIVE_COMMANDS = new Set([
	"pick_workspace_directory",
	"open_mcp_settings_file",
	"get_update_status",
	"restart_to_apply_update",
	"check_for_update_now",
	"set_app_icon",
	"show_session_notification",
	"drain_desktop_actions",
	"set_tray_status",
	"relaunch_app",
	"quit_app",
	"open_external_url",
	"set_quit_shortcut_native",
]);

class DesktopClient {
	private socket: WebSocket | null = null;
	private connectPromise: Promise<void> | null = null;
	private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
	private requestCounter = 0;
	private pending = new Map<string, PendingRequest>();
	private handlers = new Map<string, Set<EventHandler>>();
	private transportStateHandlers = new Set<TransportStateHandler>();
	private transportState: DesktopTransportState = "connecting";
	private transportError: string | null = null;
	private hasConnectedOnce = false;
	private endpoint: string | null = null;
	private recentErrorReports = new Map<string, number>();
	private reportedErrorObjects = new WeakSet<object>();
	private errorObjectDeliveries = new WeakMap<object, Promise<boolean>>();
	private isStandalone = false;
	private cachedHubStatus: Record<string, unknown> = { state: "starting" };

	constructor() {
		if (typeof window !== "undefined") {
			try {
				let hasCustomEndpoint = false;
				try {
					hasCustomEndpoint = Boolean(
						(window as unknown as Record<string, unknown>).__SIDECAR_WS_ENDPOINT__ ||
						window.localStorage?.getItem("openverse_hub_endpoint"),
					);
				} catch {
					hasCustomEndpoint = false;
				}
				if (isMobileEnvironment() && !hasCustomEndpoint) {
					this.isStandalone = true;
					this.transportState = "connected";
					this.cachedHubStatus = { state: "ready" };
					setTimeout(() => {
						this.enableStandaloneMode();
					}, 0);
				}
			} catch (e) {
				console.warn("DesktopClient init error", e);
				if (isMobileEnvironment()) {
					this.isStandalone = true;
					this.transportState = "connected";
					this.cachedHubStatus = { state: "ready" };
				}
			}

			// Periodic cloud sync pull for unified cross-device continuity (ChatGPT/Gemini style)
			setTimeout(() => {
				void this.syncCloudPull();
			}, 1500);
			setInterval(() => {
				void this.syncCloudPull();
			}, 25_000);
		}
	}

	public isStandaloneMode(): boolean {
		return this.isStandalone;
	}

	public getHubStatus(): { state: string; error?: string } {
		return (this.isStandalone ? { state: "ready" } : this.cachedHubStatus) as { state: string; error?: string };
	}

	public enableStandaloneMode(): void {
		this.isStandalone = true;
		this.hasConnectedOnce = true;
		this.transportError = null;
		this.cachedHubStatus = { state: "ready" };
		this.setTransportState("connected");
		this.dispatchEvent({
			type: "event",
			event: {
				name: "hub_status",
				payload: { state: "ready" },
			},
		});
	}

	reportError(report: DesktopErrorReport): void {
		const error = report.error;
		if (typeof error === "object" && error !== null) {
			if (this.reportedErrorObjects.has(error)) {
				return;
			}
			const pendingDelivery = this.errorObjectDeliveries.get(error);
			if (pendingDelivery) {
				void pendingDelivery.then((delivered) => {
					if (!delivered) this.reportError(report);
				});
				return;
			}
		}

		const delivery = this.deliverErrorReport(report);
		if (typeof error === "object" && error !== null) {
			this.errorObjectDeliveries.set(error, delivery);
			void delivery.then((delivered) => {
				if (delivered) this.reportedErrorObjects.add(error);
				if (this.errorObjectDeliveries.get(error) === delivery) {
					this.errorObjectDeliveries.delete(error);
				}
			});
		}
	}

	private async deliverErrorReport(
		report: DesktopErrorReport,
	): Promise<boolean> {
		const error = report.error;
		const errorMessage = error instanceof Error ? error.message : String(error);
		const errorType = error instanceof Error ? error.name : "Error";
		const dedupeKey = `${report.operation}:${report.command ?? ""}:${errorType}:${errorMessage}`;
		const now = Date.now();
		if ((this.recentErrorReports.get(dedupeKey) ?? 0) > now - 10_000) {
			return true;
		}
		for (const [key, timestamp] of this.recentErrorReports) {
			if (timestamp <= now - 10_000) this.recentErrorReports.delete(key);
		}

		try {
			const endpoint = await resolveDesktopBackendHttpEndpoint();
			const response = await fetch(`${endpoint}/telemetry/error`, {
				method: "POST",
				headers: { "content-type": "application/json" },
				body: JSON.stringify({
					operation: report.operation,
					errorMessage,
					errorType,
					handled: report.handled ?? true,
					command: report.command,
					timeoutMs: report.timeoutMs,
					transportState: this.transportState,
					sourceUrl: boundedReportString(report.sourceUrl),
					lineno: finiteReportNumber(report.lineno),
					colno: finiteReportNumber(report.colno),
					stack: boundedReportString(
						error instanceof Error ? error.stack : undefined,
					),
				}),
			});
			if (!response.ok) return false;
			this.recentErrorReports.set(dedupeKey, Date.now());
			return true;
		} catch {
			// Error reporting must never affect the desktop UI error path.
			return false;
		}
	}

	private setTransportState(next: DesktopTransportState) {
		this.transportState = next;
		for (const handler of this.transportStateHandlers) {
			handler(next);
		}
	}

	private async getBackendEndpoint(): Promise<string> {
		if (this.endpoint?.trim()) {
			return this.endpoint;
		}
		const endpoint = await resolveDesktopBackendWsEndpoint();
		this.endpoint = endpoint;
		return this.endpoint;
	}

	private takePending(requestId: string): PendingRequest | undefined {
		const pending = this.pending.get(requestId);
		if (!pending) {
			return undefined;
		}
		if (pending.timeoutId !== undefined) {
			clearTimeout(pending.timeoutId);
		}
		this.pending.delete(requestId);
		return pending;
	}

	private rejectPending(errorMessage: string) {
		// Only report closures that actually drop in-flight requests; a clean
		// transport close (app quit, sidecar restart) is not an error.
		if (this.pending.size > 0) {
			this.reportError({
				operation: "webview.transport_closed",
				error: new Error(errorMessage),
			});
		}
		for (const requestId of this.pending.keys()) {
			this.takePending(requestId)?.reject(new Error(errorMessage));
		}
	}

	private dispatchEvent(message: DesktopTransportEvent) {
		if (message.event.name === "hub_status" && isRecord(message.event.payload)) {
			this.cachedHubStatus = message.event.payload as Record<string, unknown>;
		}
		if (message.event.name === DESKTOP_DEBUG_LOG_EVENT) {
			writeDesktopDebugLog(message.event.payload);
		}
		const handlers = this.handlers.get(message.event.name);
		if (!handlers || handlers.size === 0) {
			return;
		}
		for (const handler of handlers) {
			handler(message.event.payload);
		}
	}

	private handleMessage(raw: string) {
		let parsed: DesktopTransportMessage;
		try {
			parsed = JSON.parse(raw) as DesktopTransportMessage;
		} catch (error) {
			this.reportError({
				operation: "webview.transport_message_parse",
				error,
			});
			return;
		}

		if (parsed.type === "event") {
			this.dispatchEvent(parsed);
			return;
		}

		const response = parsed as DesktopTransportResponse;
		const pending = this.takePending(response.id);
		if (!pending) {
			return;
		}
		if (!response.ok) {
			pending.reject(new Error(response.error || "Desktop command failed"));
			return;
		}
		pending.resolve(response.result);
	}

	private scheduleReconnect() {
		if (this.reconnectTimer) {
			clearTimeout(this.reconnectTimer);
		}
		const attempt = Math.max(this.pending.size, 1);
		const delayMs = Math.min(
			RECONNECT_BASE_DELAY_MS * 2 ** Math.min(attempt, 4),
			RECONNECT_MAX_DELAY_MS,
		);
		// Re-resolve the endpoint on every attempt: a sidecar the Tauri shell
		// respawned listens on the same port but issues a new approval token,
		// and one that was still booting only publishes its endpoint later.
		this.endpoint = null;
		resolvedEndpointCache = null;
		this.reconnectTimer = setTimeout(() => {
			void this.ensureConnected(true).catch(() => {
				// The failure path already scheduled the next attempt.
			});
		}, delayMs);
	}

	private async ensureConnected(isReconnect = false): Promise<void> {
		if (this.isStandalone) {
			this.setTransportState("connected");
			return;
		}
		if (
			this.socket &&
			(this.socket.readyState === WebSocket.OPEN ||
				this.socket.readyState === WebSocket.CONNECTING)
		) {
			return;
		}
		if (this.connectPromise) {
			return this.connectPromise;
		}

		this.setTransportState(
			this.hasConnectedOnce || isReconnect ? "reconnecting" : "connecting",
		);

		this.connectPromise = (async () => {
			const endpoint = await this.getBackendEndpoint();
			await new Promise<void>((resolve, reject) => {
				const socket = new WebSocket(endpoint);
				this.socket = socket;
				const handshakeTimer = setTimeout(() => {
					if (socket.readyState === WebSocket.CONNECTING) {
						// close() on a CONNECTING socket fails the handshake and
						// fires onclose, which rejects this attempt below.
						socket.close();
					}
				}, WS_HANDSHAKE_TIMEOUT_MS);
				socket.onopen = () => {
					clearTimeout(handshakeTimer);
					this.hasConnectedOnce = true;
					this.transportError = null;
					this.setTransportState("connected");
					resolve();
				};
				socket.onmessage = (event) => {
					this.handleMessage(String(event.data));
				};
				socket.onerror = () => {
					// Wait for onclose to reject or reconnect.
				};
				socket.onclose = () => {
					clearTimeout(handshakeTimer);
					if (this.socket === socket) {
						this.socket = null;
					}
					if (this.transportState !== "connected") {
						reject(
							new Error(`Desktop backend transport unavailable at ${endpoint}`),
						);
						return;
					}
					this.setTransportState("reconnecting");
					this.rejectPending("Desktop backend transport closed");
					this.scheduleReconnect();
				};
			});
		})()
			.catch((error) => {
				const message = error instanceof Error ? error.message : String(error);
				this.transportError = message;
				this.reportError({
					operation: "webview.transport_connect",
					error,
				});
				if (!this.hasConnectedOnce) {
					this.setTransportState("unavailable");
				}
				// A failed connect usually means the sidecar is still booting
				// (the Tauri endpoint command gives up after a fixed poll) or is
				// being respawned by the shell's health check. Keep trying rather
				// than parking the UI on "unavailable" until the app is relaunched.
				this.scheduleReconnect();
				throw error;
			})
			.finally(() => {
				this.connectPromise = null;
			});

		return this.connectPromise;
	}

	/**
	 * Wait for an open transport, retrying failed connect attempts until the
	 * deadline. A command must not fail just because its connect attempt raced
	 * a sidecar that was still booting or being respawned: the endpoint
	 * resolution is retried here (and each retry re-resolves the endpoint,
	 * see scheduleReconnect) until the sidecar comes up or the budget runs
	 * out. Rethrows the last connect error so a real failure keeps its cause.
	 *
	 * The deadline is a hard bound: an attempt still in flight when it lapses
	 * (an endpoint lookup blocked in the Tauri shell, a handshake that has not
	 * settled) is abandoned by this caller. The shared connect attempt itself
	 * keeps running so a later command, or the reconnect loop, can still use
	 * its result.
	 */
	private async connectForCommand(
		command: string,
		timeoutMs: number,
	): Promise<void> {
		const deadline = Date.now() + timeoutMs;
		let lastError: unknown;
		for (;;) {
			const remaining = deadline - Date.now();
			if (remaining <= 0) {
				break;
			}
			let timedOut = false;
			try {
				await raceDeadline(this.ensureConnected(), remaining, () => {
					timedOut = true;
					const cause = this.transportError ?? "still connecting";
					return new Error(
						`Desktop backend transport did not become ready within ${timeoutMs}ms (${cause})`,
					);
				});
				if (this.socket?.readyState === WebSocket.OPEN) {
					return;
				}
				lastError = new Error("Desktop backend transport unavailable");
			} catch (error) {
				lastError = error;
				if (timedOut) {
					break;
				}
			}
			const delay = Math.min(CONNECT_RETRY_DELAY_MS, deadline - Date.now());
			if (delay <= 0) {
				break;
			}
			await new Promise((resolve) => setTimeout(resolve, delay));
		}
		const error =
			lastError instanceof Error
				? lastError
				: new Error(
						lastError === undefined
							? "Desktop backend transport unavailable"
							: String(lastError),
					);
		this.reportError({
			operation: "webview.transport_unavailable",
			error,
			command,
			timeoutMs,
		});
		throw error;
	}

	async invoke<T>(
		command: string,
		args?: Record<string, unknown>,
		options?: DesktopInvokeOptions,
	): Promise<T> {
		if (this.isStandalone) {
			return this.handleStandaloneCommand<T>(command, args);
		}

		// Route native OS commands (directory picker, file opener) through Tauri
		// only when running inside the full Tauri app shell. In sidecar/web mode
		// these are handled by the sidecar over WebSocket.
		if (NATIVE_COMMANDS.has(command) && isTauriAvailable()) {
			try {
				return await tryTauriInvoke<T>(command, args);
			} catch (error) {
				this.reportError({
					operation: "webview.native_command",
					error,
					command,
				});
				throw error;
			}
		}

		options?.signal?.throwIfAborted();
		await this.connectForCommand(
			command,
			options?.connectTimeoutMs ?? CONNECT_WAIT_TIMEOUT_MS,
		);
		options?.signal?.throwIfAborted();
		const socket = this.socket;
		if (!socket || socket.readyState !== WebSocket.OPEN) {
			// connectForCommand only returns with an open socket; this covers
			// the window where it closed again before the request was sent.
			const error = new Error("Desktop backend transport unavailable");
			this.reportError({
				operation: "webview.transport_unavailable",
				error,
				command,
			});
			throw error;
		}

		const id = `desktop_${Date.now()}_${this.requestCounter++}`;
		const request: DesktopTransportRequest = {
			type: "command",
			id,
			command,
			args,
		};

		return await new Promise<T>((resolve, reject) => {
			const timeoutMs =
				options?.timeoutMs === undefined
					? REQUEST_TIMEOUT_MS
					: options.timeoutMs;
			const timeoutId =
				timeoutMs === null
					? undefined
					: setTimeout(() => {
							const pending = this.takePending(id);
							if (!pending) {
								return;
							}
							const error = new Error(
								`Desktop command timed out waiting for ${command}`,
							);
							this.reportError({
								operation: "webview.command_timeout",
								error,
								command,
								timeoutMs,
							});
							pending.reject(error);
						}, timeoutMs);
			this.pending.set(id, {
				resolve: (value) => resolve(value as T),
				reject,
				timeoutId,
			});
			try {
				socket.send(JSON.stringify(request));
			} catch (error) {
				this.takePending(id);
				this.reportError({
					operation: "webview.command_send",
					error,
					command,
				});
				throw error;
			}
		});
	}

	subscribe(eventName: string, handler: EventHandler): () => void {
		void this.ensureConnected(true).catch(() => {
			// Keep UI functional enough to surface later retries.
		});
		const handlers = this.handlers.get(eventName) ?? new Set<EventHandler>();
		handlers.add(handler);
		this.handlers.set(eventName, handlers);
		if (eventName === "hub_status" && (this.isStandalone || this.cachedHubStatus?.state === "ready")) {
			try {
				handler(this.cachedHubStatus?.state === "ready" ? this.cachedHubStatus : { state: "ready" });
			} catch (e) {
				console.error("Error in immediate hub_status handler", e);
			}
		}
		return () => {
			const current = this.handlers.get(eventName);
			if (!current) {
				return;
			}
			current.delete(handler);
			if (current.size === 0) {
				this.handlers.delete(eventName);
			}
		};
	}

	subscribeTransportState(handler: TransportStateHandler): () => void {
		this.transportStateHandlers.add(handler);
		handler(this.transportState);
		void this.ensureConnected(true).catch(() => {
			// Ignore eager connect failures; commands will surface them.
		});
		return () => {
			this.transportStateHandlers.delete(handler);
		};
	}

	getTransportState(): DesktopTransportState {
		return this.transportState;
	}

	getTransportError(): string | null {
		return this.transportError;
	}

	async createAgendaTask(input: HubTaskCreateInput): Promise<AgendaTaskRecord> {
		const response = await this.invoke<{ task: AgendaTaskRecord }>(
			"task.create",
			{ ...input },
		);
		return response.task;
	}

	async listAgendaTasks(
		input: AgendaTaskListInput = {},
	): Promise<AgendaTaskRecord[]> {
		const response = await this.invoke<{ tasks: AgendaTaskRecord[] }>(
			"task.list",
			{ ...input },
		);
		return response.tasks ?? [];
	}

	async getAgendaTask(taskId: string): Promise<AgendaTaskRecord | undefined> {
		const response = await this.invoke<{ task?: AgendaTaskRecord }>(
			"task.get",
			{
				taskId,
			},
		);
		return response.task;
	}

	async updateAgendaTask(input: HubTaskUpdateInput): Promise<AgendaTaskRecord> {
		const response = await this.invoke<{ task: AgendaTaskRecord }>(
			"task.update",
			{ ...input },
		);
		return response.task;
	}

	async approveAgendaTask(
		input: AgendaTaskRevisionInput,
	): Promise<AgendaTaskRecord> {
		const response = await this.invoke<{ task: AgendaTaskRecord }>(
			"task.approve",
			{ ...input },
		);
		return response.task;
	}

	async cancelAgendaTask(
		input: AgendaTaskCancelInput,
	): Promise<AgendaTaskRecord> {
		const response = await this.invoke<{ task: AgendaTaskRecord }>(
			"task.cancel",
			{ ...input },
		);
		return response.task;
	}

	async runAgendaTask(input: AgendaTaskRevisionInput): Promise<{
		task: AgendaTaskRecord;
		run?: AgendaTaskRunRecord;
	}> {
		return await this.invoke<{
			task: AgendaTaskRecord;
			run?: AgendaTaskRunRecord;
		}>("task.run", { ...input });
	}

	async getAgendaAutomationPolicy(): Promise<AgendaAutomationPolicy> {
		const response = await this.invoke<{ policy: AgendaAutomationPolicy }>(
			"task.automation.get",
		);
		return response.policy;
	}

	async setAgendaAutomationPolicy(
		input: AgendaAutomationSetInput,
	): Promise<AgendaAutomationPolicy> {
		const response = await this.invoke<{ policy: AgendaAutomationPolicy }>(
			"task.automation.set",
			{ ...input },
		);
		return response.policy;
	}

	public getCloudSyncBaseUrl(): string {
		if (typeof window !== "undefined") {
			const custom = window.localStorage.getItem("openverse.cloud_sync_url.v1");
			if (custom) return custom.replace(/\/+$/, "");
			if (this.currentEndpoint && this.currentEndpoint.startsWith("http")) {
				return this.currentEndpoint.replace(/\/+$/, "");
			}
		}
		return "https://open-verse-website.vercel.app";
	}

	public getCloudSyncAuthToken(): string | null {
		if (typeof window === "undefined") return null;
		try {
			const raw = window.localStorage.getItem("openverse.auth.session.v1");
			if (!raw) return null;
			const session = JSON.parse(raw);
			return session.accessToken || session.user?.id || null;
		} catch {
			return null;
		}
	}

	public async syncCloudPull(): Promise<{ success: boolean; sessionsCount?: number }> {
		const token = this.getCloudSyncAuthToken();
		if (!token) return { success: false };
		const baseUrl = this.getCloudSyncBaseUrl();
		try {
			const res = await fetch(`${baseUrl}/api/sync/v1/pull`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${token}`,
				},
				body: JSON.stringify({}),
			});
			if (!res.ok) return { success: false };
			const data = (await res.json()) as { success?: boolean; sessions?: Record<string, unknown>[]; messages?: Record<string, Record<string, unknown>[]> };
			if (!data.success) return { success: false };

			if (typeof window !== "undefined" && Array.isArray(data.sessions)) {
				const localRaw = window.localStorage.getItem("openverse_sessions_v1");
				const localSessions: Record<string, unknown>[] = localRaw ? JSON.parse(localRaw) : [];
				const sessionMap = new Map<string, Record<string, unknown>>();

				for (const s of localSessions) {
					const sid = (s.sessionId || s.id) as string;
					if (sid) sessionMap.set(sid, s);
				}
				for (const s of data.sessions) {
					const sid = (s.sessionId || s.id) as string;
					if (!sid) continue;
					if (!sessionMap.has(sid)) {
						sessionMap.set(sid, s);
					} else {
						const existing = sessionMap.get(sid)!;
						const exTime = new Date((existing.lastActivityAt as string) || 0).getTime();
						const inTime = new Date((s.lastActivityAt as string) || 0).getTime();
						if (inTime >= exTime) {
							sessionMap.set(sid, { ...existing, ...s });
						}
					}
				}
				window.localStorage.setItem("openverse_sessions_v1", JSON.stringify(Array.from(sessionMap.values())));

				if (data.messages && typeof data.messages === "object") {
					for (const [sid, cloudMsgs] of Object.entries(data.messages)) {
						const msgKey = `openverse_msg_${sid}`;
						const localMsgRaw = window.localStorage.getItem(msgKey);
						const localMsgs: Record<string, unknown>[] = localMsgRaw ? JSON.parse(localMsgRaw) : [];
						const msgMap = new Map<string, Record<string, unknown>>();
						for (const m of localMsgs) {
							const mid = (m.id || `${m.role}_${m.createdAt}`) as string;
							msgMap.set(mid, m);
						}
						for (const m of (cloudMsgs as Record<string, unknown>[])) {
							const mid = (m.id || `${m.role}_${m.createdAt}`) as string;
							if (!msgMap.has(mid)) msgMap.set(mid, m);
						}
						const sorted = Array.from(msgMap.values()).sort(
							(a, b) => ((a.createdAt as number) || 0) - ((b.createdAt as number) || 0),
						);
						window.localStorage.setItem(msgKey, JSON.stringify(sorted));
					}
				}

				// Synchronize AI Provider configurations and Model preferences across devices
				if (data.settings && typeof data.settings === "object") {
					const cloudSettings = data.settings as Record<string, unknown>;
					if (Array.isArray(cloudSettings.providers)) {
						const localProvidersRaw = window.localStorage.getItem("openverse_providers_v1");
						const localProviders: Provider[] = localProvidersRaw ? JSON.parse(localProvidersRaw) : [];
						const providerMap = new Map<string, Provider>();
						for (const p of localProviders) {
							providerMap.set(p.id, p);
						}
						for (const cp of (cloudSettings.providers as Provider[])) {
							if (!providerMap.has(cp.id)) {
								providerMap.set(cp.id, {
									...cp,
									apiKey: undefined, // Requires local credentials or reconnect
								});
							} else {
								const existing = providerMap.get(cp.id)!;
								providerMap.set(cp.id, {
									...existing,
									enabled: cp.enabled ?? existing.enabled,
									defaultModelId: cp.defaultModelId ?? existing.defaultModelId,
									baseUrl: cp.baseUrl || existing.baseUrl,
								});
							}
						}
						window.localStorage.setItem("openverse_providers_v1", JSON.stringify(Array.from(providerMap.values())));
					}

					if (cloudSettings.favoriteModels && typeof cloudSettings.favoriteModels === "object") {
						window.localStorage.setItem("cline.favorite-provider-models.v1", JSON.stringify(cloudSettings.favoriteModels));
					}
					if (typeof cloudSettings.defaultModelId === "string") {
						window.localStorage.setItem("openverse.default_model_id", cloudSettings.defaultModelId);
					}
					window.dispatchEvent(new CustomEvent("openverse:providers-updated"));
				}

				window.dispatchEvent(new CustomEvent("openverse:sessions-updated"));
			}
			return { success: true, sessionsCount: data.sessions?.length };
		} catch {
			return { success: false };
		}
	}

	public async syncCloudPush(): Promise<{ success: boolean }> {
		const token = this.getCloudSyncAuthToken();
		if (!token || typeof window === "undefined") return { success: false };
		const baseUrl = this.getCloudSyncBaseUrl();
		try {
			const sessRaw = window.localStorage.getItem("openverse_sessions_v1");
			const sessions = sessRaw ? JSON.parse(sessRaw) : [];
			const messages: Record<string, unknown[]> = {};
			for (const s of sessions) {
				const sid = (s.sessionId || s.id) as string;
				if (sid) {
					const msgRaw = window.localStorage.getItem(`openverse_msg_${sid}`);
					if (msgRaw) {
						messages[sid] = JSON.parse(msgRaw);
					}
				}
			}

			// Read settings: configured providers, favorite models, default model
			let settings: Record<string, unknown> | undefined;
			try {
				const providersRaw = window.localStorage.getItem("openverse_providers_v1");
				const providersList: Provider[] = providersRaw ? JSON.parse(providersRaw) : [];
				const sanitizedProviders = providersList.map((p) => ({
					id: p.id,
					name: p.name,
					models: p.models,
					color: p.color,
					letter: p.letter,
					enabled: p.enabled,
					configured: p.configured,
					defaultModelId: p.defaultModelId,
					baseUrl: p.baseUrl,
				}));

				const favoritesRaw = window.localStorage.getItem("cline.favorite-provider-models.v1");
				const favoriteModels = favoritesRaw ? JSON.parse(favoritesRaw) : undefined;
				const defaultModelId = window.localStorage.getItem("openverse.default_model_id");

				settings = {
					providers: sanitizedProviders,
					favoriteModels,
					defaultModelId,
				};
			} catch {}

			const res = await fetch(`${baseUrl}/api/sync/v1/push`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${token}`,
				},
				body: JSON.stringify({ sessions, messages, settings }),
			});
			if (!res.ok) return { success: false };
			const data = (await res.json()) as { success?: boolean };
			return { success: Boolean(data.success) };
		} catch {
			return { success: false };
		}
	}

	private getStandaloneProviders(): Provider[] {
		const defaultProviders: Provider[] = [
			{
				id: "gemini",
				name: "Google Gemini",
				models: 5,
				color: "#4285F4",
				letter: "G",
				enabled: true,
				configured: false,
				defaultModelId: "gemini-2.5-flash",
				capabilities: ["streaming", "tools", "vision"],
				docUrl: "https://aistudio.google.com/apikey",
				docLabel: "Google AI Studio",
				authDescription: "Enter your Gemini API key from Google AI Studio",
			},
			{
				id: "openai",
				name: "OpenAI",
				models: 5,
				color: "#10A37F",
				letter: "O",
				enabled: true,
				configured: false,
				defaultModelId: "gpt-4o",
				capabilities: ["streaming", "tools", "vision"],
				docUrl: "https://platform.openai.com/api-keys",
				docLabel: "OpenAI Platform",
				authDescription: "Enter your OpenAI API key",
			},
			{
				id: "anthropic",
				name: "Anthropic Claude",
				models: 3,
				color: "#D97706",
				letter: "A",
				enabled: true,
				configured: false,
				defaultModelId: "claude-3-7-sonnet-latest",
				capabilities: ["streaming", "tools", "vision", "reasoning"],
				docUrl: "https://console.anthropic.com/settings/keys",
				docLabel: "Anthropic Console",
				authDescription: "Enter your Anthropic API key",
			},
			{
				id: "openrouter",
				name: "OpenRouter",
				models: 4,
				color: "#6366F1",
				letter: "R",
				enabled: true,
				configured: false,
				defaultModelId: "google/gemini-2.5-flash",
				capabilities: ["streaming", "tools", "vision"],
				docUrl: "https://openrouter.ai/settings/keys",
				docLabel: "OpenRouter Console",
				authDescription: "Enter your OpenRouter API key",
			},
			{
				id: "deepseek",
				name: "DeepSeek",
				models: 2,
				color: "#0066FF",
				letter: "D",
				enabled: true,
				configured: false,
				defaultModelId: "deepseek-chat",
				capabilities: ["streaming", "tools", "reasoning"],
				docUrl: "https://platform.deepseek.com/api_keys",
				docLabel: "DeepSeek Platform",
				authDescription: "Enter your DeepSeek API key",
			},
			{
				id: "groq",
				name: "Groq",
				models: 3,
				color: "#F55036",
				letter: "Q",
				enabled: true,
				configured: false,
				defaultModelId: "llama-3.3-70b-versatile",
				capabilities: ["streaming", "tools"],
				docUrl: "https://console.groq.com/keys",
				docLabel: "Groq Console",
				authDescription: "Enter your Groq API key",
			},
			{
				id: "ollama",
				name: "Ollama (Local/LAN)",
				models: 4,
				color: "#111827",
				letter: "L",
				enabled: true,
				configured: true,
				baseUrl: "http://localhost:11434/v1",
				defaultModelId: "llama3.2",
				capabilities: ["streaming", "tools"],
				authDescription: "Local or LAN Ollama endpoint without an API key",
			},
		];

		try {
			if (typeof window !== "undefined") {
				const storedRaw = window.localStorage.getItem("openverse_providers_v1");
				const storedProviders: Provider[] = storedRaw ? JSON.parse(storedRaw) : [];
				const keysRaw = window.localStorage.getItem("cline.providers.keys");
				const storedKeys: Record<string, string> = keysRaw ? JSON.parse(keysRaw) : {};

				const merged = defaultProviders.map((def) => {
					const custom = storedProviders.find((p) => p.id === def.id);
					const apiKey = custom?.apiKey || storedKeys[def.id] || "";
					const isConfigured = Boolean(apiKey.trim()) || def.id === "ollama";
					return {
						...def,
						...(custom || {}),
						apiKey,
						configured: isConfigured,
					};
				});

				for (const custom of storedProviders) {
					if (!merged.some((p) => p.id === custom.id)) {
						merged.push({
							...custom,
							configured: Boolean(custom.apiKey?.trim() || custom.baseUrl?.trim()),
						});
					}
				}
				return merged;
			}
		} catch {}
		return defaultProviders;
	}

	private getStandaloneModels(providerId: string): ProviderModel[] {
		const catalog: Record<string, ProviderModel[]> = {
			gemini: [
				{ id: "gemini-2.5-flash", name: "Gemini 2.5 Flash", contextWindow: 1048576, supportsVision: true, supportsReasoning: true, inputModalities: ["text", "image"], outputModalities: ["text"], operationModes: ["streaming"] },
				{ id: "gemini-2.5-pro", name: "Gemini 2.5 Pro", contextWindow: 2097152, supportsVision: true, supportsReasoning: true, inputModalities: ["text", "image"], outputModalities: ["text"], operationModes: ["streaming"] },
				{ id: "gemini-2.0-flash", name: "Gemini 2.0 Flash", contextWindow: 1048576, supportsVision: true, supportsReasoning: false, inputModalities: ["text", "image"], outputModalities: ["text"], operationModes: ["streaming"] },
				{ id: "gemini-1.5-flash", name: "Gemini 1.5 Flash", contextWindow: 1048576, supportsVision: true, supportsReasoning: false, inputModalities: ["text", "image"], outputModalities: ["text"], operationModes: ["streaming"] },
				{ id: "gemini-1.5-pro", name: "Gemini 1.5 Pro", contextWindow: 2097152, supportsVision: true, supportsReasoning: false, inputModalities: ["text", "image"], outputModalities: ["text"], operationModes: ["streaming"] },
			],
			openai: [
				{ id: "gpt-4o", name: "GPT-4o (Omni)", contextWindow: 128000, supportsVision: true, supportsReasoning: false, inputModalities: ["text", "image"], outputModalities: ["text"], operationModes: ["streaming"] },
				{ id: "gpt-4o-mini", name: "GPT-4o Mini (Fast)", contextWindow: 128000, supportsVision: true, supportsReasoning: false, inputModalities: ["text", "image"], outputModalities: ["text"], operationModes: ["streaming"] },
				{ id: "o1", name: "o1 (High Reasoning)", contextWindow: 200000, supportsVision: true, supportsReasoning: true, inputModalities: ["text"], outputModalities: ["text"], operationModes: ["streaming"] },
				{ id: "o3-mini", name: "o3-mini (Reasoning)", contextWindow: 200000, supportsVision: false, supportsReasoning: true, inputModalities: ["text"], outputModalities: ["text"], operationModes: ["streaming"] },
			],
			anthropic: [
				{ id: "claude-3-7-sonnet-latest", name: "Claude 3.7 Sonnet (Hybrid Reasoning)", contextWindow: 200000, supportsVision: true, supportsReasoning: true, inputModalities: ["text", "image"], outputModalities: ["text"], operationModes: ["streaming"] },
				{ id: "claude-3-5-sonnet-latest", name: "Claude 3.5 Sonnet", contextWindow: 200000, supportsVision: true, supportsReasoning: false, inputModalities: ["text", "image"], outputModalities: ["text"], operationModes: ["streaming"] },
				{ id: "claude-3-5-haiku-latest", name: "Claude 3.5 Haiku", contextWindow: 200000, supportsVision: true, supportsReasoning: false, inputModalities: ["text"], outputModalities: ["text"], operationModes: ["streaming"] },
			],
			openrouter: [
				{ id: "google/gemini-2.5-flash", name: "Google: Gemini 2.5 Flash", contextWindow: 1000000, supportsVision: true, supportsReasoning: true, inputModalities: ["text", "image"], outputModalities: ["text"], operationModes: ["streaming"] },
				{ id: "anthropic/claude-3.5-sonnet", name: "Anthropic: Claude 3.5 Sonnet", contextWindow: 200000, supportsVision: true, supportsReasoning: false, inputModalities: ["text", "image"], outputModalities: ["text"], operationModes: ["streaming"] },
				{ id: "openai/gpt-4o", name: "OpenAI: GPT-4o", contextWindow: 128000, supportsVision: true, supportsReasoning: false, inputModalities: ["text", "image"], outputModalities: ["text"], operationModes: ["streaming"] },
				{ id: "deepseek/deepseek-chat", name: "DeepSeek: V3", contextWindow: 64000, supportsVision: false, supportsReasoning: false, inputModalities: ["text"], outputModalities: ["text"], operationModes: ["streaming"] },
			],
			deepseek: [
				{ id: "deepseek-chat", name: "DeepSeek-V3", contextWindow: 64000, supportsVision: false, supportsReasoning: false, inputModalities: ["text"], outputModalities: ["text"], operationModes: ["streaming"] },
				{ id: "deepseek-reasoner", name: "DeepSeek-R1 (Reasoning)", contextWindow: 64000, supportsVision: false, supportsReasoning: true, inputModalities: ["text"], outputModalities: ["text"], operationModes: ["streaming"] },
			],
			groq: [
				{ id: "llama-3.3-70b-versatile", name: "Llama 3.3 70B Versatile", contextWindow: 128000, supportsVision: false, supportsReasoning: false, inputModalities: ["text"], outputModalities: ["text"], operationModes: ["streaming"] },
				{ id: "llama-3.1-8b-instant", name: "Llama 3.1 8B Instant", contextWindow: 128000, supportsVision: false, supportsReasoning: false, inputModalities: ["text"], outputModalities: ["text"], operationModes: ["streaming"] },
			],
			ollama: [
				{ id: "llama3.2", name: "Llama 3.2 (Local)", contextWindow: 128000, supportsVision: false, supportsReasoning: false, inputModalities: ["text"], outputModalities: ["text"], operationModes: ["streaming"] },
				{ id: "deepseek-r1:8b", name: "DeepSeek-R1 8B (Local)", contextWindow: 64000, supportsVision: false, supportsReasoning: true, inputModalities: ["text"], outputModalities: ["text"], operationModes: ["streaming"] },
			],
		};
		return (
			catalog[providerId] || [
				{
					id: "default-model",
					name: `${providerId} Default Model`,
					contextWindow: 128000,
					supportsVision: false,
					supportsReasoning: false,
					inputModalities: ["text"],
					outputModalities: ["text"],
					operationModes: ["streaming"],
				},
			]
		);
	}

	private async handleStandaloneCommand<T>(
		command: string,
		args?: Record<string, unknown>,
	): Promise<T> {
		switch (command) {
			case "get_process_context":
				return {
					appVersion: "0.2.0",
					isMobile: isMobileEnvironment(),
					hub: { state: "ready", status: "connected", url: "standalone://local" },
				} as T;
			case "get_feature_flags":
				return { flags: {} } as T;
			case "get_source_control_state":
				return {
					environmentId: (args?.environmentId as string) || "local",
					root: null,
					branch: "main",
					hasUpstream: false,
					status: "clean",
					files: [],
					staged: [],
					commits: [],
				} as T;
			case "get_discovered_session": {
				const sid = (args?.sessionId as string) || "";
				try {
					const raw = typeof window !== "undefined" ? window.localStorage.getItem("openverse_sessions_v1") : null;
					const sessions: Record<string, unknown>[] = raw ? JSON.parse(raw) : [];
					const found = sessions.find((s) => s.sessionId === sid || s.id === sid);
					return (found || null) as T;
				} catch {
					return null as T;
				}
			}
			case "list_discovered_sessions": {
				try {
					const raw = typeof window !== "undefined" ? window.localStorage.getItem("openverse_sessions_v1") : null;
					return (raw ? JSON.parse(raw) : []) as T;
				} catch {
					return [] as T;
				}
			}
			case "read_session_history": {
				try {
					const raw = typeof window !== "undefined" ? window.localStorage.getItem("openverse_sessions_v1") : null;
					return (raw ? JSON.parse(raw) : []) as T;
				} catch {
					return [] as T;
				}
			}
			case "read_session_messages": {
				const sid = (args?.sessionId as string) || "";
				try {
					const raw = typeof window !== "undefined" ? window.localStorage.getItem(`openverse_msg_${sid}`) : null;
					return (raw ? JSON.parse(raw) : []) as T;
				} catch {
					return [] as T;
				}
			}
			case "read_session_hooks":
				return [] as T;
			case "list_remote_environments":
				return { profiles: [] } as T;
			case "list_cloud_models":
				return [] as T;
			case "list_cloud_repositories":
				return { repositories: [] } as T;
			case "list_importable_sessions":
				return { sessions: [] } as T;
			case "cline_account":
				return {
					signedIn: false,
					code: "ACCOUNT_NOT_AUTHENTICATED",
				} as T;
			case "cline_integrations":
				return {
					signedIn: false,
					code: "ACCOUNT_NOT_AUTHENTICATED",
				} as T;
			case "composio_integrations":
				return { ok: true, integrations: [] } as T;
			case "get_keybindings":
				return { bindings: [] } as T;
			case "get_global_settings":
				return {
					telemetryOptOut: false,
					autoUpdateEnabled: true,
				} as T;
			case "set_telemetry_opt_out":
				return {
					telemetryOptOut: (args?.telemetry_opt_out as boolean) ?? false,
					autoUpdateEnabled: true,
				} as T;
			case "set_auto_update_enabled":
				return {
					telemetryOptOut: false,
					autoUpdateEnabled: (args?.auto_update_enabled as boolean) ?? true,
				} as T;
			case "get_hub_status":
				return {
					url: "standalone://local",
					clients: [],
					events: [],
				} as T;
			case "restart_hub":
				return {
					url: "standalone://local",
					clients: [],
					events: [],
				} as T;
			case "list_provider_catalog":
				return {
					providers: this.getStandaloneProviders(),
					settingsPath: "local://openverse/settings.json",
				} as T;
			case "list_provider_models": {
				const providerId = (args?.provider as string) || "";
				return {
					providerId,
					models: this.getStandaloneModels(providerId),
				} as T;
			}
			case "save_provider_settings": {
				const providerId = (args?.provider as string) || "";
				const enabled = args?.enabled !== false;
				const apiKey = (args?.api_key as string) ?? undefined;
				const baseUrl = (args?.base_url as string) ?? undefined;
				try {
					if (typeof window !== "undefined") {
						const raw = window.localStorage.getItem("openverse_providers_v1");
						const list: Provider[] = raw ? JSON.parse(raw) : [];
						const existingIdx = list.findIndex((p) => p.id === providerId);
						const updatedEntry: Provider = {
							id: providerId,
							name: providerId,
							models: 1,
							color: "#6366F1",
							letter: providerId.charAt(0).toUpperCase(),
							enabled,
							configured: Boolean(apiKey?.trim() || baseUrl?.trim() || providerId === "ollama"),
							apiKey,
							baseUrl,
						};
						if (existingIdx >= 0) {
							list[existingIdx] = { ...list[existingIdx], ...updatedEntry };
						} else {
							list.push(updatedEntry);
						}
						window.localStorage.setItem("openverse_providers_v1", JSON.stringify(list));

						if (apiKey) {
							const keysRaw = window.localStorage.getItem("cline.providers.keys");
							const keys = keysRaw ? JSON.parse(keysRaw) : {};
							keys[providerId] = apiKey;
							window.localStorage.setItem("cline.providers.keys", JSON.stringify(keys));
						}
					}
				} catch {}
				void this.syncCloudPush();
				return true as T;
			}
			case "add_provider": {
				const providerId = (args?.provider_id as string) || `custom_${Date.now()}`;
				const name = (args?.name as string) || providerId;
				const baseUrl = (args?.base_url as string) || "";
				const apiKey = (args?.api_key as string) || undefined;
				try {
					if (typeof window !== "undefined") {
						const raw = window.localStorage.getItem("openverse_providers_v1");
						const list: Provider[] = raw ? JSON.parse(raw) : [];
						const newEntry: Provider = {
							id: providerId,
							name,
							models: Array.isArray(args?.models) ? (args.models as string[]).length : 1,
							color: "#10B981",
							letter: name.charAt(0).toUpperCase(),
							enabled: true,
							configured: Boolean(apiKey?.trim() || baseUrl.trim()),
							apiKey,
							baseUrl,
							capabilities: (args?.capabilities as string[]) || ["streaming"],
						};
						list.push(newEntry);
						window.localStorage.setItem("openverse_providers_v1", JSON.stringify(list));
					}
				} catch {}
				void this.syncCloudPush();
				return true as T;
			}
			case "provider_models":
				return { models: [] } as T;
			case "get_local_models_status":
				return { status: "disabled", models: [] } as T;
			case "pick_workspace_directory":
				return "workspace" as T;
			case "get_git_branch":
				return { environmentId: (args?.environmentId as string) || "local", branch: "main", branches: ["main"] } as T;
			case "list_git_branches":
				return { environmentId: (args?.environmentId as string) || "local", current: "main", branches: ["main"] } as T;
			case "checkout_git_branch":
				return { environmentId: (args?.environmentId as string) || "local", branch: (args?.branch as string) || "main" } as T;
			case "update_chat_session_title": {
				const sid = (args?.sessionId as string) || "";
				const title = (args?.title as string) || "";
				try {
					if (typeof window !== "undefined") {
						const raw = window.localStorage.getItem("openverse_sessions_v1");
						const list = raw ? JSON.parse(raw) : [];
						const updated = list.map((s: Record<string, unknown>) =>
							s.id === sid || s.sessionId === sid ? { ...s, title } : s,
						);
						window.localStorage.setItem("openverse_sessions_v1", JSON.stringify(updated));
					}
				} catch {}
				return true as T;
			}
			case "delete_chat_session": {
				const sid = (args?.sessionId as string) || "";
				try {
					if (typeof window !== "undefined") {
						const raw = window.localStorage.getItem("openverse_sessions_v1");
						const list = raw ? JSON.parse(raw) : [];
						const updated = list.filter((s: Record<string, unknown>) => s.id !== sid && s.sessionId !== sid);
						window.localStorage.setItem("openverse_sessions_v1", JSON.stringify(updated));
						window.localStorage.removeItem(`openverse_msg_${sid}`);
					}
				} catch {}
				void this.syncCloudPush();
				return true as T;
			}
			case "sync_cloud_pull":
				return (await this.syncCloudPull()) as T;
			case "sync_cloud_push":
				return (await this.syncCloudPush()) as T;
			case "get_cloud_sync_status": {
				const token = this.getCloudSyncAuthToken();
				return {
					configured: Boolean(token),
					baseUrl: this.getCloudSyncBaseUrl(),
				} as T;
			}
			case "get_update_status":
			case "check_for_update_now":
				return {
					state: "idle",
					isChecking: false,
					isAvailable: false,
					available: false,
					version: "0.2.0",
				} as T;
			case "restart_to_apply_update": {
				if (typeof window !== "undefined" && "AndroidInterface" in window) {
					const android = (window as unknown as { AndroidInterface: { downloadAndInstallApk: (u: string) => void } }).AndroidInterface;
					if (typeof android.downloadAndInstallApk === "function") {
						android.downloadAndInstallApk("https://github.com/naresh-cn2/OPEN-VERSE/releases/download/v0.2.0/open-verse-mobile.apk");
						return true as T;
					}
				}
				if (typeof window !== "undefined") {
					window.location.reload();
				}
				return true as T;
			}
			case "export_diagnostics":
				return { path: "memory://diagnostics.json" } as T;
			case "chat_session_command": {
				const req = ((args as Record<string, unknown>)?.request as Record<string, unknown>) || args || {};
				const sid = (req.sessionId as string) || `session_${Date.now()}`;
				const action = req.action as string;
				if (action === "send" || action === "start") {
					const prompt = (req.prompt as string) || "";
					try {
						if (typeof window !== "undefined") {
							const msgKey = `openverse_msg_${sid}`;
							const existingRaw = window.localStorage.getItem(msgKey);
							const msgs = existingRaw ? JSON.parse(existingRaw) : [];
							msgs.push({
								id: `msg_u_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
								sessionId: sid,
								role: "user",
								content: prompt,
								createdAt: Date.now(),
							});
							window.localStorage.setItem(msgKey, JSON.stringify(msgs));

							const sessRaw = window.localStorage.getItem("openverse_sessions_v1");
							const sessions: Record<string, unknown>[] = sessRaw ? JSON.parse(sessRaw) : [];
							const existingIdx = sessions.findIndex((s) => s.sessionId === sid || s.id === sid);
							const sessionRecord = {
								sessionId: sid,
								id: sid,
								title: prompt.slice(0, 35) + (prompt.length > 35 ? "..." : ""),
								provider: (req.config as Record<string, unknown>)?.provider || "gemini",
								model: (req.config as Record<string, unknown>)?.modelId || "gemini-2.5-flash",
								status: "idle",
								startedAt: new Date().toISOString(),
								lastActivityAt: new Date().toISOString(),
								cwd: "",
								workspaceRoot: "",
								environmentId: (req.config as Record<string, unknown>)?.environmentId || "local",
							};
							if (existingIdx >= 0) {
								sessions[existingIdx] = { ...sessions[existingIdx], ...sessionRecord };
							} else {
								sessions.unshift(sessionRecord);
							}
							window.localStorage.setItem("openverse_sessions_v1", JSON.stringify(sessions));
						}
					} catch {}
					void this.syncCloudPush();

					setTimeout(() => {
						void this.executeStandaloneTurn(sid, prompt, req.config as Record<string, unknown>);
					}, 20);
					return { ok: true, sessionId: sid } as T;
				}
				return { ok: true } as T;
			}
			default:
				return {} as T;
		}
	}

	private async executeStandaloneTurn(
		sessionId: string,
		prompt: string,
		config?: Record<string, unknown>,
	): Promise<void> {
		const environmentId = (config?.environmentId as string) || "local";
		let streamIndex = 0;
		let fullResponseText = "";

		const emitChunk = (text: string, isFinal = false) => {
			if (text) {
				fullResponseText += text;
			}
			this.dispatchEvent({
				type: "event",
				event: {
					name: "chat_event",
					payload: {
						environmentId,
						sessionId,
						chunk: JSON.stringify({ text }),
						streamIndex: streamIndex++,
						isFinal,
					},
				},
			});
		};

		const persistAssistantResponse = (finalText: string) => {
			try {
				if (typeof window !== "undefined") {
					const msgKey = `openverse_msg_${sessionId}`;
					const existingRaw = window.localStorage.getItem(msgKey);
					const msgs = existingRaw ? JSON.parse(existingRaw) : [];
					msgs.push({
						id: `msg_a_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
						sessionId,
						role: "assistant",
						content: finalText,
						createdAt: Date.now(),
					});
					window.localStorage.setItem(msgKey, JSON.stringify(msgs));

					const sessRaw = window.localStorage.getItem("openverse_sessions_v1");
					const sessions: Record<string, unknown>[] = sessRaw ? JSON.parse(sessRaw) : [];
					const idx = sessions.findIndex((s) => s.sessionId === sessionId || s.id === sessionId);
					if (idx >= 0) {
						sessions[idx].lastActivityAt = new Date().toISOString();
						window.localStorage.setItem("openverse_sessions_v1", JSON.stringify(sessions));
					}
				}
			} catch {}
			void this.syncCloudPush();
		};

		// Check configured keys from all storage locations
		let apiKey = "";
		let baseUrl = "";
		const provider = (config?.provider as string) || "gemini";
		const model = (config?.modelId as string) || "gemini-2.5-flash";

		try {
			if (typeof window !== "undefined") {
				const providersRaw = window.localStorage.getItem("openverse_providers_v1");
				if (providersRaw) {
					const providers: Provider[] = JSON.parse(providersRaw);
					const match = providers.find((p) => p.id === provider);
					if (match) {
						apiKey = match.apiKey || "";
						baseUrl = match.baseUrl || "";
					}
				}
				if (!apiKey) {
					const keysRaw = window.localStorage.getItem("cline.providers.keys");
					if (keysRaw) {
						const keys = JSON.parse(keysRaw);
						apiKey = keys[provider] || keys.gemini || keys.openai || keys.anthropic || "";
					}
				}
			}
		} catch {}

		// 1. Google Gemini
		if (provider === "gemini" && apiKey) {
			try {
				const geminiModel = model.startsWith("gemini-") ? model : "gemini-2.5-flash";
				const url = `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:streamGenerateContent?alt=sse&key=${apiKey}`;
				const response = await fetch(url, {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						contents: [{ role: "user", parts: [{ text: prompt }] }],
					}),
				});
				if (!response.ok) {
					throw new Error(`Gemini API error (HTTP ${response.status})`);
				}
				const reader = response.body?.getReader();
				const decoder = new TextDecoder();
				if (reader) {
					while (true) {
						const { done, value } = await reader.read();
						if (done) break;
						const chunkStr = decoder.decode(value, { stream: true });
						const lines = chunkStr.split("\n");
						for (const line of lines) {
							if (line.startsWith("data: ")) {
								try {
									const data = JSON.parse(line.slice(6));
									const token = data.candidates?.[0]?.content?.parts?.[0]?.text;
									if (token) emitChunk(token, false);
								} catch {}
							}
						}
					}
				}
				emitChunk("", true);
				persistAssistantResponse(fullResponseText);
				return;
			} catch (err) {
				const errText = `\n\n*(Error generating response: ${err instanceof Error ? err.message : String(err)})*`;
				emitChunk(errText, true);
				persistAssistantResponse(fullResponseText);
				return;
			}
		}

		// 2. Anthropic Claude
		if (provider === "anthropic" && apiKey) {
			try {
				const claudeModel = model.startsWith("claude-") ? model : "claude-3-7-sonnet-latest";
				const response = await fetch("https://api.anthropic.com/v1/messages", {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						"x-api-key": apiKey,
						"anthropic-version": "2023-06-01",
						"anthropic-dangerous-direct-browser-access": "true",
					},
					body: JSON.stringify({
						model: claudeModel,
						max_tokens: 4096,
						stream: true,
						messages: [{ role: "user", content: prompt }],
					}),
				});
				if (!response.ok) {
					throw new Error(`Anthropic API error (HTTP ${response.status})`);
				}
				const reader = response.body?.getReader();
				const decoder = new TextDecoder();
				if (reader) {
					while (true) {
						const { done, value } = await reader.read();
						if (done) break;
						const chunkStr = decoder.decode(value, { stream: true });
						const lines = chunkStr.split("\n");
						for (const line of lines) {
							if (line.startsWith("data: ")) {
								try {
									const data = JSON.parse(line.slice(6));
									if (data.type === "content_block_delta" && data.delta?.text) {
										emitChunk(data.delta.text, false);
									}
								} catch {}
							}
						}
					}
				}
				emitChunk("", true);
				persistAssistantResponse(fullResponseText);
				return;
			} catch (err) {
				const errText = `\n\n*(Error generating response: ${err instanceof Error ? err.message : String(err)})*`;
				emitChunk(errText, true);
				persistAssistantResponse(fullResponseText);
				return;
			}
		}

		// 3. OpenAI / OpenRouter / DeepSeek / Groq / Ollama / Custom
		if (apiKey || provider === "ollama" || baseUrl) {
			try {
				let endpoint = "https://api.openai.com/v1/chat/completions";
				const headers: Record<string, string> = {
					"Content-Type": "application/json",
				};
				if (apiKey) {
					headers.Authorization = `Bearer ${apiKey}`;
				}

				if (provider === "openrouter") {
					endpoint = "https://openrouter.ai/api/v1/chat/completions";
					headers["HTTP-Referer"] = "https://openverse.ai";
					headers["X-Title"] = "OPEN-VERSE";
				} else if (provider === "deepseek") {
					endpoint = "https://api.deepseek.com/chat/completions";
				} else if (provider === "groq") {
					endpoint = "https://api.groq.com/openai/v1/chat/completions";
				} else if (provider === "ollama") {
					endpoint = baseUrl ? `${baseUrl.replace(/\/+$/, "")}/chat/completions` : "http://localhost:11434/v1/chat/completions";
				} else if (baseUrl) {
					endpoint = `${baseUrl.replace(/\/+$/, "")}/chat/completions`;
				}

				const response = await fetch(endpoint, {
					method: "POST",
					headers,
					body: JSON.stringify({
						model,
						messages: [{ role: "user", content: prompt }],
						stream: true,
					}),
				});

				if (!response.ok) {
					throw new Error(`${provider} API error (HTTP ${response.status})`);
				}

				const reader = response.body?.getReader();
				const decoder = new TextDecoder();
				if (reader) {
					while (true) {
						const { done, value } = await reader.read();
						if (done) break;
						const chunkStr = decoder.decode(value, { stream: true });
						const lines = chunkStr.split("\n");
						for (const line of lines) {
							if (line.startsWith("data: ")) {
								const payload = line.slice(6).trim();
								if (payload === "[DONE]") break;
								try {
									const data = JSON.parse(payload);
									const token = data.choices?.[0]?.delta?.content;
									if (token) emitChunk(token, false);
								} catch {}
							}
						}
					}
				}
				emitChunk("", true);
				persistAssistantResponse(fullResponseText);
				return;
			} catch (err) {
				const errText = `\n\n*(Error generating response: ${err instanceof Error ? err.message : String(err)})*`;
				emitChunk(errText, true);
				persistAssistantResponse(fullResponseText);
				return;
			}
		}

		// 4. Default helpful offline response
		const defaultResponse = `I received your prompt: "${prompt}".\n\nTo enable autonomous model execution on your device, configure your API key in **Settings > AI Model Providers** (supporting Google Gemini, Anthropic Claude, OpenAI, and Ollama) or connect to your **Desktop Hub**.`;
		emitChunk(defaultResponse, true);
		persistAssistantResponse(defaultResponse);
	}
}

export const desktopClient = new DesktopClient();

/**
 * Open a URL in the user's default browser. Inside the Tauri shell,
 * `target="_blank"` anchors are silently dropped (no window opener is
 * configured), so external links must be routed through the sidecar, which
 * runs on the host and can spawn the platform opener. In plain web mode the
 * browser handles it directly.
 */
export async function openExternalUrl(url: string): Promise<void> {
	if (isTauriAvailable()) {
		await desktopClient.invoke("open_external_url", { url });
		return;
	}
	if (typeof window !== "undefined" && "AndroidInterface" in window) {
		const android = (window as unknown as { AndroidInterface: { openExternalUrl: (u: string) => void } }).AndroidInterface;
		if (typeof android.openExternalUrl === "function") {
			android.openExternalUrl(url);
			return;
		}
	}
	window.open(url, "_blank", "noopener,noreferrer");
}
