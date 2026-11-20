# OPEN-VERSE 2.0 — The Complete Self-Improving Autonomous AI Agent

**OPEN-VERSE 2.0** is the next-generation autonomous AI agent engine for the OPEN-VERSE ecosystem, powered by the full, unrestricted architecture of the upstream Hermes Agent.

---

## Highlights & Capabilities

- **Autonomous Agent Loop:** Continuous iterative problem-solving with tool calling, self-correction, reasoning steps, and real-time execution feedback.
- **50+ Integrated Toolsets:** Native support for coding, bash/powershell terminals, file operations, web browsing with headless browser orchestration, computer use (mouse/keyboard), system monitoring, voice/audio I/O, video generation, vision analysis, kanban planning, cron scheduling, and subagent delegation.
- **Universal Provider Engine:** First-class native support for Anthropic Claude, OpenAI, Google Gemini, Nous Research / Hermes models, local llama.cpp / vLLM, and any OpenAI-compatible API endpoint.
- **Model Context Protocol (MCP) Client:** Standardized protocol connecting the agent to local and remote MCP servers and external services seamlessly.
- **Hierarchical Memory & Skill System:** Long-term memory storage, contextual recall, dynamic skill acquisition, and custom skill execution.
- **Multi-Interface Architecture:**
  - **CLI / TUI:** Rich terminal interface featuring streaming output, interactive tool approval, and shell multiplexing.
  - **Desktop HUD:** Fast, low-latency Electron/React desktop client (`apps/desktop/`) with translucent overlay mode, voice wake-word triggers, and terminal embedding.
  - **ACP / Gateway Server:** HTTP, WebSocket, and ACP (Agent Control Protocol) endpoints for external integrations and frontend clients.

---

## Quickstart

### 1. Requirements
- Windows 10/11, macOS, or Linux
- Python 3.11+ (recommended: installed via `setup-hermes.ps1` or `setup-hermes.sh`)
- Node.js 20+ & pnpm (for desktop application)

### 2. Installation & Setup

On Windows:
```powershell
cd open-verse-2.0
.\setup-hermes.ps1 -RuntimeOnly
```

On Linux/macOS:
```bash
cd open-verse-2.0
./setup-hermes.sh
```

### 3. Running the Agent

Launch the CLI with OPEN-VERSE scripts:
```powershell
# Using the OpenVerse CLI entrypoint:
python cli.py

# Or via installed console script:
openverse

# List all available toolsets:
openverse --list_toolsets

# Start with a specific model and prompt:
openverse --model anthropic/claude-3-7-sonnet --prompt "Audit the repository structure"
```

### 4. Running the Desktop Application

```powershell
cd apps/desktop
pnpm install
pnpm dev
```

---

## Directory Structure

```text
open-verse-2.0/
├── agent/                  # Core agent loop, memory, context management & reasoning engine
├── apps/
│   └── desktop/            # Native Electron + React HUD desktop application
├── gateway/                # Network server, HTTP/WebSocket gateway & ACP endpoints
├── hermes_cli/             # Rich terminal UI, streaming handlers, banners & renderers
├── scripts/                # Packaging, provisioning & background automation scripts
├── tests/                  # Exhaustive pytest test suites covering tools, loops & configs
├── tools/                  # 50+ built-in toolsets (browser, files, git, terminal, memory, etc.)
├── cli.py                  # Primary CLI entrypoint
├── pyproject.toml          # Python package definitions, entrypoint bindings & dependencies
└── docs/                   # Full architecture, parity matrix, and license documentation
```

---

## Licenses & Upstream Attribution

OPEN-VERSE 2.0 is based upon the open-source Hermes Agent developed by **Nous Research**.
Full MIT attribution and licensing details are maintained in [docs/UPSTREAM-LICENSES.md](file:///c:/Users/nares/Workspace/OPEN-VERSE/OPEN-VERSE/open-verse-2.0/docs/UPSTREAM-LICENSES.md).
