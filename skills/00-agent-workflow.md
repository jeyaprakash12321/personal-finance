# Skill: AI Agent Engineering Workflow

## Purpose

Define how coding agents work on Wealthly regardless of whether the agent is Codex, Cursor, Kiro, Antigravity, or another coding agent.

The repository is the source of truth. Agent chat history is temporary.

## Required workflow

1. Understand the task.
2. Read `AGENTS.md`.
3. Identify and read the relevant skill files.
4. Explore the repository and relevant project docs.
5. Reproduce the current behavior when debugging.
6. Plan the smallest correct change.
7. Implement in small, reviewable steps.
8. Add appropriate tests.
9. Run focused verification.
10. Run broader verification when appropriate.
11. Review the final diff.
12. Report evidence, risks, and remaining work.

Do not skip a phase merely because the change appears small.

## Project-document hierarchy

Use project documents for different purposes:

- `AGENTS.md` = agent operating rules and non-negotiable constraints.
- `PROJECT_CONTEXT.md` = current architecture/product snapshot.
- `REPOSITORY_CHECKLIST.md` = investigation checklist for architectural work.
- `ROADMAP.md` = product sequencing and future scope.
- `skills/*.md` = detailed technical/domain procedures.

If documents conflict with actual source code, inspect the repository and treat the repository as authoritative for current implementation.

If a project document describes a known problem, verify that it still exists before acting on it.

## Task classification

### Investigation

- Do not modify code unless requested.
- Identify relevant files, data flow, dependencies, tests, and constraints.
- Report facts separately from hypotheses.

### Bug fix

1. Reproduce or obtain concrete evidence.
2. Trace the complete failing path.
3. Identify root cause.
4. Add or identify regression coverage.
5. Fix the smallest correct root cause.
6. Run the regression test.
7. Run related verification.

### Feature

1. Define observable behavior.
2. Inspect architecture and related implementation.
3. Identify security/data/API/UI impact.
4. Create a plan.
5. Implement.
6. Test normal, invalid, unauthorized, and edge cases.
7. Verify the complete flow.

### Refactor

- State the behavior that must remain unchanged.
- Preserve public contracts unless explicitly changing them.
- Add/preserve regression coverage.
- Do not combine unrelated product work.

## Exploration rules

Before non-trivial implementation inspect only the relevant scope, including as applicable:

- repository structure
- package scripts
- existing patterns
- API routes
- frontend callers
- auth
- schema and migrations
- tests
- shared types/validation
- relevant project documents
- relevant skill files

Do not blindly read the entire repository.

## Planning output

For a non-trivial task, the plan should identify:

- current behavior
- desired behavior
- files likely to change
- data/schema impact
- API impact
- auth/authorization impact
- UI impact
- tests
- verification commands
- risks/open questions

Stop for human direction when the plan introduces a destructive data change, security architecture change, breaking API, production-data operation, or other high-risk ambiguity.

## Implementation rules

- Follow existing architecture and conventions.
- Reuse existing utilities/dependencies.
- Prefer the smallest coherent change.
- Do not introduce speculative abstractions.
- Do not perform unrelated cleanup.
- Do not silently expand scope when implementation reveals a different architecture is required.
- Preserve authentication and user isolation.
- Never weaken tests or security to make a task pass.

## Testing rules

Choose tests based on the behavior:

- Unit: isolated business rules, validation, calculations, transformations.
- Integration: API/service/database/auth boundaries.
- E2E/manual: critical user-visible journeys.
- Security: authentication, authorization, cross-user isolation.
- Regression: reproducible bugs.

Do not write tests only to increase coverage percentage.

## Multi-agent rules

Use role separation rather than parallel edits to the same working tree:

- Explorer: investigates and reports; no code changes.
- Challenger/reviewer: independently examines architecture, security, edge cases, and test strategy.
- Implementer: owns the approved implementation.
- Adversarial reviewer: tries to find correctness, security, regression, and scope issues.

Do not use agent consensus as proof of correctness.

Prefer separate branches/worktrees for independent implementations.

## Handoff

A handoff must include:

- objective
- current state
- files changed
- decisions
- tests run
- failures
- unresolved questions
- exact next action

Do not rely on chat history alone.

## Verification

Run the narrowest useful checks first, then broaden:

1. focused tests
2. related tests
3. integration tests
4. E2E/manual flow when relevant
5. typecheck
6. lint
7. build

For user-owned data, verify unauthenticated and cross-user access behavior.

## Diff review

Before completion inspect:

- changed/deleted files
- migrations
- package/dependency changes
- generated files
- accidental secrets
- unrelated formatting/refactoring
- authorization/user scoping
- missing tests
- API compatibility

## Stop conditions

Stop and ask for human direction when encountering:

- ambiguous product requirements
- destructive data operations
- production database changes
- authentication/authorization architecture changes
- secrets/credentials
- breaking API changes
- new external integrations
- meaningful new dependency/security risk
- inconsistent migration history
- contradictory architectural requirements

## Completion report

Report:

1. What changed
2. Files changed
3. Tests/checks actually run
4. Results
5. Remaining risks
6. Assumptions
7. Human-review items

Never claim a check was run when it was not.
