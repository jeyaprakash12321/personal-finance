import {
  accounts,
  db,
  goalContributions,
  goals,
  transactions,
  eq,
  and,
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

      const [userAccounts, transactionSummary, accountSummaries, goalSummary, contributionSummary] = await Promise.all([
        db
          .select()
          .from(accounts)
          .where(and(eq(accounts.userId, userId), eq(accounts.isActive, true))),
        db
          .select({
            income: sql<string>`coalesce(sum(case when ${transactions.type} = 'income' then ${transactions.amount} else 0 end), 0)`,
            expenses: sql<string>`coalesce(sum(case when ${transactions.type} = 'expense' then ${transactions.amount} else 0 end), 0)`,
            count: sql<string>`count(*)`,
          })
          .from(transactions)
          .where(eq(transactions.userId, userId)),
        db
          .select({
            accountId: transactions.accountId,
            income: sql<string>`coalesce(sum(case when ${transactions.type} = 'income' then ${transactions.amount} else 0 end), 0)`,
            expenses: sql<string>`coalesce(sum(case when ${transactions.type} = 'expense' then ${transactions.amount} else 0 end), 0)`,
          })
          .from(transactions)
          .where(eq(transactions.userId, userId))
          .groupBy(transactions.accountId),
        db
          .select({
            count: sql<string>`count(*)`,
            totalTarget: sql<string>`coalesce(sum(${goals.targetAmount}), 0)`,
          })
          .from(goals)
          .where(eq(goals.userId, userId)),
        db
          .select({
            totalSaved: sql<string>`coalesce(sum(${goalContributions.amount}), 0)`,
          })
          .from(goalContributions)
          .where(eq(goalContributions.userId, userId)),
      ]);

      const accountTotals = new Map(accountSummaries.map((summary) => [summary.accountId, summary]));
      const totalBalance = userAccounts.reduce((total, account) => {
        const summary = accountTotals.get(account.id);
        return total + Number(account.initialBalance) + Number(summary?.income ?? 0) - Number(summary?.expenses ?? 0);
      }, 0);

      const income = Number(transactionSummary[0]?.income ?? 0);
      const expenses = Number(transactionSummary[0]?.expenses ?? 0);
      const transactionCount = Number(transactionSummary[0]?.count ?? 0);
      const totalGoalTarget = Number(goalSummary[0]?.totalTarget ?? 0);
      const totalGoalSaved = Number(contributionSummary[0]?.totalSaved ?? 0);
      const goalCount = Number(goalSummary[0]?.count ?? 0);

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
          count: transactionCount,
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
          count: goalCount,
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
