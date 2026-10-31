/**
 * Direct AI Streaming Service
 * Provides client-side direct streaming to Google Gemini, Anthropic Claude, OpenAI, and Ollama.
 */

import { type ChatMessage, type ModelProviderKeys } from "./storage";

export interface StreamCallbacks {
  onChunk: (chunk: string) => void;
  onError: (error: Error) => void;
  onComplete: (fullText: string) => void;
}

export async function streamDirectAI(
  messages: ChatMessage[],
  config: ModelProviderKeys,
  callbacks: StreamCallbacks,
  signal?: AbortSignal
): Promise<void> {
  const { selectedProvider, selectedModel } = config;

  try {
    switch (selectedProvider) {
      case "gemini":
        await streamGemini(messages, config, callbacks, signal);
        break;
      case "anthropic":
        await streamAnthropic(messages, config, callbacks, signal);
        break;
      case "openai":
        await streamOpenAI(messages, config, callbacks, signal);
        break;
      case "openrouter":
        await streamOpenRouter(messages, config, callbacks, signal);
        break;
      case "ollama":
        await streamOllama(messages, config, callbacks, signal);
        break;
      default:
        throw new Error(`Unsupported AI provider: ${selectedProvider}`);
    }
  } catch (err) {
    if (signal?.aborted) return;
    callbacks.onError(err instanceof Error ? err : new Error(String(err)));
  }
}

// 1. Google Gemini Streaming (SSE)
async function streamGemini(
  messages: ChatMessage[],
  config: ModelProviderKeys,
  callbacks: StreamCallbacks,
  signal?: AbortSignal
) {
  const apiKey = config.geminiApiKey?.trim();
  if (!apiKey) {
    throw new Error("Google Gemini API Key is missing. Please configure it in Settings.");
  }

  const model = config.selectedModel || "gemini-2.5-flash";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?alt=sse&key=${apiKey}`;

  const contents = messages
    .filter((m) => m.role !== "system")
    .map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));

  const systemInstruction = messages.find((m) => m.role === "system")?.content;

  const body: any = { contents };
  if (systemInstruction) {
    body.systemInstruction = {
      parts: [{ text: systemInstruction }],
    };
  }

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini API error (${response.status}): ${errorText}`);
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
      if (line.startsWith("data: ")) {
        const jsonStr = line.replace(/^data:\s*/, "").trim();
        if (!jsonStr) continue;
        try {
          const parsed = JSON.parse(jsonStr);
          const chunk = parsed.candidates?.[0]?.content?.parts?.[0]?.text;
          if (chunk) {
            fullText += chunk;
            callbacks.onChunk(chunk);
          }
        } catch {
          // ignore partial JSON parse errors
        }
      }
    }
  }

  callbacks.onComplete(fullText);
}

// 2. Anthropic Claude Streaming (SSE)
async function streamAnthropic(
  messages: ChatMessage[],
  config: ModelProviderKeys,
  callbacks: StreamCallbacks,
  signal?: AbortSignal
) {
  const apiKey = config.anthropicApiKey?.trim();
  if (!apiKey) {
    throw new Error("Anthropic API Key is missing. Please configure it in Settings.");
  }

  const model = config.selectedModel || "claude-3-7-sonnet-20250219";
  const url = "https://api.anthropic.com/v1/messages";

  const anthropicMessages = messages
    .filter((m) => m.role !== "system")
    .map((m) => ({
      role: m.role === "assistant" ? "assistant" : "user",
      content: m.content,
    }));

  const systemMsg = messages.find((m) => m.role === "system")?.content;

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
      system: systemMsg,
      messages: anthropicMessages,
      stream: true,
    }),
    signal,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Anthropic API error (${response.status}): ${errorText}`);
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
      if (line.startsWith("data: ")) {
        const jsonStr = line.replace(/^data:\s*/, "").trim();
        if (jsonStr === "[DONE]") continue;
        try {
          const parsed = JSON.parse(jsonStr);
          if (parsed.type === "content_block_delta" && parsed.delta?.text) {
            fullText += parsed.delta.text;
            callbacks.onChunk(parsed.delta.text);
          }
        } catch {
          // ignore
        }
      }
    }
  }

  callbacks.onComplete(fullText);
}

// 3. OpenAI Streaming
async function streamOpenAI(
  messages: ChatMessage[],
  config: ModelProviderKeys,
  callbacks: StreamCallbacks,
  signal?: AbortSignal
) {
  const apiKey = config.openaiApiKey?.trim();
  if (!apiKey) {
    throw new Error("OpenAI API Key is missing. Please configure it in Settings.");
  }

  const model = config.selectedModel || "gpt-4o";
  const url = "https://api.openai.com/v1/chat/completions";

  const openaiMessages = messages.map((m) => ({
    role: m.role,
    content: m.content,
  }));

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: openaiMessages,
      stream: true,
    }),
    signal,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI API error (${response.status}): ${errorText}`);
  }

  await parseOpenAICompatibleSSE(response, callbacks);
}

// 4. OpenRouter Streaming
async function streamOpenRouter(
  messages: ChatMessage[],
  config: ModelProviderKeys,
  callbacks: StreamCallbacks,
  signal?: AbortSignal
) {
  const apiKey = config.openrouterApiKey?.trim();
  if (!apiKey) {
    throw new Error("OpenRouter API Key is missing. Please configure it in Settings.");
  }

  const model = config.selectedModel || "anthropic/claude-3.5-sonnet";
  const url = "https://openrouter.ai/api/v1/chat/completions";

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      "HTTP-Referer": "https://openverse.ai",
      "X-Title": "OPEN-VERSE Mobile",
    },
    body: JSON.stringify({
      model,
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
      stream: true,
    }),
    signal,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenRouter error (${response.status}): ${errorText}`);
  }

  await parseOpenAICompatibleSSE(response, callbacks);
}

// 5. Ollama Streaming (Local/LAN)
async function streamOllama(
  messages: ChatMessage[],
  config: ModelProviderKeys,
  callbacks: StreamCallbacks,
  signal?: AbortSignal
) {
  const baseUrl = (config.ollamaBaseUrl?.trim() || "http://10.0.2.2:11434").replace(/\/$/, "");
  const model = config.selectedModel || "llama3.2";
  const url = `${baseUrl}/api/chat`;

  const ollamaMessages = messages.map((m) => ({
    role: m.role,
    content: m.content,
  }));

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      messages: ollamaMessages,
      stream: true,
    }),
    signal,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Ollama connection error (${response.status}): ${errorText}. Verify Ollama is running and accessible.`);
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
      if (!line.trim()) continue;
      try {
        const parsed = JSON.parse(line);
        const chunk = parsed.message?.content;
        if (chunk) {
          fullText += chunk;
          callbacks.onChunk(chunk);
        }
      } catch {
        // ignore
      }
    }
  }

  callbacks.onComplete(fullText);
}

async function parseOpenAICompatibleSSE(
  response: Response,
  callbacks: StreamCallbacks
) {
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
      if (line.startsWith("data: ")) {
        const jsonStr = line.replace(/^data:\s*/, "").trim();
        if (jsonStr === "[DONE]") continue;
        try {
          const parsed = JSON.parse(jsonStr);
          const chunk = parsed.choices?.[0]?.delta?.content;
          if (chunk) {
            fullText += chunk;
            callbacks.onChunk(chunk);
          }
        } catch {
          // ignore
        }
      }
    }
  }

  callbacks.onComplete(fullText);
}
