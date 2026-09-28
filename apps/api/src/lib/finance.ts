/** Exact cent-based helpers for financial calculations. */
export function toCents(value: string | number): bigint {
  const text = String(value).trim();
  if (!/^\d+(?:\.\d{1,2})?$/.test(text)) {
    throw new Error("Money values must be non-negative decimals with at most two fractional digits.");
  }

  const [whole, fraction = ""] = text.split(".");
  return BigInt(whole) * 100n + BigInt(fraction.padEnd(2, "0"));
}

export function fromCents(cents: bigint): string {
  const sign = cents < 0n ? "-" : "";
  const absolute = cents < 0n ? -cents : cents;
  return `${sign}${absolute / 100n}.${(absolute % 100n).toString().padStart(2, "0")}`;
}

export function calculateBudgetStatus(
  budget: string | number,
  spent: string | number,
) {
  const budgetCents = toCents(budget);
  const spentCents = toCents(spent);

  return {
    budget: fromCents(budgetCents),
    spent: fromCents(spentCents),
    remaining: fromCents(budgetCents - spentCents),
    percentage: budgetCents === 0n
      ? spentCents === 0n ? 0 : 100
      : Number((spentCents * 10000n) / budgetCents) / 100,
  };
}

export function calculateGoalProgress(
  target: string | number,
  saved: string | number,
) {
  const targetCents = toCents(target);
  const savedCents = toCents(saved);

  return {
    saved: fromCents(savedCents),
    remaining: fromCents(targetCents - savedCents),
    percentage: targetCents === 0n ? 0 : Number((savedCents * 10000n) / targetCents) / 100,
  };
}

export function calculateNetWorth(
  assets: Array<string | number>,
  liabilities: Array<string | number>,
) {
  const totalAssets = assets.reduce((sum, value) => sum + toCents(value), 0n);
  const totalLiabilities = liabilities.reduce((sum, value) => sum + toCents(value), 0n);

  return {
    assets: fromCents(totalAssets),
    liabilities: fromCents(totalLiabilities),
    netWorth: fromCents(totalAssets - totalLiabilities),
  };
}

export function calculateCreditUtilization(
  outstanding: string | number,
  limit: string | number,
) {
  const outstandingCents = toCents(outstanding);
  const limitCents = toCents(limit);
  return limitCents === 0n ? 0 : Number((outstandingCents * 10000n) / limitCents) / 100;
}
