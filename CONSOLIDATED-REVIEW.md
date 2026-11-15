# CONSOLIDATED REVIEW — OPEN-VERSE Unified AI Desktop Development Environment

**Purpose:** Consolidated findings and architecture/implementation roadmap for integrating applicable Cline Desktop + OpenCode Desktop capabilities into OPEN-VERSE while preserving the existing product.
**Status:** Planning / findings only. **No code modified, no components deleted, no runtime replaced, no deployment/release.**
**Review gate:** This document must be reviewed and approved before implementation begins.

## 1. ENGINE IDENTITY DECISION (CONFIRMED)

**Cline v4.1.26 (Apache 2.0)** is the primary coding-agent engine for OPEN-VERSE.
- Vendored in `cline/` (pristine upstream, not built) and built under `desktop/` (tracked, all six SDK `dist/` present).
- OpenCode (anomalyco/opencode, MIT) is a SEPARATE project — its desktop app capabilities are evaluated for integration only; **no OpenCode runtime or second engine is introduced**.
- Cline and OpenCode are not interchangeable (different license, architecture, provider catalog, tool set, runtime model).

Documents: `ENGINE-IDENTITY-DECISION.md`, `UPSTREAM-VENDOR-STRATEGY.md` (updated to reflect approved decision).

## 2. DESKTOP FEATURE AUDITS (COMPLETE)

### 2.1 Cline Desktop (39 capabilities audited)
Source: docs.cline.bot/usage/cline-desktop.md; cline.bot/desktop (v0.0.49 Beta).

| Classification | Count | Examples |
|---|---|---|
| Implemented & working | ~22 | Standalone app, plan/act, tool approval, YOLO, markdown/diff, 300+ models/BYOK/local models, MCP, marketplace, auto-updates, scheduled tasks, terminal, file ops, system tray |
| Backend implemented, UI missing | ~3 | Session rename, session filter by source |
| Partially implemented | ~12 | Workspace branch UI, fork/rewind, session move, undo/redo, voice input, MCP marketplace, plugins, skills, rules, hooks, remote SSH |
| Completely missing | ~1 | Session move (backend unconfirmed) |

Because OPEN-VERSE already embeds the Cline agent core (sidecar → Hub → `@cline/core`), nearly all Cline Desktop capabilities exist as backend; the gap is primarily **UI exposure**.

### 2.2 OpenCode Desktop (20 capabilities audited)
Source: opencode.ai/download; opencode.ai/docs (Tools, MCP servers, Models); `packages/app` (SolidJS desktop frontend).

Distinct OpenCode desktop contributions (NOT in Cline):
- **Built-in browser automation** (tabs, snapshots, click, forms, screenshots, console/network/heap/performance/Lighthouse) — completely missing in OPEN-VERSE; new capability requiring sandbox.
- **Session tabs** — completely missing; UI-only over existing multi-session Hub.
- **Pairing/connection model** (`opencode pair`, single-use links, QR code) — completely missing; may duplicate existing auth.
- Per-session model selection, worktrees, shell, MCP — already present in OPEN-VERSE via Cline.

Document: `COMPLETE-FEATURE-PARITY-MATRIX.md` (Sections A = Cline Desktop audit, B = OpenCode Desktop audit, C = status summary).

## 3. UNIFIED ARCHITECTURE (PRESERVES EXISTING PRODUCT)

Existing architecture preserved: Tauri v2 Rust shell + Next.js webview (:3125) → Bun sidecar → shared Cline Hub daemon → `@cline/core` → SQLite at `~/.openverse/data/db/sessions.db`.

### 3.1 Multi-chat orchestration (new layer in Bun sidecar)
- Task queue (persisted SQLite), concurrency controller (resource-aware), session router (per-conversation context + model), file conflict guard (per-workspace locks), status broadcaster (WS events).
- Supports 10+ conversations, background execution, pause/resume/cancel/retry, live status, restart recovery, file-conflict protection.

### 3.2 Model intelligence system (new layer)
- Catalog fetcher (background refresh from models.dev / Cline catalog; offline snapshot fallback).
- Capability store (SQLite + in-memory cache; source/confidence per field).
- Capability resolver (merges model / provider / integration layers).
- UI hover tooltip showing vision/tools/audio/video/reasoning/context/output/structured/pricing/local-cloud/limitations — never fabricates fields.

### 3.3 Preservation principles (unchanged)
- OPEN-VERSE UI, design system, navigation, layouts, themes, branding.
- Existing routes, settings, conversations, auth, account isolation.
- Existing provider integrations, updater (Minisign + Tauri), cross-platform builds.
- Existing Cline integration; single runtime; single database (new tables only); single config system.

Document: `UNIFIED-ARCHITECTURE.md`; supporting: `DESKTOP-INTEGRATION-ARCHITECTURE-PLAN.md`, `DESKTOP-FEATURE-COMPARISON.md`, `OPENVERSE-ENGINE-ARCHITECTURE.md`.

## 4. IMPLEMENTATION ROADMAP (PRIORITIZED)

| Phase | Focus | Key stages |
|---|---|---|
| 0 | Foundation & test environment | Secure compliant host/CI; baseline `build:sdk`; baseline unit/e2e; UI regression baseline |
| 1 | Multi-chat orchestration | 1A task queue+concurrency; 1B pause/resume/cancel/retry+live status; 1C file conflict guard+per-conv model; 1D restart recovery+task panel |
| 2 | Model intelligence | 2A catalog fetcher+capability store; 2B resolver+UI tooltip |
| 3 | Cline Desktop completion | 3A session rename; 3B worktree list/remove; 3C undo/redo; 3D session move; 3E–3J filter/fork/import/queue/plugins/rules/branches-diffs |
| 4 | OpenCode integration (evaluate only) | Browser automation, tabs, pairing — approve scope before any work |
| 5 | Consolidation & full regression | Full build; unit+integration+e2e; UI regression; security audit; cross-platform check |

Document: `IMPLEMENTATION-ROADMAP.md` (includes dependencies, files/modules, acceptance criteria, testing per stage).

## 5. TESTING — WINDOWS APPLELOCKER RESTRICTION

**Problem:** `tsc.exe`/`vitest.exe` under `node_modules/.bin/` blocked by Windows AppLocker on this host. `build:sdk` and vitest cannot run here.

**Approved alternatives (do NOT bypass security policy):**
- **Option A (recommended):** Non-blocked dev host — `cd desktop && bun install && bun run build:sdk && bun run test`.
- **Option B:** IT/AppLocker exclusion for repo `node_modules/.bin`.
- **Option C (CI):** GitHub Actions (`ubuntu-latest` + `oven-sh/setup-bun`) runs `build:sdk`, `test`, e2e.
- **Option D (experimental, unconfirmed):** `bun <vitest entry>.js`; does not fix `tsc.exe`.

**Verification strategy:** No feature labelled complete without tests passing on a compliant host (A, B, or C). Source-code presence alone is never verification.

Document: `LOCAL-TEST-ENVIRONMENT-REPORT.md`.

## 6. DELIVERABLES (documents only — no code changes)

| Document | Status |
|---|---|
| `ENGINE-IDENTITY-DECISION.md` | Complete — Cline v4.1.26 approved |
| `OPENVERSE-ENGINE-ARCHITECTURE.md` | Complete — current architecture map |
| `COMPLETE-FEATURE-PARITY-MATRIX.md` | Complete — Cline + OpenCode Desktop audits |
| `UPSTREAM-VENDOR-STRATEGY.md` | Updated — reflects approved Cline decision |
| `LOCAL-TEST-ENVIRONMENT-REPORT.md` | Complete — AppLocker restriction + alternatives |
| `DESKTOP-FEATURE-COMPARISON.md` | Complete — side-by-side desktop comparison |
| `DESKTOP-INTEGRATION-ARCHITECTURE-PLAN.md` | Complete — integration boundary & UI pattern |
| `UNIFIED-ARCHITECTURE.md` | Complete — multi-chat + model intelligence + unified architecture |
| `IMPLEMENTATION-PLAN.md` | Marked superseded (see `IMPLEMENTATION-ROADMAP.md`) |
| `IMPLEMENTATION-ROADMAP.md` | Complete — full prioritized roadmap |
| `CONSOLIDATED-REVIEW.md` | This document |

## 7. HARD RULES (reconfirmed)

- No UI redesign, no replacement of themes/navigation/branding.
- No second coding-agent runtime; no duplicate database; no unnecessary dependencies.
- No code deletion or overwrite of existing components (`cline/` and `desktop/` preserved until deps verified).
- No changes to authentication or auto-update behavior unless separately tested and approved.
- No deployment, release, or GitHub publish.
- No feature claimed complete without verification on a compliant host.

**Awaiting review and approval before any implementation begins.**

