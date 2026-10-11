#!/usr/bin/env bash
set -e

# Install pnpm into a writable directory (Render's /usr/bin and /usr/lib are read-only)
export PNPM_HOME="$HOME/.local/share/pnpm"
export PATH="$PNPM_HOME:$PATH"

curl -fsSL https://get.pnpm.io/install.sh | sh -

# Reload PATH after install
export PATH="$PNPM_HOME:$PATH"

echo "pnpm version: $(pnpm --version)"

pnpm install --frozen-lockfile
pnpm --filter api build

echo "Build complete"
