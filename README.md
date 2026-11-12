# OPEN-VERSE

<p align="center">
  <strong>Autonomous AI Coding Assistant for Desktop, Mobile & Web</strong>
</p>

<p align="center">
  <a href="https://open-verse-website.vercel.app">Official Portal</a> •
  <a href="https://open-verse-website.vercel.app/download">Download Center</a> •
  <a href="docs/architecture.md">Architecture</a> •
  <a href="docs/installation-guide.md">Installation</a> •
  <a href="docs/auto-updates.md">Auto-Updates</a> •
  <a href="CHANGELOG.md">Changelog</a> •
  <a href="NOTICE.md">Attribution</a>
</p>

---

## Overview

**OPEN-VERSE** is an open-source autonomous AI coding assistant engineered for cross-device development workflows. It inspects workspaces, edits files, executes terminal commands, and coordinates complex programming tasks using your chosen AI foundation models.

- **Cross-Platform Parity**: Available on Windows (x64 NSIS), Android (APK / PackageInstaller), Linux (Debian `.deb` & RPM), macOS, and Web.
- **Autonomous Local Engine**: High-performance local runtime managing session execution, persistent context, tool sandboxing, and inter-process communication.
- **In-App Automatic Updates**: Cryptographically verified background updates using Minisign for desktop and native `PackageInstaller` on Android.
- **Privacy-First Isolation**: Independent workspace state and session data persisted in `~/.openverse` with strict sandboxing.
- **Unified Release Pipeline**: Synchronized release coordination ensuring consistent versioning across all endpoints.

---

## Supported Platforms

| Platform | Distribution Channel | Installer / Package | Auto-Update Mechanism |
| :--- | :--- | :--- | :--- |
| **Windows** | Direct Download | `OPEN-VERSE_0.2.3_x64-setup.exe` | Tauri v2 Minisign Signed Feed |
| **Android** | Website / Direct APK | `open-verse-mobile.apk` | Native `PackageInstaller` Intent Bridge |
| **Linux (Deb)** | Direct Download | `OPEN-VERSE_0.2.3_amd64.deb` | Tauri In-App Updater |
| **macOS** | Direct Download | `OPEN-VERSE_0.2.3_universal.dmg` | Tauri In-App Updater |
| **Web** | Cloud Portal | [open-verse-website.vercel.app](https://open-verse-website.vercel.app) | Continuous Deployment (Vercel) |
| **iOS** | Preview | TestFlight | Apple TestFlight Distribution |

---

## Quick Start

### 1. Download & Installation

Visit the [OPEN-VERSE Download Center](https://open-verse-website.vercel.app/download) or download directly from the latest [GitHub Release](https://github.com/naresh-cn2/OPEN-VERSE/releases/tag/v0.2.3):

- **Windows**: Run `OPEN-VERSE_0.2.3_x64-setup.exe`.
- **Android**: Download `open-verse-mobile.apk` and tap to install. In-app updates will subsequently be handled automatically.
- **Linux**: Install via `sudo dpkg -i OPEN-VERSE_0.2.3_amd64.deb`.

### 2. Configure Your AI Provider

OPEN-VERSE supports leading frontier models. Configure your API key via the in-app settings or via local environment variables:
- Anthropic Claude (Claude 3.5 Sonnet, Claude 3 Opus)
- OpenAI (GPT-4o, o1, o3-mini)
- Google Gemini (Gemini 2.0 Flash, Gemini 1.5 Pro)
- OpenRouter and local Ollama instances

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

For full architectural specifications, see [docs/architecture.md](docs/architecture.md).

---

## Repository Documentation

Detailed technical and operational guides:

- [docs/architecture.md](docs/architecture.md) — System architecture, daemon model, and data flow.
- [docs/development-setup.md](docs/development-setup.md) — Local environment setup and repository workflows.
- [docs/build-and-release.md](docs/build-and-release.md) — Packaging and cross-platform release automation.
- [docs/installation-guide.md](docs/installation-guide.md) — Step-by-step installation guides across all platforms.
- [docs/auto-updates.md](docs/auto-updates.md) — Cryptographic updater architecture, feeds, and troubleshooting.
- [docs/authentication-and-sync.md](docs/authentication-and-sync.md) — Account credentials, profiles, and state isolation.
- [docs/troubleshooting.md](docs/troubleshooting.md) — Diagnostics, daemon recovery, and common issues.
- [docs/security-and-privacy.md](docs/security-and-privacy.md) — Security model, code signing, and Play Protect guidance.

---

## Building from Source

### Prerequisites
- [Bun](https://bun.sh) (v1.1+)
- [Node.js](https://nodejs.org) (v20+ LTS or v22)
- [Rust](https://rustup.rs) (stable)

```bash
# 1. Clone repository
git clone https://github.com/naresh-cn2/OPEN-VERSE.git
cd OPEN-VERSE

# 2. Install dependencies & build core SDK
cd desktop
bun install
bun run build:sdk

# 3. Build Desktop Application
cd apps/examples/desktop-app
bun run build

# 4. Run Development Server
bun run dev
```

---

## Testing & Verification

Run the automated verification test suites:

```bash
# Manifest consistency & cross-device updater repair test
bun run tests/e2e-cross-device-updater-repair.ts

# Android package installer lifecycle test (requires running emulator/device)
bun run tests/e2e-android-auto-update-lifecycle.ts
```

---

## License & Notices

OPEN-VERSE is open-source under the Apache License, Version 2.0. See [LICENSE](LICENSE) for terms.
Certain components are derived from Cline Bot Inc. See [NOTICE.md](NOTICE.md) for full licensing notices and attributions.
