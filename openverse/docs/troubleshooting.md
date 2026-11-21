# OPEN-VERSE Troubleshooting Guide

Common diagnostic procedures, error resolutions, and recovery steps for OPEN-VERSE desktop and mobile applications.

---

## 1. General Diagnostics (`cline-cli doctor`)

The bundled desktop CLI includes self-diagnostic tooling:

```bash
# Check connectivity to local background daemon
cline-cli hub list --json

# Run automatic environment repair
cline-cli doctor fix
```

---

## 2. Desktop Troubleshooting

### Issue: "The process cannot access the file because it is being used by another process"
- **Cause**: An earlier instance of the application or background daemon is still running, locking the executable file.
- **Resolution (Windows PowerShell)**:
  ```powershell
  Get-Process | Where-Object { $_.Path -like "*OPEN-VERSE*" -or $_.Path -like "*cline*" } | Stop-Process -Force
  ```
- **Resolution (macOS / Linux)**:
  ```bash
  pkill -f "cline-app" || pkill -f "OPEN-VERSE"
  ```

### Issue: "Smart App Control has blocked this file" (Windows 11)
- **Cause**: Windows 11 Smart App Control (SAC) blocks unsigned `.exe` files when executed from temporary or non-standard paths.
- **Resolution**:
  Run the installer from a standard user directory (such as Downloads or Desktop) rather than `%TEMP%`. If needed, unblock the file in PowerShell:
  ```powershell
  Unblock-File "$HOME\Downloads\OPEN-VERSE_0.2.3_x64-setup.exe"
  ```

### Issue: Desktop window is blank or fails to connect
- **Cause**: Local loopback port collision or daemon startup timeout.
- **Resolution**:
  1. Inspect the log files:
     - `%USERPROFILE%\.openverse\data\logs\code.log`
     - `%USERPROFILE%\.openverse\data\logs\hub-daemon.log`
  2. Clear stale lockfiles:
     ```powershell
     Remove-Item "$env:USERPROFILE\.openverse\data\locks\hub\*" -Force
     ```
  3. Relaunch OPEN-VERSE.

---

## 3. Mobile (Android) Troubleshooting

### Issue: PackageInstaller reports "App not installed as package appears to be invalid"
- **Cause**: Attempting to upgrade over an existing installation that was signed with a different cryptographic keystore (e.g. debug keystore vs release keystore).
- **Resolution**:
  Uninstall the old test build first:
  ```bash
  adb uninstall ai.openverse.mobile
  ```
  Then install the genuine release APK:
  ```bash
  adb install -r open-verse-mobile.apk
  ```

### Issue: In-app update says "You're up to date" when a newer version is known
- **Cause**: CDN caching of the release manifest or mismatch between manifest `versionCode` and installed `versionCode`.
- **Resolution**:
  1. Force refresh the about screen by tapping **Check for Updates**.
  2. Ensure your device has an active internet connection to reach `https://open-verse-website.vercel.app`.

