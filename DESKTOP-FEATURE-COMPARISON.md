# DESKTOP-APPLICATION FEATURE COMPARISON

**Scope:** Windows desktop applications of Cline, OpenCode, and OPEN-VERSE (NOT terminal/CLI).
**Sources:** docs.cline.bot/usage/cline-desktop.md; cline.bot/desktop (v0.0.49 Beta); opencode.ai/download; opencode.ai/docs; GitHub anomalyco/opencode `packages/app`; local OPEN-VERSE `desktop/`.
**Engine decision:** Cline v4.1.26 is OPEN-VERSE's existing coding-agent engine (Apache 2.0). OpenCode desktop capabilities are evaluated for integration, NOT a second runtime.

## 1. Application identity & packaging

| Capability | Cline Desktop | OpenCode Desktop | OPEN-VERSE Desktop (existing) |
|---|---|---|---|
| Distribution | Native installer (macOS/Windows/Linux); Windows in beta | Native installer (macOS/Windows/Linux); .deb/.rpm/AppImage | Tauri v2: Windows NSIS `.exe`, macOS `.dmg`, Linux `.deb`/RPM; Android APK |
| Standalone (no editor required) | Yes | Yes | Yes (Tauri shell) |
| Underlying UI tech | Native desktop (Cline agent harness) | SolidJS web frontend packaged as desktop app | Next.js webview in Tauri |
| Native host / backend | Cline agent core (local) | OpenCode server + SolidJS frontend | Bun sidecar + shared Cline Hub daemon |
| Version | v0.0.49 Beta | v2 (desktop) | `@cline/code` v0.2.3 |
| License | Apache 2.0 | MIT | Apache 2.0 |

## 2. Workspace & session model

| Capability | Cline Desktop | OpenCode Desktop | OPEN-VERSE Desktop | Integration assessment |
|---|---|---|---|---|
| Open a workspace folder | Yes | Yes | Yes | Present |
| Show workspace name + git branch | Yes | Yes | Partially | Present (partial UI) |
| Multiple sessions in parallel | Yes | Yes (sessions + tabs) | Yes (Hub multi-client) | Present |
| Session history (all sources) | Yes (desktop/CLI/extension/scheduled) | Yes | Yes (SQLite) | Present |
| Favorite / filter sessions by source | Yes (favorite, filter by source) | Yes | Partially | Gap: filter by source |
| Fork & edit (rewind to checkpoint, re-run) | Yes (fork session, rewind workspace) | Not confirmed | Partially (checkpoints exist, no fork UI) | Gap: fork/rewind UI |
| Session rename | Yes | Yes | Partially (backend exists, no UI) | Gap: rename UI |
| Session move | Not confirmed | Yes (`session_move` tool) | Not confirmed | Gap: investigate |
| Queued messages (edit/reorder/send/delete while working) | Yes | Not confirmed | No | Gap: queue UI |
| Checkpoints / undo-redo | Yes | Yes | Partially (checkpoints exist, no undo/redo UI) | Gap: undo/redo UI |
| Import sessions from other agents (Claude Code, Codex) | Yes (Import section in settings) | Not confirmed | Partially (adapters exist, no UI) | Gap: import UI |


## 3. Chat & interaction

| Capability | Cline Desktop | OpenCode Desktop | OPEN-VERSE Desktop | Integration assessment |
|---|---|---|---|---|
| Composer with prompt input | Yes | Yes | Yes | Present |
| Voice input (microphone in composer) | Yes (ElevenLabs/OpenAI transcription) | Not confirmed | Partially (voice-input settings exist) | Present (partial) |
| Plan / Act mode toggle | Yes | Yes (build/plan agents) | Yes | Present |
| Tool approval (human-in-the-loop) | Yes | Yes | Yes | Present |
| YOLO / auto-approve mode | Yes (Auto Approve & YOLO) | Yes | Yes | Present |

## 4. Models & providers

| Capability | Cline Desktop | OpenCode Desktop | OPEN-VERSE Desktop | Integration assessment |
|---|---|---|---|---|
| 300+ models via Cline provider | Yes | Via OpenCode Models catalog | Yes (Cline catalog) | Present |
| Bring-your-own API key | Yes | Yes | Yes | Present |
| ClinePass / paid subscription | Yes ($9.99/mo) | OpenCode Go ($10/mo), Console | Cline Cloud / ClinePass / ClineFree | Present |
| Free models (no account) | Yes (free models in app) | Yes (free models) | Yes (Ollama/LM Studio no key) | Present |
| Local models (Ollama, LM Studio) | Yes (Settings → Provider → Local; install/start/recommend; memory chip) | Yes (connect local models) | Yes (Ollama/LM Studio pull/load/unload/delete via sidecar) | Present |
| Switch models mid-project | Yes | Yes | Yes | Present |
| Custom OpenAI-compatible provider | Yes | Yes | Yes | Present |
| Provider settings UI | Yes (Settings → Provider) | Yes | Yes (provider-list-view, custom-view) | Present |

## 5. Extensions & integrations

| Capability | Cline Desktop | OpenCode Desktop | OPEN-VERSE Desktop | Integration assessment |
|---|---|---|---|---|
| MCP servers (list/add/remove) | Yes (Customize → Installed) | Yes (namespaced tools) | Yes (`mcp-view`, OAuth) | Present |
| MCP marketplace / discover | Yes (Marketplace: skills, MCP, plugins) | Yes (extensions) | Partially (marketplace-view) | Present (partial) |
| Plugins | Yes (Customize → Installed) | Yes (extensions) | Partially | Gap: plugin UI |
| Skills (task instructions) | Yes (Customize → Installed) | Yes (skills) | Partially (`.claude/skills` discovery) | Gap: skills UI |
| Rules / permissions / deny | Yes | Yes (permission/policy system) | Partially | Gap: rules UI |
| Hooks | Yes | Not confirmed | Partially | Gap: hooks UI |
| Extensions marketplace UI | Yes (Marketplace with category filters) | Yes (extensions) | Yes (marketplace-view) | Present |

## 6. Remote & local execution

| Capability | Cline Desktop | OpenCode Desktop | OPEN-VERSE Desktop | Integration assessment |
|---|---|---|---|---|
| Remote development over SSH | Yes (Settings → Remote; environment selector) | Not confirmed | Partially (remote-environments-view, remote-helper) | Present (partial) |
| Run agent on remote machine while app stays local | Yes | Not confirmed | Partially | Present (partial) |
| Background / scheduled execution | Yes (Schedule: specific time or recurring) | Not confirmed | Yes (scheduled routines) | Present |
| Scheduled tasks persist across restarts | Yes | Not confirmed | Yes | Present |
| Local file operations (read/write/edit) | Yes | Yes | Yes | Present |
| Terminal execution | Yes | Yes (shell tool) | Yes (terminal streamer) | Present |
| System tray / notifications | Not documented | Not documented | Yes (Tauri tray + notifications) | Present |
| Auto-updates (signed) | Yes (frequent beta builds) | Yes | Yes (Minisign + Tauri updater) | Present |

## 7. Capability presence summary

| Category | Cline Desktop | OpenCode Desktop | Already in OPEN-VERSE? | Gap to fill |
|---|---|---|---|---|
| Standalone desktop app | Yes | Yes | Yes | — |
| Workspace + git branch | Yes | Yes | Yes | — |
| Parallel sessions | Yes | Yes | Yes | — |
| Session history/favorites/filter | Yes | Yes | Partial | Filter by source |
| Fork & edit (checkpoint rewind) | Yes | No | Partial (checkpoints, no fork UI) | Fork/rewind UI |
| Session rename/move | Yes | Yes | Partial (rename backend, no UI) | Rename/move UI |
| Queued messages | Yes | No | No | Queue UI |
| Checkpoints / undo-redo | Yes | Yes | Partial | Undo/redo UI |
| Import from Claude Code/Codex | Yes | No | Partial (adapters exist, no UI) | Import UI |
| Plan/Act + approval | Yes | Yes | Yes | — |
| Built-in browser automation | No | Yes | No | OpenCode-only (evaluate) |
| Tabs | No | Yes | No | OpenCode-only (tabbed UI) |
| Voice input | Yes | No | Partial | — |
| 300+ models / BYOK / local models | Yes | Yes | Yes | — |
| MCP + marketplace | Yes | Yes | Yes | — |
| Plugins / skills / rules / hooks | Yes | Yes | Partial | Plugin/skills/rules UI |
| Remote SSH | Yes | No | Partial | — |
| Scheduled/background tasks | Yes | No | Yes | — |
| Auto-updates (signed) | Yes | Yes | Yes | — |

**Key finding:** Because OPEN-VERSE already embeds the Cline agent core via the sidecar→Hub contract, nearly all Cline Desktop capabilities already exist as backend implementations; the work is primarily **UI exposure** within the existing OPEN-VERSE shell. OpenCode's distinct desktop contributions are **built-in browser automation**, **tabs**, and a **pairing/connection model** — these are new capabilities to evaluate, not a second runtime.

| Markdown / code rendering | Yes | Yes | Yes | Present |
| Diff viewer for file changes | Yes | Yes (diffs) | Yes (changes-panel) | Present |
| Built-in browser automation | No | Yes (tabs, snapshots, click, Lighthouse, console/network/heap) | No | Gap: OpenCode-only |
| Tabs (multiple concurrent sessions) | No | Yes | No | Gap: OpenCode-only |

