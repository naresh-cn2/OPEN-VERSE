# iOS Signing, TestFlight & App Store Architecture

## 1. Current Posture & Accurate Status

- **Status**: **IN PREVIEW / PRE-TESTFLIGHT**.
- **Installation Mechanism**: Progressive Web App (PWA) via Safari ("Add to Home Screen").
- **Native Project**: Native Xcode project with WKWebView container located at `mobile/ios/OPEN-VERSE.xcodeproj`.

> [!IMPORTANT]
> **No Misleading Placeholder Links**:
> OPEN-VERSE does not present non-existent public TestFlight links. Until an active Apple Developer Program team is connected and public TestFlight slots are generated, the website provides a waitlist queue link to GitHub Issues and direct PWA installation.

---

## 2. Technical Signing Requirements

To run natively on physical iOS devices, Apple enforces mandatory code signing:

1. **Apple Developer Program Membership**: Required ($99 USD/year).
2. **Distribution Certificate**: Generated in Apple Developer portal.
3. **App ID & Capabilities**:
   - Bundle Identifier: `ai.openverse.mobile`
   - Associated Domains: For Universal Links and Google OAuth deep links (`applinks:open-verse-website.vercel.app`).
4. **Provisioning Profile**: `App Store / TestFlight` distribution profile.

---

## 3. GitHub Actions CI/CD Integration Plan

When Apple Developer credentials become available, `mobile-ios.yml` will be updated from `CODE_SIGNING_ALLOWED=NO` to automated signing:

```bash
# 1. Install distribution certificate and profile in runner keychain
security import cert.p12 -k build.keychain -P "$CERT_PASSWORD" -T /usr/bin/codesign

# 2. Build and archive signed IPA
xcodebuild archive \
  -project mobile/ios/OPEN-VERSE.xcodeproj \
  -scheme OPEN-VERSE \
  -configuration Release \
  -archivePath build/OPEN-VERSE.xcarchive

# 3. Export IPA
xcodebuild -exportArchive \
  -archivePath build/OPEN-VERSE.xcarchive \
  -exportOptionsPlist exportOptions.plist \
  -exportPath build/

# 4. Upload to TestFlight via App Store Connect API
xcrun altool --upload-app -f build/OPEN-VERSE.ipa -t ios --apiKey "$API_KEY" --apiIssuer "$ISSUER_ID"
```

---

## 4. Immediate User Experience on iOS (PWA)

iPhone and iPad users can install and use OPEN-VERSE immediately without TestFlight:
1. Open `https://open-verse-website.vercel.app` in Safari.
2. Tap the **Share** button (box with upward arrow).
3. Tap **Add to Home Screen**.
4. Launch from Home Screen with native standalone display, full Google OAuth support, and pairing.
