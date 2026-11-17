# Android Signing, Distribution & Update Compatibility

## 1. Application Identity & Signing Certificate

- **Application ID**: `ai.openverse.mobile`
- **Target SDK**: Android 14 (API 34)
- **Minimum SDK**: Android 7.0 (API 24)
- **Current Version**: `0.2.6` (versionCode `8`)

### Cryptographic Fingerprints (Release Certificate):
- **Owner**: `CN=OPEN-VERSE Mobile, OU=Release, O=OPEN-VERSE, C=US`
- **Serial Number**: `77f237b68e84f133`
- **Valid Period**: November 1, 2026 – March 19, 2054
- **SHA-1 Fingerprint**: `26:18:EA:B3:42:7A:A1:89:14:39:4A:3B:59:DC:18:64:F4:96:DB:CE`
- **SHA-256 Fingerprint**: `D3:4F:4D:F7:09:6E:7B:78:30:57:0D:7C:13:A4:EF:5E:E7:F8:31:51:C9:F4:5E:BC:D5:BD:10:E0:EE:1E:B7:6A`

---

## 2. Git History Audit & Secret Quarantine

1. **Historical Incident**: `mobile/android/app/release.keystore` was introduced in commit `5835fb3`.
2. **Quarantine Action**: In commit `27d2b25`, the file was untracked (`git rm --cached`) and added to `.gitignore`.
3. **Secret Injection**: The signing keystore is stored exclusively in GitHub Secrets as `ANDROID_RELEASE_KEYSTORE_BASE64`.
4. **Build Injection**: During CI runs, the keystore is decoded into runner memory and passed to Gradle via `ANDROID_KEYSTORE_PATH`.

---

## 3. Update Continuity & Key Rotation Strategy

> [!CRITICAL]
> **Android OS Signature Enforcement**:
> Android strictly forbids installing an APK over an existing installation if the signing certificates differ (`INSTALL_FAILED_UPDATE_INCOMPATIBLE`).
>
> Therefore, **the current release certificate must be preserved for the v0.2.x direct APK release line** to ensure existing users can install updates seamlessly.

### Google Play App Signing Migration Path:
1. When publishing to Google Play Store ($25 USD one-time account registration), enroll in **Play App Signing**.
2. Upload the existing signed `open-verse-mobile.aab` bundle. Google Play will ingest the key as the master application key.
3. Once enrolled, Google Play supports cryptographically secure upload key resets without breaking existing users.

---

## 4. Verification Commands

To verify the APK signature using the official Android SDK `apksigner`:

```bash
# Verify v1 and v2 signature schemes and print certificate details
apksigner verify --verbose --print-certs open-verse-mobile.apk
```

Expected output:
```
Verifies
Verified using v1 scheme (JAR signing): true
Verified using v2 scheme (APK Signature Scheme v2): true
Number of signers: 1
Signer #1 certificate DN: CN=OPEN-VERSE Mobile, OU=Release, O=OPEN-VERSE, C=US
Signer #1 certificate SHA-256 digest: d34f4df7096e7b7830570d7c13a4ef5ee7f83151c9f45ebcd5bd10e0ee1eb76a
```
