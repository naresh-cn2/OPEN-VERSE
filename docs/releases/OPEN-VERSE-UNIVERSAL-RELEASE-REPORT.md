# OPEN-VERSE Universal Release Report — v0.2.8

## Executive Summary

- **Authoritative Version**: `v0.2.8` (Desktop v0.2.8, Android v0.2.8 / versionCode 10, iOS v0.2.8 / build 10)
- **Release Date**: November 20, 2026
- **Release Tag**: `v0.2.8`
- **Rolling Feed**: `desktop-latest`
- **Official Portal**: https://open-verse-website.vercel.app/download
- **Key Highlights**:
  - Pure Google Sign-In with native account selection and automatic browser dispatch.
  - "Continue as Guest" offline bypass completely eliminated from opening and onboarding screens.
  - Interactive pre-login and in-app background updater enabled.
  - Complete white-label brand unification (all residual Cline references removed).
  - Canonical cross-platform checksum verification and digital signature manifest synchronization.

---

## Universal Platform Release Matrix

| Platform | Target Package | Version / Build | File Size | SHA-256 Checksum | Signature Status | Distribution Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Windows 10/11 (x64)** | `OPEN-VERSE_0.2.8_x64-setup.exe` | 0.2.8 | 129.29 MB (135,566,412 B) | `481d43089055d8bfdc1f5c67f894814ece88078503a46eb90c286db15579d4dc` | Minisign ed25519 (`.sig`) | **VERIFIED & LIVE** |
| **Windows Standalone** | `OPEN-VERSE_0.2.8_x64-windows.zip` | 0.2.8 | 129.31 MB (135,586,734 B) | `0a875ab71b13f3659a5be7d4527f862163e8a41736ae2c27725a5b7786e8a31c` | ZIP archive of setup payload | **VERIFIED & LIVE** |
| **Android Mobile** | `open-verse-v0.2.8-android.apk` | 0.2.8 (10) | 10.60 MB (11,115,525 B) | `623410f27b0409f11fb3c4c73d34cc2efc2be1e6407c429920777bc550454960` | Android Release Keystore | **VERIFIED & LIVE** |
| **Android Canonical** | `open-verse-mobile.apk` | 0.2.8 (10) | 10.60 MB (11,115,525 B) | `623410f27b0409f11fb3c4c73d34cc2efc2be1e6407c429920777bc550454960` | Android Release Keystore | **VERIFIED & LIVE** |
| **Linux (x64)** | `.deb` / `.rpm` packages | 0.2.8 | ~95 MB | Manifest synced | SHA-256 published | **CI PIPELINE READY** |
| **macOS (Universal)** | `OPEN-VERSE-0.2.8-universal.dmg` | 0.2.8 | ~110 MB | Manifest synced | Ad-hoc signature | **BLOCKED (Developer ID)** |
| **iOS Mobile** | Xcode Archive / TestFlight | 0.2.8 (10) | N/A | Local build verified | iOS Team signing | **BLOCKED (Apple Dev Team)** |

---

## Authentication & User Interface Parity Audit

### 1. Opening Screen Simplification
- **Removed**: "Continue as Guest" offline bypass button has been completely excised from the opening authentication modal, component tree, and unit tests.
- **Retained**:
  1. **Continue with Google**: Primary call to action with Google branding, initiating the standard OAuth 2.0 PKCE / OIDC flow via the user's default system browser.
  2. **In-App Updater / "Check for Updates"**: Displays current status ("App is up to date" or "v0.2.8 ready!"). If an update is detected, users can restart directly to apply.
  3. **Terms of Service & Privacy Policy**: Standard compliant legal links in the footer.

### 2. Loading State Optimization
- Clicking "Continue with Google" launches the system browser and dispatches the authorization URL.
- The button loading spinner resets after 4 seconds to prevent permanent UI lockup if the user switches back to the application or if browser popups were blocked.

---

## Verified Artifact Endpoints & Hashes

### Windows Installer (x64)
- **File**: `OPEN-VERSE_0.2.8_x64-setup.exe`
- **SHA-256**: `481d43089055d8bfdc1f5c67f894814ece88078503a46eb90c286db15579d4dc`
- **Updater Signature**: `OPEN-VERSE_0.2.8_x64-setup.exe.sig`
- **Direct GitHub Release URL**: `https://github.com/naresh-cn2/OPEN-VERSE/releases/download/v0.2.8/OPEN-VERSE_0.2.8_x64-setup.exe`

### Windows Standalone ZIP
- **File**: `OPEN-VERSE_0.2.8_x64-windows.zip`
- **SHA-256**: `0a875ab71b13f3659a5be7d4527f862163e8a41736ae2c27725a5b7786e8a31c`
- **Direct GitHub Release URL**: `https://github.com/naresh-cn2/OPEN-VERSE/releases/download/v0.2.8/OPEN-VERSE_0.2.8_x64-windows.zip`

### Android Native APK
- **File**: `open-verse-v0.2.8-android.apk`
- **SHA-256**: `623410f27b0409f11fb3c4c73d34cc2efc2be1e6407c429920777bc550454960`
- **Direct Website URL**: `https://open-verse-website.vercel.app/open-verse-mobile.apk`
- **Direct GitHub Release URL**: `https://github.com/naresh-cn2/OPEN-VERSE/releases/download/v0.2.8/open-verse-v0.2.8-android.apk`

### Canonical Release Manifests
- **Updater Endpoint**: `https://open-verse-website.vercel.app/latest.json`
- **Platform Matrix JSON**: `https://open-verse-website.vercel.app/open-verse-releases.json`
- **API Release Service**: `https://open-verse-website.vercel.app/api/releases/latest`

---

## Security & Code-Signing Transparency

1. **Windows Authenticode**:
   - The installer is currently unsigned with a commercial EV Authenticode certificate.
   - Windows SmartScreen / Smart App Control may flag the installer as an unverified publisher until an Azure Trusted Signing or EV Code Signing certificate is attached.
   - Tauri's built-in ed25519 Minisign signature is active for all automated updates.

2. **Apple Developer ID & Notarization**:
   - macOS `.dmg` and `.app` bundles require an active Apple Developer Program membership ($99/year) and notarization via `altool` / `notarytool` to bypass Gatekeeper.
   - Ad-hoc builds run locally with `xattr -d com.apple.quarantine`.

3. **Android Keystore**:
   - The Android package is signed using the project release keystore, enabling direct sideloading and compatibility with Android 8.0+.
