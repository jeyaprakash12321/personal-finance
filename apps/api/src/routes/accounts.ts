import { z } from "zod";

import {
  accounts,
  db,
  transactions,
  eq,
  and,
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
  initialBalance: z.string().regex(/^-?\d+(\.\d{1,2})?$/).default("0"),
});

const updateAccountSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  type: z
    .enum([
      "checking",
      "savings",
      "cash",
      "credit_card",
      "investment",
    ])
    .optional(),
  currency: z.string().length(3).optional(),
  initialBalance: z.string().regex(/^-?\d+(\.\d{1,2})?$/).optional(),
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

  app.put(
    "/accounts/:id",
    {
      preHandler: [app.authenticate],
    },
    async (request: any, reply: any) => {
      const { id } = request.params;
      const userId = request.user.id;
      const body = updateAccountSchema.parse(
        request.body
      );

      const [account] = await db
        .update(accounts)
        .set(body)
        .where(
          and(
            eq(accounts.id, id),
            eq(accounts.userId, userId)
          )
        )
        .returning();

      if (!account) {
        return reply
          .code(404)
          .send({ error: "Account not found" });
      }

      return account;
    }
  );

  app.delete(
    "/accounts/:id",
    {
      preHandler: [app.authenticate],
    },
    async (request: any, reply: any) => {
      const { id } = request.params;
      const userId = request.user.id;

      const [account] = await db
        .update(accounts)
        .set({ isActive: false })
        .where(
          and(
            eq(accounts.id, id),
            eq(accounts.userId, userId)
          )
        )
        .returning();

      if (!account) {
        return reply
          .code(404)
          .send({ error: "Account not found" });
      }

      return reply.code(204).send();
    }
  );
}
