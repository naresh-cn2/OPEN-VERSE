#!/usr/bin/env bash
# Official OPEN-VERSE Linux Package Signing Script
# Signs .deb, .rpm, and AppImage deliverables using GPG and generates detached signatures.

set -euo pipefail

PACKAGE_DIR="${1:-dist/linux}"

echo "=========================================================="
echo "       OPEN-VERSE Linux GPG Package Signing Pipeline      "
echo "=========================================================="

if [ -z "${GPG_SIGNING_KEY:-}" ]; then
  echo "⚠️ GPG_SIGNING_KEY secret is not configured."
  echo "Skipping GPG signature generation. Generating raw SHA-256 manifests only."
  if [ -d "$PACKAGE_DIR" ]; then
    cd "$PACKAGE_DIR"
    find . -type f \( -name "*.deb" -o -name "*.rpm" -o -name "*.AppImage" -o -name "*.tar.gz" \) -exec sha256sum {} + > SHA256SUMS
    cat SHA256SUMS
  fi
  exit 0
fi

# Import private key
echo "Importing GPG signing key..."
echo "$GPG_SIGNING_KEY" | gpg --batch --import

KEY_ID=$(gpg --list-secret-keys --keyid-format LONG | grep -E "^sec" | head -n 1 | awk '{print $2}' | cut -d'/' -f2)
echo "Using GPG Key ID: $KEY_ID"

# Export public key for distribution
mkdir -p "$PACKAGE_DIR"
gpg --armor --export "$KEY_ID" > "$PACKAGE_DIR/open-verse-release.asc"
echo "Exported public key to $PACKAGE_DIR/open-verse-release.asc"

# Sign all package artifacts
cd "$PACKAGE_DIR"
for pkg in *.deb *.rpm *.AppImage *.tar.gz; do
  if [ -f "$pkg" ]; then
    echo "Signing $pkg with GPG..."
    gpg --batch --yes --detach-sign --armor --default-key "$KEY_ID" "$pkg"
    echo "Generated detached signature: $pkg.asc"
  fi
done

# Generate SHA256SUMS and sign it
sha256sum *.deb *.rpm *.AppImage *.tar.gz > SHA256SUMS 2>/dev/null || true
if [ -f "SHA256SUMS" ]; then
  gpg --batch --yes --clearsign --default-key "$KEY_ID" --output SHA256SUMS.asc SHA256SUMS
  echo "Generated cryptographically signed manifest: SHA256SUMS.asc"
fi

echo "✅ Linux package signing complete."
