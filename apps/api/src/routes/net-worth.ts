import {
  db,
  eq,
  and,
  accounts,
  transactions,
  portfolioHoldings,
  creditCards,
  loans,
  netWorthSnapshots,
} from "@personal-finance/db";

/** Compute current balance for one account from initialBalance + recorded transactions */
function computeAccountBalance(
  account: { id: string; initialBalance: string },
  allTransactions: Array<{ accountId: string; amount: string; type: string }>
): number {
  const txTotal = allTransactions
    .filter((t) => t.accountId === account.id)
    .reduce((sum, t) => {
      const amount = parseFloat(t.amount);
      return t.type === "income" ? sum + amount : sum - amount;
    }, 0);
  return parseFloat(account.initialBalance) + txTotal;
}

export default async function netWorthRoutes(app: any) {
  // GET /net-worth — live calculation + historical snapshots
  app.get(
    "/net-worth",
    { preHandler: [app.authenticate] },
    async (request: any) => {
      const userId = request.user.id;

      // 1. Active bank/cash/investment accounts
      const userAccounts = await db
        .select()
        .from(accounts)
        .where(and(eq(accounts.userId, userId), eq(accounts.isActive, true)));

      // 2. All transactions for this user (needed for balance calculation)
      const userTransactions = await db
        .select()
        .from(transactions)
        .where(eq(transactions.userId, userId));

      let bankAndCash = 0;
      userAccounts
        .filter((a) => a.type !== "investment")
        .forEach((acc) => {
          bankAndCash += computeAccountBalance(acc, userTransactions);
        });

      // 3. Portfolio holdings (mark-to-market)
      const userHoldings = await db
        .select()
        .from(portfolioHoldings)
        .where(eq(portfolioHoldings.userId, userId));

      let investmentsValue = 0;
      userHoldings.forEach((h) => {
        investmentsValue += parseFloat(h.quantity) * parseFloat(h.currentPrice);
      });

      // Total Assets
      const totalAssets = bankAndCash + investmentsValue;

      // 4. Credit card liabilities
      const userCards = await db
        .select()
        .from(creditCards)
        .where(eq(creditCards.userId, userId));

      let creditCardsDebt = 0;
      userCards.forEach((c) => {
        creditCardsDebt += parseFloat(c.currentOutstanding);
      });

      // 5. Loan liabilities
      const userLoans = await db
        .select()
        .from(loans)
        .where(eq(loans.userId, userId));

      let loansDebt = 0;
      userLoans.forEach((l) => {
        loansDebt += parseFloat(l.currentOutstanding);
      });

      const totalLiabilities = creditCardsDebt + loansDebt;
      const netWorth = totalAssets - totalLiabilities;

      // 6. Historical snapshots
      const snapshots = await db
        .select()
        .from(netWorthSnapshots)
        .where(eq(netWorthSnapshots.userId, userId));

      return {
        live: {
          totalAssets,
          totalLiabilities,
          netWorth,
          assetsBreakdown: {
            bankAccountsAndCash: bankAndCash,
            investments: investmentsValue,
          },
          liabilitiesBreakdown: {
            creditCards: creditCardsDebt,
            loans: loansDebt,
          },
        },
        snapshots,
      };
    }
  );

  // POST /net-worth/snapshot — record a point-in-time snapshot
  app.post(
    "/net-worth/snapshot",
    { preHandler: [app.authenticate] },
    async (request: any, reply: any) => {
      const userId = request.user.id;

      const userAccounts = await db
        .select()
        .from(accounts)
        .where(and(eq(accounts.userId, userId), eq(accounts.isActive, true)));

      const userTransactions = await db
        .select()
        .from(transactions)
        .where(eq(transactions.userId, userId));

      const userHoldings = await db
        .select()
        .from(portfolioHoldings)
        .where(eq(portfolioHoldings.userId, userId));

      const userCards = await db
        .select()
        .from(creditCards)
        .where(eq(creditCards.userId, userId));

      const userLoans = await db
        .select()
        .from(loans)
        .where(eq(loans.userId, userId));

      let totalAssets = 0;
      userAccounts
        .filter((a) => a.type !== "investment")
        .forEach((acc) => {
          totalAssets += computeAccountBalance(acc, userTransactions);
        });
      userHoldings.forEach((h) => {
        totalAssets += parseFloat(h.quantity) * parseFloat(h.currentPrice);
      });

      let totalLiabilities = 0;
      userCards.forEach((c) => (totalLiabilities += parseFloat(c.currentOutstanding)));
      userLoans.forEach((l) => (totalLiabilities += parseFloat(l.currentOutstanding)));

      const netWorth = totalAssets - totalLiabilities;

      const [snapshot] = await db
        .insert(netWorthSnapshots)
        .values({
          userId,
          snapshotDate: new Date(),
          totalAssets: totalAssets.toFixed(2),
          totalLiabilities: totalLiabilities.toFixed(2),
          netWorth: netWorth.toFixed(2),
        })
        .returning();

      return reply.code(201).send(snapshot);
    }
  );
}
