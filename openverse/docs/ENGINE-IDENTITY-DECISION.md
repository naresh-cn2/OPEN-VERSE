# ENGINE IDENTITY DECISION — OPEN-VERSE Coding-Agent Runtime

**Status:** Decision required by product owner. No code changes made; no engine silently selected.

## 1. Executive summary

The mission asks to integrate "the complete feature set of the official OpenCode project." The repository currently vendors **Cline** (github.com/cline/cline, v4.1.26) under `cline/` and builds a near-duplicate under `desktop/`. The official **OpenCode** project is github.com/anomalyco/opencode — separate and unrelated (MIT license, ~22.7k stars, V2 CLI/Desktop/Web/Docker).

**Cline and OpenCode are not interchangeable.** They differ in license, architecture, provider catalog, tool set, and runtime model. Choosing one is a product decision. This document presents the evidence.

## 2. Side-by-side comparison

| Dimension | Official OpenCode | Vendored Cline v4.1.26 |
|---|---|---|
| License | MIT | Apache 2.0 |
| Version tracked | N/A (not vendored) | v4.1.26 (cline/CHANGELOG.md) |
| Surfaces | CLI `opencode`, Desktop (BETA), Web, Docker | CLI `cline`, VS Code ext, JetBrains, SDK, Desktop app |
| Packaging | Native binary per platform; brew; install script | Bun monorepo; SDK `@cline/*`; Hub daemon; Tauri + Bun sidecar |
| Agents/modes | `build` (full), `plan` (read-only), subagent `@general` | Plan / Act; multi-agent teams; scheduled routines |
| Sessions | `session_rename`, `session_move` tools | SQLite `~/.openverse/data/db/sessions.db`, checkpoints, cloud sessions |
| Git/worktrees | `worktree_create/list/remove` tools | Git branches/checkout; `create_git_worktree` sidecar command |
| Code search | Read, Glob, Grep tools | ripgrep `search_workspace_files` / `getFileIndex` |
| Terminal | Shell tool | `run_commands` / terminal execution |
| File edit | Read, Edit, Write, Patch | editor tool (str_replace), file ops |
| Browser automation | Built-in Browser namespace (tabs, snapshots, click, Lighthouse, console/network/perf/heap) | Not present |
| MCP | Namespaced tools; `<server>_<tool>` permission; `codemode: false` | list/authorize/upsert/delete MCP, MCP OAuth |
| LSP | LSP Servers (V1 configure menu) | Not confirmed present |
| Plugins/skills | Plugins; Skills | Plugins; Skills (`.claude/skills`) |
| Local/free models | Ollama, LM Studio, OpenAI-compatible | Ollama, LM Studio, OpenAI-compatible; pull/load/unload via sidecar |
| Paid options | OpenCode Go ($10/mo), Console | Cline Cloud / ClinePass / ClineFree |
| Providers catalog | models.dev catalog; custom OpenAI-compatible | Cline catalog (Anthropic, OpenAI, Gemini, OpenRouter, Bedrock, Vertex, Cerebras, Groq, ...) |
| Desktop app | BETA macOS/Win/Linux, incl. Browser automation | Tauri v2 + Next.js webview + Bun sidecar (`@cline/code` v0.2.3) |
| Auth | `/connect` per provider; ChatGPT sign-in | `cline auth` OAuth; API keys; refresh-aware tokens |
| Approval | Permission/policy; deny rules; tool approval prompts | Auto-approve or desktop file-IPC approval |
| Telemetry | Not detailed | PostHog + OTLP/Langfuse; opt-out; build-time selfcheck |

## 3. Architecture/runtime differences

**OpenCode:** Single native `opencode` binary per platform; CLI primary; Desktop app separate BETA. Self-contained (no Bun/Node at install). Providers are `@opencode/ai/providers/*` packages; config in `opencode.jsonc`.

**Cline:** Bun monorepo. `@cline/core` (`ClineCore`) is the agent runtime; shared **Hub daemon** (`@cline/cline-hub`) auto-spawned and reused across clients. OPEN-VERSE desktop = Tauri v2 Rust shell + Next.js webview + Bun sidecar adapting webview/native ops to the Hub. Sessions/settings under `~/.openverse`.

Not drop-in replacements. Moving to OpenCode means replacing the sidecar↔Hub contract, `@cline/*` SDK imports, settings/session storage, and the Tauri sidecar backend.

## 4. License implications

- OPEN-VERSE is Apache 2.0 (root `LICENSE`). `NOTICE.md` attributes Cline (Apache 2.0, Cline Bot Inc.).
- OpenCode is MIT. Using OpenCode source requires preserving its MIT license/copyright notice alongside existing Apache 2.0 + Cline attribution.
- Both permissive; coexistence legally feasible, but notices must be preserved per code used. Update `NOTICE.md` before commingling.

## 5. Integration complexity

**Keeping Cline (status quo extension):** Lowest complexity. Cline powers `@cline/code` v0.2.3 under `desktop/` with a working sidecar↔Hub contract, provider catalog, MCP, checkpoints, teams, schedules, local-model management. Close gaps by exposing Cline capabilities through the OPEN-VERSE UI and adding missing pieces (browser automation, worktree-as-tool, LSP if absent).

**Adopting OpenCode:** High complexity. Replace `@cline/core`/Hub with OpenCode binary/runtime; rewrite sidecar and webview transport; redo provider/settings UI, session persistence, all platform builds. Introduces a second license + second runtime (violates "no duplicate runtimes") unless Cline is fully removed.

## 6. Could both coexist safely?

Technically yes, but it violates Requirement 4 ("no duplicate engines, runtimes, registries or configuration systems"). A Cline Hub plus an OpenCode server would duplicate agent execution, tool registries, settings, and session stores. **Coexistence not recommended.** One engine should be the primary coding runtime.

## 7. Recommendation (requires product-owner approval)

- **Primary coding runtime:** Keep **Cline v4.1.26** (already integrated, built, Apache 2.0 consistent with OPEN-VERSE). Close gaps against OpenCode by exposing/adding Cline features where they map; document OpenCode-only capabilities (e.g., browser automation) as evaluated limitations.
- **OpenCode:** Do NOT vendor a second engine. Treat OpenCode as the reference feature list for the parity matrix; adopt individual capabilities (worktrees-as-tool, browser automation, session namespace) into the Cline-based implementation only where they fit and are approved.

**No engine silently selected in code. Awaiting product-owner confirmation before implementation.**
