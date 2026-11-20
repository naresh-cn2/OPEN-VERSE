# OPEN-VERSE Definition of Done (DoD)

To maintain long-term stability and prevent regressions across platforms, every feature, bug fix, or contribution to OPEN-VERSE must satisfy this **Definition of Done** before it can be merged or released.

---

## The 6 Mandatory Release Criteria

A task is **NOT complete** until all six gates are satisfied:

### 1. New Feature / Fix Tests Pass
- The specific capability or bug fix must include automated test coverage verifying the expected behavior.
- Edge cases (network timeouts, corrupt payloads, missing permissions) must be tested.

### 2. All Existing Regression Suites Pass
All permanent regression test suites must pass without modification or weakening:
- `bun run tests/e2e-cross-device-updater-repair.ts` (Manifest and installer hooks)
- `bun run tests/e2e-resilience-and-recovery.ts` (Corrupt downloads, redaction, anti-downgrade)
- `bun run tests/e2e-universal-cross-platform-acceptance.ts` (Cross-device auth, sync, and isolation)
- `bun run tests/e2e-android-auto-update-lifecycle.ts` (Real Android PackageInstaller flow)

> ⚠️ **Rule**: Never remove, disable, or weaken an existing test simply to make CI turn green. If a test fails, the code must be repaired.

### 3. Production Builds Succeed Across Supported Platforms
- Windows NSIS installer compiles and packages with valid Minisign signature.
- Android release APK compiles cleanly with monotonic `versionCode`.
- Web application compiles with zero TypeScript errors (`tsc --noEmit`) and builds via Vite.

### 4. Cross-Device Compatibility & Parity Maintained
- Interface behavior, authentication models, and settings persistence must remain consistent across Windows, Android, macOS, Linux, and Web.
- When platform hardware cannot be tested directly in a given environment, mark it explicitly as **Unverified** rather than reporting false positive passes.

### 5. Documentation Is Synchronized
- Version numbers in documentation match `tauri.conf.json`, `package.json`, and `open-verse-releases.json`.
- Any changed workflows or new requirements are reflected in `README.md`, `CHANGELOG.md`, or relevant files in `docs/`.

### 6. Production Deployment & Deliverables Verified
- In-place auto-update feeds (`latest.json` and `open-verse-releases.json`) are updated.
- Public checksums (SHA-256) match the compiled production assets.
- Download links and live website endpoints deliver the genuine release binary.

