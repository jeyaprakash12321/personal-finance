# Wealthly Project Context

## Product

Wealthly is a personal finance + personal goal-setting web application.

Current product areas:
- Dashboard
- Transactions
- Accounts
- Goals
- Budgets
- Reports
- Insights
- Settings
- Help

Planned:
- dark mode
- accent palettes
- credit cards
- loans
- insurance
- CSV export
- bank connections
- stock portfolio
- broker connection
- net worth

## Stack

Frontend:
- Next.js
- TypeScript
- Tailwind CSS
- shadcn/ui

Backend:
- Fastify
- TypeScript
- @fastify/jwt
- Node scrypt

Database:
- PostgreSQL
- Drizzle ORM

Monorepo:
- pnpm workspace

## Known database entities

The Drizzle schema currently includes:
- users
- accounts
- categories
- transactions
- goals
- goalContributions
- budgets

Users include:
- id UUID primary key
- email unique
- name nullable
- passwordHash
- createdAt

Budgets have a unique constraint for:
(userId, categoryId, month)

Do not assume the schema is limited to these fields. Inspect:
`packages/db/src/schema.ts`
before implementing changes.

## Existing development data

There is a development test user and development financial data in the database.

Do not delete or reset the development database without explicit instruction.

## Frontend routing

There is a dashboard route group:
`apps/web/src/app/(dashboard)/`

Authenticated pages currently include:
- dashboard
- transactions
- accounts
- goals
- budgets
- reports
- insights
- settings
- help

Login/register are outside the dashboard route group.

## Authentication migration

The application originally used localStorage JWT authentication.

The intended architecture is now:
- Fastify creates JWT
- Next login/register route sets `wealthly_token` as httpOnly cookie
- server components can read the cookie
- Next API proxy routes read the cookie
- proxy routes forward Bearer token to Fastify

The migration is incomplete and must be finished consistently.

## Critical rule

Do not introduce another auth storage mechanism just to make one page work.

Do not return the JWT to browser JavaScript if the intended architecture is httpOnly cookies.
