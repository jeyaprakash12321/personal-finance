# Current Agent Task

## Goal

Take over the existing Wealthly repository and make the current application fully functional and consistently authenticated before adding new features.

## Priority 0 — inspect first

Inspect:
- package.json files
- pnpm-workspace.yaml
- apps/web/src/app
- apps/web/src/lib
- apps/api/src
- packages/db/src
- migration files
- all API proxy routes

Search for:
- `localhost:4000`
- `fetch(`
- `wealthly_token`
- `localStorage`
- `Authorization`
- `request.user`
- `/api/`

Create a short diagnosis before modifying files.

## Priority 1 — fix authentication architecture

Expected result:
- login sets httpOnly cookie
- register sets httpOnly cookie
- protected browser requests go through Next proxies
- server components forward cookie-derived JWT
- logout clears cookie
- no client page depends on localStorage JWT

## Priority 2 — fix Accounts

Verify:
- GET /api/accounts
- POST /api/accounts

Add account must:
- authenticate
- create record for current user
- return created record
- refresh UI
- show backend validation errors

## Priority 3 — fix Transactions

Verify:
- GET /api/transactions
- POST /api/transactions

No direct browser -> Fastify calls.

## Priority 4 — build category management

Users need:
- list
- add
- edit
- delete safely

Transaction forms need:
- category selector
- type-compatible categories

## Priority 5 — audit Goals/Budgets/Reports/Insights/Dashboard

Find and remove direct unauthenticated client calls.

## Priority 6 — verify logout

Cookie must be cleared.

## Priority 7 — settings

Replace hardcoded test user presentation with authenticated `/auth/me`.

## Do not start yet

Do not implement:
- dark mode
- color palettes
- credit cards
- loans
- insurance
- bank integrations
- broker integrations
- portfolio
- net worth

until the existing core flow is stable.

## Acceptance criteria

A logged-in user can:
- view dashboard
- view accounts
- add account
- view transactions
- add income
- add expense
- choose/create categories
- view goals
- create goal
- contribute to goal
- view budgets
- create/update budget
- view reports
- view insights
- open settings
- logout

A logged-out user cannot access protected financial data.

User A cannot access User B's financial data.
