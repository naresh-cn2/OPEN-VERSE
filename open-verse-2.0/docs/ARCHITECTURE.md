# OPEN-VERSE 2.0 — System Architecture

## 1. High-Level Architectural Overview

OPEN-VERSE 2.0 is built on a modular, decoupled agent architecture composed of five primary tiers:

```text
┌────────────────────────────────────────────────────────────────────────┐
│                        USER INTERFACE LAYER                            │
│  ┌───────────────────────┐  ┌───────────────────┐  ┌────────────────┐ │
│  │   OPEN-VERSE 2.0 CLI  │  │  Desktop HUD App  │  │ External / ACP │ │
│  │     (Rich Terminal)   │  │ (Electron + React)│  │ Client / WebUI │ │
│  └──────────┬────────────┘  └─────────┬─────────┘  └───────┬────────┘ │
└─────────────┼─────────────────────────┼────────────────────┼──────────┘
              │                         │                    │
┌─────────────▼─────────────────────────▼────────────────────▼──────────┐
│                           GATEWAY LAYER                                │
│       HTTP Server • WebSocket Gateway • Agent Control Protocol        │
└───────────────────────────────────────┬────────────────────────────────┘
                                        │
┌───────────────────────────────────────▼────────────────────────────────┐
│                       CORE AGENT RUNTIME & REASONING                   │
│   ┌─────────────────────┐   ┌───────────────────┐   ┌────────────────┐ │
│   │   Autonomous Loop   │   │ Context & Memory  │   │  Self-Healing  │ │
│   │   Execution Engine  │   │ Manager & Vector  │   │ Error Resolver │ │
│   └──────────┬──────────┘   └─────────┬─────────┘   └───────┬────────┘ │
└──────────────┼────────────────────────┼─────────────────────┼──────────┘
               │                        │                     │
┌──────────────▼────────────────────────▼─────────────────────▼──────────┐
│                         PROVIDER & LLM ADAPTERS                        │
│   Anthropic Claude • OpenAI • Google Gemini • Nous / vLLM / Ollama    │
└───────────────────────────────────────┬────────────────────────────────┘
                                        │
┌───────────────────────────────────────▼────────────────────────────────┐
│                          TOOL EXECUTION ENGINE                         │
│  ┌───────────────┐ ┌────────────────┐ ┌───────────────┐ ┌────────────┐ │
│  │ Terminal/Bash │ │ Filesystem/Git │ │ Browser / CUA │ │    MCP     │ │
│  └───────────────┘ └────────────────┘ └───────────────┘ └────────────┘ │
│  ┌───────────────┐ ┌────────────────┐ ┌───────────────┐ ┌────────────┐ │
│  │ Vision/Audio  │ │ Memory/Skills  │ │ Subagents/Cron│ │   Kanban   │ │
│  └───────────────┘ └────────────────┘ └───────────────┘ └────────────┘ │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Component Subsystems

### 2.1 Agent Runtime (`agent/`)
- **Reasoning Loop:** The core loop accepts user objectives, retrieves relevant system prompts, context, and memories, and queries the LLM provider.
- **Tool Dispatch:** When the LLM emits tool call requests, arguments are validated against strict JSON schemas before being dispatched to the local tool runner.
- **Context Compactor:** Long-running sessions automatically compress earlier conversation turns while retaining key execution state and file modifications.

### 2.2 Providers (`agent/providers/`)
Standardized abstraction layer translating internal agent message formats into provider-specific payloads:
- Streaming text and reasoning tokens.
- Native tool calling protocols (Anthropic messages, OpenAI functions, Google Gemini tool declarations).

### 2.3 Tool Execution Subsystem (`tools/`)
Over 50 specialized tools organized into functional domains:
- **System & Terminal:** Subprocess lifecycle management, persistent shell sessions, output streaming, and error code interception.
- **Filesystem & Code:** Full text search, ripgrep integration, file diffing, AST analysis, and syntax validation.
- **Headless Browser & Computer Use:** Browser automation via Playwright/Chrome DevTools, automated screenshot inspection, and mouse/keyboard event synthesis.
- **Model Context Protocol (MCP):** Connects to external MCP servers to consume dynamic tools and resources.

### 2.4 User Interfaces (`hermes_cli/` & `apps/desktop/`)
- **Terminal CLI:** Rich console rendering with syntax highlighting, streaming Markdown, interactive confirmation prompts, and multi-session management.
- **Desktop Application:** Electron-based floating HUD with overlay mode, audio waveform visualizers, wake-word listeners, and embedded terminal views.

### 2.5 Gateway Protocol (`gateway/`)
Provides bidirectional WebSocket and HTTP REST streaming endpoints adhering to the Agent Control Protocol (ACP), enabling remote orchestration, frontend integration, and telemetry streaming.
