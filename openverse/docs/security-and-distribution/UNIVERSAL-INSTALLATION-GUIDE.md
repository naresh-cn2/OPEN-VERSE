# OPEN-VERSE — Universal Native Application Installation & Security Guide

**Document:** `docs/security-and-distribution/UNIVERSAL-INSTALLATION-GUIDE.md`  
**Applicable Version:** v0.2.6+  
**Official Distribution Portal:** [https://open-verse-website.vercel.app](https://open-verse-website.vercel.app)  
**Security Policy:** Zero Operating System Security Degradation (Never disable Windows Defender, Smart App Control, or macOS Gatekeeper)

---

## 1. Product Architectural Model

OPEN-VERSE is engineered as a **genuine, native, platform-specific application** across all supported environments:
- **Windows:** Native 64-bit desktop application with embedded agent runtime and WebView2 UI.
- **Android:** Native Android application package (APK) with Direct AI SSE streaming and desktop pairing.
- **macOS:** Native Apple Silicon desktop application (`.dmg` disk image).
- **iOS:** Native Swift application container (`.xcodeproj`) with deep-link OAuth handling and desktop pairing.
- **Linux:** Native distribution packages (`.deb` for Debian/Ubuntu, `.rpm` for Fedora/RHEL, and universal `.AppImage`).

Each application launches the actual local OPEN-VERSE runtime with encrypted credential storage, local tool execution, and cross-device conversation synchronization.

---

## 2. Platform Installation Guides

### 1. Windows 10 / 11 (Native Desktop)

#### Official Release Artifacts:
- **NSIS Installer:** `OPEN-VERSE_0.2.6_x64-setup.exe` (167.6 MB)
- **Archive Package:** `OPEN-VERSE_0.2.6_x64-windows.zip` (167.6 MB)
- **Minisign Signature:** `OPEN-VERSE_0.2.6_x64-setup.exe.sig` (440 bytes)
- **Architecture:** 64-bit Intel / AMD (x86_64)

#### Installation Steps:
1. Download `OPEN-VERSE_0.2.6_x64-setup.exe` from the [Official Release Portal](https://open-verse-website.vercel.app#download).
2. If downloading via Microsoft Edge or Google Chrome, the browser may display a download reputation warning (*"OPEN-VERSE_0.2.6_x64-setup.exe isn't commonly downloaded"*):
   - In Edge: Hover over the paused download &rarr; click **•••** (More options) &rarr; click **Keep** &rarr; click **Show more** &rarr; click **Keep anyway**.
   - In Chrome: Click **Downloads** &rarr; click **Keep dangerous file** (or **Download anyway**).
3. Double-click `OPEN-VERSE_0.2.6_x64-setup.exe` to run the installer.
4. Follow the setup wizard to complete installation.
5. Launch OPEN-VERSE from the Windows Start Menu or Desktop shortcut.

#### Command-Line Installation via Windows Package Manager (winget):
```powershell
# Install from official manifest:
winget install --manifest distribution/windows/winget/manifests/o/OpenVerse/OpenVerse/0.2.6/
```

#### Understanding Windows SmartScreen and Smart App Control (SAC):

##### A. Microsoft Defender SmartScreen (Evaluation or Standard Mode)
- **Prompt:** *"Windows protected your PC — Microsoft Defender SmartScreen prevented an unrecognized app from starting."*
- **Cause:** Fresh release binaries that have not yet accumulated cloud download volume in Microsoft's telemetry database.
- **Legitimate Resolution:**
  1. Click the underlined link: **"More info"**.
  2. Click the button: **"Run anyway"**.
  *(Windows registers your choice; subsequent launches will open directly).*

##### B. Microsoft Smart App Control (SAC Enforced Mode)
- **Prompt:** *"An Application Control policy has blocked this file."* (Windows Event Log: **Event ID 3118 & 3077**).
- **Cause:** Windows 11 Smart App Control in Enforced mode (`VerifiedAndReputablePolicyState = 1` in `HKLM:\SYSTEM\CurrentControlSet\Control\CI\Policy`) enforces kernel Code Integrity (`ci.dll`). Unsigned executables (`.exe` or `.dll`) lacking an enterprise Authenticode signature from a Microsoft-trusted Certificate Authority are intercepted and blocked.
- **Forensic Finding regarding ZIP packages:** Extracting `OPEN-VERSE_0.2.6_x64-windows.zip` does **not** bypass SAC because the archive contains the setup executable, which remains unsigned with Authenticode.
- **Legitimate External Requirement:** True zero-warning execution under Smart App Control Enforced mode requires enrollment in **Microsoft Azure Trusted Signing ($9.99/month)** or **Microsoft Store (MSIX) ingestion ($19 one-time)**. The repository contains ready-to-use signing scripts in `distribution/windows/sign-windows-authenticode.ps1` and `distribution/windows/package-msix.ps1`.
- **Safety Directive:** Never disable Smart App Control or Windows Defender to install any software.

---

### 2. Android (Native APK Companion)

#### Official Release Artifacts:
- **Direct APK:** `open-verse-mobile.apk` (10,460,061 bytes)
- **Versioned APK Mirror:** `open-verse-v0.2.6-android.apk` (10,460,061 bytes)
- **Package Identifier:** `ai.openverse.mobile` (versionCode=8, versionName="0.2.6")
- **Target Platform:** Android 7.0 through Android 14 (API Level 24 to 34, ARM64 & x86_64)

#### Cryptographic Signature Verification:
The release APK is cryptographically signed using **APK Signature Scheme v2 (RSA-2048)**:
- **Signer DN:** `CN=OPEN-VERSE Mobile, OU=Release, O=OPEN-VERSE, C=US`
- **SHA-256 Certificate Fingerprint:** `d34f4df7096e7b7830570d7c13a4ef5ee7f83151c9f45ebcd5bd10e0ee1eb76a`
- **Integrity Digest:** `187dd7216b36d31f32340c129b8555cad56aa206b3de4cf003f4151badc2b955`
- Matches official domain asset links: `/.well-known/assetlinks.json`.

#### Sideloading Installation Steps:
1. On your Android device, navigate to [https://open-verse-website.vercel.app](https://open-verse-website.vercel.app#download).
2. Tap **Download Android APK (v0.2.6)**.
3. If Chrome prompts *"File might be harmful. Do you want to download open-verse-mobile.apk anyway?"*, tap **Download anyway**.
4. Once downloaded:
   - Tap **Open** from the download banner.
   - Or open your device's **Files** app &rarr; **Downloads** &rarr; tap `open-verse-mobile.apk`.
5. If Android prompts *"For your security, your phone is not allowed to install unknown apps from this source"*:
   - Tap **Settings**.
   - Enable **"Allow from this source"**.
   - Tap the Back button.
6. Tap **Install**.
7. If Google Play Protect displays *"Blocked by Play Protect — Unrecognized app developer"*:
   - Tap **"More details"** &rarr; tap **"Install anyway"**.
8. Tap **Open** to launch OPEN-VERSE.

#### In-Place Updates:
Because all subsequent releases are signed with the identical release keystore, downloading and tapping a newer APK installs seamlessly over the existing app, preserving all user conversations and settings.

#### External Requirement for Store Distribution:
Direct APK distribution is fully functional. Official distribution via the Google Play Store requires a **Google Play Console Developer Account ($25 one-time registration fee)**.

---

### 3. Linux (Native DEB, RPM & AppImage)

#### Official Release Artifacts:
- **Debian / Ubuntu Package:** `OPEN-VERSE_0.2.0_amd64.deb` (239.1 MB, SHA-256: `ab5777a7c571...`)
- **Fedora / RHEL Package:** `OPEN-VERSE-0.2.0-1.x86_64.rpm` (239.1 MB, SHA-256: `90dd67b89c31...`)
- **Minisign Signatures:** `.deb.sig` and `.rpm.sig`
- **Metadata:** AppStream XML validated in `distribution/linux/ai.openverse.desktop.metainfo.xml`

#### Debian / Ubuntu / Linux Mint Installation:
```bash
# 1. Download the Debian package
wget https://github.com/naresh-cn2/OPEN-VERSE/releases/download/desktop-latest/OPEN-VERSE_0.2.0_amd64.deb

# 2. Install using dpkg
sudo dpkg -i OPEN-VERSE_0.2.0_amd64.deb

# 3. Resolve any runtime dependencies
sudo apt-get install -f

# 4. Launch
cline-app
```

#### Fedora / RHEL / openSUSE Installation:
```bash
# Install using dnf
sudo dnf localinstall OPEN-VERSE-0.2.0-1.x86_64.rpm

# Or using rpm directly
sudo rpm -ivh OPEN-VERSE-0.2.0-1.x86_64.rpm
```

---

### 4. macOS (Native Apple Silicon & Intel)

#### Official Release Artifacts:
- **Apple Silicon Disk Image:** `OPEN-VERSE_0.2.0_aarch64.dmg` (172.8 MB)
- **Target OS:** macOS 11.0 Big Sur or later (Apple Silicon M1/M2/M3/M4)

#### Installation Steps:
1. Download `OPEN-VERSE_0.2.0_aarch64.dmg` from the release portal.
2. Double-click the `.dmg` file to mount the disk image.
3. Drag the **OPEN-VERSE** application icon into your **Applications** folder.
4. Eject the disk image.

#### Apple Gatekeeper & Notarization Notice:
- **Gatekeeper Behavior:** Community builds are ad-hoc signed and lack an official Apple Developer ID certificate and Notarization ticket. When opening the downloaded application for the first time, macOS Gatekeeper displays: *"OPEN-VERSE cannot be opened because the developer cannot be verified."*
- **Legitimate External Requirement:** Permanent, zero-warning installation under Apple Gatekeeper requires an active **Apple Developer Program enrollment ($99/year)**. The application can then be signed with `codesign -s "Developer ID Application: ..."` and notarized via `xcrun notarytool submit`.
- **Community / Developer Launch Procedure:**
  1. Open **Finder** and navigate to **Applications**.
  2. **Right-click (or Control-click)** on `OPEN-VERSE.app`.
  3. Select **Open** from the context menu.
  4. In the dialog, click **Open** (or **Open Anyway**).
  *(macOS permanently remembers this approval for your user account).*
  - Alternatively, in Terminal: `xattr -cr /Applications/OPEN-VERSE.app`.

---

### 5. iOS / iPadOS (Native Swift Application)

#### Official Release Artifacts:
- **Native Xcode Project:** `mobile/ios/OPEN-VERSE.xcodeproj`
- **Application Runtime:** Native Swift container, `WKWebView` application bridge, Google OAuth deep-link handler (`openverse://auth/callback`), and Desktop Hub pairing.
- **Target Architecture:** iOS 15.0+ (ARM64)

#### Distribution Channels & External Requirements:
- **Public Beta Channel (Apple TestFlight):**
  - Distributing native iOS apps to end users via Apple TestFlight strictly requires an active **Apple Developer Program membership ($99/year)** to generate Apple-signed provisioning profiles and upload builds via Xcode / App Store Connect.
  - Users can join the public TestFlight waitlist queue via [GitHub Issue Request](https://github.com/naresh-cn2/OPEN-VERSE/issues/new?title=iOS+TestFlight+Beta+Invite+Request).
- **Local Developer Compilation (Xcode):**
  1. Clone the repository on a Mac.
  2. Open `mobile/ios/OPEN-VERSE.xcodeproj` in Xcode 15+.
  3. Under **Signing & Capabilities**, select your personal Apple ID (free Apple Developer account).
  4. Select your connected iPhone or iPad and press **Run (⌘R)**.
- **Community Sideloading:**
  - Sideload compiled unsigned IPAs onto physical devices using AltStore, SideStore, or Sideloadly with a free personal Apple ID (7-day re-signing cycle).

---

## 3. Platform Forensic Acceptance Matrix

| Platform | Native Artifact | Cryptographic Signature | Download Verified | Installation Verified | Runtime Verified | Operational Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Windows** | `OPEN-VERSE_0.2.6_x64-setup.exe` (167.6 MB) | Minisign ED25519 (`.sig`) | **PASS** (HTTP 200) | **BLOCKED** *(SAC Enforced)* / **PASS** *(Standard)* | **PASS** *(Runtime Engine)* | **BLOCKED BY EXTERNAL REQUIREMENT** *(Requires Azure Trusted Signing $9.99/mo for SAC)* |
| **Android** | `open-verse-mobile.apk` (10.0 MB) | Scheme v2 (RSA-2048) | **PASS** (HTTP 200) | **PASS** *(Emulator API 34)* / **NOT TESTED** *(USB)* | **PASS** *(OAuth Callback & AI)* | **PASS** *(Sideloading Verified)* / **BLOCKED** *(Play Store requires $25 one-time)* |
| **Linux** | `OPEN-VERSE_0.2.0_amd64.deb` (239.1 MB) | Minisign ED25519 (`.sig`) | **PASS** (HTTP 200) | **PASS** *(CI Ubuntu 24.04)* / **NOT TESTED** *(Bare Metal)* | **PASS** *(Engine)* | **PASS** *(Package Verified)* |
| **macOS** | `OPEN-VERSE_0.2.0_aarch64.dmg` (172.8 MB) | Ad-hoc / Unnotarized | **PASS** (HTTP 200) | **BLOCKED** *(Gatekeeper)* / **PASS** *(Right-Click)* | **PASS** *(Engine)* | **BLOCKED BY EXTERNAL REQUIREMENT** *(Requires Apple Developer ID $99/yr for Notarization)* |
| **iOS** | `mobile/ios/OPEN-VERSE.xcodeproj` (Swift) | Provisioning Profile | **PASS** (Git Source) | **BLOCKED** *(Requires Apple Profile)* | **PASS** *(Xcode Simulator)* | **BLOCKED BY EXTERNAL REQUIREMENT** *(Requires Apple Developer Program $99/yr for TestFlight/Store)* |

---

## 4. Summary of Commercial Requirements for Zero-Prompt Distribution

| Platform | Security Gate | Required Credential / Service | Exact Cost | Pipeline Preparedness |
| :--- | :--- | :--- | :--- | :--- |
| **Windows 11** | Smart App Control (SAC) Code Integrity | Microsoft Azure Trusted Signing | $9.99 / month | `distribution/windows/sign-windows-authenticode.ps1` ready |
| **Windows 10/11** | SmartScreen Reputation & SAC | Microsoft Partner Center (Store MSIX) | $19 one-time | `distribution/windows/package-msix.ps1` ready |
| **macOS** | Apple Gatekeeper Quarantine | Apple Developer Program (Developer ID) | $99 / year | `desktop-macos-build.yml` ready |
| **iOS** | iOS Code Signing & Provisioning | Apple Developer Program (TestFlight / Store) | $99 / year | `mobile-ios.yml` ready |
| **Android** | Google Play Protect & Catalog | Google Play Console | $25 one-time | Keystore & `mobile-android.yml` ready |

---

*Authored by OPEN-VERSE Release Engineering & Application Security Team.*
