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
  const recentTransactions = transactions.slice(0, 5);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">
            Recent Transactions
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Your latest financial activity
          </p>
        </div>

        <button className="text-sm font-medium text-emerald-600 hover:text-emerald-700">
          View all
        </button>
      </div>

      <div className="mt-6 divide-y divide-slate-100">
        {recentTransactions.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-400">
            No transactions yet
          </p>
        ) : (
          recentTransactions.map((transaction) => {
            const isIncome = transaction.type === "income";

            return (
              <div
                key={transaction.id}
                className="flex items-center justify-between py-4 first:pt-0 last:pb-0"
              >
                <div className="flex min-w-0 items-center gap-4">
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-semibold ${
                      isIncome
                        ? "bg-emerald-50 text-emerald-600"
                        : "bg-orange-50 text-orange-600"
                    }`}
                  >
                    {isIncome ? "+" : "−"}
                  </div>

                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-900">
                      {transaction.description ||
                        transaction.categoryName}
                    </p>

                    <p className="mt-1 text-xs text-slate-400">
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
                      ? "text-emerald-600"
                      : "text-slate-900"
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