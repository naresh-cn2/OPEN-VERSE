# Security & Privacy Documentation

Security architecture, code signing, cryptographic update integrity, and privacy principles for OPEN-VERSE.

---

## 1. Core Security Principles

1. **No Hidden Telemetry**: OPEN-VERSE does not phone home with private code, file paths, or sensitive prompt data.
2. **Direct Provider Communication**: All model interactions travel directly from your device to the configured AI API endpoints over TLS 1.3.
3. **Local Sandboxing**: Tool operations (command execution, file read/write) require explicit user permission modes or run within the declared project root.

---

## 2. Cryptographic Code Signing & Update Integrity

To protect users against man-in-the-middle attacks and malicious update delivery:

### Desktop (Minisign Ed25519)
- Every release bundle is cryptographically signed using the Minisign tool with an Ed25519 private key.
- The corresponding public key is hardcoded into `src-tauri/tauri.conf.json`:
  ```
  dW50cnVzdGVkIGNvbW1lbnQ6IG1pbmlzaWduIHB1YmxpYyBrZXk6IDRENUJENEE1ODRBQ0QzQzMKUldURDA2eUVwZFJiVGJmWjduOFk4VTBnVTVLL2pDRWJLV3lySXlEeHlXRThZTEVCMGorQ0ZMTUcK
  ```
- Tauri validates the signature before staging or executing any installer binary. Tampered binaries trigger immediate abort.

### Mobile (Streaming SHA-256 Checksums)
- The release manifest publishes authoritative SHA-256 hashes for every APK release.
- During in-app download, the payload is verified as it streams into the scoped internal cache (`context.cacheDir/openverse-updates/`).
- If the computed hash fails to match the manifest, the file is deleted immediately without launching the installer intent.

---

## 3. Google Play Protect Developer Verification

When installing self-updating Android APKs outside the Play Store, Google Play Protect may display informational warnings ("Unrecognized app developer") because the self-signed certificate has not established telemetry reputation.

### Technical Truth:
- **Google Play App Signing**: Only functions for distributions routed through the Google Play Store client; it cannot sign direct website sideloaded downloads.
- **Developer Verification & Appeals**:
  1. Developers can register their package name (`ai.openverse.mobile`) in the Google Play Console.
  2. Submit the signed APK through the **Google Play Protect Developer Appeals Portal** (`https://support.google.com/googleplay/android-developer/contact/protectappeals`).
  3. Google reviews the developer identity and cryptographic certificate, adding the SHA-256 signing fingerprint to the Play Protect whitelist to clear warnings for direct downloads.

---

## 4. Reporting Security Vulnerabilities

If you identify a security vulnerability in OPEN-VERSE, please report it responsibly:
- Email: `security@openverse.ai` (or via GitHub Security Advisories).
- Please do not open public GitHub issues for sensitive vulnerability reports until a patch has been published.

