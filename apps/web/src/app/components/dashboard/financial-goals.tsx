import Link from "next/link";

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

function formatCurrency(amount: number) {
  return `₹${amount.toLocaleString("en-IN")}`;
}

function formatDate(date: string | null) {
  if (!date) {
    return "No target date";
  }

  return new Date(date).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function FinancialGoals({
  goals,
}: {
  goals: Goal[];
}) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] p-6 shadow-[var(--shadow-sm)]">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">
            Financial Goals
          </h2>

          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            Track your progress
          </p>
        </div>

        <Link
          href="/goals"
          className="text-sm font-medium text-[var(--accent)] hover:text-[var(--accent-hover)]"
        >
          View all
        </Link>
      </div>

      <div className="mt-6 space-y-6">
        {goals.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-sm text-[var(--text-muted)]">
              No financial goals yet
            </p>
          </div>
        ) : (
          goals.slice(0, 3).map((goal) => {
            const progress = Math.min(
              Math.max(goal.progressPercentage, 0),
              100
            );

            return (
              <div key={goal.id}>
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <h3 className="truncate text-sm font-semibold text-[var(--text-primary)]">
                      {goal.name}
                    </h3>

                    <p className="mt-1 text-xs text-[var(--text-muted)]">
                      Target: {formatDate(goal.targetDate)}
                    </p>
                  </div>

                  <span className="shrink-0 text-sm font-semibold text-[var(--accent)]">
                    {Math.round(progress)}%
                  </span>
                </div>

                <div className="mt-3 h-2 overflow-hidden rounded-full bg-[var(--surface-muted)]">
                  <div
                    className="h-full rounded-full bg-[var(--accent)] transition-all"
                    style={{
                      width: `${progress}%`,
                    }}
                  />
                </div>

                <div className="mt-2 flex items-center justify-between text-xs">
                  <span className="text-[var(--text-secondary)]">
                    {formatCurrency(goal.currentAmount)} saved
                  </span>

                  <span className="text-[var(--text-muted)]">
                    {formatCurrency(
                      Number(goal.targetAmount)
                    )} target
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
