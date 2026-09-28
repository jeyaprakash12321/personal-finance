"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useConfirmDialog } from "../../components/ui/dialog-provider";

type Goal = {
  id: string;
  name: string;
  targetAmount: string;
  currentAmount: string;
  targetDate: string | null;
  description: string | null;
  createdAt?: string;
};

type GoalsClientProps = {
  goals: Goal[];
};

const nowForUi = Date.now();

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(value: string | null) {
  if (!value) return "No target date";

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function getProgress(current: number, target: number) {
  if (target <= 0) return 0;
  return Math.min(100, Math.round((current / target) * 100));
}

export function GoalsClient({ goals }: GoalsClientProps) {
  const router = useRouter();
  const { confirm } = useConfirmDialog();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const [showContributionModal, setShowContributionModal] = useState(false);

  const [showEditModal, setShowEditModal] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);

  const [name, setName] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [description, setDescription] = useState("");

  const [editName, setEditName] = useState("");
  const [editTargetAmount, setEditTargetAmount] = useState("");
  const [editTargetDate, setEditTargetDate] = useState("");
  const [editDescription, setEditDescription] = useState("");

  const [contributionAmount, setContributionAmount] = useState("");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function openEditModal(goal: Goal) {
    setEditingGoal(goal);
    setEditName(goal.name);
    setEditTargetAmount(goal.targetAmount);
    setEditTargetDate(goal.targetDate ? new Date(goal.targetDate).toISOString().slice(0, 10) : "");
    setEditDescription(goal.description || "");
    setError("");
    setShowEditModal(true);
  }

  function closeEditModal() {
    if (saving) return;
    setShowEditModal(false);
    setEditingGoal(null);
    setError("");
  }

  async function handleUpdateGoal(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editingGoal) return;

    const amount = Number(editTargetAmount);
    if (!editName.trim()) {
      setError("Please enter a goal name.");
      return;
    }
    if (!Number.isFinite(amount) || amount <= 0) {
      setError("Please enter a valid target amount.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const response = await fetch(`/api/goals/${editingGoal.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editName.trim(),
          targetAmount: amount.toFixed(2),
          targetDate: editTargetDate ? new Date(`${editTargetDate}T23:59:59`).toISOString() : null,
          description: editDescription.trim() || null,
        }),
      });

      const data = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(data?.message || "Failed to update goal");
      }

      closeEditModal();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update goal");
    } finally {
      setSaving(false);
    }
  }

  const totalTarget = useMemo(
    () =>
      goals.reduce(
        (total, goal) => total + Number(goal.targetAmount || 0),
        0,
      ),
    [goals],
  );

  const totalSaved = useMemo(
    () =>
      goals.reduce(
        (total, goal) => total + Number(goal.currentAmount || 0),
        0,
      ),
    [goals],
  );

  function resetCreateForm() {
    setName("");
    setTargetAmount("");
    setTargetDate("");
    setDescription("");
    setError("");
  }

  function openCreateModal() {
    resetCreateForm();
    setShowCreateModal(true);
  }

  function closeCreateModal() {
    if (saving) return;
    setShowCreateModal(false);
    resetCreateForm();
  }

  function openContributionModal(goal: Goal) {
    setSelectedGoal(goal);
    setContributionAmount("");
    setError("");
    setShowContributionModal(true);
  }

  function closeContributionModal() {
    if (saving) return;
    setSelectedGoal(null);
    setContributionAmount("");
    setError("");
    setShowContributionModal(false);
  }

  async function handleCreateGoal(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const amount = Number(targetAmount);

    if (!name.trim()) {
      setError("Please enter a goal name.");
      return;
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      setError("Please enter a valid target amount.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const response = await fetch("/api/goals", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name.trim(),
          targetAmount: amount.toFixed(2),
          targetDate: targetDate
            ? new Date(`${targetDate}T23:59:59`).toISOString()
            : null,
          description: description.trim() || null,
        }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.message || "Failed to create goal");
      }

      closeCreateModal();
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to create goal",
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleContribution(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedGoal) return;

    const amount = Number(contributionAmount);

    if (!Number.isFinite(amount) || amount <= 0) {
      setError("Please enter a valid contribution amount.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const response = await fetch("/api/goal-contributions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          goalId: selectedGoal.id,
          amount: Number(contributionAmount).toFixed(2),
          contributionDate: new Date().toISOString(),
        }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          data?.message || "Failed to add contribution",
        );
      }

      closeContributionModal();
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to add contribution",
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteGoal(goal: Goal) {
    const confirmed = await confirm({ title: "Delete goal?", description: `"${goal.name}" and its contribution history will be permanently removed.`, confirmLabel: "Delete goal", destructive: true });

    if (!confirmed) return;

    setSaving(true);
    setError("");

    try {
      const response = await fetch(`/api/goals/${goal.id}`, {
        method: "DELETE",
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.message || "Failed to delete goal");
      }

      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to delete goal",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <div className="min-h-screen bg-[var(--background)] px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-[1400px]">
          {/* Header */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--accent)]">
                Financial Goals
              </p>
              <h1 className="mt-1 text-[26px] font-bold tracking-[-0.04em] text-[var(--text-primary)] sm:text-[30px]">
                Build the future you want.
              </h1>
              <p className="mt-1.5 max-w-2xl text-sm leading-6 text-[var(--text-secondary)]">
                Turn your plans into measurable milestones and keep making progress.
              </p>
            </div>

            <button
              type="button"
              onClick={openCreateModal}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--accent)] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[var(--accent-hover)]"
            >
              <span className="text-base leading-none">+</span>
              New Goal
            </button>
          </div>

          {/* Summary cards */}
          <div className="mt-7 grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] p-5 shadow-[var(--shadow-card)]">
              <p className="text-xs font-medium text-[var(--text-muted)]">Total goals</p>
              <p className="mt-2 text-2xl font-bold text-[var(--text-primary)]">{goals.length}</p>
            </div>
            <div className="rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] p-5 shadow-[var(--shadow-card)]">
              <p className="text-xs font-medium text-[var(--text-muted)]">Total saved</p>
              <p className="mt-2 text-2xl font-bold text-[var(--accent)]">{formatCurrency(totalSaved)}</p>
            </div>
            <div className="rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] p-5 shadow-[var(--shadow-card)]">
              <p className="text-xs font-medium text-[var(--text-muted)]">Total target</p>
              <p className="mt-2 text-2xl font-bold text-[var(--text-primary)]">{formatCurrency(totalTarget)}</p>
            </div>
          </div>

          {error && !showCreateModal && !showContributionModal && (
            <div className="mt-6 rounded-xl border border-[var(--danger-soft)] bg-[var(--danger-soft)] px-4 py-3 text-sm text-[var(--danger)]">
              {error}
            </div>
          )}

          {goals.length === 0 ? (
            <div className="mt-6 rounded-2xl border border-dashed border-[var(--border)] bg-[var(--card-bg)] px-6 py-16 text-center shadow-[var(--shadow-card)]">
              <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--accent-soft)] text-[var(--accent)]">
                <span className="text-2xl">🎯</span>
              </div>
              <h2 className="text-xl font-bold text-[var(--text-primary)]">No goals yet</h2>
              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[var(--text-secondary)]">
                Start with something meaningful — an emergency fund, a vacation, a new car, or your next big milestone.
              </p>
              <button
                type="button"
                onClick={openCreateModal}
                className="mt-6 rounded-xl bg-[var(--accent)] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[var(--accent-hover)]"
              >
                Create your first goal
              </button>
            </div>
          ) : (
            <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {goals.map((goal) => {
                const target = Number(goal.targetAmount || 0);
                const current = Number(goal.currentAmount || 0);
                const progress = getProgress(current, target);
                const remaining = Math.max(target - current, 0);

                return (
                  <div
                    key={goal.id}
                    className="group rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] p-5 shadow-[var(--shadow-card)] transition hover:-translate-y-0.5 hover:shadow-[var(--shadow-lg)]"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <h2 className="truncate text-[15px] font-bold text-[var(--text-primary)]">
                          {goal.name}
                        </h2>
                        <p className="mt-1 text-xs text-[var(--text-muted)]">
                          Target: {formatDate(goal.targetDate)}
                        </p>
                      </div>
                      <span className="shrink-0 rounded-full bg-[var(--accent-soft)] px-2.5 py-1 text-xs font-bold text-[var(--accent)]">
                        {progress}%
                      </span>
                    </div>

                    {goal.description && (
                      <p className="mt-3 line-clamp-2 text-sm leading-6 text-[var(--text-secondary)]">
                        {goal.description}
                      </p>
                    )}

                    <div className="mt-5">
                      <div className="flex items-end justify-between gap-3">
                        <div>
                          <p className="text-2xl font-bold tracking-[-0.03em] text-[var(--text-primary)]">
                            {formatCurrency(current)}
                          </p>
                          <p className="mt-1 text-xs text-[var(--text-muted)]">
                            of {formatCurrency(target)}
                          </p>
                        </div>
                        <p className="text-xs font-medium text-[var(--text-muted)]">
                          {formatCurrency(remaining)} left
                        </p>
                      </div>

                      {goal.targetDate && remaining > 0 && (
                        <div className="mt-3 flex items-center justify-between rounded-xl bg-[var(--accent-soft)] px-3 py-2 text-xs">
                          <span className="font-medium text-[var(--text-secondary)]">Required pace:</span>
                          <span className="font-bold text-[var(--accent)]">
                            {formatCurrency(
                              Math.ceil(
                                remaining /
                                  Math.max(
                                    1,
                                    Math.ceil(
                                      (new Date(goal.targetDate).getTime() - nowForUi) /
                                        (1000 * 60 * 60 * 24 * 30.4)
                                    )
                                  )
                              )
                            )}
                            /month
                          </span>
                        </div>
                      )}

                      <div className="mt-4 h-2 overflow-hidden rounded-full bg-[var(--surface-muted)]">
                        <div
                          className="h-full rounded-full bg-[var(--accent)] transition-all duration-500"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>

                    <div className="mt-5 flex gap-2">
                      <button
                        type="button"
                        onClick={() => openContributionModal(goal)}
                        className="flex-1 rounded-xl bg-[var(--accent)] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[var(--accent-hover)]"
                      >
                        Add money
                      </button>
                      <button
                        type="button"
                        onClick={() => openEditModal(goal)}
                        className="rounded-xl border border-[var(--border)] px-4 py-2.5 text-sm font-semibold text-[var(--text-secondary)] transition hover:bg-[var(--surface-muted)]"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteGoal(goal)}
                        disabled={saving}
                        className="rounded-xl border border-[var(--danger-soft)] px-4 py-2.5 text-sm font-semibold text-[var(--danger)] transition hover:bg-[var(--danger-soft)] disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  Create a goal
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Give your money a destination.
                </p>
              </div>

              <button
                type="button"
                onClick={closeCreateModal}
                className="rounded-lg px-2 py-1 text-xl text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleCreateGoal} className="mt-6 space-y-4">
              <div>
                <label className="text-sm font-semibold text-slate-700">
                  Goal name
                </label>
                <input
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Emergency Fund"
                  className="mt-2 h-11 w-full rounded-xl border border-[var(--input-border)] bg-[var(--input-bg)] px-4 text-sm text-[var(--text-primary)] outline-none transition placeholder:text-[var(--text-muted)] focus:border-[var(--accent)] focus:ring-4 focus:ring-[var(--accent-soft)]"
                />
              </div>

              <div>
                <label className="text-sm font-semibold text-slate-700">
                  Target amount
                </label>
                <input
                  type="number"
                  min="1"
                  step="0.01"
                  value={targetAmount}
                  onChange={(event) => setTargetAmount(event.target.value)}
                  placeholder="100000"
                  className="mt-2 h-11 w-full rounded-xl border border-[var(--input-border)] bg-[var(--input-bg)] px-4 text-sm text-[var(--text-primary)] outline-none transition placeholder:text-[var(--text-muted)] focus:border-[var(--accent)] focus:ring-4 focus:ring-[var(--accent-soft)]"
                />
              </div>

              <div>
                <label className="text-sm font-semibold text-slate-700">
                  Target date
                </label>
                <input
                  type="date"
                  value={targetDate}
                  onChange={(event) => setTargetDate(event.target.value)}
                  className="mt-2 h-11 w-full rounded-xl border border-[var(--input-border)] bg-[var(--input-bg)] px-4 text-sm text-[var(--text-primary)] outline-none transition placeholder:text-[var(--text-muted)] focus:border-[var(--accent)] focus:ring-4 focus:ring-[var(--accent-soft)]"
                />
              </div>

              <div>
                <label className="text-sm font-semibold text-slate-700">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  placeholder="What are you saving for?"
                  rows={3}
                  className="mt-2 w-full resize-none rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                />
              </div>

              {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeCreateModal}
                  disabled={saving}
                  className="flex-1 rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving ? "Creating..." : "Create goal"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showContributionModal && selectedGoal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  Add money
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Add money toward{" "}
                  <span className="font-semibold text-slate-700">
                    {selectedGoal.name}
                  </span>
                  .
                </p>
              </div>

              <button
                type="button"
                onClick={closeContributionModal}
                className="rounded-lg px-2 py-1 text-xl text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                ×
              </button>
            </div>

            <form
              onSubmit={handleContribution}
              className="mt-6 space-y-4"
            >
              <div>
                <label className="text-sm font-semibold text-slate-700">
                  Contribution amount
                </label>

                <input
                  type="number"
                  min="1"
                  step="0.01"
                  value={contributionAmount}
                  onChange={(event) =>
                    setContributionAmount(event.target.value)
                  }
                  placeholder="5000"
                  autoFocus
                  className="mt-2 h-11 w-full rounded-xl border border-[var(--input-border)] bg-[var(--input-bg)] px-4 text-sm text-[var(--text-primary)] outline-none transition placeholder:text-[var(--text-muted)] focus:border-[var(--accent)] focus:ring-4 focus:ring-[var(--accent-soft)]"
                />
              </div>

              {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeContributionModal}
                  disabled={saving}
                  className="flex-1 rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving ? "Adding..." : "Add money"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showEditModal && editingGoal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  Edit goal
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Update details for {editingGoal.name}.
                </p>
              </div>

              <button
                type="button"
                onClick={closeEditModal}
                className="rounded-lg px-2 py-1 text-xl text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleUpdateGoal} className="mt-6 space-y-4">
              <div>
                <label className="text-sm font-semibold text-slate-700">
                  Goal name
                </label>
                <input
                  value={editName}
                  onChange={(event) => setEditName(event.target.value)}
                  className="mt-2 h-11 w-full rounded-xl border border-[var(--input-border)] bg-[var(--input-bg)] px-4 text-sm text-[var(--text-primary)] outline-none transition placeholder:text-[var(--text-muted)] focus:border-[var(--accent)] focus:ring-4 focus:ring-[var(--accent-soft)]"
                />
              </div>

              <div>
                <label className="text-sm font-semibold text-slate-700">
                  Target amount
                </label>
                <input
                  type="number"
                  min="1"
                  step="0.01"
                  value={editTargetAmount}
                  onChange={(event) => setEditTargetAmount(event.target.value)}
                  className="mt-2 h-11 w-full rounded-xl border border-[var(--input-border)] bg-[var(--input-bg)] px-4 text-sm text-[var(--text-primary)] outline-none transition placeholder:text-[var(--text-muted)] focus:border-[var(--accent)] focus:ring-4 focus:ring-[var(--accent-soft)]"
                />
              </div>

              <div>
                <label className="text-sm font-semibold text-slate-700">
                  Target date
                </label>
                <input
                  type="date"
                  value={editTargetDate}
                  onChange={(event) => setEditTargetDate(event.target.value)}
                  className="mt-2 h-11 w-full rounded-xl border border-[var(--input-border)] bg-[var(--input-bg)] px-4 text-sm text-[var(--text-primary)] outline-none transition placeholder:text-[var(--text-muted)] focus:border-[var(--accent)] focus:ring-4 focus:ring-[var(--accent-soft)]"
                />
              </div>

              <div>
                <label className="text-sm font-semibold text-slate-700">
                  Description
                </label>
                <textarea
                  value={editDescription}
                  onChange={(event) => setEditDescription(event.target.value)}
                  rows={3}
                  className="mt-2 w-full resize-none rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                />
              </div>

              {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeEditModal}
                  disabled={saving}
                  className="flex-1 rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Save changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
