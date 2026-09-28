"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useTheme } from "../../theme-provider";
import { useConfirmDialog } from "../../components/ui/dialog-provider";
import {
  Bell,
  Check,
  ChevronRight,
  CircleDollarSign,
  FolderPlus,
  Globe,
  Loader2,
  Lock,
  Monitor,
  Moon,
  Palette,
  Pencil,
  Plus,
  Shield,
  Sun,
  Tag,
  Trash2,
  User,
  X,
  Landmark,
  Database,
} from "lucide-react";

type ToggleProps = {
  enabled: boolean;
  onChange: (value: boolean) => void;
};

type UserProfile = {
  id: string;
  name: string | null;
  email: string;
};

type Category = {
  id: string;
  name: string;
  type: "income" | "expense";
  createdAt?: string;
};

function Toggle({ enabled, onChange }: ToggleProps) {
  return (
    <button
      type="button"
      onClick={() => onChange(!enabled)}
      className={`relative h-6 w-11 rounded-full transition ${
        enabled ? "bg-[#16a36a]" : "bg-[#d9e2dd]"
      }`}
      aria-pressed={enabled}
    >
      <span
        className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow-sm transition ${
          enabled ? "left-6" : "left-1"
        }`}
      />
    </button>
  );
}

export default function SettingsPage() {
  const { theme, setTheme, accent, setAccent } = useTheme();
  const { confirm } = useConfirmDialog();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);

  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState<"all" | "expense" | "income">("all");

  // Category Modal State
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [categoryName, setCategoryName] = useState("");
  const [categoryType, setCategoryType] = useState<"expense" | "income">("expense");
  const [savingCategory, setSavingCategory] = useState(false);
  const [categoryError, setCategoryError] = useState("");
  const [categorySuccess, setCategorySuccess] = useState("");

  const [notifications, setNotifications] = useState(true);
  const [monthlySummary, setMonthlySummary] = useState(true);
  const [goalReminders, setGoalReminders] = useState(true);
  const [compactMode, setCompactMode] = useState(false);

  const [currency, setCurrency] = useState("INR");
  const [saved, setSaved] = useState(false);

  async function loadUserProfile() {
    try {
      setLoadingUser(true);
      const res = await fetch("/api/auth/me");
      if (res.ok) {
        const data = await res.json();
        setUser(data);
      }
    } catch (err) {
      console.error("Failed to load profile", err);
    } finally {
      setLoadingUser(false);
    }
  }

  async function loadCategories() {
    try {
      setLoadingCategories(true);
      const res = await fetch("/api/categories");
      if (res.ok) {
        const data = await res.json();
        setCategories(data);
      }
    } catch (err) {
      console.error("Failed to load categories", err);
    } finally {
      setLoadingCategories(false);
    }
  }

  useEffect(() => {
    queueMicrotask(() => {
      void loadUserProfile();
      void loadCategories();
    });
  }, []);

  function handleSave() {
    setSaved(true);
    window.setTimeout(() => {
      setSaved(false);
    }, 2000);
  }

  function openCreateCategoryModal() {
    setEditingCategory(null);
    setCategoryName("");
    setCategoryType("expense");
    setCategoryError("");
    setShowCategoryModal(true);
  }

  function openEditCategoryModal(cat: Category) {
    setEditingCategory(cat);
    setCategoryName(cat.name);
    setCategoryType(cat.type);
    setCategoryError("");
    setShowCategoryModal(true);
  }

  function closeCategoryModal() {
    if (savingCategory) return;
    setShowCategoryModal(false);
    setEditingCategory(null);
    setCategoryName("");
    setCategoryError("");
  }

  async function handleSaveCategory(e: React.FormEvent) {
    e.preventDefault();
    setCategoryError("");
    setCategorySuccess("");

    if (!categoryName.trim()) {
      setCategoryError("Category name is required.");
      return;
    }

    setSavingCategory(true);

    try {
      const url = editingCategory
        ? `/api/categories/${editingCategory.id}`
        : "/api/categories";
      const method = editingCategory ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: categoryName.trim(),
          type: categoryType,
        }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(data?.message || "Failed to save category");
      }

      setCategorySuccess(
        editingCategory
          ? "Category updated successfully."
          : "Category created successfully."
      );

      closeCategoryModal();
      await loadCategories();
    } catch (err) {
      setCategoryError(
        err instanceof Error ? err.message : "An error occurred."
      );
    } finally {
      setSavingCategory(false);
    }
  }

  async function handleDeleteCategory(cat: Category) {
    if (
      !(await confirm({ title: "Delete category?", description: `The category "${cat.name}" will be permanently removed.`, confirmLabel: "Delete category", destructive: true }))
    ) {
      return;
    }

    setCategoryError("");
    setCategorySuccess("");

    try {
      const res = await fetch(`/api/categories/${cat.id}`, {
        method: "DELETE",
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        setCategoryError(
          data?.message || `Failed to delete category "${cat.name}".`
        );
        return;
      }

      setCategorySuccess(`Category "${cat.name}" deleted successfully.`);
      await loadCategories();
    } catch (err) {
      setCategoryError(
        err instanceof Error
          ? err.message
          : `Unable to delete category "${cat.name}".`
      );
    }
  }

  const filteredCategories = categories.filter((cat) => {
    if (categoryFilter === "all") return true;
    return cat.type === categoryFilter;
  });

  return (
    <div className="min-h-screen px-5 py-6 sm:px-8 lg:px-10">
      <div className="mx-auto max-w-[1100px]">
        {/* Header */}
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#16a36a]">
            Preferences & Management
          </p>

          <h1 className="mt-2 text-[30px] font-bold tracking-[-0.04em] text-[#10231c] sm:text-[36px]">
            Settings
          </h1>

          <p className="mt-2 text-sm leading-6 text-[#71817a]">
            Manage your profile, categories, and application preferences.
          </p>
        </div>

        <div className="mt-7 space-y-6">
          {/* Profile */}
          <section className="overflow-hidden rounded-2xl border border-[#e4ebe7] bg-white shadow-[0_8px_30px_rgba(16,35,28,0.04)]">
            <div className="border-b border-[#edf1ef] px-5 py-5 sm:px-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#ecfdf5] text-[#16a36a]">
                  <User className="h-5 w-5" />
                </div>

                <div>
                  <h2 className="text-[16px] font-bold text-[#10231c]">
                    Profile
                  </h2>

                  <p className="mt-0.5 text-xs text-[#82908a]">
                    Your authenticated Wealthly profile.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid gap-5 p-5 sm:grid-cols-2 sm:p-6">
              <SettingField
                label="Name"
                value={loadingUser ? "Loading..." : user?.name || "N/A"}
                placeholder="Your name"
              />

              <SettingField
                label="Email"
                value={loadingUser ? "Loading..." : user?.email || "N/A"}
                placeholder="Your email"
              />
            </div>
          </section>

          <section className="overflow-hidden rounded-2xl border border-[#e4ebe7] bg-white shadow-[0_8px_30px_rgba(16,35,28,0.04)]">
            <div className="border-b border-[#edf1ef] px-5 py-5 sm:px-6">
              <h2 className="text-[16px] font-bold text-[#10231c]">Finance tools</h2>
              <p className="mt-1 text-xs text-[#82908a]">Manage supporting data without crowding your main navigation.</p>
            </div>
            <div className="grid gap-3 p-5 sm:grid-cols-3 sm:p-6">
              <Link href="#categories" className="flex items-center gap-3 rounded-xl border border-[#e4ebe7] p-4 transition hover:border-[#16a36a] hover:bg-[#f7fcf9]">
                <Tag className="h-5 w-5 text-[#4c8df6]" />
                <span><span className="block text-sm font-semibold text-[#10231c]">Categories</span><span className="block text-xs text-[#71817a]">Income and expense labels</span></span>
              </Link>
              <Link href="/bank-connections" className="flex items-center gap-3 rounded-xl border border-[#e4ebe7] p-4 transition hover:border-[#16a36a] hover:bg-[#f7fcf9]">
                <Landmark className="h-5 w-5 text-[#4c8df6]" />
                <span><span className="block text-sm font-semibold text-[#10231c]">Bank connections</span><span className="block text-xs text-[#71817a]">Accounts and sync controls</span></span>
              </Link>
              <Link href="/data-management" className="flex items-center gap-3 rounded-xl border border-[#e4ebe7] p-4 transition hover:border-[#16a36a] hover:bg-[#f7fcf9]">
                <Database className="h-5 w-5 text-[#4c8df6]" />
                <span><span className="block text-sm font-semibold text-[#10231c]">Data import & export</span><span className="block text-xs text-[#71817a]">CSV and XLSX files</span></span>
              </Link>
            </div>
          </section>

          {/* Category Management Section */}
          <section id="categories" className="overflow-hidden rounded-2xl border border-[#e4ebe7] bg-white shadow-[0_8px_30px_rgba(16,35,28,0.04)]">
            <div className="flex flex-col gap-4 border-b border-[#edf1ef] px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#eef4ff] text-[#4c8df6]">
                  <Tag className="h-5 w-5" />
                </div>

                <div>
                  <h2 className="text-[16px] font-bold text-[#10231c]">
                    Categories
                  </h2>

                  <p className="mt-0.5 text-xs text-[#82908a]">
                    Manage custom expense and income categories.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={openCreateCategoryModal}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[#078653] px-4 text-xs font-semibold text-white shadow-sm transition hover:bg-[#056b43]"
              >
                <Plus className="h-4 w-4" />
                Add Category
              </button>
            </div>

            <div className="p-5 sm:p-6">
              {categoryError && (
                <div className="mb-4 rounded-xl border border-[#ffd4d4] bg-[#fff4f4] px-4 py-3 text-xs font-medium text-[#c73f43]">
                  {categoryError}
                </div>
              )}

              {categorySuccess && (
                <div className="mb-4 rounded-xl border border-[#b7efd3] bg-[#edf8f2] px-4 py-3 text-xs font-medium text-[#078653]">
                  {categorySuccess}
                </div>
              )}

              {/* Filters */}
              <div className="mb-4 flex items-center gap-2">
                <span className="text-xs font-semibold text-[#91a09a] uppercase tracking-wide">
                  Type:
                </span>
                {(["all", "expense", "income"] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setCategoryFilter(t)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold capitalize transition ${
                      categoryFilter === t
                        ? "bg-[#078653] text-white"
                        : "bg-[#f1f8f4] text-[#60736b] hover:bg-[#e4f3eb]"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>

              {loadingCategories ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-5 w-5 animate-spin text-[#078653]" />
                  <span className="ml-2 text-xs text-[#60736b]">
                    Loading categories...
                  </span>
                </div>
              ) : filteredCategories.length === 0 ? (
                <div className="rounded-xl border border-dashed border-[#dce8e1] bg-[#fcfdfe] p-6 text-center text-xs text-[#82908a]">
                  No categories found for this filter.
                </div>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {filteredCategories.map((cat) => (
                    <div
                      key={cat.id}
                      className="flex items-center justify-between rounded-xl border border-[#e4ebe7] bg-[#f8faf9] p-3.5 transition hover:bg-white hover:shadow-sm"
                    >
                      <div className="min-w-0 flex-1 pr-2">
                        <p className="truncate text-sm font-semibold text-[#10231c]">
                          {cat.name}
                        </p>
                        <span
                          className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                            cat.type === "income"
                              ? "bg-[#ecfdf5] text-[#16a36a]"
                              : "bg-[#fff0f0] text-[#ff5b5f]"
                          }`}
                        >
                          {cat.type}
                        </span>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => openEditCategoryModal(cat)}
                          className="rounded-lg p-1.5 text-[#60736b] transition hover:bg-[#eaf4ef] hover:text-[#10231c]"
                          title="Edit category"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteCategory(cat)}
                          className="rounded-lg p-1.5 text-[#c73f43] transition hover:bg-[#fff0f0]"
                          title="Delete category"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* Preferences */}
          <section className="overflow-hidden rounded-2xl border border-[#e4ebe7] bg-white shadow-[0_8px_30px_rgba(16,35,28,0.04)]">
            <div className="border-b border-[#edf1ef] px-5 py-5 sm:px-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#eef4ff] text-[#4c8df6]">
                  <Palette className="h-5 w-5" />
                </div>

                <div>
                  <h2 className="text-[16px] font-bold text-[#10231c]">
                    Preferences
                  </h2>

                  <p className="mt-0.5 text-xs text-[#82908a]">
                    Choose how financial information is displayed.
                  </p>
                </div>
              </div>
            </div>

            <div className="divide-y divide-[#edf1ef]">
              <PreferenceRow
                icon={<Sun className="h-4 w-4" />}
                title="Appearance Theme"
                description="Choose between light mode, dark mode, or follow system."
              >
                <div className="flex items-center gap-1.5 rounded-xl border border-[#dfe8e2] bg-[#f8faf9] p-1">
                  {(
                    [
                      { id: "light", label: "Light", Icon: Sun },
                      { id: "dark", label: "Dark", Icon: Moon },
                      { id: "system", label: "System", Icon: Monitor },
                    ] as const
                  ).map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setTheme(t.id)}
                      className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                        theme === t.id
                          ? "bg-white text-[#10231c] shadow-sm"
                          : "text-[#60736b] hover:text-[#10231c]"
                      }`}
                    >
                      <t.Icon className="h-3.5 w-3.5" />
                      {t.label}
                    </button>
                  ))}
                </div>
              </PreferenceRow>

              <PreferenceRow
                icon={<Palette className="h-4 w-4" />}
                title="Accent Color Palette"
                description="Personalize your primary accent theme."
              >
                <div className="flex flex-wrap items-center gap-2">
                  {(
                    [
                      { id: "green", label: "Wealth Green", bg: "bg-[#078653]" },
                      { id: "blue", label: "Ocean Blue", bg: "bg-[#2563eb]" },
                      { id: "purple", label: "Purple", bg: "bg-[#7c3aed]" },
                      { id: "rose", label: "Rose", bg: "bg-[#e11d48]" },
                      { id: "amber", label: "Amber", bg: "bg-[#d97706]" },
                      { id: "mono", label: "Monochrome", bg: "bg-[#18181b]" },
                    ] as const
                  ).map((pal) => (
                    <button
                      key={pal.id}
                      type="button"
                      onClick={() => setAccent(pal.id)}
                      title={pal.label}
                      className={`group relative flex h-7 w-7 items-center justify-center rounded-full ${pal.bg} transition hover:scale-110 ${
                        accent === pal.id ? "ring-2 ring-offset-2 ring-[#10231c]" : ""
                      }`}
                    >
                      {accent === pal.id && <Check className="h-3.5 w-3.5 text-white" />}
                    </button>
                  ))}
                </div>
              </PreferenceRow>

              <PreferenceRow
                icon={<CircleDollarSign className="h-4 w-4" />}
                title="Default currency"
                description="Currency used throughout Wealthly."
              >
                <select
                  value={currency}
                  onChange={(event) =>
                    setCurrency(event.target.value)
                  }
                  className="rounded-lg border border-[#dfe8e2] bg-white px-3 py-2 text-sm font-medium text-[#30453c] outline-none focus:border-[#16a36a]"
                >
                  <option value="INR">INR — ₹</option>
                  <option value="USD">USD — $</option>
                  <option value="EUR">EUR — €</option>
                  <option value="GBP">GBP — £</option>
                </select>
              </PreferenceRow>

              <PreferenceRow
                icon={<Globe className="h-4 w-4" />}
                title="Language"
                description="Language used across the application."
              >
                <span className="text-sm font-medium text-[#60736b]">
                  English
                </span>
              </PreferenceRow>

              <PreferenceRow
                icon={<Moon className="h-4 w-4" />}
                title="Compact mode"
                description="Use tighter spacing across financial lists."
              >
                <Toggle
                  enabled={compactMode}
                  onChange={setCompactMode}
                />
              </PreferenceRow>
            </div>
          </section>

          {/* Notifications */}
          <section className="overflow-hidden rounded-2xl border border-[#e4ebe7] bg-white shadow-[0_8px_30px_rgba(16,35,28,0.04)]">
            <div className="border-b border-[#edf1ef] px-5 py-5 sm:px-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#fff7e8] text-[#e4a62b]">
                  <Bell className="h-5 w-5" />
                </div>

                <div>
                  <h2 className="text-[16px] font-bold text-[#10231c]">
                    Notifications
                  </h2>

                  <p className="mt-0.5 text-xs text-[#82908a]">
                    Decide which financial reminders you receive.
                  </p>
                </div>
              </div>
            </div>

            <div className="divide-y divide-[#edf1ef]">
              <PreferenceRow
                icon={<Bell className="h-4 w-4" />}
                title="Financial notifications"
                description="Receive important updates about your finances."
              >
                <Toggle
                  enabled={notifications}
                  onChange={setNotifications}
                />
              </PreferenceRow>

              <PreferenceRow
                icon={<CircleDollarSign className="h-4 w-4" />}
                title="Monthly summary"
                description="Get a summary of your monthly financial activity."
              >
                <Toggle
                  enabled={monthlySummary}
                  onChange={setMonthlySummary}
                />
              </PreferenceRow>

              <PreferenceRow
                icon={<Shield className="h-4 w-4" />}
                title="Goal reminders"
                description="Receive reminders about your financial goals."
              >
                <Toggle
                  enabled={goalReminders}
                  onChange={setGoalReminders}
                />
              </PreferenceRow>
            </div>
          </section>

          {/* Security */}
          <section className="overflow-hidden rounded-2xl border border-[#e4ebe7] bg-white shadow-[0_8px_30px_rgba(16,35,28,0.04)]">
            <div className="border-b border-[#edf1ef] px-5 py-5 sm:px-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#f2edff] text-[#8b6cf6]">
                  <Lock className="h-5 w-5" />
                </div>

                <div>
                  <h2 className="text-[16px] font-bold text-[#10231c]">
                    Security
                  </h2>

                  <p className="mt-0.5 text-xs text-[#82908a]">
                    Account security controls.
                  </p>
                </div>
              </div>
            </div>

            <div className="p-5 sm:p-6">
              <button
                type="button"
                disabled
                className="flex w-full items-center justify-between rounded-xl border border-[#edf1ef] bg-[#f8faf9] px-4 py-4 text-left opacity-70"
              >
                <div>
                  <p className="text-sm font-semibold text-[#40534b]">
                    Change password
                  </p>

                  <p className="mt-1 text-xs text-[#91a09a]">
                    Authenticated password change support.
                  </p>
                </div>

                <ChevronRight className="h-4 w-4 text-[#a0ada7]" />
              </button>
            </div>
          </section>

          {/* Save */}
          <div className="flex items-center justify-end gap-3 pb-8">
            {saved && (
              <span className="flex items-center gap-1.5 text-sm font-medium text-[#078653]">
                <Check className="h-4 w-4" />
                Preferences saved
              </span>
            )}

            <button
              type="button"
              onClick={handleSave}
              className="rounded-xl bg-[#078653] px-5 py-3 text-sm font-semibold text-white shadow-[0_8px_20px_rgba(7,134,83,0.18)] transition hover:bg-[#056b43]"
            >
              Save preferences
            </button>
          </div>
        </div>
      </div>

      {/* Category Modal */}
      {showCategoryModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#10231c]/30 p-4 backdrop-blur-sm"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) closeCategoryModal();
          }}
        >
          <div className="w-full max-w-md rounded-2xl border border-[#e4ebe7] bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#edf8f2] text-[#078653]">
                  <FolderPlus className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-[#10231c]">
                    {editingCategory ? "Edit Category" : "Add Category"}
                  </h2>
                  <p className="text-xs text-[#60736b]">
                    {editingCategory
                      ? "Update category details."
                      : "Create a custom category for your transactions."}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={closeCategoryModal}
                disabled={savingCategory}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-[#60736b] hover:bg-[#f1f8f4]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSaveCategory} className="mt-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#40534b]">
                  Category Name
                </label>
                <input
                  type="text"
                  value={categoryName}
                  onChange={(e) => setCategoryName(e.target.value)}
                  placeholder="e.g. Subscriptions, Salary"
                  required
                  autoFocus
                  className="mt-1.5 h-11 w-full rounded-xl border border-[#dfe8e2] bg-[#f8faf9] px-4 text-sm text-[#10231c] outline-none transition focus:border-[#078653] focus:bg-white focus:ring-4 focus:ring-[#d9f7e9]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#40534b]">
                  Category Type
                </label>
                <select
                  value={categoryType}
                  onChange={(e) =>
                    setCategoryType(e.target.value as "expense" | "income")
                  }
                  className="mt-1.5 h-11 w-full rounded-xl border border-[#dfe8e2] bg-[#f8faf9] px-4 text-sm text-[#10231c] outline-none transition focus:border-[#078653] focus:bg-white focus:ring-4 focus:ring-[#d9f7e9]"
                >
                  <option value="expense">Expense Category</option>
                  <option value="income">Income Category</option>
                </select>
              </div>

              {categoryError && (
                <div className="rounded-xl border border-[#ffd4d4] bg-[#fff4f4] px-4 py-3 text-xs font-medium text-[#c73f43]">
                  {categoryError}
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeCategoryModal}
                  disabled={savingCategory}
                  className="h-10 rounded-xl px-4 text-xs font-semibold text-[#60736b] hover:bg-[#f1f8f4]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingCategory}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[#078653] px-5 text-xs font-semibold text-white shadow-sm hover:bg-[#056b43] disabled:opacity-50"
                >
                  {savingCategory && (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  )}
                  {editingCategory ? "Save Changes" : "Create Category"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function SettingField({
  label,
  value,
  placeholder,
}: {
  label: string;
  value: string;
  placeholder: string;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-semibold text-[#60736b]">
        {label}
      </span>

      <input
        value={value}
        placeholder={placeholder}
        readOnly
        className="w-full rounded-xl border border-[#e1e9e4] bg-[#f8faf9] px-4 py-3 text-sm font-medium text-[#40534b] outline-none"
      />
    </label>
  );
}

function PreferenceRow({
  icon,
  title,
  description,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-5 px-5 py-5 sm:px-6">
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#f5f8f6] text-[#71817a]">
          {icon}
        </div>

        <div className="min-w-0">
          <p className="text-sm font-semibold text-[#30453c]">
            {title}
          </p>

          <p className="mt-0.5 text-xs leading-5 text-[#91a09a]">
            {description}
          </p>
        </div>
      </div>

      <div className="shrink-0">{children}</div>
    </div>
  );
}
