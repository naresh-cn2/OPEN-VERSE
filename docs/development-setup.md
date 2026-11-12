# Development Environment Setup

This guide walks through configuring a local development environment to build, run, and test OPEN-VERSE across all components.

---

## 1. Prerequisites

Ensure your development machine has the following tools installed:

### Required for All Platforms
- **Bun**: v1.1.0 or newer ([bun.sh](https://bun.sh))
- **Node.js**: v20 LTS or v22 ([nodejs.org](https://nodejs.org))
- **Git**: v2.30+ ([git-scm.com](https://git-scm.com))

### Required for Desktop (Tauri)
- **Rust**: Stable toolchain (`rustc`, `cargo`) via [rustup.rs](https://rustup.rs)
- **Build Tools**:
  - *Windows*: Visual Studio Build Tools with C++ workload
  - *macOS*: Xcode Command Line Tools (`xcode-select --install`)
  - *Linux*: `build-essential`, `libwebkit2gtk-4.1-dev`, `libappindicator3-dev`, `librsvg2-dev`

### Required for Mobile (Android)
- **Android Studio / Android SDK**: API Level 34, Android Build Tools 34.0.0
- **JDK**: Java Development Kit 17 (OpenJDK or Temurin)

---

## 2. Cloning & Initializing

```bash
# Clone the repository
git clone https://github.com/naresh-cn2/OPEN-VERSE.git
cd OPEN-VERSE

# Copy environment template
cp .env.example .env
```

---

## 3. Desktop Application Development

### Step 1: Install Dependencies and Build Core SDK Packages

```bash
cd desktop
bun install
bun run build:sdk
```

This compiles:
- `@cline/shared`
- `@cline/core`
- `@cline/sdk`
- `@cline/llms`
- `@cline/agents`

### Step 2: Build the Desktop Backend

```bash
cd apps/examples/desktop-app
bun run build:backend
```

### Step 3: Run the Desktop Development App

```bash
bun run dev
```

This launches the Next.js webview dev server and attaches the Tauri 2 native window shell.

---

## 4. Mobile (Android) Development

```bash
cd mobile/android

# Build debug APK
./gradlew assembleDebug

# Install on attached device or emulator
adb install -r app/build/outputs/apk/debug/app-debug.apk
```

---

## 5. Website & Release Portal Development

```bash
cd website
bun install
bun run dev
```

Open `http://localhost:3000` to preview the production website, documentation, and download center.

---

## 6. Running Tests

```bash
# Cross-platform manifest consistency and updater test
bun run tests/e2e-cross-device-updater-repair.ts

# Android package installer lifecycle test (requires running emulator)
bun run tests/e2e-android-auto-update-lifecycle.ts
```
