# OPEN-VERSE Product Core (`open-verse/`)

This directory contains the complete source code, applications, build pipelines, integration layers, and testing suites that comprise the **OPEN-VERSE** unified AI platform.

---

## Architecture Overview

```text
open-verse/
├── desktop/         # Native cross-platform desktop application (Tauri + React + Sidecar)
├── mobile/          # Native mobile applications (Android Gradle + iOS Xcode + React UI)
├── website/         # Official product landing, documentation, and universal download portal
├── dashboard/       # Management console, agent swarm telemetry, and cloud sync dashboard
├── src-tauri/       # Tauri desktop configuration and native bridge references
├── scripts/         # Automated release packaging, verification, and QA automation scripts
├── tests/           # Integration tests, visual QA, and launch acceptance test suites
├── distribution/    # Distribution manifests (Windows Winget, packaging metadata)
├── docs/            # Product architecture specifications, audits, and release reports
├── build-artifacts/ # Verified native installation binaries, installers, and updater signatures
└── dist-release/    # Historical release distributions
```

---

## Major Subsystems & Components

### 1. Desktop Application (`desktop/`)
- **Tauri Native Host**: Lightweight Rust host process managing OS windows, system tray, notifications, deep linking (`openverse://`), and auto-updates.
- **Frontend Webview (`desktop/apps/examples/desktop-app/webview/`)**: Next.js 16 + React 19 UI providing chat composer, agent inspector, file viewer, and settings.
- **Sidecar Runtime (`desktop/apps/examples/desktop-app/sidecar/`)**: Bun-powered local daemon handling terminal execution, filesystem operations, MCP servers, and LLM provider streaming.
- **SDK & Packages (`desktop/sdk/packages/`)**: Modular packages for `@cline/core`, `@cline/agents`, `@cline/llms`, `@cline/ui`, and `@cline/shared`.

### 2. Mobile Applications (`mobile/`)
- **Android (`mobile/android/`)**: Native Android app with WebView container, hardware acceleration, AndroidInterface bridge, and release keystore signing.
- **iOS (`mobile/ios/`)**: Native Xcode workspace, Capacitor/WebKit wrapper, and simulator/TestFlight archive targets.

### 3. Official Website & Download Portal (`website/`)
- **Framework**: Vite + React 19 + TypeScript + Tailwind CSS deployed to Vercel.
- **Download Center**: Direct downloads for Windows x64 setup (`.exe`), standalone ZIP (`.zip`), and Android native APK (`.apk`), complete with SHA-256 verification and Minisign signatures.
- **Identity & Updater API**: Serverless routes (`/api/auth/authorize`, `/api/releases/latest`, `/latest.json`) providing OAuth redirection and in-app updater manifests.

### 4. Telemetry & Agent Dashboard (`dashboard/`)
- **Role**: Lightweight operational console monitoring agent sessions, token usage, tool invocations, and live system metrics.

### 5. Tests & Quality Assurance (`tests/`)
- **Visual QA (`tests/visual-qa/`)**: Playwright automation suite capturing multi-viewport screenshots across desktop, tablet, and mobile displays.
- **Acceptance Suites**: End-to-end Windows installer validation (`windows-installer-launch-acceptance.ps1`), cross-device continuity, and release verification (`verify-all-release-artifacts.ts`).

---

## Development & Build Workflow

### Prerequisites
- **Node.js** >= 22 & **Bun** >= 1.4.2
- **Rust** & **Cargo** (for Tauri desktop builds)
- **Android SDK** (for Android APK generation)

### Quick Start Commands
```bash
# Desktop application development
cd open-verse/desktop
bun install
bun run dev:web

# Website development
cd open-verse/website
bun install
bun run dev

# Run release verification
cd open-verse
bun run tests/verify-all-release-artifacts.ts
```
