# IMPLEMENTATION ROADMAP — OPEN-VERSE Unified AI Desktop Development Environment

**Engine:** Cline v4.1.26 (Apache 2.0). No OpenCode runtime. OpenCode desktop capabilities integrated individually.
**Constraint:** No UI redesign, no second runtime, no duplicate database, no code deletion/overwrite, no deployment/release, no changes to auth/auto-update unless separately tested.
**Verification:** No feature labelled complete without verification on a compliant test host (see `LOCAL-TEST-ENVIRONMENT-REPORT.md`).

## PHASE 0 — FOUNDATION & TEST ENVIRONMENT (prerequisite)

| Step | Action | Dependencies | Acceptance criteria |
|---|---|---|---|
| 0.1 | Secure compliant test environment (non-blocked host or CI) for `bun run build:sdk` + vitest | IT/AppLocker exclusion OR clean dev host OR GitHub Actions | `tsc.exe`/`vitest.exe` run without AppLocker block |
| 0.2 | Baseline `bun run build:sdk` on compliant host | `desktop/node_modules` installed | All six SDK `dist/` build (`shared`, `llms`, `agents`, `core`, `sdk`, `ui`) |
| 0.3 | Baseline SDK unit tests | Build succeeded | `@cline/core`, `@cline/cli`, `@cline/cline-hub` unit tests pass |
| 0.4 | Baseline e2e suites | Build + unit tests | `tests/e2e-*` run; document any pre-existing failures |
| 0.5 | UI regression baseline | Existing webview build | Existing routes/navigation/settings/conversations unchanged |

Exit gate: All Phase 0 steps pass before any feature work begins.

## PHASE 1 — MULTI-CHAT ORCHESTRATION (core new capability)

### Stage 1A — Task queue + concurrency controller
**Files/modules:** NEW `sidecar/task-queue.ts`, `sidecar/concurrency-controller.ts`; modify `sidecar/commands.ts` (`enqueue_task`, `list_tasks`, `task_status`); SQLite `task_queue` table.
**Dependencies:** Existing SQLite session store; existing sidecar command router.
**Acceptance criteria:** Tasks enqueue; run up to concurrency limit; excess queued; status persisted across sidecar restart.
**Testing:** Unit: enqueue > concurrency limit → queued; restart → queue persisted. Integration: 10+ concurrent sessions each run.

### Stage 1B — Pause/resume/cancel/retry + live status
**Files/modules:** NEW `sidecar/status-broadcaster.ts`; modify `sidecar/chat-session.ts` (pause/resume/cancel/retry commands); WS events `task_status`, `task_notification`.
**Dependencies:** Stage 1A; existing `subscribe(event)` stream.
**Acceptance criteria:** Pause/resume/cancel change task status; retry re-queues failed with backoff; UI receives live status events.
**Testing:** Unit: status transitions. Integration: cancel mid-turn stops agent; retry after failure succeeds.

### Stage 1C — File conflict guard + per-conversation model
**Files/modules:** NEW `sidecar/file-conflict-guard.ts`; modify `sidecar/commands.ts` (workspace lock acquire/release); session config stores per-conversation model.
**Dependencies:** Existing editor/file-ops tools; existing per-session model selection.
**Acceptance criteria:** Concurrent edits to same file serialized/rejected with clear error; each conversation uses its own model.
**Testing:** Integration: two sessions editing same file → one blocked; model switch in one session doesn't affect another.

### Stage 1D — Restart recovery + UI task panel
**Files/modules:** Modify `sidecar/index.ts` startup reconciliation; NEW `webview/components/views/sessions/task-panel.tsx` (task bar/side panel).
**Dependencies:** Stages 1A–1C; existing sessions view.
**Acceptance criteria:** On restart, queued/running tasks reconciled and resumed; task panel shows status chips + controls; existing chat view unchanged.
**Testing:** Integration: kill sidecar mid-task → restart → tasks resume. UI regression: existing routes/nav/settings unchanged.

**Phase 1 exit gate:** Multi-chat orchestration passes unit + integration + UI regression on compliant host.

## PHASE 2 — MODEL INTELLIGENCE SYSTEM

### Stage 2A — Catalog fetcher + capability store
**Files/modules:** NEW `sidecar/model-catalog.ts`, `sidecar/capability-store.ts`; SQLite `model_capabilities` table.
**Dependencies:** `@cline/llms` catalog; existing settings.
**Acceptance criteria:** Catalog refreshes on start + periodically; offline fallback to snapshot; capability rows stored with source/confidence.
**Testing:** Unit: catalog fetch + store. Offline: uses last snapshot. Refresh detects catalog changes.

### Stage 2B — Capability resolver + UI tooltip
**Files/modules:** NEW `sidecar/capability-resolver.ts`; NEW `webview/components/ui/model-capability-tooltip.tsx`; modify `webview/components/views/settings/provider-list-view.tsx` (hover trigger).
**Dependencies:** Stage 2A; existing model selector.
**Acceptance criteria:** Hover over model shows capability chips (vision/tools/audio/video/reasoning/context/output/structured/pricing/local-cloud/limitations) with source attribution; no fabricated fields.
**Testing:** Unit: resolver merges model/provider/integration layers. UI: tooltip renders without breaking existing model selector.

**Phase 2 exit gate:** Model intelligence passes unit + UI regression; no feature claimed without verification.

## PHASE 3 — CLINE DESKTOP FEATURE COMPLETION (UI exposure)

Each stage: confirm backend → add UI → add regression test → verify.

| Stage | Capability | Backend evidence | UI to add | Priority |
|---|---|---|---|---|
| 3A | Session rename | `update_chat_session_title` | Rename control in sessions view | High |
| 3B | Worktree list/remove | `create_git_worktree` (create only) | Add list + remove UI | High |
| 3C | Undo/redo (checkpoints) | `read_session_checkpoint_history` | Undo/redo UI in chat/session view | High |
| 3D | Session move | Investigate (missing) | Move UI if backend added | High |
| 3E | Session filter by source | Session store exists | Filter sidebar by source | Medium |
| 3F | Fork & edit (checkpoint rewind) | Checkpoints exist | Fork/rewind UI + restore handler | Medium |
| 3G | Import from Claude Code/Codex | `SessionImportService` + adapters | Import UI in settings | Medium |
| 3H | Queued messages | Missing | Queue backend + UI | Medium |
| 3I | Plugin/skills/rules/hooks UI | Exist in `@cline/agents` | Customize/Installed view | Medium |
| 3J | Git branches/diffs viewer | Exist sidecar commands | Expose branch/diff UI | Medium |

For each stage: dependencies = existing backend command + existing settings view pattern; acceptance = feature exposed in UI + regression test passes; testing = unit + integration on compliant host.


## PHASE 4 — OPENCODE DESKTOP INTEGRATION (evaluate only)

| Capability | Assessment | Decision needed |
|---|---|---|
| Built-in browser automation | New tool category + sandbox | Approve scope before implementation |
| Session tabs | UI-only over existing sessions | Approve UI addition |
| Pairing/connection model | May duplicate existing auth | Approve or decline |
| Diffs/code review, extensions | Already present | None needed |

No OpenCode runtime added. No feature implemented without separate approval.

## PHASE 5 — CONSOLIDATION & FULL REGRESSION

| Step | Action | Acceptance criteria |
|---|---|---|
| 5.1 | Full `bun run build:sdk` | All six SDK packages build |
| 5.2 | Full unit + integration + e2e suites | All pass on compliant host |
| 5.3 | UI regression (visual/screenshot) | Existing routes/nav/settings/conversations/branding unchanged |
| 5.4 | Security & permission audit | File conflict guard, tool approval, MCP OAuth intact |
| 5.5 | Cross-platform build check | Windows NSIS + Tauri config unchanged; document platform limits |

**Final gate:** Complete feature-parity matrix updated with verified statuses; limitations documented.

## TESTING STRATEGY (Windows AppLocker restriction)

**Problem:** `tsc.exe`/`vitest.exe` under `node_modules/.bin/` blocked by Windows AppLocker on this host. Do NOT bypass security policy.

**Approved alternatives (use one):**
- **Option A (recommended):** Non-blocked dev host — clone repo, `cd desktop && bun install && bun run build:sdk && bun run test`.
- **Option B:** Request IT/AppLocker exclusion for repo `node_modules/.bin`, then run locally.
- **Option C (CI):** GitHub Actions (`ubuntu-latest` + `oven-sh/setup-bun`) runs `build:sdk`, `test`, e2e suites — not subject to this host's AppLocker.
- **Option D (experimental, unconfirmed):** `bun <vitest entry>.js` may bypass `.exe` wrapper block; does NOT fix `tsc.exe` declaration builds.

**Verification strategy:** All feature acceptance criteria require tests run on a compliant host (A, B, or C). Source-code presence alone is never treated as verification.

## DELIVERABLES (documents only — no code changes yet)

| Document | Purpose |
|---|---|
| `ENGINE-IDENTITY-DECISION.md` | Cline v4.1.26 chosen as engine |
| `OPENVERSE-ENGINE-ARCHITECTURE.md` | Current architecture map |
| `COMPLETE-FEATURE-PARITY-MATRIX.md` | Cline Desktop + OpenCode Desktop audits |
| `UPSTREAM-VENDOR-STRATEGY.md` | `cline/` vs `desktop/` consolidation (no deletion until deps verified) |
| `LOCAL-TEST-ENVIRONMENT-REPORT.md` | AppLocker restriction + approved alternatives |
| `DESKTOP-FEATURE-COMPARISON.md` | Side-by-side desktop app comparison |
| `DESKTOP-INTEGRATION-ARCHITECTURE-PLAN.md` | Integration boundary & UI pattern |
| `UNIFIED-ARCHITECTURE.md` | Multi-chat + model intelligence + unified architecture |
| `IMPLEMENTATION-ROADMAP.md` | This document |

Proceed to Phase 0 only after this roadmap is reviewed and approved.

