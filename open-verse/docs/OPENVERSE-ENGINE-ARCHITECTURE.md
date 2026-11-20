Key sidecar files:
- `index.ts` — entry; starts HTTP+WS server, adopts desktop CLI runtime, ensures Hub, seeds web-search default, telemetry selfcheck
- `server.ts` — Bun HTTP + WebSocket handlers; JSON-RPC routing; origin validation; approval-token auth
- `commands.ts` (4101 lines) — command router: provider settings, MCP servers (list/authorize/upsert/delete/OAuth), local models (Ollama/LM Studio), git (branches/checkout/worktree), session changes, workspace picker, tool approvals, ask-questions, routines, cloud sessions/repositories/models/branches, feature flags
- `chat-session.ts` — shared-Hub chat session adapter (local + cloud), start/send/subscribe, compaction, attachments
- `cloud-sessions.ts`, `cline-auth.ts`, `feature-flags.ts`, `cli-runtime.ts`, `connectors.ts`, `composio.ts`, `mcp-oauth.ts`, `oauth-login.ts`, `marketplace.ts`
- `session-data/`, `paths.ts`, `types.ts`, `context.ts`, `client-context.ts`, `observability.ts`
# OPENVERSE ENGINE ARCHITECTURE MAP

**Source:** Forensic audit of `C:\Users\nares\Workspace\OPEN-VERSE\OPEN-VERSE\`. No changes made.

## 1. Top-level repository layout

| Path | Role | Built? | Notes |
|---|---|---|---|
| `desktop/` | Tracked near-duplicate of Cline monorepo; the active build | Yes (`sdk/packages/*/dist`, `apps/cli/dist`, `apps/cline-hub/dist`) | `desktop/package.json` byte-identical to `cline/package.json` |
| `cline/` | Vendored pristine upstream Cline v4.1.26; gitignored ("preserved independently") | No (no `dist/`) | Reference copy only; not built |
| `desktop/apps/examples/desktop-app/` | `@cline/code` v0.2.3 Tauri shell + Next.js webview + Bun sidecar | Yes | Shipped desktop product |
| `desktop/apps/cli/` | `@cline/cli` built binary | Yes | Bundled CLI that starts the Hub |
| `desktop/apps/cline-hub/` | `@cline/cline-hub` shared Hub daemon | Yes | Reused across clients |
| `desktop/sdk/packages/{shared,llms,agents,core,sdk,ui}/` | Cline SDK packages | Yes (all six have `dist/`) | Imported by desktop-app |
| `dashboard/` | Default Vite + React template (placeholder) | No | Not integrated |
| `mobile/` | Android + iOS + web mobile shell | Partial | Android app present; iOS placeholder |
| `website/` | Next.js Vercel release portal / download center | Deployed via Vercel | Docs + update manifest (`/api/releases/latest`) |
| `tests/` | e2e updater/Android/repair tests | No | Run via `bun run tests/*.ts` |
| `docs/` | Architecture, build, auth/sync, security, installation, troubleshooting | No | Product docs |
| `.github/workflows/` | CI/CD: desktop publish/release, Android, macOS, cross-platform QA | No | Release automation |

## 2. Desktop app architecture

```
Webview UI (Next.js/React/Tailwind, :3125) --WebSocket--> Bun sidecar --Hub client--> Cline Hub daemon
```

## 3. Cline Hub and SDK

- `@cline/core` (`ClineCore`) — agent runtime; `backendMode: "hub"`; `start({config,prompt})`, `send({sessionId,prompt})`, `subscribe(event)`
- `@cline/cline-hub` — background daemon; discovery via lockfiles in `~/.openverse/data/locks/hub/`; single Hub shared across clients; `cline hub ensure` reuses compatible healthy Hub or starts one
- `@cline/shared` — settings, provider catalog, telemetry, storage paths
- `@cline/llms` — provider clients, model catalog, generated models, gateway
- `@cline/agents` — agent runtime, hooks, skills
- `@cline/sdk` — programmatic agent API (`Agent`, `createTool`)
- Persistence: SQLite `~/.openverse/data/db/sessions.db`; locks `~/.openverse/data/locks/hub/`; logs `~/.openverse/data/logs/`; cache `~/.openverse/cache/`

## 4. Provider integrations

Via `cline auth` or env vars (`ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, `GEMINI_API_KEY`, `OPENROUTER_API_KEY`, `CLINE_API_KEY`, `AI_GATEWAY_API_KEY`, `V0_API_KEY`). Providers: Anthropic, OpenAI, Google Gemini, OpenRouter, AWS Bedrock, GCP Vertex, Cerebras, Groq, Ollama, LM Studio, any OpenAI-compatible endpoint, Vercel AI Gateway, Cline (OAuth). Paid providers/API keys optional; local/free via Ollama/LM Studio/OpenAI-compatible.

## 5. MCP and LSP

- **MCP:** sidecar commands `list_mcp_servers`, `authorize_mcp_server_oauth`, `cancel_mcp_server_oauth`, `upsert_mcp_server`, `delete_mcp_server`; file I/O for MCP settings; system browser for OAuth. Confirmed present.
- **LSP:** Listed in OpenCode docs; **not confirmed present in Cline/OPEN-VERSE** — requires investigation/gap.


## 6. Database and session persistence

- SQLite `~/.openverse/data/db/sessions.db`: sessions, turns, checkpoints
- Lockfiles: `~/.openverse/data/locks/hub/` (daemon ports + auth tokens)
- Logs: `~/.openverse/data/logs/` (`code.log`, `hub-daemon.log`)
- Cache: `~/.openverse/cache/`

## 7. Mobile and website

- `mobile/android`: Gradle Android project (WebView + `OpenVerseWebAppInterface`, `PackageInstaller` bridge, `ai.openverse.mobile.fileprovider`)
- `mobile/ios`: placeholder directory
- `website/`: Next.js on Vercel; docs, download center, release notes, `/api/releases/latest` manifest

## 8. Tests and CI workflows

Tests (`tests/`): 8 e2e suites (updater, Android lifecycle, cross-device continuity, functional repair, one-ai-every-device, resilience/recovery, unified workspace acceptance, universal cross-platform acceptance), plus `tests/native-qa` and `tests/visual-qa`.

CI (`.github/workflows/`): `desktop-publish.yml`, `desktop-release.yml`, `desktop-build-windows-only.yml`, `desktop-macos-build.yml`, `unified-release.yml`, `mobile-android.yml`, `mobile-ios.yml`, `cross-platform-qa.yml`, `website-deploy.yml`.

## 9. Integration boundaries

1. Webview ↔ sidecar: JSON-RPC over WebSocket on dynamic loopback port (`127.0.0.1:3125` fallback)
2. Sidecar ↔ Hub: Hub client protocol; discovery via lockfiles
3. Sidecar ↔ model providers: direct HTTPS to Anthropic/OpenAI/Gemini/OpenRouter/Bedrock/Vertex/etc.; local Ollama/LM Studio
4. Desktop ↔ update feed: HTTPS GET `desktop-latest/latest.json` + Minisign Ed25519 signature verification
5. Sidecar ↔ OS: `git execFile`, native directory picker, `open` for MCP settings file, shell PATH resolution

## 10. Duplication note

`cline/` (vendored upstream, not built) and `desktop/` (tracked, built) are near-duplicate Cline copies. See `UPSTREAM-VENDOR-STRATEGY.md`. No new duplication should be introduced.
