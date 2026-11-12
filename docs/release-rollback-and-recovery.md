# Release Rollback, Recovery & Diagnostic Monitoring

This operational guide provides procedures for monitoring release health, diagnosing client-side failures, safely sanitizing logs, and executing emergency release rollbacks.

---

## 1. Diagnostic Monitoring Matrix

OPEN-VERSE logs diagnostic events to local operating system logs and stderr. When diagnosing user reports, reference this diagnostic matrix:

| Failure Mode | Log Signature / Error Code | Diagnostic Source | Primary Root Cause & Triage |
| :--- | :--- | :--- | :--- |
| **Update Detection Failure** | `UpdateCheckFailed`, HTTP 4xx/5xx | `webview.log` / Console | CDN caching, invalid JSON manifest, or network offline. |
| **Download Failure** | `DownloadError`, `ChecksumMismatch` | `OpenVerseWebAppInterface` / Rust | Interrupted transfer or SHA-256 mismatch. Payload is deleted. |
| **Installation Failure** | `PackageInstaller: STATUS_FAILURE` | Android `logcat` / NSIS logs | Certificate mismatch or unknown sources blocked by OS. |
| **Restart Failure** | `RestartManager: ERROR_FILE_NOT_FOUND` | `%LOCALAPPDATA%\OPEN-VERSE\` | Target executable held by background zombie process. |
| **Authentication Failure** | `AuthError: 401 Unauthorized` | `desktopClient` / Session | Expired JWT or clock skew. Isolated from session store. |
| **Synchronization Failure** | `SyncMergeConflict`, `502 Bad Gateway` | `/api/sync` store | Network interruption during delta synchronization. |
| **Startup Crash** | Exit code `0xC0000005`, `SIGSEGV` | `code.log`, `hub-daemon.log` | Stale daemon lockfile or port binding collision. |

---

## 2. Credential Redaction & Security Policy

All log sinks, error boundaries, and telemetry handlers **must strictly redact sensitive credentials**:

```typescript
export function sanitizeLog(text: string): string {
  return text
    .replace(/sk-[a-zA-Z0-9_-]{20,}/g, "sk-***REDACTED***")
    .replace(/AIzaSy[a-zA-Z0-9_-]{33}/g, "AIzaSy***REDACTED***")
    .replace(/ghp_[a-zA-Z0-9]{36}/g, "ghp_***REDACTED***")
    .replace(/eyJ[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]{10,}/g, "[JWT_REDACTED]")
    .replace(/("password"\s*:\s*)"[^"]+"/gi, '$1"***REDACTED***"');
}
```

Never output raw HTTP `Authorization` headers or full API keys to persistent disk files or terminal buffers.

---

## 3. Emergency Release Rollback Procedure

If a deployed release introduces an unexpected critical defect, execute the following steps to immediately halt distribution:

### Step 1: Revert the Rolling Desktop Feed (`desktop-latest`)
Run the workflow `desktop-release.yml` with the previous known stable version (e.g., `0.2.2`), OR upload the stable `latest.json` directly using the GitHub CLI:

```bash
# Revert rolling feed to stable release
gh release upload desktop-latest path/to/stable/latest.json --clobber
```

Because clients poll `desktop-latest/latest.json`, pointing the manifest to the stable version immediately stops all clients from downloading the defective release.

### Step 2: Roll Back the Web Release Manifest
In `website/public/open-verse-releases.json` and `website/api/releases/latest.ts`:
1. Revert `version` to the last stable release.
2. Revert `platforms.android.url`, `sha256`, and `versionCode`.
3. Commit and push to `main` (auto-deploys to Vercel within 30 seconds).

### Step 3: Deprecate or Mark Release as Pre-Release
Mark the defective release tag on GitHub as a pre-release or edit its release notes to alert users:
```bash
gh release edit v0.X.Y --prerelease --notes "⚠️ DEPRECATED: Please remain on previous version while patch is prepared."
```

---

## 4. Client Recovery from Corrupted State

### Desktop Recovery
1. Kill any hung processes:
   ```powershell
   Get-Process | Where-Object { $_.Path -like "*OPEN-VERSE*" } | Stop-Process -Force
   ```
2. Clear stale lockfiles:
   ```powershell
   Remove-Item "$env:USERPROFILE\.openverse\data\locks\hub\*" -Force
   ```
3. Re-run the stable installer (`OPEN-VERSE_x64-setup.exe /S`).

### Android Recovery
1. Clear the scoped download cache:
   Settings -> Apps -> OPEN-VERSE -> Storage -> Clear Cache.
2. If signature mismatch occurs due to an untrusted experimental APK, uninstall the test package and reinstall the official release APK.
