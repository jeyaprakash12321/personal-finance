import { z } from "zod";
import { db, eq, and, transactions, budgets, categories } from "@personal-finance/db";

export default async function intelligenceRoutes(app: any) {
  // Spending Analytics & Intelligence
  app.get(
    "/intelligence/spending",
    { preHandler: [app.authenticate] },
    async (request: any) => {
      const userId = request.user.id;
      const allTx = await db
        .select({
          id: transactions.id,
          userId: transactions.userId,
          accountId: transactions.accountId,
          categoryId: transactions.categoryId,
          amount: transactions.amount,
          type: transactions.type,
          description: transactions.description,
          transactionDate: transactions.transactionDate,
          createdAt: transactions.createdAt,
          categoryName: categories.name,
        })
        .from(transactions)
        .innerJoin(
          categories,
          eq(transactions.categoryId, categories.id)
        )
        .where(eq(transactions.userId, userId));

      const expenses = allTx.filter((t) => t.type === "expense");
      const income = allTx.filter((t) => t.type === "income");

      const totalExpense = expenses.reduce((acc, t) => acc + parseFloat(t.amount), 0);
      const totalIncome = income.reduce((acc, t) => acc + parseFloat(t.amount), 0);

      // Category breakdown
      const categoryMap: Record<string, number> = {};
      expenses.forEach((t) => {
        const cat = t.categoryName || "Uncategorized";
        categoryMap[cat] = (categoryMap[cat] || 0) + parseFloat(t.amount);
      });

      const categorySpending = Object.entries(categoryMap).map(([category, amount]) => ({
        category,
        amount,
        percentage: totalExpense > 0 ? (amount / totalExpense) * 100 : 0,
      }));

      // Sort largest expenses
      const largestExpenses = [...expenses]
        .sort((a, b) => parseFloat(b.amount) - parseFloat(a.amount))
        .slice(0, 5);

      return {
        summary: {
          totalIncome,
          totalExpense,
          netSavings: totalIncome - totalExpense,
          savingsRatePercentage: totalIncome > 0 ? ((totalIncome - totalExpense) / totalIncome) * 100 : 0,
        },
        categorySpending,
        largestExpenses,
      };
    }
  );

  // Budget Intelligence with month-end projections
  app.get(
    "/intelligence/budgets",
    { preHandler: [app.authenticate] },
    async (request: any) => {
      const userId = request.user.id;
      const userBudgets = await db.select().from(budgets).where(eq(budgets.userId, userId));
      const userTx = await db
        .select({
          id: transactions.id,
          userId: transactions.userId,
          accountId: transactions.accountId,
          categoryId: transactions.categoryId,
          amount: transactions.amount,
          type: transactions.type,
          description: transactions.description,
          transactionDate: transactions.transactionDate,
          createdAt: transactions.createdAt,
          categoryName: categories.name,
        })
        .from(transactions)
        .innerJoin(
          categories,
          eq(transactions.categoryId, categories.id)
        )
        .where(eq(transactions.userId, userId));

      const now = new Date();
      const currentMonthIndex = now.getMonth();
      const currentYear = now.getFullYear();
      const daysInMonth = new Date(currentYear, currentMonthIndex + 1, 0).getDate();
      const currentDay = now.getDate();

      const currentMonthExpenses = userTx.filter((t) => {
        if (t.type !== "expense") return false;
        const d = new Date(t.transactionDate);
        return d.getMonth() === currentMonthIndex && d.getFullYear() === currentYear;
      });

      const budgetIntelligenceList = userBudgets.map((b) => {
        const budgetAmount = parseFloat(b.amount);
        const catTx = currentMonthExpenses.filter((t) => (t.categoryName || "Uncategorized") === b.categoryId);
        const spent = catTx.reduce((acc, t) => acc + parseFloat(t.amount), 0);
        const usedPercent = budgetAmount > 0 ? (spent / budgetAmount) * 100 : 0;

        // Projection logic based on current day of month pace
        const dailyPace = currentDay > 0 ? spent / currentDay : spent;
        const projected = dailyPace * daysInMonth;
        const isProjectedToExceed = projected > budgetAmount;

        return {
          ...b,
          spent,
          budgetAmount,
          usedPercent,
          projected,
          isProjectedToExceed,
        };
      });

      return budgetIntelligenceList;
    }
  );
}
