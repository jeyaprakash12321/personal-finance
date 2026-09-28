# Skill: Database and Drizzle

## Objective

Change the database safely and preserve existing financial data.

## Before schema changes

Inspect:

- `packages/db/src/schema.ts`
- existing migrations
- foreign keys
- indexes
- unique constraints
- nullability/defaults
- application usage
- package scripts
- installed Drizzle Kit version

Do not assume relationships from filenames.

## Migration workflow

1. inspect current schema
2. inspect migration history
3. design change
4. identify existing-data impact
5. use the project's established Drizzle workflow
6. inspect generated migration
7. test on a safe database
8. verify application behavior
9. review data-loss/rollback implications

Never guess CLI flags from another Drizzle version.

## Financial data

Use numeric/decimal representations appropriate to the schema.

Do not silently round persisted financial values.

Preserve historical transaction meaning.

## Destructive changes

Human review is required for:

- dropping tables/columns
- destructive type changes
- new non-null constraints that existing rows may violate
- foreign-key changes
- deleting historical financial data
- production data transformations

## Migration tests

Verify where applicable:

- clean migration
- representative existing data migration
- constraints
- foreign keys
- unique constraints
- invalid data rejection
- transactional/rollback behavior
- application CRUD after migration

Do not rely on TypeScript compilation to prove schema correctness.
