#!/bin/bash
set -euo pipefail

RELEASE_TAG="hermes-agent"
GITHUB_TOKEN="${GITHUB_TOKEN}"

echo "Fetching release info for tag: $RELEASE_TAG"
RESPONSE=$(curl -s -X GET "https://api.github.com/repos/${GITHUB_REPOSITORY}/releases/tags/${RELEASE_TAG}" \
  -H "Authorization: token $GITHUB_TOKEN")

RELEASE_ID=$(echo "$RESPONSE" | python3 -c "import sys,json; print(json.load(sys.stdin)['id'])")
echo "Release ID: $RELEASE_ID"

for f in release-assets/windows/* release-assets/linux/* release-assets/macos/*; do
  if [ -f "$f" ]; then
    filename=$(basename "$f")
    echo "Uploading $filename..."
    curl -s -X POST "https://uploads.github.com/repos/${GITHUB_REPOSITORY}/releases/${RELEASE_ID}/assets?name=${filename}" \
      -H "Authorization: token $GITHUB_TOKEN" \
      -H "Content-Type: application/zip" \
      -T "$f"
    echo ""
  fi
done

echo "Verifying release assets..."
curl -s "https://api.github.com/repos/${GITHUB_REPOSITORY}/releases/tags/${RELEASE_TAG}" \
  -H "Authorization: token $GITHUB_TOKEN" | python3 -c "
import sys, json
data = json.load(sys.stdin)
print(f'Release: {data[\"tag_name\"]}')
print(f'Assets: {len(data[\"assets\"])}')
for a in data['assets']:
    print(f'  - {a[\"name\"]}: {a[\"size\"]} bytes')
"
