#!/usr/bin/env bash
set -e

export PNPM_HOME="$HOME/.local/share/pnpm"
export PATH="$PNPM_HOME:$PATH"

# Install pnpm into writable home directory
curl -fsSL https://get.pnpm.io/install.sh | SHELL=bash sh -
export PATH="$PNPM_HOME:$PATH"

echo "pnpm version: $(pnpm --version)"

# Install all workspace dependencies
pnpm install --frozen-lockfile

# Build db package first (API depends on it)
echo "Building @personal-finance/db..."
pnpm --filter @personal-finance/db build

# Build API
echo "Building API..."
pnpm --filter api build

echo "Build complete"
