# LOCAL TEST ENVIRONMENT REPORT — OPEN-VERSE

**Purpose:** Investigate the Windows build/test tool restriction and identify an approved way to execute required builds and tests. **No deployment or release.**

## 1. Toolchain status (this host, Windows)

| Tool | Version | Runs? | Notes |
|---|---|---|---|
| `bun` | 1.4.4 | Yes | Package manager + runtime; not blocked |
| `node` | v24.21.0 | Yes | Not blocked |
| `rustc`/`cargo` | 1.99.1 | Yes | Meets Rust ≥1.85 (edition2024) requirement |
| `tsc.exe` (`node_modules/.bin/tsc.exe`) | — | **No** | Blocked by Windows Application Control policy |
| `vitest.exe` (`node_modules/.bin/vitest.exe`) | — | **No** | Blocked by Windows Application Control policy |

## 2. The restriction

Error observed:
```
Program 'tsc.exe' failed to run: An Application Control policy has blocked this file
```
and for the SDK declaration build:
```
@cline/shared build: error: Failed to run "tsc.exe" due to:
EUNKNOWN: C:\...\node_modules\.bin\tsc.exe: unknown error (uv_spawn())
```

Both `tsc.exe` and `vitest.exe` under `desktop/node_modules/.bin/` are blocked by a Windows **Application Control policy** (AppLocker / WDAC / SmartScreen-like enforcement). This is a host-level security control, not a repository defect.

Impact:
- `bun run build:sdk` fails — each SDK package's build invokes `tsc.exe` for declaration generation.
- `bun run test` / `vitest run ...` cannot execute — vitest.exe is blocked.
- Pre-built `dist/` folders already exist for all six SDK packages, `@cline/cli`, and `@cline/cline-hub`, so the runtime is usable without rebuilding.
- `bun` itself and `.mts`/`.ts` execution via bun are not blocked, so runtime imports can be exercised with `bun` where module resolution works from within a workspace package.

## 3. What works today (no new host needed)

- Reading source, auditing, docs, and producing this forensic analysis: fully works.
- Confirming pre-built `dist/` presence: works (all six SDK `dist/`, `apps/cli/dist`, `apps/cline-hub/dist` exist).
- Running arbitrary `bun` scripts from within `desktop/` that don't shell out to `tsc`/`vitest.exe`: works.

## 4. What does NOT work on this host (needs remediation)

- Clean `bun run build:sdk` (declaration build via tsc.exe)
- `bun run test` / `vitest run` (vitest.exe)
- `bun run check` / `bun run lint` (biome via node? biome binary also under .bin — may be blocked)
- TypeScript `typecheck` (tsc)

## 5. Approved ways to execute build & test tools (options)

**Option A — Run on a non-blocked development host (recommended, no IT change).** Clone the repo to a Windows/macOS/Linux machine without the Application Control restriction on `node_modules/.bin`, then run:
```
cd desktop
bun install
bun run build:sdk
bun run test        # or bun run test:unit / test:e2e
bun run check
```
This is the lowest-friction path and requires no security-policy change.

**Option B — Request an AppLocker/WDAC exclusion for `node_modules/.bin`.** Engage the local IT/security team to add an allowlist exclusion (by path or publisher) for the repo's `node_modules/.bin` directory, or run the repo from a directory covered by an existing allowed path. After approval, re-run `build:sdk` and the test suites locally.

**Option C — Invoke vitest via bun directly (investigate, not confirmed).** Because vitest is a JS program, `bun <vitest entry>.js` may bypass the `.exe` wrapper block. This is unconfirmed and should be treated as experimental; it does not fix `tsc.exe` declaration builds.

**Option D — CI-based verification.** Push to a branch and let GitHub Actions (`ubuntu-latest` runners with `oven-sh/setup-bun`) run `build:sdk`, `test`, and the e2e suites. CI is not subject to this host's AppLocker policy. This is a viable path for functional verification without changing local policy.

## 6. Recommended path forward

1. Use **Option A** (non-blocked host) or **Option D** (CI) to execute the full build and test suites as Phase 4 requires.
2. If local execution on this host is mandatory, pursue **Option B** with IT/security.
3. Do not declare any feature "verified" until `build:sdk` succeeds and the relevant unit/integration/e2e tests pass on a compliant host.
4. The pre-built `dist/` and source audit remain valid evidence of implementation presence, but **not** of functional verification.

## 7. Tests to run once unblocked (Phase 4 baseline)

- `bun run build:sdk` (all six SDK packages)
- SDK unit tests: `bun run test:unit` (@cline/agents, @cline/llms, @cline/core, @cline/cli, @cline/cline-hub)
- `bun run test:e2e` (@cline/core, @cline/cli)
- Desktop app tests: `test:sidecar`, `test:chat-ui`, `test:settings-ui`, `test:desktop-client`
- Repository e2e suites: `tests/e2e-cross-device-updater-repair.ts`, `tests/e2e-android-auto-update-lifecycle.ts`, plus the remaining repair/continuity/resilience/acceptance suites
- Provider connection tests, agent execution tests, file/terminal operation tests, MCP/LSP tests, permission/security tests, session persistence tests
- Full regression suite re-run after any fix
