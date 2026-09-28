# Wealthly AI Agent System

## Structure

```text
AGENTS.md
PROJECT_CONTEXT.md
REPOSITORY_CHECKLIST.md
ROADMAP.md
skills/
  00-agent-workflow.md
  01-authentication.md
  02-next-api-proxy.md
  03-transactions-and-categories.md
  04-database-and-migrations.md
  05-testing-and-debugging.md
  06-ui-and-product.md
  07-feature-development.md
  08-code-quality.md
```

## Why these files are separate

### AGENTS.md
Short operational contract for every coding agent. It should stay relatively stable.

### PROJECT_CONTEXT.md
Architecture/product snapshot. Update it when durable architecture or product structure changes.

### REPOSITORY_CHECKLIST.md
Investigation map. It tells an agent where to look before making cross-cutting changes.

### ROADMAP.md
Product sequencing. It prevents agents from turning incidental discoveries into scope creep.

### skills/
Detailed technical procedures. Read only the relevant skills for a task.

## Recommended agent loading order

1. `AGENTS.md`
2. `skills/00-agent-workflow.md`
3. `PROJECT_CONTEXT.md` when architecture/context is relevant
4. `REPOSITORY_CHECKLIST.md` for broad/architectural changes
5. relevant domain skills
6. `ROADMAP.md` only when product scope/priorities matter

## Source-of-truth rule

These documents are guidance and durable context. The repository is authoritative for exact current implementation.

If a document says a known issue exists, verify it before changing code.

If implementation intentionally changes architecture, update the relevant context document after the change.

## Local API and database tools

Start PostgreSQL and the database browser:

```bash
docker compose up -d postgres adminer
pnpm --filter @personal-finance/db migrate
pnpm --filter api seed
```

Then open:

- Swagger UI: http://localhost:4000/docs
- OpenAPI JSON: http://localhost:4000/openapi.json
- Adminer: http://localhost:8080

In Adminer use `PostgreSQL`, server `postgres`, user `finance`, password `finance`, and database `personal_finance`. The demo API user is `demo@wealthly.local` with password `Demo12345!`.
