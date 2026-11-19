# OPEN-VERSE — Universal Installation and Trust Guide

**Document:** `docs/security-and-distribution/UNIVERSAL-INSTALLATION-GUIDE.md`  
**Applicable Version:** v0.2.6+  
**Official Distribution Portal:** [https://open-verse-website.vercel.app](https://open-verse-website.vercel.app)  
**Security Posture:** Zero OS Security Degradation (Never disable Defender, Smart App Control, or Gatekeeper)

---

## Overview

OPEN-VERSE is designed to run seamlessly as **one unified AI assistant** across all your devices: Windows, Android, Linux, macOS, iOS, and Web. Because modern operating systems enforce strict cryptographic trust and reputation boundaries (such as Windows Smart App Control, SmartScreen, and macOS Gatekeeper), this guide provides the exact, verified steps to install and launch OPEN-VERSE on every platform safely and legitimately.

---

## Platform Quick Navigation

1. [Windows 10 / 11](#1-windows-10--11)
   - [Method A: Progressive Web App (PWA) — Recommended for Zero Warnings](#method-a-progressive-web-app-pwa--recommended-zero-prompts)
   - [Method B: Portable Standalone ZIP](#method-b-portable-standalone-zip)
   - [Method C: Windows Package Manager (winget)](#method-c-windows-package-manager-winget)
   - [Understanding Windows SmartScreen and Smart App Control (SAC)](#understanding-windows-smartscreen-and-smart-app-control-sac)
2. [Android](#2-android)
   - [Direct APK Sideloading](#direct-apk-sideloading)
   - [Google Play Protect Prompts](#google-play-protect-prompts)
   - [Cryptographic Fingerprint Verification](#cryptographic-fingerprint-verification)
   - [Installing Updates Without Data Loss](#installing-updates-without-data-loss)
3. [Linux](#3-linux)
   - [Method A: AppImage (Universal)](#method-a-appimage-universal)
   - [Method B: Debian / Ubuntu (.deb)](#method-b-debian--ubuntu-deb)
   - [Method C: Fedora / RHEL (.rpm)](#method-c-fedora--rhel-rpm)
4. [macOS](#4-macos)
   - [Apple Silicon & Intel (.dmg)](#apple-silicon--intel-dmg)
   - [Navigating Apple Gatekeeper](#navigating-apple-gatekeeper)
5. [iOS / iPadOS](#5-ios--ipados)
   - [Method A: Safari PWA (Home Screen Web App)](#method-a-safari-pwa-home-screen-web-app)
   - [Method B: Apple TestFlight (Beta Channel)](#method-b-apple-testflight-beta-channel)
6. [Cross-Platform Troubleshooting](#6-cross-platform-troubleshooting)

---

## 1. Windows 10 / 11

### Method A: Progressive Web App (PWA) — Recommended (Zero Prompts)

The PWA distribution is the **fastest, most reliable, and 100% security-compliant** method for Windows 10 and 11, particularly on devices where **Smart App Control is Enforced**. It runs inside the operating system's digitally signed browser sandbox, completely bypassing SmartScreen and SAC blocks.

#### Step-by-Step Installation:
1. Open **Microsoft Edge** or **Google Chrome**.
2. Navigate to [https://open-verse-website.vercel.app](https://open-verse-website.vercel.app).
3. Look at the right side of the address bar for the **App Available** / **Install** icon (represented by an app frame with a down-arrow `⊞` or install icon).
4. Click **Install**.
5. When prompted:
   - Check **"Pin to taskbar"**
   - Check **"Pin to Start"**
   - Click **Allow**.
6. **Result:** OPEN-VERSE immediately launches in a clean, borderless standalone desktop window with full keyboard shortcuts, encrypted local session storage, offline caching via ServiceWorker, and instant auto-updates.

---

### Method B: Portable Standalone ZIP

For users who prefer a standalone desktop binary without running an installer setup:

1. Download `OPEN-VERSE_0.2.6_x64-windows.zip` (159.89 MB) from the [Official Portal](https://open-verse-website.vercel.app) or [GitHub Releases](https://github.com/Naresh-chaurasiya/OPEN-VERSE/releases).
2. Right-click the downloaded `.zip` file &rarr; select **Extract All...** &rarr; choose your target destination (e.g., `C:\Users\<Username>\AppData\Local\Programs\OPEN-VERSE` or your personal Tools folder).
3. Open the extracted folder and double-click `OPEN-VERSE.exe`.
4. **Desktop Shortcut:** Right-click `OPEN-VERSE.exe` &rarr; **Show more options** &rarr; **Send to** &rarr; **Desktop (create shortcut)**.

---

### Method C: Windows Package Manager (winget)

For automated command-line installation:

```powershell
# In PowerShell or Windows Terminal:
winget install OpenVerse.OpenVerse
```

To install using the local release manifest:
```powershell
winget install --manifest distribution/windows/winget/manifests/o/OpenVerse/OpenVerse/0.2.6/
```

---

### Understanding Windows SmartScreen and Smart App Control (SAC)

#### What is happening?
On Windows 11, Microsoft introduced **Smart App Control (SAC)**, a kernel-level Code Integrity policy (`ci.dll`). Unlike traditional SmartScreen (which offers a "Run anyway" button), SAC can be in one of three states:
- **Off:** Traditional SmartScreen prompts apply.
- **Evaluation:** SAC silently monitors; SmartScreen dialog displays "More info" &rarr; "Run anyway".
- **Enforced (`VerifiedAndReputablePolicyState = 1`):** Kernel Code Integrity actively blocks any executable (`.exe` or `.dll`) that does not possess an enterprise-level commercial Authenticode signature or established Microsoft cloud reputation (Event IDs 3077 and 3118).

#### If you see Microsoft Defender SmartScreen ("Windows protected your PC"):
1. Click the underlined text: **"More info"**.
2. Click the button: **"Run anyway"**.
*(This prompt appears only on fresh releases before Microsoft's cloud reputation database registers download volume).*

#### If you see Smart App Control ("An Application Control policy has blocked this file"):
- **Do NOT attempt to disable Smart App Control or your antivirus.** Weakening your operating system security is unnecessary and dangerous.
- **Resolution:** Use **Method A (PWA 1-Click Install)**. The PWA operates inside the trusted Microsoft Edge/WebView2 runtime, providing identical desktop functionality with zero security blocks.
- **Enterprise Note:** In-house teams can ingest `distribution/windows/package-msix.ps1` into Microsoft Partner Center or sign with Azure Trusted Signing using `sign-windows-authenticode.ps1`.

---

## 2. Android

### Direct APK Sideloading

The official OPEN-VERSE Android APK is cryptographically signed using **APK Signature Scheme v2** (RSA-2048, SHA-256 fingerprint: `d34f4df7096e7b7830570d7c13a4ef5ee7f83151c9f45ebcd5bd10e0ee1eb76a`), valid through year 2054.

#### Step-by-Step Installation:
1. Open Chrome or your mobile browser on your Android device.
2. Navigate to [https://open-verse-website.vercel.app](https://open-verse-website.vercel.app) and tap **Download Android APK** (or download directly from `/open-verse-mobile.apk`).
3. If prompted by your browser: *"File might be harmful. Do you want to download open-verse-mobile.apk anyway?"*, tap **Download anyway**.
4. Once downloaded, tap **Open** from your notifications or open your device's **Files** app &rarr; **Downloads**.
5. Tap `open-verse-mobile.apk`.
6. **Enabling Unknown App Installation (One-time permission):**
   - If prompted: *"For your security, your phone is not allowed to install unknown apps from this source"*, tap **Settings**.
   - Toggle **"Allow from this source"** to **ON**.
   - Tap the **Back** arrow.
7. Tap **Install**.
8. Once installation finishes, tap **Open**.

---

### Google Play Protect Prompts

Because OPEN-VERSE is distributed directly outside the Google Play Store, Google Play Protect may display a dialog:
- **Prompt:** *"Blocked by Play Protect — Unrecognized app developer"*.
- **Action:** Tap **"More details"** &rarr; tap **"Install anyway"**.
- *(Optional)* You may tap "Send app for scan" to help Google's security catalog whitelist future updates.

---

### Cryptographic Fingerprint Verification

You can independently verify the APK's cryptographic integrity on any computer with the Android SDK:

```bash
apksigner verify --verbose --print-certs open-verse-mobile.apk
```

**Expected Verifications:**
- **Scheme v2 (APK Signature Scheme v2):** `true`
- **Signer DN:** `CN=OPEN-VERSE Mobile, OU=Release, O=OPEN-VERSE, C=US`
- **SHA-256 Digest:** `d34f4df7096e7b7830570d7c13a4ef5ee7f83151c9f45ebcd5bd10e0ee1eb76a`
- This digest matches the official `/.well-known/assetlinks.json` hosted on the domain.

---

### Installing Updates Without Data Loss

Because all release APKs are signed with the **exact same release key and certificate**:
1. Simply download the newer version APK.
2. Tap to install over the existing installation.
3. Android Package Manager will prompt: *"Do you want to update this app? Your existing data will not be lost."*
4. Tap **Update**. All conversation history, local keys, and settings are preserved.

---

## 3. Linux

### Method A: AppImage (Universal across all distributions)

The AppImage is a portable, self-contained executable that runs on Ubuntu, Debian, Fedora, Arch, openSUSE, and other distributions.

1. Download `OPEN-VERSE_0.2.6_amd64.AppImage` from GitHub Releases.
2. Open your terminal in the download directory.
3. Make the AppImage executable:
   ```bash
   chmod +x OPEN-VERSE_0.2.6_amd64.AppImage
   ```
4. Run the application:
   ```bash
   ./OPEN-VERSE_0.2.6_amd64.AppImage
   ```
5. *(Optional Desktop Integration)*: Install `appimaged` or move the AppImage to `~/.local/bin` and create an AppStream desktop shortcut.

---

### Method B: Debian / Ubuntu (.deb)

```bash
# 1. Download the package
wget https://github.com/Naresh-chaurasiya/OPEN-VERSE/releases/download/v0.2.6/open-verse_0.2.6_amd64.deb

# 2. Install via dpkg
sudo dpkg -i open-verse_0.2.6_amd64.deb

# 3. Resolve any missing dependencies automatically
sudo apt-get install -f
```

---

### Method C: Fedora / RHEL / openSUSE (.rpm)

```bash
# Using dnf (Fedora 22+)
sudo dnf localinstall open-verse-0.2.6-1.x86_64.rpm

# Or using rpm directly
sudo rpm -ivh open-verse-0.2.6-1.x86_64.rpm
```

---

## 4. macOS

### Apple Silicon (M1/M2/M3/M4) & Intel (.dmg)

1. Download `OPEN-VERSE_0.2.6_aarch64.dmg` (for Apple Silicon) or `OPEN-VERSE_0.2.6_x64.dmg` (for Intel).
2. Double-click the `.dmg` disk image file to mount it.
3. In the Finder window that opens, drag the **OPEN-VERSE** application icon into your **Applications** folder shortcut.
4. Eject the disk image from Finder.

---

### Navigating Apple Gatekeeper

Because OPEN-VERSE community builds are not yet signed with a paid Apple Developer ID certificate ($99/yr), Apple Gatekeeper will initially quarantine the download:

#### Method 1: Graphical Right-Click (Standard macOS procedure for independent apps):
1. Open **Finder** &rarr; navigate to **Applications**.
2. **Right-click (or Control-click)** on `OPEN-VERSE.app`.
3. Select **Open** from the context menu.
4. A warning dialog will appear: *"macOS cannot verify the developer of OPEN-VERSE. Are you sure you want to open it?"*
5. Click **Open**.
*(macOS remembers your authorization; all subsequent launches will open directly with a single click).*

#### Method 2: System Settings Override:
1. Try opening `OPEN-VERSE.app` once (it will show the Gatekeeper notice). Click **Cancel**.
2. Open **System Settings** &rarr; **Privacy & Security**.
3. Scroll down to the **Security** section.
4. You will see: *"OPEN-VERSE was blocked from use because it is not from an identified developer."*
5. Click **Open Anyway** and enter your Mac password or Touch ID.

#### Method 3: Terminal Quarantine Removal (Power Users):
```bash
xattr -cr /Applications/OPEN-VERSE.app
```

---

## 5. iOS / iPadOS

### Method A: Safari PWA (Home Screen Web App) — Recommended

Apple iOS allows full-screen web applications to install directly from Safari, offering standalone windowing, offline storage, hardware camera/audio access, and background push notifications without App Store restrictions.

#### Step-by-Step Installation:
1. Open **Safari** on your iPhone or iPad.
2. Navigate to [https://open-verse-website.vercel.app](https://open-verse-website.vercel.app).
3. Tap the **Share** button at the bottom of the screen (the square with an arrow pointing up `↑`).
4. Scroll down the action sheet and tap **"Add to Home Screen"**.
5. *(Optional)* Rename the shortcut to `OPEN-VERSE`.
6. Tap **Add** in the top-right corner.
7. **Result:** An OPEN-VERSE app icon appears on your iOS Home Screen. When tapped, it launches in full-screen standalone mode without Safari address bars or navigation controls.

---

### Method B: Apple TestFlight (Beta Channel)

1. Install **TestFlight** from the iOS App Store.
2. Open the official OPEN-VERSE TestFlight invitation link from the releases page.
3. Tap **Accept** &rarr; tap **Install**.
4. TestFlight automatically manages beta updates and crash reporting.

---

## 6. Cross-Platform Troubleshooting

| Symptom | Cause | Solution |
| :--- | :--- | :--- |
| **Windows: "An Application Control policy has blocked this file"** | Windows 11 Smart App Control (SAC) is set to Enforced (`VerifiedAndReputablePolicyState = 1`). | Install via **Method A (PWA 1-Click Install)** from Microsoft Edge. It runs inside the trusted OS browser process with zero prompts. |
| **Windows: "Windows protected your PC" (SmartScreen)** | Fresh binary release without sufficient cloud download reputation. | Click **"More info"** &rarr; click **"Run anyway"**. |
| **Android: "App not installed"** | Existing app with conflicting signature or corrupt download. | Ensure previous unofficial builds are uninstalled before installing the official signed release APK (`versionCode=8`). |
| **macOS: "OPEN-VERSE is damaged and can't be opened"** | Gatekeeper quarantine flag placed by macOS on unnotarized internet downloads. | Run `xattr -cr /Applications/OPEN-VERSE.app` in Terminal, or use Right-Click &rarr; Open. |
| **Google Sign-in redirects to blank page** | Browser popup blocker or missing deep link handler. | Open `https://open-verse-website.vercel.app` directly; verify `openverse://` protocol is registered. |
| **Conversations not syncing across devices** | Signed into different accounts or offline mode active. | Verify you are signed in with the same Google account. User identity is uniquely anchored to `ov_user_${googleSub}`. |

---

*Authored by OPEN-VERSE Release Engineering & Application Security Team.*
