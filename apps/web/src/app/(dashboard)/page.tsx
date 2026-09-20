import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { SummaryCards } from "../components/dashboard/summary-cards";
import { ExpenseBreakdown } from "../components/dashboard/expense-breakdown";
import { RecentTransactions } from "../components/dashboard/recent-transactions";
import { FinancialGoals } from "../components/dashboard/financial-goals";
import { RightRail } from "../components/dashboard/right-rail";
import { CashFlowSection } from "../components/dashboard/cash-flow-section";

const API_URL = "http://localhost:4000";

type Transaction = {
  id: string;
  amount: string;
  type: "income" | "expense";
  transactionDate: string;
  categoryName: string;
};

function buildCashFlowData(
  transactions: Transaction[]
) {
  const grouped = new Map<
    string,
    {
      date: string;
      income: number;
      expenses: number;
    }
  >();

  for (const transaction of transactions) {
    const date = new Date(
      transaction.transactionDate
    ).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
    });

    const existing = grouped.get(date) ?? {
      date,
      income: 0,
      expenses: 0,
    };

    if (transaction.type === "income") {
      existing.income += Number(
        transaction.amount
      );
    } else {
      existing.expenses += Number(
        transaction.amount
      );
    }

    grouped.set(date, existing);
  }

  return Array.from(grouped.values());
}

function buildExpenseBreakdown(
  transactions: Transaction[]
) {
  const grouped = new Map<string, number>();

  for (const transaction of transactions) {
    if (transaction.type !== "expense") {
      continue;
    }

    const category =
      transaction.categoryName;

    grouped.set(
      category,
      (grouped.get(category) ?? 0) +
        Number(transaction.amount)
    );
  }

  return Array.from(grouped.entries()).map(
    ([name, amount]) => ({
      name,
      amount,
    })
  );
}

async function authenticatedFetch(
  path: string
) {
  const cookieStore = await cookies();

  const token =
    cookieStore.get(
      "wealthly_token"
    )?.value;

  if (!token) {
    redirect("/login");
  }

  return fetch(`${API_URL}${path}`, {
    cache: "no-store",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

async function getDashboard() {
  const response =
    await authenticatedFetch(
      "/dashboard"
    );

  if (!response.ok) {
    if (response.status === 401) {
      redirect("/login");
    }

    throw new Error(
      "Failed to load dashboard"
    );
  }

  return response.json();
}

async function getTransactions() {
  const response =
    await authenticatedFetch(
      "/transactions"
    );

  if (!response.ok) {
    if (response.status === 401) {
      redirect("/login");
    }

    throw new Error(
      "Failed to load transactions"
    );
  }

  return response.json();
}

async function getGoals() {
  const response =
    await authenticatedFetch("/goals");

  if (!response.ok) {
    if (response.status === 401) {
      redirect("/login");
    }

    throw new Error(
      "Failed to load goals"
    );
  }

  return response.json();
}

export default async function Home() {
  const [
    dashboard,
    transactions,
    goals,
  ] = await Promise.all([
    getDashboard(),
    getTransactions(),
    getGoals(),
  ]);

  const cashFlowData =
    buildCashFlowData(transactions);

  const expenseBreakdown =
    buildExpenseBreakdown(
      transactions
    );

  return (
    <div className="min-h-screen bg-[#f7faf8]">
      <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-[1480px]">
          <div>
            <p className="text-sm font-medium text-emerald-700">
              Personal Finance
            </p>

            <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Good morning, Jeyaprakash!
            </h1>

            <p className="mt-2 text-base text-slate-500">
              Here's your financial snapshot
              for today.
            </p>
          </div>

          <div className="mt-8">
            <div className="flex items-start gap-6">
              <div className="min-w-0 flex-1">
                <SummaryCards
                  dashboard={dashboard}
                />

                <div className="mt-6 grid gap-6 xl:grid-cols-[1.6fr_1fr]">
                  <CashFlowSection
                    initialData={cashFlowData}
                  />

                  <ExpenseBreakdown
                    data={expenseBreakdown}
                  />
                </div>

                <div className="mt-6 grid gap-6 xl:grid-cols-[1.4fr_1fr]">
                  <RecentTransactions
                    transactions={transactions}
                  />

                  <FinancialGoals
                    goals={goals}
                  />
                </div>
              </div>

              <div className="hidden w-[270px] shrink-0 xl:block">
                <RightRail
                  transactions={transactions}
                />
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}