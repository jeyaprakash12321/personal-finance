"use client";

import {
  ChevronRight,
  CirclePlus,
  CalendarClock,
  FilePlus2,
  Goal,
  Receipt,
} from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";

type Account = {
  id: string;
  name: string;
  type: string;
};

type Category = {
  id: string;
  name: string;
  type: "income" | "expense";
};

type LinkedFinancialItem = { id: string; label: string };

type TransactionType = "income" | "expense";

function startOfDay(date: Date) {
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate()
  );
}

function dateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

type RecurringPreview = {
  id: string;
  title: string;
  amount: string;
  type: "income" | "expense";
  nextDate: string;
};

export function RightRail() {
  const router = useRouter();

  const today = startOfDay(new Date());
  const todayTimestamp = today.getTime();

  const [selectedDate, setSelectedDate] =
    useState(today);
  const [recurringItems, setRecurringItems] = useState<RecurringPreview[]>([]);

  // Transaction modal
  const [showTransactionModal, setShowTransactionModal] =
    useState(false);

  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [linkedItems, setLinkedItems] = useState({
    credit_card: [] as LinkedFinancialItem[],
    loan: [] as LinkedFinancialItem[],
    insurance: [] as LinkedFinancialItem[],
  });
  const [linkedType, setLinkedType] = useState<"" | "credit_card" | "loan" | "insurance">("");
  const [linkedId, setLinkedId] = useState("");

  const [transactionType, setTransactionType] =
    useState<TransactionType>("expense");

  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [accountId, setAccountId] = useState("");
  const [categoryId, setCategoryId] = useState("");

  const [loadingOptions, setLoadingOptions] =
    useState(false);

  const [savingTransaction, setSavingTransaction] =
    useState(false);

  const [transactionError, setTransactionError] =
    useState("");

  // Goal modal
  const [showGoalModal, setShowGoalModal] =
    useState(false);

  const [goalName, setGoalName] = useState("");
  const [goalDescription, setGoalDescription] =
    useState("");
  const [goalTargetAmount, setGoalTargetAmount] =
    useState("");
  const [goalTargetDate, setGoalTargetDate] =
    useState("");

  const [savingGoal, setSavingGoal] = useState(false);
  const [goalError, setGoalError] = useState("");

  const availableCategories = categories.filter(
    (category) => category.type === transactionType
  );

  useEffect(() => {
    fetch("/api/recurring")
      .then((response) => response.ok ? response.json() : [])
      .then((items: RecurringPreview[]) => {
        setRecurringItems(
          items
            .filter((item) => new Date(item.nextDate).getTime() >= todayTimestamp)
            .sort((a, b) => new Date(a.nextDate).getTime() - new Date(b.nextDate).getTime())
            .slice(0, 3)
        );
      })
      .catch(() => setRecurringItems([]));
  }, [todayTimestamp]);

  // --------------------------------------------------
  // TRANSACTION
  // --------------------------------------------------

  const openTransactionModal = async () => {
    setShowTransactionModal(true);
    setTransactionError("");

    if (
      accounts.length > 0 &&
      categories.length > 0
    ) {
      return;
    }

    setLoadingOptions(true);

    try {
      const [
        accountsResponse,
        categoriesResponse,
        cardsResponse,
        loansResponse,
        insuranceResponse,
      ] = await Promise.all([
        fetch("/api/accounts"),
        fetch("/api/categories"),
        fetch("/api/credit-cards"),
        fetch("/api/loans"),
        fetch("/api/insurance"),
      ]);

      if (!accountsResponse.ok) {
        throw new Error("Failed to load accounts");
      }

      if (!categoriesResponse.ok) {
        throw new Error("Failed to load categories");
      }

      const accountsData =
        await accountsResponse.json();

      const categoriesData =
        await categoriesResponse.json();
      const cardsData = cardsResponse.ok ? await cardsResponse.json() : [];
      const loansData = loansResponse.ok ? await loansResponse.json() : [];
      const insuranceData = insuranceResponse.ok ? await insuranceResponse.json() : [];

      setAccounts(accountsData);
      setCategories(categoriesData);
      setLinkedItems({
        credit_card: cardsData.map((item: { id: string; cardName: string; last4: string }) => ({ id: item.id, label: `${item.cardName} ····${item.last4}` })),
        loan: loansData.map((item: { id: string; lender: string }) => ({ id: item.id, label: item.lender })),
        insurance: insuranceData.map((item: { id: string; provider: string; policyNumber: string }) => ({ id: item.id, label: `${item.provider} · ${item.policyNumber}` })),
      });

      if (accountsData.length > 0) {
        setAccountId((current) =>
          current || accountsData[0].id
        );
      }

      const firstExpenseCategory =
        categoriesData.find(
          (category: Category) =>
            category.type === "expense"
        );

      if (firstExpenseCategory) {
        setCategoryId((current) =>
          current || firstExpenseCategory.id
        );
      }
    } catch (error) {
      console.error(
        "Failed to load transaction options:",
        error
      );

      setTransactionError(
        "Could not load your accounts or categories."
      );
    } finally {
      setLoadingOptions(false);
    }
  };

  const closeTransactionModal = () => {
    if (savingTransaction) {
      return;
    }

    setShowTransactionModal(false);
    setTransactionError("");
  };

  const handleTransactionTypeChange = (
    type: TransactionType
  ) => {
    setTransactionType(type);

    const firstCategory = categories.find(
      (category) => category.type === type
    );

    setCategoryId(firstCategory?.id ?? "");
  };

  const handleSaveTransaction = async () => {
    setTransactionError("");

    const numericAmount = Number(amount);

    if (!amount || numericAmount <= 0) {
      setTransactionError(
        "Please enter a valid amount."
      );
      return;
    }

    if (!accountId) {
      setTransactionError(
        "Please select an account."
      );
      return;
    }

    if (!categoryId) {
      setTransactionError(
        "Please select a category."
      );
      return;
    }

    if (linkedType && !linkedId) {
      setTransactionError("Please select the related financial item.");
      return;
    }

    setSavingTransaction(true);

    try {
      const transactionDate = new Date(
        selectedDate
      );

      const now = new Date();

      transactionDate.setHours(
        now.getHours(),
        now.getMinutes(),
        now.getSeconds(),
        0
      );

      const response = await fetch(
        "/api/transactions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            accountId,
            categoryId,
            amount: numericAmount.toFixed(2),
            type: transactionType,
            description:
              description.trim() || undefined,
            transactionDate:
              transactionDate.toISOString(),
            linkedType: linkedType || null,
            linkedId: linkedId || null,
          }),
        }
      );

      if (!response.ok) {
        const errorBody = await response
          .json()
          .catch(() => null);

        throw new Error(
          errorBody?.message ||
            "Failed to save transaction."
        );
      }

      setAmount("");
      setDescription("");
      setTransactionType("expense");
      setLinkedType("");
      setLinkedId("");

      const firstExpenseCategory =
        categories.find(
          (category) =>
            category.type === "expense"
        );

      setCategoryId(
        firstExpenseCategory?.id ?? ""
      );

      setShowTransactionModal(false);

      router.refresh();
    } catch (error) {
      console.error(
        "Failed to save transaction:",
        error
      );

      setTransactionError(
        error instanceof Error
          ? error.message
          : "Failed to save transaction."
      );
    } finally {
      setSavingTransaction(false);
    }
  };

  // --------------------------------------------------
  // GOAL
  // --------------------------------------------------

  const openGoalModal = () => {
    setGoalError("");
    setShowGoalModal(true);
  };

  const closeGoalModal = () => {
    if (savingGoal) {
      return;
    }

    setShowGoalModal(false);
    setGoalError("");
  };

  const handleSaveGoal = async () => {
    setGoalError("");

    const numericTarget = Number(
      goalTargetAmount
    );

    if (!goalName.trim()) {
      setGoalError(
        "Please enter a goal name."
      );
      return;
    }

    if (
      !goalTargetAmount ||
      numericTarget <= 0
    ) {
      setGoalError(
        "Please enter a valid target amount."
      );
      return;
    }

    if (!goalTargetDate) {
      setGoalError(
        "Please select a target date."
      );
      return;
    }

    setSavingGoal(true);

    try {
      const response = await fetch(
        "/api/goals",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: goalName.trim(),
            description:
              goalDescription.trim() ||
              undefined,
            targetAmount:
              numericTarget.toFixed(2),
            targetDate: new Date(
              `${goalTargetDate}T23:59:59`
            ).toISOString(),
          }),
        }
      );

      if (!response.ok) {
        const errorBody = await response
          .json()
          .catch(() => null);

        throw new Error(
          errorBody?.message ||
            "Failed to save goal."
        );
      }

      setGoalName("");
      setGoalDescription("");
      setGoalTargetAmount("");
      setGoalTargetDate("");

      setShowGoalModal(false);

      router.refresh();
    } catch (error) {
      console.error(
        "Failed to save goal:",
        error
      );

      setGoalError(
        error instanceof Error
          ? error.message
          : "Failed to save goal."
      );
    } finally {
      setSavingGoal(false);
    }
  };

  return (
    <aside className="w-full space-y-4">
      {/* Quick add */}
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] p-5 shadow-[var(--shadow-sm)]">
        <div className="flex items-center justify-between">
          <h2 className="text-[17px] font-bold tracking-[-0.03em] text-[var(--text-primary)]">
            Quick Add
          </h2>

          <div className="flex h-8 w-8 items-center justify-center rounded-full border border-[#dce8e1] text-[#078653]">
            <CirclePlus className="h-5 w-5" />
          </div>
        </div>

        <div className="mt-4 space-y-2">
          <QuickAction
            icon={<Receipt className="h-4 w-4" />}
            label="Add Transaction"
            onClick={openTransactionModal}
          />

          <QuickAction
            icon={<Goal className="h-4 w-4" />}
            label="Set a Goal"
            onClick={openGoalModal}
          />

          <QuickAction
            icon={<FilePlus2 className="h-4 w-4" />}
            label="Create a Budget"
            onClick={() => router.push("/budgets")}
          />
        </div>
      </div>

      {/* Upcoming recurring items */}
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] p-5 shadow-[var(--shadow-sm)]">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-[17px] font-bold tracking-[-0.03em] text-[var(--text-primary)]">Upcoming</h2>
            <p className="mt-1 text-[11px] text-[var(--text-muted)]">Scheduled money movement</p>
          </div>
          <CalendarClock className="h-5 w-5 text-[var(--accent)]" />
        </div>
        <div className="mt-4 space-y-2">
          {recurringItems.length > 0 ? recurringItems.map((item) => (
            <button key={item.id} type="button" onClick={() => router.push("/recurring")} className="flex w-full items-center justify-between rounded-xl bg-[var(--surface-subtle)] px-3 py-3 text-left transition hover:bg-[var(--accent-soft)]">
              <span className="min-w-0"><span className="block truncate text-xs font-semibold text-[var(--text-primary)]">{item.title}</span><span className="mt-1 block text-[11px] text-[var(--text-muted)]">{new Date(item.nextDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</span></span>
              <span className={`ml-3 shrink-0 text-xs font-semibold ${item.type === "income" ? "text-[var(--accent)]" : "text-[var(--danger)]"}`}>{item.type === "income" ? "+" : "−"}₹{Number(item.amount).toLocaleString("en-IN")}</span>
            </button>
          )) : <p className="rounded-xl bg-[var(--surface-subtle)] px-3 py-4 text-xs leading-5 text-[var(--text-muted)]">No upcoming recurring items. Add salary, rent, bills, or subscriptions to see them here.</p>}
        </div>
        <button type="button" onClick={() => router.push("/recurring")} className="mt-3 text-xs font-semibold text-[var(--accent)] hover:text-[var(--accent-hover)]">View recurring calendar <span aria-hidden="true">→</span></button>
      </div>

      {/* Add Transaction Modal */}
      {showTransactionModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#10231c]/30 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeTransactionModal();
            }
          }}
        >
          <div className="w-full max-w-md rounded-2xl border border-[#e5ece8] bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-[#10231c]">
                  Add Transaction
                </h2>

                <p className="mt-1 text-xs text-[#60736b]">
                  Record an income or expense.
                </p>
              </div>

              <button
                type="button"
                onClick={closeTransactionModal}
                disabled={savingTransaction}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-xl text-[#60736b] transition hover:bg-[#f1f8f4] hover:text-[#10231c] disabled:cursor-not-allowed disabled:opacity-50"
                aria-label="Close"
              >
                ×
              </button>
            </div>

            <div className="mt-6 space-y-4">
              {/* Amount */}
              <div>
                <label
                  htmlFor="transaction-amount"
                  className="text-xs font-medium text-[#30463d]"
                >
                  Amount
                </label>

                <input
                  id="transaction-amount"
                  type="number"
                  min="0"
                  step="0.01"
                  value={amount}
                  onChange={(event) =>
                    setAmount(event.target.value)
                  }
                  placeholder="₹0"
                  disabled={savingTransaction}
                  className="mt-1.5 w-full rounded-xl border border-[#dfe8e3] px-3 py-2.5 text-sm outline-none transition focus:border-[#16a36a] focus:ring-2 focus:ring-[#16a36a]/10 disabled:bg-[#f7faf8]"
                />
              </div>

              {/* Description */}
              <div>
                <label
                  htmlFor="transaction-description"
                  className="text-xs font-medium text-[#30463d]"
                >
                  Description
                </label>

                <input
                  id="transaction-description"
                  type="text"
                  value={description}
                  onChange={(event) =>
                    setDescription(event.target.value)
                  }
                  placeholder="e.g. Groceries"
                  maxLength={255}
                  disabled={savingTransaction}
                  className="mt-1.5 w-full rounded-xl border border-[#dfe8e3] px-3 py-2.5 text-sm outline-none transition focus:border-[#16a36a] focus:ring-2 focus:ring-[#16a36a]/10 disabled:bg-[#f7faf8]"
                />
              </div>

              {/* Type */}
              <div>
                <p className="text-xs font-medium text-[#30463d]">
                  Transaction type
                </p>

                <div className="mt-1.5 grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() =>
                      handleTransactionTypeChange(
                        "income"
                      )
                    }
                    disabled={savingTransaction}
                    className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
                      transactionType === "income"
                        ? "bg-[#078653] text-white shadow-sm"
                        : "bg-[#edf8f2] text-[#078653] hover:bg-[#e2f4eb]"
                    }`}
                  >
                    Income
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      handleTransactionTypeChange(
                        "expense"
                      )
                    }
                    disabled={savingTransaction}
                    className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
                      transactionType === "expense"
                        ? "bg-[#ff5b5f] text-white shadow-sm"
                        : "bg-[#fff1f1] text-[#ff5b5f] hover:bg-[#ffe5e5]"
                    }`}
                  >
                    Expense
                  </button>
                </div>
              </div>

              {/* Account */}
              <div>
                <label
                  htmlFor="transaction-account"
                  className="text-xs font-medium text-[#30463d]"
                >
                  Account
                </label>

                <select
                  id="transaction-account"
                  value={accountId}
                  onChange={(event) =>
                    setAccountId(event.target.value)
                  }
                  disabled={
                    loadingOptions ||
                    savingTransaction ||
                    accounts.length === 0
                  }
                  className="mt-1.5 w-full rounded-xl border border-[#dfe8e3] bg-white px-3 py-2.5 text-sm text-[#30463d] outline-none transition focus:border-[#16a36a] focus:ring-2 focus:ring-[#16a36a]/10 disabled:bg-[#f7faf8]"
                >
                  <option value="">
                    {loadingOptions
                      ? "Loading accounts..."
                      : "Select account"}
                  </option>

                  {accounts.map((account) => (
                    <option
                      key={account.id}
                      value={account.id}
                    >
                      {account.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Category */}
              <div>
                <label
                  htmlFor="transaction-category"
                  className="text-xs font-medium text-[#30463d]"
                >
                  Category
                </label>

                <select
                  id="transaction-category"
                  value={categoryId}
                  onChange={(event) =>
                    setCategoryId(event.target.value)
                  }
                  disabled={
                    loadingOptions ||
                    savingTransaction ||
                    availableCategories.length === 0
                  }
                  className="mt-1.5 w-full rounded-xl border border-[#dfe8e3] bg-white px-3 py-2.5 text-sm text-[#30463d] outline-none transition focus:border-[#16a36a] focus:ring-2 focus:ring-[#16a36a]/10 disabled:bg-[#f7faf8]"
                >
                  <option value="">
                    {loadingOptions
                      ? "Loading categories..."
                      : "Select category"}
                  </option>

                  {availableCategories.map(
                    (category) => (
                      <option
                        key={category.id}
                        value={category.id}
                      >
                        {category.name}
                      </option>
                    )
                  )}
                </select>
              </div>

              {/* Related financial item */}
              <div>
                <label htmlFor="transaction-linked-type" className="text-xs font-medium text-[#30463d]">
                  Related financial item <span className="text-[#91a09a]">(optional)</span>
                </label>
                <select
                  id="transaction-linked-type"
                  value={linkedType}
                  onChange={(event) => { setLinkedType(event.target.value as typeof linkedType); setLinkedId(""); }}
                  className="mt-1.5 w-full rounded-xl border border-[#dfe8e3] bg-white px-3 py-2.5 text-sm text-[#30463d] outline-none transition focus:border-[#16a36a] focus:ring-2 focus:ring-[#16a36a]/10"
                >
                  <option value="">None — regular account transaction</option>
                  <option value="credit_card">Credit card payment or purchase</option>
                  <option value="loan">Loan repayment</option>
                  <option value="insurance">Insurance premium</option>
                </select>
                {linkedType && (
                  <select
                    value={linkedId}
                    onChange={(event) => setLinkedId(event.target.value)}
                    className="mt-2 w-full rounded-xl border border-[#dfe8e3] bg-white px-3 py-2.5 text-sm text-[#30463d] outline-none transition focus:border-[#16a36a] focus:ring-2 focus:ring-[#16a36a]/10"
                    required
                  >
                    <option value="">Select {linkedType.replace("_", " ")}</option>
                    {linkedItems[linkedType].map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
                  </select>
                )}
              </div>

              {/* Date */}
              <div>
                <label
                  htmlFor="transaction-date"
                  className="text-xs font-medium text-[#30463d]"
                >
                  Date
                </label>

                <input
                  id="transaction-date"
                  type="date"
                  value={dateKey(selectedDate)}
                  onChange={(event) => {
                    const [year, month, day] =
                      event.target.value
                        .split("-")
                        .map(Number);

                    setSelectedDate(
                      new Date(
                        year,
                        month - 1,
                        day
                      )
                    );
                  }}
                  disabled={savingTransaction}
                  className="mt-1.5 w-full rounded-xl border border-[#dfe8e3] px-3 py-2.5 text-sm text-[#30463d] outline-none transition focus:border-[#16a36a] focus:ring-2 focus:ring-[#16a36a]/10 disabled:bg-[#f7faf8]"
                />
              </div>

              {/* Error */}
              {transactionError && (
                <div className="rounded-xl border border-[#ffd5d5] bg-[#fff5f5] px-3 py-2.5 text-xs font-medium text-[#d94449]">
                  {transactionError}
                </div>
              )}

              {/* Save */}
              <button
                type="button"
                onClick={handleSaveTransaction}
                disabled={
                  savingTransaction ||
                  loadingOptions
                }
                className="w-full rounded-xl bg-[#10231c] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#203a30] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {savingTransaction
                  ? "Saving..."
                  : "Save Transaction"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Set a Goal Modal */}
      {showGoalModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#10231c]/30 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeGoalModal();
            }
          }}
        >
          <div className="w-full max-w-md rounded-2xl border border-[#e5ece8] bg-white p-6 shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-[#10231c]">
                  Set a Goal
                </h2>

                <p className="mt-1 text-xs text-[#60736b]">
                  Give your money something to work toward.
                </p>
              </div>

              <button
                type="button"
                onClick={closeGoalModal}
                disabled={savingGoal}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-xl text-[#60736b] transition hover:bg-[#f1f8f4] hover:text-[#10231c] disabled:cursor-not-allowed disabled:opacity-50"
                aria-label="Close"
              >
                ×
              </button>
            </div>

            {/* Form */}
            <div className="mt-6 space-y-4">
              {/* Goal name */}
              <div>
                <label
                  htmlFor="goal-name"
                  className="text-xs font-medium text-[#30463d]"
                >
                  Goal name
                </label>

                <input
                  id="goal-name"
                  type="text"
                  value={goalName}
                  onChange={(event) =>
                    setGoalName(event.target.value)
                  }
                  placeholder="e.g. Emergency Fund"
                  maxLength={100}
                  disabled={savingGoal}
                  className="mt-1.5 w-full rounded-xl border border-[#dfe8e3] px-3 py-2.5 text-sm outline-none transition focus:border-[#16a36a] focus:ring-2 focus:ring-[#16a36a]/10 disabled:bg-[#f7faf8]"
                />
              </div>

              {/* Description */}
              <div>
                <label
                  htmlFor="goal-description"
                  className="text-xs font-medium text-[#30463d]"
                >
                  Description
                  <span className="ml-1 text-[#91a09a]">
                    optional
                  </span>
                </label>

                <input
                  id="goal-description"
                  type="text"
                  value={goalDescription}
                  onChange={(event) =>
                    setGoalDescription(
                      event.target.value
                    )
                  }
                  placeholder="What are you saving for?"
                  maxLength={255}
                  disabled={savingGoal}
                  className="mt-1.5 w-full rounded-xl border border-[#dfe8e3] px-3 py-2.5 text-sm outline-none transition focus:border-[#16a36a] focus:ring-2 focus:ring-[#16a36a]/10 disabled:bg-[#f7faf8]"
                />
              </div>

              {/* Target amount */}
              <div>
                <label
                  htmlFor="goal-target-amount"
                  className="text-xs font-medium text-[#30463d]"
                >
                  Target amount
                </label>

                <input
                  id="goal-target-amount"
                  type="number"
                  min="0"
                  step="0.01"
                  value={goalTargetAmount}
                  onChange={(event) =>
                    setGoalTargetAmount(
                      event.target.value
                    )
                  }
                  placeholder="₹100,000"
                  disabled={savingGoal}
                  className="mt-1.5 w-full rounded-xl border border-[#dfe8e3] px-3 py-2.5 text-sm outline-none transition focus:border-[#16a36a] focus:ring-2 focus:ring-[#16a36a]/10 disabled:bg-[#f7faf8]"
                />
              </div>

              {/* Target date */}
              <div>
                <label
                  htmlFor="goal-target-date"
                  className="text-xs font-medium text-[#30463d]"
                >
                  Target date
                </label>

                <input
                  id="goal-target-date"
                  type="date"
                  value={goalTargetDate}
                  onChange={(event) =>
                    setGoalTargetDate(
                      event.target.value
                    )
                  }
                  disabled={savingGoal}
                  className="mt-1.5 w-full rounded-xl border border-[#dfe8e3] px-3 py-2.5 text-sm text-[#30463d] outline-none transition focus:border-[#16a36a] focus:ring-2 focus:ring-[#16a36a]/10 disabled:bg-[#f7faf8]"
                />
              </div>

              {/* Error */}
              {goalError && (
                <div className="rounded-xl border border-[#ffd5d5] bg-[#fff5f5] px-3 py-2.5 text-xs font-medium text-[#d94449]">
                  {goalError}
                </div>
              )}

              {/* Save */}
              <button
                type="button"
                onClick={handleSaveGoal}
                disabled={savingGoal}
                className="w-full rounded-xl bg-[#10231c] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#203a30] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {savingGoal
                  ? "Saving..."
                  : "Create Goal"}
              </button>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}

function QuickAction({
  icon,
  label,
  onClick,
}: {
  icon: ReactNode;
  label: string;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center justify-between rounded-xl bg-[var(--surface-subtle)] px-3 py-3 text-left transition hover:bg-[var(--accent-soft)]"
    >
      <span className="flex items-center gap-3">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--accent-soft)] text-[var(--accent)]">
          {icon}
        </span>

        <span className="text-[12px] font-medium text-[var(--text-primary)]">
          {label}
        </span>
      </span>

      <ChevronRight className="h-4 w-4 text-[var(--text-muted)]" />
    </button>
  );
}
