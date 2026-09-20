# Skill: Next.js API Proxy

## Purpose

Keep browser requests behind the Next.js authenticated boundary.

## Standard route structure

Example:
`apps/web/src/app/api/accounts/route.ts`

A protected proxy should:
1. read `wealthly_token`
2. return 401 if missing
3. call Fastify
4. forward Authorization
5. forward JSON body for POST/PATCH
6. return the Fastify status
7. safely return JSON

## Methods

Implement every method actually used by the frontend.

For example:
- GET /api/accounts
- POST /api/accounts

Do not create a GET-only route when the frontend also creates resources.

## Error handling

Preserve meaningful Fastify status codes.

Do not convert every backend error into 500.

Handle invalid JSON carefully.

## Frontend rule

Authenticated client components should call:
`/api/accounts`

not:
`http://localhost:4000/accounts`

Server components that intentionally call Fastify directly must explicitly forward the cookie-derived JWT.

## Verification

Use browser DevTools Network and inspect:
- URL
- method
- status
- response
- whether the request is sent to Next or Fastify

Then inspect server logs if needed.
