# Platform Support & Distribution Matrix

## 1. Comprehensive Platform Support Matrix

| Platform | Minimum OS Version | Architectures | Distribution Format | Signing Mechanism | Status | Notes |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Windows Desktop** | Windows 10 (1903+) / Windows 11 | x86_64 (64-bit Intel/AMD) | NSIS Installer (`.exe`), Standalone Archive (`.zip`) | Minisign Verified (Ed25519); Authenticode pending | **DEVICE TESTED / VERIFIED BUT UNSIGNED** | Dual ZIP package allows zero-warning download in Edge/Chrome. |
| **Windows 11 (SAC Enforced)** | Windows 11 (Build 22621+) | x86_64 | NSIS Installer (`.exe`) | Requires Authenticode with Microsoft root | **BLOCKED** | Machine currently in SAC Evaluation mode. |
| **macOS Desktop** | macOS 11.0 Big Sur+ | ARM64 (Apple Silicon M1-M4) | Disk Image (`.dmg`) | Ad-hoc signed (Preview) | **BUILD VERIFIED / IN PREVIEW** | Apple Developer ID notarization required for Gatekeeper. |
| **Linux Desktop** | Ubuntu 20.04+, Fedora 36+, Debian 11+ | x86_64 | `.deb`, `.rpm`, AppImage | GPG Detached Signatures | **BUILD VERIFIED / IN PREVIEW** | GPG pipeline prepared. AppImage build in development. |
| **Android Mobile** | Android 7.0 (API 24)+ | universal (arm64-v8a, armeabi-v7a, x86_64) | Standalone APK, Android App Bundle (`.aab`) | Android v1 + v2 Scheme (RSA 2048-bit) | **DEVICE TESTED / VERIFIED AND SIGNED** | APK direct install verified; AAB ready for Google Play. |
| **iOS Mobile** | iOS 15.0+ | ARM64 | Progressive Web App (PWA), Native Xcode Archive | Apple Distribution (Required for IPA) | **IN PREVIEW / PRE-TESTFLIGHT** | PWA installable on iPhone via Safari; TestFlight waitlist active. |
| **Web Platform** | Modern Evergreen Browsers | All | Web Application | TLS 1.3 / HTTPS / HSTS | **PRODUCTION RELEASED** | Live on Vercel production edge with strict CSP. |
