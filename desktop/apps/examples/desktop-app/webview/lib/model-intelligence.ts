"use client";

import { desktopClient } from "./desktop-client";

export type ModelCapability =
  | "text"
  | "vision"
  | "audio"
  | "video"
  | "tools"
  | "reasoning"
  | "structured_output"
  | "image_generation";

export interface ModelCapabilityInfo {
  providerId: string;
  modelId: string;
  displayName: string;
  capabilities: ModelCapability[];
  contextWindow?: number;
  maxOutputTokens?: number;
  pricing?: {
    inputPerToken?: number;
    outputPerToken?: number;
  };
  local: boolean;
  cloud: boolean;
  free: boolean;
  source: "catalog" | "provider" | "inferred";
  confidence: number;
  limitations: string[];
}

export interface ProviderInfo {
  id: string;
  name: string;
  configured: boolean;
  models: ModelCapabilityInfo[];
  authRequired: boolean;
  baseURL?: string;
}

export interface ModelIntelligenceService {
  getProviderModels(providerId: string): Promise<ModelCapabilityInfo[]>;
  getModelCapabilities(providerId: string, modelId: string): Promise<ModelCapabilityInfo | null>;
  getAllProviders(): Promise<ProviderInfo[]>;
  getFreeModels(): Promise<ModelCapabilityInfo[]>;
  getLocalModels(): Promise<ModelCapabilityInfo[]>;
  compareModels(models: Array<{ providerId: string; modelId: string }>): Promise<ModelCapabilityInfo[]>;
}

class ModelIntelligenceServiceImpl implements ModelIntelligenceService {
  private providerCache: Map<string, ProviderInfo> = new Map();
  private modelCache: Map<string, ModelCapabilityInfo> = new Map();
  private cacheTimestamp: number = 0;
  private readonly CACHE_TTL = 5 * 60 * 1000;

  async getProviderModels(providerId: string): Promise<ModelCapabilityInfo[]> {
    await this.refreshCacheIfNeeded();
    const provider = this.providerCache.get(providerId);
    return provider ? provider.models : [];
  }

  async getModelCapabilities(providerId: string, modelId: string): Promise<ModelCapabilityInfo | null> {
    await this.refreshCacheIfNeeded();
    const key = `${providerId}/${modelId}`;
    return this.modelCache.get(key) ?? null;
  }

  async getAllProviders(): Promise<ProviderInfo[]> {
    await this.refreshCacheIfNeeded();
    return Array.from(this.providerCache.values());
  }

  async getFreeModels(): Promise<ModelCapabilityInfo[]> {
    await this.refreshCacheIfNeeded();
    const result: ModelCapabilityInfo[] = [];
    for (const model of this.modelCache.values()) {
      if (model.free) result.push(model);
    }
    return result;
  }

  async getLocalModels(): Promise<ModelCapabilityInfo[]> {
    await this.refreshCacheIfNeeded();
    const result: ModelCapabilityInfo[] = [];
    for (const model of this.modelCache.values()) {
      if (model.local && !model.cloud) result.push(model);
    }
    return result;
  }

  async compareModels(models: Array<{ providerId: string; modelId: string }>): Promise<ModelCapabilityInfo[]> {
    const results: ModelCapabilityInfo[] = [];
    for (const m of models) {
      const info = await this.getModelCapabilities(m.providerId, m.modelId);
      if (info) results.push(info);
    }
    return results;
  }

  private async refreshCacheIfNeeded(): Promise<void> {
    const now = Date.now();
    if (this.providerCache.size > 0 && now - this.cacheTimestamp < this.CACHE_TTL) {
      return;
    }

    try {
      const providers = await desktopClient.listProviders?.();
      if (providers) {
        for (const p of providers) {
          const providerInfo: ProviderInfo = {
            id: p.id,
            name: p.name ?? p.id,
            configured: p.configured ?? false,
            models: [],
            authRequired: p.authRequired ?? true,
            baseURL: p.baseURL,
          };

          const models = await this.getModelsForProvider(p.id);
          providerInfo.models = models;
          for (const m of models) {
            this.modelCache.set(`${p.id}/${m.modelId}`, m);
          }
          this.providerCache.set(p.id, providerInfo);
        }
      }
    } catch (err) {
      console.error("Failed to refresh model catalog:", err);
    }

    this.cacheTimestamp = Date.now();
  }

  private async getModelsForProvider(providerId: string): Promise<ModelCapabilityInfo[]> {
    try {
      const models = await desktopClient.listModels?.(providerId);
      if (models) {
        return models.map((m: any) => this.mapModel(providerId, m));
      }
    } catch {
      // Provider may not support model listing
    }
    return [];
  }

  private mapModel(providerId: string, model: any): ModelCapabilityInfo {
    const modelId = model.id || model.modelId || model.name || "unknown";
    const capabilities: ModelCapability[] = ["text"];
    const limitations: string[] = [];

    if (model.capabilities) {
      for (const cap of model.capabilities) {
        if (cap === "vision") capabilities.push("vision");
        if (cap === "tools" || cap === "tool_use" || cap === "function_calling") capabilities.push("tools");
        if (cap === "reasoning") capabilities.push("reasoning");
        if (cap === "audio") capabilities.push("audio");
        if (cap === "image_generation") capabilities.push("image_generation");
        if (cap === "video") capabilities.push("video");
        if (cap === "structured_output") capabilities.push("structured_output");
      }
    }

    const modelLower = modelId.toLowerCase();
    if (modelLower.includes("claude-3") || modelLower.includes("claude-4") || modelLower.includes("gpt-4") || modelLower.includes("gpt-5")) {
      if (!capabilities.includes("vision")) capabilities.push("vision");
      if (!capabilities.includes("tools")) capabilities.push("tools");
      if (!capabilities.includes("reasoning")) capabilities.push("reasoning");
    }
    if (modelLower.includes("ollama") || modelLower.includes("llama") || modelLower.includes("local")) {
      limitations.push("Local model - context window depends on hardware");
    }
    if (!capabilities.includes("tools")) {
      limitations.push("Tool calling not confirmed for this model");
    }

    return {
      providerId,
      modelId,
      displayName: model.name || modelId,
      capabilities,
      contextWindow: model.contextWindow || model.context_limit || 4096,
      maxOutputTokens: model.maxOutputTokens || model.max_tokens || 4096,
      pricing: model.pricing,
      local: model.local ?? false,
      cloud: model.cloud ?? true,
      free: model.free ?? false,
      source: model.source || "catalog",
      confidence: model.confidence ?? 0.7,
      limitations,
    };
  }
}

export const modelIntelligence: ModelIntelligenceService = new ModelIntelligenceServiceImpl();