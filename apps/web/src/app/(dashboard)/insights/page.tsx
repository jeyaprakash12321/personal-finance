"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  CircleDollarSign,
  Lightbulb,
  Receipt,
  Sparkles,
  Target,
  TrendingDown,
  TrendingUp,
  Wallet,
} from "lucide-react";

type Transaction = {
  id: string;
  categoryName: string;
  description: string | null;
  amount: string;
  type: "income" | "expense";
  transactionDate: string;
};

type InsightTone = "green" | "blue" | "purple" | "orange" | "red";

type Insight = {
  title: string;
  description: string;
  icon: React.ReactNode;
  tone: InsightTone;
};

const currencyFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

function formatCurrency(value: number) {
  return currencyFormatter.format(value);
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

export default function InsightsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadTransactions() {
      try {
        const response = await fetch(
          "http://localhost:4000/transactions",
          {
            cache: "no-store",
          }
        );

        if (!response.ok) {
          throw new Error("Failed to load transactions");
        }

        const data = await response.json();

        setTransactions(data);
      } catch (error) {
        console.error(
          "Failed to load insights:",
          error
        );
      } finally {
        setLoading(false);
      }
    }

    loadTransactions();
  }, []);

  const analytics = useMemo(() => {
    const now = new Date();

    const currentMonthStart = new Date(
      now.getFullYear(),
      now.getMonth(),
      1
    );

    const previousMonthStart = new Date(
      now.getFullYear(),
      now.getMonth() - 1,
      1
    );

    const currentMonthTransactions =
      transactions.filter(
        (transaction) =>
          new Date(transaction.transactionDate) >=
          currentMonthStart
      );

    const previousMonthTransactions =
      transactions.filter((transaction) => {
        const date = new Date(
          transaction.transactionDate
        );

        return (
          date >= previousMonthStart &&
          date < currentMonthStart
        );
      });

    const currentIncome =
      currentMonthTransactions
        .filter(
          (transaction) => transaction.type === "income"
        )
        .reduce(
          (total, transaction) =>
            total + Number(transaction.amount),
          0
        );

    const currentExpenses =
      currentMonthTransactions
        .filter(
          (transaction) => transaction.type === "expense"
        )
        .reduce(
          (total, transaction) =>
            total + Number(transaction.amount),
          0
        );

    const previousExpenses =
      previousMonthTransactions
        .filter(
          (transaction) => transaction.type === "expense"
        )
        .reduce(
          (total, transaction) =>
            total + Number(transaction.amount),
          0
        );

    const categoryTotals = new Map<string, number>();

    currentMonthTransactions
      .filter(
        (transaction) => transaction.type === "expense"
      )
      .forEach((transaction) => {
        const current =
          categoryTotals.get(transaction.categoryName) ?? 0;

        categoryTotals.set(
          transaction.categoryName,
          current + Number(transaction.amount)
        );
      });

    const categories = Array.from(categoryTotals.entries())
      .map(([name, amount]) => ({
        name,
        amount,
        percentage:
          currentExpenses > 0
            ? (amount / currentExpenses) * 100
            : 0,
      }))
      .sort((a, b) => b.amount - a.amount);

    const largestExpense =
      currentMonthTransactions
        .filter(
          (transaction) => transaction.type === "expense"
        )
        .sort(
          (a, b) =>
            Number(b.amount) - Number(a.amount)
        )[0] ?? null;

    const savings = currentIncome - currentExpenses;

    const expenseChange =
      previousExpenses > 0
        ? ((currentExpenses - previousExpenses) /
            previousExpenses) *
          100
        : 0;

    return {
      currentMonthTransactions,
      currentIncome,
      currentExpenses,
      previousExpenses,
      savings,
      categories,
      largestExpense,
      expenseChange,
    };
  }, [transactions]);

  const insights = useMemo<Insight[]>(() => {
    const generated: Insight[] = [];

    if (analytics.currentExpenses === 0) {
      generated.push({
        title: "Start tracking your spending",
        description:
          "Add a few expense transactions and Wealthly will start finding patterns in your finances.",
        icon: <Sparkles className="h-5 w-5" />,
        tone: "green",
      });

      return generated;
    }

    if (analytics.categories.length > 0) {
      const topCategory = analytics.categories[0];

      generated.push({
        title: `${topCategory.name} is your biggest expense`,
        description: `${formatCurrency(
          topCategory.amount
        )} of your spending this month went toward ${
          topCategory.name
        }. That's ${topCategory.percentage.toFixed(
          1
        )}% of your total expenses.`,
        icon: <BarChart3 className="h-5 w-5" />,
        tone: "green",
      });
    }

    if (analytics.savings > 0) {
      generated.push({
        title: "You're ending the month positive",
        description: `You've kept ${formatCurrency(
          analytics.savings
        )} after your recorded expenses this month.`,
        icon: <TrendingUp className="h-5 w-5" />,
        tone: "blue",
      });
    } else if (analytics.savings < 0) {
      generated.push({
        title: "Expenses are ahead of income",
        description: `Your recorded expenses are ${formatCurrency(
          Math.abs(analytics.savings)
        )} higher than your income this month.`,
        icon: <TrendingDown className="h-5 w-5" />,
        tone: "red",
      });
    }

    if (analytics.expenseChange > 10) {
      generated.push({
        title: "Spending has increased",
        description: `Your expenses are currently ${analytics.expenseChange.toFixed(
          1
        )}% higher than last month.`,
        icon: <ArrowUpRight className="h-5 w-5" />,
        tone: "orange",
      });
    } else if (
      analytics.expenseChange < -10
    ) {
      generated.push({
        title: "Spending has come down",
        description: `Your expenses are currently ${Math.abs(
          analytics.expenseChange
        ).toFixed(
          1
        )}% lower than last month.`,
        icon: <ArrowDownRight className="h-5 w-5" />,
        tone: "green",
      });
    }

    if (analytics.largestExpense) {
      generated.push({
        title: "Your largest expense this month",
        description: `${analytics.largestExpense.description ||
          analytics.largestExpense.categoryName} was ${formatCurrency(
          Number(analytics.largestExpense.amount)
        )} on ${formatDate(
          analytics.largestExpense.transactionDate
        )}.`,
        icon: <Receipt className="h-5 w-5" />,
        tone: "purple",
      });
    }

    return generated;
  }, [analytics]);

  const monthName = new Intl.DateTimeFormat(
    "en-IN",
    {
      month: "long",
      year: "numeric",
    }
  ).format(new Date());

  return (
    <div className="min-h-screen px-5 py-6 sm:px-8 lg:px-10">
      <div className="mx-auto max-w-[1450px]">
        {/* Header */}
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#dff6ea] text-[#078653]">
              <Lightbulb className="h-4 w-4" />
            </div>

            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#16a36a]">
              Smart analysis
            </p>
          </div>

          <h1 className="mt-4 text-[30px] font-bold tracking-[-0.04em] text-[#10231c] sm:text-[36px]">
            Insights
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#71817a]">
            A clearer view of your financial habits, patterns,
            and opportunities.
          </p>
        </div>

        {/* Hero insight */}
        <section className="relative mt-7 overflow-hidden rounded-3xl border border-[#cceedd] bg-[#effaf4] p-6 sm:p-8">
          <div className="absolute -right-12 -top-16 h-44 w-44 rounded-full bg-[#d7f4e5] blur-2xl" />

          <div className="relative max-w-3xl">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-[#16a36a]" />

              <span className="text-xs font-semibold uppercase tracking-[0.12em] text-[#078653]">
                Your financial snapshot
              </span>
            </div>

            <h2 className="mt-3 text-[23px] font-bold tracking-[-0.035em] text-[#10231c] sm:text-[28px]">
              Here's what your money is telling you.
            </h2>

            <p className="mt-2 text-sm leading-6 text-[#60736b]">
              Based on your recorded activity for{" "}
              {monthName}.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <MetricPill
                label="Income"
                value={formatCurrency(
                  analytics.currentIncome
                )}
              />

              <MetricPill
                label="Expenses"
                value={formatCurrency(
                  analytics.currentExpenses
                )}
              />

              <MetricPill
                label="Net"
                value={formatCurrency(
                  analytics.savings
                )}
              />
            </div>
          </div>
        </section>

        {/* Insight cards */}
        <section className="mt-6">
          <div className="mb-4 flex items-end justify-between">
            <div>
              <h2 className="text-[18px] font-bold tracking-[-0.02em] text-[#10231c]">
                What stands out
              </h2>

              <p className="mt-1 text-sm text-[#82908a]">
                Automatically generated from your activity.
              </p>
            </div>

            <span className="hidden rounded-full bg-[#f1f8f4] px-3 py-1.5 text-[11px] font-semibold text-[#60736b] sm:block">
              {insights.length} insights
            </span>
          </div>

          {loading ? (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 5 }).map((_, index) => (
                <div
                  key={index}
                  className="h-[190px] animate-pulse rounded-2xl bg-[#edf3ef]"
                />
              ))}
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {insights.map((insight, index) => (
                <InsightCard
                  key={`${insight.title}-${index}`}
                  insight={insight}
                />
              ))}
            </div>
          )}
        </section>

        {/* Spending breakdown */}
        <div className="mt-6 grid gap-6 xl:grid-cols-[1.25fr_1fr]">
          <section className="rounded-2xl border border-[#e4ebe7] bg-white p-5 shadow-[0_8px_30px_rgba(16,35,28,0.04)] sm:p-6">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-[17px] font-bold tracking-[-0.02em] text-[#10231c]">
                  Spending breakdown
                </h2>

                <p className="mt-1 text-sm text-[#82908a]">
                  Where your money is going this month.
                </p>
              </div>

              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#ecfdf5] text-[#16a36a]">
                <BarChart3 className="h-4 w-4" />
              </div>
            </div>

            <div className="mt-6 space-y-5">
              {analytics.categories.length === 0 ? (
                <EmptyState />
              ) : (
                analytics.categories
                  .slice(0, 6)
                  .map((category) => (
                    <div key={category.name}>
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-sm font-medium text-[#40534b]">
                          {category.name}
                        </span>

                        <div className="flex items-center gap-3">
                          <span className="text-xs text-[#91a09a]">
                            {category.percentage.toFixed(
                              1
                            )}
                            %
                          </span>

                          <span className="text-sm font-semibold text-[#10231c]">
                            {formatCurrency(
                              category.amount
                            )}
                          </span>
                        </div>
                      </div>

                      <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#edf3ef]">
                        <div
                          className="h-full rounded-full bg-[#16a36a] transition-all"
                          style={{
                            width: `${Math.min(
                              category.percentage,
                              100
                            )}%`,
                          }}
                        />
                      </div>
                    </div>
                  ))
              )}
            </div>
          </section>

          {/* Activity summary */}
          <section className="rounded-2xl border border-[#e4ebe7] bg-white p-5 shadow-[0_8px_30px_rgba(16,35,28,0.04)] sm:p-6">
            <div>
              <h2 className="text-[17px] font-bold tracking-[-0.02em] text-[#10231c]">
                Activity summary
              </h2>

              <p className="mt-1 text-sm text-[#82908a]">
                A quick look at your current-month activity.
              </p>
            </div>

            <div className="mt-6 space-y-3">
              <SummaryRow
                icon={
                  <ArrowUpRight className="h-4 w-4" />
                }
                label="Income"
                value={formatCurrency(
                  analytics.currentIncome
                )}
                tone="green"
              />

              <SummaryRow
                icon={
                  <ArrowDownRight className="h-4 w-4" />
                }
                label="Expenses"
                value={formatCurrency(
                  analytics.currentExpenses
                )}
                tone="red"
              />

              <SummaryRow
                icon={<Wallet className="h-4 w-4" />}
                label="Net cash flow"
                value={formatCurrency(
                  analytics.savings
                )}
                tone="blue"
              />

              <SummaryRow
                icon={
                  <Receipt className="h-4 w-4" />
                }
                label="Transactions"
                value={String(
                  analytics.currentMonthTransactions
                    .length
                )}
                tone="purple"
              />
            </div>

            <div className="mt-5 rounded-xl bg-[#f7faf8] p-4">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#dff6ea] text-[#078653]">
                  <Target className="h-4 w-4" />
                </div>

                <div>
                  <p className="text-xs font-semibold text-[#40534b]">
                    Keep the momentum
                  </p>

                  <p className="mt-1 text-xs leading-5 text-[#82908a]">
                    Small, consistent improvements in spending
                    can make a meaningful difference to your
                    long-term goals.
                  </p>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Bottom note */}
        <div className="mt-6 flex items-start gap-3 rounded-2xl border border-[#e8eee9] bg-white p-5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#f1f8f4] text-[#16a36a]">
            <Lightbulb className="h-4 w-4" />
          </div>

          <div>
            <p className="text-sm font-semibold text-[#30453c]">
              A note about these insights
            </p>

            <p className="mt-1 text-xs leading-5 text-[#82908a]">
              Insights are based on the transactions currently
              recorded in Wealthly. As you add more data, the
              patterns will become more useful.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricPill({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-[#d5eee0] bg-white/70 px-4 py-2.5">
      <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[#82908a]">
        {label}
      </p>

      <p className="mt-0.5 text-sm font-bold text-[#10231c]">
        {value}
      </p>
    </div>
  );
}

function InsightCard({
  insight,
}: {
  insight: Insight;
}) {
  const toneClasses: Record<
    InsightTone,
    {
      icon: string;
      background: string;
    }
  > = {
    green: {
      icon: "bg-[#ecfdf5] text-[#16a36a]",
      background: "bg-[#fbfefc]",
    },
    blue: {
      icon: "bg-[#eef4ff] text-[#4c8df6]",
      background: "bg-[#fbfcff]",
    },
    purple: {
      icon: "bg-[#f2edff] text-[#8b6cf6]",
      background: "bg-[#fcfbff]",
    },
    orange: {
      icon: "bg-[#fff7e8] text-[#e4a62b]",
      background: "bg-[#fffdfa]",
    },
    red: {
      icon: "bg-[#fff1f1] text-[#ff5b5f]",
      background: "bg-[#fffdfd]",
    },
  };

  const tone = toneClasses[insight.tone];

  return (
    <article
      className={`rounded-2xl border border-[#e4ebe7] p-5 shadow-[0_8px_30px_rgba(16,35,28,0.035)] ${tone.background}`}
    >
      <div
        className={`flex h-10 w-10 items-center justify-center rounded-xl ${tone.icon}`}
      >
        {insight.icon}
      </div>

      <h3 className="mt-5 text-[15px] font-bold tracking-[-0.015em] text-[#10231c]">
        {insight.title}
      </h3>

      <p className="mt-2 text-xs leading-5 text-[#71817a]">
        {insight.description}
      </p>
    </article>
  );
}

function SummaryRow({
  icon,
  label,
  value,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  tone: "green" | "red" | "blue" | "purple";
}) {
  const classes = {
    green: "bg-[#ecfdf5] text-[#16a36a]",
    red: "bg-[#fff1f1] text-[#ff5b5f]",
    blue: "bg-[#eef4ff] text-[#4c8df6]",
    purple: "bg-[#f2edff] text-[#8b6cf6]",
  };

  return (
    <div className="flex items-center justify-between rounded-xl border border-[#edf1ef] bg-[#fbfcfb] px-4 py-3">
      <div className="flex items-center gap-3">
        <div
          className={`flex h-8 w-8 items-center justify-center rounded-lg ${classes[tone]}`}
        >
          {icon}
        </div>

        <span className="text-sm font-medium text-[#60736b]">
          {label}
        </span>
      </div>

      <span className="text-sm font-bold text-[#10231c]">
        {value}
      </span>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-xl bg-[#f8faf9] p-6 text-center">
      <p className="text-sm font-semibold text-[#60736b]">
        No expense data yet
      </p>

      <p className="mt-1 text-xs text-[#a0ada7]">
        Add transactions to start seeing spending patterns.
      </p>
    </div>
  );
}