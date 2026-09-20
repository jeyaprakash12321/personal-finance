# Skill: Authentication and Authorization

## Objective

Implement and debug authentication without weakening security.

## Expected flow

Login:
Browser
-> POST /api/auth/login
-> Next.js calls Fastify /auth/login
-> Fastify verifies password
-> Fastify returns user + JWT
-> Next sets httpOnly `wealthly_token`
-> browser receives user data, not a JS-readable JWT

Authenticated data:
Browser
-> /api/<resource>
-> Next reads wealthly_token
-> Next forwards Authorization Bearer token
-> Fastify jwtVerify()
-> request.user.id
-> database query scoped to user

Logout:
Browser
-> POST /api/auth/logout
-> Next clears wealthly_token
-> redirect/login

## Never do

- Do not make protected Fastify routes public.
- Do not trust a browser-supplied userId.
- Do not store passwords.
- Do not put JWT secrets in frontend code.
- Do not expose httpOnly cookie value to JavaScript.
- Do not add localStorage auth as a second source of truth.

## Debugging a 401

Inspect the request at each boundary.

Next proxy should have:
`const token = cookieStore.get("wealthly_token")?.value`

Fastify request should have:
`Authorization: Bearer ${token}`

Fastify should use:
`await request.jwtVerify()`

Database query should use:
`request.user.id`

If any boundary fails, fix that boundary instead of bypassing auth.

## User isolation

Every resource query must be scoped:
`where userId = authenticatedUserId`

For resource-by-ID requests, verify both:
- resource ID
- authenticated user ID

Never return another user's record just because the record ID exists.
