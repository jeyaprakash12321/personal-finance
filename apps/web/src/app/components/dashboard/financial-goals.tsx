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
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">
            Financial Goals
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Track your progress
          </p>
        </div>

        <button className="text-sm font-medium text-emerald-600 hover:text-emerald-700">
          View all
        </button>
      </div>

      <div className="mt-6 space-y-6">
        {goals.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-sm text-slate-400">
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
                    <h3 className="truncate text-sm font-semibold text-slate-900">
                      {goal.name}
                    </h3>

                    <p className="mt-1 text-xs text-slate-400">
                      Target: {formatDate(goal.targetDate)}
                    </p>
                  </div>

                  <span className="shrink-0 text-sm font-semibold text-emerald-600">
                    {progress}%
                  </span>
                </div>

                <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-emerald-500 transition-all"
                    style={{
                      width: `${progress}%`,
                    }}
                  />
                </div>

                <div className="mt-2 flex items-center justify-between text-xs">
                  <span className="text-slate-500">
                    {formatCurrency(goal.currentAmount)} saved
                  </span>

                  <span className="text-slate-400">
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