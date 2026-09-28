"use client";

import {
  AlertTriangle,
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Plus,
  Target,
  X,
} from "lucide-react";
import {
  FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useConfirmDialog } from "../../components/ui/dialog-provider";

type Budget = {
  id: string;
  userId: string;
  categoryId: string;
  amount: string;
  month: string;
  createdAt: string;
  categoryName: string;
  categoryType: "income" | "expense";
  spent: number;
  remaining: number;
  percentageUsed: number;
  isOverBudget: boolean;
};

type Category = {
  id: string;
  name: string;
  type: "income" | "expense";
};

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

function getCurrentMonth() {
  const now = new Date();

  return `${now.getFullYear()}-${String(
    now.getMonth() + 1,
  ).padStart(2, "0")}`;
}

function formatMonth(month: string) {
  const [year, monthNumber] = month.split("-").map(Number);

  return new Intl.DateTimeFormat("en-IN", {
    month: "long",
    year: "numeric",
  }).format(new Date(year, monthNumber - 1, 1));
}

function shiftMonth(month: string, offset: number) {
  const [year, monthNumber] = month.split("-").map(Number);

  const date = new Date(
    year,
    monthNumber - 1 + offset,
    1,
  );

  return `${date.getFullYear()}-${String(
    date.getMonth() + 1,
  ).padStart(2, "0")}`;
}

const inputClass =
  "h-11 w-full rounded-xl border border-[#dfe8e3] bg-white px-3 text-sm text-[#10231c] outline-none transition placeholder:text-[#a7b2ad] focus:border-[#78c9a3] focus:ring-4 focus:ring-[#d9f7e9]";

export default function BudgetsPage() {
  const { confirm, notify } = useConfirmDialog();
  const [selectedMonth, setSelectedMonth] =
    useState(getCurrentMonth());

  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [pageError, setPageError] = useState("");
  const [formError, setFormError] = useState("");

  const [showCreateModal, setShowCreateModal] =
    useState(false);

  const [showEditModal, setShowEditModal] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  const [editAmount, setEditAmount] = useState("");

  const [categoryId, setCategoryId] = useState("");
  const [amount, setAmount] = useState("");

  function openEditModal(budget: Budget) {
    setEditingBudget(budget);
    setEditAmount(budget.amount);
    setFormError("");
    setShowEditModal(true);
  }

  function closeEditModal() {
    if (saving) return;
    setShowEditModal(false);
    setEditingBudget(null);
    setFormError("");
  }

  async function handleUpdateBudget(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editingBudget) return;

    if (!/^\d+(\.\d{1,2})?$/.test(editAmount.trim()) || Number(editAmount) <= 0) {
      setFormError("Enter a valid budget amount greater than zero.");
      return;
    }

    setSaving(true);
    setFormError("");

    try {
      const response = await fetch(`/api/budgets/${editingBudget.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: Number(editAmount).toFixed(2),
        }),
      });

      const data = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(data?.message || "Failed to update budget");
      }

      setShowEditModal(false);
      setEditingBudget(null);
      await loadBudgets();
    } catch (error) {
      console.error(error);
      setFormError(error instanceof Error ? error.message : "Unable to update budget.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteBudget(budget: Budget) {
    if (!(await confirm({ title: "Delete budget?", description: `The budget for "${budget.categoryName}" will be permanently removed.`, confirmLabel: "Delete budget", destructive: true }))) {
      return;
    }

    try {
      const response = await fetch(`/api/budgets/${budget.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        notify(data?.message || "Failed to delete budget", "error");
        return;
      }

      await loadBudgets();
    } catch (error) {
      console.error(error);
      notify("Failed to delete budget.", "error");
    }
  }

  const loadBudgets = useCallback(async () => {
    try {
      setLoading(true);
      setPageError("");

      const response = await fetch(
        `/api/budgets?month=${selectedMonth}`,
        {
          cache: "no-store",
        },
      );

      if (!response.ok) {
        throw new Error("Failed to load budgets");
      }

      const data = await response.json();

      setBudgets(data);
    } catch (error) {
      console.error(error);
      setPageError("Unable to load your budgets.");
    } finally {
      setLoading(false);
    }
  }, [selectedMonth]);

  const loadCategories = useCallback(async () => {
    try {
      const response = await fetch(
        "/api/categories",
        {
          cache: "no-store",
        },
      );

      if (!response.ok) {
        throw new Error("Failed to load categories");
      }

      const data = await response.json();

      setCategories(
        data.filter(
          (category: Category) =>
            category.type === "expense",
        ),
      );
    } catch (error) {
      console.error(error);
    }
  }, []);

  useEffect(() => {
    void loadBudgets();
  }, [loadBudgets]);

  useEffect(() => {
    queueMicrotask(() => void loadCategories());
  }, [loadCategories]);

  const summary = useMemo(() => {
    const totalBudget = budgets.reduce(
      (total, budget) =>
        total + Number(budget.amount),
      0,
    );

    const totalSpent = budgets.reduce(
      (total, budget) =>
        total + budget.spent,
      0,
    );

    const totalRemaining = Math.max(
      totalBudget - totalSpent,
      0,
    );

    const percentageUsed =
      totalBudget > 0
        ? Math.min(
            (totalSpent / totalBudget) * 100,
            100,
          )
        : 0;

    const overBudgetCount = budgets.filter(
      (budget) => budget.isOverBudget,
    ).length;

    return {
      totalBudget,
      totalSpent,
      totalRemaining,
      percentageUsed,
      overBudgetCount,
    };
  }, [budgets]);

  const availableCategories = useMemo(() => {
    const budgetCategoryIds = new Set(
      budgets.map(
        (budget) => budget.categoryId,
      ),
    );

    return categories.filter(
      (category) =>
        !budgetCategoryIds.has(category.id),
    );
  }, [budgets, categories]);

  function openCreateModal() {
    setFormError("");
    setCategoryId(
      availableCategories[0]?.id ?? "",
    );
    setAmount("");
    setShowCreateModal(true);
  }

  function closeCreateModal() {
    if (saving) return;

    setShowCreateModal(false);
    setFormError("");
  }

  async function handleCreateBudget(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (!categoryId) {
      setFormError(
        "Please select an expense category.",
      );
      return;
    }

    if (!/^\d+(\.\d{1,2})?$/.test(amount.trim())) {
      setFormError(
        "Enter a valid budget amount.",
      );
      return;
    }

    if (Number(amount) <= 0) {
      setFormError(
        "Budget amount must be greater than zero.",
      );
      return;
    }

    setSaving(true);
    setFormError("");

    try {
      const response = await fetch(
        "/api/budgets",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            categoryId,
            amount: Number(amount).toFixed(2),
            month: selectedMonth,
          }),
        },
      );

      const data = await response
        .json()
        .catch(() => null);

      if (!response.ok) {
        throw new Error(
          data?.message ||
            "Failed to create budget",
        );
      }

      setShowCreateModal(false);

      await loadBudgets();
    } catch (error) {
      console.error(error);

      setFormError(
        error instanceof Error
          ? error.message
          : "Unable to create the budget.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-full px-5 py-6 sm:px-8 lg:px-10 lg:py-8">
      <div className="mx-auto max-w-[1400px]">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#078653]">
              Monthly planning
            </p>

            <h1 className="mt-2 text-[30px] font-bold tracking-[-0.04em] text-[#10231c] sm:text-[34px]">
              Keep your spending on track.
            </h1>

            <p className="mt-2 max-w-xl text-sm leading-6 text-[#60736b]">
              Set a limit for each spending category and let
              Wealthly track the rest automatically.
            </p>
          </div>

          <button
            type="button"
            onClick={openCreateModal}
            disabled={
              availableCategories.length === 0
            }
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#078653] px-5 text-sm font-semibold text-white shadow-[0_8px_20px_rgba(7,134,83,0.18)] transition hover:bg-[#056b43] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Plus className="h-4 w-4" />
            New Budget
          </button>
        </div>

        <div className="mt-7 flex items-center justify-between rounded-2xl border border-[#e4ebe7] bg-white p-3 shadow-[0_8px_30px_rgba(16,35,28,0.04)] sm:p-4">
          <button
            type="button"
            onClick={() =>
              setSelectedMonth(
                shiftMonth(
                  selectedMonth,
                  -1,
                ),
              )
            }
            className="flex h-9 w-9 items-center justify-center rounded-lg text-[#60736b] transition hover:bg-[#f1f8f4] hover:text-[#10231c]"
            aria-label="Previous month"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>

          <div className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-[#078653]" />

            <span className="text-sm font-semibold text-[#10231c]">
              {formatMonth(selectedMonth)}
            </span>
          </div>

          <button
            type="button"
            onClick={() =>
              setSelectedMonth(
                shiftMonth(
                  selectedMonth,
                  1,
                ),
              )
            }
            className="flex h-9 w-9 items-center justify-center rounded-lg text-[#60736b] transition hover:bg-[#f1f8f4] hover:text-[#10231c]"
            aria-label="Next month"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryCard
            label="Total Budget"
            value={formatCurrency(
              summary.totalBudget,
            )}
          />

          <SummaryCard
            label="Spent"
            value={formatCurrency(
              summary.totalSpent,
            )}
            accent
          />

          <SummaryCard
            label="Remaining"
            value={formatCurrency(
              summary.totalRemaining,
            )}
          />

          <SummaryCard
            label="Used"
            value={`${Math.round(
              summary.percentageUsed,
            )}%`}
          />
        </div>

        {budgets.length > 0 && (
          <section className="mt-5 rounded-2xl border border-[#e4ebe7] bg-white p-5 shadow-[0_8px_30px_rgba(16,35,28,0.04)] sm:p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-[#10231c]">
                  Monthly spending
                </p>

                <p className="mt-1 text-xs text-[#91a09a]">
                  {formatCurrency(
                    summary.totalSpent,
                  )}{" "}
                  of{" "}
                  {formatCurrency(
                    summary.totalBudget,
                  )}{" "}
                  used
                </p>
              </div>

              <span
                className={`text-lg font-bold ${
                  summary.overBudgetCount > 0
                    ? "text-[#d94b50]"
                    : "text-[#078653]"
                }`}
              >
                {Math.round(
                  summary.percentageUsed,
                )}
                %
              </span>
            </div>

            <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-[#edf3ef]">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  summary.overBudgetCount > 0
                    ? "bg-[#ff5b5f]"
                    : "bg-[#16a36a]"
                }`}
                style={{
                  width: `${summary.percentageUsed}%`,
                }}
              />
            </div>

            {summary.overBudgetCount > 0 && (
              <div className="mt-4 flex items-center gap-2 rounded-xl bg-[#fff3f3] px-3 py-2.5 text-xs font-medium text-[#c94a4d]">
                <AlertTriangle className="h-4 w-4 shrink-0" />

                {summary.overBudgetCount}{" "}
                {summary.overBudgetCount === 1
                  ? "category is"
                  : "categories are"}{" "}
                over budget.
              </div>
            )}
          </section>
        )}

        <div className="mt-6">
          {loading ? (
            <div className="flex min-h-[300px] items-center justify-center rounded-2xl border border-[#e4ebe7] bg-white">
              <div className="flex items-center gap-3 text-sm text-[#60736b]">
                <Loader2 className="h-5 w-5 animate-spin text-[#078653]" />
                Loading your budgets...
              </div>
            </div>
          ) : pageError ? (
            <div className="rounded-2xl border border-[#f1d7d8] bg-white p-8 text-center">
              <p className="text-sm font-semibold text-[#10231c]">
                Something went wrong
              </p>

              <p className="mt-1 text-sm text-[#60736b]">
                {pageError}
              </p>

              <button
                type="button"
                onClick={() =>
                  void loadBudgets()
                }
                className="mt-5 rounded-xl bg-[#078653] px-4 py-2.5 text-sm font-semibold text-white"
              >
                Try again
              </button>
            </div>
          ) : budgets.length === 0 ? (
            <EmptyBudgets
              onCreate={openCreateModal}
            />
          ) : (
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {budgets.map((budget) => (
                <BudgetCard
                  key={budget.id}
                  budget={budget}
                  onEdit={() => openEditModal(budget)}
                  onDelete={() => handleDeleteBudget(budget)}
                />
              ))}
            </div>
          )}
        </div>

        {budgets.length > 0 && (
          <div className="mt-6 rounded-2xl bg-[#ecf8f2] px-5 py-4">
            <p className="text-sm font-semibold text-[#056b43]">
              Your budget is a guide, not a punishment.
            </p>

            <p className="mt-1 text-xs leading-5 text-[#60736b]">
              Keep an eye on the categories that matter most.
              Your spending updates automatically whenever you
              add a transaction.
            </p>
          </div>
        )}
      </div>

      {showCreateModal && (
        <Modal onClose={closeCreateModal}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#d9f7e9] text-[#078653]">
                <Target className="h-5 w-5" />
              </div>

              <h2 className="mt-4 text-xl font-bold tracking-[-0.03em] text-[#10231c]">
                Create a budget
              </h2>

              <p className="mt-1 text-sm text-[#60736b]">
                Set your spending limit for{" "}
                {formatMonth(selectedMonth)}.
              </p>
            </div>

            <button
              type="button"
              onClick={closeCreateModal}
              className="flex h-9 w-9 items-center justify-center rounded-lg text-[#91a09a] hover:bg-[#f1f8f4] hover:text-[#10231c]"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <form
            onSubmit={handleCreateBudget}
            className="mt-6 space-y-4"
          >
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold text-[#10231c]">
                Expense category
              </span>

              <select
                value={categoryId}
                onChange={(event) =>
                  setCategoryId(
                    event.target.value,
                  )
                }
                className={inputClass}
              >
                <option value="">
                  Select a category
                </option>

                {availableCategories.map(
                  (category) => (
                    <option
                      key={category.id}
                      value={category.id}
                    >
                      {category.name}
                    </option>
                  ),
                )}
              </select>
            </label>

            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold text-[#10231c]">
                Monthly budget
              </span>

              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[#91a09a]">
                  ₹
                </span>

                <input
                  value={amount}
                  onChange={(event) =>
                    setAmount(
                      event.target.value,
                    )
                  }
                  placeholder="10000"
                  inputMode="decimal"
                  className={`${inputClass} pl-8`}
                  autoFocus
                />
              </div>
            </label>

            {formError && (
              <p className="rounded-xl bg-[#fff3f3] px-3 py-2.5 text-xs font-medium text-[#c94a4d]">
                {formError}
              </p>
            )}

            <button
              type="submit"
              disabled={saving}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#078653] text-sm font-semibold text-white transition hover:bg-[#056b43] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving && (
                <Loader2 className="h-4 w-4 animate-spin" />
              )}

              {saving
                ? "Creating..."
                : "Create Budget"}
            </button>
          </form>
        </Modal>
      )}

      {showEditModal && editingBudget && (
        <Modal onClose={closeEditModal}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#d9f7e9] text-[#078653]">
                <Target className="h-5 w-5" />
              </div>

              <h2 className="mt-4 text-xl font-bold tracking-[-0.03em] text-[#10231c]">
                Edit budget
              </h2>

              <p className="mt-1 text-sm text-[#60736b]">
                Update spending limit for {editingBudget.categoryName}.
              </p>
            </div>

            <button
              type="button"
              onClick={closeEditModal}
              className="flex h-9 w-9 items-center justify-center rounded-lg text-[#91a09a] hover:bg-[#f1f8f4] hover:text-[#10231c]"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <form onSubmit={handleUpdateBudget} className="mt-6 space-y-4">
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold text-[#10231c]">
                Monthly budget
              </span>

              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[#91a09a]">
                  ₹
                </span>

                <input
                  value={editAmount}
                  onChange={(e) => setEditAmount(e.target.value)}
                  placeholder="10000"
                  inputMode="decimal"
                  className={`${inputClass} pl-8`}
                  autoFocus
                />
              </div>
            </label>

            {formError && (
              <p className="rounded-xl bg-[#fff3f3] px-3 py-2.5 text-xs font-medium text-[#c94a4d]">
                {formError}
              </p>
            )}

            <button
              type="submit"
              disabled={saving}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#078653] text-sm font-semibold text-white transition hover:bg-[#056b43] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              {saving ? "Saving..." : "Save Budget"}
            </button>
          </form>
        </Modal>
      )}
    </div>
  );
}

function SummaryCard({
  label,
  value,
  accent = false,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-[#e4ebe7] bg-white p-5 shadow-[0_8px_30px_rgba(16,35,28,0.04)]">
      <p className="text-xs font-medium text-[#91a09a]">
        {label}
      </p>

      <p
        className={`mt-2 text-xl font-bold tracking-[-0.03em] ${
          accent
            ? "text-[#078653]"
            : "text-[#10231c]"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function BudgetCard({
  budget,
  onEdit,
  onDelete,
}: {
  budget: Budget;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const rawPercentage = Number(
    budget.percentageUsed,
  );

  const displayPercentage = Math.round(
    rawPercentage,
  );

  const progressWidth = Math.min(
    Math.max(rawPercentage, 0),
    100,
  );

  return (
    <article className="rounded-2xl border border-[#e4ebe7] bg-white p-5 shadow-[0_8px_30px_rgba(16,35,28,0.04)] transition hover:-translate-y-0.5 hover:shadow-[0_14px_35px_rgba(16,35,28,0.08)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-[15px] font-bold text-[#10231c]">
            {budget.categoryName}
          </h2>

          <p className="mt-1 text-xs text-[#91a09a]">
            Monthly spending limit
          </p>
        </div>

        {budget.isOverBudget ? (
          <span className="flex items-center gap-1 rounded-full bg-[#fff0f0] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-[#d94b50]">
            <AlertTriangle className="h-3 w-3" />
            Over
          </span>
        ) : (
          <span className="flex items-center gap-1 rounded-full bg-[#d9f7e9] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-[#078653]">
            <Check className="h-3 w-3" />
            On track
          </span>
        )}
      </div>

      <div className="mt-6 flex items-end justify-between gap-4">
        <div>
          <p className="text-xs text-[#91a09a]">
            Spent
          </p>

          <p
            className={`mt-1 text-xl font-bold tracking-[-0.03em] ${
              budget.isOverBudget
                ? "text-[#d94b50]"
                : "text-[#10231c]"
            }`}
          >
            {formatCurrency(
              budget.spent,
            )}
          </p>
        </div>

        <div className="text-right">
          <p className="text-xs text-[#91a09a]">
            Budget
          </p>

          <p className="mt-1 text-sm font-semibold text-[#10231c]">
            {formatCurrency(
              Number(budget.amount),
            )}
          </p>
        </div>
      </div>

      <div className="mt-4 h-2 overflow-hidden rounded-full bg-[#edf3ef]">
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            budget.isOverBudget
              ? "bg-[#ff5b5f]"
              : "bg-[#16a36a]"
          }`}
          style={{
            width: `${progressWidth}%`,
          }}
        />
      </div>

      <div className="mt-3 flex items-center justify-between text-xs">
        <span
          className={
            budget.isOverBudget
              ? "font-semibold text-[#d94b50]"
              : "text-[#60736b]"
          }
        >
          {budget.isOverBudget
            ? `${formatCurrency(
                budget.spent -
                  Number(
                    budget.amount,
                  ),
              )} over`
            : `${formatCurrency(
                budget.remaining,
              )} remaining`}
        </span>

        <span className="font-semibold text-[#60736b]">
          {displayPercentage}%
        </span>
      </div>

      <div className="mt-4 flex items-center justify-end gap-2 border-t border-[#edf1ef] pt-3">
        <button
          type="button"
          onClick={onEdit}
          className="rounded-lg border border-[#e4ebe7] px-3 py-1 text-xs font-semibold text-[#60736b] transition hover:bg-[#f7faf8] hover:text-[#10231c]"
        >
          Edit
        </button>
        <button
          type="button"
          onClick={onDelete}
          className="rounded-lg border border-[#ffd4d4] px-3 py-1 text-xs font-semibold text-[#c74448] transition hover:bg-[#fff5f5]"
        >
          Delete
        </button>
      </div>
    </article>
  );
}

function EmptyBudgets({
  onCreate,
}: {
  onCreate: () => void;
}) {
  return (
    <div className="flex min-h-[380px] flex-col items-center justify-center rounded-2xl border border-dashed border-[#cfdcd5] bg-white px-6 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#d9f7e9] text-[#078653]">
        <Target className="h-7 w-7" />
      </div>

      <h2 className="mt-5 text-lg font-bold tracking-[-0.02em] text-[#10231c]">
        No budgets for this month
      </h2>

      <p className="mt-2 max-w-sm text-sm leading-6 text-[#60736b]">
        Set a spending limit for categories like groceries,
        dining, transport, or entertainment.
      </p>

      <button
        type="button"
        onClick={onCreate}
        className="mt-6 inline-flex h-10 items-center gap-2 rounded-xl bg-[#078653] px-4 text-sm font-semibold text-white transition hover:bg-[#056b43]"
      >
        <Plus className="h-4 w-4" />
        Create Your First Budget
      </button>
    </div>
  );
}

function Modal({
  children,
  onClose,
}: {
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#10231c]/30 px-4 py-6 backdrop-blur-[2px]"
      onMouseDown={(event) => {
        if (
          event.target ===
          event.currentTarget
        ) {
          onClose();
        }
      }}
    >
      <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl border border-[#e4ebe7] bg-white p-6 shadow-[0_25px_80px_rgba(16,35,28,0.18)]">
        {children}
      </div>
    </div>
  );
}
