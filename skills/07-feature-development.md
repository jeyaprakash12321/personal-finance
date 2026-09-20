# Skill: Adding New Wealthly Features

## Process

For a new feature:

1. Define user-facing behavior.
2. Inspect existing schema and architecture.
3. Design DB changes.
4. Create migration.
5. Create shared validation/types if appropriate.
6. Create Fastify API.
7. Add authentication and user scoping.
8. Add Next proxy.
9. Add frontend page/components.
10. Add loading/error/empty states.
11. Test unauthorized access.
12. Test two-user isolation.
13. Test CRUD.
14. Run typecheck/build.
15. Review for financial-data correctness.

## Future modules

Credit cards:
- cards
- limits
- outstanding
- payment dates
- transactions

Loans:
- lender
- principal
- outstanding
- rate
- EMI/payment schedule

Insurance:
- provider
- policy
- coverage
- premium
- renewal

Investments:
- holdings
- quantities
- cost basis
- current value
- P&L

Net worth:
assets - liabilities

## Integration security

Bank and broker integrations must use provider authentication/authorization flows.

Never ask users to paste bank passwords into Wealthly.
