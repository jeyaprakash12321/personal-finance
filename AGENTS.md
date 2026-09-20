# Wealthly — AI Agent Instructions

## Mission

You are working on **Wealthly**, a personal finance and personal goal-setting application.

The goal is to make the existing application stable and production-quality before adding new financial features.

**Most important rule:** do not blindly patch one symptom. Inspect the complete request path, authentication flow, database schema, API route, frontend caller, and error handling before changing code.

## Non-negotiable workflow

1. Inspect the existing repository before changing anything.
2. Preserve existing working UI unless the task explicitly requires a redesign.
3. Never bypass authentication to make a feature "work".
4. Never expose JWT secrets, passwords, bank credentials, or provider secrets to the browser.
5. Do not store raw bank/broker credentials.
6. Every authenticated request must resolve the current user from the authenticated token/session. Never accept arbitrary `userId` from the browser as the source of authorization.
7. Validate API input with Zod or the project's established validation approach.
8. Keep database queries scoped to the authenticated user.
9. Run TypeScript/build/tests after meaningful changes.
10. When debugging, reproduce the actual failing request before changing code.
11. Do not create duplicate API routes or parallel authentication systems.
12. Prefer one consistent authentication architecture across the application.
13. Do not remove existing data/migrations unless explicitly requested.
14. Before changing the DB schema, inspect existing migrations and schema first.
15. When a file must be changed, provide/use the complete file content rather than a partial patch if communicating changes to the human.

## Current intended architecture

Browser
  -> Next.js web application
  -> authenticated Next.js API proxy
  -> Fastify API
  -> Drizzle ORM
  -> PostgreSQL

The browser should not directly call the Fastify server for authenticated application data.

The intended browser authentication mechanism is an httpOnly cookie named `wealthly_token`.

The Next.js API layer reads the cookie and forwards:
`Authorization: Bearer <token>`
to Fastify.

## Repository

/Users/jeyaprakash/Desktop/personal-finance

Monorepo:

apps/
  web/       Next.js + TypeScript + Tailwind + shadcn/ui
  api/       Fastify + TypeScript

packages/
  db/        Drizzle + PostgreSQL schema
  shared/    Shared code/types

Root:
  package.json
  pnpm-workspace.yaml
  docker-compose.yml

## Commands

Install:
`pnpm install`

Web typecheck:
`pnpm --filter web exec tsc --noEmit`

API build:
`pnpm --filter api build`

Start web:
`pnpm --filter web dev`

Start API:
`pnpm --filter api dev`

Database is PostgreSQL through Docker.

Do not invent commands if package scripts differ; inspect package.json first.

## Known infrastructure

PostgreSQL container:
`personal-finance-postgres`

Host PostgreSQL port:
`5433`

Database:
`personal_finance`

Development API:
`http://localhost:4000`

Development web:
`http://localhost:3000`

The API `.env` contains DATABASE_URL and JWT_SECRET. Never copy secrets into frontend code or commit them.

## Authentication

Fastify uses:
- `@fastify/jwt`
- JWT
- Node `scrypt` password hashing

Protected Fastify routes use:
`request.user.id`

The project previously had an incorrect custom `FastifyRequest.user` augmentation; do not reintroduce it unless TypeScript requires a correctly typed Fastify JWT declaration.

The frontend is being migrated away from localStorage authentication to an httpOnly cookie.

## Important current state

The following Fastify endpoints are protected:
- /accounts
- /transactions
- /categories
- /goals
- /goal-contributions
- /dashboard
- /budgets

A direct request such as:
`curl http://localhost:4000/transactions`
without a Bearer token should return 401. That is expected.

Do not "fix" this by making protected routes public.

## Current known problems

1. Add Account is failing with Unauthorized.
2. The Next.js accounts proxy previously had GET only; it needs correct authenticated POST forwarding too.
3. The complete browser -> Next proxy -> Fastify authentication flow needs to be verified, not assumed.
4. Transactions must support authenticated browser GET and POST through the Next layer.
5. Categories need proper user-facing CRUD.
6. Expense creation needs category selection.
7. Income creation needs category selection.
8. Goals client calls need authenticated proxy handling.
9. Budgets client calls need authenticated proxy handling.
10. Reports and Insights may still contain direct unauthenticated Fastify calls.
11. Dashboard quick-add actions may contain direct Fastify calls.
12. Logout currently clears localStorage but may not clear the httpOnly cookie.
13. Login code may still contain obsolete localStorage token handling.
14. Register/login/logout should use one consistent cookie architecture.
15. Settings currently contains hardcoded test-user presentation data.
16. Existing test data should be preserved during development but cleaned before production.

## Category requirements

Users must be able to create and manage categories.

At minimum support:
- expense categories
- income categories
- custom category creation
- edit
- delete, with safe handling when transactions already use the category
- category selection when creating a transaction

Categories must be scoped to the authenticated user.

Suggested default categories are only defaults; do not force these exact names if the existing DB/API already has a better structure.

## Future roadmap

Only begin these after the current application is stable:

1. Dark theme
2. User-selectable color palettes
3. Credit cards
4. Loans
5. Insurance
6. CSV exports
7. Bank connections
8. Stock portfolio
9. Broker connections
10. Net worth

## Financial integration security

Bank and broker integrations must never collect or store raw online-banking/broker passwords.

Use an appropriate aggregation/provider architecture and store only the minimum provider identifiers/tokens required, with encryption/secrets management appropriate for production.

## Definition of done

A feature is not done merely because TypeScript compiles.

For an authenticated feature verify:

- unauthenticated browser request is rejected
- authenticated browser request works
- API resolves the correct user
- user A cannot access user B's data
- validation rejects invalid input
- frontend displays API errors
- create/update/delete works
- refresh preserves correct data
- direct Fastify endpoint remains protected
- TypeScript passes
- relevant build/tests pass

## Debugging principle

For a 401:

1. Is the browser logged in?
2. Does the httpOnly cookie exist?
3. Does the Next route receive the cookie?
4. Does the Next route extract the token?
5. Does Next send `Authorization: Bearer ...` to Fastify?
6. Does Fastify verify the JWT?
7. Does `request.user.id` exist?
8. Does the database query use that ID?
9. Is the browser calling the correct Next route rather than Fastify directly?

Never skip these steps.
