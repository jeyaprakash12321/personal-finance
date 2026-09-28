"use client";

import {
  ArrowDownLeft,
  ArrowUpRight,
  Landmark,
  Loader2,
  Plus,
  WalletCards,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useConfirmDialog } from "../../components/ui/dialog-provider";
import { FormEvent, useCallback, useEffect, useState } from "react";

type Account = {
  id: string;
  name: string;
  type:
    | "checking"
    | "savings"
    | "cash"
    | "credit_card"
    | "investment";
  currency: string;
  initialBalance: string;
  currentBalance?: number;
  isActive: boolean;
  createdAt: string;
};

type Transaction = {
  accountId: string;
  amount: string;
  type: "income" | "expense";
};

type AccountType = Account["type"];

const accountTypes: {
  value: AccountType;
  label: string;
}[] = [
  {
    value: "savings",
    label: "Savings",
  },
  {
    value: "checking",
    label: "Checking",
  },
  {
    value: "cash",
    label: "Cash",
  },
  {
    value: "credit_card",
    label: "Credit Card",
  },
  {
    value: "investment",
    label: "Investment",
  },
];

function formatCurrency(
  value: number,
  currency = "INR"
) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function getAccountTypeLabel(
  type: AccountType
) {
  const labels: Record<
    AccountType,
    string
  > = {
    checking: "Checking",
    savings: "Savings",
    cash: "Cash",
    credit_card: "Credit Card",
    investment: "Investment",
  };

  return labels[type];
}

function getAccountIcon(
  type: AccountType
) {
  if (
    type === "credit_card" ||
    type === "cash"
  ) {
    return WalletCards;
  }

  if (type === "investment") {
    return ArrowUpRight;
  }

  return Landmark;
}

export default function AccountsPage() {
  const router = useRouter();
  const { confirm, notify } = useConfirmDialog();

  const [accounts, setAccounts] = useState<
    Account[]
  >([]);

  const [transactions, setTransactions] =
    useState<Transaction[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [showModal, setShowModal] =
    useState(false);

  const [saving, setSaving] =
    useState(false);

  const [formError, setFormError] =
    useState("");

  const [name, setName] =
    useState("");

  const [type, setType] =
    useState<AccountType>("savings");

  const [currency, setCurrency] =
    useState("INR");

  const [initialBalance, setInitialBalance] =
    useState("");

  const [showEditModal, setShowEditModal] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [editName, setEditName] = useState("");
  const [editType, setEditType] = useState<AccountType>("savings");
  const [editCurrency, setEditCurrency] = useState("INR");
  const [editInitialBalance, setEditInitialBalance] = useState("0");

  function openEditModal(account: Account) {
    setEditingAccount(account);
    setEditName(account.name);
    setEditType(account.type);
    setEditCurrency(account.currency);
    setEditInitialBalance(account.initialBalance);
    setFormError("");
    setShowEditModal(true);
  }

  function closeEditModal() {
    if (saving) return;
    setShowEditModal(false);
    setEditingAccount(null);
    setFormError("");
  }

  async function handleUpdateAccount(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editingAccount) return;

    const trimmedName = editName.trim();
    if (!trimmedName) {
      setFormError("Please enter an account name.");
      return;
    }

    setSaving(true);
    setFormError("");

    try {
      const response = await fetch(`/api/accounts/${editingAccount.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: trimmedName,
          type: editType,
          currency: editCurrency,
          initialBalance: editInitialBalance.trim() || "0",
        }),
      });

      const data = await response.json().catch(() => null);
      if (response.status === 401) {
        router.push("/login");
        return;
      }
      if (!response.ok) {
        throw new Error(data?.message || "Failed to update account");
      }

      setShowEditModal(false);
      setEditingAccount(null);
      await loadData();
      router.refresh();
    } catch (error) {
      console.error(error);
      setFormError(error instanceof Error ? error.message : "Failed to update account.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDeactivateAccount(account: Account) {
    if (!(await confirm({ title: "Deactivate account?", description: `"${account.name}" will be archived and hidden from active accounts. Existing transactions will be preserved.`, confirmLabel: "Deactivate", destructive: true }))) {
      return;
    }

    try {
      const response = await fetch(`/api/accounts/${account.id}`, {
        method: "DELETE",
      });

      if (response.status === 401) {
        router.push("/login");
        return;
      }

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        notify(data?.message || "Failed to deactivate account", "error");
        return;
      }

      await loadData();
      router.refresh();
    } catch (error) {
      console.error(error);
      notify("Failed to deactivate account.", "error");
    }
  }

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setFormError("");

      const [
        accountsResponse,
        transactionsResponse,
      ] = await Promise.all([
        fetch("/api/accounts", {
          cache: "no-store",
        }),
        fetch("/api/transactions", {
          cache: "no-store",
        }),
      ]);

      if (
        accountsResponse.status === 401 ||
        transactionsResponse.status === 401
      ) {
        router.push("/login");
        return;
      }

      if (
        !accountsResponse.ok ||
        !transactionsResponse.ok
      ) {
        throw new Error(
          "Failed to load account data"
        );
      }

      const [
        accountsData,
        transactionsData,
      ] = await Promise.all([
        accountsResponse.json(),
        transactionsResponse.json(),
      ]);

      setAccounts(accountsData);
      setTransactions(transactionsData);
    } catch (error) {
      console.error(error);

      setFormError(
        "Unable to load your account data."
      );
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    queueMicrotask(() => void loadData());
  }, [loadData]);

  const activeAccounts =
    accounts.filter(
      (account) => account.isActive
    );

  const getAccountBalance = (
    account: Account
  ) => {
    if (
      typeof account.currentBalance === "number"
    ) {
      return account.currentBalance;
    }

    const accountTransactions =
      transactions.filter(
        (transaction) =>
          transaction.accountId === account.id
      );

    return accountTransactions.reduce(
      (balance, transaction) => {
        const amount = Number(
          transaction.amount
        );

        return transaction.type === "income"
          ? balance + amount
          : balance - amount;
      },
      Number(account.initialBalance)
    );
  };

  const totalBalance =
    activeAccounts.reduce(
      (sum, account) =>
        sum + getAccountBalance(account),
      0
    );

  const totalInitialBalance =
    activeAccounts.reduce(
      (sum, account) =>
        sum + Number(account.initialBalance),
      0
    );

  const totalChange =
    totalBalance - totalInitialBalance;

  function openModal() {
    setName("");
    setType("savings");
    setCurrency("INR");
    setInitialBalance("");
    setFormError("");
    setShowModal(true);
  }

  function closeModal() {
    if (saving) {
      return;
    }

    setShowModal(false);
    setFormError("");
  }

  async function handleCreateAccount(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    const trimmedName = name.trim();

    if (!trimmedName) {
      setFormError(
        "Please enter an account name."
      );
      return;
    }

    const balance =
      initialBalance.trim() || "0";

    if (
      !/^\d+(\.\d{1,2})?$/.test(balance)
    ) {
      setFormError(
        "Initial balance must be a valid amount, such as 25000 or 25000.50."
      );
      return;
    }

    setSaving(true);
    setFormError("");

    try {
      const response = await fetch(
        "/api/accounts",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            name: trimmedName,
            type,
            currency,
            initialBalance:
              Number(balance).toFixed(2),
          }),
        }
      );

      const data = await response
        .json()
        .catch(() => null);

      if (response.status === 401) {
        router.push("/login");
        return;
      }

      if (!response.ok) {
        throw new Error(
          data?.message ||
            "Failed to create account"
        );
      }

      setShowModal(false);

      await loadData();

      router.refresh();
    } catch (error) {
      console.error(error);

      setFormError(
        error instanceof Error
          ? error.message
          : "Failed to create account."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <main className="min-h-screen bg-[#f7faf8] px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-[1400px]">
          {/* Header */}
          <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm font-medium text-[#16a36a]">
                Your money
              </p>

              <h1 className="mt-1 text-3xl font-semibold tracking-[-0.04em] text-[#10231c]">
                Accounts
              </h1>

              <p className="mt-1 max-w-xl text-sm text-[#60736b]">
                See all your accounts and how
                much money you currently have
                available.
              </p>
            </div>

            <button
              type="button"
              onClick={openModal}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#078653] px-5 text-sm font-semibold text-white shadow-[0_8px_20px_rgba(7,134,83,0.18)] transition hover:bg-[#056b43]"
            >
              <Plus className="h-4 w-4" />
              Add Account
            </button>
          </div>

          {loading ? (
            <div className="mt-7 grid gap-4 md:grid-cols-3">
              {[1, 2, 3].map((item) => (
                <div
                  key={item}
                  className="h-[126px] animate-pulse rounded-2xl border border-[#e4ebe7] bg-white"
                />
              ))}
            </div>
          ) : (
            <>
              {/* Summary */}
              <div className="mt-7 grid gap-4 md:grid-cols-3">
                <SummaryCard
                  label="Total balance"
                  value={formatCurrency(
                    totalBalance
                  )}
                  description="Across active accounts"
                  highlight
                />

                <SummaryCard
                  label="Accounts"
                  value={activeAccounts.length.toString()}
                  description="Active accounts"
                />

                <SummaryCard
                  label="Change from starting balance"
                  value={`${
                    totalChange >= 0
                      ? "+"
                      : "-"
                  }${formatCurrency(
                    Math.abs(totalChange)
                  )}`}
                  description="Based on recorded transactions"
                  positive={
                    totalChange >= 0
                  }
                />
              </div>

              {/* Account list */}
              <section className="mt-6">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-bold tracking-[-0.03em] text-[#10231c]">
                      Your accounts
                    </h2>

                    <p className="mt-1 text-sm text-[#91a09a]">
                      Balances update
                      automatically when
                      you record income
                      or expenses.
                    </p>
                  </div>

                  <span className="hidden rounded-full bg-[#e9f8f0] px-3 py-1.5 text-xs font-semibold text-[#078653] sm:inline-flex">
                    {activeAccounts.length}{" "}
                    active
                  </span>
                </div>

                {activeAccounts.length ===
                0 ? (
                  <EmptyAccounts
                    onAddAccount={openModal}
                  />
                ) : (
                  <div className="grid gap-5 lg:grid-cols-2">
                    {activeAccounts.map(
                      (account) => {
                        const Icon =
                          getAccountIcon(
                            account.type
                          );

                        const balance =
                          getAccountBalance(
                            account
                          );

                        const accountTransactions =
                          transactions.filter(
                            (transaction) =>
                              transaction.accountId ===
                              account.id
                          );

                        const income =
                          accountTransactions
                            .filter(
                              (transaction) =>
                                transaction.type ===
                                "income"
                            )
                            .reduce(
                              (
                                sum,
                                transaction
                              ) =>
                                sum +
                                Number(
                                  transaction.amount
                                ),
                              0
                            );

                        const expenses =
                          accountTransactions
                            .filter(
                              (transaction) =>
                                transaction.type ===
                                "expense"
                            )
                            .reduce(
                              (
                                sum,
                                transaction
                              ) =>
                                sum +
                                Number(
                                  transaction.amount
                                ),
                              0
                            );

                        return (
                          <article
                            key={account.id}
                            className="group overflow-hidden rounded-2xl border border-[#e4ebe7] bg-white shadow-[0_8px_30px_rgba(16,35,28,0.04)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_14px_35px_rgba(16,35,28,0.08)]"
                          >
                            {/* Account header */}
                            <div className="flex items-start justify-between border-b border-[#edf1ef] p-5 sm:p-6">
                              <div className="flex min-w-0 items-center gap-4">
                                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#e2f7eb] text-[#078653]">
                                  <Icon
                                    className="h-5 w-5"
                                    strokeWidth={
                                      1.8
                                    }
                                  />
                                </div>

                                <div className="min-w-0">
                                  <h3 className="truncate text-base font-bold tracking-[-0.02em] text-[#10231c]">
                                    {
                                      account.name
                                    }
                                  </h3>

                                  <div className="mt-1 flex items-center gap-2">
                                    <span className="text-xs font-medium text-[#60736b]">
                                      {getAccountTypeLabel(
                                        account.type
                                      )}
                                    </span>

                                    <span className="h-1 w-1 rounded-full bg-[#c7d2cd]" />

                                    <span className="text-xs font-medium text-[#91a09a]">
                                      {
                                        account.currency
                                      }
                                    </span>
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => openEditModal(account)}
                                  className="rounded-lg border border-[#e4ebe7] px-2.5 py-1 text-xs font-semibold text-[#60736b] transition hover:bg-[#f7faf8] hover:text-[#10231c]"
                                >
                                  Edit
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeactivateAccount(account)}
                                  className="rounded-lg border border-[#ffd4d4] px-2.5 py-1 text-xs font-semibold text-[#c74448] transition hover:bg-[#fff5f5]"
                                >
                                  Deactivate
                                </button>
                              </div>
                            </div>

                            {/* Balance */}
                            <div className="p-5 sm:p-6">
                              <p className="text-xs font-medium text-[#91a09a]">
                                Current
                                balance
                              </p>

                              <p className="mt-1 text-3xl font-semibold tracking-[-0.04em] text-[#10231c]">
                                {formatCurrency(
                                  balance,
                                  account.currency
                                )}
                              </p>

                              <div className="mt-6 grid grid-cols-2 gap-3">
                                <div className="rounded-xl bg-[#f7faf8] p-3.5">
                                  <div className="flex items-center gap-2">
                                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#e9f8f0] text-[#078653]">
                                      <ArrowDownLeft className="h-3.5 w-3.5" />
                                    </div>

                                    <span className="text-xs font-medium text-[#91a09a]">
                                      Income
                                    </span>
                                  </div>

                                  <p className="mt-2 text-sm font-semibold text-[#078653]">
                                    {formatCurrency(
                                      income,
                                      account.currency
                                    )}
                                  </p>
                                </div>

                                <div className="rounded-xl bg-[#f7faf8] p-3.5">
                                  <div className="flex items-center gap-2">
                                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#fff0f0] text-[#e05255]">
                                      <ArrowUpRight className="h-3.5 w-3.5" />
                                    </div>

                                    <span className="text-xs font-medium text-[#91a09a]">
                                      Expenses
                                    </span>
                                  </div>

                                  <p className="mt-2 text-sm font-semibold text-[#e05255]">
                                    {formatCurrency(
                                      expenses,
                                      account.currency
                                    )}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </article>
                        );
                      }
                    )}
                  </div>
                )}
              </section>

              {/* Bottom insight */}
              <section className="mt-6 rounded-2xl border border-[#dcefe4] bg-gradient-to-br from-[#eaf8f0] to-[#f7fcf9] p-5 sm:p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-[#10231c]">
                      Keep your balances
                      honest
                    </p>

                    <p className="mt-1 max-w-2xl text-sm leading-6 text-[#60736b]">
                      Wealthly updates
                      account balances
                      from your
                      transactions, so
                      every expense and
                      income entry keeps
                      your financial
                      picture up to date.
                    </p>
                  </div>

                  <div className="shrink-0 rounded-xl bg-white px-4 py-3 shadow-sm">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[#91a09a]">
                      Total tracked
                    </p>

                    <p className="mt-1 text-lg font-bold tracking-[-0.03em] text-[#078653]">
                      {formatCurrency(
                        totalBalance
                      )}
                    </p>
                  </div>
                </div>
              </section>
            </>
          )}
        </div>
      </main>

      {/* Add Account Modal */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#10231c]/30 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              closeModal();
            }
          }}
        >
          <div className="w-full max-w-lg overflow-hidden rounded-3xl border border-[#e4ebe7] bg-white shadow-[0_25px_70px_rgba(16,35,28,0.18)]">
            {/* Modal header */}
            <div className="flex items-start justify-between border-b border-[#edf1ef] p-5 sm:p-6">
              <div>
                <p className="text-sm font-medium text-[#16a36a]">
                  New account
                </p>

                <h2 className="mt-1 text-xl font-bold tracking-[-0.03em] text-[#10231c]">
                  Add an account
                </h2>

                <p className="mt-1 text-sm text-[#91a09a]">
                  Add a bank, cash, card, or
                  investment account.
                </p>
              </div>

              <button
                type="button"
                onClick={closeModal}
                disabled={saving}
                className="flex h-9 w-9 items-center justify-center rounded-xl text-[#91a09a] transition hover:bg-[#f1f8f4] hover:text-[#10231c] disabled:cursor-not-allowed disabled:opacity-50"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Form */}
            <form
              onSubmit={
                handleCreateAccount
              }
              className="p-5 sm:p-6"
            >
              <div className="space-y-5">
                {/* Name */}
                <div>
                  <label
                    htmlFor="account-name"
                    className="text-xs font-semibold text-[#30463d]"
                  >
                    Account name
                  </label>

                  <input
                    id="account-name"
                    type="text"
                    value={name}
                    onChange={(event) =>
                      setName(
                        event.target.value
                      )
                    }
                    placeholder="e.g. HDFC Savings"
                    autoFocus
                    className="mt-2 h-11 w-full rounded-xl border border-[#e4ebe7] bg-[#f8faf9] px-3.5 text-sm text-[#10231c] outline-none transition placeholder:text-[#a5b1ac] focus:border-[#9bd8bb] focus:bg-white focus:ring-4 focus:ring-[#d9f7e9]"
                  />
                </div>

                {/* Type */}
                <div>
                  <label
                    htmlFor="account-type"
                    className="text-xs font-semibold text-[#30463d]"
                  >
                    Account type
                  </label>

                  <select
                    id="account-type"
                    value={type}
                    onChange={(event) =>
                      setType(
                        event.target
                          .value as AccountType
                      )
                    }
                    className="mt-2 h-11 w-full rounded-xl border border-[#e4ebe7] bg-[#f8faf9] px-3.5 text-sm text-[#10231c] outline-none transition focus:border-[#9bd8bb] focus:bg-white focus:ring-4 focus:ring-[#d9f7e9]"
                  >
                    {accountTypes.map(
                      (accountType) => (
                        <option
                          key={
                            accountType.value
                          }
                          value={
                            accountType.value
                          }
                        >
                          {
                            accountType.label
                          }
                        </option>
                      )
                    )}
                  </select>
                </div>

                {/* Currency + balance */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="account-currency"
                      className="text-xs font-semibold text-[#30463d]"
                    >
                      Currency
                    </label>

                    <select
                      id="account-currency"
                      value={currency}
                      onChange={(event) =>
                        setCurrency(
                          event.target.value
                        )
                      }
                      className="mt-2 h-11 w-full rounded-xl border border-[#e4ebe7] bg-[#f8faf9] px-3.5 text-sm text-[#10231c] outline-none transition focus:border-[#9bd8bb] focus:bg-white focus:ring-4 focus:ring-[#d9f7e9]"
                    >
                      <option value="INR">
                        INR — Indian Rupee
                      </option>

                      <option value="USD">
                        USD — US Dollar
                      </option>

                      <option value="EUR">
                        EUR — Euro
                      </option>

                      <option value="GBP">
                        GBP — British Pound
                      </option>
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="initial-balance"
                      className="text-xs font-semibold text-[#30463d]"
                    >
                      Initial balance
                    </label>

                    <input
                      id="initial-balance"
                      type="text"
                      inputMode="decimal"
                      value={
                        initialBalance
                      }
                      onChange={(event) =>
                        setInitialBalance(
                          event.target.value
                        )
                      }
                      placeholder="25000.00"
                      className="mt-2 h-11 w-full rounded-xl border border-[#e4ebe7] bg-[#f8faf9] px-3.5 text-sm text-[#10231c] outline-none transition placeholder:text-[#a5b1ac] focus:border-[#9bd8bb] focus:bg-white focus:ring-4 focus:ring-[#d9f7e9]"
                    />
                  </div>
                </div>

                {formError && (
                  <div className="rounded-xl border border-[#ffd4d4] bg-[#fff5f5] px-3.5 py-3 text-sm text-[#c74448]">
                    {formError}
                  </div>
                )}

                {/* Actions */}
                <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={closeModal}
                    disabled={saving}
                    className="h-11 rounded-xl border border-[#e4ebe7] bg-white px-5 text-sm font-semibold text-[#60736b] transition hover:bg-[#f7faf8] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={saving}
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#078653] px-5 text-sm font-semibold text-white shadow-[0_8px_20px_rgba(7,134,83,0.18)] transition hover:bg-[#056b43] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {saving && (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    )}

                    {saving
                      ? "Creating..."
                      : "Create Account"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Account Modal */}
      {showEditModal && editingAccount && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#10231c]/30 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeEditModal();
            }
          }}
        >
          <div className="w-full max-w-lg overflow-hidden rounded-3xl border border-[#e4ebe7] bg-white shadow-[0_25px_70px_rgba(16,35,28,0.18)]">
            <div className="flex items-start justify-between border-b border-[#edf1ef] p-5 sm:p-6">
              <div>
                <p className="text-sm font-medium text-[#16a36a]">Edit Account</p>
                <h2 className="mt-1 text-xl font-bold tracking-[-0.03em] text-[#10231c]">
                  Update {editingAccount.name}
                </h2>
              </div>
              <button
                type="button"
                onClick={closeEditModal}
                disabled={saving}
                className="flex h-9 w-9 items-center justify-center rounded-xl text-[#91a09a] transition hover:bg-[#f1f8f4] hover:text-[#10231c] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateAccount} className="p-5 sm:p-6">
              <div className="space-y-5">
                <div>
                  <label htmlFor="edit-account-name" className="text-xs font-semibold text-[#30463d]">
                    Account name
                  </label>
                  <input
                    id="edit-account-name"
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="mt-2 h-11 w-full rounded-xl border border-[#e4ebe7] bg-[#f8faf9] px-3.5 text-sm text-[#10231c] outline-none transition focus:border-[#9bd8bb] focus:bg-white focus:ring-4 focus:ring-[#d9f7e9]"
                  />
                </div>

                <div>
                  <label htmlFor="edit-account-type" className="text-xs font-semibold text-[#30463d]">
                    Account type
                  </label>
                  <select
                    id="edit-account-type"
                    value={editType}
                    onChange={(e) => setEditType(e.target.value as AccountType)}
                    className="mt-2 h-11 w-full rounded-xl border border-[#e4ebe7] bg-[#f8faf9] px-3.5 text-sm text-[#10231c] outline-none transition focus:border-[#9bd8bb] focus:bg-white focus:ring-4 focus:ring-[#d9f7e9]"
                  >
                    {accountTypes.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="edit-account-currency" className="text-xs font-semibold text-[#30463d]">
                    Currency
                  </label>
                  <select
                    id="edit-account-currency"
                    value={editCurrency}
                    onChange={(e) => setEditCurrency(e.target.value)}
                    className="mt-2 h-11 w-full rounded-xl border border-[#e4ebe7] bg-[#f8faf9] px-3.5 text-sm text-[#10231c] outline-none transition focus:border-[#9bd8bb] focus:bg-white focus:ring-4 focus:ring-[#d9f7e9]"
                  >
                    <option value="INR">INR — Indian Rupee</option>
                    <option value="USD">USD — US Dollar</option>
                    <option value="EUR">EUR — Euro</option>
                    <option value="GBP">GBP — British Pound</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="edit-account-balance" className="text-xs font-semibold text-[#30463d]">
                    Starting balance
                  </label>
                  <input
                    id="edit-account-balance"
                    type="number"
                    step="0.01"
                    value={editInitialBalance}
                    onChange={(e) => setEditInitialBalance(e.target.value)}
                    className="mt-2 h-11 w-full rounded-xl border border-[#e4ebe7] bg-[#f8faf9] px-3.5 text-sm text-[#10231c] outline-none transition focus:border-[#9bd8bb] focus:bg-white focus:ring-4 focus:ring-[#d9f7e9]"
                  />
                  <p className="mt-1 text-xs text-[#71817a]">Transactions remain unchanged; this updates the account’s opening balance.</p>
                </div>

                {formError && (
                  <div className="rounded-xl border border-[#ffd4d4] bg-[#fff5f5] px-3.5 py-3 text-sm text-[#c74448]">
                    {formError}
                  </div>
                )}

                <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={closeEditModal}
                    disabled={saving}
                    className="h-11 rounded-xl border border-[#e4ebe7] bg-white px-5 text-sm font-semibold text-[#60736b] transition hover:bg-[#f7faf8] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#078653] px-5 text-sm font-semibold text-white shadow-[0_8px_20px_rgba(7,134,83,0.18)] transition hover:bg-[#056b43] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                    {saving ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </div>
            </form>
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
  highlight = false,
  positive = false,
}: {
  label: string;
  value: string;
  description: string;
  highlight?: boolean;
  positive?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border p-5 shadow-[0_8px_30px_rgba(16,35,28,0.04)] ${
        highlight
          ? "border-[#ccebd9] bg-gradient-to-br from-[#e7f8ee] to-white"
          : "border-[#e4ebe7] bg-white"
      }`}
    >
      <p className="text-xs font-medium text-[#91a09a]">
        {label}
      </p>

      <p
        className={`mt-2 text-2xl font-semibold tracking-[-0.04em] ${
          highlight || positive
            ? "text-[#078653]"
            : "text-[#10231c]"
        }`}
      >
        {value}
      </p>

      <p className="mt-1 text-xs text-[#91a09a]">
        {description}
      </p>
    </div>
  );
}

function EmptyAccounts({
  onAddAccount,
}: {
  onAddAccount: () => void;
}) {
  return (
    <div className="rounded-2xl border border-[#e4ebe7] bg-white px-6 py-16 text-center shadow-[0_8px_30px_rgba(16,35,28,0.04)]">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#e9f8f0] text-[#078653]">
        <Landmark className="h-6 w-6" />
      </div>

      <h3 className="mt-4 text-base font-bold text-[#10231c]">
        No accounts yet
      </h3>

      <p className="mx-auto mt-1 max-w-sm text-sm leading-6 text-[#91a09a]">
        Add your first bank, savings, cash,
        or investment account to start
        tracking your money.
      </p>

      <button
        type="button"
        onClick={onAddAccount}
        className="mt-5 inline-flex h-10 items-center gap-2 rounded-xl bg-[#078653] px-4 text-sm font-semibold text-white transition hover:bg-[#056b43]"
      >
        <Plus className="h-4 w-4" />
        Add Account
      </button>
    </div>
  );
}
