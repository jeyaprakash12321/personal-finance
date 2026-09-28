# Skill: Authentication and Authorization

## Objective

Protect identity and user-owned data without weakening security.

Authentication answers who the user is. Authorization answers what that user may access.

## Intended Wealthly flow

Browser
-> Next.js
-> authenticated Next.js API proxy
-> Fastify
-> Drizzle
-> PostgreSQL

Fastify creates the JWT.

Next login/register routes set `wealthly_token` as an httpOnly cookie.

Next API proxy routes read the cookie and forward:

`Authorization: Bearer <token>`

Protected Fastify routes use the authenticated identity:

`request.user.id`

## Non-negotiable rules

Never:

- make protected routes public to bypass a 401
- accept browser-supplied `userId` as authorization
- expose JWT secrets or passwords to the browser
- return the JWT to browser JavaScript when httpOnly cookies are the intended architecture
- add localStorage/sessionStorage auth as a workaround
- log passwords, tokens, or provider secrets
- return another user's resource because the resource ID exists

## Authorization

For every user-owned resource:

- derive ownership from the verified token
- scope reads by authenticated user
- scope creates to authenticated user
- verify ownership before update/delete
- verify related resources also belong to the same user

## 401 debugging

Trace the complete boundary:

1. Browser is authenticated.
2. `wealthly_token` exists.
3. Next route receives the cookie.
4. Next extracts the token.
5. Next forwards `Authorization: Bearer ...`.
6. Fastify verifies the JWT.
7. `request.user.id` exists.
8. Database query uses that ID.
9. Browser is calling the intended Next route.

Fix the failing boundary. Do not bypass it.

## Security tests

For protected resources test:

- unauthenticated -> 401
- valid authenticated request -> success
- user A -> own resource succeeds
- user A -> user B resource rejected/not found per API contract
- user A cannot update/delete user B data
- forged `userId` does not change authorization
- invalid/expired token is rejected where applicable

## Auth architecture changes

Stop for human review before:

- changing JWT strategy
- changing cookie security behavior
- adding another auth source
- introducing an identity provider
- exposing protected Fastify routes
- changing ownership semantics

## Completion

Authentication work is complete only when the intended flow works, protected routes remain protected, user isolation is tested, and no duplicate auth mechanism was introduced.
