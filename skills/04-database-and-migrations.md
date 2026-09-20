# Skill: Database and Drizzle

## Rules

Before changing schema:
1. inspect packages/db/src/schema.ts
2. inspect existing migrations
3. understand foreign keys and constraints
4. determine whether existing data can migrate safely

Never edit production-like data just to make a test pass.

## Migration workflow

Use the project's installed Drizzle Kit version and inspect package scripts before running migration commands.

Do not assume CLI options from another Drizzle version.

If migration history is unusual, inspect the migration table before modifying it.

## Data integrity

Financial data must remain consistent.

Important relationships may include:
- users -> accounts
- users -> transactions
- users -> categories
- users -> goals
- users -> budgets
- goals -> goalContributions
- accounts -> transactions
- categories -> transactions/budgets

Inspect actual foreign keys before making assumptions.

## Money

Use database numeric/decimal types where appropriate.

Do not use floating-point arithmetic for persistent money values.

Convert carefully at API/UI boundaries.
