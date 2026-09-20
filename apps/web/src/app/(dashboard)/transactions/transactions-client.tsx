"use client";

import {
  ArrowDownLeft,
  ArrowUpRight,
  CalendarDays,
  Check,
  Loader2,
  Plus,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type Transaction = {
  id: string;
  categoryName: string;
  description: string | null;
  amount: string;
  type: "income" | "expense";
  transactionDate: string;
};

type Account = {
  id: string;
  name: string;
  type: string;
  currency: string;
};

type Category = {
  id: string;
  name: string;
  type: "income" | "expense";
};

type FilterType = "all" | "income" | "expense";

export function TransactionsClient({
  transactions,
}: {
  transactions: Transaction[];
}) {
  const router = useRouter();

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<FilterType>("all");
  const [dateFilter, setDateFilter] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const [showModal, setShowModal] = useState(false);

  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [transactionType, setTransactionType] = useState<
    "income" | "expense"
  >("expense");
  const [accountId, setAccountId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [transactionDate, setTransactionDate] = useState(
    new Date().toISOString().slice(0, 10)
  );

  const [loadingFormData, setLoadingFormData] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const filteredCategories = useMemo(() => {
    return categories.filter(
      (category) => category.type === transactionType
    );
  }, [categories, transactionType]);

  const filteredTransactions = useMemo(() => {
    const query = search.trim().toLowerCase();

    return transactions.filter((transaction) => {
      const matchesSearch =
        !query ||
        transaction.description?.toLowerCase().includes(query) ||
        transaction.categoryName.toLowerCase().includes(query);

      const matchesType =
        typeFilter === "all" || transaction.type === typeFilter;

      const matchesDate =
        !dateFilter ||
        new Date(transaction.transactionDate).toISOString().slice(0, 10) ===
          dateFilter;

      return matchesSearch && matchesType && matchesDate;
    });
  }, [transactions, search, typeFilter, dateFilter]);

  const totalIncome = filteredTransactions
    .filter((transaction) => transaction.type === "income")
    .reduce((sum, transaction) => sum + Number(transaction.amount), 0);

  const totalExpenses = filteredTransactions
    .filter((transaction) => transaction.type === "expense")
    .reduce((sum, transaction) => sum + Number(transaction.amount), 0);

  const hasActiveFilters =
    search.trim() !== "" || typeFilter !== "all" || dateFilter !== "";

  async function openTransactionModal() {
    setShowModal(true);
    setFormError("");
    setLoadingFormData(true);

    try {
      const [accountsResponse, categoriesResponse] = await Promise.all([
        fetch("/api/accounts"),
        fetch("/api/categories"),
      ]);

      if (!accountsResponse.ok || !categoriesResponse.ok) {
        throw new Error("Failed to load accounts or categories");
      }

      const [accountsData, categoriesData] = await Promise.all([
        accountsResponse.json(),
        categoriesResponse.json(),
      ]);

      setAccounts(accountsData);
      setCategories(categoriesData);

      if (accountsData.length > 0) {
        setAccountId(accountsData[0].id);
      }

      const matchingCategories = categoriesData.filter(
        (category: Category) => category.type === "expense"
      );

      if (matchingCategories.length > 0) {
        setCategoryId(matchingCategories[0].id);
      }
    } catch (error) {
      console.error(error);
      setFormError("Unable to load accounts and categories.");
    } finally {
      setLoadingFormData(false);
    }
  }

  function closeTransactionModal() {
    if (saving) {
      return;
    }

    setShowModal(false);
    setFormError("");
    setAmount("");
    setDescription("");
    setTransactionType("expense");
    setAccountId("");
    setCategoryId("");
    setTransactionDate(new Date().toISOString().slice(0, 10));
  }

  function handleTransactionTypeChange(
    type: "income" | "expense"
  ) {
    setTransactionType(type);

    const matchingCategory = categories.find(
      (category) => category.type === type
    );

    setCategoryId(matchingCategory?.id ?? "");
  }

  async function handleSaveTransaction() {
    setFormError("");

    if (!amount || Number(amount) <= 0) {
      setFormError("Enter a valid amount.");
      return;
    }

    if (!accountId) {
      setFormError("Select an account.");
      return;
    }

    if (!categoryId) {
      setFormError("Select a category.");
      return;
    }

    if (!transactionDate) {
      setFormError("Select a transaction date.");
      return;
    }

    setSaving(true);

    try {
      const response = await fetch("/api/transactions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          accountId,
          categoryId,
          amount: Number(amount).toFixed(2),
          type: transactionType,
          description: description.trim() || undefined,
          transactionDate: new Date(
            `${transactionDate}T12:00:00`
          ).toISOString(),
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result?.message || result?.error || "Failed to save transaction"
        );
      }

      closeTransactionModal();
      router.refresh();
    } catch (error) {
      console.error(error);

      setFormError(
        error instanceof Error
          ? error.message
          : "Failed to save transaction."
      );
    } finally {
      setSaving(false);
    }
  }

  function clearFilters() {
    setSearch("");
    setTypeFilter("all");
    setDateFilter("");
  }

  return (
    <>
      <main className="min-h-screen bg-[#f7faf8] px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-[1400px]">
          {/* Header */}
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-medium text-[#16a36a]">
                Money activity
              </p>

              <h1 className="mt-1 text-3xl font-semibold tracking-[-0.03em] text-[#10231c]">
                Transactions
              </h1>

              <p className="mt-1 text-sm text-[#60736b]">
                Keep track of where your money is going.
              </p>
            </div>

            <button
              type="button"
              onClick={openTransactionModal}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#078653] px-5 text-sm font-semibold text-white shadow-[0_8px_20px_rgba(7,134,83,0.18)] transition hover:bg-[#056b43]"
            >
              <Plus className="h-4 w-4" />
              Add Transaction
            </button>
          </div>

          {/* Summary cards */}
          <div className="mt-7 grid gap-4 sm:grid-cols-3">
            <SummaryCard
              label="Transactions"
              value={filteredTransactions.length.toString()}
              description={
                hasActiveFilters
                  ? `Showing ${filteredTransactions.length} of ${transactions.length}`
                  : "Recorded transactions"
              }
            />

            <SummaryCard
              label="Income"
              value={formatCurrency(totalIncome)}
              description="Total income"
              positive
            />

            <SummaryCard
              label="Expenses"
              value={formatCurrency(totalExpenses)}
              description="Total spending"
            />
          </div>

          {/* Transactions card */}
          <section className="mt-6 overflow-hidden rounded-2xl border border-[#e4ebe7] bg-white shadow-[0_8px_30px_rgba(16,35,28,0.04)]">
            {/* Toolbar */}
            <div className="border-b border-[#edf1ef] p-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                {/* Search */}
                <div className="relative w-full md:max-w-sm">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#91a09a]" />

                  <input
                    type="text"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search transactions..."
                    className="h-10 w-full rounded-xl border border-[#e4ebe7] bg-[#f8faf9] pl-10 pr-10 text-sm text-[#10231c] outline-none transition placeholder:text-[#91a09a] focus:border-[#9bd8bb] focus:bg-white focus:ring-4 focus:ring-[#d9f7e9]"
                  />

                  {search && (
                    <button
                      type="button"
                      onClick={() => setSearch("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#91a09a] transition hover:text-[#10231c]"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>

                {/* Toolbar actions */}
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowFilters((current) => !current)}
                    className={`inline-flex h-10 items-center gap-2 rounded-xl border px-3 text-sm font-medium transition ${
                      showFilters || hasActiveFilters
                        ? "border-[#b7efd3] bg-[#edf8f2] text-[#078653]"
                        : "border-[#e4ebe7] bg-white text-[#50635b] hover:bg-[#f7faf8]"
                    }`}
                  >
                    <SlidersHorizontal className="h-4 w-4" />
                    Filter
                  </button>

                  {hasActiveFilters && (
                    <button
                      type="button"
                      onClick={clearFilters}
                      className="inline-flex h-10 items-center gap-2 rounded-xl px-3 text-sm font-medium text-[#60736b] transition hover:bg-[#f7faf8] hover:text-[#10231c]"
                    >
                      <X className="h-4 w-4" />
                      Clear
                    </button>
                  )}
                </div>
              </div>

              {/* Filter panel */}
              {showFilters && (
                <div className="mt-4 rounded-xl border border-[#e4ebe7] bg-[#f8faf9] p-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    {/* Transaction type */}
                    <div>
                      <p className="mb-2 text-xs font-semibold uppercase tracking-[0.08em] text-[#91a09a]">
                        Type
                      </p>

                      <div className="flex flex-wrap gap-2">
                        <FilterButton
                          active={typeFilter === "all"}
                          onClick={() => setTypeFilter("all")}
                        >
                          All
                        </FilterButton>

                        <FilterButton
                          active={typeFilter === "income"}
                          onClick={() => setTypeFilter("income")}
                        >
                          Income
                        </FilterButton>

                        <FilterButton
                          active={typeFilter === "expense"}
                          onClick={() => setTypeFilter("expense")}
                        >
                          Expenses
                        </FilterButton>
                      </div>
                    </div>

                    {/* Date */}
                    <div>
                      <p className="mb-2 text-xs font-semibold uppercase tracking-[0.08em] text-[#91a09a]">
                        Date
                      </p>

                      <div className="relative">
                        <CalendarDays className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#91a09a]" />

                        <input
                          type="date"
                          value={dateFilter}
                          onChange={(event) =>
                            setDateFilter(event.target.value)
                          }
                          className="h-10 w-full rounded-xl border border-[#e4ebe7] bg-white pl-10 pr-3 text-sm text-[#50635b] outline-none focus:border-[#9bd8bb] focus:ring-4 focus:ring-[#d9f7e9]"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Empty state */}
            {filteredTransactions.length === 0 ? (
              <EmptyState
                hasFilters={hasActiveFilters}
                onClear={clearFilters}
              />
            ) : (
              <>
                {/* Desktop table */}
                <div className="hidden overflow-x-auto md:block">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-[#edf1ef] bg-[#fbfcfb] text-left">
                        <th className="px-6 py-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#91a09a]">
                          Transaction
                        </th>

                        <th className="px-6 py-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#91a09a]">
                          Category
                        </th>

                        <th className="px-6 py-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#91a09a]">
                          Date
                        </th>

                        <th className="px-6 py-3 text-right text-[11px] font-semibold uppercase tracking-[0.08em] text-[#91a09a]">
                          Amount
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {filteredTransactions.map((transaction) => (
                        <TransactionRow
                          key={transaction.id}
                          transaction={transaction}
                        />
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile list */}
                <div className="divide-y divide-[#edf1ef] md:hidden">
                  {filteredTransactions.map((transaction) => (
                    <MobileTransactionRow
                      key={transaction.id}
                      transaction={transaction}
                    />
                  ))}
                </div>
              </>
            )}
          </section>
        </div>
      </main>

      {/* Add Transaction modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#10231c]/35 p-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-[#e4ebe7] bg-white shadow-[0_25px_70px_rgba(16,35,28,0.18)]">
            {/* Modal header */}
            <div className="flex items-center justify-between border-b border-[#edf1ef] px-6 py-5">
              <div>
                <p className="text-xs font-medium text-[#16a36a]">
                  Money activity
                </p>

                <h2 className="mt-1 text-xl font-semibold tracking-[-0.02em] text-[#10231c]">
                  Add Transaction
                </h2>
              </div>

              <button
                type="button"
                onClick={closeTransactionModal}
                disabled={saving}
                className="flex h-9 w-9 items-center justify-center rounded-xl text-[#91a09a] transition hover:bg-[#f1f8f4] hover:text-[#10231c] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal body */}
            <div className="space-y-5 p-6">
              {formError && (
                <div className="rounded-xl border border-[#ffd4d4] bg-[#fff4f4] px-4 py-3 text-sm text-[#c73f43]">
                  {formError}
                </div>
              )}

              {loadingFormData ? (
                <div className="flex items-center justify-center py-12">
                  <div className="flex items-center gap-3 text-sm text-[#60736b]">
                    <Loader2 className="h-5 w-5 animate-spin text-[#078653]" />
                    Loading account and category data...
                  </div>
                </div>
              ) : (
                <>
                  {/* Type */}
                  <div>
                    <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.08em] text-[#91a09a]">
                      Transaction type
                    </label>

                    <div className="grid grid-cols-2 gap-2">
                      <TypeButton
                        active={transactionType === "expense"}
                        onClick={() =>
                          handleTransactionTypeChange("expense")
                        }
                      >
                        <ArrowUpRight className="h-4 w-4" />
                        Expense
                      </TypeButton>

                      <TypeButton
                        active={transactionType === "income"}
                        onClick={() =>
                          handleTransactionTypeChange("income")
                        }
                      >
                        <ArrowDownLeft className="h-4 w-4" />
                        Income
                      </TypeButton>
                    </div>
                  </div>

                  {/* Amount */}
                  <div>
                    <label
                      htmlFor="transaction-amount"
                      className="mb-2 block text-sm font-medium text-[#30443c]"
                    >
                      Amount
                    </label>

                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-[#60736b]">
                        ₹
                      </span>

                      <input
                        id="transaction-amount"
                        type="number"
                        min="0"
                        step="0.01"
                        value={amount}
                        onChange={(event) => setAmount(event.target.value)}
                        placeholder="0.00"
                        className="h-11 w-full rounded-xl border border-[#e4ebe7] bg-[#f8faf9] pl-8 pr-4 text-sm text-[#10231c] outline-none transition placeholder:text-[#a4afa9] focus:border-[#9bd8bb] focus:bg-white focus:ring-4 focus:ring-[#d9f7e9]"
                      />
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <label
                      htmlFor="transaction-description"
                      className="mb-2 block text-sm font-medium text-[#30443c]"
                    >
                      Description
                    </label>

                    <input
                      id="transaction-description"
                      type="text"
                      maxLength={255}
                      value={description}
                      onChange={(event) =>
                        setDescription(event.target.value)
                      }
                      placeholder="e.g. Groceries"
                      className="h-11 w-full rounded-xl border border-[#e4ebe7] bg-[#f8faf9] px-4 text-sm text-[#10231c] outline-none transition placeholder:text-[#a4afa9] focus:border-[#9bd8bb] focus:bg-white focus:ring-4 focus:ring-[#d9f7e9]"
                    />
                  </div>

                  {/* Account */}
                  <div>
                    <label
                      htmlFor="transaction-account"
                      className="mb-2 block text-sm font-medium text-[#30443c]"
                    >
                      Account
                    </label>

                    <select
                      id="transaction-account"
                      value={accountId}
                      onChange={(event) => setAccountId(event.target.value)}
                      className="h-11 w-full rounded-xl border border-[#e4ebe7] bg-[#f8faf9] px-4 text-sm text-[#10231c] outline-none transition focus:border-[#9bd8bb] focus:bg-white focus:ring-4 focus:ring-[#d9f7e9]"
                    >
                      <option value="">Select account</option>

                      {accounts.map((account) => (
                        <option key={account.id} value={account.id}>
                          {account.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Category */}
                  <div>
                    <label
                      htmlFor="transaction-category"
                      className="mb-2 block text-sm font-medium text-[#30443c]"
                    >
                      Category
                    </label>

                    <select
                      id="transaction-category"
                      value={categoryId}
                      onChange={(event) => setCategoryId(event.target.value)}
                      className="h-11 w-full rounded-xl border border-[#e4ebe7] bg-[#f8faf9] px-4 text-sm text-[#10231c] outline-none transition focus:border-[#9bd8bb] focus:bg-white focus:ring-4 focus:ring-[#d9f7e9]"
                    >
                      <option value="">Select category</option>

                      {filteredCategories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Date */}
                  <div>
                    <label
                      htmlFor="transaction-date"
                      className="mb-2 block text-sm font-medium text-[#30443c]"
                    >
                      Date
                    </label>

                    <div className="relative">
                      <CalendarDays className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#91a09a]" />

                      <input
                        id="transaction-date"
                        type="date"
                        value={transactionDate}
                        onChange={(event) =>
                          setTransactionDate(event.target.value)
                        }
                        className="h-11 w-full rounded-xl border border-[#e4ebe7] bg-[#f8faf9] pl-10 pr-4 text-sm text-[#10231c] outline-none transition focus:border-[#9bd8bb] focus:bg-white focus:ring-4 focus:ring-[#d9f7e9]"
                      />
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Modal footer */}
            {!loadingFormData && (
              <div className="flex justify-end gap-3 border-t border-[#edf1ef] px-6 py-4">
                <button
                  type="button"
                  onClick={closeTransactionModal}
                  disabled={saving}
                  className="h-10 rounded-xl px-4 text-sm font-medium text-[#60736b] transition hover:bg-[#f1f8f4] hover:text-[#10231c] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleSaveTransaction}
                  disabled={saving}
                  className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#078653] px-5 text-sm font-semibold text-white shadow-[0_6px_16px_rgba(7,134,83,0.16)] transition hover:bg-[#056b43] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4" />
                      Save Transaction
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

function SummaryCard({
  label,
  value,
  description,
  positive = false,
}: {
  label: string;
  value: string;
  description: string;
  positive?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-[#e4ebe7] bg-white p-5 shadow-[0_8px_30px_rgba(16,35,28,0.04)]">
      <p className="text-xs font-medium text-[#91a09a]">{label}</p>

      <p
        className={`mt-2 text-2xl font-semibold tracking-[-0.03em] ${
          positive ? "text-[#078653]" : "text-[#10231c]"
        }`}
      >
        {value}
      </p>

      <p className="mt-1 text-xs text-[#91a09a]">{description}</p>
    </div>
  );
}

function FilterButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-lg px-3 py-2 text-xs font-medium transition ${
        active
          ? "bg-[#078653] text-white"
          : "bg-white text-[#60736b] hover:bg-[#edf8f2]"
      }`}
    >
      {children}
    </button>
  );
}

function TypeButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex h-11 items-center justify-center gap-2 rounded-xl border text-sm font-semibold transition ${
        active
          ? "border-[#9bd8bb] bg-[#edf8f2] text-[#078653]"
          : "border-[#e4ebe7] bg-white text-[#60736b] hover:bg-[#f7faf8]"
      }`}
    >
      {children}

      {active && <Check className="h-4 w-4" />}
    </button>
  );
}

function EmptyState({
  hasFilters,
  onClear,
}: {
  hasFilters: boolean;
  onClear: () => void;
}) {
  return (
    <div className="px-6 py-16 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#edf8f2] text-[#078653]">
        <Search className="h-5 w-5" />
      </div>

      <p className="mt-4 text-sm font-semibold text-[#10231c]">
        {hasFilters ? "No matching transactions" : "No transactions yet"}
      </p>

      <p className="mx-auto mt-1 max-w-sm text-sm text-[#91a09a]">
        {hasFilters
          ? "Try changing your search or filters."
          : "Your transactions will appear here once you add them."}
      </p>

      {hasFilters && (
        <button
          type="button"
          onClick={onClear}
          className="mt-4 text-sm font-semibold text-[#078653] hover:text-[#056b43]"
        >
          Clear filters
        </button>
      )}
    </div>
  );
}

function TransactionRow({
  transaction,
}: {
  transaction: Transaction;
}) {
  const isIncome = transaction.type === "income";

  return (
    <tr className="group border-b border-[#f0f3f1] last:border-b-0 transition hover:bg-[#fbfdfc]">
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <TransactionIcon type={transaction.type} />

          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-[#10231c]">
              {transaction.description || transaction.categoryName}
            </p>

            <p className="mt-0.5 text-xs text-[#91a09a]">
              {isIncome ? "Income" : "Expense"}
            </p>
          </div>
        </div>
      </td>

      <td className="px-6 py-4">
        <span className="inline-flex rounded-lg bg-[#f1f8f4] px-2.5 py-1 text-xs font-medium text-[#50635b]">
          {transaction.categoryName}
        </span>
      </td>

      <td className="px-6 py-4 text-sm text-[#60736b]">
        {formatDate(transaction.transactionDate)}
      </td>

      <td
        className={`px-6 py-4 text-right text-sm font-semibold ${
          isIncome ? "text-[#078653]" : "text-[#e05255]"
        }`}
      >
        {formatAmount(transaction.amount, transaction.type)}
      </td>
    </tr>
  );
}

function MobileTransactionRow({
  transaction,
}: {
  transaction: Transaction;
}) {
  const isIncome = transaction.type === "income";

  return (
    <div className="flex items-center justify-between gap-4 p-4">
      <div className="flex min-w-0 items-center gap-3">
        <TransactionIcon type={transaction.type} />

        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-[#10231c]">
            {transaction.description || transaction.categoryName}
          </p>

          <p className="mt-0.5 text-xs text-[#91a09a]">
            {transaction.categoryName} ·{" "}
            {formatDate(transaction.transactionDate)}
          </p>
        </div>
      </div>

      <p
        className={`shrink-0 text-sm font-semibold ${
          isIncome ? "text-[#078653]" : "text-[#e05255]"
        }`}
      >
        {formatAmount(transaction.amount, transaction.type)}
      </p>
    </div>
  );
}

function TransactionIcon({
  type,
}: {
  type: Transaction["type"];
}) {
  const isIncome = type === "income";

  return (
    <div
      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
        isIncome
          ? "bg-[#e9f8f0] text-[#078653]"
          : "bg-[#fff0f0] text-[#e05255]"
      }`}
    >
      {isIncome ? (
        <ArrowDownLeft className="h-4 w-4" />
      ) : (
        <ArrowUpRight className="h-4 w-4" />
      )}
    </div>
  );
}

function formatCurrency(value: number) {
  return `₹${value.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatAmount(amount: string, type: Transaction["type"]) {
  const value = Number(amount);

  return `${type === "income" ? "+" : "-"}₹${value.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}