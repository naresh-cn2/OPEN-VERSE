# COMPLETE-HERMES-ARCHITECTURE: Forensic System Architecture

This document provides a comprehensive, forensic architectural specification of the complete Hermes Agent codebase adopted as **OPEN-VERSE 2.0**.

---

## 1. High-Level Architectural Decomposition

OPEN-VERSE 2.0 is structured into five cohesive, decoupled architectural tiers:

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                          1. USER INTERACTION TIER                           │
│  ┌───────────────────────┐  ┌───────────────────┐  ┌─────────────────────┐  │
│  │  OPEN-VERSE 2.0 CLI   │  │    Desktop HUD    │  │ Platform Gateways   │  │
│  │   (Rich Terminal)     │  │ (Electron + React)│  │ (Telegram, Discord, │  │
│  │    [hermes_cli/]      │  │  [apps/desktop/]  │  │  Slack, WhatsApp)   │  │
│  └───────────┬───────────┘  └─────────┬─────────┘  └──────────┬──────────┘  │
└──────────────┼────────────────────────┼───────────────────────┼─────────────┘
               │                        │                       │
┌──────────────▼────────────────────────▼───────────────────────▼─────────────┐
│                         2. GATEWAY & PROTOCOL TIER                          │
│  ┌───────────────────────┐  ┌───────────────────┐  ┌─────────────────────┐  │
│  │  Gateway Server / RPC │  │    ACP Adapter    │  │ MCP Client Hub      │  │
│  │  (FastAPI / WebSocket)│  │ (Agent Control P.)│  │ (Stdio & SSE Trans.)│  │
│  │      [gateway/]       │  │  [acp_adapter/]   │  │   [gateway/mcp/]    │  │
│  └───────────┬───────────┘  └─────────┬─────────┘  └──────────┬──────────┘  │
└──────────────┼────────────────────────┼───────────────────────┼─────────────┘
               │                        │                       │
┌──────────────▼────────────────────────▼───────────────────────▼─────────────┐
│                     3. CORE AGENT RUNTIME & REASONING                       │
│  ┌───────────────────────┐  ┌───────────────────┐  ┌─────────────────────┐  │
│  │   Autonomous Loop     │  │ Context Management│  │  Reasoning Engine   │  │
│  │  (Turn State Machine) │  │  & Pruning Engine │  │ (<thought> Stream)  │  │
│  │    [agent/loop.py]    │  │ [agent/context.py]│  │  [agent/agent.py]   │  │
│  └───────────┬───────────┘  └─────────┬─────────┘  └──────────┬──────────┘  │
└──────────────┼────────────────────────┼───────────────────────┼─────────────┘
               │                        │                       │
┌──────────────▼────────────────────────▼───────────────────────▼─────────────┐
│                       4. TOOL & EXECUTION SUB-TIER                          │
│  ┌───────────────────────┐  ┌───────────────────┐  ┌─────────────────────┐  │
│  │ Built-in Tools (50+)  │  │  Approval Engine  │  │ Dynamic Skills &    │  │
│  │ (Terminal, Browser,   │  │ (Security Policy &│  │  Evidence Store     │  │
│  │  Files, Voice, Cron)  │  │  User Approvals)  │  │   [skills/,         │  │
│  │       [tools/]        │  │[tools/approval.py]│  │ skills/evidence_..] │  │
│  └───────────────────────┘  └───────────────────┘  └─────────────────────┘  │
└───────────────────────────────────────┬─────────────────────────────────────┘
                                        │
┌───────────────────────────────────────▼─────────────────────────────────────┐
│                   5. MODEL PROVIDER & PERSISTENCE TIER                      │
│  ┌───────────────────────┐  ┌───────────────────┐  ┌─────────────────────┐  │
│  │ Universal Provider Hub│  │ SQLite WAL Stores │  │ Self-Update Engine  │  │
│  │ (Nous, Anthropic, OAI,│  │(state, projects,  │  │ (Channels, Receipts,│  │
│  │  Gemini, Groq, Local) │  │ kanban, cron DBs) │  │  Downgrade Guards)  │  │
│  │   [agent/models.py]   │  │    [agent/db/]    │  │[hermes_cli/update_*]│  │
│  └───────────────────────┘  └───────────────────┘  └─────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Core Agent Runtime & Execution Loop

### 2.1 Agent State Machine (`agent/loop.py`, `agent/agent.py`)
The execution engine is an asynchronous iterative state machine that drives the LLM through continuous problem-solving cycles:
1. **Context Assembly (`agent/context.py`):**
   - Ingests system prompt, user instructions, persistent long-term memory facts, active tool definitions, and conversation history.
   - Computes token bounds against model context windows (e.g. 128k, 200k, 1M tokens).
   - Dynamically prunes expired tool outputs or compresses prior turns when context limits are approached (`agent/conversation_compressor.py`).
2. **Model Invocation & Stream Processing:**
   - Issues streaming API calls to the configured model provider via `agent/models.py`.
   - Parses streaming tokens, separating reasoning traces (`<thought> ... </thought>`) from final content and tool calls.
   - Emits live events to the CLI renderer (`hermes_cli/cli_render.py`), Desktop HUD, or ACP client.
3. **Tool Call Parsing & Validation:**
   - Extracts structured function calls matching the OpenAI/Anthropic tool call format.
   - Validates arguments against registered JSON schemas generated by the tool registry (`tools/registry.py`).
4. **Approval & Sandboxing Check (`tools/approval.py`):**
   - Queries the interactive approval policy (e.g., auto-approve read-only commands; prompt user for high-risk write/delete/bash commands).
5. **Execution & Observation Feedback:**
   - Dispatches execution to the corresponding tool handler.
   - Captures stdout, stderr, structured returns, or exceptions.
   - Appends the tool execution result back into the message history as an observation.
   - Cycles back to Step 1 until the model emits a completion token without further tool requests.

---

## 3. Universal Model Provider Hub (`agent/models.py`, `agent/providers/`)

The model subsystem provides unified abstraction across commercial cloud APIs, aggregator gateways, and local inference runtimes:

- **Commercial Cloud Providers:**
  - **Nous Portal:** First-class optimization for Nous Research Hermes models (Hermes 3, Hermes 4 / HY4).
  - **Anthropic Claude:** Claude 3.7 Sonnet, Claude 3.5 Sonnet, Claude 3.5 Haiku, Claude 3 Opus (native reasoning tokens, extended thinking).
  - **OpenAI:** GPT-4o, GPT-4o-mini, o1, o3-mini (structured tool calling, strict JSON outputs).
  - **Google Gemini:** Gemini 2.0 Flash, Gemini 1.5 Pro via Google GenAI SDK.
  - **Groq & Together AI:** Ultra-low latency inference for Llama 3.3, DeepSeek-V3/R1.
  - **Mistral AI & Cohere:** Mistral Large, Codestral, Command R+.
  - **Cloud Hyperscalers:** Amazon Bedrock, Google Cloud Vertex AI, Azure OpenAI Service.
- **Aggregators:**
  - **OpenRouter & Kilo Code:** Multi-model routing with automatic cost estimation and provider fallbacks.
- **Local Self-Hosted Runtimes:**
  - **llama.cpp / Ollama / vLLM:** OpenAI-compatible local HTTP servers (`http://localhost:11434/v1`, `http://localhost:8080/v1`).
- **Resilience & Fallback:**
  - Exponential backoff with jitter on HTTP 429 (Rate Limit) and HTTP 5xx errors.
  - Automatic fallback provider chain: if primary provider encounters quota exhaustion or outage, the runtime smoothly transitions to secondary configured providers without losing context.

---

## 4. Tool Registry, Sandboxing & Approval Engine

### 4.1 Tool Registry (`tools/registry.py`)
All capabilities are declared via a Python decorator pattern:
- Tools register their name, description, parameters schema (using Pydantic or type hints), and safety level.
- Tools automatically generate standardized JSON schema definitions submitted in the model's `tools` array.

### 4.2 Built-in Toolsets (50+ modules in `tools/`)
- **System & Terminal:** `terminal.py`, `shell.py`, `powershell.py`, `process.py`.
- **Filesystem & Code Editing:** `file_ops.py`, `patch.py`, `ripgrep.py`, `git.py`, `tree.py`.
- **Browser Automation:** `browser.py` (Playwright-driven Chromium with page navigation, element clicking, form input, screenshot capture, and accessibility tree parsing).
- **GUI & Computer Use:** `computer_use.py` (OS mouse/keyboard control, display capture).
- **Voice & Multimedia:** `voice.py` (Speech-to-text, text-to-speech, audio streaming), `image_gen.py`, `vision.py`.
- **Planning & Orchestration:** `kanban.py`, `cron.py`, `subagent.py` (hierarchical delegation to isolated sub-agents).

### 4.3 Approval & Security Architecture (`tools/approval.py`)
- Configurable approval policies: `ALWAYS_ALLOW`, `CONFIRM_DANGEROUS`, `ALWAYS_CONFIRM`.
- High-risk operations (e.g. `rm -rf`, modifying system paths, executing arbitrary scripts) trigger an interactive user prompt in the CLI or GUI.
- Path sandboxing ensures tools operate within designated workspace roots unless explicit permissions are granted.

---

## 5. Memory System & Context Compression

### 5.1 Storage Architecture (`agent/db/`)
OPEN-VERSE 2.0 maintains persistent state using SQLite configured in Write-Ahead Logging (WAL) mode for high-concurrency read/write operations:
- `~/.hermes/state.db`: Global agent state, persistent conversational memories, fact triples, and entity relations.
- `~/.hermes/projects.db`: Workspace configurations, active projects, file indices.
- `~/.hermes/kanban.db`: Task management boards, stages, assignments, and dependencies.
- `~/.hermes/cron/executions.db`: Scheduled job configurations, cron triggers, execution histories.

### 5.2 Context Compression Engine (`agent/conversation_compressor.py`)
When conversations exceed the configured budget:
- Older dialogue turns are summarized into compact semantic memory units.
- Tool outputs (especially large diffs or command logs) are pruned down to structured status summaries.
- System prompt and critical working memory assertions are preserved verbatim.
- Verified across four distinct execution interfaces: CLI, Gateway, TUI, and ACP.

---

## 6. Skills System & Evidence Store

### 6.1 Dynamic Skill Acquisition (`skills/`)
- Skills are self-contained markdown/YAML bundles specifying specialized procedures, workflows, and tool execution recipes.
- Skills are loaded on-demand from workspace `.hermes/skills/`, user `~/.hermes/skills/`, or built-in plugin registries.
- When relevant to a user request, skill instructions are dynamically injected into the system prompt.

### 6.2 Evidence Store (`skills/evidence_store.py`)
- Maintains cryptographic hashes, logs, and verifiable execution evidence of actions taken by skills.
- Ensures reproducibility and traceability for automated operations.

---

## 7. Model Context Protocol (MCP) Integration

OPEN-VERSE 2.0 incorporates a complete Model Context Protocol client implementation:
- **Transports:** Supports standard `stdio` (spawning local MCP server binaries) and `sse` (HTTP Server-Sent Events for remote microservices).
- **Dynamic Discovery & Mounting:** At startup or on configuration change, the gateway discovers configured MCP servers, queries their `tools/list` and `resources/list`, and registers them dynamically into the tool registry.
- **Demonstrated MCP Servers:** GitLab (45 tools), Notion (81 tools), Blender (30 tools), GitHub, PostgreSQL, SQLite, and Filesystem servers.

---

## 8. Agent Control Protocol (ACP) & Gateway Daemon

### 8.1 Gateway Daemon (`gateway/`)
- Central background process managing agent runtimes, shared state, and client connections.
- Exposes RESTful endpoints, WebSocket streams, and Unix domain sockets / Windows named pipes.
- Coordinates multi-client sessions (e.g. allowing CLI, Web Dashboard, and Desktop HUD to monitor the same agent session).
- Houses platform messaging bridges (Telegram, Discord, Slack, WhatsApp, Signal) to enable remote messaging-based agent interactions.

### 8.2 ACP Adapter (`acp_adapter/`, `agent/acp_client.py`)
- Implements the Agent Control Protocol standard.
- Enables bi-directional RPC communication for IDE extensions (VS Code, JetBrains), external GUI orchestrators, and headless workflows.

---

## 9. Multi-Interface Architecture

1. **Rich Terminal CLI (`hermes_cli/`):**
   - Full TUI built on `prompt_toolkit` and `rich`.
   - Streaming markdown rendering, collapsible thought traces, interactive approval popups, and tab completion.
2. **Desktop HUD Application (`apps/desktop/`):**
   - High-performance Electron + React application.
   - Transparent overlay HUD mode for instant hotkey access.
   - Built-in wake-word detection (`wakeword.ts`) and real-time audio voice mode.
3. **Web Dashboard (`hermes_cli/web_server.py`, `web/`):**
   - Fast, embedded HTTP server on port 9119 providing visual session management, kanban tracking, and logs.

---

## 10. Automatic Update & Self-Maintenance Engine

Refer to [docs/UPDATE-SYSTEM-AUDIT.md](file:///c:/Users/nares/Workspace/OPEN-VERSE/OPEN-VERSE/open-verse-2.0/docs/UPDATE-SYSTEM-AUDIT.md) for full details on:
- Release channel selection (`stable`, `beta`, `nightly`, `canary`).
- Cryptographic manifest verification and SHA-256 integrity checks.
- Semantic version downgrade guards (`tests/hermes_cli/test_update_downgrade_guard.py`).
- Atomic staging, binary swaps, and automated rollback recovery.
