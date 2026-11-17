# Download Verification & Integrity Guide

## 1. Automated Verification Commands by Platform

Users and administrators can cryptographically verify every OPEN-VERSE download before opening it.

---

### Windows Verification

#### 1. SHA-256 Checksum Verification:
```powershell
# In PowerShell:
(Get-FileHash -Path "OPEN-VERSE_0.2.6_x64-setup.exe" -Algorithm SHA256).Hash
# Expected: 36d60fd9b980b98596674f26d3fb10d71087e36856c27dfefe3f1e7ea3632812
```

#### 2. Tauri Minisign Cryptographic Verification:
```powershell
# Verify using official minisign CLI and OPEN-VERSE public key
minisign -Vm "OPEN-VERSE_0.2.6_x64-setup.exe" -P "RWTD06yEpdRbTbfZ7n8Y8U0gU5K/jCEbKWyrIyDxyWE8YLEB0j+CFLMG" -x "OPEN-VERSE_0.2.6_x64-setup.exe.sig"
```

Expected output:
```
Signature and comment signature verified
Trusted comment: timestamp:1794855162  file:OPEN-VERSE_0.2.6_x64-setup.exe  version:0.2.6
```

---

### Android Verification

#### 1. Checksum Verification:
```bash
sha256sum open-verse-mobile.apk
# Expected: 187dd7216b36d31f32340c129b8555cad56aa206b3de4cf003f4151badc2b955
```

#### 2. APK Signature Verification:
```bash
apksigner verify --verbose --print-certs open-verse-mobile.apk
# Expected SHA-256 Digest: d34f4df7096e7b7830570d7c13a4ef5ee7f83151c9f45ebcd5bd10e0ee1eb76a
```

---

### Linux Verification

```bash
# Check SHA-256
sha256sum -c SHA256SUMS

# Verify GPG Detached Signature (when GPG key is published)
gpg --verify OPEN-VERSE_0.2.6_amd64.deb.asc OPEN-VERSE_0.2.6_amd64.deb
```

---

## 2. Troubleshooting Browser Download Failures

### Microsoft Edge "Couldn't download – Network issue / Something went wrong"
- **Cause**: When SmartScreen pauses an `.exe` download in the download tray waiting for the user to confirm, the underlying CDN TCP socket idles out after 60s. Clicking "Keep anyway" afterwards attempts to read from a dead socket.
- **Immediate Safe Solution**: Download the **Windows Standalone Archive (`.zip`)**. Edge streams `.zip` archives directly without pausing the connection or triggering SmartScreen reputation halts.
