"use client";

import { useEffect, useState } from "react";

import { CashFlowChart } from "./cash-flow-chart";

type CashFlowPoint = {
  date: string;
  income: number;
  expenses: number;
};

type Range = "30d" | "90d" | "1y";

export function CashFlowSection({
  initialData,
}: {
  initialData: CashFlowPoint[];
}) {
  const [range, setRange] =
    useState<Range>("30d");

  const [data, setData] =
    useState<CashFlowPoint[]>(initialData);

  const [loading, setLoading] =
    useState(false);

  useEffect(() => {
    if (range === "30d") {
      queueMicrotask(() => setData(initialData));
      return;
    }

    async function loadCashFlow() {
      setLoading(true);

      try {
        const response = await fetch(
          `/api/dashboard/cash-flow?range=${range}`
        );

        if (!response.ok) {
          throw new Error(
            "Failed to load cash flow"
          );
        }

        const result = await response.json();

        setData(result);
      } catch (error) {
        console.error(
          "Failed to load cash flow:",
          error
        );
      } finally {
        setLoading(false);
      }
    }

    loadCashFlow();
  }, [range, initialData]);

  return (
    <div className="relative">
      <CashFlowChart
        data={data}
        range={range}
        onRangeChange={setRange}
      />

      {loading && (
        <div className="absolute right-4 top-4 rounded-lg bg-[#10231c] px-3 py-1.5 text-[10px] font-medium text-white shadow-lg">
          Updating...
        </div>
      )}
    </div>
  );
}
