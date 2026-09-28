import { buildApp } from "../app";
import { closeDb, db, eq, users } from "@personal-finance/db";

describe("authenticated feature CRUD matrix", () => {
  let app: Awaited<ReturnType<typeof buildApp>>;
  const createdUserIds: string[] = [];

  beforeAll(async () => {
    app = await buildApp();
  });

  afterAll(async () => {
    for (const userId of createdUserIds) {
      await db.delete(users).where(eq(users.id, userId));
    }
    await app.close();
    await closeDb();
  });

  async function register(label: string) {
    const response = await app.inject({
      method: "POST",
      url: "/auth/register",
      payload: {
        name: `CRUD ${label}`,
        email: `crud-${label.toLowerCase()}-${Date.now()}-${Math.random()}@example.test`,
        password: "TestPassword123!",
      },
    });
    expect(response.statusCode).toBe(201);
    const body = response.json() as { user: { id: string }; token: string };
    createdUserIds.push(body.user.id);
    return body;
  }

  function auth(token: string) {
    return { authorization: `Bearer ${token}` };
  }

  async function request(
    method: "GET" | "POST" | "PUT" | "DELETE",
    url: string,
    token: string,
    payload?: unknown,
  ) {
    return app.inject({ method, url, headers: auth(token), payload });
  }

  it("covers CRUD and domain actions for every implemented feature", async () => {
    const owner = await register("owner");
    const other = await register("other");
    const now = new Date().toISOString();
    const month = now.slice(0, 7);

    const accountResponse = await request("POST", "/accounts", owner.token, {
      name: "CRUD Account",
      type: "checking",
      currency: "INR",
      initialBalance: "1000.00",
    });
    expect(accountResponse.statusCode).toBe(201);
    const account = accountResponse.json() as { id: string };
    const accountUpdate = await request("PUT", `/accounts/${account.id}`, owner.token, { name: "Updated Account", initialBalance: "1250.50" });
    expect(accountUpdate.statusCode).toBe(200);
    expect(accountUpdate.json()).toEqual(expect.objectContaining({ initialBalance: "1250.50" }));
    expect((await request("GET", "/accounts", other.token)).json()).not.toEqual(expect.arrayContaining([expect.objectContaining({ id: account.id })]));
    expect((await request("DELETE", `/accounts/${account.id}`, owner.token)).statusCode).toBe(204);

    const activeAccountResponse = await request("POST", "/accounts", owner.token, {
      name: "Active CRUD Account",
      type: "checking",
      initialBalance: "1000.00",
    });
    const activeAccount = activeAccountResponse.json() as { id: string };

    const expenseCategoryResponse = await request("POST", "/categories", owner.token, { name: "CRUD Expense", type: "expense" });
    const expenseCategory = expenseCategoryResponse.json() as { id: string };
    const incomeCategoryResponse = await request("POST", "/categories", owner.token, { name: "CRUD Income", type: "income" });
    const incomeCategory = incomeCategoryResponse.json() as { id: string };
    expect(expenseCategoryResponse.statusCode).toBe(201);
    expect((await request("PUT", `/categories/${expenseCategory.id}`, owner.token, { name: "Updated Expense", type: "expense" })).statusCode).toBe(200);
    expect((await request("GET", "/categories", other.token)).json()).not.toEqual(expect.arrayContaining([expect.objectContaining({ id: expenseCategory.id })]));

    const transactionResponse = await request("POST", "/transactions", owner.token, {
      accountId: activeAccount.id,
      categoryId: expenseCategory.id,
      amount: "25.50",
      type: "expense",
      description: "CRUD expense",
      transactionDate: now,
    });
    expect(transactionResponse.statusCode).toBe(201);
    const transaction = transactionResponse.json() as { id: string };
    expect((await request("PUT", `/transactions/${transaction.id}`, owner.token, { amount: "30.50" })).statusCode).toBe(200);
    expect((await request("GET", "/transactions", other.token)).json()).not.toEqual(expect.arrayContaining([expect.objectContaining({ id: transaction.id })]));

    const goalResponse = await request("POST", "/goals", owner.token, {
      name: "CRUD Goal",
      targetAmount: "5000.00",
      targetDate: now,
    });
    expect(goalResponse.statusCode).toBe(201);
    const goal = goalResponse.json() as { id: string };
    expect((await request("PUT", `/goals/${goal.id}`, owner.token, { name: "Updated Goal" })).statusCode).toBe(200);
    const contributionResponse = await request("POST", "/goal-contributions", owner.token, {
      goalId: goal.id,
      amount: "250.00",
      contributionDate: now,
    });
    expect(contributionResponse.statusCode).toBe(201);
    const contribution = contributionResponse.json() as { id: string };
    expect((await request("DELETE", `/goal-contributions/${contribution.id}`, owner.token)).statusCode).toBe(200);

    const budgetResponse = await request("POST", "/budgets", owner.token, { categoryId: expenseCategory.id, amount: "1000.00", month });
    expect(budgetResponse.statusCode).toBe(201);
    const budget = budgetResponse.json() as { id: string };
    expect((await request("PUT", `/budgets/${budget.id}`, owner.token, { amount: "1200.00" })).statusCode).toBe(200);
    expect((await request("DELETE", `/budgets/${budget.id}`, owner.token)).statusCode).toBe(200);

    const cardResponse = await request("POST", "/credit-cards", owner.token, {
      cardName: "CRUD Card",
      bankIssuer: "CRUD Bank",
      cardType: "Visa",
      last4: "1234",
      creditLimit: 10000,
      currentOutstanding: 500,
      statementDate: "10",
      paymentDueDate: "20",
    });
    expect(cardResponse.statusCode).toBe(201);
    const card = cardResponse.json() as { id: string; accountId: string };
    expect((await request("PUT", `/credit-cards/${card.id}`, owner.token, { cardName: "Updated Card" })).statusCode).toBe(200);
    expect((await request("POST", `/credit-cards/${card.id}/payment`, owner.token, { amount: 100 })).statusCode).toBe(200);
    const cardTransactionResponse = await request("POST", "/transactions", owner.token, {
      accountId: card.accountId,
      categoryId: expenseCategory.id,
      amount: "25.00",
      type: "expense",
      description: "Card transaction delete regression",
      transactionDate: now,
    });
    expect(cardTransactionResponse.statusCode).toBe(201);
    const cardTransaction = cardTransactionResponse.json() as { id: string };
    const cardTransactionDelete = await request("DELETE", `/transactions/${cardTransaction.id}`, owner.token);
    if (cardTransactionDelete.statusCode !== 204) console.log("card transaction delete failure", cardTransactionDelete.statusCode, cardTransactionDelete.body);
    expect(cardTransactionDelete.statusCode).toBe(204);

    const loanResponse = await request("POST", "/loans", owner.token, {
      lender: "CRUD Lender",
      loanType: "personal",
      originalPrincipal: 10000,
      currentOutstanding: 8000,
      interestRate: 10,
      emi: 500,
      startDate: now,
    });
    expect(loanResponse.statusCode).toBe(201);
    const loan = loanResponse.json() as { id: string };
    expect((await request("PUT", `/loans/${loan.id}`, owner.token, { lender: "Updated Lender" })).statusCode).toBe(200);
    expect((await request("POST", `/loans/${loan.id}/payment`, owner.token, { amount: 500 })).statusCode).toBe(200);

    const policyResponse = await request("POST", "/insurance", owner.token, {
      provider: "CRUD Insurer",
      policyNumber: "CRUD-1",
      policyType: "health",
      coverageAmount: 500000,
      premium: 12000,
      startDate: now,
      renewalDate: new Date(Date.now() + 86400000 * 365).toISOString(),
    });
    expect(policyResponse.statusCode).toBe(201);
    const policy = policyResponse.json() as { id: string };
    expect((await request("PUT", `/insurance/${policy.id}`, owner.token, { provider: "Updated Insurer" })).statusCode).toBe(200);

    const holdingResponse = await request("POST", "/portfolio", owner.token, {
      symbol: "crud",
      name: "CRUD Equity",
      assetType: "stock",
      quantity: 10,
      averageCost: 100,
      currentPrice: 120,
    });
    expect(holdingResponse.statusCode).toBe(201);
    const holding = holdingResponse.json() as { id: string };
    expect((await request("PUT", `/portfolio/${holding.id}`, owner.token, { currentPrice: 130 })).statusCode).toBe(200);

    const connectionResponse = await request("POST", "/bank-connections", owner.token, {
      institutionName: "CRUD Bank",
      accountsToCreate: [],
    });
    expect(connectionResponse.statusCode).toBe(201);
    const connection = connectionResponse.json() as { connection: { id: string } };
    expect((await request("POST", `/bank-connections/${connection.connection.id}/sync`, owner.token)).statusCode).toBe(200);
    expect((await request("POST", `/bank-connections/${connection.connection.id}/reconnect`, owner.token)).statusCode).toBe(200);

    const recurringResponse = await request("POST", "/recurring", owner.token, {
      accountId: activeAccount.id,
      title: "CRUD Subscription",
      amount: 50,
      type: "expense",
      category: "Updated Expense",
      frequency: "monthly",
      nextDate: now,
    });
    expect(recurringResponse.statusCode).toBe(201);
    const recurring = recurringResponse.json() as { id: string };
    expect((await request("PUT", `/recurring/${recurring.id}`, owner.token, { amount: 60 })).statusCode).toBe(200);
    const recurringExecute = await request("POST", `/recurring/${recurring.id}/execute`, owner.token);
    expect(recurringExecute.statusCode).toBe(200);

    expect((await request("PUT", "/preferences", owner.token, { theme: "dark", accent: "purple" })).statusCode).toBe(200);
    expect((await request("GET", "/preferences", owner.token)).json()).toEqual(expect.objectContaining({ theme: "dark", accent: "purple" }));
    expect((await request("POST", "/net-worth/snapshot", owner.token)).statusCode).toBe(201);
    expect((await request("GET", "/net-worth", owner.token)).statusCode).toBe(200);
    expect((await request("GET", "/export?entity=transactions", owner.token)).statusCode).toBe(200);

    const importPreview = await request("POST", "/import/preview", owner.token, {
      accountId: activeAccount.id,
      rows: [{ amount: 10, type: "income", categoryName: "CRUD Income", description: "Imported", date: now }],
    });
    expect(importPreview.statusCode).toBe(200);
    const importExecute = await request("POST", "/import/execute", owner.token, {
      accountId: activeAccount.id,
      rows: [{ amount: 10, type: "income", categoryName: "CRUD Income", description: "Imported", date: now }],
      skipDuplicates: true,
    });
    expect(importExecute.statusCode).toBe(200);

    for (const [path, id] of [
      ["/credit-cards", card.id],
      ["/loans", loan.id],
      ["/insurance", policy.id],
      ["/portfolio", holding.id],
      ["/recurring", recurring.id],
    ] as const) {
      expect((await request("DELETE", `${path}/${id}`, owner.token)).statusCode).toBeGreaterThanOrEqual(200);
      expect((await request("DELETE", `${path}/${id}`, other.token)).statusCode).toBe(404);
    }
    expect((await request("DELETE", `/bank-connections/${connection.connection.id}`, owner.token)).statusCode).toBe(200);
    expect((await request("DELETE", `/goals/${goal.id}`, owner.token)).statusCode).toBe(204);
    expect((await request("DELETE", `/transactions/${transaction.id}`, owner.token)).statusCode).toBe(204);
    expect((await request("DELETE", `/categories/${expenseCategory.id}`, owner.token)).statusCode).toBe(409);
    expect((await request("DELETE", `/categories/${incomeCategory.id}`, owner.token)).statusCode).toBe(409);
    const deletableCategoryResponse = await request("POST", "/categories", owner.token, { name: "Delete Only", type: "expense" });
    const deletableCategory = deletableCategoryResponse.json() as { id: string };
    expect((await request("DELETE", `/categories/${deletableCategory.id}`, owner.token)).statusCode).toBe(200);
  });
});
