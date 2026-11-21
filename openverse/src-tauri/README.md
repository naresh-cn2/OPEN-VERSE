# OPEN-VERSE Native Desktop Runtime (`src-tauri`)

The active Tauri configuration and native Rust desktop runtime for OPEN-VERSE are maintained in:

👉 [`open-verse/desktop/apps/examples/desktop-app/src-tauri/`](../desktop/apps/examples/desktop-app/src-tauri/)

### Key Configurations:
- **`tauri.conf.json`**: Primary Tauri configuration (app identifiers, windows, permissions, updater endpoints, and security CSP).
- **`src/main.rs`**: Application entry point, window management, deep-link handling, and OS event hooks.
- **`Cargo.toml`**: Rust dependencies including `tauri`, `tauri-plugin-updater`, `tauri-plugin-deep-link`, and Minisign verification.
