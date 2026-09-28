# Skill: Code Quality

## Objective

Keep Wealthly maintainable, predictable, secure, and consistent.

Optimize for correctness and clarity, not cleverness.

## TypeScript

Preserve strict typing.

Avoid unjustified:

- `any`
- unsafe casts
- compiler suppression
- duplicated types
- dead auth code

Prefer existing shared types and runtime validation at untrusted boundaries.

## React

Use:

- `useEffect` for side effects
- `useMemo` only for actual memoization
- `useCallback` only when useful

Do not use `useMemo` as a substitute for `useEffect`.

Follow existing component/data-fetching patterns.

## Architecture

Prefer:

- existing patterns
- small focused modules
- clear boundaries
- real reuse
- explicit data flow

Avoid:

- speculative abstractions
- premature generalization
- duplicate implementations
- unrelated refactors

## API

Keep validation, authentication, authorization, persistence, and response formatting understandable.

Do not let browser-supplied ownership determine authorization.

## Error handling

- preserve useful context
- handle at the correct boundary
- preserve meaningful status codes
- expose safe user messages
- never leak secrets/internal details
- never silently swallow errors

## Security review

Look for:

- auth bypass
- missing authorization
- cross-user access
- unsafe input
- secret exposure
- client-side token storage
- direct backend calls
- sensitive logging

## Financial review

Look for:

- floating-point money arithmetic
- unintended rounding
- wrong signs/types
- invalid currency assumptions
- historical data mutation
- inconsistent totals

## Testing quality

When logic changes:

- test business behavior
- test important boundaries
- add regressions for bugs
- test authorization/user isolation
- test financial edge cases
- avoid implementation-detail assertions
- avoid excessive mocking
- keep tests deterministic

Do not add meaningless tests solely for coverage.

## Dependency discipline

Before adding a dependency:

1. inspect existing dependencies
2. check whether the capability already exists
3. consider platform/standard capabilities
4. consider maintenance/security cost
5. explain the need

Do not upgrade unrelated dependencies.

## Diff discipline

Inspect:

- changed/deleted files
- migrations
- dependencies
- generated files
- accidental secrets
- unrelated refactoring

## Review checklist

Ask:

- simplest correct implementation?
- follows existing patterns?
- security intact?
- user isolation intact?
- errors correct?
- tests meaningful and correctly scoped?
- types sound?
- diff scoped?
- unnecessary dependency?
- unrelated behavior changed?

## Completion

Code quality work is complete when architecture, security, typing, testing, and diff scope are sound.
