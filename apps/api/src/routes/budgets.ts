import { z } from "zod";

import {
  budgets,
  categories,
  db,
  transactions,
  eq,
  and,
} from "@personal-finance/db";

const createBudgetSchema = z.object({
  categoryId: z.string().uuid(),
  amount: z
    .string()
    .regex(/^\d+(\.\d{1,2})?$/),
  month: z
    .string()
    .regex(/^\d{4}-\d{2}$/),
});

function getMonthRange(month: string) {
  const [year, monthNumber] = month
    .split("-")
    .map(Number);

  const start = new Date(
    Date.UTC(
      year,
      monthNumber - 1,
      1,
      0,
      0,
      0,
      0
    )
  );

  const end = new Date(
    Date.UTC(
      year,
      monthNumber,
      1,
      0,
      0,
      0,
      0
    )
  );

  return {
    start,
    end,
  };
}

export default async function budgetRoutes(
  app: any
) {
  app.post(
    "/budgets",
    {
      preHandler: [app.authenticate],
    },
    async (request: any, reply: any) => {
      const body =
        createBudgetSchema.parse(
          request.body
        );

      const userId = request.user.id;
      const amount = Number(body.amount);

      if (amount <= 0) {
        return reply.code(400).send({
          message:
            "Budget amount must be greater than zero",
        });
      }

      const [category] = await db
        .select()
        .from(categories)
        .where(
          and(
            eq(
              categories.id,
              body.categoryId
            ),
            eq(
              categories.userId,
              userId
            )
          )
        );

      if (!category) {
        return reply.code(404).send({
          message: "Category not found",
        });
      }

      if (category.type !== "expense") {
        return reply.code(400).send({
          message:
            "Budgets can only be created for expense categories",
        });
      }

      const [year, monthNumber] =
        body.month.split("-").map(Number);

      const monthDate = new Date(
        Date.UTC(
          year,
          monthNumber - 1,
          1
        )
      );

      const existingBudget = await db
        .select()
        .from(budgets)
        .where(
          and(
            eq(
              budgets.userId,
              userId
            ),
            eq(
              budgets.categoryId,
              body.categoryId
            ),
            eq(
              budgets.month,
              monthDate
            )
          )
        );

      if (existingBudget.length > 0) {
        return reply.code(409).send({
          message:
            "A budget already exists for this category and month",
        });
      }

      const [budget] = await db
        .insert(budgets)
        .values({
          userId,
          categoryId: body.categoryId,
          amount: body.amount,
          month: monthDate,
        })
        .returning();

      return reply
        .code(201)
        .send(budget);
    }
  );

  app.get(
    "/budgets",
    {
      preHandler: [app.authenticate],
    },
    async (request: any) => {
      const querySchema = z.object({
        month: z
          .string()
          .regex(/^\d{4}-\d{2}$/)
          .optional(),
      });

      const query =
        querySchema.parse(request.query);

      const userId = request.user.id;

      const now = new Date();

      const defaultMonth = `${now.getUTCFullYear()}-${String(
        now.getUTCMonth() + 1
      ).padStart(2, "0")}`;

      const selectedMonth =
        query.month ?? defaultMonth;

      const { start, end } =
        getMonthRange(selectedMonth);

      const userBudgets = await db
        .select({
          id: budgets.id,
          userId: budgets.userId,
          categoryId: budgets.categoryId,
          amount: budgets.amount,
          month: budgets.month,
          createdAt: budgets.createdAt,
          categoryName: categories.name,
          categoryType: categories.type,
        })
        .from(budgets)
        .innerJoin(
          categories,
          eq(
            budgets.categoryId,
            categories.id
          )
        )
        .where(
          eq(
            budgets.userId,
            userId
          )
        );

      const userTransactions = await db
        .select()
        .from(transactions)
        .where(
          eq(
            transactions.userId,
            userId
          )
        );

      return userBudgets
        .filter(
          (budget) =>
            budget.month.getTime() ===
            start.getTime()
        )
        .map((budget) => {
          const spent =
            userTransactions
              .filter(
                (transaction) =>
                  transaction.categoryId ===
                    budget.categoryId &&
                  transaction.type ===
                    "expense" &&
                  transaction.transactionDate >=
                    start &&
                  transaction.transactionDate <
                    end
              )
              .reduce(
                (total, transaction) =>
                  total +
                  Number(
                    transaction.amount
                  ),
                0
              );

          const budgetAmount =
            Number(budget.amount);

          const remaining = Math.max(
            budgetAmount - spent,
            0
          );

          const percentageUsed =
            budgetAmount > 0
              ? Math.min(
                  (spent / budgetAmount) *
                    100,
                  100
                )
              : 0;

          const isOverBudget =
            spent > budgetAmount;

          return {
            ...budget,
            spent,
            remaining,
            percentageUsed,
            isOverBudget,
          };
        });
    }
  );
}