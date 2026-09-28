import { buildExpenseBreakdown, summarizeTransactions } from "./dashboard";

describe("dashboard aggregation", () => {
  it("totals valid income and expense transactions and ignores invalid amounts", () => {
    expect(summarizeTransactions([
      { amount: "100.10", type: "income" },
      { amount: "33.35", type: "expense" },
      { amount: "bad", type: "expense" },
      { amount: "-1", type: "income" },
    ])).toEqual({ income: 100.1, expenses: 33.35, net: 66.75, count: 2 });
  });

  it("groups, labels, and sorts expense categories", () => {
    expect(buildExpenseBreakdown([
      { amount: "20", type: "expense", categoryName: "Food" },
      { amount: "10", type: "expense", categoryName: "Food" },
      { amount: "40", type: "expense", categoryName: null },
      { amount: "100", type: "income", categoryName: "Salary" },
    ])).toEqual([
      { name: "Uncategorized", amount: 40 },
      { name: "Food", amount: 30 },
    ]);
  });

  it("ignores invalid expense amounts in the breakdown", () => {
    expect(buildExpenseBreakdown([
      { amount: "bad", type: "expense", categoryName: "Food" },
      { amount: "-10", type: "expense", categoryName: "Food" },
      { amount: "15", type: "expense", categoryName: "Food" },
    ])).toEqual([{ name: "Food", amount: 15 }]);
  });
});
