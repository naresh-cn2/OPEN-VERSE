# Contributing to OPEN-VERSE

Thank you for your interest in contributing to OPEN-VERSE. This document provides guidelines and workflows for contributing code, documentation, and bug reports.

---

## 1. Code of Conduct

We are committed to providing a welcoming, inclusive, and harassment-free environment for all contributors. Please treat others with respect and professionalism.

---

## 2. Development Prerequisites

To develop and test across platforms, install the following tools:

- **Runtime & Package Managers**:
  - [Bun](https://bun.sh) (v1.1+)
  - [Node.js](https://nodejs.org) (v20+ LTS or v22)
- **Rust Toolchain** (for Desktop Tauri):
  - [Rust](https://rustup.rs) (stable)
- **Android SDK** (for Mobile):
  - Android Studio / Android Command-line Tools (API 34)
  - Java Development Kit (JDK 17)

---

## 3. Development Workflow

### Getting Started

```bash
# 1. Clone your fork
git clone https://github.com/<your-username>/OPEN-VERSE.git
cd OPEN-VERSE

# 2. Install dependencies
bun install

# 3. Create a feature branch
git checkout -b feature/my-new-feature
```

### Running Tests

Before submitting a pull request, run all verification tests:

```bash
# Cross-platform manifest and integrity tests
bun run tests/e2e-cross-device-updater-repair.ts

# Resilience, recovery & log redaction tests
bun run tests/e2e-resilience-and-recovery.ts

# Cross-platform acceptance tests (auth, sync, isolation)
bun run tests/e2e-universal-cross-platform-acceptance.ts

# Android package installer and update lifecycle (requires running emulator/device)
bun run tests/e2e-android-auto-update-lifecycle.ts
```

---

## 4. Definition of Done (DoD)

All pull requests must strictly satisfy the [OPEN-VERSE Definition of Done](docs/definition-of-done.md):
1. **Tests Pass**: Feature-specific tests pass.
2. **No Regressions**: All 4 permanent regression test suites pass without modification or weakening.
3. **Builds Succeed**: Production builds succeed for supported targets.
4. **Parity Maintained**: Cross-device behavior and settings persistence remain consistent.
5. **Documentation Updated**: Version numbers and user guides updated.
6. **Deployments Verified**: Manifests and checksums agree with physical deliverables.

---

## 5. Pull Request Guidelines

1. **Keep PRs focused**: Each pull request should address a single feature, bug fix, or documentation update.
2. **Never commit secrets**: Do not commit API keys, signing certificates, or `.env` files with credentials.
3. **Verify manifests and versions**: If updating version numbers, ensure all platforms (`tauri.conf.json`, `build.gradle.kts`, `open-verse-releases.json`, `latest.ts`) remain synchronized.
4. **Follow commit conventions**: Use conventional commit messages (`feat:`, `fix:`, `docs:`, `chore:`).

