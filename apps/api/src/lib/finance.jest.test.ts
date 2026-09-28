import {
  calculateBudgetStatus,
  calculateCreditUtilization,
  calculateGoalProgress,
  calculateNetWorth,
  fromCents,
  toCents,
} from "./finance";

describe("financial calculations", () => {
  it("preserves decimal cents and rejects invalid precision", () => {
    expect(toCents("10.05")).toBe(1005n);
    expect(fromCents(-5n)).toBe("-0.05");
    expect(() => toCents("10.005")).toThrow();
    expect(() => toCents("-1")).toThrow();
  });

  it.each([
    ["0", "0", 0],
    ["100", "0", 0],
    ["100", "50", 50],
    ["100", "100", 100],
    ["100", "125", 125],
  ])("calculates budget usage %s/%s", (budget, spent, percentage) => {
    expect(calculateBudgetStatus(budget, spent).percentage).toBe(percentage);
  });

  it("treats non-zero spending against a zero budget as fully used", () => {
    expect(calculateBudgetStatus("0", "1").percentage).toBe(100);
  });

  it("calculates goal progress including overfunding", () => {
    expect(calculateGoalProgress("1000", "1250.50")).toEqual({
      saved: "1250.50",
      remaining: "-250.50",
      percentage: 125.05,
    });
    expect(calculateGoalProgress("0", "100").percentage).toBe(0);
  });

  it("calculates positive, negative, and empty net worth", () => {
    expect(calculateNetWorth(["100.10", "0.20"], ["25.05"]).netWorth).toBe("75.25");
    expect(calculateNetWorth([], []).netWorth).toBe("0.00");
    expect(calculateNetWorth(["10"], ["25"]).netWorth).toBe("-15.00");
  });

  it.each([["0", "100", 0], ["25", "100", 25], ["100", "100", 100], ["125", "100", 125]])(
    "calculates credit utilization",
    (outstanding, limit, percentage) => {
      expect(calculateCreditUtilization(outstanding, limit)).toBe(percentage);
    },
  );

  it("formats a negative remaining budget", () => {
    expect(calculateBudgetStatus("10", "12.34").remaining).toBe("-2.34");
  });
});
