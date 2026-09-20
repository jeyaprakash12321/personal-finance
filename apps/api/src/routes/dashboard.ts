import {
  accounts,
  db,
  goalContributions,
  goals,
  transactions,
  eq,
  sql,
} from "@personal-finance/db";

import type { FastifyRequest } from "fastify";

export default async function dashboardRoutes(
  app: any
) {
  app.get(
    "/dashboard",
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

      const userGoals = await db
        .select()
        .from(goals)
        .where(eq(goals.userId, userId));

      const userContributions = await db
        .select()
        .from(goalContributions)
        .where(
          eq(
            goalContributions.userId,
            userId
          )
        );

      const totalBalance =
        userAccounts.reduce(
          (total, account) => {
            const accountTransactions =
              userTransactions.filter(
                (transaction) =>
                  transaction.accountId ===
                  account.id
              );

            const transactionTotal =
              accountTransactions.reduce(
                (
                  accountTotal,
                  transaction
                ) => {
                  const amount = Number(
                    transaction.amount
                  );

                  return transaction.type ===
                    "income"
                    ? accountTotal + amount
                    : accountTotal - amount;
                },
                0
              );

            return (
              total +
              Number(
                account.initialBalance
              ) +
              transactionTotal
            );
          },
          0
        );

      const income =
        userTransactions
          .filter(
            (transaction) =>
              transaction.type === "income"
          )
          .reduce(
            (total, transaction) =>
              total +
              Number(transaction.amount),
            0
          );

      const expenses =
        userTransactions
          .filter(
            (transaction) =>
              transaction.type === "expense"
          )
          .reduce(
            (total, transaction) =>
              total +
              Number(transaction.amount),
            0
          );

      const totalGoalTarget =
        userGoals.reduce(
          (total, goal) =>
            total +
            Number(goal.targetAmount),
          0
        );

      const totalGoalSaved =
        userContributions.reduce(
          (total, contribution) =>
            total +
            Number(contribution.amount),
          0
        );

      const goalProgress =
        totalGoalTarget > 0
          ? Math.min(
              (totalGoalSaved /
                totalGoalTarget) *
                100,
              100
            )
          : 0;

      return {
        accounts: {
          totalBalance,
          count: userAccounts.length,
        },

        transactions: {
          income,
          expenses,
          net: income - expenses,
          count: userTransactions.length,
        },

        goals: {
          totalTarget: totalGoalTarget,
          totalSaved: totalGoalSaved,
          remaining: Math.max(
            totalGoalTarget -
              totalGoalSaved,
            0
          ),
          progressPercentage:
            goalProgress,
          count: userGoals.length,
        },
      };
    }
  );

  app.get(
    "/dashboard/cash-flow",
    {
      preHandler: [app.authenticate],
    },
    async (
      request: FastifyRequest<{
        Querystring: {
          range?: string;
        };
      }> & {
        user: {
          id: string;
          email: string;
        };
      }
    ) => {
      const range =
        request.query.range ?? "30d";

      const rangeDays: Record<
        string,
        number
      > = {
        "30d": 30,
        "90d": 90,
        "1y": 365,
      };

      const days = rangeDays[range];

      if (!days) {
        return {
          error:
            "Invalid range. Use 30d, 90d, or 1y.",
        };
      }

      const userId = request.user.id;

      const result = await app.db.execute(
        sql`
          WITH date_series AS (
            SELECT generate_series(
              CURRENT_DATE -
                (${days} - 1) *
                INTERVAL '1 day',
              CURRENT_DATE,
              INTERVAL '1 day'
            )::date AS date
          ),

          daily_transactions AS (
            SELECT
              DATE(transaction_date) AS date,

              COALESCE(
                SUM(
                  CASE
                    WHEN type = 'income'
                    THEN amount
                    ELSE 0
                  END
                ),
                0
              ) AS income,

              COALESCE(
                SUM(
                  CASE
                    WHEN type = 'expense'
                    THEN amount
                    ELSE 0
                  END
                ),
                0
              ) AS expenses

            FROM transactions

            WHERE
              user_id = ${userId}

              AND transaction_date >=
                CURRENT_DATE -
                (${days} - 1) *
                INTERVAL '1 day'

              AND transaction_date <
                CURRENT_DATE +
                INTERVAL '1 day'

            GROUP BY
              DATE(transaction_date)
          )

          SELECT
            TO_CHAR(
              ds.date,
              'YYYY-MM-DD'
            ) AS date,

            COALESCE(
              dt.income,
              0
            ) AS income,

            COALESCE(
              dt.expenses,
              0
            ) AS expenses

          FROM date_series ds

          LEFT JOIN daily_transactions dt
            ON dt.date = ds.date

          ORDER BY ds.date ASC;
        `
      );

      return result.map(
        (row: {
          date: string;
          income: string;
          expenses: string;
        }) => ({
          date: row.date,
          income: Number(row.income),
          expenses: Number(
            row.expenses
          ),
        })
      );
    }
  );
}