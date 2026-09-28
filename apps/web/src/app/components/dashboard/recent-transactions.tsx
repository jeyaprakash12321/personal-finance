import Link from "next/link";

type Transaction = {
  id: string;
  amount: string;
  type: "income" | "expense";
  description: string | null;
  transactionDate: string;
  categoryName: string;
};

function formatCurrency(amount: number) {
  return `₹${amount.toLocaleString("en-IN")}`;
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
  });
}

export function RecentTransactions({
  transactions,
}: {
  transactions: Transaction[];
}) {
  const recentTransactions = [...transactions]
    .sort(
      (left, right) =>
        new Date(right.transactionDate).getTime() -
        new Date(left.transactionDate).getTime(),
    )
    .slice(0, 5);

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] p-4 shadow-[var(--shadow-sm)] sm:p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">
            Recent Transactions
          </h2>

          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            Your latest financial activity
          </p>
        </div>

        <Link
          href="/transactions"
          className="text-sm font-medium text-[var(--accent)] hover:text-[var(--accent-hover)]"
        >
          View all
        </Link>
      </div>

      <div className="mt-6 divide-y divide-[var(--border)]">
        {recentTransactions.length === 0 ? (
          <p className="py-8 text-center text-sm text-[var(--text-muted)]">
            No transactions yet
          </p>
        ) : (
          recentTransactions.map((transaction) => {
            const isIncome =
              transaction.type === "income";

            return (
              <div
                key={transaction.id}
                className="flex items-center justify-between py-4 first:pt-0 last:pb-0"
              >
                <div className="flex min-w-0 items-center gap-4">
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-semibold ${
                      isIncome
                        ? "bg-[var(--accent-soft)] text-[var(--accent)]"
                        : "bg-[var(--danger-soft)] text-[var(--danger)]"
                    }`}
                  >
                    {isIncome ? "+" : "−"}
                  </div>

                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-[var(--text-primary)]">
                      {transaction.description ||
                        transaction.categoryName}
                    </p>

                    <p className="mt-1 text-xs text-[var(--text-muted)]">
                      {transaction.categoryName} ·{" "}
                      {formatDate(
                        transaction.transactionDate
                      )}
                    </p>
                  </div>
                </div>

                <p
                  className={`ml-4 shrink-0 text-sm font-semibold ${
                    isIncome
                      ? "text-[var(--accent)]"
                      : "text-[var(--text-primary)]"
                  }`}
                >
                  {isIncome ? "+" : "−"}
                  {formatCurrency(
                    Number(transaction.amount)
                  )}
                </p>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
