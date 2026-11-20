# In-App Update Compatibility & Data Preservation

## 1. Desktop In-App Updater Architecture

OPEN-VERSE Desktop uses the official Tauri v2 Updater Plugin:
- **Manifest Endpoint**: `https://github.com/naresh-cn2/OPEN-VERSE/releases/download/desktop-latest/latest.json`
- **Verification Key**: `dW50cnVzdGVkIGNvbW1lbnQ6IG1pbmlzaWduIHB1YmxpYyBrZXk6IDRENUJENEE1ODRBQ0QzQzMKUldURDA2eUVwZFJiVGJmWjduOFk4VTBnVTVLL2pDRWJLV3lySXlEeHlXRThZTEVCMGorQ0ZMTUcK`

### Update Flow:
1. App polls the rolling `desktop-latest/latest.json` endpoint on startup.
2. If `version` is greater than local version, download the `.nsis.zip` update archive.
3. Cryptographically verify the archive against `signature` using Minisign.
4. Execute NSIS silent update install in the background.
5. Prompt user to restart or restart automatically.

---

## 2. Android Update Rules & Monotonic Versioning

Android OS enforces two strict constraints for application upgrades:

1. **Certificate Continuity**: The update APK must be signed with the exact same certificate chain as the installed APK. A signature mismatch triggers `INSTALL_FAILED_UPDATE_INCOMPATIBLE`.
2. **Monotonic Version Code**: `versionCode` must strictly increase (`v0.2.6` uses `versionCode: 8`). Android will refuse to install an APK with a lower `versionCode` (`INSTALL_FAILED_VERSION_DOWNGRADE`).

---

## 3. User Data & Workspace Preservation

Updates never overwrite user application data:
- **Desktop Storage**: `%APPDATA%\OPEN-VERSE` (Windows), `~/Library/Application Support/ai.openverse.desktop` (macOS), `~/.config/openverse` (Linux).
- **Mobile Storage**: Internal app sandboxed storage (`/data/user/0/ai.openverse.mobile/`).
- **OAuth Credentials & Session**: Kept intact across updates; tokens are stored in secure OS storage (Keychain / DPAPI / Keystore).
