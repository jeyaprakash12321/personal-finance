"use client";


import { useState, useEffect, useMemo } from "react";
import { Tag, Plus, Pencil, Trash2, Search, ArrowUpRight, ArrowDownRight, FolderPlus, CheckCircle2, AlertCircle } from "lucide-react";
import { getErrorMessage } from "../../../lib/errors";
import { useConfirmDialog } from "../../components/ui/dialog-provider";

interface Category {
  id: string;
  name: string;
  type: "income" | "expense";
  createdAt?: string;
}

export default function CategoriesPage() {
  const { confirm } = useConfirmDialog();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<"all" | "expense" | "income">("all");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [categoryName, setCategoryName] = useState("");
  const [categoryType, setCategoryType] = useState<"expense" | "income">("expense");
  const [submitting, setSubmitting] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/categories");
      if (!res.ok) throw new Error("Failed to load categories");
      const data = await res.json();
      setCategories(data);
    } catch (err: unknown) {
      setError(getErrorMessage(err, "An error occurred"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    queueMicrotask(() => void fetchCategories());
  }, []);

  const handleOpenAdd = () => {
    setEditingCategory(null);
    setCategoryName("");
    setCategoryType("expense");
    setModalError(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (cat: Category) => {
    setEditingCategory(cat);
    setCategoryName(cat.name);
    setCategoryType(cat.type);
    setModalError(null);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string, name: string) => {
    if (!(await confirm({ title: "Delete category?", description: `The category "${name}" will be permanently removed. Categories used by transactions cannot be deleted.`, confirmLabel: "Delete category", destructive: true }))) return;
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch(`/api/categories/${id}`, { method: "DELETE" });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to delete category");
      }

      setSuccess(`Category "${name}" deleted successfully.`);
      fetchCategories();
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Failed to delete category"));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryName.trim()) {
      setModalError("Category name is required.");
      return;
    }

    setSubmitting(true);
    setModalError(null);
    setError(null);
    setSuccess(null);

    try {
      const url = editingCategory ? `/api/categories/${editingCategory.id}` : "/api/categories";
      const method = editingCategory ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: categoryName.trim(), type: categoryType }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to save category");

      setSuccess(`Category "${data.name}" ${editingCategory ? "updated" : "created"} successfully.`);
      setIsModalOpen(false);
      fetchCategories();
    } catch (err: unknown) {
      setModalError(getErrorMessage(err, "Failed to save category"));
    } finally {
      setSubmitting(false);
    }
  };

  const filteredCategories = useMemo(() => {
    return categories.filter((cat) => {
      const matchesSearch = cat.name.toLowerCase().includes(search.trim().toLowerCase());
      const matchesType = filterType === "all" || cat.type === filterType;
      return matchesSearch && matchesType;
    });
  }, [categories, search, filterType]);

  const expenseCount = categories.filter((c) => c.type === "expense").length;
  const incomeCount = categories.filter((c) => c.type === "income").length;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)] flex items-center gap-2">
            <Tag className="w-7 h-7 text-[var(--accent)]" />
            Category Management
          </h1>
          <p className="text-[var(--text-secondary)] text-sm mt-1">
            Organize expenses and income with custom categories
          </p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center justify-center gap-2 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white px-4 py-2.5 rounded-xl font-medium transition shadow-sm"
        >
          <Plus className="w-4 h-4" /> Add Category
        </button>
      </div>

      {/* Global Banner Messages */}
      {error && (
        <div className="p-4 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-sm rounded-2xl flex items-center gap-2">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-4 bg-[var(--accent-soft)]/50 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-sm rounded-2xl flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* Stats & Search Controls */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Filter Badges */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setFilterType("all")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition ${
              filterType === "all"
                ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                : "bg-white dark:bg-[var(--card-bg)] text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-[var(--border)] hover:bg-slate-50"
            }`}
          >
            All ({categories.length})
          </button>
          <button
            onClick={() => setFilterType("expense")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-1 ${
              filterType === "expense"
                ? "bg-rose-600 text-white"
                : "bg-white dark:bg-[var(--card-bg)] text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-[var(--border)] hover:bg-slate-50"
            }`}
          >
            <ArrowDownRight className="w-3.5 h-3.5" /> Expenses ({expenseCount})
          </button>
          <button
            onClick={() => setFilterType("income")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-1 ${
              filterType === "income"
                ? "bg-emerald-600 text-white"
                : "bg-white dark:bg-[var(--card-bg)] text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-[var(--border)] hover:bg-slate-50"
            }`}
          >
            <ArrowUpRight className="w-3.5 h-3.5" /> Income ({incomeCount})
          </button>
        </div>

        {/* Search input */}
        <div className="relative max-w-xs w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search categories..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-white dark:bg-[var(--card-bg)] border border-slate-200 dark:border-[var(--border)] rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:text-white"
          />
        </div>
      </div>

      {/* Main Grid */}
      {loading ? (
        <div className="text-center py-12 text-[var(--text-secondary)]">Loading categories...</div>
      ) : filteredCategories.length === 0 ? (
        <div className="bg-white dark:bg-[var(--card-bg)] border border-slate-200 dark:border-[var(--border)] rounded-2xl p-12 text-center">
          <FolderPlus className="w-12 h-12 text-slate-400 dark:text-slate-600 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-[var(--text-primary)]">No Categories Found</h3>
          <p className="text-[var(--text-secondary)] text-sm mt-1 mb-6">
            Create custom expense or income categories to organize your finances.
          </p>
          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-2 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white px-4 py-2.5 rounded-xl text-sm font-medium transition"
          >
            <Plus className="w-4 h-4" /> Add Your First Category
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredCategories.map((cat) => (
            <div
              key={cat.id}
              className="bg-white dark:bg-[var(--card-bg)] border border-slate-200 dark:border-[var(--border)] rounded-2xl p-4 shadow-sm hover:border-emerald-500/50 transition flex items-center justify-between group"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`p-2.5 rounded-xl ${
                    cat.type === "income"
                      ? "bg-emerald-100 dark:bg-emerald-950 text-[var(--accent)]"
                      : "bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400"
                  }`}
                >
                  {cat.type === "income" ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                </div>
                <div>
                  <h3 className="font-bold text-[var(--text-primary)] text-sm">{cat.name}</h3>
                  <span className="capitalize text-[10px] font-semibold text-slate-400 tracking-wider">
                    {cat.type} Category
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition">
                <button
                  onClick={() => handleOpenEdit(cat)}
                  aria-label={`Edit category ${cat.name}`}
                  title={`Edit category ${cat.name}`}
                  className="p-1.5 hover:bg-slate-100 dark:hover:bg-[var(--surface-muted)] rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white transition"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleDelete(cat.id, cat.name)}
                  aria-label={`Delete category ${cat.name}`}
                  title={`Delete category ${cat.name}`}
                  className="p-1.5 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg text-rose-500 hover:text-rose-600 transition"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Category Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-[var(--card-bg)] border border-slate-200 dark:border-[var(--border)] rounded-2xl w-full max-w-md p-6 shadow-xl space-y-4">
            <h2 className="text-xl font-bold text-[var(--text-primary)]">
              {editingCategory ? "Edit Category" : "Add Custom Category"}
            </h2>

            {modalError && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 text-rose-600 text-xs rounded-xl">
                {modalError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Category Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Groceries, Freelance, Subscriptions"
                  value={categoryName}
                  onChange={(e) => setCategoryName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-[var(--surface-muted)] border border-slate-200 dark:border-[var(--border)] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Category Type *
                </label>
                <select
                  value={categoryType}
                  onChange={(e) => setCategoryType(e.target.value as "expense" | "income")}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-[var(--surface-muted)] border border-slate-200 dark:border-[var(--border)] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:text-white capitalize"
                >
                  <option value="expense">Expense Category</option>
                  <option value="income">Income Category</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-[var(--border)]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl text-xs font-semibold bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white transition shadow-sm disabled:opacity-50"
                >
                  {submitting ? "Saving..." : editingCategory ? "Save Changes" : "Create Category"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
