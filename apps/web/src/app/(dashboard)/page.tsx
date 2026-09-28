import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { SummaryCards } from "../components/dashboard/summary-cards";
import { ExpenseBreakdown } from "../components/dashboard/expense-breakdown";
import { RecentTransactions } from "../components/dashboard/recent-transactions";
import { FinancialGoals } from "../components/dashboard/financial-goals";
import { RightRail } from "../components/dashboard/right-rail";
import { CashFlowSection } from "../components/dashboard/cash-flow-section";
import { GettingStarted } from "../components/dashboard/getting-started";
import { buildExpenseBreakdown } from "../../lib/dashboard";

type Transaction = {
  id: string;
  amount: string;
  type: "income" | "expense";
  description: string | null;
  transactionDate: string;
  categoryName: string;
};

type Goal = {
  id: string;
  name: string;
  description: string | null;
  targetAmount: string;
  targetDate: string | null;
  currentAmount: number;
  remainingAmount: number;
  progressPercentage: number;
  isCompleted: boolean;
};

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

type NetWorthData = {
  live: {
    totalAssets: number;
    totalLiabilities: number;
    netWorth: number;
  };
};

type Budget = { id: string };

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

async function apiRequest<T>(path: string, token: string): Promise<T | null> {
  try {
    const response = await fetch(`${BASE_URL}/api${path}`, {
      cache: "no-store",
      headers: {
        Cookie: `wealthly_token=${token}`,
      },
    });

    if (!response.ok) {
      console.error(`API failed for ${path}: ${response.status}`);
      return null;
    }

    return response.json();
  } catch (error) {
    console.error(`API request failed for ${path}:`, error);
    return null;
  }
}

export default async function Home() {
  const cookieStore = await cookies();
  const token = cookieStore.get("wealthly_token")?.value;

  if (!token) {
    redirect("/login");
  }

  const [dashboardResult, transactionsResult, goalsResult, budgetsResult, cashFlowResult, netWorthResult] = await Promise.all([
    apiRequest<DashboardData>("/dashboard", token),
    apiRequest<Transaction[]>("/transactions", token),
    apiRequest<Goal[]>("/goals", token),
    apiRequest<Budget[]>("/budgets", token),
    apiRequest<{ date: string; income: number; expenses: number }[]>("/dashboard/cash-flow?range=30d", token),
    apiRequest<NetWorthData>("/net-worth", token),
  ]);

  const dashboard: DashboardData = dashboardResult || {
    accounts: { totalBalance: 0, count: 0 },
    transactions: { income: 0, expenses: 0, net: 0, count: 0 },
    goals: { totalTarget: 0, totalSaved: 0, remaining: 0, progressPercentage: 0, count: 0 },
  };

  const transactions: Transaction[] = transactionsResult || [];
  const goals: Goal[] = goalsResult || [];
  const budgets: Budget[] = budgetsResult || [];
  const netWorth = netWorthResult?.live ?? { totalAssets: 0, totalLiabilities: 0, netWorth: 0 };

  const cashFlowData = cashFlowResult ?? [];
  const expenseBreakdown = buildExpenseBreakdown(transactions);

  return (
      <div className="min-h-screen bg-[var(--background)]">
        <main className="flex-1 px-4 py-5 sm:px-6 sm:py-6 lg:px-8">
          <div className="mx-auto max-w-[1480px]">
            <div>
              <p className="text-sm font-medium text-[var(--accent)]">
                Personal Finance
              </p>

              <h1 className="mt-1 text-[28px] font-bold tracking-[-0.04em] text-[var(--text-primary)] sm:text-3xl">
                Welcome back!
              </h1>

              <p className="mt-1.5 text-sm text-[var(--text-secondary)] sm:text-base">
                Here&apos;s your financial snapshot for today.
              </p>
            </div>

            <GettingStarted
              hasAccount={dashboard.accounts.count > 0}
              hasTransaction={transactions.length > 0}
              hasBudget={budgets.length > 0}
              hasGoal={goals.length > 0}
            />

            <div className="mt-6 sm:mt-8">
              <div className="flex items-start gap-6">
                <div className="min-w-0 flex-1">
                  <SummaryCards dashboard={dashboard} netWorth={netWorth} />

                  <div className="mt-6 grid gap-6 xl:grid-cols-[1.6fr_1fr]">
                    <CashFlowSection initialData={cashFlowData} />
                    <ExpenseBreakdown data={expenseBreakdown} />
                  </div>

                  <div className="mt-6 grid gap-6 xl:grid-cols-[1.4fr_1fr]">
                    <RecentTransactions transactions={transactions} />
                    <FinancialGoals goals={goals} />
                  </div>
                </div>

                <div className="hidden w-[270px] shrink-0 xl:block">
                  <RightRail />
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
  );
}
