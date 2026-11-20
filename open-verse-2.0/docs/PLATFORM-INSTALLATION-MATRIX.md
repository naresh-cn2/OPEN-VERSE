# PLATFORM-INSTALLATION-MATRIX: Multi-Platform Deployment & Device Audit

This document provides a forensic evaluation of all operating systems, platforms, and device targets supported by the upstream Hermes Agent and adopted into **OPEN-VERSE 2.0**.

Each platform is assessed against the standardized 10-point evaluation criteria.

---

## 1. Platform Evaluation Matrix

### 1.1 Microsoft Windows (Windows 10 / 11, x64 & ARM64)
1. **Does Hermes already support it?** Yes. Windows is a tier-1 supported operating system with dedicated installation scripts and environment automation.
2. **Is there an existing native application?** Yes. The Desktop HUD (`apps/desktop/`) built on Electron + React provides a native Windows desktop experience, along with MSIX packaging (`scripts/bundle-store-msixbundle.mjs`).
3. **Is it a CLI installation?** Yes. Full rich terminal interface via PowerShell, Command Prompt, and Windows Terminal.
4. **Does it use a local or remote agent runtime?** Local runtime by default (spawning local Python and gateway processes); can also connect to remote gateways over WebSocket/ACP.
5. **What dependencies are required?**
   - Windows 10/11 64-bit (Build 19041+)
   - PowerShell 5.1 or PowerShell 7+
   - Python 3.11–3.14 (Hermes downloads an isolated managed Python 3.14.9 runtime automatically)
   - Git for Windows, Ripgrep (downloaded automatically if missing)
   - Node.js 20+ & pnpm (optional, for Desktop HUD compilation)
6. **What installation command or package is provided?**
   - PowerShell one-liner installer: `.\setup-hermes.ps1`
   - Runtime-only flag: `.\setup-hermes.ps1 -RuntimeOnly`
   - MSIX package builder: `node scripts/bundle-store-msixbundle.mjs`
7. **What features are available on that platform?**
   - Full autonomous agent loop, 50+ toolsets, PowerShell/cmd execution, Playwright/Chromium browser automation, GUI computer use (mouse/keyboard), desktop HUD with translucent overlay, gateway daemon, SQLite WAL persistence, automatic updates.
8. **What features are unavailable?**
   - Unix-specific domain socket features fall back to Windows named pipes or local loopback TCP.
9. **What device architecture is supported?** x64 (AMD64 / Intel 64-bit); ARM64 supported via emulation or native Python ARM64 builds.
10. **What prevents installation, if anything?**
    - Windows job-object sandbox constraints (addressed in OPEN-VERSE 2.0 via `windows_detach_flags_without_breakaway` in `hermes_cli/gateway_runtime_start.py`).
    - PowerShell execution policy (`Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass` required for unsigned scripts).

---

### 1.2 Linux Distributions (Ubuntu, Debian, Fedora, Arch, NixOS, etc.)
1. **Does Hermes already support it?** Yes. Linux is a tier-1 supported operating system across desktop, headless server, and containerized environments.
2. **Is there an existing native application?** Yes. Desktop HUD via Electron/Linux AppImage/tar.gz; Debian package via `scripts/package-deb.sh`.
3. **Is it a CLI installation?** Yes. Standard bash/zsh CLI interface.
4. **Does it use a local or remote agent runtime?** Local runtime or remote gateway. Supports systemd user services for headless continuous operation.
5. **What dependencies are required?**
   - Bash, curl, git, tar, coreutils
   - Python 3.11–3.14
   - System libraries: `libffi-dev`, `libssl-dev`, `sqlite3`
   - Playwright dependencies (WebKit/Chromium dependencies for browser automation)
6. **What installation command or package is provided?**
   - Shell installer: `./setup-hermes.sh`
   - Debian package generator: `bash scripts/package-deb.sh`
   - Nix flake: `nix develop` or `nix run`
7. **What features are available on that platform?**
   - All capabilities: autonomous loop, full Bash terminal execution, Unix domain sockets, browser automation, desktop HUD, systemd daemon service, cron execution, MCP servers, subagents.
8. **What features are unavailable?**
   - Windows-specific GUI automation hooks.
9. **What device architecture is supported?** x86_64, aarch64 (ARM64).
10. **What prevents installation, if anything?**
    - Missing C build tools (`build-essential`) on minimal distributions.

---

### 1.3 Apple macOS (macOS 12 Monterey+, Apple Silicon & Intel)
1. **Does Hermes already support it?** Yes. macOS is fully supported as a primary development and desktop target.
2. **Is there an existing native application?** Yes. Desktop HUD application packaged as `.dmg` or `.app` via Electron.
3. **Is it a CLI installation?** Yes. Zsh/bash command line interface with full terminal multiplexing.
4. **Does it use a local or remote agent runtime?** Local runtime; supports `launchd` service agents for background gateway persistence.
5. **What dependencies are required?**
   - macOS 12+
   - Command Line Tools (`xcode-select --install`)
   - Homebrew (recommended for dependencies like `ripgrep`, `node`)
   - Python 3.11–3.14
6. **What installation command or package is provided?**
   - Shell installer: `./setup-hermes.sh`
   - Desktop application build: `cd apps/desktop && pnpm make`
7. **What features are available on that platform?**
   - Full autonomous loop, Zsh terminal execution, Playwright browser automation, native macOS accessibility hooks for GUI computer use, Desktop HUD, launchd persistence, wake-word audio input.
8. **What features are unavailable?**
   - Windows-specific tooling.
9. **What device architecture is supported?** Apple Silicon (ARM64 `arm64`), Intel 64-bit (`x86_64`).
10. **What prevents installation, if anything?**
    - macOS Gatekeeper / signing requirements when building unsigned Electron `.app` bundles locally.

---

### 1.4 Android (Termux Environment Only)
1. **Does Hermes already support it?** Partially: supported **strictly via Termux CLI** on ARM64 devices (`scripts/termux/`). There is **no native Android Java/Kotlin application or APK**.
2. **Is there an existing native application?** **No.** Upstream Hermes contains zero Android Studio projects, APK manifests, or Java/Kotlin mobile application code.
3. **Is it a CLI installation?** Yes. Runs inside the Termux terminal emulation environment.
4. **Does it use a local or remote agent runtime?** Local Python runtime inside Termux, or client connection to a remote OPEN-VERSE 2.0 gateway.
5. **What dependencies are required?**
   - Termux app installed (from F-Droid; Google Play version is obsolete)
   - Termux packages: `python`, `git`, `rust`, `binutils`, `build-essential`, `libsqlite`
   - Storage permissions granted to Termux (`termux-setup-storage`)
6. **What installation command or package is provided?**
   - Termux setup script located in `open-verse-2.0/scripts/termux/setup.sh`
7. **What features are available on that platform?**
   - Core CLI agent loop, text-based reasoning, file operations within Termux storage, remote model provider calls, cron scheduling, terminal commands.
8. **What features are unavailable?**
   - Desktop HUD (Electron not supported on Termux), Chromium/Playwright browser automation (no native headless Chromium package inside standard Termux), GUI computer use, wake-word audio listening.
9. **What device architecture is supported?** `aarch64` (64-bit ARM) strictly; 32-bit ARM is unsupported due to modern Python package wheel limitations.
10. **What prevents installation, if anything?**
    - Termux compilation issues for native wheels (e.g. `pydantic-core` requires Rust toolchain on device).
    - Android OS aggressive background process killing (Doze mode) terminates background tasks unless battery optimizations are disabled.

---

### 1.5 Apple iOS / iPadOS
1. **Does Hermes already support it?** **No. Completely unsupported upstream.**
2. **Is there an existing native application?** **No.** There is no iOS app, Xcode project, Swift code, or TestFlight configuration in upstream Hermes.
3. **Is it a CLI installation?** No. iOS sandboxing prevents executing arbitrary shells or Python interpreters.
4. **Does it use a local or remote agent runtime?** Remote only. Users on iOS interact with OPEN-VERSE 2.0 through external messaging platform bridges:
   - Telegram Bot bridge (`gateway/platforms/telegram.py`)
   - WhatsApp bridge (`gateway/platforms/whatsapp.py`)
   - Discord bot bridge (`gateway/platforms/discord.py`)
   - Web Dashboard accessed via Safari browser.
5. **What dependencies are required?** A remote OPEN-VERSE 2.0 gateway host running on Windows, Linux, macOS, or VPS.
6. **What installation command or package is provided?** None for iOS.
7. **What features are available on that platform?** Conversational chat, task triggering, and status queries relayed via messaging platforms or web browser.
8. **What features are unavailable?** Native local agent execution, local filesystem access, local terminal execution.
9. **What device architecture is supported?** N/A (client messaging only).
10. **What prevents installation, if anything?** Apple App Store guidelines and iOS kernel security prevent running arbitrary user processes and local developer runtimes.

---

### 1.6 Web / Browser Interface
1. **Does Hermes already support it?** Yes. Hermes provides an embedded Web Dashboard served by `hermes_cli/web_server.py` and static assets in `web/`.
2. **Is there an existing native application?** Accessible through any modern web browser (Chrome, Firefox, Safari, Edge).
3. **Is it a CLI installation?** Started via CLI command: `openverse dashboard` or `openverse gateway start --web`.
4. **Does it use a local or remote agent runtime?** Connects to the local or remote gateway server over HTTP and WebSocket.
5. **What dependencies are required?**
   - Modern HTML5 browser with WebSocket support.
   - Gateway daemon active on the host machine.
6. **What installation command or package is provided?**
   - Built into the core package (`hermes_cli/web_server.py`).
7. **What features are available on that platform?**
   - Visual session inspection, live event streaming, kanban task view, project file browsing, diagnostic status.
8. **What features are unavailable?**
   - Direct local OS terminal multiplexing (commands run on the host gateway).
9. **What device architecture is supported?** Architecture-independent (runs in browser).
10. **What prevents installation, if anything?** Network firewall or port binding conflicts on port 9119.

---

### 1.7 Remote Server / VPS / Cloud Deployment
1. **Does Hermes already support it?** Yes. Production-ready headless server deployment is fully supported.
2. **Is there an existing native application?** Headless daemon with REST/WebSocket gateway and systemd integration.
3. **Is it a CLI installation?** Yes. Headless CLI and remote ACP control.
4. **Does it use a local or remote agent runtime?** Local runtime on the VPS; acts as remote gateway for client applications.
5. **What dependencies are required?**
   - Linux VPS (Ubuntu 22.04/24.04, Debian 12, etc.)
   - Python 3.11–3.14
   - Systemd for service management
6. **What installation command or package is provided?**
   - `./setup-hermes.sh`
   - Docker containerization / Daytona / Modal runtime scripts.
7. **What features are available on that platform?**
   - Full 24/7 background agent execution, cron automation, messaging platform bridges (Telegram/Discord/WhatsApp bot daemons), MCP server mounting, multi-client ACP coordination.
8. **What features are unavailable?**
   - GUI desktop HUD (unless X11/Wayland forwarding is configured); GUI mouse/keyboard computer use requires virtual framebuffer (Xvfb).
9. **What device architecture is supported?** x86_64, aarch64.
10. **What prevents installation, if anything?** Port forwarding / reverse proxy configuration for public domain exposure (e.g. Nginx with SSL certs).

---

## 2. Platform Summary Table

| Platform Target | Official Support | Native App? | CLI Install? | Runtime Location | Supported Architecture | Key Delivery Method |
|---|---|---|---|---|---|---|
| **Windows** | Tier 1 | Yes (Desktop HUD + MSIX) | Yes | Local / Remote | x64, ARM64 | `setup-hermes.ps1` |
| **Linux** | Tier 1 | Yes (Desktop HUD + DEB) | Yes | Local / Remote | x86_64, aarch64 | `setup-hermes.sh` / Debian package |
| **macOS** | Tier 1 | Yes (Desktop HUD + DMG) | Yes | Local / Remote | Apple Silicon, Intel | `./setup-hermes.sh` / DMG |
| **Android** | Partial | No (CLI in Termux only) | Yes (Termux) | Local / Remote | aarch64 only | `scripts/termux/setup.sh` |
| **iOS** | None | No (Unsupported upstream) | No | Remote Only | N/A | Messaging Bridges / Web UI |
| **Web / Browser**| Tier 1 | Yes (Web Dashboard) | N/A | Remote Gateway | Independent | Built-in HTTP (port 9119) |
| **Server / VPS** | Tier 1 | Yes (Headless Daemon) | Yes | Local (Serves clients) | x86_64, aarch64 | `setup-hermes.sh`, Docker, systemd |
