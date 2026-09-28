# Skill: Transactions and Categories

## Objective

Maintain correct, user-scoped financial transaction/category behavior without corrupting historical data.

## Transaction rules

Use the actual Drizzle schema as authoritative for field names and relationships.

Typical transaction concepts include:

- account
- category
- amount
- type
- description
- transaction date

Types currently include income and expense.

## Category rules

Categories are user-owned.

Support as required:

- list
- create
- update
- safe delete

Category type must be compatible with transaction type.

## Ownership

For every transaction/category operation:

1. derive user identity from authenticated token
2. verify account/category ownership
3. verify ownership before update/delete
4. prevent cross-user access

Never use browser `userId` as authorization.

## Financial integrity

Persistent money must use the project's appropriate numeric/decimal representation.

Do not use floating-point persistence for money.

Test:

- whole amounts
- decimals
- zero
- invalid negatives where prohibited
- large values
- precision/rounding
- income/expense semantics
- date boundaries

## Safe category deletion

Before deleting a category, inspect references from transactions/budgets.

Use the existing data model to choose among:

- safe deletion
- soft deletion
- replacement category
- preventing deletion

Do not invent a destructive strategy.

## Required tests

Transactions:

- create income
- create expense
- list own
- update own
- delete own where supported
- invalid amount/date/account/category
- category/type mismatch
- cross-user access

Categories:

- list/create/update
- safe deletion
- referenced category
- cross-user access
- type compatibility

## Completion

Financial work is complete only when ownership, consistency, historical safety, and relevant tests are verified.
