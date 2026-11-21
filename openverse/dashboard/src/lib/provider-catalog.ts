export interface ProviderModel {
  id: string;
  name: string;
  description?: string;
  contextWindow?: number;
  supportsVision?: boolean;
  supportsReasoning?: boolean;
}

export interface ProviderDefinition {
  id: string;
  name: string;
  color: string;
  letter: string;
  category: "cloud" | "local" | "aggregator";
  docUrl: string;
  docLabel: string;
  defaultModelId: string;
  authType: "api-key" | "base-url" | "oauth";
  description: string;
  models: ProviderModel[];
}

export const PROVIDER_CATALOG: ProviderDefinition[] = [
  {
    id: "anthropic",
    name: "Anthropic Claude",
    color: "#d97706",
    letter: "A",
    category: "cloud",
    docUrl: "https://console.anthropic.com/settings/keys",
    docLabel: "Get Anthropic API Key",
    defaultModelId: "claude-3-7-sonnet-20250219",
    authType: "api-key",
    description: "Industry-leading reasoning, coding, and tool-use performance with hybrid thinking.",
    models: [
      { id: "claude-3-7-sonnet-20250219", name: "Claude 3.7 Sonnet (Hybrid Reasoning)", contextWindow: 200000, supportsVision: true, supportsReasoning: true },
      { id: "claude-3-5-sonnet-20241022", name: "Claude 3.5 Sonnet", contextWindow: 200000, supportsVision: true, supportsReasoning: false },
      { id: "claude-3-5-haiku-20241022", name: "Claude 3.5 Haiku", contextWindow: 200000, supportsVision: true, supportsReasoning: false },
    ],
  },
  {
    id: "openai-native",
    name: "OpenAI",
    color: "#10a37f",
    letter: "O",
    category: "cloud",
    docUrl: "https://platform.openai.com/api-keys",
    docLabel: "Get OpenAI API Key",
    defaultModelId: "gpt-4.1-sol",
    authType: "api-key",
    description: "Flagship GPT models with fast multimodal understanding and function execution.",
    models: [
      { id: "gpt-4.1-sol", name: "GPT-4.1 Sol (Preview)", contextWindow: 128000, supportsVision: true, supportsReasoning: true },
      { id: "gpt-4o", name: "GPT-4o", contextWindow: 128000, supportsVision: true, supportsReasoning: false },
      { id: "gpt-4o-mini", name: "GPT-4o Mini", contextWindow: 128000, supportsVision: true, supportsReasoning: false },
      { id: "o3-mini", name: "o3-mini (High Reasoning)", contextWindow: 200000, supportsVision: false, supportsReasoning: true },
    ],
  },
  {
    id: "gemini",
    name: "Google Gemini",
    color: "#4285f4",
    letter: "G",
    category: "cloud",
    docUrl: "https://aistudio.google.com/app/apikey",
    docLabel: "Get Google AI Studio Key",
    defaultModelId: "gemini-2.5-flash",
    authType: "api-key",
    description: "High speed, ultra-large 1M+ token context windows, and native multimodal features.",
    models: [
      { id: "gemini-2.5-flash", name: "Gemini 2.5 Flash", contextWindow: 1048576, supportsVision: true, supportsReasoning: true },
      { id: "gemini-2.5-pro", name: "Gemini 2.5 Pro", contextWindow: 2097152, supportsVision: true, supportsReasoning: true },
      { id: "gemini-2.0-flash", name: "Gemini 2.0 Flash", contextWindow: 1048576, supportsVision: true, supportsReasoning: false },
    ],
  },
  {
    id: "deepseek",
    name: "DeepSeek",
    color: "#4f46e5",
    letter: "D",
    category: "cloud",
    docUrl: "https://platform.deepseek.com/api_keys",
    docLabel: "Get DeepSeek API Key",
    defaultModelId: "deepseek-reasoner",
    authType: "api-key",
    description: "State-of-the-art open weights architecture with competitive reasoning economics.",
    models: [
      { id: "deepseek-reasoner", name: "DeepSeek-R1 (Reasoner)", contextWindow: 64000, supportsVision: false, supportsReasoning: true },
      { id: "deepseek-chat", name: "DeepSeek-V3", contextWindow: 64000, supportsVision: false, supportsReasoning: false },
    ],
  },
  {
    id: "openrouter",
    name: "OpenRouter",
    color: "#6366f1",
    letter: "R",
    category: "aggregator",
    docUrl: "https://openrouter.ai/keys",
    docLabel: "Get OpenRouter API Key",
    defaultModelId: "anthropic/claude-3.7-sonnet",
    authType: "api-key",
    description: "Unified API gateway to access hundreds of models with automated fallback routing.",
    models: [
      { id: "anthropic/claude-3.7-sonnet", name: "Claude 3.7 Sonnet (via OpenRouter)", contextWindow: 200000, supportsVision: true, supportsReasoning: true },
      { id: "deepseek/deepseek-r1", name: "DeepSeek R1 (via OpenRouter)", contextWindow: 64000, supportsVision: false, supportsReasoning: true },
      { id: "meta-llama/llama-3.3-70b-instruct", name: "Llama 3.3 70B (via OpenRouter)", contextWindow: 131072, supportsVision: false, supportsReasoning: false },
    ],
  },
  {
    id: "ollama",
    name: "Ollama (Local Models)",
    color: "#ffffff",
    letter: "L",
    category: "local",
    docUrl: "https://ollama.com",
    docLabel: "Download Ollama",
    defaultModelId: "llama3.2:latest",
    authType: "base-url",
    description: "Run private, offline open-source models completely locally on your hardware.",
    models: [
      { id: "llama3.2:latest", name: "Llama 3.2 (Local)", contextWindow: 128000, supportsVision: false, supportsReasoning: false },
      { id: "qwen2.5-coder:latest", name: "Qwen 2.5 Coder (Local)", contextWindow: 32768, supportsVision: false, supportsReasoning: false },
      { id: "deepseek-r1:latest", name: "DeepSeek R1 Distill (Local)", contextWindow: 32768, supportsVision: false, supportsReasoning: true },
    ],
  },
];

export interface StoredProviderConfig {
  providerId: string;
  apiKey?: string;
  baseUrl?: string;
  modelId: string;
  configuredAt: string;
}

const PROVIDERS_STORAGE_KEY = "openverse.providers.v1";
const MODEL_SELECTION_STORAGE_KEY = "openverse.model-selection.v1";

export function getStoredProviderConfig(): StoredProviderConfig | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(PROVIDERS_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function saveStoredProviderConfig(config: StoredProviderConfig): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(PROVIDERS_STORAGE_KEY, JSON.stringify(config));
    window.localStorage.setItem(
      MODEL_SELECTION_STORAGE_KEY,
      JSON.stringify({
        lastProvider: config.providerId,
        lastModelByProvider: { [config.providerId]: config.modelId },
      })
    );
  } catch (error) {
    console.warn("Failed to save provider config:", error);
  }
}

export function clearStoredProviderConfig(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(PROVIDERS_STORAGE_KEY);
    window.localStorage.removeItem(MODEL_SELECTION_STORAGE_KEY);
  } catch (error) {
    console.warn("Failed to clear provider config:", error);
  }
}
