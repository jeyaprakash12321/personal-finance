"use client";

import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  CirclePlus,
  FilePlus2,
  Goal,
  Receipt,
} from "lucide-react";
import { useMemo, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";

type Transaction = {
  transactionDate: string;
};

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

type TransactionType = "income" | "expense";

type RightRailProps = {
  transactions?: Transaction[];
};

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

function getCalendarDays(monthDate: Date) {
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);

  // Convert Sunday = 0 into Monday = 0.
  const firstWeekday = (firstDay.getDay() + 6) % 7;

  const daysInMonth = lastDay.getDate();

  const previousMonthLastDay = new Date(
    year,
    month,
    0
  ).getDate();

  const days: {
    date: Date;
    currentMonth: boolean;
  }[] = [];

  // Previous month's trailing days
  for (let i = firstWeekday - 1; i >= 0; i--) {
    days.push({
      date: new Date(
        year,
        month - 1,
        previousMonthLastDay - i
      ),
      currentMonth: false,
    });
  }

  // Current month
  for (let day = 1; day <= daysInMonth; day++) {
    days.push({
      date: new Date(year, month, day),
      currentMonth: true,
    });
  }

  // Next month's leading days
  let nextDay = 1;

  while (days.length % 7 !== 0) {
    days.push({
      date: new Date(year, month + 1, nextDay),
      currentMonth: false,
    });

    nextDay++;
  }

  return days;
}

export function RightRail({
  transactions = [],
}: RightRailProps) {
  const router = useRouter();

  const today = startOfDay(new Date());

  const [currentMonth, setCurrentMonth] = useState(
    new Date(
      today.getFullYear(),
      today.getMonth(),
      1
    )
  );

  const [selectedDate, setSelectedDate] =
    useState(today);

  // Transaction modal
  const [showTransactionModal, setShowTransactionModal] =
    useState(false);

  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

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

  const calendarDays = useMemo(
    () => getCalendarDays(currentMonth),
    [currentMonth]
  );

  const transactionDates = useMemo(() => {
    return new Set(
      transactions.map((transaction) =>
        dateKey(new Date(transaction.transactionDate))
      )
    );
  }, [transactions]);

  const monthLabel = new Intl.DateTimeFormat("en-IN", {
    month: "long",
    year: "numeric",
  }).format(currentMonth);

  const availableCategories = categories.filter(
    (category) => category.type === transactionType
  );

  const goToPreviousMonth = () => {
    setCurrentMonth(
      (current) =>
        new Date(
          current.getFullYear(),
          current.getMonth() - 1,
          1
        )
    );
  };

  const goToNextMonth = () => {
    setCurrentMonth(
      (current) =>
        new Date(
          current.getFullYear(),
          current.getMonth() + 1,
          1
        )
    );
  };

  const goToToday = () => {
    setCurrentMonth(
      new Date(
        today.getFullYear(),
        today.getMonth(),
        1
      )
    );

    setSelectedDate(today);
  };

  const isToday = (date: Date) =>
    dateKey(date) === dateKey(today);

  const isSelected = (date: Date) =>
    dateKey(date) === dateKey(selectedDate);

  const hasTransaction = (date: Date) =>
    transactionDates.has(dateKey(date));

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
      ] = await Promise.all([
        fetch("http://localhost:4000/accounts"),
        fetch("http://localhost:4000/categories"),
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

      setAccounts(accountsData);
      setCategories(categoriesData);

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
        "http://localhost:4000/transactions",
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
        "http://localhost:4000/goals",
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
      {/* Quote card */}
      <div className="relative h-[232px] overflow-hidden rounded-2xl bg-gradient-to-br from-[#466a6d] via-[#5f7b7c] to-[#263f40] p-6 text-white shadow-[0_10px_30px_rgba(16,35,28,0.08)]">
        <div className="absolute -right-8 bottom-[-25px] text-[110px] opacity-20">
          🌿
        </div>

        <div className="relative z-10">
          <p className="max-w-[205px] pt-5 text-[18px] font-medium leading-7 tracking-[-0.02em]">
            Discipline today,
            <br />
            freedom tomorrow.
          </p>

          <div className="mt-6 h-px w-20 bg-white/50" />
        </div>
      </div>

      {/* Calendar */}
      <div className="rounded-2xl border border-[#e5ece8] bg-white p-5 shadow-[0_8px_30px_rgba(16,35,28,0.04)]">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-[16px] font-bold tracking-[-0.02em] text-[#10231c]">
              {monthLabel}
            </h2>

            <button
              type="button"
              onClick={goToToday}
              className="mt-1 text-[11px] font-medium text-[#078653] hover:text-[#056b43]"
            >
              Today
            </button>
          </div>

          <div className="flex gap-1">
            <button
              type="button"
              onClick={goToPreviousMonth}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#edf1ef] text-[#60736b] transition hover:bg-[#f5f9f7]"
              aria-label="Previous month"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            <button
              type="button"
              onClick={goToNextMonth}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#edf1ef] text-[#60736b] transition hover:bg-[#f5f9f7]"
              aria-label="Next month"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Weekdays */}
        <div className="mt-5 grid grid-cols-7">
          {[
            "Mon",
            "Tue",
            "Wed",
            "Thu",
            "Fri",
            "Sat",
            "Sun",
          ].map((day) => (
            <span
              key={day}
              className="text-center text-[10px] font-semibold uppercase tracking-wide text-[#9aa8a2]"
            >
              {day.slice(0, 1)}
            </span>
          ))}
        </div>

        {/* Calendar days */}
        <div className="mt-3 grid grid-cols-7 gap-y-1">
          {calendarDays.map(
            ({
              date,
              currentMonth: isCurrentMonth,
            }) => {
              const todayDate = isToday(date);
              const selected = isSelected(date);
              const transaction =
                hasTransaction(date);

              return (
                <button
                  key={dateKey(date)}
                  type="button"
                  onClick={() =>
                    setSelectedDate(date)
                  }
                  className="group relative flex h-9 items-center justify-center"
                  aria-label={new Intl.DateTimeFormat(
                    "en-IN",
                    {
                      dateStyle: "full",
                    }
                  ).format(date)}
                >
                  <span
                    className={`
                      flex h-8 w-8 items-center justify-center rounded-full
                      text-[11px] transition-all
                      ${
                        selected
                          ? "bg-[#087d50] font-semibold text-white shadow-sm"
                          : todayDate
                            ? "border border-[#16a36a] font-semibold text-[#078653]"
                            : isCurrentMonth
                              ? "text-[#50665c] hover:bg-[#edf8f2]"
                              : "text-[#c5cec9]"
                      }
                    `}
                  >
                    {date.getDate()}
                  </span>

                  {transaction && (
                    <span
                      className={`
                        absolute bottom-0.5 h-1 w-1 rounded-full
                        ${
                          selected
                            ? "bg-white"
                            : "bg-[#16a36a]"
                        }
                      `}
                    />
                  )}
                </button>
              );
            }
          )}
        </div>

        {/* Selected date */}
        <div className="mt-4 border-t border-[#edf1ef] pt-3">
          <p className="text-[11px] text-[#91a09a]">
            Selected date
          </p>

          <p className="mt-1 text-[12px] font-semibold text-[#30463d]">
            {new Intl.DateTimeFormat("en-IN", {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
            }).format(selectedDate)}
          </p>
        </div>
      </div>

      {/* Quick add */}
      <div className="rounded-2xl border border-[#e5ece8] bg-white p-5 shadow-[0_8px_30px_rgba(16,35,28,0.04)]">
        <div className="flex items-center justify-between">
          <h2 className="text-[17px] font-bold tracking-[-0.03em] text-[#10231c]">
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
          />
        </div>
      </div>

      {/* Upgrade card */}
      <div className="rounded-2xl bg-gradient-to-br from-[#e4f8ec] to-[#f1fbf5] p-5">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#ffe9a8] text-lg">
            👑
          </div>

          <div className="min-w-0">
            <p className="text-sm font-bold text-[#10231c]">
              Upgrade to Pro
            </p>

            <p className="mt-1 text-[11px] leading-5 text-[#60736b]">
              Get advanced insights, unlimited goals and
              more.
            </p>
          </div>

          <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-[#10231c]" />
        </div>
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
      className="flex w-full items-center justify-between rounded-xl bg-[#f7faf8] px-3 py-3 text-left transition hover:bg-[#edf8f2]"
    >
      <span className="flex items-center gap-3">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#e5f7ed] text-[#078653]">
          {icon}
        </span>

        <span className="text-[12px] font-medium text-[#30463d]">
          {label}
        </span>
      </span>

      <ChevronRight className="h-4 w-4 text-[#91a09a]" />
    </button>
  );
}