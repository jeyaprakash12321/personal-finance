import { z } from "zod";

import {
  accounts,
  db,
  transactions,
  eq,
} from "@personal-finance/db";

const createAccountSchema = z.object({
  name: z.string().min(1).max(100),
  type: z.enum([
    "checking",
    "savings",
    "cash",
    "credit_card",
    "investment",
  ]),
  currency: z.string().length(3).default("INR"),
  initialBalance: z.string().default("0"),
});

export default async function accountRoutes(app: any) {
  app.post(
    "/accounts",
    {
      preHandler: [app.authenticate],
    },
    async (request: any, reply: any) => {
      const body = createAccountSchema.parse(
        request.body
      );

      const userId = request.user.id;

      const [account] = await db
        .insert(accounts)
        .values({
          userId,
          name: body.name,
          type: body.type,
          currency: body.currency,
          initialBalance: body.initialBalance,
        })
        .returning();

      return reply.code(201).send(account);
    }
  );

  app.get(
    "/accounts",
    {
      preHandler: [app.authenticate],
    },
    async (request: any) => {
      const userId = request.user.id;

      const userAccounts = await db
        .select()
        .from(accounts)
        .where(eq(accounts.userId, userId));

      const userTransactions = await db
        .select()
        .from(transactions)
        .where(
          eq(transactions.userId, userId)
        );

      return userAccounts.map((account) => {
        const accountTransactions =
          userTransactions.filter(
            (transaction) =>
              transaction.accountId === account.id
          );

        const transactionTotal =
          accountTransactions.reduce(
            (total, transaction) => {
              const amount = Number(
                transaction.amount
              );

              return transaction.type === "income"
                ? total + amount
                : total - amount;
            },
            0
          );

        return {
          ...account,
          currentBalance:
            Number(account.initialBalance) +
            transactionTotal,
        };
      });
    }
  );
}