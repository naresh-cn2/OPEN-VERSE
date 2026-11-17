# Repository Credential Setup & Secret Management Guide

## 1. Overview of GitHub Secrets Architecture

All signing operations in OPEN-VERSE are driven by GitHub Actions repository secrets. No secret material is ever committed to source code.

---

## 2. Configured Secrets Status

| Secret Name | Platform | Purpose | Current Status |
| :--- | :--- | :--- | :--- |
| `ANDROID_RELEASE_KEYSTORE_BASE64` | Android | Signs release APK and AAB packages | **CONFIGURED & VERIFIED** |
| `TAURI_SIGNING_PRIVATE_KEY` | Windows / Desktop | Generates Minisign signatures for in-app updates | **CONFIGURED & VERIFIED** |
| `TAURI_SIGNING_PRIVATE_KEY_PASSWORD` | Windows / Desktop | Decrypts Tauri Minisign private key | **CONFIGURED & VERIFIED** |
| `WINDOWS_CERTIFICATE_PFX_BASE64` | Windows | Authenticode signing via `SignTool.exe` | *Pending Certificate Purchase/Import* |
| `WINDOWS_CERTIFICATE_PASSWORD` | Windows | Password for Windows PFX certificate | *Pending Certificate Purchase/Import* |
| `GPG_SIGNING_KEY` | Linux | GPG private key for package & manifest signing | *Pending Release Key Generation* |
| `APPLE_ID` | macOS / iOS | Apple ID for `notarytool` / TestFlight | *Pending Apple Developer Enrollment* |
| `APPLE_APP_SPECIFIC_PASSWORD` | macOS / iOS | App-specific password for Apple Notary Service | *Pending Apple Developer Enrollment* |
| `APPLE_TEAM_ID` | macOS / iOS | 10-character Apple Developer Team ID | *Pending Apple Developer Enrollment* |

---

## 3. How to Set Secrets Safely (CLI Commands)

```bash
# Android Keystore Base64:
python -c "import base64; print(base64.b64encode(open('release.keystore', 'rb').read()).decode('utf-8'))" | gh secret set ANDROID_RELEASE_KEYSTORE_BASE64

# Windows PFX Base64:
python -c "import base64; print(base64.b64encode(open('my_cert.pfx', 'rb').read()).decode('utf-8'))" | gh secret set WINDOWS_CERTIFICATE_PFX_BASE64
gh secret set WINDOWS_CERTIFICATE_PASSWORD

# Linux GPG Secret Key:
gpg --armor --export-secret-keys <KEY-ID> | gh secret set GPG_SIGNING_KEY
```
