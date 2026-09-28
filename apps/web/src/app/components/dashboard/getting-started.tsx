import Link from "next/link";
import { ArrowRight, CheckCircle2, Circle } from "lucide-react";

type GettingStartedProps = {
  hasAccount: boolean;
  hasTransaction: boolean;
  hasBudget: boolean;
  hasGoal: boolean;
};

const steps = [
  { key: "hasAccount", label: "Add an account", href: "/accounts" },
  { key: "hasTransaction", label: "Record your first transaction", href: "/transactions" },
  { key: "hasBudget", label: "Set a monthly budget", href: "/budgets" },
  { key: "hasGoal", label: "Create a financial goal", href: "/goals" },
] as const;

export function GettingStarted({ hasAccount, hasTransaction, hasBudget, hasGoal }: GettingStartedProps) {
  const progress = [hasAccount, hasTransaction, hasBudget, hasGoal];
  const completed = progress.filter(Boolean).length;

  if (completed === steps.length) return null;

  const state: Record<(typeof steps)[number]["key"], boolean> = {
    hasAccount,
    hasTransaction,
    hasBudget,
    hasGoal,
  };

  return (
    <section className="mt-6 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-card)] sm:p-6" aria-labelledby="getting-started-title">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--accent)]">Getting started</p>
          <h2 id="getting-started-title" className="mt-1 text-lg font-bold text-[var(--text-primary)]">Build your money picture</h2>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">Complete these steps to make your dashboard useful.</p>
        </div>
        <span className="text-sm font-semibold text-[var(--text-secondary)]">{completed} of {steps.length} complete</span>
      </div>
      <div className="mt-5 grid gap-2 sm:grid-cols-2">
        {steps.map((step) => {
          const complete = state[step.key];
          return (
            <Link
              key={step.key}
              href={step.href}
              className="group flex items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface-subtle)] px-3 py-3 transition hover:border-[var(--accent)] hover:bg-[var(--accent-soft)]"
            >
              {complete ? <CheckCircle2 className="h-5 w-5 shrink-0 text-[var(--accent)]" aria-hidden="true" /> : <Circle className="h-5 w-5 shrink-0 text-[var(--text-muted)]" aria-hidden="true" />}
              <span className={`min-w-0 flex-1 text-sm font-medium ${complete ? "text-[var(--text-secondary)] line-through" : "text-[var(--text-primary)]"}`}>{step.label}</span>
              {!complete && <ArrowRight className="h-4 w-4 shrink-0 text-[var(--text-muted)] transition group-hover:translate-x-0.5 group-hover:text-[var(--accent)]" aria-hidden="true" />}
            </Link>
          );
        })}
      </div>
    </section>
  );
}
