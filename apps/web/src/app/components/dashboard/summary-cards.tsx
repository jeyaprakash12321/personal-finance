type DashboardData = {
  accounts: {
    totalBalance: number;
    count: number;
  };
  transactions: {
    income: number;
    expenses: number;
    net: number;
    count: number;
  };
  goals: {
    totalTarget: number;
    totalSaved: number;
    remaining: number;
    progressPercentage: number;
    count: number;
  };
};

function formatCurrency(amount: number) {
  return `₹${amount.toLocaleString("en-IN")}`;
}

export function SummaryCards({
  dashboard,
}: {
  dashboard: DashboardData;
}) {
  const cards = [
    {
      label: "Total Balance",
      value: formatCurrency(dashboard.accounts.totalBalance),
      description: `${dashboard.accounts.count} account${
        dashboard.accounts.count !== 1 ? "s" : ""
      }`,
    },
    {
      label: "Income",
      value: formatCurrency(dashboard.transactions.income),
      description: "Total income",
    },
    {
      label: "Expenses",
      value: formatCurrency(dashboard.transactions.expenses),
      description: `${dashboard.transactions.count} transactions`,
    },
    {
      label: "Goal Progress",
      value: `${dashboard.goals.progressPercentage}%`,
      description: `${formatCurrency(
        dashboard.goals.totalSaved
      )} saved`,
    },
  ];

  return (
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => (
        <div
          key={card.label}
          className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition-shadow hover:shadow-md sm:p-6"
        >
          <p className="text-sm font-medium text-slate-500">
            {card.label}
          </p>

          <p className="mt-3 text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
            {card.value}
          </p>

          <p className="mt-2 text-sm text-slate-400">
            {card.description}
          </p>
        </div>
      ))}
    </section>
  );
}