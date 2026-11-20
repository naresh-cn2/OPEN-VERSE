# Incident Response & Cryptographic Key Rotation Protocol

## 1. Threat Scenarios & Emergency Classification

1. **Category 1 (Private Key Disclosure)**: A signing key or keystore is discovered in a public repository, log file, or unauthorized third party.
2. **Category 2 (Build Compromise / Supply Chain Attack)**: An unauthorized third party gains access to CI/CD workflows or publishes malicious binaries.
3. **Category 3 (Certificate Revocation / Expiry)**: A Certificate Authority revokes an Authenticode or Developer ID certificate due to CA compromise or expiration.

---

## 2. Platform-Specific Key Rotation Procedures

### Android Keystore Rotation Protocol
1. **Direct APK Installations**:
   - Because Android refuses updates when signatures change, generate an intermediate transitional update (`v0.2.x`) signed with the current key that alerts users to the key rotation.
   - For major releases, package users into the Google Play Store channel or provide a deterministic data backup/restore wizard.
2. **Google Play Store**:
   - Contact Google Play Developer Support to initiate an **Upload Key Reset**.
   - Generate a new PKCS12 keystore locally.
   - Export upload certificate: `keytool -export -rfc -keystore upload_keystore.jks -alias upload -file upload_certificate.pem`.
   - Submit `upload_certificate.pem` to Google Play Console. Google updates the upload key in 48 hours without affecting existing users.

### Windows Authenticode Certificate Rotation Protocol
1. Immediately contact the Certificate Authority (e.g. Certum, DigiCert) to revoke the compromised certificate.
2. The CA publishes the serial number to the Certificate Revocation List (CRL) and OCSP responders.
3. Re-issue a new code-signing certificate.
4. Update `WINDOWS_CERTIFICATE_PFX_BASE64` in GitHub Secrets.
5. Re-sign all active release executables and update download manifests.

### Tauri Minisign Public Key Rotation Protocol
1. Generate a new Minisign key pair: `minisign -G`.
2. Update the public key in `desktop/apps/examples/desktop-app/src-tauri/tauri.conf.json`:
   ```json
   "updater": {
     "pubkey": "<NEW_BASE64_PUBLIC_KEY>"
   }
   ```
3. Update `TAURI_SIGNING_PRIVATE_KEY` in GitHub Secrets.
4. Distribute the transitional release signed with the *old* key so existing clients accept it. Once installed, the new client will only accept updates signed by the *new* key.
