# Skill: Code Quality

## TypeScript

Keep strict TypeScript enabled.

Avoid:
- any unless unavoidable
- duplicated types when shared types are appropriate
- unsafe casts
- dead auth code

## React

Use:
- useEffect for side effects
- useMemo for actual memoized computations
- useCallback only where it provides value

Do not use useMemo as a substitute for useEffect.

## API

Keep:
- validation
- authentication
- authorization
- database access
- response formatting

clear and predictable.

## Cleanup

When migrating from localStorage auth to cookie auth:
- remove obsolete token setters/getters from pages that no longer need them
- remove dead direct Fastify calls
- remove duplicated authentication paths
- preserve the auth helper only if still used elsewhere
