#!/usr/bin/env bash
set -e

export PNPM_HOME="$HOME/.local/share/pnpm"
export PATH="$PNPM_HOME:$PATH"

# Install pnpm binary directly — skip shell integration to avoid SHELL detection error
curl -fsSL https://get.pnpm.io/install.sh | SHELL=bash sh -

export PATH="$PNPM_HOME:$PATH"

echo "pnpm version: $(pnpm --version)"

pnpm install --frozen-lockfile
pnpm --filter api build

echo "Build complete"
