# GOOGLE-OAUTH-PLATFORM-CONFIGURATION-AUDIT.md
**Inspection Date:** November 16, 2026  
**Repository:** `c:\Users\nares\Workspace\OPEN-VERSE\OPEN-VERSE`  
**Audit Scope:** Six-Platform Cross-Platform Google Authentication Architecture (Windows, Linux, macOS, Android, iOS, Web)  
**Mode:** STRICT INSPECTION ONLY (No source code modified, no deployments, no synthetic values)

---

## 1. Executive Summary & Google Cloud OAuth Client Status

The user created a Google Cloud OAuth Client:
- **Project Name:** `OPEN-VERSE`
- **Client Name:** `OPEN-VERSE Desktop`
- **Application Type:** `Desktop app`

### Key Finding on Error 400 (`invalid_request`):
In Google Cloud Console, a **Desktop app** OAuth client ID enforces RFC 8252 loopback callback rules (`http://127.0.0.1:<port>` or `http://localhost:<port>`). It **cannot** be configured with an arbitrary HTTPS redirect URI such as `https://open-verse-website.vercel.app/api/auth/callback`. 

Because the repository's cross-platform authentication gateway (`mobile/src/services/auth.ts` and `desktop/apps/examples/desktop-app/webview/lib/open-verse-auth.ts`) delegates OAuth authorization through `https://open-verse-website.vercel.app/api/auth/authorize`, the Google authorization URL generated in `website/api/auth/authorize.ts#L75` sets:
```text
redirect_uri=https://open-verse-website.vercel.app/api/auth/callback
```
When this request reaches Google with a **Desktop app** client ID, or with a client ID that does not have that exact URI in its **Authorized redirect URIs** list, Google blocks the request immediately with **`Error 400: invalid_request` (`redirect_uri_mismatch`)**, as captured in the mobile screenshot.

---

## 2. Nine-Point Mandatory Technical Audit Findings

### 1. Actual Android Application Package Name
- **Package Name / Application ID:** `ai.openverse.mobile`
- **Source References:**
  - `mobile/android/app/build.gradle#L7`: `namespace 'ai.openverse.mobile'`
  - `mobile/android/app/build.gradle#L11`: `applicationId "ai.openverse.mobile"`
  - `mobile/android/app/src/main/java/ai/openverse/mobile/MainActivity.kt#L1`: `package ai.openverse.mobile`
  - `mobile/android/app/src/main/AndroidManifest.xml#L29`: `<activity android:name=".MainActivity"`
- **Production Keystore Signing Fingerprints** (`mobile/android/app/release.keystore`, alias `openverse`):
  - **SHA-1:** `26:18:EA:B3:42:7A:A1:89:14:39:4A:3B:59:DC:18:64:F4:96:DB:CE`
  - **SHA-256:** `D3:4F:4D:F7:09:6E:7B:78:30:57:0D:7C:13:A4:EF:5E:E7:F8:31:51:C9:F4:5E:BC:D5:BD:10:E0:EE:1E:B7:6A`

### 2. Actual iOS Bundle Identifier
- **Bundle Identifier:** `ai.openverse.mobile`
- **Source References:**
  - `mobile/ios/OPEN-VERSE/Info.plist#L11-L12`: `<key>CFBundleIdentifier</key><string>ai.openverse.mobile</string>`
  - `mobile/ios/OPEN-VERSE/Info.plist#L33-L35`: `<key>CFBundleURLName</key><string>ai.openverse.mobile</string>`
  - `mobile/ios/OPEN-VERSE.xcodeproj/project.pbxproj#L204`: `PRODUCT_BUNDLE_IDENTIFIER = "ai.openverse.mobile";`
  - `mobile/ios/OPEN-VERSE.xcodeproj/project.pbxproj#L225`: `PRODUCT_BUNDLE_IDENTIFIER = "ai.openverse.mobile";`

### 3. Web Application Origin(s)
- **Production Origin:** `https://open-verse-website.vercel.app`
  - `website/api/auth/callback.ts#L15`: `const CANONICAL_CALLBACK_URL = "https://open-verse-website.vercel.app/api/auth/callback";`
  - `website/api/auth/authorize.ts#L75`: `const callbackUrl = "https://open-verse-website.vercel.app/api/auth/callback";`
  - `desktop/apps/examples/desktop-app/src-tauri/tauri.conf.json#L43`: `"homepage": "https://open-verse-website.vercel.app"`
  - `desktop/apps/examples/desktop-app/webview/lib/open-verse-auth.ts#L539`: `baseUrl = (config.authUrl || "https://open-verse-website.vercel.app/api/auth")`
  - `mobile/src/services/auth.ts#L58`: `const authEndpoint = "https://open-verse-website.vercel.app/api/auth";`
- **Local Web Development Origin:** `http://localhost:3300`
  - `website/vite.config.ts#L7`: `server: { port: 3300 }`
- **Desktop Local Dev Webview Origin:** `http://localhost:3125`
  - `desktop/apps/examples/desktop-app/package.json#L8`: `"dev:web": "next dev webview -p 3125 --turbo"`
  - `desktop/apps/examples/desktop-app/src-tauri/tauri.conf.json#L8`: `"devUrl": "http://localhost:3125"`
  - `desktop/apps/examples/desktop-app/webview/lib/open-verse-auth.ts#L530`: `let redirectUrl = "http://localhost:3125";`

### 4. Actual Backend OAuth Callback / Redirect URIs
- **Canonical Web / Serverless Backend Redirect URI:**
  `https://open-verse-website.vercel.app/api/auth/callback`
  - Source: `website/api/auth/callback.ts#L14-L15`, `website/api/auth/authorize.ts#L75`
- **Mobile Deep Link Scheme Callback:**
  `openverse://auth/callback`
  - Source: `mobile/src/services/auth.ts#L59`, `website/api/auth/authorize.ts#L50`, `mobile/android/app/src/main/AndroidManifest.xml#L44`
- **Desktop Dev Loopback Fallback:**
  `http://localhost:3125`
  - Source: `desktop/apps/examples/desktop-app/webview/lib/open-verse-auth.ts#L530`

### 5. Whether a Backend Authentication Service Exists
- **Status: YES, FULLY IMPLEMENTED.**
- **Location:** Vercel serverless API routes under `website/api/auth/`:
  1. `website/api/auth/authorize.ts#L1-L100`:
     - Dispatches OAuth flows for Google and GitHub.
     - Creates encoded state containing `{ provider, redirectTo, nonce }` (`authorize.ts#L76-L82`).
     - Redirects user to Google OAuth authorization endpoint `https://accounts.google.com/o/oauth2/v2/auth` (`authorize.ts#L84-L90`).
  2. `website/api/auth/callback.ts#L1-L120`:
     - Receives `code` and `state`.
     - Exchanges authorization code with Google token endpoint `https://oauth2.googleapis.com/token` via `POST` (`callback.ts#L77-L87`).
     - Fetches verified identity via `https://www.googleapis.com/oauth2/v3/userinfo` (`callback.ts#L97-L105`).
     - Constructs persistent user ID `google_${profile.sub}` (`callback.ts#L109`).
     - Mints HMAC-SHA256 session token (`mintSessionToken` in `callback.ts#L20-L39`) using secret `OPENVERSE_SESSION_SECRET`.
     - Redirects back to client (`redirectTo`) with token, email, name, and sub in URL hash fragment.

### 6. Existing Google Sign-In Implementation & Status for Each Platform

| Platform | Entry Point | Runtime / Framework | Identifier | Auth Trigger Mechanism | Callback Listener | Current Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Windows** | `desktop/apps/examples/desktop-app/src-tauri/src/main.rs#L1640` | Tauri v2 + Next.js (WebView2) | `ai.openverse.desktop` (`tauri.conf.json#L5`) | PowerShell `Start-Process` (`main.rs#L1027-L1032`) | Single-instance CLI `argv` (`main.rs#L1647-L1653`). Custom scheme `openverse://` is NOT registered in Windows registry. No loopback HTTP server. | **PARTIAL** |
| **Linux** | `desktop/apps/examples/desktop-app/src-tauri/src/main.rs#L1040` | Tauri v2 + Next.js (WebKitGTK) | `ai.openverse.desktop` (`tauri.conf.json#L5`) | `xdg-open` (`main.rs#L1043`) | Single-instance CLI `argv`. No `.desktop` MIME scheme handler for `openverse://`. No loopback HTTP server. | **PARTIAL** |
| **macOS** | `desktop/apps/examples/desktop-app/src-tauri/src/main.rs#L1033` | Tauri v2 + Next.js (WKWebView) | `ai.openverse.desktop` (`tauri.conf.json#L5`) | `open` (`main.rs#L1036`) | Single-instance CLI `argv`. `CFBundleURLTypes` not registered in `tauri.conf.json#L75-L93`. No loopback HTTP server. | **PARTIAL** |
| **Android** | `mobile/android/app/src/main/java/ai/openverse/mobile/MainActivity.kt#L1` | Native Android (Kotlin) + AndroidX WebKit | `ai.openverse.mobile` (`build.gradle#L11`) | `Intent.ACTION_VIEW` (`MainActivity.kt#L111`) | Custom scheme `openverse://` in `AndroidManifest.xml#L40-L45`, forwarded via `dispatchDeepLinkToWeb` (`MainActivity.kt#L101`). No native Google Sign-In SDK (`play-services-auth` or `androidx.credentials`) in `build.gradle#L65-L70`. | **PARTIAL** |
| **iOS** | `mobile/ios/OPEN-VERSE/ViewController.swift#L1` | Native iOS (Swift 5) + `WKWebView` | `ai.openverse.mobile` (`Info.plist#L12`, `project.pbxproj#L204`) | `UIApplication.shared.open` (`ViewController.swift#L58`) via `WKScriptMessageHandler` | Custom scheme `openverse://` in `Info.plist#L30-L40`, evaluated via `handleDeepLinkNotification` (`ViewController.swift#L49-L54`). No native Google Sign-In SDK. Unverified on physical iOS hardware. | **PARTIAL / UNVERIFIED** |
| **Web** | `website/src/main.tsx`, `website/src/App.tsx` | Vite + React 18 (Vercel) | N/A (`https://open-verse-website.vercel.app`) | Client redirects to `/api/auth/authorize` | Serverless callback endpoint `/api/auth/callback` handles authorization code exchange directly with Google. | **IMPLEMENTED** |

### 7. Whether Desktop Authentication Supports Authorization Code + PKCE and a Loopback Callback
- **PKCE Support: PARTIAL / ORPHANED.**
  - Cryptographic PKCE challenge generator `generatePkceChallenge()` using SHA-256 subtle crypto exists in `desktop/apps/examples/desktop-app/webview/lib/open-verse-auth.ts#L450-L487`.
  - **However**, `generatePkceChallenge()` is **never invoked** inside `getOAuthAuthorizeUrl()` (`open-verse-auth.ts#L525-L541`). The authorization URL generated completely omits `code_challenge` and `code_challenge_method`.
- **Loopback Callback Listener: MISSING.**
  - There is **no local HTTP loopback server** in the Tauri Rust codebase (`src-tauri/src/main.rs`) or sidecar.
  - Port `3125` is merely the Next.js local development server (`desktop/apps/examples/desktop-app/package.json#L8`). In production desktop releases (`.exe`, `.dmg`, `.deb`), `tauri.conf.json#L10` bundles static files from `../webview/out`, and nothing listens on `localhost:3125`.

### 8. Whether Google ID Tokens are Cryptographically Verified by the Backend
- **Status: NO.**
- **Code Reference:** `website/api/auth/callback.ts#L97-L108`.
- **Analysis:**
  - The backend receives `tokens.access_token` from `https://oauth2.googleapis.com/token` and immediately passes it in a `Bearer` header to `https://www.googleapis.com/oauth2/v3/userinfo`.
  - It relies entirely on Google's UserInfo API response over HTTPS. It does **not** decode, parse, or cryptographically verify the RS256 signature of `id_token` against Google's public JWKS certificates (`https://www.googleapis.com/oauth2/v3/certs`), nor does it validate the token's `aud`, `iss`, or `exp` claims.

### 9. Required Environment Variable Names and Configuration Locations

#### Vercel Backend Environment Variables (`website/`):
- `GOOGLE_CLIENT_ID`: Referenced at `website/api/auth/callback.ts#L72` and `website/api/auth/authorize.ts#L71`. Must be the Google OAuth Client ID.
- `GOOGLE_CLIENT_SECRET`: Referenced at `website/api/auth/callback.ts#L74` and `website/api/auth/authorize.ts#L72`. Must be the Google OAuth Client Secret.
- `OPENVERSE_SESSION_SECRET`: Referenced at `website/api/auth/callback.ts#L18` and `website/api/auth/authorize.ts#L15`. Secret key for HMAC-SHA256 session tokens.
- `GITHUB_CLIENT_ID` & `GITHUB_CLIENT_SECRET`: Referenced at `website/api/auth/callback.ts#L114-L115` and `website/api/auth/authorize.ts#L98-L99`. Optional GitHub OAuth credentials.

#### Desktop Frontend Environment Variables (`desktop/apps/examples/desktop-app/`):
- `NEXT_PUBLIC_GOOGLE_CLIENT_ID`: Referenced at `webview/lib/open-verse-auth.ts#L136`.
- `GOOGLE_CLIENT_ID`: Referenced at `webview/lib/open-verse-auth.ts#L137`.
- `NEXT_PUBLIC_OPENVERSE_AUTH_URL`: Referenced at `webview/lib/open-verse-auth.ts#L231` (defaults to `https://open-verse-website.vercel.app/api/auth`).

#### Client Browser Local Storage Keys:
- `openverse_google_client_id`: `webview/lib/open-verse-auth.ts#L132`.
- `openverse_auth_session`: `mobile/src/services/auth.ts#L13`, `webview/lib/open-verse-auth.ts#L79`.

---

## 3. Root Cause Diagnosis of the Two User Images

1. **Image 1: Windows Chrome Download Warning (`OPEN-VERSE 0.2.5 x64-setup.exe isn't commonly downloaded`)**
   - **Diagnosis:** This is standard Chromium Safe Browsing / Windows SmartScreen behavior for freshly built and downloaded binary executables that lack accumulated cryptographic reputation or a commercial Extended Validation (EV) code-signing certificate. The file itself is valid.

2. **Image 2: Mobile Google OAuth Error (`Error 400: invalid_request`)**
   - **Diagnosis:** The user attempted to log in using their Google account (`nareshalluarjun791@gmail.com`). 
   - Mobile and Desktop apps delegate to `https://open-verse-website.vercel.app/api/auth/authorize`, which redirects to Google with `redirect_uri=https://open-verse-website.vercel.app/api/auth/callback`.
   - The user recently created an OAuth client of type **"Desktop app"** (`OPEN-VERSE Desktop`). In Google Cloud Console, a Desktop client ID **cannot** have `https://open-verse-website.vercel.app/api/auth/callback` registered as an authorized redirect URI (Desktop apps only permit loopback `http://127.0.0.1` or `http://localhost`).
   - Consequently, when Vercel uses the Desktop client ID, Google throws `Error 400: invalid_request` (`redirect_uri_mismatch`).

---

## 4. Exact Google Cloud OAuth Clients Configuration Matrix

To enable all six platforms to authenticate seamlessly through the existing backend architecture, the following Google Cloud OAuth clients are required:

| Client Name | Client Type in Google Cloud | Identifier / Package / Origin | Authorized Redirect URIs / Allowed Schemes | Primary Purpose |
| :--- | :--- | :--- | :--- | :--- |
| **OPEN-VERSE Web & Gateway** *(Mandatory for current architecture)* | **Web application** | **Authorized JavaScript origins:**<br>`https://open-verse-website.vercel.app`<br>`http://localhost:3300` | **Authorized redirect URIs:**<br>`https://open-verse-website.vercel.app/api/auth/callback` | Serves web logins AND acts as the OAuth code exchange gateway for Mobile and Desktop apps. |
| **OPEN-VERSE Desktop** *(Already Created)* | **Desktop app** | Platform: Windows, macOS, Linux | `http://127.0.0.1`<br>`http://localhost` | Standard RFC 8252 loopback OAuth (requires implementing local loopback listener in Tauri). |
| **OPEN-VERSE Android** | **Android** | **Package name:** `ai.openverse.mobile`<br>**SHA-1 Certificate:**<br>`26:18:EA:B3:42:7A:A1:89:14:39:4A:3B:59:DC:18:64:F4:96:DB:CE` | N/A (Handled via Android Keystore verification) | Native Android Google Sign-In / Credential Manager integration. |
| **OPEN-VERSE iOS** | **iOS** | **Bundle ID:** `ai.openverse.mobile`<br>**Team ID:** (From Apple Developer Account) | Reversed Client ID URL Scheme (e.g. `com.googleusercontent.apps.<client-id>://`) | Native iOS Google Sign-In SDK integration. |

---

## 5. Technical Implementation Gaps & Recommended Sequence

### Implementation Gaps:
1. **Google Cloud Console Mismatch:** The current backend code exchange at `https://open-verse-website.vercel.app/api/auth/callback` requires a **Web application** OAuth client ID with `GOOGLE_CLIENT_SECRET` configured in Vercel. A Desktop app client ID cannot be exchanged this way.
2. **Desktop Loopback Server Missing:** The desktop app has no background HTTP server to catch `http://localhost:<port>` redirects in production.
3. **PKCE Orphaned:** `generatePkceChallenge()` is implemented in `open-verse-auth.ts#L450` but not used in `getOAuthAuthorizeUrl()`.
4. **Desktop Deep Link Protocol Unregistered:** The `openverse://` custom URL scheme is handled by Tauri's single-instance plugin in code, but neither the Windows NSIS installer nor the macOS `tauri.conf.json` registers the OS protocol handler.
5. **Missing ID Token Cryptographic Verification:** `website/api/auth/callback.ts` trusts the Google UserInfo endpoint over HTTPS instead of verifying the signed JWT `id_token` against Google's JWKS certificates.

### Recommended Next Steps:
1. In Google Cloud Console, create a **Web application** OAuth client named `OPEN-VERSE Web Gateway`. Add `https://open-verse-website.vercel.app/api/auth/callback` under Authorized redirect URIs.
2. In the Vercel project settings for `open-verse-website`, configure `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` using this Web application client.
3. In `desktop/apps/examples/desktop-app/webview/lib/open-verse-auth.ts`, hook `generatePkceChallenge()` into `getOAuthAuthorizeUrl()`.
4. Register the `openverse://` protocol scheme in `desktop/apps/examples/desktop-app/src-tauri/tauri.conf.json` and `mobile/android/app/build.gradle`.
