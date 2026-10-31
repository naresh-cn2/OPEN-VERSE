/**
 * Standalone Mobile Runner & Direct AI Execution Engine
 * Provides local session persistence and direct streaming to AI models
 * (Google Gemini, Anthropic Claude, OpenAI ChatGPT, and Ollama)
 * when OPEN-VERSE runs on mobile or in standalone mode without a desktop sidecar.
 */

export interface StandaloneProviderConfig {
	selectedProvider: "gemini" | "anthropic" | "openai" | "ollama";
	selectedModel?: string;
	geminiApiKey?: string;
	claudeApiKey?: string;
	openaiApiKey?: string;
	ollamaBaseUrl?: string;
}

export interface StandaloneThread {
	id: string;
	title: string;
	createdAt: number;
	updatedAt: number;
	pinned?: boolean;
	provider?: string;
	model?: string;
}

export interface StandaloneMessage {
	id: string;
	sessionId: string;
	role: "user" | "assistant" | "system";
	content: string;
	createdAt: number;
}

const PROVIDERS_KEY = "openverse.provider_settings.v1";
const THREADS_KEY = "openverse.threads.v1";
const HUB_ENDPOINT_KEY = "openverse.hub.ws_endpoint";

export function getStoredHubEndpoint(): string | null {
	if (typeof window === "undefined") return null;
	return window.localStorage.getItem(HUB_ENDPOINT_KEY);
}

export function setStoredHubEndpoint(endpoint: string | null): void {
	if (typeof window === "undefined") return;
	if (endpoint && endpoint.trim()) {
		window.localStorage.setItem(HUB_ENDPOINT_KEY, endpoint.trim());
	} else {
		window.localStorage.removeItem(HUB_ENDPOINT_KEY);
	}
}

export function getStoredProviderConfig(): StandaloneProviderConfig {
	const fallback: StandaloneProviderConfig = {
		selectedProvider: "gemini",
		selectedModel: "gemini-2.5-flash",
		geminiApiKey: "",
		claudeApiKey: "",
		openaiApiKey: "",
		ollamaBaseUrl: "http://127.0.0.1:11434",
	};
	if (typeof window === "undefined") return fallback;
	try {
		const raw = window.localStorage.getItem(PROVIDERS_KEY);
		if (!raw) return fallback;
		const parsed = JSON.parse(raw);
		return { ...fallback, ...parsed };
	} catch {
		return fallback;
	}
}

export function saveStoredProviderConfig(config: Partial<StandaloneProviderConfig>): void {
	if (typeof window === "undefined") return;
	const current = getStoredProviderConfig();
	const next = { ...current, ...config };
	window.localStorage.setItem(PROVIDERS_KEY, JSON.stringify(next));
}

export function getStandaloneThreads(): StandaloneThread[] {
	if (typeof window === "undefined") return [];
	try {
		const raw = window.localStorage.getItem(THREADS_KEY);
		return raw ? JSON.parse(raw) : [];
	} catch {
		return [];
	}
}

export function saveStandaloneThreads(threads: StandaloneThread[]): void {
	if (typeof window === "undefined") return;
	window.localStorage.setItem(THREADS_KEY, JSON.stringify(threads));
}

export function getStandaloneMessages(sessionId: string): StandaloneMessage[] {
	if (typeof window === "undefined") return [];
	try {
		const raw = window.localStorage.getItem(`openverse.messages.${sessionId}`);
		return raw ? JSON.parse(raw) : [];
	} catch {
		return [];
	}
}

export function saveStandaloneMessages(sessionId: string, messages: StandaloneMessage[]): void {
	if (typeof window === "undefined") return;
	window.localStorage.setItem(`openverse.messages.${sessionId}`, JSON.stringify(messages));
}

export function appendStandaloneMessage(sessionId: string, message: StandaloneMessage): void {
	const current = getStandaloneMessages(sessionId);
	current.push(message);
	saveStandaloneMessages(sessionId, current);

	// Update thread
	const threads = getStandaloneThreads();
	const existing = threads.find((t) => t.id === sessionId);
	if (existing) {
		existing.updatedAt = Date.now();
		if (existing.title === "New Session" && message.role === "user") {
			existing.title = message.content.slice(0, 40) + (message.content.length > 40 ? "..." : "");
		}
		saveStandaloneThreads(threads);
	} else {
		threads.unshift({
			id: sessionId,
			title: message.role === "user" ? message.content.slice(0, 40) : "New Session",
			createdAt: Date.now(),
			updatedAt: Date.now(),
		});
		saveStandaloneThreads(threads);
	}
}

/**
 * Direct Client Streaming via Google Gemini, Anthropic Claude, OpenAI, or Ollama.
 */
export async function streamStandaloneCompletion(
	prompt: string,
	sessionId: string,
	onChunk: (chunk: string) => void,
	signal?: AbortSignal
): Promise<string> {
	const config = getStoredProviderConfig();
	const history = getStandaloneMessages(sessionId);

	const messagesForPrompt = [
		...history.map((m) => ({ role: m.role, content: m.content })),
		{ role: "user" as const, content: prompt },
	];

	switch (config.selectedProvider) {
		case "gemini":
			return await streamGemini(messagesForPrompt, config, onChunk, signal);
		case "openai":
			return await streamOpenAI(messagesForPrompt, config, onChunk, signal);
		case "anthropic":
			return await streamAnthropic(messagesForPrompt, config, onChunk, signal);
		case "ollama":
			return await streamOllama(messagesForPrompt, config, onChunk, signal);
		default:
			return await streamGemini(messagesForPrompt, config, onChunk, signal);
	}
}

async function streamGemini(
	messages: { role: string; content: string }[],
	config: StandaloneProviderConfig,
	onChunk: (chunk: string) => void,
	signal?: AbortSignal
): Promise<string> {
	const apiKey = config.geminiApiKey?.trim();
	if (!apiKey) {
		const hint =
			"Welcome to OPEN-VERSE on mobile!\n\nTo chat directly on your device, please add your **Google Gemini API Key** in **Settings → AI Model Providers**.\n\nAlternatively, pair with your **Desktop Hub** to run full agents and workspace tools on your computer.";
		onChunk(hint);
		return hint;
	}

	const model = config.selectedModel || "gemini-2.5-flash";
	const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?alt=sse&key=${apiKey}`;

	const contents = messages
		.filter((m) => m.role !== "system")
		.map((m) => ({
			role: m.role === "assistant" ? "model" : "user",
			parts: [{ text: m.content }],
		}));

	const response = await fetch(url, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ contents }),
		signal,
	});

	if (!response.ok) {
		const err = await response.text();
		throw new Error(`Google Gemini Error (${response.status}): ${err}`);
	}

	const reader = response.body?.getReader();
	if (!reader) throw new Error("Response body is not readable");

	const decoder = new TextDecoder();
	let fullText = "";
	let buffer = "";

	while (true) {
		const { done, value } = await reader.read();
		if (done) break;

		buffer += decoder.decode(value, { stream: true });
		const lines = buffer.split("\n");
		buffer = lines.pop() || "";

		for (const line of lines) {
			const trimmed = line.trim();
			if (trimmed.startsWith("data: ")) {
				const jsonStr = trimmed.slice(6);
				try {
					const data = JSON.parse(jsonStr);
					const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
					if (text) {
						fullText += text;
						onChunk(text);
					}
				} catch {
					// Ignore partial JSON
				}
			}
		}
	}

	return fullText;
}

async function streamOpenAI(
	messages: { role: string; content: string }[],
	config: StandaloneProviderConfig,
	onChunk: (chunk: string) => void,
	signal?: AbortSignal
): Promise<string> {
	const apiKey = config.openaiApiKey?.trim();
	if (!apiKey) {
		const hint =
			"OpenAI API Key is missing. Please configure your OpenAI API Key in **Settings → AI Model Providers**.";
		onChunk(hint);
		return hint;
	}

	const model = config.selectedModel || "gpt-4o";
	const url = "https://api.openai.com/v1/chat/completions";

	const response = await fetch(url, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			Authorization: `Bearer ${apiKey}`,
		},
		body: JSON.stringify({
			model,
			messages,
			stream: true,
		}),
		signal,
	});

	if (!response.ok) {
		const err = await response.text();
		throw new Error(`OpenAI Error (${response.status}): ${err}`);
	}

	const reader = response.body?.getReader();
	if (!reader) throw new Error("Response body is not readable");

	const decoder = new TextDecoder();
	let fullText = "";
	let buffer = "";

	while (true) {
		const { done, value } = await reader.read();
		if (done) break;

		buffer += decoder.decode(value, { stream: true });
		const lines = buffer.split("\n");
		buffer = lines.pop() || "";

		for (const line of lines) {
			const trimmed = line.trim();
			if (trimmed.startsWith("data: ")) {
				const jsonStr = trimmed.slice(6);
				if (jsonStr === "[DONE]") break;
				try {
					const data = JSON.parse(jsonStr);
					const delta = data.choices?.[0]?.delta?.content;
					if (delta) {
						fullText += delta;
						onChunk(delta);
					}
				} catch {
					// Ignore partial JSON
				}
			}
		}
	}

	return fullText;
}

async function streamAnthropic(
	messages: { role: string; content: string }[],
	config: StandaloneProviderConfig,
	onChunk: (chunk: string) => void,
	signal?: AbortSignal
): Promise<string> {
	const apiKey = config.claudeApiKey?.trim();
	if (!apiKey) {
		const hint =
			"Anthropic API Key is missing. Please configure your Claude API Key in **Settings → AI Model Providers**.";
		onChunk(hint);
		return hint;
	}

	const model = config.selectedModel || "claude-3-5-sonnet-20241022";
	const url = "https://api.anthropic.com/v1/messages";

	const response = await fetch(url, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			"x-api-key": apiKey,
			"anthropic-version": "2023-06-01",
			"dangerously-allow-browser": "true",
		},
		body: JSON.stringify({
			model,
			max_tokens: 4096,
			messages: messages.map((m) => ({ role: m.role, content: m.content })),
			stream: true,
		}),
		signal,
	});

	if (!response.ok) {
		const err = await response.text();
		throw new Error(`Anthropic Error (${response.status}): ${err}`);
	}

	const reader = response.body?.getReader();
	if (!reader) throw new Error("Response body is not readable");

	const decoder = new TextDecoder();
	let fullText = "";
	let buffer = "";

	while (true) {
		const { done, value } = await reader.read();
		if (done) break;

		buffer += decoder.decode(value, { stream: true });
		const lines = buffer.split("\n");
		buffer = lines.pop() || "";

		for (const line of lines) {
			const trimmed = line.trim();
			if (trimmed.startsWith("data: ")) {
				const jsonStr = trimmed.slice(6);
				try {
					const data = JSON.parse(jsonStr);
					if (data.type === "content_block_delta" && data.delta?.text) {
						fullText += data.delta.text;
						onChunk(data.delta.text);
					}
				} catch {
					// Ignore partial JSON
				}
			}
		}
	}

	return fullText;
}

async function streamOllama(
	messages: { role: string; content: string }[],
	config: StandaloneProviderConfig,
	onChunk: (chunk: string) => void,
	signal?: AbortSignal
): Promise<string> {
	const baseUrl = (config.ollamaBaseUrl || "http://127.0.0.1:11434").replace(/\/$/, "");
	const model = config.selectedModel || "llama3.2";
	const url = `${baseUrl}/api/chat`;

	const response = await fetch(url, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({
			model,
			messages,
			stream: true,
		}),
		signal,
	});

	if (!response.ok) {
		const err = await response.text();
		throw new Error(`Ollama Error (${response.status}): ${err}`);
	}

	const reader = response.body?.getReader();
	if (!reader) throw new Error("Response body is not readable");

	const decoder = new TextDecoder();
	let fullText = "";
	let buffer = "";

	while (true) {
		const { done, value } = await reader.read();
		if (done) break;

		buffer += decoder.decode(value, { stream: true });
		const lines = buffer.split("\n");
		buffer = lines.pop() || "";

		for (const line of lines) {
			const trimmed = line.trim();
			if (!trimmed) continue;
			try {
				const data = JSON.parse(trimmed);
				if (data.message?.content) {
					fullText += data.message.content;
					onChunk(data.message.content);
				}
			} catch {
				// Ignore partial JSON
			}
		}
	}

	return fullText;
}
