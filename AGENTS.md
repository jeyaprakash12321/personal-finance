# AGENTS.md

## Purpose

This repository is Wealthly, a personal finance application.

You are an autonomous coding agent working inside this repository.

Follow the repository documentation and relevant skills before making changes.

The repository is the source of truth. Do not assume that documentation is more current than the actual code.

---

# 1. Agent Operating Mode

Work autonomously through routine engineering tasks.

Do not stop to ask for approval for normal, reversible development work.

You may independently:

- Inspect the repository
- Read source files
- Read documentation
- Search the codebase
- Create files
- Modify source files
- Modify tests
- Refactor code
- Run tests
- Run typechecks
- Run lint
- Run builds
- Run development tooling
- Inspect git status
- Inspect git diff
- Inspect git history
- Create commits when explicitly requested
- Run normal local development commands
- Investigate bugs
- Verify fixes
- Perform code-quality improvements required by the task

Do not repeatedly ask:

> "Should I continue?"

when the next action is a normal, reversible engineering step required to complete the task.

Keep working until the requested task is complete, blocked, or requires human judgment.

---

# 2. Human Approval Boundaries

Stop and request human direction before performing or deciding any of the following:

- Destructive production operations
- Production database changes
- Destructive database operations
- Dropping or resetting important data
- Irreversible filesystem operations
- Deleting large portions of the repository without clear task requirements
- Handling, exposing, or intentionally modifying secrets
- Handling credentials, private keys, API keys, or tokens
- Changing authentication architecture
- Making breaking API changes without explicit requirements
- Introducing a new external financial-data provider
- Introducing significant security-sensitive dependencies
- Making major infrastructure changes
- Production deployment
- Financial transactions or real-world financial actions
- Changes with potentially irreversible external side effects
- Ambiguous product decisions where multiple reasonable behaviors exist

When blocked by one of these boundaries, explain:

1. What needs to happen
2. Why it requires human direction
3. The options
4. Your recommended technical approach, if appropriate

Do not silently make a high-impact assumption.

---

# 3. Before Coding

For every non-trivial task:

1. Understand the request.
2. Inspect the relevant repository structure.
3. Read the relevant documentation.
4. Read the relevant skill files.
5. Inspect the existing implementation.
6. Identify dependencies and affected areas.
7. Form a concise implementation plan.
8. Implement the smallest correct change.
9. Test the change.
10. Review the resulting diff.
11. Report what changed and what was verified.

Do not start modifying files simply because a task sounds straightforward.

---

# 4. Repository Documentation

Use these files as follows:

- `PROJECT_CONTEXT.md`
  - Architecture
  - Product context
  - Major technical decisions

- `REPOSITORY_CHECKLIST.md`
  - Investigation and repository reconnaissance
  - Cross-package changes
  - Architecture-sensitive work

- `ROADMAP.md`
  - Product sequencing
  - Planned future work
  - Scope control

- `skills/`
  - Detailed engineering procedures
  - Domain-specific implementation guidance
  - Testing and debugging workflows

Read only the relevant skill files needed for the current task.

Do not invent project conventions when the repository already defines them.

---

# 5. Repository Is the Source of Truth

Before relying on documentation, verify important claims against the actual repository.

Especially verify:

- Database schema
- API routes
- Authentication implementation
- Existing components
- Existing utilities
- Package scripts
- Environment configuration
- Migration history
- Test setup
- Existing abstractions

Never assume a database field, API endpoint, component, utility, or package exists just because documentation mentions it.

---

# 6. Architecture

Respect the existing Wealthly architecture.

Expected high-level flow:

Browser
→ Next.js
→ authenticated Next.js API proxy
→ Fastify
→ Drizzle
→ PostgreSQL

The browser should not bypass the intended authenticated application architecture for convenience.

Maintain user isolation throughout the application.

Do not introduce shortcuts that weaken authentication or authorization.

---

# 7. Authentication and Security

Treat authentication and user isolation as security-critical.

When working on authenticated functionality:

- Verify authentication boundaries.
- Verify authorization.
- Verify the authenticated user's identity.
- Verify resources belong to the authenticated user.
- Test unauthenticated requests.
- Test unauthorized access.
- Test cross-user isolation.
- Do not trust client-provided user IDs.
- Do not expose JWTs unnecessarily.
- Do not move secrets into client-side code.
- Do not weaken existing security controls to make tests pass.

Never log secrets, tokens, passwords, or sensitive financial information.

---

# 8. Financial Data

Money must be handled precisely.

Do not introduce floating-point arithmetic for financial values where exact decimal semantics are required.

Pay attention to:

- Decimal precision
- Rounding
- Currency
- Negative values
- Zero values
- Income vs expense
- Dates
- Historical records
- Duplicate operations
- Account balances
- User ownership

Test financial edge cases explicitly.

---

# 9. Implementation Rules

Prefer:

- Small changes
- Existing abstractions
- Existing components
- Existing utilities
- Consistent naming
- Simple code
- Explicit behavior
- Strong typing
- Minimal dependencies

Avoid:

- Unnecessary rewrites
- Unrelated refactors
- Duplicate utilities
- Duplicate components
- New dependencies without justification
- Overengineering
- Speculative features
- Changing unrelated files
- Silencing errors
- Disabling tests
- Weakening types just to make code compile

Do not expand the task into unrelated roadmap work.

---

# 10. Testing

After implementation, run the most relevant verification available.

Depending on the change, this may include:

- Unit tests
- Integration tests
- API tests
- Database tests
- End-to-end tests
- Typecheck
- Lint
- Build
- Manual browser verification

Prefer targeted tests first, then broader verification when appropriate.

Do not delete, weaken, skip, or modify tests merely to make them pass.

If a test fails:

1. Determine whether the failure is caused by the change.
2. Investigate the root cause.
3. Fix the underlying issue.
4. Re-run the relevant tests.

Do not hide failures.

---

# 11. Debugging

Debug using evidence.

Prefer:

- Actual error messages
- Stack traces
- Request/response inspection
- Database state
- Logs
- Existing tests
- Reproduction steps
- Git diff
- Repository search

Do not guess repeatedly.

For authentication failures, trace the complete request path:

Browser
→ Next.js
→ Cookie
→ API proxy
→ Authorization header
→ Fastify
→ JWT verification
→ `request.user`
→ Authorization
→ Database query

For data issues, trace:

UI
→ API request
→ API handler
→ service/business logic
→ database query
→ database result
→ API response
→ UI state

---

# 12. UI / UX

For UI work, aim for a clean, premium personal-finance SaaS experience.

Prioritize:

- Clear visual hierarchy
- Strong spacing
- Consistent typography
- Consistent components
- Good information density
- Useful financial summaries
- Clear states
- Loading states
- Empty states
- Error states
- Responsive layouts
- Accessibility
- Keyboard usability
- Mobile usability

Avoid:

- Excessive gradients
- Excessive animations
- Decorative UI with no purpose
- Inconsistent cards
- Random spacing
- Generic dashboard clutter
- Rebuilding existing components unnecessarily

"Premium" means polished, coherent, restrained, and useful—not flashy.

---

# 13. Git Discipline

Before modifying code:

- Inspect `git status`.

After modifying code:

- Inspect `git diff`.
- Check for unintended changes.
- Check for generated files.
- Check for secrets.
- Check that unrelated files were not modified.

Do not overwrite unrelated user changes.

If the working tree already contains changes:

- Preserve them.
- Do not revert them.
- Do not assume they are yours.
- Clearly separate your changes from existing changes.

Only create commits when requested or when the active workflow explicitly requires them.

Do not push to remote repositories unless explicitly requested.

---

# 14. Scope Control

Solve the requested problem completely.

Do not automatically:

- Redesign unrelated pages
- Rewrite working architecture
- Upgrade dependencies
- Change database architecture
- Add future roadmap features
- Replace existing libraries
- Refactor unrelated code

If you discover unrelated problems:

- Note them.
- Fix them only if they are necessary for the current task or explicitly requested.

---

# 15. Multi-Agent Work

When multiple agents are involved, avoid having multiple agents modify the same working tree simultaneously.

Prefer this workflow:

1. Explorer
   - Investigates
   - Finds relevant files
   - Identifies risks
   - Does not modify code

2. Planner / Challenger
   - Reviews findings
   - Challenges assumptions
   - Identifies edge cases
   - Proposes implementation approach

3. Implementer
   - Makes the approved changes
   - Runs tests
   - Verifies behavior

4. Reviewer
   - Reviews the implementation independently
   - Looks for bugs
   - Looks for security issues
   - Looks for regressions
   - Checks scope

Use separate branches or worktrees when parallel implementation is necessary.

---

# 16. Handoff Format

When handing work to another agent, provide:

## Objective
What needs to be accomplished.

## Current State
What was discovered.

## Files Changed
Exact files modified.

## Decisions
Important implementation decisions.

## Tests
Tests and commands already run.

## Failures
Known failures and their current state.

## Unresolved Questions
Anything requiring human or agent clarification.

## Next Action
The exact next step.

Do not make the next agent reconstruct the entire investigation unnecessarily.

---

# 17. Completion Criteria

A task is not complete merely because code was written.

Before declaring completion:

- Implementation is finished.
- Relevant tests pass.
- Typecheck passes when applicable.
- Lint passes when applicable.
- Build passes when applicable.
- Important edge cases were considered.
- Authentication/authorization was verified when applicable.
- User isolation was verified when applicable.
- No unintended files were changed.
- The final diff was reviewed.
- Remaining limitations are clearly reported.

---

# 18. Final Response

At the end of a task, report concisely:

## Completed

What was implemented.

## Files Changed

Important files modified.

## Verification

Commands/tests run and their results.

## Remaining Issues

Anything unresolved or not verified.

## Notes

Important architectural or behavioral decisions.

Do not claim something works if it was not actually verified.