# IMPLEMENTATION PLAN — OPEN-VERSE (SUPERSEDED)

**Status:** This document has been superseded by `IMPLEMENTATION-ROADMAP.md`, which contains the complete prioritized roadmap (architecture, multi-chat orchestration, model intelligence, Cline feature completion, OpenCode integration, UI integration, security, performance, testing, cross-platform regression).

**Engine decision:** Cline v4.1.26 (Apache 2.0) is the approved primary coding-agent engine. No OpenCode runtime introduced.

This document is retained for reference only. All implementation planning should use `IMPLEMENTATION-ROADMAP.md`.

## 0. Ground rules (product owner)

1. Preserve existing OPEN-VERSE UI exactly (routes, navigation, layouts, themes, components).
2. Do not remove or break existing functionality.
3. Do not create duplicate engines/runtimes/registries/config systems.
4. Reuse existing infrastructure wherever appropriate.
5. Complete all development and testing locally before deployment.
6. No feature labelled complete without verification.
7. `cline/` and `desktop/` must not be deleted or overwritten until dependencies are verified.

## 1. Already present (code + UI) — verification only, no new code

Per the parity matrix, Implemented status; need verification on compliant host:
- Agent runtime / plan-act toggle / headless CLI (partial)
- Scheduled routines (`routine-view.tsx`)
- Workspace folder open
- File read/edit/write
- Terminal execution
- Slash commands
- Persistent sessions (SQLite)
- Tool approval
- MCP list/add/remove + OAuth (`mcp-view.tsx`)
- Provider catalog + custom OpenAI-compatible provider
- Local/free model management (`local-models-view.tsx`)
- Config/settings + themes/keybinds
- Web search

## 2. Partially present — need UI exposure (PRIORITY)

Backend exists in sidecar (`commands.ts`); UI gap to close:

| Capability | Backend (`commands.ts`) | UI gap | Priority |
|---|---|---|---|
| Session rename | `update_chat_session_title` | Rename not in sessions UI | High |
| Session move | Not confirmed present | None | High |
| Worktree list/remove | `create_git_worktree` | Only create exposed | High |
| Undo/redo (checkpoints) | `read_session_checkpoint_history` | No undo/redo UI | High |
| Git branches/checkout | `get_git_branch`, `list_git_branches`, `checkout_git_branch` | Partial UI | Medium |
| Session changes/diffs | `get_session_changes`, `read_session_change` | Partial diff viewer | Medium |
| Rules/permissions/deny | Rules + settings | Partial config UI | Medium |
| Skills | `.claude/skills` discovery | No skills UI | Medium |
| Plugins | `createTool` + lifecycle hooks | No plugin UI | Medium |

Browser automation and LSP are NOT Cline v4.1.26 features (browser automation is OpenCode's; LSP not confirmed in Cline). Flag as not applicable to Cline parity unless directed otherwise.

## 3. Architecture approach

### 3.1 No second runtime
Cline is already the engine. New wiring goes through existing sidecar → Hub → `@cline/core`. No new engine/registry/config system.

### 3.2 UI integration (preserve existing UI)
- Add settings/session UI under `webview/components/views/settings/`, following existing `settings-view.tsx` / `mcp-view.tsx` / `local-models-view.tsx` patterns.
- Route via existing WebSocket JSON-RPC (`server.ts` → `commands.ts` → `handleCommand`).
- Reuse existing sidecar handlers; add new handlers only where backend is absent (session move, worktree list/remove, undo/redo).
- Do not alter `layout.tsx`, `page.tsx`, navigation, themes, or existing components.

### 3.3 Consolidating duplicated source (safe, no deletion until deps verified)
`cline/` (vendored upstream, not built) and `desktop/` (tracked, built) are near-duplicates; `desktop/` is active.
- Verify `desktop/` deps complete (all six SDK `dist/`, `apps/cli/dist`, `apps/cline-hub/dist` present — confirmed).
- Do NOT delete `cline/` yet; keep as vendor reference.
- Later: re-vendor from upstream `cline/cline` at pinned commit into fresh vendor dir, applying OPEN-VERSE overlays. Never edit vendored source directly.

## 4. Implementation stages (small, verifiable)

### Stage A — Session rename
1. Confirm `update_chat_session_title` sidecar handler + WebSocket command exists.
2. Add rename control to sessions view (`webview/components/views/sessions/`).
3. Wire WebSocket command + settings persistence.
4. Add regression test (session rename persists).
5. Verify on compliant host.

### Stage B — Worktree list/remove
1. Confirm `create_git_worktree` handler; add `list_worktrees`/`remove_worktree` sidecar commands if absent.
2. Add worktree management UI (existing settings pattern).
3. Wire commands + tests.
4. Verify on compliant host.

### Stage C — Undo/redo
1. Confirm `read_session_checkpoint_history` + checkpoint restore handler.
2. Add undo/redo UI in chat/session view.
3. Wire + tests.
4. Verify on compliant host.

### Stage D — Session move
1. Confirm whether session move backend exists.
2. If absent, add backend + UI; if present, expose UI.
3. Tests + verify.

### Stage E — Remaining partial capabilities
1. Expose UI for git branches, diffs, rules, skills, plugins following existing settings patterns.
2. Tests + verify each.

### Stage F — Consolidation & full regression
1. Verify `desktop/` build (`build:sdk`) on compliant host.
2. Run full unit + integration + e2e suites.
3. Confirm UI unchanged (visual/regression).
4. Document final parity + limitations.

## 5. Test execution restriction & approved alternative (Step 9)

**Problem (this host):** `tsc.exe` and `vitest.exe` under `node_modules/.bin/` are blocked by Windows Application Control policy. `build:sdk` and vitest cannot run here.

**Approved alternatives:**
- **Option A (recommended):** Non-blocked dev host: `cd desktop && bun install && bun run build:sdk && bun run test`.
- **Option B:** IT/AppLocker exclusion for repo `node_modules/.bin`, then run locally.
- **Option C (CI):** GitHub Actions (`ubuntu-latest` + `oven-sh/setup-bun`) runs `build:sdk`, `test`, e2e. Not subject to this host's policy.
- **Option D (experimental):** `bun <vitest entry>.js` may bypass `.exe` wrapper block; unconfirmed, doesn't fix `tsc.exe`.

No feature is "verified" until tests pass on a compliant host.

## 6. Verification gate (Step 10)

Before any feature is labelled complete:
- `bun run build:sdk` succeeds (all six SDK packages).
- Relevant unit tests pass (`@cline/core`, `@cline/cli`, `@cline/cline-hub`, sidecar tests).
- E2E suites pass (`tests/e2e-*`).
- UI regression confirmed (routes/navigation/settings/conversations intact).
- New regression test added for the feature.

## 7. What is NOT in scope (this iteration)

- No OpenCode runtime or second engine.
- No browser automation / LSP as Cline parity items (not Cline v4.1.26 features).
- No deployment, release, or GitHub publish.
- No changes to authentication or auto-update behavior.
- No deletion of `cline/` or `desktop/` until dependencies verified.

Proceed to Stage A on approval of this plan.

