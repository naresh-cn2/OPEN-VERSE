# OPEN-VERSE

<p align="center">
  <strong>Autonomous AI Coding Assistant for Desktop & Mobile</strong>
</p>

<p align="center">
  <a href="https://open-verse-website.vercel.app">Website & Download</a> •
  <a href="#quick-start">Quick Start</a> •
  <a href="#architecture">Architecture</a> •
  <a href="#building-from-source">Building from Source</a> •
  <a href="NOTICE.md">Open-Source Attribution</a>
</p>

---

## Overview

**OPEN-VERSE** is an autonomous AI coding assistant that executes tasks across your codebase. It inspects repositories, reads and edits files, executes commands, and manages complex development workflows with your preferred AI models.

- **Unified Desktop Application**: High-performance desktop shell built on Tauri 2 and Rust with a modern Next.js/React webview.
- **Autonomous Local Hub**: Background daemon managing session execution, persistent context, tool sandboxing, and inter-process communication.
- **Cross-Platform**: Production installer support for Windows (NSIS), macOS (Universal .dmg), and Linux (Debian `.deb`, RPM).
- **Multi-Environment Ready**: Connect seamlessly to local workspaces, SSH remotes, or cloud environments.
- **Privacy-First Isolation**: Independent workspace and session state persisted in `~/.openverse`, preserving your existing tools and profiles.

---

## Quick Start

### 1. Download & Install

Download the latest release for your platform from the [OPEN-VERSE Portal](https://open-verse-website.vercel.app):

* **Windows**: `OPEN-VERSE_x64-setup.exe` (NSIS Installer)
* **macOS**: `OPEN-VERSE_universal.dmg` (Apple Silicon & Intel)
* **Linux**: `.deb` or `.rpm` packages

Launch OPEN-VERSE from your application shortcut. The application automatically starts its background Hub runtime daemon and connects the interface.

---

## Architecture

OPEN-VERSE is designed around an isolated local-first client/daemon architecture:

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

### Storage and Profile Separation
All user settings, logs, database state, and locks are isolated to `~/.openverse`:
- **Database**: `~/.openverse/data/db/sessions.db`
- **Locks & Discovery**: `~/.openverse/data/locks/hub/production.json`
- **Diagnostics**: `~/.openverse/data/logs/code.log` and `hub-daemon.log`

Existing sessions from legacy installations are imported idempotently on first launch without altering original files.

---

## Building from Source

### Prerequisites

* [Bun](https://bun.sh) (v1.4+)
* [Node.js](https://nodejs.org) (>= 22)
* [Rust](https://rustup.rs) (stable)

### 1. Clone the Repository

```bash
git clone https://github.com/naresh-cn2/OPEN-VERSE.git
cd OPEN-VERSE
```

### 2. Build Core SDK Packages

```bash
cd desktop
bun install
bun run build:sdk
```

### 3. Build Desktop Application & Runtime

```bash
cd apps/examples/desktop-app
bun run build
```

This compiles:
- The desktop CLI binary (`src-tauri/bin/cline-cli-<target>`)
- The bundled sidecar runtime (`src-tauri/bin/desktop-backend/index.js`)
- The Next.js webview export

### 4. Run in Development Mode

```bash
bun run dev
```

### 5. Package Desktop Installer

* **Windows NSIS Installer**:
  ```powershell
  bunx tauri build --bundles nsis --config src-tauri/tauri.windows.conf.json
  ```
* **macOS DMG**:
  ```bash
  bunx tauri build --target universal-apple-darwin
  ```

---

## Verification & Diagnostics

To inspect the health and discovery state of the local Hub daemon:

```bash
cline-cli hub list --json
```

To repair discovery records or diagnose connectivity:

```bash
cline-cli doctor fix
```

---

## Contributing & License

OPEN-VERSE is open-source under the Apache License, Version 2.0.
Portions of the codebase incorporate components derived from Cline Bot Inc. See [NOTICE.md](NOTICE.md) for full licensing notices and attributions.
