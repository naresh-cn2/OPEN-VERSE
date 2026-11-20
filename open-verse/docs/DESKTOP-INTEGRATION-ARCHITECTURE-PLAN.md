# DESKTOP INTEGRATION ARCHITECTURE PLAN

**Goal:** Expose applicable Cline v4.1.26 desktop capabilities + selected OpenCode desktop capabilities through the existing OPEN-VERSE Windows desktop app.
**Constraint:** OPEN-VERSE remains primary. No UI redesign, no second runtime, no replacement of existing components, no deployment/release.
**Existing architecture (preserved):** Tauri v2 Rust shell + Next.js webview (:3125) → Bun sidecar → shared Cline Hub daemon → `@cline/core` agent runtime → SQLite sessions at `~/.openverse/data/db/sessions.db`.
**Decision:** Cline v4.1.26 is the engine. OpenCode desktop capabilities evaluated individually.

## 1. Integration boundary (unchanged)

```
Webview UI (Next.js, :3125) --WebSocket JSON-RPC--> Bun sidecar --Hub client--> Cline Hub --> @cline/core agent runtime
```

All new capability wiring flows through this existing contract. The sidecar's `commands.ts` (4101 lines) already exposes provider settings, MCP servers, local models, git, session changes, tool approvals, scheduled routines, cloud sessions, and feature flags via the same WebSocket transport.

No new engine, registry, or configuration system is created. The Cline Hub remains the single coding-agent runtime.

## 2. Already implemented (backend + partial UI) — expose only

These Cline Desktop capabilities exist in `desktop/` sidecar/backend; integration = add UI controls in existing settings/session views:

| Capability | Existing backend | UI to add | Priority |
|---|---|---|---|
| Session rename | `update_chat_session_title` | Rename control in sessions view | High |
| Worktree list/remove | `create_git_worktree` (create only) | Add list + remove UI | High |
| Undo/redo (checkpoints) | `read_session_checkpoint_history` | Undo/redo UI in chat/session view | High |
| Session move | Investigate (not confirmed) | Move UI if backend exists | High |
| Session filter by source | Session store (SQLite) | Filter sidebar by source | Medium |
| Fork & edit (checkpoint rewind) | Checkpoints exist | Fork/rewind UI | Medium |
| Import from Claude Code/Codex | Session-import adapters exist | Import UI in settings | Medium |
| Queued messages | Not present | Queue UI (new) | Medium |
| Plugin/skills/rules/hooks UI | `.claude/skills`, plugins, hooks exist | Customize/Installed view | Medium |
| Git branches/checkout diff viewer | `get_git_branch`, `list_git_branches`, `checkout_git_branch`, `get_session_changes` | Expose branch/diff UI | Medium |

## 3. OpenCode desktop capabilities — evaluate individually

These are NOT Cline features; each requires a decision on whether to add as a new OPEN-VERSE capability:

| OpenCode desktop capability | Architecture fit | Assessment |
|---|---|---|
| Built-in browser automation (tabs, snapshots, click, forms, Lighthouse, console/network/heap) | Would require a browser automation layer inside sidecar or as a new tool category | New capability; evaluate scope & security sandbox |
| Tabbed UI (multiple concurrent sessions as tabs) | Webview tab component over existing multi-session Hub | UI-only; reuse existing sessions |
| Pairing/connection model (`opencode pair`, single-use links, QR code) | Alternative to direct settings-based provider config | Evaluate; may duplicate existing auth |
| Sessions + tabs + diffs + extensions (SolidJS frontend) | OPEN-VERSE already uses Next.js webview | Do NOT replace UI; adopt concepts only |


## 4. UI integration pattern (preserve existing OPEN-VERSE UI)

- Add new controls under `webview/components/views/settings/` following existing `settings-view.tsx`, `mcp-view.tsx`, `local-models-view.tsx`, `provider-list-view.tsx` patterns.
- Session-related controls under `webview/components/views/sessions/` and `webview/components/views/chat/`.
- Route all new commands through existing WebSocket (`server.ts` → `commands.ts` → `handleCommand`).
- Add sidecar command handlers only where backend is absent (session move, worktree list/remove, undo/redo, fork/rewind, import, queue).
- Do not alter `layout.tsx`, `page.tsx`, navigation, themes, branding, or existing components.

## 5. Implementation stages (small, verifiable)

| Stage | Capability | Exit criteria |
|---|---|---|
| A | Session rename | Backend confirmed + UI + regression test + verified on clean host |
| B | Worktree list/remove | Backend handlers added + UI + tests + verified |
| C | Undo/redo | Checkpoint restore handler + UI + tests + verified |
| D | Session move | Backend confirmed/added + UI + tests + verified |
| E | Remaining partial (fork/rewind, import, queue, plugin/skills/rules, branches/diffs) | Each exposed + tested + verified |
| F | OpenCode evaluation | Browser/tabs/pairing decision documented; no runtime added unless approved |
| G | Consolidation & full regression | `build:sdk` passes; full unit/integration/e2e suite passes; UI regression confirmed |

## 6. Local test execution restriction (this host)

`tsc.exe` and `vitest.exe` under `node_modules/.bin/` are blocked by Windows Application Control policy. `build:sdk` and vitest cannot run here.

Approved alternatives:
- Option A (recommended): non-blocked dev host — `cd desktop && bun install && bun run build:sdk && bun run test`.
- Option B: IT/AppLocker exclusion for repo `node_modules/.bin`, then run locally.
- Option C (CI): GitHub Actions (`ubuntu-latest` + `oven-sh/setup-bun`) runs `build:sdk`, `test`, e2e suites.
- Option D (experimental): `bun <vitest entry>.js` may bypass `.exe` wrapper block; unconfirmed, doesn't fix `tsc.exe`.

No feature is "verified" until tests pass on a compliant host.

## 7. Verification gate (before any feature labelled complete)

- `bun run build:sdk` succeeds (all six SDK packages).
- Relevant unit tests pass (`@cline/core`, `@cline/cli`, `@cline/cline-hub`, sidecar tests).
- E2E suites pass (`tests/e2e-*`).
- UI regression confirmed (existing routes/navigation/settings/conversations intact; branding/themes unchanged).
- New regression test added for the feature.

## 8. Explicitly NOT in scope (this iteration)

- No OpenCode runtime or second coding-agent engine.
- No replacement of OPEN-VERSE UI, themes, navigation, or branding.
- No deployment, release, or GitHub publish.
- No changes to authentication or auto-update behavior unless separately tested and approved.
- No deletion of `cline/` or `desktop/` until dependencies verified.
- Built-in browser automation, tabs, and pairing are "evaluate only" unless separately approved.

Proceed to Stage A on approval of this plan.

