# OPEN-VERSE Installation Guide

Step-by-step instructions for installing and running OPEN-VERSE across all supported desktop and mobile operating systems.

---

## 1. Windows Installation

### System Requirements
- Windows 10 (version 1903+) or Windows 11 (64-bit).
- Minimum 4 GB RAM (8 GB recommended).
- 500 MB free disk space.

### Steps
1. Download `OPEN-VERSE_0.2.3_x64-setup.exe` from the [Download Center](https://open-verse-website.vercel.app/download).
2. Double-click the installer to launch setup.
3. Follow the on-screen prompts to choose the installation location (defaults to `%LOCALAPPDATA%\OPEN-VERSE`).
4. Once completed, OPEN-VERSE will launch automatically and create desktop/Start menu shortcuts.

> **Note on Windows SmartScreen**: Because OPEN-VERSE is distributed outside the Microsoft Store, SmartScreen may display an informational dialog ("Windows protected your PC"). Click **More info** -> **Run anyway**. Once installed, subsequent updates are automatically verified and staged through the built-in Minisign updater.

---

## 2. Android Installation

### System Requirements
- Android 7.0 (API Level 24) or higher.
- Phone or tablet with ARM64 or x86_64 architecture.

### Steps
1. On your Android device, navigate to `https://open-verse-website.vercel.app` in your browser.
2. Tap **Download for Android** to download `open-verse-mobile.apk`.
3. Open your device's Downloads folder and tap `open-verse-mobile.apk`.
4. If prompted to allow installs from unknown sources, allow your browser to install unknown apps.
5. Tap **Install**.

### Subsequent In-App Updates
You do **not** need to return to the browser for future releases:
1. When a new version is released, an update notification badge appears in the in-app navigation.
2. Navigate to **About** / **Settings** -> tap **Check for Updates** -> **Install Update**.
3. OPEN-VERSE downloads the verified APK, validates its cryptographic hash and `versionCode`, and launches the system `PackageInstaller` dialog. Tap **Update** to complete.

---

## 3. Linux Installation

### Debian / Ubuntu (`.deb`)
1. Download `OPEN-VERSE_0.2.3_amd64.deb`.
2. Install via terminal:
   ```bash
   sudo dpkg -i OPEN-VERSE_0.2.3_amd64.deb
   sudo apt-get install -f # Fix any missing dependencies if needed
   ```
3. Launch `open-verse` from your application launcher or terminal.

### Fedora / RHEL (`.rpm`)
1. Download `OPEN-VERSE-0.2.3-1.x86_64.rpm`.
2. Install via `dnf`:
   ```bash
   sudo dnf install OPEN-VERSE-0.2.3-1.x86_64.rpm
   ```

---

## 4. macOS Installation

### System Requirements
- macOS 12 Monterey or newer (Apple Silicon M1/M2/M3 or Intel 64-bit).

### Steps
1. Download `OPEN-VERSE_0.2.3_universal.dmg`.
2. Open the `.dmg` disk image.
3. Drag the `OPEN-VERSE` application icon into your `/Applications` folder.
4. Launch OPEN-VERSE from Launchpad or Spotlight.

