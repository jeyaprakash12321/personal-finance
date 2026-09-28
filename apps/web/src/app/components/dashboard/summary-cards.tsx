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
  netWorth,
}: {
  dashboard: DashboardData;
  netWorth: { totalAssets: number; totalLiabilities: number; netWorth: number };
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
    {
      label: "Net Worth",
      value: formatCurrency(netWorth.netWorth),
      description: "",
      details: {
        assets: formatCurrency(netWorth.totalAssets),
        liabilities: formatCurrency(netWorth.totalLiabilities),
      },
    },
  ];

  return (
    <section aria-label="Financial summary" className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-5">
      {cards.map((card) => (
        <div
          key={card.label}
          className="group relative min-h-[158px] min-w-0 overflow-hidden rounded-2xl border border-[var(--border)] border-t-2 border-t-[var(--accent)] bg-[var(--card-bg)] p-4 shadow-[var(--shadow-sm)] transition duration-200 hover:-translate-y-0.5 hover:border-[var(--accent-border)] hover:shadow-[var(--shadow-card)] sm:p-5"
        >
          <div className="flex items-start gap-3">
            <p className="min-h-10 text-[13px] font-semibold leading-5 tracking-[-0.01em] text-[var(--text-secondary)]">
              {card.label}
            </p>
          </div>

          <p
            title={card.value}
            className={`mt-4 min-w-0 whitespace-nowrap text-[clamp(1.05rem,1.35vw,1.5rem)] font-bold leading-none tracking-[-0.045em] tabular-nums sm:text-[clamp(1.1rem,1.35vw,1.5rem)] ${card.label === "Income" ? "text-[var(--accent)]" : card.label === "Expenses" ? "text-[var(--danger)]" : "text-[var(--text-primary)]"}`}
          >
            {card.value}
          </p>

          {card.details ? (
            <div className="mt-3 min-w-0 space-y-2">
              <div className="min-w-0">
                <p className="whitespace-nowrap text-[10px] font-medium uppercase tracking-[0.08em] text-[var(--text-muted)]">Assets</p>
                <p className="mt-1 truncate text-[15px] font-semibold tabular-nums text-[var(--accent)]">{card.details.assets}</p>
              </div>
              <div className="min-w-0">
                <p className="whitespace-nowrap text-[10px] font-medium uppercase tracking-[0.08em] text-[var(--text-muted)]">Liabilities</p>
                <p className="mt-1 truncate text-[15px] font-semibold tabular-nums text-[var(--danger)]">{card.details.liabilities}</p>
              </div>
            </div>
          ) : (
            <p className="mt-3 max-w-[19ch] text-xs leading-5 text-[var(--text-muted)]">
              {card.description}
            </p>
          )}
        </div>
      ))}
    </section>
  );
}
