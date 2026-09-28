# Wealthly — Project Context

## Purpose

Wealthly is a personal finance + personal goal-setting web application.

## Product areas

Current:

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
- `@fastify/jwt`
- Node `scrypt`

Database:

- PostgreSQL
- Drizzle ORM

Monorepo:

- pnpm workspace

## Known database entities

The current schema is known to include:

- users
- accounts
- categories
- transactions
- goals
- goalContributions
- budgets

Users include at least:

- id UUID primary key
- email unique
- name nullable
- passwordHash
- createdAt

Budgets have a unique constraint for:

`(userId, categoryId, month)`

Do not assume these are the only fields or constraints. Inspect `packages/db/src/schema.ts` before implementing database changes.

## Development data

There is development test data and financial data in the database.

Do not delete or reset the development database without explicit instruction.

## Frontend routing

Dashboard route group:

`apps/web/src/app/(dashboard)/`

Known authenticated pages include:

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

## Authentication architecture

The application originally used localStorage JWT authentication.

The intended architecture is now:

- Fastify creates JWT
- Next login/register route sets `wealthly_token` as an httpOnly cookie
- server components can read the cookie
- Next API proxy routes read the cookie
- proxy routes forward Bearer token to Fastify

The migration from localStorage auth is incomplete until the repository proves otherwise.

Do not introduce another auth storage mechanism to fix an individual page.

Do not return the JWT to browser JavaScript when the intended architecture is httpOnly cookies.

## Authority rule

This document is a context snapshot, not a substitute for inspecting the repository.

When implementation differs from this document:

1. inspect the repository
2. determine the actual current behavior
3. update this document if the architecture change is intentional and durable
