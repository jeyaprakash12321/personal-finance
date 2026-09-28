export type DashboardTransaction = {
  amount: string;
  type: "income" | "expense";
  categoryName?: string | null;
};

export function summarizeTransactions(transactions: DashboardTransaction[]) {
  return transactions.reduce(
    (summary, transaction) => {
      const amount = Number(transaction.amount);
      if (!Number.isFinite(amount) || amount < 0) return summary;

      if (transaction.type === "income") {
        summary.income += amount;
      } else {
        summary.expenses += amount;
      }
      summary.count += 1;
      summary.net = summary.income - summary.expenses;
      return summary;
    },
    { income: 0, expenses: 0, net: 0, count: 0 },
  );
}

export function buildExpenseBreakdown(transactions: DashboardTransaction[]) {
  const grouped = new Map<string, number>();
  for (const transaction of transactions) {
    if (transaction.type !== "expense") continue;
    const amount = Number(transaction.amount);
    if (!Number.isFinite(amount) || amount < 0) continue;
    const category = transaction.categoryName?.trim() || "Uncategorized";
    grouped.set(category, (grouped.get(category) ?? 0) + amount);
  }

  return [...grouped.entries()]
    .map(([name, amount]) => ({ name, amount }))
    .sort((a, b) => b.amount - a.amount);
}
