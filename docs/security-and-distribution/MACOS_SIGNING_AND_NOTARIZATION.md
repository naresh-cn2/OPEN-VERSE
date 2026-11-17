# macOS Signing & Notarization Architecture

## 1. Overview & Apple Gatekeeper Requirements

Starting with macOS 10.15 (Catalina) through macOS 15 (Sequoia), macOS Gatekeeper blocks any application downloaded from the internet unless it meets three strict criteria:
1. **Developer ID Application Signature**: Signed with a cryptographic certificate issued by Apple to an active Apple Developer Program member.
2. **Hardened Runtime**: Compiled with the Hardened Runtime enabled and signed with appropriate entitlements.
3. **Apple Notarization**: Submitted to Apple's automated malware analysis service (`xcrun notarytool`) and received an approved ticket stapled to the DMG.

> [!WARNING]
> OPEN-VERSE will never instruct users to run `sudo xattr -cr` to disable Apple Gatekeeper quarantine. The application must achieve full Developer ID compliance and notarization.

---

## 2. Configuration & Entitlements

Tauri is configured in `src-tauri/tauri.conf.json`:
- **Identifier**: `ai.openverse.desktop`
- **Hardened Runtime**: `true`
- **Entitlements**: `src-tauri/entitlements.plist`

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>com.apple.security.cs.allow-jit</key>
    <true/>
    <key>com.apple.security.cs.allow-unsigned-executable-memory</key>
    <true/>
    <key>com.apple.security.network.client</key>
    <true/>
    <key>com.apple.security.network.server</key>
    <true/>
</dict>
</plist>
```

---

## 3. Notarization Workflow in GitHub Actions

When Apple Developer Program credentials are configured in repository secrets:

```bash
# 1. Sign the application bundle and DMG
codesign --force --options runtime --deep --sign "Developer ID Application: Your Name (TEAMID)" OPEN-VERSE.app

# 2. Package into DMG
bunx tauri build --bundles dmg

# 3. Submit to Apple Notary Service
xcrun notarytool submit OPEN-VERSE.dmg \
  --apple-id "$APPLE_ID" \
  --password "$APPLE_APP_SPECIFIC_PASSWORD" \
  --team-id "$APPLE_TEAM_ID" \
  --wait

# 4. Staple the ticket to the disk image
xcrun stapler staple OPEN-VERSE.dmg

# 5. Verify Gatekeeper acceptance
spctl --assess -vvv --type open --context context:primary-signature OPEN-VERSE.dmg
```

---

## 4. Current Status & Transition Phase

- **Current Status**: **IN PREVIEW / BUILD VERIFIED**.
- **Build**: Built with ad-hoc signing (`APPLE_SIGNING_IDENTITY: "-"`) on GitHub macOS runners for developer preview.
- **Requirement for Official Release**: Enrollment in Apple Developer Program ($99 USD/year) to issue official Developer ID certificates.
