# OPEN-VERSE

<p align="center">
  <strong>Autonomous AI Coding Assistant for Desktop, Mobile & Web</strong>
</p>

<p align="center">
  <a href="https://open-verse-website.vercel.app">Official Portal</a> •
  <a href="https://open-verse-website.vercel.app/download">Download Center</a> •
  <a href="open-verse/docs/architecture.md">Architecture</a> •
  <a href="open-verse/docs/installation-guide.md">Installation</a> •
  <a href="open-verse/docs/auto-updates.md">Auto-Updates</a> •
  <a href="open-verse/CHANGELOG.md">Changelog</a> •
  <a href="NOTICE.md">Attribution</a>
</p>

---

## Repository Structure

The OPEN-VERSE repository is organized into two primary top-level domains:

```text
OPEN-VERSE/
├── sources/               # Upstream external projects & reusable open-source engines
│   ├── README.md          # Provenance, commit references, and integration catalog
│   ├── cline/             # Base desktop runtime, sidecar, and tool execution foundation
│   ├── hermes-agent/      # LSP client, wake-word acoustics, voice streaming, and OS vaults
│   ├── openclaw/          # Multi-agent swarm coordination and P2P encrypted device sync
│   └── opencode/          # AST code intelligence, semantic search, and syntax diffs
│
├── open-verse/            # Core OPEN-VERSE product implementation
│   ├── README.md          # Product architecture, development guide, and workflow
│   ├── desktop/           # Desktop application (Tauri + Next.js webview + sidecar daemon)
│   ├── mobile/            # Mobile clients (Native Android APK + iOS Xcode project)
│   ├── website/           # Official marketing website, docs, and download portal (Vercel)
│   ├── dashboard/         # Real-time telemetry, session inspector, and cloud sync console
│   ├── src-tauri/         # Native desktop configuration and Tauri runtime pointers
│   ├── scripts/           # Packaging, signing, and distribution scripts
│   ├── tests/             # End-to-end acceptance tests, visual QA, and artifact verifiers
│   ├── distribution/      # Winget and packaging distribution manifests
│   ├── docs/              # Comprehensive technical specifications, audits, and guides
│   ├── build-artifacts/   # Verified native installers, standalone ZIPs, and APKs
│   └── dist-release/      # Historical release archives
│
├── .github/               # CI/CD workflows (release builds, QA, testing pipelines)
├── .gitignore             # Root repository ignore rules
├── CONTRIBUTING.md        # Contribution guidelines
├── LICENSE                # Apache 2.0 open-source license
├── NOTICE.md              # Upstream copyright and attribution notices
└── README.md              # Repository overview (this document)
```

---

## Overview

**OPEN-VERSE** is an open-source autonomous AI coding assistant engineered for cross-device development workflows. It inspects workspaces, edits files, executes terminal commands, and coordinates complex programming tasks across your devices.

- **Cross-Platform Parity**: Available on Windows (x64 NSIS setup & standalone ZIP), Android (native signed APK), Linux (Debian `.deb` & RPM), macOS, and Web.
- **Autonomous Local Engine**: High-performance local runtime managing session execution, persistent context, tool sandboxing, and inter-process communication.
- **In-App Automatic Updates**: Cryptographically verified background updates using Minisign for desktop and native `PackageInstaller` on Android.
- **Privacy-First Isolation**: Independent workspace state and session data persisted in `~/.openverse` with strict sandboxing.
- **Unified Release Pipeline**: Synchronized release coordination ensuring consistent versioning (`v3.0.0`) across all endpoints.

---

## Supported Platforms (v3.0.0)

| Platform | Distribution Channel | Installer / Package | Auto-Update Mechanism |
| :--- | :--- | :--- | :--- |
| **Windows** | Direct Download | `OPEN-VERSE_3.0.0_x64-setup.exe` | Tauri v2 Minisign Signed Feed |
| **Windows (Portable)**| Standalone ZIP | `OPEN-VERSE_3.0.0_x64-windows.zip` | Manual / In-App Updater |
| **Android** | Website / Direct APK | `open-verse-mobile.apk` | Native `PackageInstaller` Intent Bridge |
| **Linux (Deb)** | Direct Download | `OPEN-VERSE_3.0.0_amd64.deb` | Tauri In-App Updater |
| **macOS** | Direct Download | `OPEN-VERSE_3.0.0_universal.dmg` | Tauri In-App Updater |
| **Web** | Cloud Portal | [open-verse-website.vercel.app](https://open-verse-website.vercel.app) | Continuous Deployment (Vercel) |
| **iOS** | Preview | TestFlight | Apple TestFlight Distribution |

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

# 2. Build desktop application
cd open-verse/desktop
bun install
bun run build:sdk
cd apps/examples/desktop-app
bun run build

# 3. Build website
cd ../../../../open-verse/website
bun install
bun run build

# 4. Run release verification
cd ../../open-verse
bun run tests/verify-all-release-artifacts.ts
```

---

## Testing & Verification

Run the automated verification test suites:

```bash
cd open-verse

# Windows installer launch acceptance test
powershell -ExecutionPolicy Bypass -File tests/windows-installer-launch-acceptance.ps1

# Cross-platform release artifact verification
bun run tests/verify-all-release-artifacts.ts

# Visual QA suite across viewports
cd tests/visual-qa && bun run index.ts
```

---

## License & Attribution

OPEN-VERSE is open-source under the Apache License, Version 2.0. See [LICENSE](LICENSE) for terms.
Derived and integrated components from upstream projects are maintained in `sources/` and documented in [NOTICE.md](NOTICE.md) and [sources/README.md](sources/README.md).
