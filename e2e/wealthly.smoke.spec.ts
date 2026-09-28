import { expect, test } from "@playwright/test";
import { randomUUID } from "node:crypto";

function uniqueUser(prefix: string) {
  return {
    name: `E2E ${prefix}`,
    email: `wealthly-${prefix.toLowerCase()}-${randomUUID()}@example.test`,
    password: "TestPassword123!",
  };
}

async function openMobileNavigation(page: import("@playwright/test").Page) {
  const menu = page.getByRole("button", { name: "Open navigation" });
  if ((page.viewportSize()?.width ?? 1280) < 1024) {
    await menu.click({ force: true });
  }
}

test.describe("Wealthly browser journeys", () => {
  test("redirects unauthenticated visitors from protected pages", async ({ page }) => {
    await page.goto("/accounts");
    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByRole("heading", { name: "Sign in" })).toBeVisible();
  });

  test("registers, lands on dashboard, and exposes every major feature", async ({ page }) => {
    const user = uniqueUser("nav");
    await page.goto("/register");
    await page.getByPlaceholder("Your name").fill(user.name);
    await page.getByPlaceholder("you@example.com").fill(user.email);
    await page.getByPlaceholder("At least 8 characters").fill(user.password);
    await page.getByRole("button", { name: "Create account" }).click();

    await expect(page).toHaveURL(/\/$/);
    await openMobileNavigation(page);
    await expect(page.getByRole("heading", { name: "Welcome back!" })).toBeVisible();

    for (const feature of [
      "Transactions",
      "Accounts",
      "Categories",
      "Budgets",
      "Goals",
      "Credit Cards",
      "Loans",
      "Insurance",
      "Portfolio",
      "Bank Connections",
      "Recurring & Calendar",
      "Net Worth",
      "Reports",
      "Insights",
      "Data & Export",
    ]) {
      await expect(page.getByRole("complementary").getByRole("link", { name: feature, exact: true })).toBeVisible();
    }
  });

  test("creates an account and category through the browser", async ({ page }) => {
    const user = uniqueUser("crud");
    await page.goto("/register");
    await page.getByPlaceholder("Your name").fill(user.name);
    await page.getByPlaceholder("you@example.com").fill(user.email);
    await page.getByPlaceholder("At least 8 characters").fill(user.password);
    await page.getByRole("button", { name: "Create account" }).click();
    await expect(page).toHaveURL(/\/$/);
    await openMobileNavigation(page);

    await page.getByRole("complementary").getByRole("link", { name: "Accounts", exact: true }).click();
    await expect(page.getByRole("heading", { name: /Accounts/ })).toBeVisible();
    await page.getByRole("button", { name: /Add Account/ }).first().click();
    await page.getByPlaceholder("e.g. HDFC Savings").fill("E2E Savings");
    await page.getByPlaceholder("25000.00").fill("1000");
    await page.getByRole("button", { name: "Create Account" }).click();
    await expect(page.getByText("E2E Savings")).toBeVisible();

    await openMobileNavigation(page);
    await page.getByRole("complementary").getByRole("link", { name: "Categories", exact: true }).click();
    await page.getByRole("button", { name: "Add Category" }).click();
    await page.getByPlaceholder("e.g., Groceries, Freelance, Subscriptions").fill("E2E Test Category");
    await page.getByRole("button", { name: "Create Category" }).click();
    await expect(page.getByRole("heading", { name: "E2E Test Category" })).toBeVisible();
  });

  test("supports mobile navigation and logout", async ({ page }) => {
    const user = uniqueUser("mobile");
    await page.goto("/register");
    await page.getByPlaceholder("Your name").fill(user.name);
    await page.getByPlaceholder("you@example.com").fill(user.email);
    await page.getByPlaceholder("At least 8 characters").fill(user.password);
    await page.getByRole("button", { name: "Create account" }).click();
    await expect(page).toHaveURL(/\/$/);
    if ((page.viewportSize()?.width ?? 1280) < 1024) {
      await expect(page.getByRole("navigation", { name: "Mobile navigation" })).toBeVisible();
      await expect(page.getByRole("link", { name: "Add transaction" })).toBeVisible();
    }
    await openMobileNavigation(page);
    await expect(page.getByRole("link", { name: "Credit Cards", exact: true })).toBeVisible();
    await page.getByRole("complementary").getByRole("button", { name: "Log out" }).click();
    await expect(page).toHaveURL(/\/login$/);
  });

  test("loads every authenticated feature page without a frontend error", async ({ page }) => {
    const user = uniqueUser("pages");
    await page.goto("/register");
    await page.getByPlaceholder("Your name").fill(user.name);
    await page.getByPlaceholder("you@example.com").fill(user.email);
    await page.getByPlaceholder("At least 8 characters").fill(user.password);
    await page.getByRole("button", { name: "Create account" }).click();
    await expect(page).toHaveURL(/\/$/);

    const pages = [
      ["/accounts", "Accounts"],
      ["/transactions", "Transactions"],
      ["/categories", "Category Management"],
      ["/budgets", "Keep your spending"],
      ["/goals", "Build the future"],
      ["/credit-cards", "Credit Cards"],
      ["/loans", "Loan Management"],
      ["/insurance", "Insurance"],
      ["/portfolio", "Portfolio"],
      ["/bank-connections", "Bank Connections"],
      ["/recurring", "Recurring Transactions & Money Calendar"],
      ["/net-worth", "Net Worth Engine"],
      ["/reports", "Reports"],
      ["/insights", "Insights"],
      ["/data-management", "Data Management"],
      ["/settings", "Settings"],
      ["/help", "How can we help"],
    ] as const;

    for (const [path, heading] of pages) {
      await page.goto(path);
      await expect(page).toHaveURL(new RegExp(`${path.replace("/", "\\/")}$`));
      await expect(page.getByRole("heading", { name: heading, exact: false }).first()).toBeVisible();
    }
  });

  test("creates a credit card and records a linked card transaction", async ({ page }) => {
    const user = uniqueUser("credit-card");
    await page.goto("/register");
    await page.getByPlaceholder("Your name").fill(user.name);
    await page.getByPlaceholder("you@example.com").fill(user.email);
    await page.getByPlaceholder("At least 8 characters").fill(user.password);
    await page.getByRole("button", { name: "Create account" }).click();
    await expect(page).toHaveURL(/\/$/);
    await openMobileNavigation(page);
    await page.getByRole("complementary").getByRole("link", { name: "Credit Cards", exact: true }).click();
    await page.getByRole("button", { name: "Add Credit Card" }).click();
    await page.getByPlaceholder("e.g. Regalia First").fill("E2E Rewards Card");
    await page.getByPlaceholder("e.g. HDFC Bank").fill("E2E Bank");
    await page.getByPlaceholder("4821").fill("4821");
    await page.getByPlaceholder("100000").fill("100000");
    await page.locator("form").getByRole("button", { name: "Add Card" }).click();
    await expect(page.getByRole("heading", { name: "E2E Rewards Card" })).toBeVisible();

    await openMobileNavigation(page);
    await page.getByRole("complementary").getByRole("link", { name: "Transactions", exact: true }).click();
    await page.getByRole("button", { name: "Add Transaction" }).click();
    await page.getByLabel("Amount").fill("1250");
    await page.getByLabel("Description").fill("E2E card purchase");
    await page.locator("#transaction-account").selectOption({ label: "E2E Rewards Card · Credit Card" });
    await page.locator("#transaction-category").selectOption({ label: "Food & Dining" });
    await page.getByRole("button", { name: "Save Transaction" }).click();
    await expect(page.locator("p:visible").filter({ hasText: "E2E card purchase" })).toBeVisible();

    await page.getByTitle("Delete Transaction").first().click();
    const deleteTransactionResponse = page.waitForResponse(
      (response) => response.url().includes("/api/transactions/") && response.request().method() === "DELETE",
    );
    await page.getByRole("button", { name: "Delete transaction", exact: true }).click();
    const deleteTransactionResult = await deleteTransactionResponse;
    console.log("DELETE_TRANSACTION_PROXY", deleteTransactionResult.status(), await deleteTransactionResult.text());
    expect(deleteTransactionResult.status()).toBe(204);
    await expect(page.locator("p:visible").filter({ hasText: "E2E card purchase" })).toHaveCount(0);

    await openMobileNavigation(page);
    await page.getByRole("complementary").getByRole("link", { name: "Credit Cards", exact: true }).click();
    await page.getByTitle("Delete card").first().click();
    await page.getByRole("button", { name: "Delete card", exact: true }).click();
    await expect(page.getByRole("heading", { name: "E2E Rewards Card" })).toHaveCount(0);
  });
});
