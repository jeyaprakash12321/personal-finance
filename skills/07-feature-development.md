# Skill: Adding New Wealthly Features

## Objective

Build features as complete vertical slices while preserving architecture, security, financial-data integrity, and existing product behavior.

## Process

1. Define user-facing behavior.
2. Inspect schema/architecture.
3. Inspect related API/frontend patterns.
4. Identify auth/authorization.
5. Design DB changes.
6. Create migration if needed.
7. Add validation/shared types where appropriate.
8. Implement Fastify API.
9. Add authentication/user scoping.
10. Add Next proxy.
11. Implement frontend.
12. Add loading/error/empty states.
13. Add unit tests for isolated rules.
14. Add integration tests for API/database boundaries.
15. Add E2E/manual coverage for critical journeys.
16. Test unauthorized and cross-user access.
17. Test edge cases.
18. Run verification.
19. Review final diff.

## Define behavior first

Record:

- user goal
- success behavior
- validation failures
- auth behavior
- loading/empty/error states
- destructive behavior
- non-goals

If behavior is materially ambiguous, stop for clarification.

## Explore

Inspect:

- schema/migrations
- related models
- Fastify routes/services
- Next routes
- frontend
- validation/types
- tests
- package scripts
- project docs
- relevant skills

Reuse existing patterns.

## Database

Inspect actual relationships and existing data before schema changes.

Protect historical financial data.

## Backend

Implement:

- validation
- authentication
- authorization
- user scoping
- business logic
- persistence
- predictable responses/errors

Never use browser `userId` for authorization.

## Proxy

Ensure:

- cookie is read
- missing auth -> 401
- Authorization forwarded
- body forwarded where needed
- status codes preserved
- response safely handled

## Frontend

Implement:

- page/components
- forms
- fetching
- loading/error/empty states
- validation
- responsive behavior

Follow existing Wealthly UI.

## Security test matrix

For user-owned features:

- unauthenticated
- own resource
- cross-user read
- cross-user update
- cross-user delete
- forged userId
- invalid resource
- invalid related resource

## Multi-agent feature workflow

### Explorer
No code changes. Report architecture, affected files, risks.

### Challenger
No code changes. Independently review data model, auth, concurrency, edge cases, compatibility, and test strategy.

### Human
Resolve architectural/product disagreements.

### Implementer
Implement approved plan and tests.

### Reviewer
Adversarially inspect correctness, security, missing tests, complexity, and scope.

Agent consensus is not proof of correctness.

## Completion

A feature is complete only when appropriate unit/integration/E2E coverage exists, security is verified, typecheck/lint/build pass as applicable, and the final diff is reviewed.
