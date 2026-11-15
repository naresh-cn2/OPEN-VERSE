# UNIFIED ARCHITECTURE — MULTI-CHAT ORCHESTRATION & MODEL INTELLIGENCE

**Goal:** Transform OPEN-VERSE into a unified advanced AI desktop development environment combining applicable Cline Desktop + OpenCode Desktop capabilities, while preserving the existing OPEN-VERSE product.
**Constraint:** No second runtime, no duplicate database, no UI redesign, no replacement of existing components, no deployment/release.
**Existing architecture (preserved):** Tauri v2 Rust shell + Next.js webview (:3125) → Bun sidecar → shared Cline Hub daemon → `@cline/core` agent runtime → SQLite sessions at `~/.openverse/data/db/sessions.db`.

---

## 1. MULTI-CHAT & CONCURRENT TASK EXECUTION

### 1.1 Design requirements
- 10+ independent conversations, each with its own context, workspace, model, and lifecycle.
- Different coding tasks running simultaneously.
- Background execution when switching conversations (agent keeps running; UI can switch tabs).
- Independent context and workspace management per conversation.
- Per-conversation model selection.
- Pause, resume, cancel, retry, and task queues.
- Live task status and notifications.
- Recovery after application restart (persisted queue + session state).
- Resource-aware concurrency and process management.
- Protection against simultaneous file conflicts.

### 1.2 Backend architecture (extends existing Cline Hub)

The existing Cline Hub already supports multi-client sessions via `@cline/core` with `backendMode: "hub"`. We extend it with an **orchestration layer** in the Bun sidecar:

```
Webview UI (Next.js) --WS JSON-RPC--> Sidecar Command Router
                                          |
                                          v
                    +---------------------+---------------------+
                    |      Orchestration Layer (new)            |
                    |  - Task Queue (persisted, priority/FIFO)  |
                    |  - Concurrency Controller (resource-aware)|
                    |  - Session Router (per-conversation ctx)  |
                    |  - File Conflict Guard (workspace lock)   |
                    +---------------------+---------------------+
                                          |
                                          v
                    Cline Hub (existing) --> @cline/core per session
                                          |
                                          v
                                  SQLite: sessions + task queue state
```

#### Components
1. **Task Queue (persisted):** SQLite table `task_queue` (id, sessionId, prompt, status: queued/running/paused/cancelled/failed/retrying, priority, createdAt, startedAt, endedAt, exitCode, error, model, workspace). Survives restart.
2. **Concurrency Controller:** Limits active agent runs (default: number of CPU cores or configurable, e.g., 4). Queues excess. Tracks per-session CPU/memory via process resource usage.
3. **Session Router:** Maps each conversation to a `@cline/core` session with isolated context (messages, compaction state, checkpoints). Per-conversation model stored in session config.
4. **File Conflict Guard:** Per-workspace file lock registry. Before a file edit tool runs, acquire a short-lived lock; reject/queue conflicting edits from other concurrent sessions touching the same file. Prevents simultaneous file corruption.
5. **Status Broadcaster:** WebSocket events (`task_status`, `task_progress`, `task_notification`) pushed to UI for live status and notifications.

#### Lifecycle
- User starts a task → enqueued → assigned to free concurrency slot → `@cline/core.start()` → streamed via existing `subscribe(event)` → status broadcast.

## 2. MODEL INTELLIGENCE SYSTEM

### 2.1 Design requirements
On model hover, show accurate, sourced, regularly-updated metadata:
- Image input / image generation
- Audio input / output
- Voice and speech capabilities
- Video support
- Tool / function calling
- Reasoning capabilities
- Context window (max input tokens)
- Maximum output tokens
- Structured output
- Provider and model information
- Pricing where available
- Local/cloud availability
- Known limitations

Distinguish three layers:
- **Model capabilities** (what the model can do: vision, tools, reasoning, output modalities) — sourced from model catalog (models.dev / Cline catalog) + provider metadata.
- **Provider capabilities** (auth, rate limits, endpoints, regional availability) — from provider config.
- **OPEN-VERSE integration capabilities** (whether OPEN-VERSE can surface the feature in UI: e.g., image attachment, audio playback, tool approval) — from feature flags.

### 2.2 Architecture
```
Model Catalog (models.dev / Cline catalog, refreshed in background)
      |
      v
Capability Store (SQLite + in-memory cache; versioned catalog snapshot)
      |
      v
Capability Resolver (merges model + provider + integration layers)
      |
      v
UI: model hover tooltip / model selector chips (Next.js webview)
```

#### Components
1. **Catalog Fetcher (background):** Periodically refreshes model catalog from upstream (models.dev for OpenCode-style; Cline's bundled catalog for Cline provider). Respects offline mode (bundled catalog fallback). Versioned snapshots to detect changes.
2. **Capability Store:** SQLite table `model_capabilities` (modelId, providerId, capabilities JSON, contextWindow, maxOutputTokens, pricing, local/cloud, limitations, lastRefreshed, source, confidence). In-memory LRU cache for hover lookups.
3. **Capability Resolver:** Given a `provider/model` selector, returns merged capability object with three sub-objects: `model`, `provider`, `integration`. Flags unknown/uncertain fields with `confidence` and `source`.
4. **UI Tooltip:** Next.js component triggered on model hover; renders capability chips (vision, tools, audio, etc.) with confidence badges and "source" attribution. Does not redesign existing model selector — adds a hover layer.

### 2.3 Data sources & freshness
- Primary: models.dev catalog (OpenCode-style) + Cline's bundled model catalog.
- Provider metadata: provider config (auth requirements, endpoints).
- Integration capabilities: OPEN-VERSE feature flags (e.g., image attachment support).
- Refresh: background refresh on app start + periodic (e.g., every 24h); offline fallback to last-known snapshot.
- Mark fields as `sourced` (from catalog) vs `computed` (derived) vs `unknown`; never fabricate capabilities.

### 2.4 Dependencies & files
- New: `sidecar/model-catalog.ts`, `sidecar/capability-store.ts`, `sidecar/capability-resolver.ts`, `webview/components/ui/model-capability-tooltip.tsx`.
- Existing: `@cline/llms` (model catalog), `@cline/shared` (settings), SQLite.

## 3. UNIFIED ARCHITECTURE & PRESERVATION PRINCIPLES

### 3.1 What is preserved (unchanged)
- OPEN-VERSE interface, design system, navigation, layouts, themes, branding.
- Existing routes and navigation.
- Existing Cline integration (sidecar → Hub → `@cline/core`).
- Existing authentication and account isolation.
- Existing provider integrations (Anthropic, OpenAI, Gemini, OpenRouter, Bedrock, Vertex, Cerebras, Groq, Ollama, LM Studio, OpenAI-compatible, Vercel AI Gateway, Cline OAuth).
- Existing updater and cross-platform functionality (Minisign + Tauri; Android PackageInstaller).
- Existing settings/conversations persist intact.

### 3.2 What is added (incremental, no duplication)
- Multi-chat orchestration layer (task queue, concurrency controller, file conflict guard, status broadcaster) — lives in the Bun sidecar; reuses Cline Hub.
- Model intelligence layer (catalog fetcher, capability store, resolver, UI tooltip) — reuses `@cline/llms` catalog + SQLite.
- OpenCode desktop features evaluated individually: browser automation (new tool category + sandbox), tabs (UI-only over existing sessions), pairing (evaluate vs existing auth).
- UI exposure for Cline Desktop gaps (session rename, worktree list/remove, undo/redo, fork/rewind, import, queue, plugin/skills/rules/hooks, branches/diffs).

### 3.3 No duplicate runtimes / databases / dependencies
- Single coding-agent runtime: Cline Hub (`@cline/core`). OpenCode is NOT added as a second engine.
- Single database: existing SQLite at `~/.openverse/data/db/sessions.db` (new tables only: `task_queue`, `model_capabilities`, file-lock registry).
- Single configuration system: existing settings JSON (`providers.json`, global settings). OpenCode's `opencode.jsonc` is NOT adopted.
- No new package manager or build system beyond existing Bun/Tauri.

### 3.4 OpenCode desktop-specific integrations (evaluate only)
| Capability | Assessment |
|---|---|
| Built-in browser automation | New capability; requires browser automation layer (e.g., embedded Playwright-like) inside sidecar or as a sandboxed tool category. Security sandbox required. Evaluate scope before implementation. |
| Session tabs | UI-only; tab component over existing multi-session Hub + session router. Reuse existing sessions. |
| Pairing/connection model | Evaluate vs existing settings-based provider config + Cline OAuth. May duplicate; adopt only if it adds clear value. |
| Diffs and code review | Already present (`changes-panel.tsx`, `get_session_changes`/`read_session_change`). |
| Extensions | Already present (plugins + marketplace UI partially). |

### 3.5 Communication & protocol (unchanged)
- Webview ↔ sidecar: JSON-RPC over WebSocket on dynamic loopback port (`127.0.0.1:3125` fallback). New commands: queue/pause/resume/cancel/retry, capability lookup.
- Sidecar ↔ Hub: existing Hub client protocol; discovery via lockfiles.
- Sidecar ↔ model providers: existing direct HTTPS.


- User switches conversation → UI unsubscribes from current WS stream; agent keeps running in background (Hub retains session).
- Pause/resume/cancel → sidecar sends control to `@cline/core` (or signals the agent process); status updated in SQLite.
- Retry → failed tasks re-queued with backoff; max retry count configurable.
- Restart recovery → on sidecar startup, reconcile `task_queue` + SQLite sessions; resume queued/running tasks; notify UI.

### 1.3 UI integration (preserve existing UI)
- Add a **task bar / side panel** (not a redesign) showing active/queued tasks with status chips, pause/resume/cancel controls.
- Conversation list gains a status indicator (running/queued/idle).
- Existing chat view unchanged; subscribes to the session's WS stream when active.

### 1.4 Dependencies & files
- New: `sidecar/task-queue.ts`, `sidecar/concurrency-controller.ts`, `sidecar/file-conflict-guard.ts`, `sidecar/status-broadcaster.ts`.
- Existing: `sidecar/commands.ts` (add queue/pause/resume/cancel commands), `sidecar/chat-session.ts`, `sidecar/server.ts`, `@cline/core`, SQLite.
- No new runtime; all within Bun sidecar process.
