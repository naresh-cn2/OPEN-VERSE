# Changelog

All notable changes to the OPEN-VERSE project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [0.2.3] - 2026-11-12

### Added
- **Universal Multi-Platform Release Coordination**: Unified GitHub Actions workflow managing synchronized releases across Windows, Android, and Web.
- **Native Android PackageInstaller Bridge**: Replaced manual sideloading with automated in-app download and native system `PackageInstaller` intent execution (`ai.openverse.mobile.fileprovider`).
- **Cryptographic Minisign Verification**: Windows NSIS setup installers and updater bundles signed with Minisign (`.sig`) and verified against the public key before staging.
- **Monotonic Version Protection**: Enforced strict `versionCode` monotonicity checks on Android (`versionCode 5`) and semver checks on Desktop to block downgrade attacks.
- **Automated Verification Suites**:
  - `tests/e2e-android-auto-update-lifecycle.ts`: 23 automated UIAutomator and PackageManager verification checks on Android.
  - `tests/e2e-cross-device-updater-repair.ts`: 21 integrity and manifest synchronization tests.

### Fixed
- **Windows Update Detection**: Pointed rolling `desktop-latest` feed to the verified `v0.2.3` release payload and signature.
- **Android Update Loop**: Resolved recursive APK re-download loops by persisting installed `versionCode` and suppressing updates when the local version matches the release manifest.
- **Website Download Center**: Synchronized official SHA-256 checksums (`7d32a4ba...` for Windows, `950aba4b...` for Android).

---

## [0.2.2] - 2026-11-11

### Added
- Scoped internal cache directory for Android APK staging.
- NSIS installer pre-execution checks guarding file replacement.

### Fixed
- Process termination guards during desktop installation.
- Android 11+ `<queries>` package visibility entries for system package installers.

---

## [0.2.1] - 2026-11-10

### Added
- Rolling release tag `desktop-latest` for Tauri desktop updater discovery.
- Cross-platform release manifest schema (`open-verse-releases.json`).

### Fixed
- Tauri updater manifest endpoint URL configuration.

---

## [0.2.0] - 2026-10-31

### Added
- Initial multi-platform release baseline for Windows, Android, macOS, Linux, and Web.
- Core local AI assistant runtime engine.
- Profile and session isolation directory structure (`~/.openverse`).

