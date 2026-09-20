import { z } from "zod";

import {
  db,
  transactions,
  categories,
  eq,
} from "@personal-finance/db";

const createTransactionSchema = z.object({
  accountId: z.string().uuid(),
  categoryId: z.string().uuid(),
  amount: z
    .string()
    .regex(/^\d+(\.\d{1,2})?$/),
  type: z.enum(["income", "expense"]),
  description: z.string().max(255).optional(),
  transactionDate: z.string().datetime(),
});

export default async function transactionRoutes(
  app: any
) {
  app.post(
    "/transactions",
    {
      preHandler: [app.authenticate],
    },
    async (request: any, reply: any) => {
      const body =
        createTransactionSchema.parse(
          request.body
        );

      const userId = request.user.id;

      const [transaction] = await db
        .insert(transactions)
        .values({
          userId,
          accountId: body.accountId,
          categoryId: body.categoryId,
          amount: body.amount,
          type: body.type,
          description: body.description,
          transactionDate: new Date(
            body.transactionDate
          ),
        })
        .returning();

      return reply
        .code(201)
        .send(transaction);
    }
  );

  app.get(
    "/transactions",
    {
      preHandler: [app.authenticate],
    },
    async (request: any) => {
      const userId = request.user.id;

      const userTransactions = await db
        .select({
          id: transactions.id,
          userId: transactions.userId,
          accountId: transactions.accountId,
          categoryId: transactions.categoryId,
          amount: transactions.amount,
          type: transactions.type,
          description: transactions.description,
          transactionDate:
            transactions.transactionDate,
          createdAt: transactions.createdAt,
          categoryName: categories.name,
          categoryType: categories.type,
        })
        .from(transactions)
        .innerJoin(
          categories,
          eq(
            transactions.categoryId,
            categories.id
          )
        )
        .where(
          eq(transactions.userId, userId)
        );

      return userTransactions;
    }
  );
}