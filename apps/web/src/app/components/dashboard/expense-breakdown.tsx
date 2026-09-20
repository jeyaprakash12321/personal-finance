"use client";

import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

type ExpenseItem = {
  name: string;
  amount: number;
};

const CATEGORY_COLORS = [
  "#16a36a",
  "#4c8df6",
  "#8b6cf6",
  "#ff8a4c",
  "#ff5b5f",
  "#14b8a6",
];

function formatCurrency(value: number) {
  return `₹${value.toLocaleString("en-IN")}`;
}

export function ExpenseBreakdown({
  data,
}: {
  data: ExpenseItem[];
}) {
  const total = data.reduce(
    (sum, item) => sum + item.amount,
    0
  );

  return (
    <div className="rounded-2xl border border-[#e5ece8] bg-white p-5 shadow-[0_8px_30px_rgba(16,35,28,0.04)] sm:p-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#078653]">
            Spending
          </p>

          <h2 className="mt-1 text-[20px] font-bold tracking-[-0.035em] text-[#10231c]">
            Expense Breakdown
          </h2>

          <p className="mt-1 text-[12px] text-[#81918a]">
            See where your money goes
          </p>
        </div>

        <button className="rounded-lg px-2 py-1 text-[11px] font-medium text-[#078653] hover:bg-[#f1f8f4]">
          Details
        </button>
      </div>

      {data.length === 0 ? (
        <div className="mt-6 flex h-[280px] items-center justify-center rounded-xl bg-[#f8faf9]">
          <div className="text-center">
            <p className="text-sm font-medium text-[#50665c]">
              No expenses yet
            </p>

            <p className="mt-1 text-xs text-[#91a09a]">
              Add an expense to see your breakdown.
            </p>
          </div>
        </div>
      ) : (
        <>
          {/* Donut */}
          <div className="relative mt-2 h-[235px]">
            <ResponsiveContainer
              width="100%"
              height="100%"
            >
              <PieChart>
                <Pie
                  data={data}
                  dataKey="amount"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={67}
                  outerRadius={94}
                  paddingAngle={4}
                  stroke="none"
                >
                  {data.map((item, index) => (
                    <Cell
                      key={item.name}
                      fill={
                        CATEGORY_COLORS[
                          index % CATEGORY_COLORS.length
                        ]
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

            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <p className="text-[10px] uppercase tracking-wide text-[#91a09a]">
                  Total spent
                </p>

                <p className="mt-1 text-[22px] font-bold tracking-[-0.04em] text-[#10231c]">
                  {formatCurrency(total)}
                </p>
              </div>
            </div>
          </div>

          {/* Categories */}
          <div className="space-y-3 border-t border-[#edf1ef] pt-4">
            {data.map((item, index) => {
              const percentage =
                total > 0
                  ? Math.round(
                      (item.amount / total) * 100
                    )
                  : 0;

              const color =
                CATEGORY_COLORS[
                  index % CATEGORY_COLORS.length
                ];

              return (
                <div
                  key={item.name}
                  className="flex items-center justify-between"
                >
                  <div className="flex min-w-0 items-center gap-2.5">
                    <span
                      className="h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{
                        backgroundColor: color,
                      }}
                    />

                    <span className="truncate text-[12px] font-medium text-[#50665c]">
                      {item.name}
                    </span>
                  </div>

                  <div className="flex shrink-0 items-center gap-3">
                    <span className="text-[12px] font-semibold text-[#30463d]">
                      {formatCurrency(item.amount)}
                    </span>

                    <span className="w-8 text-right text-[10px] text-[#91a09a]">
                      {percentage}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}