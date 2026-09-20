# Skill: Transactions and Categories

## Product behavior

A transaction should contain, as appropriate:
- account
- category
- amount
- type
- description
- transaction date

Types:
- income
- expense

## Categories

Categories must belong to users.

Support:
- list categories
- create category
- update category
- delete category safely

Category type should match transaction type.

An expense should not accidentally select an income-only category.

## Delete behavior

Before deleting a category, determine whether transactions or budgets reference it.

Do not silently corrupt historical financial data.

Prefer:
- soft deletion, or
- prevent deletion and explain why, or
- a safe replacement-category flow

based on the existing schema.

## UI

Transaction form should have:
- Type selector
- Category selector
- Account selector
- Amount
- Date
- Description

Category management should be accessible from an appropriate settings/categories area or the transaction flow.

## API security

All category and transaction endpoints must use authenticated user ID.

Never accept `userId` as authorization input from the browser.
