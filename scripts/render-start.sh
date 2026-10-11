
#!/usr/bin/env bash
set -euo pipefail

export SHELL=/bin/bash
export npm_config_prefix="$HOME/.npm-global"
export PATH="$HOME/.npm-global/bin:$PATH"

# Apply database migrations, then start the API.
pnpm --filter @personal-finance/db migrate
exec node apps/api/dist/server.js
