# Skill: Testing and Debugging

## Objective

Use tests as executable specifications, debug from evidence, and verify behavior at the appropriate system boundary.

## Test pyramid

### Unit

Use for isolated:

- business rules
- validation
- calculations
- transformations
- authorization decisions
- date/period logic

Unit tests should be fast, deterministic, and focused.

### Integration

Use for:

- API + auth + service + database
- repositories
- database constraints
- persistence
- ownership
- response/status behavior

Use real boundaries when those boundaries are what you are testing.

### E2E/manual

Use for critical user-visible journeys:

- login/logout
- create transaction
- edit/delete flows
- protected pages
- dashboard actions
- browser -> Next -> Fastify -> DB

Do not turn every small function into E2E.

## Choosing tests

Ask:

1. What business rule can fail?
2. What system boundary can fail?
3. What security invariant can fail?
4. Is there a critical user journey?
5. Is this a regression?

A feature may need multiple test levels.

## Unit-test rules

- isolate the unit
- mock only external dependencies when isolation is useful
- do not mock the behavior under test
- test meaningful branches and boundaries
- test errors
- keep deterministic

Avoid tests that only verify implementation details such as a particular internal function call.

## Mocking

Mock external services/network/time when appropriate.

Do not mock away:

- the business rule under test
- database constraints in database integration tests
- the authentication boundary in security integration tests

If everything is mocked, the test may pass while the real system is broken.

## Authentication/security testing

For protected resources test:

- unauthenticated -> 401
- authenticated own resource -> success
- cross-user read -> rejected/not found per contract
- cross-user update/delete -> rejected
- forged userId -> ignored for authorization
- invalid/expired token where applicable

Use at least two users where practical.

## API tests

Verify:

- method
- valid request
- invalid request
- status
- response shape
- authentication
- authorization
- not-found behavior
- error propagation

## Database tests

Verify:

- CRUD
- foreign keys
- unique constraints
- nullability/defaults
- transaction/rollback behavior
- migration behavior where relevant

## Financial tests

Cover:

- whole amounts
- decimal amounts
- zero
- domain-invalid negatives
- large values
- precision
- rounding
- income/expense
- totals
- date boundaries
- timezone-sensitive logic
- duplicate operations
- historical-data preservation

Do not use floating-point equality to define financial semantics.

## UI tests

Test meaningful outcomes:

- loading
- success
- empty
- validation error
- backend error
- destructive confirmation
- invalid submission
- important responsive behavior

Do not test every CSS class.

## Regression workflow

1. reproduce
2. add a failing regression test when practical
3. fix
4. verify regression test
5. run related tests
6. run broader verification

When fixing an anti-pattern, search for other occurrences.

## Test data

Tests must not depend on leftover state.

Prefer:

- factories/builders
- deterministic fixtures
- isolated databases or transactions
- independent test setup

Do not depend on execution order, developer-local state, uncontrolled wall-clock time, or random values without deterministic control.

## Flaky tests

1. reproduce
2. identify timing/shared-state/order issue
3. fix root cause
4. avoid arbitrary timeout increases
5. rerun

Do not silently ignore flaky tests.

## Coverage

Coverage is a signal, not the goal.

Prioritize:

- auth
- authorization
- user isolation
- financial calculations
- destructive operations
- migrations
- critical business rules
- regression-prone code

## Debugging

Trace evidence in order:

1. exact failure
2. URL/method/status
3. browser Network/console
4. Next route
5. Fastify route
6. auth
7. authorization/user scope
8. database query
9. response shape
10. root cause

Fix the smallest correct root cause.

## Verification order

1. focused tests
2. related tests
3. integration
4. E2E/manual where relevant
5. typecheck
6. lint
7. build

Never delete/weaken/skip tests merely to make the suite pass.
