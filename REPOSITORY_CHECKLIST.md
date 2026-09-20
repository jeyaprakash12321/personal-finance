# Repository Handoff Checklist

The agent should inspect these files before making architectural changes.

## Root

- package.json
- pnpm-workspace.yaml
- docker-compose.yml

## Web

- apps/web/package.json
- apps/web/tsconfig.json
- apps/web/src/app/layout.tsx
- apps/web/src/app/(dashboard)/layout.tsx
- apps/web/src/lib/auth.ts
- apps/web/src/app/api/auth/login/route.ts
- apps/web/src/app/api/auth/register/route.ts
- apps/web/src/app/api/accounts/route.ts
- apps/web/src/app/api/transactions/route.ts
- apps/web/src/app/api/categories/route.ts
- all other `apps/web/src/app/api/**`
- all pages under `apps/web/src/app/(dashboard)/`

Search all web code for:
`http://localhost:4000`

## API

- apps/api/package.json
- apps/api/src/server.ts
- apps/api/src/plugins/auth.ts
- apps/api/src/routes/auth.ts
- all route files

Inspect how every protected route obtains:
`request.user.id`

## DB

- packages/db/package.json
- packages/db/src/index.ts
- packages/db/src/schema.ts
- packages/db/drizzle.config.ts
- all migration files

## Shared

Inspect:
- packages/shared/package.json
- packages/shared/src/**

Do not assume shared package contents.

## Important

The repository itself is the source of truth for exact current code.

The handoff documents describe known architecture and requirements, but the agent must inspect the repository before changing it.
