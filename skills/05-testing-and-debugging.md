# Skill: Testing and Debugging

## Debugging sequence

1. Reproduce the failure.
2. Identify exact URL/method/status.
3. Check browser Network tab.
4. Check Next.js route handler.
5. Check Fastify route.
6. Check JWT/authentication.
7. Check database query.
8. Check response shape.
9. Fix the smallest architectural root cause.
10. Retest the full flow.

## For 401 Unauthorized

Never assume the database is the problem.

Trace:
Browser cookie
-> Next cookies()
-> token
-> Authorization header
-> Fastify jwtVerify
-> request.user.id
-> user-scoped query

## Required verification

After changes:
- TypeScript check
- build if relevant
- manual browser flow
- direct API unauthorized test
- authenticated browser test

## Regression testing

When fixing one page, search the repository for the same anti-pattern.

For example, after finding:
`fetch("http://localhost:4000/...")`
in a client component, search the whole web app for other direct Fastify calls.

Use repository search rather than assuming only one file is affected.
