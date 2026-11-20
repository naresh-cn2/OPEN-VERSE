# PUBLIC SOURCE REPOSITORY CATALOG
## Verified Open-Source Frameworks, SDKs, and Engine Candidates for OPEN-VERSE ULTIMATE

**Date:** November 19, 2026  
**Document Version:** 1.0.0  
**Purpose:** Technical catalog of verified open-source repositories and standard protocols evaluated for direct code reuse or API integration into OPEN-VERSE.

---

## 1. Primary In-Tree Repository Implementations

### 1.1 Cline Monorepo (`cline/`)
- **Repository URL**: `https://github.com/cline/cline` (Vendored locally in `cline/`)
- **Owner / Maintainer**: Cline Bot Inc. / Open-Source Contributors
- **License**: Apache License 2.0 (Permissive, commercial-friendly)
- **Primary Dependencies**: TypeScript, Bun, Tauri v2, Radix UI, Next.js, Pierre Diffs, `@xterm/xterm`, Tree-Sitter
- **Architecture**:
  - `sdk/packages/core`: Core agent engine, session manager, schedule service, hooks system.
  - `sdk/packages/agents`: Autonomous execution loops, tool schemas, prompt generators.
  - `sdk/packages/llms`: Multi-provider routing across 12+ cloud and local model APIs.
  - `sdk/packages/shared`: MCP client, AST parser, diff viewer utilities.
  - `apps/cli`: CLI binary and Hub daemon.
  - `apps/cline-hub`: Multi-client local daemon multiplexing sessions.
  - `apps/examples/desktop-app`: Tauri v2 desktop application shell and Next.js webview.
- **Tests & Verification**: Comprehensive Vitest test suite (`*.test.ts`) across unit, sidecar, and UI integration.
- **Security Considerations**: High; incorporates tool approval gates, loopback proxy bypass prevention, and path traversal checks.
- **Production Suitability**: **PRODUCTION READY**. Currently forms the core foundation of OPEN-VERSE desktop runtime.
- **Feasibility**: **ALREADY INTEGRATED (IN-TREE)**.

---

### 1.2 OpenClaw (`openclaw/`)
- **Repository URL**: `https://github.com/openclaw/openclaw` (Fork: `https://github.com/naresh-cn2/openclaw.git`)
- **Owner / Maintainer**: OpenClaw Foundation
- **License**: MIT License (Permissive)
- **Primary Dependencies**: TypeScript, Node.js, Bun, Rust, Iroh (P2P QUIC), Playwright, SQLite
- **Architecture**:
  - `src/agents/`: Multi-agent swarms (`swarm.ts`), supervisor-worker patterns, and subagent spawning.
  - `src/boards/` & `src/canvas/`: Real-time blackboard and shared task state management.
  - `src/channels/`: Multi-channel connectors (Discord, Slack, Telegram, WhatsApp, Webhooks).
  - `crates/openclaw-iroh-node/`: Pure Rust Iroh QUIC peer-to-peer node for encrypted device synchronization.
  - `packages/net-policy/`: Fine-grained egress firewall and URL sandboxing.
  - `packages/memory-host-sdk/`: Vector and episodic memory host SDK.
  - `packages/tool-call-repair/`: LLM tool call syntax repair.
- **Tests & Verification**: Extensive test suites in `test/` and `qa/`.
- **Security Considerations**: Exceptional; introduces strict network policy boundaries and cryptographic device pairing.
- **Production Suitability**: **PRODUCTION READY**.
- **Feasibility**: **HIGHLY FEASIBLE (IN-TREE)**. Modular packages can be imported directly into OPEN-VERSE.

---

### 1.3 Hermes Agent (`harmes agent/`)
- **Repository URL**: `https://github.com/NousResearch/Hermes-Agent`
- **Owner / Maintainer**: Nous Research
- **License**: MIT License (Permissive)
- **Primary Dependencies**: Python 3.11+, PyAudio, WebSockets, FastMCP, Tree-Sitter, Pyright, Rust Analyzer
- **Architecture**:
  - `agent/`: Real-time voice mode (`voice_mode.py`, `voice_live.py`), wake-word listener (`wake_word.py`), thinking policy (`anthropic_thinking_policy.py`).
  - `agent/lsp/`: Headless Language Server Protocol client providing compiler-grade code intelligence.
  - `agent/vault_backends/`: OS hardware secret vaults (Windows DPAPI, macOS Keychain, Linux Secret Service).
  - `skills/`: 100+ domain skills across DevOps, research, code auditing, and productivity.
  - `persistence/`: Episodic repository memory.
- **Tests & Verification**: Python unit and integration tests in `tests/`.
- **Security Considerations**: High; features write approvals, URL safety filters, and secure OS keyrings.
- **Production Suitability**: **PRODUCTION READY**.
- **Feasibility**: **HIGHLY FEASIBLE (IN-TREE)**. Core algorithms (LSP client, voice WebSocket bridge, secret vaults) can be adapted into TypeScript/Rust.

---

### 1.4 OpenCode (`opencode/`)
- **Repository URL**: `https://github.com/opencode-ai/opencode`
- **Owner / Maintainer**: OpenCode AI
- **License**: MIT License (Permissive)
- **Primary Dependencies**: TypeScript, Effect-TS, Drizzle ORM, SQLite, SolidJS/React
- **Architecture**:
  - `packages/patchmark/`: State-of-the-art fuzzy patch application engine tolerating whitespace/line drift.
  - `packages/effect-drizzle-sqlite/`: Resilient, transactional SQLite database integration.
  - `packages/process-daemon/`: Background development process coordinator and supervisor.
  - `packages/codemode/`: Sandboxed code execution engine.
  - `packages/merman/`: Interactive Mermaid diagram renderer.
- **Tests & Verification**: Unit tests across packages in `opencode/packages/*/test/`.
- **Security Considerations**: Clean; separates sandboxed execution environments.
- **Production Suitability**: **PRODUCTION READY**.
- **Feasibility**: **HIGHLY FEASIBLE (IN-TREE)**. `patchmark` and `effect-drizzle-sqlite` can be ingested immediately.

---

## 2. External Standard Protocol Repositories & SDKs

### 2.1 Model Context Protocol (MCP) Official SDKs
- **Repository URL**: `https://github.com/modelcontextprotocol/typescript-sdk`
- **Owner / Maintainer**: Model Context Protocol / Anthropic
- **License**: MIT License
- **Dependencies**: TypeScript, Zod, JSON-RPC 2.0
- **Relevance**: Standardizes tool execution, data retrieval, and agent prompt sharing.
- **Production Suitability**: **STANDARD DE FACTO**.
- **Feasibility**: **NATIVE COMPATIBILITY**. Already deployed in `@cline/shared/src/mcp.ts`.

---

### 2.2 Iroh QUIC Decentralized P2P Networking
- **Repository URL**: `https://github.com/n0-computer/iroh`
- **Owner / Maintainer**: Number 0 Computer Inc.
- **License**: Apache 2.0 / MIT Dual License
- **Dependencies**: Rust, Tokio, Quinn (QUIC), Ed25519
- **Relevance**: Provides peer-to-peer, encrypted, NAT-traversing device synchronization without third-party cloud infrastructure.
- **Production Suitability**: **PRODUCTION READY**.
- **Feasibility**: **EXCELLENT**. Leverages OpenClaw's existing Rust bindings in `openclaw/crates/openclaw-iroh-node`.

---

### 2.3 Tree-Sitter Multi-Language Code Parsing
- **Repository URL**: `https://github.com/tree-sitter/tree-sitter`
- **Owner / Maintainer**: Tree-Sitter Team / GitHub
- **License**: MIT License
- **Dependencies**: C, WebAssembly / Node bindings
- **Relevance**: Fast, incremental AST parsing used by Cline for code definition indexing across 20+ programming languages.
- **Production Suitability**: **INDUSTRY BENCHMARK**.
- **Feasibility**: **ALREADY INTEGRATED** in `@cline/core`.

---

### 2.4 Google GenAI SDK (Multimodal Live & Gemini 2.0)
- **Repository URL**: `https://github.com/google-gemini/generative-ai-js` / `google-genai` Python SDK
- **Owner / Maintainer**: Google DeepMind
- **License**: Apache License 2.0
- **Dependencies**: WebSockets, Protocol Buffers / JSON
- **Relevance**: Directly powers 2,000,000 token context windows, Gemini Live bidirectional audio streaming, and Google Search grounding.
- **Production Suitability**: **PRODUCTION GRADE**.
- **Feasibility**: **DIRECT API INTEGRATION**.
