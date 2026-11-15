# UPSTREAM VENDOR STRATEGY — Cline v4.1.26 in OPEN-VERSE

**No files deleted or overwritten.** This document records findings and a safe update strategy.

## 1. Duplication map: `cline/` vs `desktop/`

| Aspect | `cline/` | `desktop/` |
|---|---|---|
| Nature | Vendored pristine upstream Cline v4.1.26 | Tracked near-duplicate build copy |
| Git-tracked | No (gitignored: `cline/`) | Yes |
| `package.json` | Present | Present — **byte-identical** to `cline/package.json` |
| SDK packages (`shared|llms|agents|core|sdk|ui`) | Present, source only | Present + **built `dist/` for all six** |
| Apps (`cli`, `cline-hub`, `examples/desktop-app`) | Present | Present; `cli/dist` and `cline-hub/dist` built |
| `dist/` output | None | Built (`desktop/sdk/packages/*/dist`, `apps/cli/dist`, `apps/cline-hub/dist`) |
| node_modules | Present | Present |
| Patches | `patches/` (3 patch files) | `patches/` (same 3 patch files) |
| LICENSE / NOTICE | Apache 2.0 (Cline Bot Inc.) | Apache 2.0; `NOTICE.md` attributes Cline |

## 2. Which directory is actually built

**`desktop/` is the active build.** All six SDK packages (`shared`, `llms`, `agents`, `core`, `sdk`, `ui`), `@cline/cli`, and `@cline/cline-hub` have built `dist/` folders under `desktop/`. The desktop app `@cline/code` v0.2.3 imports `@cline/core`, `@cline/llms`, `@cline/shared`, `@cline/ui` from `desktop/sdk/packages/*`.

**`cline/` is not built** (no `dist/`). It is the preserved upstream vendor reference, gitignored and described in `.gitignore` as "Engine repository (original source preserved independently)."

## 3. Which packages are imported

The desktop app (`desktop/apps/examples/desktop-app/package.json`) imports workspace packages:
- `@cline/core`, `@cline/llms`, `@cline/shared`, `@cline/ui` (runtime dependencies)
- `@cline/sdk` (devDependency)

These resolve to `desktop/sdk/packages/*`. The Cline Hub (`desktop/apps/cline-hub`) and CLI (`desktop/apps/cli`) are also built from `desktop/`.

## 4. Files that differ

- `desktop/package.json` vs `cline/package.json`: byte-identical (both name `@cline/packages`, same workspaces, scripts, overrides, patchedDependencies).
- `desktop/patches/*` vs `cline/patches/*`: same three patches (`@opentui-ui/dialog`, `@shadcn/react`, `ollama-ai-provider-v2`).
- Build artifacts (`dist/`) exist only in `desktop/`.
- Any source drift between `cline/` and `desktop/` has not been quantified; both reflect Cline v4.1.26-era code.

## 5. Staleness assessment

- `cline/` is the pristine vendor snapshot at Cline v4.1.26 (per `cline/CHANGELOG.md` header `[4.1.26]`).
- `desktop/` is the tracked build copy, also at v4.1.26 lineage (`@cline/code` v0.2.3 desktop app version).
- Neither is confirmed newer than the other without a diff. A `cline/` ↔ `desktop/` source diff is needed before declaring staleness.
- Upstream Cline has moved beyond v4.1.26 (public repo has later commits), so both copies are behind upstream.

## 6. Safe upstream update strategy (non-destructive)

1. **Do not delete or overwrite `cline/` or `desktop/`** (hard rule).
2. Treat `cline/` as the vendor reference: periodically re-vendor from `https://github.com/cline/cline` at a pinned commit/tag into a fresh vendor directory (e.g., `cline-vendor-<version>/`), preserving the Apache 2.0 license and copyright notice.
3. Document upstream version + provenance in `NOTICE.md` and this file.
4. Apply OPEN-VERSE modifications (branding, Minisign identities, auto-updater feeds, packaging) as overlays on top of the vendored copy — never by editing vendored source directly where avoidable.
5. Build only from `desktop/` (the tracked build copy). Sync any needed upstream source changes into `desktop/sdk/packages/*` and `desktop/apps/*`, then rebuild.
6. Keep a maintainable update strategy: record the pinned upstream commit/tag, changelog delta, and a diff review step before each re-vendor.
7. Avoid creating a third engine/runtime/registry/configuration system (Requirement 4).

## 7. Verification gate before any re-vendor

- Run `bun run build:sdk` in `desktop/` and confirm all six SDK `dist/` outputs build.
- Run the SDK unit tests (requires a host not blocked by Windows AppLocker — see `LOCAL-TEST-ENVIRONMENT-REPORT.md`).
- Confirm the desktop app (`@cline/code`) still launches and the sidecar↔Hub contract works.
- Confirm OPEN-VERSE UI routes, navigation, settings, and conversations are unchanged.

## 8. Decision (approved)

Product owner has approved **Cline v4.1.26 as the primary coding-agent engine**. No OpenCode runtime introduced. No re-vendor or engine swap proceeds without separate approval. The safe update strategy in Section 6 applies when upstream Cline advances beyond v4.1.26.

