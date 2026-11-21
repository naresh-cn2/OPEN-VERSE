# Authentication & Profile State Isolation

This document outlines the authentication architecture, credential handling, session state management, and profile isolation in OPEN-VERSE.

---

## 1. Local-First Profile Isolation

OPEN-VERSE is built on a **local-first, privacy-respecting foundation**:
- All session databases, agent configurations, workspace contexts, and diagnostic logs are persisted strictly inside the user's home directory:
  - **Linux/macOS**: `~/.openverse/`
  - **Windows**: `%USERPROFILE%\.openverse\`
- OPEN-VERSE does not modify or contaminate settings belonging to other tools or system services.

---

## 2. Supported AI Providers & Credential Storage

Users connect to frontier AI model providers through direct API communication:

| Provider | Supported Models | Configuration Method |
| :--- | :--- | :--- |
| **Anthropic** | Claude 3.5 Sonnet, Claude 3 Opus, Claude 3.5 Haiku | In-app settings or `ANTHROPIC_API_KEY` |
| **OpenAI** | GPT-4o, GPT-4o-mini, o1, o3-mini | In-app settings or `OPENAI_API_KEY` |
| **Google Gemini** | Gemini 2.0 Flash, Gemini 1.5 Pro | In-app settings or `GEMINI_API_KEY` |
| **OpenRouter** | DeepSeek R1, Llama 3.3, Mistral Large | In-app settings or `OPENROUTER_API_KEY` |
| **Ollama** | Local open-weights models (offline execution) | Configurable base URL (`http://127.0.0.1:11434`) |

Credentials entered through the user interface are encrypted locally using operating system keychain mechanisms where available, or stored in restricted permission files under `~/.openverse/`.

---

## 3. Account Synchronization Model

For cross-device continuity across Windows, Android, and Web:

1. **State Partitioning**:
   - *Local Ephemeral State*: Active file locks, transient execution sidecars, and local socket bindings remain strictly on the host device.
   - *Synchronized Session State*: Chat history, user preferences, and custom assistant prompts synchronize through the cloud session endpoint when enabled by the user.

2. **Security Guarantees**:
   - Provider API keys are **never** transmitted through telemetry feeds.
   - All client-to-cloud transports require TLS 1.3 encryption.
   - Sessions can be fully exported or wiped at any time directly through the Settings interface.

