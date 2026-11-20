# OPEN-VERSE Upstream Sources Directory (`sources/`)

This directory houses all external, upstream, and reusable source projects integrated into or referenced by the **OPEN-VERSE** unified AI platform.

Each project is maintained in its original source tree with its original licensing, copyright notices, git history, and documentation preserved. Upstream projects are isolated from the core OPEN-VERSE application codebase (`open-verse/`).

---

## Source Inventory & Provenance

| Directory | Project Name | Upstream Repository | Reference Commit / Version | License | Primary Architectural Role in OPEN-VERSE |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `cline/` | **Cline** | `https://github.com/naresh-cn2/cline.git`<br>(upstream `https://github.com/cline/cline.git`) | `524967090` (v0.2.x) | **Apache-2.0** | Proven desktop application foundation, Tauri runtime integration, sidecar execution engine, MCP client, and local process management. |
| `hermes-agent/` | **Hermes Agent** | `https://github.com/NousResearch/hermes-agent.git` | `31ce88f8` (v1.0.0) | **MIT** | Headless LSP client, on-device acoustic wake-word engine, bidirectional live voice streaming adapter, episodic memory, and OS keyring security vaults. |
| `openclaw/` | **OpenClaw** | `https://github.com/openclaw/openclaw.git`<br>`https://github.com/naresh-cn2/openclaw.git` | `7ce2d10ec` (v0.1.x) | **Apache-2.0** | Multi-agent swarm orchestration, subagent dynamic spawning, shared canvas workboards, decentralized P2P encrypted device sync (Iroh), and network firewall policy. |
| `opencode/` | **OpenCode** | `https://github.com/anomalyco/opencode.git` | `88ca792` (v0.1.x) | **MIT** | AST-level code intelligence, semantic symbol indexing, resilient watching session management, and syntax-aware diff application (`patchmark`). |

---

## Structural Guidelines

1. **Isolation**: Code within `sources/` represents third-party or upstream base repositories. Do not modify upstream source files unless maintaining an explicit vendor patch.
2. **Licensing Compliance**: All upstream licenses (Apache-2.0, MIT) allow commercial and non-commercial reuse, modification, and redistribution with attribution. Never remove `LICENSE` or notice files from upstream trees.
3. **Integration Pattern**: OPEN-VERSE applications located in `open-verse/` ingest upstream capabilities through modular TypeScript/Rust adapters, sidecar bridge layers, or npm/bun workspace dependencies.
4. **Independent Building**: Each project in `sources/` retains its native configuration (`package.json`, `Cargo.toml`, etc.) and can be built, inspected, or tested independently.
