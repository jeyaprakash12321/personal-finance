# Wealthly — Repository Investigation Checklist

## Purpose

Use this checklist before architectural changes, broad debugging, auth migration, or feature work that crosses package boundaries.

The repository is the source of truth.

## Root

Inspect:

- `package.json`
- `pnpm-workspace.yaml`
- `docker-compose.yml`

## Web

Inspect:

- `apps/web/package.json`
- `apps/web/tsconfig.json`
- `apps/web/src/app/layout.tsx`
- `apps/web/src/app/(dashboard)/layout.tsx`
- `apps/web/src/lib/auth.ts`
- `apps/web/src/app/api/auth/login/route.ts`
- `apps/web/src/app/api/auth/register/route.ts`
- `apps/web/src/app/api/accounts/route.ts`
- `apps/web/src/app/api/transactions/route.ts`
- `apps/web/src/app/api/categories/route.ts`
- all other `apps/web/src/app/api/**`
- relevant pages under `apps/web/src/app/(dashboard)/`

Search all web code for:

`http://localhost:4000`

Also search for other direct Fastify calls or obsolete localStorage JWT handling when working on authentication.

## API

Inspect:

- `apps/api/package.json`
- `apps/api/src/server.ts`
- `apps/api/src/plugins/auth.ts`
- `apps/api/src/routes/auth.ts`
- all relevant route files
- relevant services/repositories

For every protected route, verify how it obtains:

`request.user.id`

## Database

Inspect:

- `packages/db/package.json`
- `packages/db/src/index.ts`
- `packages/db/src/schema.ts`
- `packages/db/drizzle.config.ts`
- all relevant migration files

Before schema changes, inspect actual foreign keys, unique constraints, indexes, nullability, and existing migration history.

## Shared

Inspect:

- `packages/shared/package.json`
- `packages/shared/src/**`

Do not assume shared package contents or types.

## Tests

Inspect existing:

- test scripts
- unit tests
- integration tests
- E2E tests
- test setup/fixtures/factories

Do not invent a testing framework if the repository already has one.

## Feature-specific checks

For authenticated/user-owned features:

- trace browser -> Next -> Fastify -> DB
- verify user identity source
- verify user-scoped queries
- verify cross-user isolation
- verify validation
- verify error propagation

For financial data:

- inspect numeric/decimal representation
- inspect transaction/category relationships
- inspect historical-data implications

## Important

The repository itself is authoritative for exact current code.

Project documents describe known architecture, requirements, and priorities; verify them before acting when implementation may have changed.
