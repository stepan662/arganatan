#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
LIB_DIR="$ROOT_DIR/lib"

cd "$ROOT_DIR"

echo "==> Checking for uncommitted changes..."
if ! git diff --quiet || ! git diff --cached --quiet; then
  echo "Error: there are uncommitted changes. Please commit or stash them before publishing."
  exit 1
fi

echo "==> Cleaning..."
pnpm clean

echo "==> Installing dependencies..."
pnpm install

echo "==> Building library..."
pnpm --filter react-arven build

echo "==> Computing prerelease version..."
cd "$LIB_DIR"
BASE_VERSION=$(node -p "require('./package.json').version")
SHORT_SHA=$(git -C "$ROOT_DIR" rev-parse --short HEAD)
PRERELEASE_VERSION="${BASE_VERSION}-prerelease.${SHORT_SHA}"
echo "    Version: $PRERELEASE_VERSION"

echo "==> Logging in to npm (you will be prompted)..."
npm login

echo "==> Setting version in lib/package.json..."
npm version "$PRERELEASE_VERSION" --no-git-tag-version

echo "==> Publishing react-arven@$PRERELEASE_VERSION with tag 'prerelease'..."
pnpm publish --tag prerelease --no-git-checks

echo "==> Reverting lib/package.json..."
git -C "$ROOT_DIR" checkout -- lib/package.json

echo ""
echo "Published react-arven@$PRERELEASE_VERSION under the 'prerelease' tag."
