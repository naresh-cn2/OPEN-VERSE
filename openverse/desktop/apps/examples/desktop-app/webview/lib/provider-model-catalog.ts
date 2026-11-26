"use client";

import type { CloudModel } from "@cline/core/cloud";
import {
	isChatCompatibleModel,
	isTranscriptionModel,
	type ProviderAuthInfo,
} from "@cline/shared/browser";
import { desktopClient } from "@/lib/desktop-client";
import { isProviderConnected } from "@/lib/provider-connection";
import type {
	Provider,
	ProviderCatalogResponse,
	ProviderModel,
	ProviderModelsResponse,
	VoiceInputSelection,
} from "@/lib/provider-schema";

export type ProviderModelCatalog = {
	providers: Provider[];
	enabledProviderIds: string[];
	providerModels: Record<string, string[]>;
	/** Full chat-model entries per provider (display names, capabilities). */
	providerModelDetails: Record<string, ProviderModel[]>;
	/** Display name per provider id, for pickers that show providers. */
	providerNames: Record<string, string>;
	providerReasoningModels: Record<string, string[]>;
	voiceInput: TranscriptionModelTarget | null;
};

export type TranscriptionModelTarget = {
	providerId: string;
	providerName: string;
	modelId: string;
	modelName: string;
	supportsStreaming: boolean;
};

export function isDedicatedTranscriptionModel(model: ProviderModel): boolean {
	return isTranscriptionModel({
		modalities: {
			input: model.inputModalities,
			output: model.outputModalities,
		},
	});
}

/** Voice input requires continuous transcript updates, not recorded-file uploads. */
export function isStreamingTranscriptionModel(model: ProviderModel): boolean {
	return (
		isDedicatedTranscriptionModel(model) &&
		model.operationModes?.includes("streaming") === true
	);
}

export function supportsAudio(model: ProviderModel): boolean {
	return (
		model.inputModalities?.includes("audio") === true ||
		model.outputModalities?.includes("audio") === true
	);
}

export function filterChatModels(
	models: ProviderModel[] | undefined,
): ProviderModel[] {
	return (models ?? []).filter(isChatModel);
}

export function isChatModel(model: ProviderModel): boolean {
	return (
		// Desktop supports image generation directly from its composer. Other
		// chat-only clients intentionally use isChatCompatibleModel without this
		// operation-specific exception.
		model.operation === "image-generation" ||
		isChatCompatibleModel({
			operation: model.operation,
			modalities: {
				input: model.inputModalities,
				output: model.outputModalities,
			},
		})
	);
}

export function selectTranscriptionModel(
	providers: Provider[],
	selection: VoiceInputSelection | undefined,
): TranscriptionModelTarget | null {
	if (!selection) return null;
	const provider = providers.find(
		(candidate) => candidate.enabled && candidate.id === selection.providerId,
	);
	const model = provider?.modelList?.find(
		(candidate) =>
			candidate.id === selection.modelId &&
			isStreamingTranscriptionModel(candidate),
	);
	return provider && model
		? {
				providerId: provider.id,
				providerName: provider.name,
				modelId: model.id,
				modelName: model.name,
				supportsStreaming: model.operationModes?.includes("streaming") === true,
			}
		: null;
}

export function buildProviderModelCatalog(
	providers: Provider[],
	voiceInput?: VoiceInputSelection,
): ProviderModelCatalog {
	const providerEntries = providers.map((provider) => {
		const chatModels = filterChatModels(provider.modelList);
		return {
			provider,
			chatModels,
			modelIds: chatModels.map((model) => model.id),
			reasoningModelIds: chatModels
				.filter((model) => model.supportsReasoning)
				.map((model) => model.id),
		};
	});

	return {
		providers,
		enabledProviderIds: providerEntries
			.filter(
				({ provider, modelIds }) => provider.enabled && modelIds.length > 0,
			)
			.map(({ provider }) => provider.id),
		providerModels: Object.fromEntries(
			providerEntries.map(({ provider, modelIds }) => [provider.id, modelIds]),
		),
		providerModelDetails: Object.fromEntries(
			providerEntries.map(({ provider, chatModels }) => [
				provider.id,
				chatModels,
			]),
		),
		providerNames: Object.fromEntries(
			providers.map((provider) => [provider.id, provider.name]),
		),
		providerReasoningModels: Object.fromEntries(
			providerEntries.map(({ provider, reasoningModelIds }) => [
				provider.id,
				reasoningModelIds,
			]),
		),
		voiceInput: selectTranscriptionModel(providers, voiceInput),
	};
}

// The provider catalog payload is large (hundreds of KB) and several
// components request it at startup (composer, onboarding, credentials sync).
// Deduplicate concurrent requests and keep the response briefly so the app
// boot issues a single round-trip instead of one per consumer.
const PROVIDER_CATALOG_CACHE_TTL_MS = 5_000;
export const VOICE_INPUT_SETTINGS_CHANGED_EVENT =
	"openverse:voice-input-settings-changed";

let providerCatalogCache: {
	fetchedAt: number;
	promise: Promise<ProviderCatalogResponse>;
} | null = null;
let providerCatalogPayload: ProviderCatalogResponse | null = null;

// Discovery can contact provider APIs. Reuse verified results across settings
// and chat remounts; execution still validates against the provider catalog.
const TRANSCRIPTION_MODELS_CACHE_TTL_MS = 5 * 60_000;
const transcriptionModelsCache = new Map<
	string,
	{
		fetchedAt: number;
		promise: Promise<ProviderModel[]>;
		models?: ProviderModel[];
	}
>();

export function readVoiceInputCatalog(): ProviderCatalogResponse | null {
	if (!providerCatalogPayload) return null;
	const providers: Provider[] = [];
	for (const provider of providerCatalogPayload.providers ?? []) {
		if (!isProviderConnected(provider)) {
			providers.push(provider);
			continue;
		}
		const cached = transcriptionModelsCache.get(provider.id);
		if (
			!cached?.models ||
			Date.now() - cached.fetchedAt >= TRANSCRIPTION_MODELS_CACHE_TTL_MS
		)
			return null;
		providers.push({ ...provider, modelList: cached.models });
	}
	return { ...providerCatalogPayload, providers };
}

type ProviderModelsListener = (
	providerId: string,
	models: ProviderModel[],
) => void;
const providerModelsListeners = new Set<ProviderModelsListener>();

export function publishProviderModels(
	providerId: string,
	models: ProviderModel[],
): void {
	invalidateProviderCatalogCache();
	const chatModels = filterChatModels(models);
	for (const listener of providerModelsListeners) {
		listener(providerId, chatModels);
	}
}

export function subscribeToProviderModels(
	listener: ProviderModelsListener,
): () => void {
	providerModelsListeners.add(listener);
	return () => providerModelsListeners.delete(listener);
}

export const DEFAULT_FALLBACK_PROVIDERS: Provider[] = [
	{
		id: "hermes",
		name: "Hermes Agent Core",
		color: "#10b981",
		letter: "H",
		models: 5,
		enabled: true,
		configured: true,
		defaultModelId: "nousresearch/hermes-3-llama-3.1-8b",
		modelList: [
			{
				id: "nousresearch/hermes-3-llama-3.1-8b",
				name: "Nous Hermes 3 (Llama 3.1 8B)",
				description: "Canonical Hermes Agent autonomous coding model",
				featured: { tier: "free", rank: 1, tags: ["Hermes", "Recommended"] },
				supportsAttachments: true,
				supportsVision: true,
				supportsReasoning: true,
				contextWindow: 131072,
				inputModalities: ["text", "image"],
				outputModalities: ["text"],
			},
			{
				id: "nousresearch/hermes-3-llama-3.1-70b",
				name: "Nous Hermes 3 (Llama 3.1 70B)",
				description: "High-parameter frontier reasoning model for full repository architecture",
				featured: { tier: "free", rank: 2, tags: ["Hermes", "Advanced"] },
				supportsAttachments: true,
				supportsVision: true,
				supportsReasoning: true,
				contextWindow: 131072,
				inputModalities: ["text", "image"],
				outputModalities: ["text"],
			},
			{
				id: "nousresearch/hermes-2-pro-llama-3-8b",
				name: "Hermes 2 Pro (Llama 3 8B)",
				description: "Structured JSON function calling and tool synthesis",
				supportsAttachments: true,
				contextWindow: 65536,
				inputModalities: ["text"],
				outputModalities: ["text"],
			},
			{
				id: "deepseek/deepseek-chat",
				name: "DeepSeek V3",
				description: "State-of-the-art coding and language reasoning",
				supportsAttachments: true,
				contextWindow: 64000,
				inputModalities: ["text"],
				outputModalities: ["text"],
			},
			{
				id: "deepseek/deepseek-r1",
				name: "DeepSeek R1",
				description: "Reinforcement-learning reasoning model",
				supportsAttachments: true,
				supportsReasoning: true,
				contextWindow: 64000,
				inputModalities: ["text"],
				outputModalities: ["text"],
			},
		],
	},
	{
		id: "gemini",
		name: "Google Gemini",
		enabled: true,
		modelList: [
			{
				id: "gemini-2.5-flash",
				name: "Gemini 2.5 Flash",
				description: "Google's fastest and most intelligent multimodal assistant",
				supportsAttachments: true,
				supportsVision: true,
				supportsReasoning: true,
				contextWindow: 1048576,
			},
			{
				id: "gemini-1.5-pro",
				name: "Gemini 1.5 Pro",
				description: "Google's flagship model for deep analysis and reasoning",
				supportsAttachments: true,
				supportsVision: true,
				supportsReasoning: true,
				contextWindow: 2097152,
			},
			{
				id: "gemini-2.0-flash",
				name: "Gemini 2.0 Flash",
				description: "Low-latency multimodal intelligence",
				supportsAttachments: true,
				supportsVision: true,
				contextWindow: 1048576,
			},
		],
	},
	{
		id: "openai",
		name: "OpenAI",
		enabled: true,
		modelList: [
			{
				id: "gpt-4o",
				name: "GPT-4o",
				description: "Omni multimodal model",
				supportsAttachments: true,
				supportsVision: true,
				contextWindow: 128000,
			},
			{
				id: "gpt-4o-mini",
				name: "GPT-4o Mini",
				description: "Fast, affordable intelligence",
				supportsAttachments: true,
				supportsVision: true,
				contextWindow: 128000,
			},
		],
	},
	{
		id: "anthropic",
		name: "Anthropic",
		enabled: true,
		modelList: [
			{
				id: "claude-3-5-sonnet-20241022",
				name: "Claude 3.5 Sonnet",
				description: "Advanced reasoning and coding",
				supportsAttachments: true,
				supportsVision: true,
				contextWindow: 200000,
			},
		],
	},
	{
		id: "deepseek",
		name: "DeepSeek",
		enabled: true,
		modelList: [
			{
				id: "deepseek-chat",
				name: "DeepSeek V3",
				description: "General language intelligence",
				supportsAttachments: true,
				contextWindow: 64000,
			},
			{
				id: "deepseek-reasoner",
				name: "DeepSeek R1",
				description: "Deep reasoning model",
				supportsAttachments: true,
				supportsReasoning: true,
				contextWindow: 64000,
			},
		],
	},
	{
		id: "nvidia",
		name: "Nvidia",
		color: "#76b900",
		letter: "N",
		models: 3,
		enabled: true,
		modelList: [
			{
				id: "nemotron-3.5-super-vl-120b-a12b",
				name: "Nemotron 3.5 Super VL 120B A12B",
				description: "Nvidia flagship multimodal vision-language model with 258K context",
				supportsAttachments: true,
				supportsVision: true,
				supportsReasoning: true,
				contextWindow: 264192,
				inputModalities: ["text", "image", "audio", "video"],
				outputModalities: ["text"],
			},
			{
				id: "minimax-m3.1-flash",
				name: "MiniMax-M3.1-Flash",
				description: "Ultra-fast large context model with reasoning support",
				supportsAttachments: true,
				supportsReasoning: true,
				contextWindow: 1048576,
				inputModalities: ["text"],
				outputModalities: ["text"],
			},
			{
				id: "nemotron-3-nano-omni",
				name: "Nemotron 3 Nano Omni",
				description: "Omni model for real-time text, image, audio, and video",
				supportsAttachments: true,
				supportsVision: true,
				supportsReasoning: true,
				contextWindow: 264192,
				inputModalities: ["text", "image", "audio", "video"],
				outputModalities: ["text"],
			},
		],
	},
	{
		id: "opencode",
		name: "OpenCode",
		color: "#6366f1",
		letter: "O",
		models: 8,
		enabled: true,
		modelList: [
			{
				id: "nemotron-3.5-super-vl-free",
				name: "Nemotron 3.5 Super VL Free",
				description: "Free high-performance multimodal intelligence",
				featured: { tier: "free", rank: 1, tags: ["Free"] },
				supportsAttachments: true,
				supportsVision: true,
				supportsReasoning: true,
				contextWindow: 264192,
				inputModalities: ["text", "image", "audio", "video"],
				outputModalities: ["text"],
			},
			{
				id: "inkling-2-small-free",
				name: "Inkling 2 Small Free",
				description: "Lightweight free model for everyday coding and chat",
				featured: { tier: "free", rank: 2, tags: ["Free"] },
				supportsAttachments: true,
				supportsVision: true,
				supportsReasoning: false,
				contextWindow: 131072,
				inputModalities: ["text", "image"],
				outputModalities: ["text"],
			},
			{
				id: "beam-free",
				name: "Beam Free",
				description: "Ultra-fast free code completion and assist",
				featured: { tier: "free", rank: 3, tags: ["Free"] },
				supportsAttachments: true,
				contextWindow: 65536,
				inputModalities: ["text"],
				outputModalities: ["text"],
			},
			{
				id: "big-pickle",
				name: "Big Pickle",
				description: "High context model for repository-wide comprehension",
				featured: { tier: "free", rank: 4, tags: ["Free"] },
				supportsAttachments: true,
				contextWindow: 131072,
				inputModalities: ["text"],
				outputModalities: ["text"],
			},
			{
				id: "claude-fable-5.1",
				name: "Claude Fable 5.1",
				description: "Next-generation reasoning agent model",
				supportsAttachments: true,
				supportsVision: true,
				supportsReasoning: true,
				contextWindow: 200000,
				inputModalities: ["text", "image"],
				outputModalities: ["text"],
			},
			{
				id: "claude-fable-5.2",
				name: "Claude Fable 5.2",
				description: "Enhanced agentic reasoning with advanced tool synthesis",
				supportsAttachments: true,
				supportsVision: true,
				supportsReasoning: true,
				contextWindow: 200000,
				inputModalities: ["text", "image"],
				outputModalities: ["text"],
			},
			{
				id: "claude-haiku-4.5",
				name: "Claude Haiku 4.5",
				description: "Fast, intelligent, vision-capable assistant",
				supportsAttachments: true,
				supportsVision: true,
				contextWindow: 200000,
				inputModalities: ["text", "image"],
				outputModalities: ["text"],
			},
			{
				id: "claude-haiku-5.5",
				name: "Claude Haiku 5.5",
				description: "State-of-the-art fast multimodal assistant",
				supportsAttachments: true,
				supportsVision: true,
				contextWindow: 200000,
				inputModalities: ["text", "image"],
				outputModalities: ["text"],
			},
		],
	},
	// --- Online Account Providers (Web Logins / Subscriptions) ---
	{
		id: "chatgpt-web",
		name: "ChatGPT (Online Account)",
		color: "#10a37f",
		letter: "C",
		models: 4,
		enabled: true,
		capabilities: ["oauth", "streaming", "tools", "vision", "reasoning"],
		modelList: [
			{
				id: "gpt-4o",
				name: "ChatGPT 4o",
				description: "OpenAI flagship omni model from your ChatGPT account",
				supportsAttachments: true,
				supportsVision: true,
				supportsReasoning: true,
				contextWindow: 128000,
			},
			{
				id: "gpt-4o-mini",
				name: "ChatGPT 4o-mini",
				description: "Fast intelligent model for everyday tasks",
				supportsAttachments: true,
				supportsVision: true,
				contextWindow: 128000,
			},
			{
				id: "o3-mini",
				name: "o3-mini (Reasoning)",
				description: "OpenAI advanced STEM and math reasoning model",
				supportsAttachments: true,
				supportsReasoning: true,
				contextWindow: 128000,
			},
			{
				id: "o1",
				name: "o1 (Full Reasoning)",
				description: "Deep thinking and complex logic agent model",
				supportsAttachments: true,
				supportsReasoning: true,
				contextWindow: 200000,
			},
		],
	},
	{
		id: "claude-web",
		name: "Claude (Online Account)",
		color: "#d97706",
		letter: "C",
		models: 3,
		enabled: true,
		capabilities: ["oauth", "streaming", "tools", "vision", "reasoning"],
		modelList: [
			{
				id: "claude-3-7-sonnet",
				name: "Claude 3.7 Sonnet",
				description: "Hybrid reasoning and agentic coding assistant",
				supportsAttachments: true,
				supportsVision: true,
				supportsReasoning: true,
				contextWindow: 200000,
			},
			{
				id: "claude-3-5-sonnet",
				name: "Claude 3.5 Sonnet",
				description: "State-of-the-art coding and nuanced analysis",
				supportsAttachments: true,
				supportsVision: true,
				supportsReasoning: true,
				contextWindow: 200000,
			},
			{
				id: "claude-3-5-haiku",
				name: "Claude 3.5 Haiku",
				description: "Fast multimodal intelligence at low latency",
				supportsAttachments: true,
				supportsVision: true,
				contextWindow: 200000,
			},
		],
	},
	{
		id: "gemini-web",
		name: "Google Gemini (Online Account)",
		color: "#4285f4",
		letter: "G",
		models: 2,
		enabled: true,
		capabilities: ["oauth", "streaming", "tools", "vision", "reasoning"],
		modelList: [
			{
				id: "gemini-2.5-flash",
				name: "Gemini 2.5 Flash",
				description: "Google's fastest thinking multimodal model",
				supportsAttachments: true,
				supportsVision: true,
				supportsReasoning: true,
				contextWindow: 1048576,
			},
			{
				id: "gemini-1.5-pro",
				name: "Gemini 1.5 Pro",
				description: "Google's 2M-token context analysis engine",
				supportsAttachments: true,
				supportsVision: true,
				supportsReasoning: true,
				contextWindow: 2097152,
			},
		],
	},
	{
		id: "deepseek-web",
		name: "DeepSeek (Online Account)",
		color: "#2563eb",
		letter: "D",
		models: 2,
		enabled: true,
		capabilities: ["oauth", "streaming", "tools", "reasoning"],
		modelList: [
			{
				id: "deepseek-v3",
				name: "DeepSeek V3",
				description: "DeepSeek general intelligence web account model",
				supportsAttachments: true,
				contextWindow: 64000,
			},
			{
				id: "deepseek-r1",
				name: "DeepSeek R1",
				description: "Open-weights reasoning breakthrough model",
				supportsAttachments: true,
				supportsReasoning: true,
				contextWindow: 64000,
			},
		],
	},
	{
		id: "qwen-web",
		name: "Qwen (Online Account)",
		color: "#8b5cf6",
		letter: "Q",
		models: 2,
		enabled: true,
		capabilities: ["oauth", "streaming", "tools", "reasoning"],
		modelList: [
			{
				id: "qwen-2.5-max",
				name: "Qwen 2.5 Max",
				description: "Alibaba flagship large language model",
				supportsAttachments: true,
				supportsReasoning: true,
				contextWindow: 128000,
			},
			{
				id: "qwen-2.5-coder-32b",
				name: "Qwen 2.5 Coder 32B",
				description: "Premier coding and software development model",
				supportsAttachments: true,
				supportsReasoning: true,
				contextWindow: 128000,
			},
		],
	},
	// --- Local Model Providers (100% on-device / zero-cost) ---
	{
		id: "ollama",
		name: "Ollama (Local)",
		color: "#ffffff",
		letter: "O",
		models: 4,
		enabled: true,
		capabilities: ["local-auth", "streaming", "tools", "vision"],
		modelList: [
			{
				id: "llama3.3:latest",
				name: "Llama 3.3 70B (Local)",
				description: "Meta open weights model running on local Ollama endpoint (port 11434)",
				supportsAttachments: true,
				supportsReasoning: true,
				contextWindow: 128000,
			},
			{
				id: "deepseek-r1:latest",
				name: "DeepSeek R1 (Local)",
				description: "Locally running DeepSeek R1 reasoning distilled model",
				supportsAttachments: true,
				supportsReasoning: true,
				contextWindow: 64000,
			},
			{
				id: "qwen2.5-coder:latest",
				name: "Qwen 2.5 Coder (Local)",
				description: "High accuracy local code synthesis and refactoring",
				supportsAttachments: true,
				contextWindow: 32768,
			},
			{
				id: "mistral:latest",
				name: "Mistral 7B (Local)",
				description: "Fast local language model for privacy-first operations",
				supportsAttachments: true,
				contextWindow: 32768,
			},
		],
	},
	{
		id: "lmstudio",
		name: "LM Studio (Local)",
		color: "#38bdf8",
		letter: "L",
		models: 1,
		enabled: true,
		capabilities: ["local-auth", "streaming", "tools"],
		modelList: [
			{
				id: "local-model",
				name: "Active Model in LM Studio",
				description: "Currently loaded model in LM Studio server (port 1234)",
				supportsAttachments: true,
				contextWindow: 64000,
			},
		],
	},
	// --- Universal API Key Routers ---
	{
		id: "openrouter",
		name: "OpenRouter (API Key)",
		color: "#6366f1",
		letter: "R",
		models: 3,
		enabled: true,
		capabilities: ["streaming", "tools", "vision", "reasoning"],
		modelList: [
			{
				id: "anthropic/claude-3.5-sonnet",
				name: "Claude 3.5 Sonnet (OpenRouter)",
				description: "Accessed via OpenRouter universal gateway",
				supportsAttachments: true,
				supportsVision: true,
				supportsReasoning: true,
				contextWindow: 200000,
			},
			{
				id: "openai/gpt-4o",
				name: "GPT-4o (OpenRouter)",
				description: "OpenAI flagship via OpenRouter",
				supportsAttachments: true,
				supportsVision: true,
				contextWindow: 128000,
			},
			{
				id: "deepseek/deepseek-r1",
				name: "DeepSeek R1 (OpenRouter)",
				description: "Reasoning intelligence routed through OpenRouter",
				supportsAttachments: true,
				supportsReasoning: true,
				contextWindow: 64000,
			},
		],
	},
];

export function fetchProviderCatalog(options?: {
	fresh?: boolean;
}): Promise<ProviderCatalogResponse> {
	const now = Date.now();
	if (
		!options?.fresh &&
		providerCatalogCache &&
		now - providerCatalogCache.fetchedAt < PROVIDER_CATALOG_CACHE_TTL_MS
	) {
		return providerCatalogCache.promise;
	}
	const promise = desktopClient
		.invoke<ProviderCatalogResponse>("list_provider_catalog")
		.then((payload) => {
			const existingIds = new Set((payload.providers ?? []).map((p) => p.id));
			const missingDefaults = DEFAULT_FALLBACK_PROVIDERS.filter((p) => !existingIds.has(p.id));
			const mergedProviders = [...(payload.providers ?? []), ...missingDefaults];
			const finalPayload: ProviderCatalogResponse = {
				...payload,
				providers: mergedProviders,
				enabledProviderIds: Array.from(new Set([...(payload.enabledProviderIds ?? []), ...missingDefaults.map((p) => p.id)])),
			};
			if (providerCatalogCache?.promise === promise)
				providerCatalogPayload = finalPayload;
			return finalPayload;
		})
		.catch((error) => {
			// In standalone mobile or web mode without local daemon, fallback to Google Gemini-first default catalog
			const fallbackPayload: ProviderCatalogResponse = {
				providers: DEFAULT_FALLBACK_PROVIDERS,
				enabledProviderIds: DEFAULT_FALLBACK_PROVIDERS.map((p) => p.id),
			};
			if (providerCatalogCache?.promise === promise) {
				providerCatalogPayload = fallbackPayload;
			}
			return fallbackPayload;
		});
	providerCatalogCache = { fetchedAt: now, promise };
	return promise;
}

type ProviderCatalogInvalidationListener = () => void;
const providerCatalogInvalidationListeners =
	new Set<ProviderCatalogInvalidationListener>();

/**
 * Notifies when the provider catalog cache is invalidated (credentials
 * saved, providers toggled, OAuth completed) so long-lived consumers — e.g.
 * the chat pane's "connect a model" notice — can refetch instead of showing
 * stale connection state until they happen to remount.
 */
export function subscribeToProviderCatalogInvalidation(
	listener: ProviderCatalogInvalidationListener,
): () => void {
	providerCatalogInvalidationListeners.add(listener);
	return () => providerCatalogInvalidationListeners.delete(listener);
}

export function invalidateProviderCatalogCache(): void {
	providerCatalogCache = null;
	providerCatalogPayload = null;
	transcriptionModelsCache.clear();
	// Credentials may have just changed: a pane remounting off the snapshot
	// must not act on the old keys, so drop it until a fresh load lands.
	providerCatalogSnapshot = null;
	for (const listener of providerCatalogInvalidationListeners) {
		listener();
	}
}

// "+ new chat" remounts the chat pane, which otherwise blocks its first
// paint on a full catalog fetch. The last successful load is kept here (not
// in the pane module) so credential changes invalidate it with the cache.
export type ProviderCatalogSnapshot = {
	credentials: Record<string, { apiKey: string; auth?: ProviderAuthInfo }>;
	contextWindows: Record<string, Record<string, number>>;
};

let providerCatalogSnapshot: ProviderCatalogSnapshot | null = null;

export function readProviderCatalogSnapshot(): ProviderCatalogSnapshot | null {
	return providerCatalogSnapshot;
}

export function writeProviderCatalogSnapshot(
	snapshot: ProviderCatalogSnapshot,
): void {
	providerCatalogSnapshot = snapshot;
}

export function notifyVoiceInputSettingsChanged(settings?: {
	voiceInput?: VoiceInputSelection;
}): void {
	if (settings && providerCatalogPayload) {
		// A model selection does not change credentials or provider capabilities.
		providerCatalogPayload = {
			...providerCatalogPayload,
			voiceInput: settings.voiceInput,
		};
		providerCatalogCache = {
			fetchedAt: Date.now(),
			promise: Promise.resolve(providerCatalogPayload),
		};
	} else {
		invalidateProviderCatalogCache();
	}
	if (typeof window !== "undefined") {
		window.dispatchEvent(new Event(VOICE_INPUT_SETTINGS_CHANGED_EVENT));
	}
}

export async function loadProviderModelCatalog(options?: {
	includeCloudModels?: boolean;
	includeVoiceInput?: boolean;
}): Promise<ProviderModelCatalog> {
	if (options?.includeCloudModels) {
		const [models, localCatalog] = await Promise.all([
			desktopClient.invoke<CloudModel[]>("list_cloud_models"),
			fetchProviderCatalog(),
		]);
		// This catalog reads bundled/local metadata, without provider network
		// discovery. Load it explicitly so capabilities survive a cold cache.
		const details = new Map(
			(localCatalog.providers ?? []).flatMap((provider) =>
				(provider.modelList ?? []).map((model) => [model.id, model] as const),
			),
		);
		// Cloud catalogs are billing choices on the same Hermes / OPEN-VERSE transport. Only
		// the account-scoped cloud response determines which models are offered.
		return buildProviderModelCatalog(
			Object.entries({
				hermes: "Hermes Agent Core",
				cline: "OPEN-VERSE Hermes",
				"cline-pass": "Hermes Pro",
				"cline-cloud": "Hermes Free",
			}).map(([id, name]) => ({
				id,
				name,
				enabled: true,
				models: null,
				color: "",
				letter: "C",
				modelList: models
					.filter((model) => model.catalogId === id)
					.map((model) => ({ ...details.get(model.id), ...model })),
			})),
		);
	}
	const payload = await fetchProviderCatalog();
	const catalog = buildProviderModelCatalog(payload.providers ?? []);
	// Voice discovery may need the provider network. Chat and routine pickers
	// should remain usable even if the configured voice provider is unavailable.
	if (!options?.includeVoiceInput) return catalog;
	const selection = payload.voiceInput;
	const provider = catalog.providers.find(
		(entry) => entry.id === selection?.providerId && isProviderConnected(entry),
	);
	if (selection && provider) {
		const models = await loadTranscriptionModels(provider.id);
		catalog.voiceInput = selectTranscriptionModel(
			[{ ...provider, modelList: models }],
			selection,
		);
	}
	return catalog;
}

export function loadTranscriptionModels(
	providerId: string,
): Promise<ProviderModel[]> {
	const cached = transcriptionModelsCache.get(providerId);
	if (
		cached &&
		Date.now() - cached.fetchedAt < TRANSCRIPTION_MODELS_CACHE_TTL_MS
	)
		return cached.promise;
	const promise = desktopClient
		.invoke<ProviderModelsResponse>("list_transcription_models", {
			provider: providerId,
		})
		.then((payload) => {
			const models = payload.models.filter(isDedicatedTranscriptionModel);
			const entry = transcriptionModelsCache.get(providerId);
			if (entry?.promise === promise) {
				entry.models = models;
				entry.fetchedAt = Date.now();
			}
			return models;
		})
		.catch((error) => {
			if (transcriptionModelsCache.get(providerId)?.promise === promise)
				transcriptionModelsCache.delete(providerId);
			throw error;
		});
	transcriptionModelsCache.set(providerId, { fetchedAt: Date.now(), promise });
	return promise;
}

export async function loadProviderModels(
	providerId: string,
	options?: { includeCloudModels?: boolean },
): Promise<ProviderModel[]> {
	const payload = await desktopClient.invoke<ProviderModelsResponse>(
		"list_provider_models",
		{
			provider: providerId,
			...(options?.includeCloudModels ? { includeCloudModels: true } : {}),
		},
	);
	return filterChatModels(payload.models);
}
