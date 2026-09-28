"use client";


import { useState, useEffect, useCallback } from "react";
import { Repeat, Plus, Calendar as CalendarIcon, Play, Pencil, Trash2, ArrowUpRight, ArrowDownRight, Clock } from "lucide-react";
import { getErrorMessage } from "../../../lib/errors";
import { useConfirmDialog } from "../../components/ui/dialog-provider";

interface Account {
  id: string;
  name: string;
}

interface RecurringItem {
  id: string;
  accountId: string;
  title: string;
  amount: string;
  type: "income" | "expense";
  category: string;
  frequency: "weekly" | "monthly" | "annual";
  nextDate: string;
}

export default function RecurringPage() {
  const { confirm, notify } = useConfirmDialog();
  const [items, setItems] = useState<RecurringItem[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"rules" | "calendar">("rules");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<RecurringItem | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [executingId, setExecutingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    title: "",
    amount: "",
    type: "expense" as RecurringItem["type"],
    category: "Subscriptions",
    frequency: "monthly" as RecurringItem["frequency"],
    nextDate: new Date().toISOString().split("T")[0],
    accountId: "",
  });

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [recRes, accRes] = await Promise.all([
        fetch("/api/recurring"),
        fetch("/api/accounts"),
      ]);

      if (!recRes.ok) throw new Error("Failed to load recurring transactions");
      const recData = await recRes.json();
      setItems(recData);

      if (accRes.ok) {
        const accData = await accRes.json();
        if (Array.isArray(accData)) {
          setAccounts(accData);
          const firstActiveAccount = accData.find((account: Account & { isActive?: boolean }) => account.isActive !== false);
          if (firstActiveAccount) {
            setFormData((prev) =>
              prev.accountId
                ? prev
                : { ...prev, accountId: firstActiveAccount.id },
            );
          }
        }
      }
    } catch (err: unknown) {
      setError(getErrorMessage(err, "An error occurred"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    queueMicrotask(() => void fetchData());
  }, [fetchData]);

  const handleOpenAdd = () => {
    setEditingItem(null);
    setFormData({
      title: "",
      amount: "",
      type: "expense",
      category: "Subscriptions",
      frequency: "monthly",
      nextDate: new Date().toISOString().split("T")[0],
      accountId: accounts[0]?.id || "",
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: RecurringItem) => {
    setEditingItem(item);
    setFormData({
      title: item.title,
      amount: item.amount,
      type: item.type,
      category: item.category,
      frequency: item.frequency,
      nextDate: new Date(item.nextDate).toISOString().split("T")[0],
      accountId: item.accountId,
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!(await confirm({ title: "Delete recurring rule?", description: "This scheduled income or expense rule will be permanently removed.", confirmLabel: "Delete rule", destructive: true }))) return;
    try {
      const res = await fetch(`/api/recurring/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete recurring rule");
      fetchData();
    } catch (err: unknown) {
      notify(getErrorMessage(err, "Failed to delete recurring rule"), "error");
    }
  };

  const handleExecuteNow = async (id: string) => {
    try {
      setExecutingId(id);
      const res = await fetch(`/api/recurring/${id}/execute`, { method: "POST" });
      if (!res.ok) throw new Error("Execution failed");
      const json = await res.json();
      notify(json.message, "success");
      fetchData();
    } catch (err: unknown) {
      notify(getErrorMessage(err, "Failed to execute recurring payment"), "error");
    } finally {
      setExecutingId(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const payload = {
      title: formData.title,
      amount: parseFloat(formData.amount),
      type: formData.type,
      category: formData.category,
      frequency: formData.frequency,
      nextDate: new Date(formData.nextDate).toISOString(),
      accountId: formData.accountId,
    };

    try {
      const url = editingItem ? `/api/recurring/${editingItem.id}` : "/api/recurring";
      const method = editingItem ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || "Failed to save rule");
      }

      setIsModalOpen(false);
      fetchData();
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Failed to save rule"));
    } finally {
      setSubmitting(false);
    }
  };

  // Calculations
  const monthlyEquivalent = (item: RecurringItem) => {
    const amount = parseFloat(item.amount);
    if (!Number.isFinite(amount)) return 0;
    if (item.frequency === "weekly") return (amount * 52) / 12;
    if (item.frequency === "annual") return amount / 12;
    return amount;
  };

  const totalMonthlyIncome = items
    .filter((i) => i.type === "income")
    .reduce((acc, i) => acc + monthlyEquivalent(i), 0);

  const totalMonthlyExpenses = items
    .filter((i) => i.type === "expense")
    .reduce((acc, i) => acc + monthlyEquivalent(i), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)] flex items-center gap-2">
            <Repeat className="w-7 h-7 text-[var(--accent)]" />
            Recurring Transactions & Money Calendar
          </h1>
          <p className="text-[var(--text-secondary)] text-sm mt-1">
            Automate subscriptions, salaries, EMIs, rent, and view your upcoming financial calendar
          </p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center justify-center gap-2 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white px-4 py-2.5 rounded-xl font-medium transition shadow-sm"
        >
          <Plus className="w-4 h-4" /> Add Recurring Rule
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-[var(--card-bg)] p-5 rounded-2xl border border-slate-200 dark:border-[var(--border)] shadow-sm">
          <p className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Scheduled Monthly Income</p>
          <div className="flex items-center justify-between mt-2">
            <span className="text-2xl font-bold text-[var(--accent)]">+₹{totalMonthlyIncome.toLocaleString()}</span>
            <ArrowUpRight className="w-6 h-6 text-emerald-500" />
          </div>
        </div>

        <div className="bg-white dark:bg-[var(--card-bg)] p-5 rounded-2xl border border-slate-200 dark:border-[var(--border)] shadow-sm">
          <p className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Scheduled Monthly Bills & Subscriptions</p>
          <div className="flex items-center justify-between mt-2">
            <span className="text-2xl font-bold text-rose-600 dark:text-rose-400">-₹{totalMonthlyExpenses.toLocaleString()}</span>
            <ArrowDownRight className="w-6 h-6 text-rose-500" />
          </div>
        </div>

        <div className="bg-white dark:bg-[var(--card-bg)] p-5 rounded-2xl border border-slate-200 dark:border-[var(--border)] shadow-sm">
          <p className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Net Monthly Cashflow</p>
          <div className="flex items-center justify-between mt-2">
            <span className={`text-2xl font-bold ${totalMonthlyIncome - totalMonthlyExpenses >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
              ₹{(totalMonthlyIncome - totalMonthlyExpenses).toLocaleString()}
            </span>
            <Repeat className="w-6 h-6 text-blue-500" />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200 dark:border-[var(--border)] pb-2">
        <button
          onClick={() => setActiveTab("rules")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition ${
            activeTab === "rules"
              ? "bg-[var(--accent-soft)]/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
              : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          }`}
        >
          <Repeat className="w-4 h-4" /> Recurring Rules ({items.length})
        </button>
        <button
          onClick={() => setActiveTab("calendar")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition ${
            activeTab === "calendar"
              ? "bg-[var(--accent-soft)]/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
              : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          }`}
        >
          <CalendarIcon className="w-4 h-4" /> Money Calendar
        </button>
      </div>

      {/* TAB 1: RULES */}
      {activeTab === "rules" && (
        <>
          {loading ? (
            <div className="text-center py-12 text-[var(--text-secondary)]">Loading recurring rules...</div>
          ) : items.length === 0 ? (
            <div className="bg-white dark:bg-[var(--card-bg)] border border-slate-200 dark:border-[var(--border)] rounded-2xl p-12 text-center">
              <Repeat className="w-12 h-12 text-slate-400 dark:text-slate-600 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-[var(--text-primary)]">No Recurring Rules</h3>
              <p className="text-[var(--text-secondary)] text-sm mt-1 mb-6">
                Automate your salary, rent, Netflix, Spotify, or loan EMIs.
              </p>
              <button
                onClick={handleOpenAdd}
                className="inline-flex items-center gap-2 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white px-4 py-2.5 rounded-xl text-sm font-medium transition"
              >
                <Plus className="w-4 h-4" /> Add Your First Recurring Rule
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {items.map((item) => {
                const isIncome = item.type === "income";
                return (
                  <div
                    key={item.id}
                    className="bg-white dark:bg-[var(--card-bg)] border border-slate-200 dark:border-[var(--border)] rounded-2xl p-5 shadow-sm hover:border-emerald-500/50 transition flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-bold text-[var(--text-primary)] text-base">{item.title}</h3>
                          <span className="capitalize text-xs font-semibold text-[var(--text-secondary)]">
                            {item.category} • {item.frequency}
                          </span>
                        </div>
                        <span
                          className={`font-mono font-bold text-base ${
                            isIncome ? "text-[var(--accent)]" : "text-[var(--danger)]"
                          }`}
                        >
                          {isIncome ? "+" : "-"}₹{parseFloat(item.amount).toLocaleString()}
                        </span>
                      </div>

                      <div className="mt-4 p-3 bg-slate-50 dark:bg-[var(--surface-muted)]/50 rounded-xl text-xs flex items-center justify-between">
                          <span className="flex items-center gap-1.5 text-[var(--text-secondary)]">
                          <Clock className="w-3.5 h-3.5" /> Next Execution:
                        </span>
                        <span className="font-semibold text-[var(--text-primary)]">
                          {new Date(item.nextDate).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    <div className="mt-5 pt-4 border-t border-slate-100 dark:border-[var(--border)] flex items-center justify-between">
                      <button
                        onClick={() => handleExecuteNow(item.id)}
                        disabled={executingId === item.id}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--accent)] hover:text-emerald-700 transition disabled:opacity-50"
                      >
                        <Play className="w-3.5 h-3.5" />
                        {executingId === item.id ? "Processing..." : "Process Now"}
                      </button>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleOpenEdit(item)}
                          className="p-1.5 hover:bg-[var(--surface-muted)] rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="p-1.5 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg text-rose-500 hover:text-rose-600 transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* TAB 2: MONEY CALENDAR */}
      {activeTab === "calendar" && (
        <div className="bg-white dark:bg-[var(--card-bg)] border border-slate-200 dark:border-[var(--border)] rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-[var(--text-primary)] text-lg">Money Calendar Timeline</h3>
            <span className="text-xs text-[var(--text-secondary)] font-medium">Upcoming payments & income events</span>
          </div>

          <div className="space-y-3">
            {items.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-4 border border-slate-100 dark:border-[var(--border)] rounded-xl hover:bg-slate-50/50 dark:hover:bg-[var(--surface-muted)]/30 transition"
              >
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-[var(--accent-soft)] text-[var(--accent)] rounded-xl font-bold text-sm">
                    {new Date(item.nextDate).getDate()}
                  </div>
                  <div>
                    <h4 className="font-bold text-[var(--text-primary)] text-sm">{item.title}</h4>
                    <p className="text-xs text-[var(--text-secondary)]">
                      {new Date(item.nextDate).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })} • {item.category}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <p className={`font-bold font-mono text-sm ${item.type === "income" ? "text-[var(--accent)]" : "text-[var(--danger)]"}`}>
                    {item.type === "income" ? "+" : "-"}₹{parseFloat(item.amount).toLocaleString()}
                  </p>
                  <span className="text-[10px] uppercase font-semibold text-[var(--text-muted)] tracking-wider">{item.frequency}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-[var(--card-bg)] border border-slate-200 dark:border-[var(--border)] rounded-2xl w-full max-w-md p-6 shadow-xl space-y-4">
            <h2 className="text-xl font-bold text-[var(--text-primary)]">
              {editingItem ? "Edit Recurring Rule" : "Add Recurring Transaction"}
            </h2>

            {error && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 text-rose-600 text-xs rounded-xl">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Monthly Rent, Netflix Subscription"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-[var(--surface-muted)] border border-slate-200 dark:border-[var(--border)] rounded-xl text-sm dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Amount (₹) *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    placeholder="e.g., 15000"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-[var(--surface-muted)] border border-slate-200 dark:border-[var(--border)] rounded-xl text-sm dark:text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Type *</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as RecurringItem["type"] })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm capitalize dark:text-white"
                  >
                    <option value="expense">Expense</option>
                    <option value="income">Income</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Category</label>
                  <input
                    type="text"
                    placeholder="e.g., Subscriptions, Rent, Utilities"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-[var(--surface-muted)] border border-slate-200 dark:border-[var(--border)] rounded-xl text-sm dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Frequency *</label>
                  <select
                    value={formData.frequency}
                    onChange={(e) => setFormData({ ...formData, frequency: e.target.value as RecurringItem["frequency"] })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm capitalize dark:text-white"
                  >
                    <option value="monthly">Monthly</option>
                    <option value="weekly">Weekly</option>
                    <option value="annual">Annual</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Next Date *</label>
                  <input
                    type="date"
                    required
                    value={formData.nextDate}
                    onChange={(e) => setFormData({ ...formData, nextDate: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-[var(--surface-muted)] border border-slate-200 dark:border-[var(--border)] rounded-xl text-sm dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Account *</label>
                  <select
                    value={formData.accountId}
                    onChange={(e) => setFormData({ ...formData, accountId: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-[var(--surface-muted)] border border-slate-200 dark:border-[var(--border)] rounded-xl text-sm dark:text-white"
                  >
                    {accounts.map((acc) => (
                      <option key={acc.id} value={acc.id}>
                        {acc.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-[var(--border)]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-[var(--text-secondary)] hover:bg-[var(--surface-muted)]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm disabled:opacity-50"
                >
                  {submitting ? "Saving..." : editingItem ? "Save Changes" : "Create Rule"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
