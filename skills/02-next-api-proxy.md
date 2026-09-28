# Skill: Next.js API Proxy

## Purpose

Keep authenticated browser requests behind the Next.js boundary.

Browser code should normally call `/api/...`, not Fastify directly.

## Proxy responsibilities

A protected route should:

1. read `wealthly_token`
2. return 401 if missing
3. call Fastify
4. forward `Authorization: Bearer <token>`
5. forward the request body when applicable
6. preserve meaningful backend status codes
7. safely return the response

## Methods

Implement every method actually used by frontend callers.

Do not assume GET-only behavior.

Inspect existing callers before changing a proxy.

## Error behavior

Preserve meaningful status codes:

- 401 authentication failure
- appropriate authorization failure
- 4xx validation errors
- 404 not found
- 5xx backend failures

Do not turn every error into 500.

Handle malformed JSON without crashing the route.

## Anti-patterns

Do not:

- call `http://localhost:4000/...` directly from authenticated client components
- expose JWT secrets
- expose the JWT to client JavaScript
- duplicate auth logic across components
- accept arbitrary `userId` as authorization

## Verification

For proxy changes verify:

- frontend URL
- method
- body
- cookie retrieval
- Authorization forwarding
- backend status propagation
- response shape
- unauthenticated behavior
- authenticated behavior
- backend validation/authorization errors

After finding a direct Fastify call, search the whole web app for other occurrences.
