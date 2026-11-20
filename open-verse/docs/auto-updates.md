# Automatic Updates Architecture & Troubleshooting

This document explains the technical architecture, cryptographic verification, feeds, and error handling of the automatic update subsystem in OPEN-VERSE.

---

## 1. Architectural Philosophy

OPEN-VERSE implements **cryptographically authenticated, in-place automatic updates** designed to:
1. Prevent update loops (where devices repeatedly download an update without advancing version).
2. Protect against supply-chain tampering via public-key cryptography (Minisign Ed25519) and SHA-256 integrity checks.
3. Eliminate reliance on manual browser downloads after initial installation.

---

## 2. Desktop Auto-Update Flow (Windows / macOS / Linux)

The Desktop updater is powered by Tauri v2 Updater:

```
[Installed App v0.2.2]
       │
       ▼ (1) Polls updater feed
[https://github.com/.../desktop-latest/latest.json]
       │
       ▼ (2) Evaluates target version (0.2.3 > 0.2.2)
[Downloads OPEN-VERSE_0.2.3_x64-setup.exe]
       │
       ▼ (3) Verifies Minisign Signature using embedded pubkey
[Signature Verified: Valid Ed25519 Payload]
       │
       ▼ (4) Executes NSIS installer in silent mode with RestartManager
[Processes Stopped -> Files Replaced -> Relaunches v0.2.3]
```

### Cryptographic Configuration
- **Public Key** (`src-tauri/tauri.conf.json`):
  `dW50cnVzdGVkIGNvbW1lbnQ6IG1pbmlzaWduIHB1YmxpYyBrZXk6IDRENUJENEE1ODRBQ0QzQzMKUldURDA2eUVwZFJiVGJmWjduOFk4VTBnVTVLL2pDRWJLV3lySXlEeHlXRThZTEVCMGorQ0ZMTUcK`
- **Signature verification**: Performed natively in Rust before any disk execution. Corrupt or unverified binaries are discarded immediately.

---

## 3. Mobile Auto-Update Flow (Android)

Android updates utilize a native bridge to the Android OS `PackageInstaller`:

```
[Installed App v0.2.2 (code: 4)]
       │
       ▼ (1) Queries https://open-verse-website.vercel.app/api/releases/latest
[Manifest returns version 0.2.3 (code: 5)]
       │
       ▼ (2) Stream downloads APK to internal cache: context.cacheDir/openverse-updates/
[Validates SHA-256 Checksum against manifest]
       │
       ▼ (3) Validates APK signature continuity & archive versionCode
[Constructs Scoped FileProvider URI: content://ai.openverse.mobile.fileprovider/...]
       │
       ▼ (4) Launches Intent: Intent.ACTION_VIEW (application/vnd.android.package-archive)
[System PackageInstaller Prompt -> User taps 'Update' -> App Upgrades to v0.2.3]
```

### Protection Against Update Loops
In earlier versions, apps could enter a download cycle if the running webview failed to read the underlying native version. The repair guarantees:
1. Native `OpenVerseWebAppInterface.getAppVersion()` queries Android `PackageManager.getPackageInfo(packageName, 0).versionName` dynamically.
2. `archiveVersionCode == currentCode` immediately suppresses downloads and logs `Application is already up to date.`

---

## 4. Verification Test Suites

Two dedicated automated test suites ensure no regressions in update behavior:

- **`tests/e2e-cross-device-updater-repair.ts`**: Verifies NSIS pre-install file checks, manifest structure, and checksum agreement across API, public JSON, and UI.
- **`tests/e2e-android-auto-update-lifecycle.ts`**: Simulates the end-to-end upgrade lifecycle on a real emulator, checking `PackageManager` states before, during, and after native PackageInstaller interactions.

