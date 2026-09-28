import "dotenv/config";

import { hashPassword } from "./lib/auth.js";
import { encryptSecret } from "./lib/secrets.js";
import {
  accounts,
  bankConnections,
  budgets,
  categories,
  closeDb,
  creditCards,
  db,
  eq,
  goals,
  insurancePolicies,
  loans,
  netWorthSnapshots,
  portfolioHoldings,
  recurringTransactions,
  transactions,
  userPreferences,
  users,
} from "@personal-finance/db";

const DEMO_EMAIL = "demo@wealthly.local";

async function seed() {
  const existing = await db.select().from(users).where(eq(users.email, DEMO_EMAIL));
  const user = existing[0] ?? (await db.insert(users).values({
    email: DEMO_EMAIL,
    name: "Wealthly Demo",
    passwordHash: hashPassword("Demo12345!"),
  }).returning())[0];

  if (!user) throw new Error("Unable to create demo user");

  const userId = user.id;
  const existingAccounts = await db.select().from(accounts).where(eq(accounts.userId, userId));
  const checking = existingAccounts.find((account) => account.name === "Primary Checking") ?? (await db.insert(accounts).values({
    userId,
    name: "Primary Checking",
    type: "checking",
    currency: "INR",
    initialBalance: "85000.00",
  }).returning())[0];
  const savings = existingAccounts.find((account) => account.name === "Emergency Savings") ?? (await db.insert(accounts).values({
    userId,
    name: "Emergency Savings",
    type: "savings",
    currency: "INR",
    initialBalance: "150000.00",
  }).returning())[0];

  if (!checking || !savings) throw new Error("Unable to create demo accounts");

  const existingCategories = await db.select().from(categories).where(eq(categories.userId, userId));
  const categoryByName = new Map(existingCategories.map((category) => [category.name, category]));
  const categoryDefinitions = [
    ["Salary", "income"], ["Freelance", "income"], ["Food & Dining", "expense"],
    ["Bills & Utilities", "expense"], ["Shopping", "expense"], ["Transportation", "expense"],
    ["Subscriptions", "expense"],
  ] as const;
  for (const [name, type] of categoryDefinitions) {
    if (!categoryByName.has(name)) {
      const [created] = await db.insert(categories).values({ userId, name, type }).returning();
      if (created) categoryByName.set(name, created);
    }
  }

  const existingTransactions = await db.select().from(transactions).where(eq(transactions.userId, userId));
  if (existingTransactions.length === 0) {
    const salary = categoryByName.get("Salary");
    const food = categoryByName.get("Food & Dining");
    const bills = categoryByName.get("Bills & Utilities");
    const transport = categoryByName.get("Transportation");
    if (!salary || !food || !bills || !transport) throw new Error("Unable to resolve demo categories");
    await db.insert(transactions).values([
      { userId, accountId: checking.id, categoryId: salary.id, amount: "125000.00", type: "income", description: "Monthly salary", transactionDate: new Date("2026-09-01T09:00:00Z") },
      { userId, accountId: checking.id, categoryId: food.id, amount: "1850.00", type: "expense", description: "Groceries and dining", transactionDate: new Date("2026-09-05T18:30:00Z") },
      { userId, accountId: checking.id, categoryId: bills.id, amount: "4200.00", type: "expense", description: "Electricity and internet", transactionDate: new Date("2026-09-07T10:00:00Z") },
      { userId, accountId: checking.id, categoryId: transport.id, amount: "1200.00", type: "expense", description: "Metro and fuel", transactionDate: new Date("2026-09-10T08:15:00Z") },
    ]);
  }

  if ((await db.select().from(goals).where(eq(goals.userId, userId))).length === 0) {
    const [goal] = await db.insert(goals).values({
      userId, name: "Europe vacation", description: "Save for a December trip", targetAmount: "250000.00", targetDate: new Date("2026-12-15T00:00:00Z"),
    }).returning();
    if (goal) {
      // Contributions are intentionally omitted here; the goal is useful immediately in the dashboard.
    }
  }

  const month = new Date("2026-09-01T00:00:00Z");
  const foodCategory = categoryByName.get("Food & Dining");
  if (foodCategory && (await db.select().from(budgets).where(eq(budgets.userId, userId))).length === 0) {
    await db.insert(budgets).values({ userId, categoryId: foodCategory.id, amount: "15000.00", month });
  }

  if ((await db.select().from(userPreferences).where(eq(userPreferences.userId, userId))).length === 0) {
    await db.insert(userPreferences).values({ userId, theme: "light", accent: "purple" });
  }
  if ((await db.select().from(creditCards).where(eq(creditCards.userId, userId))).length === 0) {
    await db.insert(creditCards).values({
      userId, accountId: checking.id, cardName: "Wealthly Rewards", bankIssuer: "Demo Bank", cardType: "Visa", last4: "4242",
      creditLimit: "200000.00", currentOutstanding: "18500.00", statementDate: "5", paymentDueDate: "20", interestRate: "24.00", annualFee: "999.00",
    });
  }
  if ((await db.select().from(loans).where(eq(loans.userId, userId))).length === 0) {
    await db.insert(loans).values({
      userId, lender: "Demo Home Finance", loanType: "home", originalPrincipal: "4500000.00", currentOutstanding: "3825000.00",
      interestRate: "8.50", emi: "38500.00", startDate: new Date("2024-01-01T00:00:00Z"), endDate: new Date("2039-01-01T00:00:00Z"),
    });
  }
  if ((await db.select().from(insurancePolicies).where(eq(insurancePolicies.userId, userId))).length === 0) {
    await db.insert(insurancePolicies).values({
      userId, provider: "Demo Health Cover", policyNumber: "DEMO-HEALTH-001", policyType: "health", coverageAmount: "1000000.00",
      premium: "18000.00", premiumFrequency: "annual", startDate: new Date("2026-01-01T00:00:00Z"), renewalDate: new Date("2027-01-01T00:00:00Z"), nominee: "Wealthly Demo",
    });
  }
  if ((await db.select().from(portfolioHoldings).where(eq(portfolioHoldings.userId, userId))).length === 0) {
    await db.insert(portfolioHoldings).values([
      { userId, assetType: "stock", symbol: "RELIANCE", name: "Reliance Industries Ltd", quantity: "10", averageCost: "2600.00", currentPrice: "2920.00" },
      { userId, assetType: "etf", symbol: "NIFTYBEES", name: "Nippon India ETF Nifty BeES", quantity: "50", averageCost: "230.00", currentPrice: "255.00" },
    ]);
  }
  if ((await db.select().from(netWorthSnapshots).where(eq(netWorthSnapshots.userId, userId))).length === 0) {
    await db.insert(netWorthSnapshots).values({ userId, snapshotDate: new Date("2026-09-01T00:00:00Z"), totalAssets: "360000.00", totalLiabilities: "3843500.00", netWorth: "-3483500.00" });
  }
  if ((await db.select().from(recurringTransactions).where(eq(recurringTransactions.userId, userId))).length === 0) {
    await db.insert(recurringTransactions).values({ userId, accountId: checking.id, title: "Home internet", amount: "999.00", type: "expense", category: "Bills & Utilities", frequency: "monthly", nextDate: new Date("2026-10-01T00:00:00Z") });
  }
  if ((await db.select().from(bankConnections).where(eq(bankConnections.userId, userId))).length === 0) {
    await db.insert(bankConnections).values({ userId, institutionName: "Demo Bank", providerToken: encryptSecret("demo-provider-token"), status: "connected" });
  }

  console.log(`Seeded demo data for ${DEMO_EMAIL}. Login password: Demo12345!`);
}

try {
  await seed();
} finally {
  await closeDb();
}
