# OPEN-VERSE 2.0 — Enterprise Autonomous AI Agent Engine

**OPEN-VERSE 2.0** is the production-grade autonomous AI agent platform for the OPEN-VERSE ecosystem, adopted from the complete, unrestricted architecture of the upstream Hermes Agent (Nous Research).

---

## 1. Architectural Overview & Capabilities

OPEN-VERSE 2.0 is an enterprise-ready, self-improving autonomous agent system featuring:

- **Autonomous Agent Loop:** Continuous iterative problem-solving with tool calling, reasoning traces, self-correction, dynamic tool output pruning, and multi-turn conversational memory.
- **Universal Model Provider Hub:** Native support for Nous Portal, Anthropic Claude, OpenAI GPT-4o/o1/o3, Google Gemini, Kilo Code, OpenRouter, Groq, Mistral, Together AI, DeepSeek, AWS Bedrock, Google Vertex AI, and local model engines (llama.cpp, Ollama, vLLM).
- **50+ Built-In Toolsets:** Full terminal multiplexing (Bash/PowerShell), granular file operations with AST patching, headless browser automation (Playwright/Chromium), system diagnostics, computer use (GUI mouse/keyboard control), voice I/O, video generation, vision analysis, cron scheduling, and subagent orchestration.
- **Model Context Protocol (MCP):** Native MCP client supporting both Stdio and Server-Sent Events (SSE) transports for external service integration (GitLab, Notion, Blender, GitHub, Postgres, etc.).
- **Agent Control Protocol (ACP):** Bi-directional protocol for real-time IDE, GUI, and remote client communication over WebSocket and stdio.
- **Hierarchical Memory & Skill Engine:** SQLite WAL database persistence (`state.db`), vector embeddings, working memory, long-term memory, dynamic skill acquisition, and custom skill execution.
- **Multi-Interface Support:**
  - **Rich CLI / TUI:** Streaming terminal output, syntax highlighting, interactive tool approval, and session multiplexing (`hermes_cli/`).
  - **Desktop HUD:** Fast, low-latency Electron/React desktop client (`apps/desktop/`) with translucent overlay, voice wake-word triggers, and terminal embedding.
  - **Gateway Daemon:** Centralized daemon managing multi-client concurrency, platform messaging integrations (Telegram, WhatsApp, Discord, Slack, Signal), and MCP servers (`gateway/`).
  - **Web Dashboard:** Interactive browser dashboard served on port 9119 (`hermes_cli/web_server.py`, `web/`).
- **Resilient Automatic Updater:** Multi-channel update engine (`stable`, `beta`, `nightly`) with cryptographic signature checks, semantic version downgrade guards, and automatic rollback protection.

---

## 2. Directory Structure

```text
open-verse-2.0/
├── agent/                  # Core autonomous agent runtime, context management & reasoning engine
├── apps/
│   └── desktop/            # Native Electron + React HUD desktop application
├── gateway/                # Network daemon, HTTP/WebSocket gateway, ACP endpoints & platform bridges
├── hermes_cli/             # Rich terminal UI, command router, diagnostics & update client
├── scripts/                # Packaging, provisioning, Termux, and background automation scripts
├── tests/                  # Exhaustive pytest test suites covering tools, loops & configurations
├── tools/                  # 50+ built-in toolsets (browser, files, git, terminal, memory, etc.)
├── cli.py                  # Primary CLI entrypoint
├── pyproject.toml          # Python package definitions, entrypoint bindings & dependencies
└── docs/                   # Complete forensic architecture, parity matrix, and license documentation
    ├── COMPLETE-HERMES-ARCHITECTURE.md
    ├── HERMES-COMPLETE-ADOPTION-MATRIX.md
    ├── PLATFORM-INSTALLATION-MATRIX.md
    ├── UPDATE-SYSTEM-AUDIT.md
    ├── UPSTREAM-PROVENANCE-AND-LICENSES.md
    └── OPEN-VERSE-2.0-IMPLEMENTATION-REPORT.md
```

---

## 3. Quickstart & Installation

### Prerequisites
- **Operating System:** Windows 10/11 (64-bit), Linux (Ubuntu, Debian, Fedora, Arch, NixOS), or macOS (12+ Apple Silicon / Intel).
- **Python:** Python 3.11 to 3.14 (Hermes upstream packages a managed Python 3.14.9 runtime).
- **Node.js:** Node.js 20+ & pnpm (required only for building the Desktop HUD application).

### Installation

#### Windows (PowerShell)
```powershell
cd open-verse-2.0
.\setup-hermes.ps1 -RuntimeOnly
```

#### Linux & macOS (Bash)
```bash
cd open-verse-2.0
./setup-hermes.sh
```

---

## 4. Launching OPEN-VERSE 2.0

### CLI Commands

Launch via the standalone python entrypoint or installed console scripts:

```powershell
# Run the OPEN-VERSE CLI:
python cli.py

# Or use any registered console command:
openverse
openverse2
openverse-agent
hermes

# Run comprehensive system diagnostics:
openverse doctor

# Check agent status, models, gateway, and background jobs:
openverse status

# Start an interactive agent session with a specific model:
openverse --model nous/hermes-3-llama-3.1-405b --prompt "Analyze the workspace"

# List all 50+ active toolsets:
openverse --list_toolsets
```

### Starting the Gateway & Web Dashboard

```powershell
# Start the Gateway daemon in background:
openverse gateway start

# Launch the Web Dashboard (port 9119):
openverse dashboard
```

### Running the Desktop HUD Application

```powershell
cd apps/desktop
pnpm install
pnpm dev
```

---

## 5. Architectural Documentation

For deep technical details, forensic source comparisons, and platform deployment guides, refer to:

- [System Architecture](file:///c:/Users/nares/Workspace/OPEN-VERSE/OPEN-VERSE/open-verse-2.0/docs/COMPLETE-HERMES-ARCHITECTURE.md)
- [Capability & Adoption Matrix](file:///c:/Users/nares/Workspace/OPEN-VERSE/OPEN-VERSE/open-verse-2.0/docs/HERMES-COMPLETE-ADOPTION-MATRIX.md)
- [Platform & Device Installation Matrix](file:///c:/Users/nares/Workspace/OPEN-VERSE/OPEN-VERSE/open-verse-2.0/docs/PLATFORM-INSTALLATION-MATRIX.md)
- [Update System Forensic Audit](file:///c:/Users/nares/Workspace/OPEN-VERSE/OPEN-VERSE/open-verse-2.0/docs/UPDATE-SYSTEM-AUDIT.md)
- [Upstream Provenance & Licenses](file:///c:/Users/nares/Workspace/OPEN-VERSE/OPEN-VERSE/open-verse-2.0/docs/UPSTREAM-PROVENANCE-AND-LICENSES.md)
- [Implementation & Verification Report](file:///c:/Users/nares/Workspace/OPEN-VERSE/OPEN-VERSE/open-verse-2.0/docs/OPEN-VERSE-2.0-IMPLEMENTATION-REPORT.md)

---

## 6. Upstream Provenance & Licensing

OPEN-VERSE 2.0 adopts the full open-source Hermes Agent codebase originally created by **Nous Research**.
Full MIT licensing terms and copyright notices are preserved in [docs/UPSTREAM-PROVENANCE-AND-LICENSES.md](file:///c:/Users/nares/Workspace/OPEN-VERSE/OPEN-VERSE/open-verse-2.0/docs/UPSTREAM-PROVENANCE-AND-LICENSES.md).
