/**
 * Mobile Storage & Secure Key Persistence
 */

export interface ModelProviderKeys {
  geminiApiKey?: string;
  anthropicApiKey?: string;
  openaiApiKey?: string;
  openrouterApiKey?: string;
  ollamaBaseUrl?: string;
  selectedProvider: "gemini" | "anthropic" | "openai" | "ollama" | "openrouter";
  selectedModel: string;
}

export interface HubConnectionConfig {
  host: string;
  port: number;
  token?: string;
  autoConnect: boolean;
}

const KEYS_STORAGE_KEY = "openverse.mobile.provider_keys.v1";
const HUB_STORAGE_KEY = "openverse.mobile.hub_config.v1";
const SESSIONS_STORAGE_KEY = "openverse.mobile.chat_sessions.v1";

export const DEFAULT_PROVIDER_CONFIG: ModelProviderKeys = {
  selectedProvider: "gemini",
  selectedModel: "gemini-2.5-flash",
  ollamaBaseUrl: "http://10.0.2.2:11434", // standard Android emulator host alias
};

export const DEFAULT_HUB_CONFIG: HubConnectionConfig = {
  host: "10.0.2.2",
  port: 25463,
  autoConnect: false,
};

export function getStoredProviderKeys(): ModelProviderKeys {
  if (typeof window === "undefined") return DEFAULT_PROVIDER_CONFIG;
  try {
    const raw = localStorage.getItem(KEYS_STORAGE_KEY);
    if (!raw) return DEFAULT_PROVIDER_CONFIG;
    return { ...DEFAULT_PROVIDER_CONFIG, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_PROVIDER_CONFIG;
  }
}

export function saveProviderKeys(keys: ModelProviderKeys): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(KEYS_STORAGE_KEY, JSON.stringify(keys));
  } catch (err) {
    console.error("Failed to save provider keys:", err);
  }
}

export function getStoredHubConfig(): HubConnectionConfig {
  if (typeof window === "undefined") return DEFAULT_HUB_CONFIG;
  try {
    const raw = localStorage.getItem(HUB_STORAGE_KEY);
    if (!raw) return DEFAULT_HUB_CONFIG;
    return { ...DEFAULT_HUB_CONFIG, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_HUB_CONFIG;
  }
}

export function saveHubConfig(config: HubConnectionConfig): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(HUB_STORAGE_KEY, JSON.stringify(config));
  } catch (err) {
    console.error("Failed to save hub config:", err);
  }
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: number;
  provider?: string;
  model?: string;
  isStreaming?: boolean;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: number;
  updatedAt: number;
}

export function getStoredSessions(): ChatSession[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(SESSIONS_STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveSessions(sessions: ChatSession[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(SESSIONS_STORAGE_KEY, JSON.stringify(sessions));
  } catch (err) {
    console.error("Failed to save sessions:", err);
  }
}
