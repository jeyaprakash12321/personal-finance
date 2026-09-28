"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  ArrowDownRight,
  ArrowUpRight,
  CalendarDays,
  ChevronDown,
  CircleDollarSign,
  PieChart as PieChartIcon,
  TrendingUp,
  Wallet,
} from "lucide-react";

type Range = "30d" | "90d" | "1y";

type Transaction = {
  id: string;
  categoryName: string;
  description: string | null;
  amount: string;
  type: "income" | "expense";
  transactionDate: string;
};

type CashFlowPoint = {
  date: string;
  income: number;
  expenses: number;
  net: number;
};

type CategoryReport = {
  name: string;
  amount: number;
  percentage: number;
};

const currencyFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

const shortCurrencyFormatter = new Intl.NumberFormat("en-IN", {
  maximumFractionDigits: 0,
});

function formatCurrency(value: number) {
  return currencyFormatter.format(value);
}

function formatCompactCurrency(value: number) {
  return `₹${shortCurrencyFormatter.format(value)}`;
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
  }).format(new Date(date));
}

function formatMonth(date: string) {
  return new Intl.DateTimeFormat("en-IN", {
    month: "short",
    year: "2-digit",
  }).format(new Date(date));
}

export default function ReportsPage() {
  const [range, setRange] = useState<Range>("90d");
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [cashFlow, setCashFlow] = useState<CashFlowPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [rangeOpen, setRangeOpen] = useState(false);

  useEffect(() => {
    async function loadReports() {
      try {
        setLoading(true);
        setError("");

        const [transactionsResponse, cashFlowResponse] =
          await Promise.all([
            fetch("/api/transactions", {
              cache: "no-store",
            }),
            fetch(
              `/api/dashboard/cash-flow?range=${range}`,
              {
                cache: "no-store",
              }
            ),
          ]);

        if (!transactionsResponse.ok) {
          throw new Error("Failed to load transactions");
        }

        if (!cashFlowResponse.ok) {
          throw new Error("Failed to load cash flow");
        }

        const transactionData = await transactionsResponse.json();
        const cashFlowData = await cashFlowResponse.json();

        setTransactions(transactionData);
        setCashFlow(cashFlowData);
      } catch (error) {
        console.error("Failed to load reports:", error);
        setError("We couldn't load this report. Please try again.");
      } finally {
        setLoading(false);
      }
    }

    loadReports();
  }, [range]);

  const rangeStart = useMemo(() => {
    const days =
      range === "30d"
        ? 30
        : range === "90d"
          ? 90
          : 365;

    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - (days - 1));

    return date;
  }, [range]);

  const filteredTransactions = useMemo(() => {
    return transactions.filter(
      (transaction) =>
        new Date(transaction.transactionDate) >= rangeStart
    );
  }, [transactions, rangeStart]);

  const summary = useMemo(() => {
    const income = filteredTransactions
      .filter((transaction) => transaction.type === "income")
      .reduce(
        (total, transaction) => total + Number(transaction.amount),
        0
      );

    const expenses = filteredTransactions
      .filter((transaction) => transaction.type === "expense")
      .reduce(
        (total, transaction) => total + Number(transaction.amount),
        0
      );

    return {
      income,
      expenses,
      savings: income - expenses,
      savingsRate:
        income > 0 ? ((income - expenses) / income) * 100 : 0,
      transactionCount: filteredTransactions.length,
    };
  }, [filteredTransactions]);

  const categoryData = useMemo<CategoryReport[]>(() => {
    const totals = new Map<string, number>();

    filteredTransactions
      .filter((transaction) => transaction.type === "expense")
      .forEach((transaction) => {
        const current = totals.get(transaction.categoryName) ?? 0;

        totals.set(
          transaction.categoryName,
          current + Number(transaction.amount)
        );
      });

    const totalExpenses = Array.from(totals.values()).reduce(
      (total, amount) => total + amount,
      0
    );

    return Array.from(totals.entries())
      .map(([name, amount]) => ({
        name,
        amount,
        percentage:
          totalExpenses > 0
            ? (amount / totalExpenses) * 100
            : 0,
      }))
      .sort((a, b) => b.amount - a.amount);
  }, [filteredTransactions]);

  const monthlyData = useMemo(() => {
    const grouped = new Map<
      string,
      {
        month: string;
        income: number;
        expenses: number;
      }
    >();

    filteredTransactions.forEach((transaction) => {
      const date = new Date(transaction.transactionDate);

      const key = `${date.getFullYear()}-${String(
        date.getMonth() + 1
      ).padStart(2, "0")}`;

      const existing = grouped.get(key);

      if (existing) {
        if (transaction.type === "income") {
          existing.income += Number(transaction.amount);
        } else {
          existing.expenses += Number(transaction.amount);
        }
      } else {
        grouped.set(key, {
          month: formatMonth(transaction.transactionDate),
          income:
            transaction.type === "income"
              ? Number(transaction.amount)
              : 0,
          expenses:
            transaction.type === "expense"
              ? Number(transaction.amount)
              : 0,
        });
      }
    });

    return Array.from(grouped.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([, value]) => value);
  }, [filteredTransactions]);

  const topCategories = categoryData.slice(0, 5);

  const trendData = useMemo(() => {
    return cashFlow.map((point) => ({
      ...point,
      label: formatDate(point.date),
    }));
  }, [cashFlow]);

  const rangeLabel =
    range === "30d"
      ? "Last 30 days"
      : range === "90d"
        ? "Last 90 days"
        : "Last year";

  return (
    <div className="min-h-screen px-5 py-6 sm:px-8 lg:px-10">
      <div className="mx-auto max-w-[1450px]">
        {error && (
          <div className="mb-5 rounded-xl border border-[var(--danger-border,#ffb3b8)] bg-[var(--danger-soft)] px-4 py-3 text-sm text-[var(--danger)]">
            {error}
          </div>
        )}
        {/* Header */}
        <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#16a36a]">
              Financial overview
            </p>

            <h1 className="mt-2 text-[30px] font-bold tracking-[-0.04em] text-[#10231c] sm:text-[36px]">
              Reports
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#71817a]">
              Understand where your money is going and how your
              finances are changing over time.
            </p>
          </div>

          <div className="relative">
            <button
              type="button"
              onClick={() => setRangeOpen((open) => !open)}
              className="flex min-w-[180px] items-center justify-between gap-4 rounded-xl border border-[#e2eae5] bg-white px-4 py-3 text-sm font-semibold text-[#24382f] shadow-[0_4px_18px_rgba(16,35,28,0.04)]"
            >
              <span className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-[#16a36a]" />
                {rangeLabel}
              </span>

              <ChevronDown
                className={`h-4 w-4 transition ${
                  rangeOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {rangeOpen && (
              <div className="absolute right-0 z-20 mt-2 w-full overflow-hidden rounded-xl border border-[#e4ebe7] bg-white p-1 shadow-xl">
                {[
                  { value: "30d", label: "Last 30 days" },
                  { value: "90d", label: "Last 90 days" },
                  { value: "1y", label: "Last year" },
                ].map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => {
                      setRange(option.value as Range);
                      setRangeOpen(false);
                    }}
                    className={`w-full rounded-lg px-3 py-2.5 text-left text-sm transition ${
                      range === option.value
                        ? "bg-[#ecfdf5] font-semibold text-[#078653]"
                        : "text-[#60736b] hover:bg-[#f5f8f6]"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Summary cards */}
        <div className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryCard
            label="Total income"
            value={formatCurrency(summary.income)}
            icon={<ArrowUpRight className="h-5 w-5" />}
            iconClass="bg-[#ecfdf5] text-[#16a36a]"
            valueClass="text-[var(--accent)]"
            description={`${summary.transactionCount} transactions`}
          />

          <SummaryCard
            label="Total expenses"
            value={formatCurrency(summary.expenses)}
            icon={<ArrowDownRight className="h-5 w-5" />}
            iconClass="bg-[#fff1f1] text-[#ff5b5f]"
            valueClass="text-[var(--danger)]"
            description="Money spent"
          />

          <SummaryCard
            label="Net savings"
            value={formatCurrency(summary.savings)}
            icon={<Wallet className="h-5 w-5" />}
            iconClass="bg-[#eef4ff] text-[#4c8df6]"
            description={
              summary.savings >= 0
                ? "Positive cash flow"
                : "More spent than earned"
            }
          />

          <SummaryCard
            label="Savings rate"
            value={`${summary.savingsRate.toFixed(1)}%`}
            icon={<TrendingUp className="h-5 w-5" />}
            iconClass="bg-[#f2edff] text-[#8b6cf6]"
            description="Income kept"
          />
        </div>

        {/* Main trend */}
        <section className="mt-6 rounded-2xl border border-[#e4ebe7] bg-white p-5 shadow-[0_8px_30px_rgba(16,35,28,0.04)] sm:p-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-[17px] font-bold tracking-[-0.02em] text-[#10231c]">
                Income vs expenses
              </h2>

              <p className="mt-1 text-sm text-[#82908a]">
                Your daily cash flow for {rangeLabel.toLowerCase()}.
              </p>
            </div>

            <div className="flex items-center gap-4 text-xs font-medium text-[#71817a]">
              <span className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-[#16a36a]" />
                Income
              </span>

              <span className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-[#ff7a7d]" />
                Expenses
              </span>
            </div>
          </div>

          <div className="mt-6 h-[330px]">
            {loading ? (
              <ChartSkeleton />
            ) : trendData.length === 0 ? (
              <EmptyChart />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={trendData}
                  margin={{
                    top: 10,
                    right: 8,
                    left: -15,
                    bottom: 0,
                  }}
                >
                  <defs>
                    <linearGradient
                      id="incomeGradient"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="0%"
                        stopColor="#16a36a"
                        stopOpacity={0.24}
                      />
                      <stop
                        offset="100%"
                        stopColor="#16a36a"
                        stopOpacity={0}
                      />
                    </linearGradient>

                    <linearGradient
                      id="expenseGradient"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="0%"
                        stopColor="#ff7a7d"
                        stopOpacity={0.2}
                      />
                      <stop
                        offset="100%"
                        stopColor="#ff7a7d"
                        stopOpacity={0}
                      />
                    </linearGradient>
                  </defs>

                  <CartesianGrid
                    vertical={false}
                    stroke="#edf1ef"
                  />

                  <XAxis
                    dataKey="label"
                    tick={{
                      fill: "#91a09a",
                      fontSize: 11,
                    }}
                    tickLine={false}
                    axisLine={false}
                    minTickGap={45}
                  />

                  <YAxis
                    tick={{
                      fill: "#91a09a",
                      fontSize: 11,
                    }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) =>
                      formatCompactCurrency(value)
                    }
                  />

                  <Tooltip
                    contentStyle={{
                      borderRadius: 12,
                      border: "1px solid #e4ebe7",
                      boxShadow:
                        "0 10px 30px rgba(16,35,28,0.08)",
                    }}
                    formatter={(value, name) => [
                      formatCurrency(Number(value)),
                      name === "income"
                        ? "Income"
                        : "Expenses",
                    ]}
                    labelFormatter={(label) => label}
                  />

                  <Area
                    type="monotone"
                    dataKey="income"
                    stroke="#16a36a"
                    strokeWidth={2}
                    fill="url(#incomeGradient)"
                  />

                  <Area
                    type="monotone"
                    dataKey="expenses"
                    stroke="#ff7a7d"
                    strokeWidth={2}
                    fill="url(#expenseGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </section>

        {/* Monthly + categories */}
        <div className="mt-6 grid gap-6 xl:grid-cols-[1.45fr_1fr]">
          <section className="rounded-2xl border border-[#e4ebe7] bg-white p-5 shadow-[0_8px_30px_rgba(16,35,28,0.04)] sm:p-6">
            <div>
              <h2 className="text-[17px] font-bold tracking-[-0.02em] text-[#10231c]">
                Monthly spending
              </h2>

              <p className="mt-1 text-sm text-[#82908a]">
                Compare income and expenses month by month.
              </p>
            </div>

            <div className="mt-6 h-[300px]">
              {monthlyData.length === 0 ? (
                <EmptyChart />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={monthlyData}
                    margin={{
                      top: 10,
                      right: 8,
                      left: -15,
                      bottom: 0,
                    }}
                    barGap={8}
                  >
                    <CartesianGrid
                      vertical={false}
                      stroke="#edf1ef"
                    />

                    <XAxis
                      dataKey="month"
                      tick={{
                        fill: "#91a09a",
                        fontSize: 11,
                      }}
                      tickLine={false}
                      axisLine={false}
                    />

                    <YAxis
                      tick={{
                        fill: "#91a09a",
                        fontSize: 11,
                      }}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(value) =>
                        formatCompactCurrency(value)
                      }
                    />

                    <Tooltip
                      contentStyle={{
                        borderRadius: 12,
                        border: "1px solid #e4ebe7",
                        boxShadow:
                          "0 10px 30px rgba(16,35,28,0.08)",
                      }}
                      formatter={(value, name) => [
                        formatCurrency(Number(value)),
                        name === "income"
                          ? "Income"
                          : "Expenses",
                      ]}
                    />

                    <Bar
                      dataKey="income"
                      fill="#16a36a"
                      radius={[5, 5, 0, 0]}
                    />

                    <Bar
                      dataKey="expenses"
                      fill="#ff8b8e"
                      radius={[5, 5, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </section>

          <section className="rounded-2xl border border-[#e4ebe7] bg-white p-5 shadow-[0_8px_30px_rgba(16,35,28,0.04)] sm:p-6">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-[17px] font-bold tracking-[-0.02em] text-[#10231c]">
                  Spending by category
                </h2>

                <p className="mt-1 text-sm text-[#82908a]">
                  Where your money went.
                </p>
              </div>

              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#ecfdf5] text-[#16a36a]">
                <PieChartIcon className="h-4 w-4" />
              </div>
            </div>

            {categoryData.length === 0 ? (
              <div className="mt-10">
                <EmptyChart />
              </div>
            ) : (
              <>
                <div className="mt-5 h-[210px]">
                  <ResponsiveContainer
                    width="100%"
                    height="100%"
                  >
                    <PieChart>
                      <Pie
                        data={categoryData}
                        dataKey="amount"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={58}
                        outerRadius={88}
                        paddingAngle={3}
                        strokeWidth={0}
                      >
                        {categoryData.map((_, index) => (
                          <Cell
                            key={`category-${index}`}
                            fill={
                              [
                                "#16a36a",
                                "#4c8df6",
                                "#8b6cf6",
                                "#f4b740",
                                "#ff7a7d",
                              ][index % 5]
                            }
                          />
                        ))}
                      </Pie>

                      <Tooltip
                        formatter={(value) =>
                          formatCurrency(Number(value))
                        }
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="mt-2 space-y-3">
                  {topCategories.map((category, index) => (
                    <div
                      key={category.name}
                      className="flex items-center justify-between gap-4"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <span
                          className="h-2.5 w-2.5 shrink-0 rounded-full"
                          style={{
                            backgroundColor:
                              [
                                "#16a36a",
                                "#4c8df6",
                                "#8b6cf6",
                                "#f4b740",
                                "#ff7a7d",
                              ][index % 5],
                          }}
                        />

                        <span className="truncate text-sm font-medium text-[#40534b]">
                          {category.name}
                        </span>
                      </div>

                      <div className="shrink-0 text-right">
                        <p className="text-sm font-semibold text-[#10231c]">
                          {formatCurrency(category.amount)}
                        </p>

                        <p className="text-[11px] text-[#91a09a]">
                          {category.percentage.toFixed(1)}%
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </section>
        </div>

        {/* Top categories */}
        <section className="mt-6 rounded-2xl border border-[#e4ebe7] bg-white p-5 shadow-[0_8px_30px_rgba(16,35,28,0.04)] sm:p-6">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#f1f8f4] text-[#078653]">
              <CircleDollarSign className="h-5 w-5" />
            </div>

            <div>
              <h2 className="text-[17px] font-bold tracking-[-0.02em] text-[#10231c]">
                Top spending categories
              </h2>

              <p className="mt-1 text-sm text-[#82908a]">
                Your biggest expense areas during this period.
              </p>
            </div>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
            {topCategories.length === 0 ? (
              <div className="rounded-xl bg-[#f7faf8] p-5 text-sm text-[#82908a] xl:col-span-5">
                No expense data for this period yet.
              </div>
            ) : (
              topCategories.map((category, index) => (
                <div
                  key={category.name}
                  className="rounded-xl border border-[#edf1ef] bg-[#fbfcfb] p-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-xs font-semibold text-[#91a09a]">
                      #{index + 1}
                    </span>

                    <span className="rounded-full bg-[#ecfdf5] px-2 py-1 text-[10px] font-semibold text-[#078653]">
                      {category.percentage.toFixed(1)}%
                    </span>
                  </div>

                  <p className="mt-4 truncate text-sm font-semibold text-[#30453c]">
                    {category.name}
                  </p>

                  <p className="mt-1 text-lg font-bold tracking-[-0.02em] text-[#10231c]">
                    {formatCurrency(category.amount)}
                  </p>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  icon,
  iconClass,
  valueClass = "text-[#10231c]",
  description,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  iconClass: string;
  valueClass?: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-[#e4ebe7] bg-white p-5 shadow-[0_8px_30px_rgba(16,35,28,0.035)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-medium text-[#82908a]">
            {label}
          </p>

          <p className={`mt-2 text-[24px] font-bold tracking-[-0.04em] ${valueClass}`}>
            {value}
          </p>
        </div>

        <div
          className={`flex h-10 w-10 items-center justify-center rounded-xl ${iconClass}`}
        >
          {icon}
        </div>
      </div>

      <p className="mt-4 text-[11px] font-medium text-[#a0ada7]">
        {description}
      </p>
    </div>
  );
}

function ChartSkeleton() {
  return (
    <div className="flex h-full items-end gap-3 px-2 pb-8">
      {Array.from({ length: 18 }).map((_, index) => (
        <div
          key={index}
          className="flex-1 animate-pulse rounded-t-lg bg-[#edf3ef]"
          style={{
            height: `${25 + ((index * 17) % 60)}%`,
          }}
        />
      ))}
    </div>
  );
}

function EmptyChart() {
  return (
    <div className="flex h-full min-h-[180px] items-center justify-center rounded-xl bg-[#f8faf9]">
      <div className="text-center">
        <p className="text-sm font-semibold text-[#60736b]">
          No data yet
        </p>

        <p className="mt-1 text-xs text-[#a0ada7]">
          Add some transactions to see your report.
        </p>
      </div>
    </div>
  );
}
