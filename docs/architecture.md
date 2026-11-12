# OPEN-VERSE System Architecture

This document describes the architectural layout, components, inter-process communication, and execution models of OPEN-VERSE across desktop, mobile, and web.

---

## 1. High-Level Architecture

OPEN-VERSE is built on a client/daemon model designed for low latency, local data sovereignty, and reliable sandboxing:

```
┌────────────────────────────────────────────────────────┐
│                   OPEN-VERSE Desktop                   │
│          (Tauri 2 / Rust Native Application)           │
│                                                        │
│   ┌────────────────────────────────────────────────┐   │
│   │                 Webview UI                     │   │
│   │           (React / Next.js / Tailwind)         │   │
│   └───────────────────────┬────────────────────────┘   │
│                           │ WebSocket Transport         │
│                           ▼                            │
│   ┌────────────────────────────────────────────────┐   │
│   │              Desktop Sidecar                   │   │
│   │     (Local Session Manager / Tool Engine)      │   │
│   └───────────────────────┬────────────────────────┘   │
└───────────────────────────┼────────────────────────────┘
                            │ WebSocket (Internal RPC)
                            ▼
┌────────────────────────────────────────────────────────┐
│                   OPEN-VERSE Hub                       │
│             (Background Runtime Daemon)                │
│                                                        │
│  • Agent Tools Execution     • Local File Watcher      │
│  • Token Discovery & Locks   • Cron & Automation       │
│  • Dynamic Port Fallback     • Multi-Client Observers  │
└────────────────────────────────────────────────────────┘
```

---

## 2. Core Components

### 2.1 Tauri 2 Desktop Shell (`desktop/apps/examples/desktop-app/src-tauri`)
- **Native Host**: Implemented in Rust. Provides native window management, system tray, notifications, process life-cycle control, and cryptographic auto-updating.
- **IPC Interface**: Tauri commands bridge native operating system operations (file system dialogs, updater invocation) to the webview.
- **Sidecar Lifecycle**: Manages the startup, health-checking, and graceful shutdown of the bundled node/bun backend sidecar.

### 2.2 Desktop Webview Interface (`desktop/apps/examples/desktop-app/webview`)
- **Framework**: Next.js / React with Tailwind CSS.
- **Client Transport**: Connects to the local backend using WebSocket transport (`desktopClient`).
- **Feature Set**: Chat interaction, diff viewer, terminal execution streamer, settings management, and in-app update notifications.

### 2.3 OPEN-VERSE Hub & Runtime Engine (`cline-cli`)
- **Runtime Daemon**: Independent background process executing tool operations, file inspections, git mutations, and model communications.
- **Discovery Mechanism**: Locates running daemons and acquires user session tokens via lockfiles stored in `~/.openverse/data/locks/hub/`.
- **Session Persistence**: SQLite database storing sessions, conversation turns, and state checkpoints in `~/.openverse/data/db/sessions.db`.

### 2.4 Mobile Android Shell (`mobile/android`)
- **Native Container**: Android application leveraging modern WebView with custom native interface (`OpenVerseWebAppInterface`).
- **Update Bridge**: Native download manager and `FileProvider` (`ai.openverse.mobile.fileprovider`) bridging in-app update checks to the Android system `PackageInstaller`.

### 2.5 Web Application & Release Portal (`website/`)
- **Framework**: Next.js deployed serverlessly on Vercel.
- **Functions**: Serves documentation, the multi-platform download center, release notes, and dynamic update manifest endpoints (`/api/releases/latest`).

---

## 3. Storage and Directory Isolation

To ensure privacy and avoid collisions with other tools on the host system, OPEN-VERSE persists all state under the isolated user directory `~/.openverse`:

| Path | Purpose |
| :--- | :--- |
| `~/.openverse/data/db/sessions.db` | Primary SQLite database for chat sessions and message history |
| `~/.openverse/data/locks/hub/` | Discovery lockfiles storing active daemon ports and auth tokens |
| `~/.openverse/data/logs/` | Local operational logs (`code.log`, `hub-daemon.log`) |
| `~/.openverse/cache/` | Ephemeral caches and download buffers |

---

## 4. Communication & Protocol

1. **Webview <-> Sidecar**: Uses JSON-RPC over WebSocket on dynamic loopback ports (`127.0.0.1:3125` or fallback).
2. **Sidecar <-> Model Providers**: Direct HTTPS API calls to Anthropic, OpenAI, Google Gemini, OpenRouter, or local Ollama endpoints.
3. **Desktop <-> Update Feed**: HTTPS GET queries against the release feed manifest (`desktop-latest/latest.json`) with Minisign Ed25519 signature verification.

