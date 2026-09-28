# Skill: Wealthly UI and Product

## Objective

Preserve Wealthly's existing visual language and make UI changes clear, responsive, accessible, and appropriate for personal finance.

## Existing direction

- light green/white foundation
- emerald primary accent
- soft cards
- subtle borders/shadows
- responsive layout
- Tailwind CSS
- shadcn/ui where appropriate

Do not redesign existing screens during backend/auth fixes unless requested.

## UI workflow

Before changing a screen:

1. inspect the screen
2. inspect neighboring screens
3. find reusable components
4. identify loading/error/empty states
5. understand API/auth contract
6. make the smallest coherent change

## Financial UX

- format amounts consistently
- preserve precision
- clearly identify currency
- distinguish income/expense where relevant
- use consistent dates

UI rounding must not replace correct financial calculations.

## Forms

Handle:

- required validation
- useful errors
- loading/submission state
- duplicate submission prevention where relevant
- backend errors
- safe preservation of user input

Transaction forms should include the fields required by the existing product/schema, such as type, category, account, amount, date, and description.

## States

Every client data operation should intentionally handle:

- loading
- success
- empty
- validation failure
- authentication failure
- authorization failure
- backend failure

## Accessibility

Preserve:

- semantic elements
- keyboard usability
- visible focus
- accessible labels
- useful error association
- correct button/link semantics

Do not communicate important meaning only through color.

## Responsive behavior

Check:

- desktop
- narrow/mobile
- long numbers
- long labels
- validation messages
- loading/empty states

## API boundary

Authenticated client components should normally call Next `/api/...`, not Fastify directly.

## Scope

Do not add speculative product features while implementing a requested feature. Mention separate improvements as follow-ups.

## Completion

UI work is complete when behavior, states, responsive behavior, accessibility, financial precision, and API/auth boundaries are verified.
