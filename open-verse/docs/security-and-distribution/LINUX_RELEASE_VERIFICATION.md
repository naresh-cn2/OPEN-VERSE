# Linux Release Signing & Verification Architecture

## 1. Supported Packaging Formats

OPEN-VERSE supports standard 64-bit Linux distribution packages built via Tauri v2:
- **Debian / Ubuntu Package (`.deb`)**: Native installation via `dpkg` / `apt`. Includes desktop launcher and AppStream metainfo.
- **Red Hat / Fedora Package (`.rpm`)**: Native installation via `rpm` / `dnf`. Includes desktop launcher and AppStream metainfo.
- **Standalone AppImage**: Self-contained executable archive capable of running across distributions without root privileges.

---

## 2. GPG Signing Pipeline: `sign-linux-packages.sh`

The automated signing script is located at `scripts/sign-linux-packages.sh`.

### Key Pipeline Steps:
1. **GPG Key Ingestion**: Imports the dedicated OPEN-VERSE release GPG key from secret `GPG_SIGNING_KEY`.
2. **Public Key Export**: Exports the ASCII-armored public key to `dist/linux/open-verse-release.asc` and uploads it to GitHub Releases.
3. **Detached Signatures**: Generates a detached cryptographic signature (`<package>.asc`) for every `.deb`, `.rpm`, and `.AppImage` archive.
4. **Signed Manifest**: Computes SHA-256 hashes of all packages into `SHA256SUMS` and produces a cryptographically signed manifest: `SHA256SUMS.asc`.

---

## 3. End-User Installation & Verification Guide

### Step 1: Import the OPEN-VERSE GPG Public Key
```bash
# Download and import the release signing key
curl -sSL https://open-verse-website.vercel.app/open-verse-release.asc | gpg --import
```

### Step 2: Verify Package Integrity & Authenticity
```bash
# Verify the detached GPG signature
gpg --verify OPEN-VERSE_0.2.6_amd64.deb.asc OPEN-VERSE_0.2.6_amd64.deb

# Verify against the signed SHA-256 manifest
gpg --verify SHA256SUMS.asc
sha256sum --check --ignore-missing SHA256SUMS
```

### Step 3: Install Package
```bash
# Debian / Ubuntu:
sudo dpkg -i OPEN-VERSE_0.2.6_amd64.deb
sudo apt-get install -f  # resolve any missing system webview dependencies

# Fedora / RHEL:
sudo rpm -ivh OPEN-VERSE-0.2.6-1.x86_64.rpm
```

---

## 4. Current Status & Roadmap

- **Status**: **IN PREVIEW / BUILD VERIFIED**.
- **Roadmap**: Packaging for Flathub (Flatpak) for sandboxed, repository-managed distribution.
