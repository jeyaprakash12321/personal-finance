"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type CashFlowPoint = {
  date: string;
  income: number;
  expenses: number;
};

type Range = "30d" | "90d" | "1y";

type CashFlowChartProps = {
  data: CashFlowPoint[];
  range: Range;
  onRangeChange: (range: Range) => void;
};

const ranges: { label: string; value: Range }[] = [
  { label: "30D", value: "30d" },
  { label: "90D", value: "90d" },
  { label: "1Y", value: "1y" },
];

function formatDate(date: string) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
  }).format(new Date(`${date}T00:00:00`));
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{
    dataKey?: string;
    value?: number;
  }>;
  label?: string;
}) {
  if (!active || !payload?.length) {
    return null;
  }

  const income =
    payload.find((item) => item.dataKey === "income")?.value ?? 0;

  const expenses =
    payload.find((item) => item.dataKey === "expenses")?.value ?? 0;

  return (
    <div className="rounded-xl border border-[#e4ebe7] bg-white px-4 py-3 shadow-[0_10px_30px_rgba(16,35,28,0.10)]">
      <p className="mb-2 text-xs font-medium text-[#60736b]">
        {label ? formatDate(label) : ""}
      </p>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between gap-6">
          <span className="text-xs text-[#60736b]">Income</span>
          <span className="text-sm font-semibold text-[#078653]">
            {formatCurrency(Number(income))}
          </span>
        </div>

        <div className="flex items-center justify-between gap-6">
          <span className="text-xs text-[#60736b]">Expenses</span>
          <span className="text-sm font-semibold text-[#ff5b5f]">
            {formatCurrency(Number(expenses))}
          </span>
        </div>
      </div>
    </div>
  );
}

export function CashFlowChart({
  data,
  range,
  onRangeChange,
}: CashFlowChartProps) {
  return (
    <div className="rounded-2xl border border-[#e4ebe7] bg-white p-5 shadow-[0_8px_30px_rgba(16,35,28,0.04)]">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#91a09a]">
            Overview
          </p>

          <h2 className="mt-1 text-lg font-semibold tracking-tight text-[#10231c]">
            Cash Flow
          </h2>

          <p className="mt-1 text-sm text-[#60736b]">
            Income vs expenses over time
          </p>
        </div>

        {/* Range selector */}
        <div className="flex w-fit items-center rounded-xl bg-[#f1f8f4] p-1">
          {ranges.map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() =>
                onRangeChange(
                  item.value as "30d" | "90d" | "1y"
                )
              }
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                range === item.value
                  ? "bg-white text-[#078653] shadow-sm"
                  : "text-[#60736b] hover:text-[#10231c]"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Chart */}
      <div className="mt-6 h-[300px]">
        {data.length === 0 ? (
          <div className="flex h-full items-center justify-center rounded-xl bg-[#f7faf8]">
            <div className="text-center">
              <p className="text-sm font-medium text-[#10231c]">
                No cash flow data yet
              </p>

              <p className="mt-1 text-xs text-[#91a09a]">
                Add some transactions to see your cash flow.
              </p>
            </div>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={data}
              margin={{
                top: 10,
                right: 5,
                left: 0,
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
                    stopOpacity={0.25}
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
                    stopColor="#ff5b5f"
                    stopOpacity={0.2}
                  />
                  <stop
                    offset="100%"
                    stopColor="#ff5b5f"
                    stopOpacity={0}
                  />
                </linearGradient>
              </defs>

              <CartesianGrid
                vertical={false}
                stroke="#edf2ef"
                strokeDasharray="4 4"
              />

              <XAxis
                dataKey="date"
                tickFormatter={formatDate}
                axisLine={false}
                tickLine={false}
                tick={{
                  fill: "#91a09a",
                  fontSize: 11,
                }}
                tickMargin={10}
              />

              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{
                  fill: "#91a09a",
                  fontSize: 11,
                }}
                tickFormatter={(value) => `₹${value}`}
                width={55}
              />

              <Tooltip
                content={<CustomTooltip />}
                cursor={{
                  stroke: "#d9f7e9",
                  strokeWidth: 1,
                }}
              />

              <Area
                type="monotone"
                dataKey="income"
                stroke="#16a36a"
                strokeWidth={2.5}
                fill="url(#incomeGradient)"
                dot={false}
                activeDot={{
                  r: 4,
                  strokeWidth: 2,
                  stroke: "#ffffff",
                }}
              />

              <Area
                type="monotone"
                dataKey="expenses"
                stroke="#ff5b5f"
                strokeWidth={2.5}
                fill="url(#expenseGradient)"
                dot={false}
                activeDot={{
                  r: 4,
                  strokeWidth: 2,
                  stroke: "#ffffff",
                }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Legend */}
      <div className="mt-4 flex items-center gap-5 border-t border-[#eef2ef] pt-4">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-[#16a36a]" />
          <span className="text-xs font-medium text-[#60736b]">
            Income
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-[#ff5b5f]" />
          <span className="text-xs font-medium text-[#60736b]">
            Expenses
          </span>
        </div>
      </div>
    </div>
  );
}