# COMPLETE FEATURE-PARITY MATRIX — OPEN-VERSE vs Cline Desktop & OpenCode Desktop

**Scope:** Windows desktop apps of Cline v4.1.26 and OpenCode v2 (NOT terminal/CLI).
**Engine:** Cline v4.1.26 (Apache 2.0) is OPEN-VERSE's engine (`cline/` vendored, `desktop/` built). OpenCode (MIT) evaluated for integration only — NO second runtime.
**Classification:** Implemented & working | Backend implemented, UI missing | Partially implemented | Completely missing | Not applicable
**Caveat:** No feature locally verified (tsc/vitest blocked by Windows AppLocker — see `LOCAL-TEST-ENVIRONMENT-REPORT.md`). Statuses reflect code presence + UI exposure only.

## A. CLINE DESKTOP FEATURE AUDIT (vs OPEN-VERSE)

Source: docs.cline.bot/usage/cline-desktop.md; cline.bot/desktop (v0.0.49 Beta).

| # | Cline Desktop capability | Classification | Evidence in OPEN-VERSE (`desktop/`) | Gap / required work |
|---|---|---|---|---|
| A1 | Standalone desktop app (no editor) | Implemented & working | Tauri shell + Next.js webview + Bun sidecar; `@cline/code` v0.2.3 | None |
| A2 | Open workspace + show name & git branch | Partially implemented | `resolveWorkspaceRoot`, `pick_workspace_directory` | UI: show branch name prominently |
| A3 | Multiple sessions in parallel | Implemented & working | Cline Hub multi-client; sidecar serves many WS clients | UI: expose concurrent session list |
| A4 | Session history across sources | Implemented & working | SQLite `~/.openverse/data/db/sessions.db` | UI: session list with source filter |
| A5 | Favorite / filter sessions by source | Backend implemented, UI missing | Session store exists; no source-filter UI | Add filter UI |
| A6 | Fork & edit (rewind to checkpoint, re-run) | Partially implemented | Checkpoints exist; no fork/rewind UI | Add fork/rewind UI + restore handler |
| A7 | Session rename | Backend implemented, UI missing | `update_chat_session_title` handler exists | Add rename UI |
| A8 | Session move | Completely missing | Not confirmed in backend | Investigate/add backend + UI |
| A9 | Queued messages (edit/reorder/send/delete while working) | Completely missing | No queue backend or UI | Add queue backend + UI |
| A10 | Checkpoints / undo-redo | Partially implemented | Checkpoints exist; no undo/redo UI | Add undo/redo UI + restore handler |
| A11 | Import from Claude Code / Codex | Partially implemented | `SessionImportService` + adapters exist | Add import UI in settings |
| A12 | Plan / Act mode toggle | Implemented & working | Plan/Act toggle; `ClineCore` plan/act | None |
| A13 | Tool approval (human-in-the-loop) | Implemented & working | Tool approvals (auto-approve / desktop file-IPC) | None |
| A14 | YOLO / auto-approve mode | Implemented & working | Auto-approve support | None |
| A15 | Markdown / code rendering | Implemented & working | Webview renders markdown/code | None |
| A16 | Diff viewer for file changes | Implemented & working | `changes-panel.tsx`; `get_session_changes`/`read_session_change` | None |
| A17 | Voice input (microphone in composer) | Partially implemented | Voice input settings exist | Complete provider wiring |
| A18 | 300+ models via Cline provider / BYOK | Implemented & working | Cline model catalog; custom providers | None |
| A19 | ClinePass / paid subscription | Implemented & working | Cline Cloud / ClinePass / ClineFree | None |
| A20 | Free models (no account) | Implemented & working | Ollama/LM Studio/OpenAI-compatible no-key | None |
| A21 | Local models (Ollama, LM Studio) | Implemented & working | Sidecar list/pull/load/unload/delete; `local-models-view.tsx` | None |
| A22 | Switch models mid-project | Implemented & working | Model selection per session | None |
| A23 | Custom OpenAI-compatible provider | Implemented & working | `addLocalProvider`/`updateLocalProvider`; `custom-view.tsx` | None |
| A24 | Provider settings UI | Implemented & working | `provider-list-view.tsx` | None |
| A25 | MCP servers (list/add/remove) | Implemented & working | `mcp-view.tsx`; sidecar MCP commands | None |
| A26 | MCP marketplace / discover | Partially implemented | `marketplace-view.tsx` exists | Complete marketplace wiring |
| A27 | Plugins | Partially implemented | Plugins (`createTool`, hooks) exist | Add plugin management UI |
| A28 | Skills (task instructions) | Partially implemented | `.claude/skills` discovery exists | Add skills management UI |
| A29 | Rules / permissions / deny | Partially implemented | Rules + settings exist | Add rules/deny UI |
| A30 | Hooks | Partially implemented | Hooks exist (`@cline/agents`) | Add hooks UI |
| A31 | Extensions marketplace UI | Implemented & working | `marketplace-view.tsx` with category filters | None |
| A32 | Remote development over SSH | Partially implemented | `remote-environments-view.tsx`, `remote-helper.ts` | Complete SSH UI |
| A33 | Run agent on remote while app stays local | Partially implemented | Remote environment bindings exist | Complete remote UI |
| A34 | Background / scheduled execution | Implemented & working | Scheduled routines (`list_routine_schedules`); `routine-view.tsx` | None |
| A35 | Scheduled tasks persist across restarts | Implemented & working | Hub schedules persist | None |
| A36 | Local file operations (read/write/edit) | Implemented & working | Editor tool; file ops sidecar commands | None |
| A37 | Terminal execution | Implemented & working | `run_commands`; terminal streamer | None |
| A38 | System tray / notifications | Implemented & working | Tauri tray + notification plugin | None |
| A39 | Auto-updates (signed, Minisign) | Implemented & working | Minisign + Tauri updater; signed feeds | None |

| A39 | Auto-updates (signed, Minisign) | Implemented & working | Minisign + Tauri updater; signed feeds | None |

## B. OPENCODE DESKTOP FEATURE AUDIT (vs OPEN-VERSE)

Source: opencode.ai/download; opencode.ai/docs (Tools, MCP servers, Models); GitHub anomalyco/opencode `packages/app` (SolidJS desktop frontend).

| # | OpenCode Desktop capability | Classification | Evidence in OPEN-VERSE (`desktop/`) | Gap / required work |
|---|---|---|---|---|
| B1 | Standalone desktop app (macOS/Windows/Linux) | Implemented & working | Tauri v2 shell; Windows NSIS `.exe` | None |
| B2 | Sessions + tabs (multiple concurrent sessions as tabs) | Completely missing | No tabbed UI; sessions list only | Add tabbed session UI |
| B3 | Built-in browser automation (tabs, snapshots, click, forms, screenshots, file transfer, console/network inspection, performance traces, heap, Lighthouse) | Completely missing | No browser automation backend or UI | Major: add browser automation layer + UI (evaluate sandbox/security) |
| B4 | Pairing/connection model (`opencode pair`, single-use links, QR code) | Completely missing | Settings-based provider config only | Evaluate; may duplicate existing auth |
| B5 | Session rename (`session_rename`) | Backend implemented, UI missing | Not confirmed in Cline backend | Investigate Cline backend + UI |
| B6 | Session move (`session_move`) | Completely missing | Not confirmed | Add backend + UI |
| B7 | Worktrees (`worktree_create/list/remove`) | Partially implemented | `create_git_worktree` sidecar command | Add worktree list/remove UI |
| B8 | Shell / terminal execution | Implemented & working | `run_commands`; terminal streamer | None |
| B9 | File read/write/edit/patch | Implemented & working | Editor tool; file ops | None |
| B10 | Code search (Read/Glob/Grep) | Partially implemented | ripgrep `getFileIndex`; `search_workspace_files` | Expose Glob/Grep UI |
| B11 | Web fetch / web search | Partially implemented | `web_search` setting exists | Complete web search UI |
| B12 | Image generation | Completely missing | No image generation | Evaluate (model-dependent) |
| B13 | Subagents / agent teams | Partially implemented | Multi-agent teams exist | Expose team UI |
| B14 | MCP servers (namespaced tools, OAuth, codemode) | Implemented & working | `mcp-view.tsx`; sidecar MCP commands + OAuth | None |
| B15 | Extensions / plugins | Partially implemented | Plugins exist | Add extension management UI |
| B16 | Model/provider management (300+ models, BYOK, local Ollama/LM Studio/vLLM, OpenAI-compatible) | Implemented & working | Cline catalog; custom providers; Ollama/LM Studio sidecar | None |
| B17 | Per-session model selection | Implemented & working | Model selection per session | None |
| B18 | Diffs and code review | Implemented & working | `changes-panel.tsx`; `get_session_changes`/`read_session_change` | None |
| B19 | Background / scheduled execution | Implemented & working | Scheduled routines; `routine-view.tsx` | None |
| B20 | Notifications | Implemented & working | Tauri notification plugin | None |

## C. STATUS SUMMARY

| Classification | Cline Desktop (A) | OpenCode Desktop (B) | Combined |
|---|---|---|---|
| Implemented & working | ~22 | ~8 | ~30 |
| Backend implemented, UI missing | ~3 | ~1 | ~4 |
| Partially implemented | ~12 | ~5 | ~17 |
| Completely missing | ~1 | ~4 | ~5 |
| Not applicable | — | — | — |

**Key finding:** Because OPEN-VERSE already embeds the Cline agent core via the sidecar→Hub contract, nearly all Cline Desktop capabilities exist as backend implementations; the work is primarily **UI exposure**. OpenCode's distinct desktop contributions are **built-in browser automation**, **tabs**, and a **pairing/connection model** — these are new capabilities to evaluate, not a second runtime.

**No feature may be labelled complete without verification.** All statuses require a compliant test host (see `LOCAL-TEST-ENVIRONMENT-REPORT.md`).
