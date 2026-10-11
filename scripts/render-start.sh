#!/usr/bin/env bash
set -e

export PNPM_HOME="$HOME/.local/share/pnpm"
export PATH="$PNPM_HOME:$PATH"

echo "Running database migrations..."
pnpm --filter @personal-finance/db migrate

echo "Starting API server..."
node apps/api/dist/server.js
