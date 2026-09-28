"use client";

import { useCallback, useEffect, useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useConfirmDialog } from "../../components/ui/dialog-provider";
import {
  Building2,
  Coins,
  CreditCard,
  GraduationCap,
  Home,
  Loader2,
  Plus,
  Trash2,
  Car,
  X,
} from "lucide-react";

type Loan = {
  id: string;
  lender: string;
  loanType: "personal" | "home" | "vehicle" | "education" | "other";
  originalPrincipal: string;
  currentOutstanding: string;
  interestRate: string;
  emi: string;
  startDate: string;
  endDate: string | null;
  paymentFrequency: string;
  paidAmount: number;
  progressPercentage: number;
  remainingEMIs: number;
};

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

function getLoanTypeLabel(type: Loan["loanType"]) {
  const labels: Record<Loan["loanType"], string> = {
    personal: "Personal Loan",
    home: "Home Loan",
    vehicle: "Vehicle Loan",
    education: "Education Loan",
    other: "Other Loan",
  };
  return labels[type];
}

function getLoanIcon(type: Loan["loanType"]) {
  switch (type) {
    case "home":
      return Home;
    case "vehicle":
      return Car;
    case "education":
      return GraduationCap;
    case "personal":
      return CreditCard;
    default:
      return Building2;
  }
}

export default function LoansPage() {
  const { confirm, notify } = useConfirmDialog();
  const router = useRouter();

  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null);

  // Form inputs
  const [lender, setLender] = useState("");
  const [loanType, setLoanType] = useState<Loan["loanType"]>("personal");
  const [originalPrincipal, setOriginalPrincipal] = useState("");
  const [currentOutstanding, setCurrentOutstanding] = useState("");
  const [interestRate, setInterestRate] = useState("9.50");
  const [emi, setEmi] = useState("");
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));

  const [paymentAmount, setPaymentAmount] = useState("");

  const loadLoans = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const res = await fetch("/api/loans");
      if (res.status === 401) {
        router.push("/login");
        return;
      }
      if (!res.ok) throw new Error("Failed to load loans");
      const data = await res.json();
      setLoans(data);
    } catch (err) {
      console.error(err);
      setError("Unable to load loans data.");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    queueMicrotask(() => void loadLoans());
  }, [loadLoans]);

  const totalOutstanding = loans.reduce((sum, l) => sum + Number(l.currentOutstanding), 0);
  const totalOriginal = loans.reduce((sum, l) => sum + Number(l.originalPrincipal), 0);
  const totalPaid = Math.max(0, totalOriginal - totalOutstanding);
  const totalMonthlyEmi = loans.reduce((sum, l) => sum + Number(l.emi), 0);

  function resetForm() {
    setLender("");
    setLoanType("personal");
    setOriginalPrincipal("");
    setCurrentOutstanding("");
    setInterestRate("9.50");
    setEmi("");
    setStartDate(new Date().toISOString().slice(0, 10));
    setError("");
  }

  function openAddModal() {
    resetForm();
    setShowAddModal(true);
  }

  function openEditModal(loan: Loan) {
    setSelectedLoan(loan);
    setLender(loan.lender);
    setLoanType(loan.loanType);
    setOriginalPrincipal(loan.originalPrincipal);
    setCurrentOutstanding(loan.currentOutstanding);
    setInterestRate(loan.interestRate);
    setEmi(loan.emi);
    setStartDate(new Date(loan.startDate).toISOString().slice(0, 10));
    setError("");
    setShowEditModal(true);
  }

  function openPaymentModal(loan: Loan) {
    setSelectedLoan(loan);
    setPaymentAmount(loan.emi);
    setError("");
    setShowPaymentModal(true);
  }

  async function handleAddLoan(e: FormEvent) {
    e.preventDefault();
    if (!lender.trim() || !originalPrincipal || !currentOutstanding || !emi) {
      setError("Please fill in all required fields.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const res = await fetch("/api/loans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lender: lender.trim(),
          loanType,
          originalPrincipal: Number(originalPrincipal),
          currentOutstanding: Number(currentOutstanding),
          interestRate: Number(interestRate),
          emi: Number(emi),
          startDate: new Date(startDate).toISOString(),
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.message || "Failed to add loan");
      }

      setShowAddModal(false);
      await loadLoans();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error adding loan.");
    } finally {
      setSaving(false);
    }
  }

  async function handleUpdateLoan(e: FormEvent) {
    e.preventDefault();
    if (!selectedLoan) return;

    setSaving(true);
    setError("");

    try {
      const res = await fetch(`/api/loans/${selectedLoan.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lender: lender.trim(),
          loanType,
          originalPrincipal: Number(originalPrincipal),
          currentOutstanding: Number(currentOutstanding),
          interestRate: Number(interestRate),
          emi: Number(emi),
          startDate: new Date(startDate).toISOString(),
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.message || "Failed to update loan");
      }

      setShowEditModal(false);
      setSelectedLoan(null);
      await loadLoans();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error updating loan.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteLoan(loan: Loan) {
    if (!(await confirm({ title: "Delete loan?", description: `${loan.lender} ${getLoanTypeLabel(loan.loanType)} and its payment tracking will be removed.`, confirmLabel: "Delete loan", destructive: true }))) return;

    try {
      const res = await fetch(`/api/loans/${loan.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete loan");
      await loadLoans();
    } catch {
      notify("Failed to delete loan.", "error");
    }
  }

  async function handleRecordEmi(e: FormEvent) {
    e.preventDefault();
    if (!selectedLoan || !paymentAmount || Number(paymentAmount) <= 0) {
      setError("Please enter a valid EMI payment amount.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const res = await fetch(`/api/loans/${selectedLoan.id}/payment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: Number(paymentAmount) }),
      });

      if (!res.ok) throw new Error("Failed to record EMI payment");

      setShowPaymentModal(false);
      setSelectedLoan(null);
      await loadLoans();
    } catch {
      setError("Failed to record EMI payment.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f7faf8] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1400px]">
        {/* Header */}
        <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-medium text-[#16a36a]">Liability & Borrowing</p>
            <h1 className="mt-1 text-3xl font-semibold tracking-[-0.04em] text-[#10231c]">
              Loan Management
            </h1>
            <p className="mt-1 max-w-xl text-sm text-[#60736b]">
              Track personal loans, home loans, vehicle loans, education loans, and EMI payoff timelines.
            </p>
          </div>

          <button
            type="button"
            onClick={openAddModal}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#078653] px-5 text-sm font-semibold text-white shadow-[0_8px_20px_rgba(7,134,83,0.18)] transition hover:bg-[#056b43]"
          >
            <Plus className="h-4 w-4" />
            Add Loan
          </button>
        </div>

        {/* Summary Cards */}
        <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <SummaryCard
            label="Total Loan Debt"
            value={formatCurrency(totalOutstanding)}
            description="Current balance remaining"
            alert={totalOutstanding > 0}
          />
          <SummaryCard
            label="Principal Paid Off"
            value={formatCurrency(totalPaid)}
            description="Total principal paid"
            positive
          />
          <SummaryCard
            label="Monthly EMI Obligation"
            value={formatCurrency(totalMonthlyEmi)}
            description="Combined monthly EMIs"
          />
          <SummaryCard
            label="Active Loans"
            value={loans.length.toString()}
            description="Tracked accounts"
          />
        </div>

        {/* Loans List */}
        <section className="mt-8">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold tracking-[-0.03em] text-[#10231c]">
              Your Loans ({loans.length})
            </h2>
          </div>

          {loading ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2].map((i) => (
                <div key={i} className="h-64 animate-pulse rounded-2xl border border-[#e4ebe7] bg-white" />
              ))}
            </div>
          ) : loans.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[#cddbd4] bg-white p-12 text-center shadow-[0_8px_30px_rgba(16,35,28,0.04)]">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#edf8f2] text-[#078653]">
                <Coins className="h-7 w-7" />
              </div>
              <h3 className="mt-4 text-base font-bold text-[#10231c]">No loans tracked</h3>
              <p className="mt-1 text-sm text-[#91a09a]">Add home loans, car loans, or personal loans to track payoff schedules.</p>
              <button
                type="button"
                onClick={openAddModal}
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#078653] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#056b43]"
              >
                <Plus className="h-4 w-4" />
                Add Loan
              </button>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {loans.map((loan) => {
                const Icon = getLoanIcon(loan.loanType);
                const principal = Number(loan.originalPrincipal);
                const outstanding = Number(loan.currentOutstanding);
                const emi = Number(loan.emi);

                return (
                  <div
                    key={loan.id}
                    className="group relative overflow-hidden rounded-2xl border border-[#e4ebe7] bg-white p-6 shadow-[0_8px_30px_rgba(16,35,28,0.04)] transition hover:-translate-y-0.5 hover:shadow-[0_14px_35px_rgba(16,35,28,0.08)]"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#edf8f2] text-[#078653]">
                          <Icon className="h-5 w-5" />
                        </div>
                        <div>
                          <h3 className="text-base font-bold text-[#10231c]">{loan.lender}</h3>
                          <p className="text-xs text-[#60736b]">{getLoanTypeLabel(loan.loanType)}</p>
                        </div>
                      </div>
                      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold text-slate-700">
                        {loan.interestRate}% p.a.
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="mt-6">
                      <div className="flex items-baseline justify-between">
                        <span className="text-xs text-[#91a09a]">Outstanding Dues</span>
                        <span className="text-xs text-[#91a09a]">Original</span>
                      </div>
                      <div className="mt-1 flex items-baseline justify-between">
                        <span className="text-2xl font-bold tracking-[-0.03em] text-[#10231c]">
                          {formatCurrency(outstanding)}
                        </span>
                        <span className="text-xs font-semibold text-[#60736b]">
                          {formatCurrency(principal)}
                        </span>
                      </div>

                      <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#f1f8f4]">
                        <div
                          className="h-full rounded-full bg-[#16a36a] transition-all duration-500"
                          style={{ width: `${Math.min(100, loan.progressPercentage)}%` }}
                        />
                      </div>
                      <p className="mt-1.5 text-right text-[11px] font-medium text-[#60736b]">
                        {loan.progressPercentage}% Paid Off
                      </p>
                    </div>

                    {/* EMI Info Box */}
                    <div className="mt-4 rounded-xl border border-[#edf1ef] bg-[#f8faf9] p-3.5 flex items-center justify-between text-xs">
                      <div>
                        <p className="text-[10px] text-[#91a09a]">Monthly EMI</p>
                        <p className="font-bold text-[#10231c] text-sm">{formatCurrency(emi)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] text-[#91a09a]">Remaining Term</p>
                        <p className="font-semibold text-[#078653]">{loan.remainingEMIs} EMIs Left</p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="mt-6 flex items-center gap-2 pt-2 border-t border-[#edf1ef]">
                      <button
                        type="button"
                        onClick={() => openPaymentModal(loan)}
                        className="flex-1 rounded-xl bg-[#078653] py-2 text-xs font-semibold text-white transition hover:bg-[#056b43]"
                      >
                        Record EMI
                      </button>
                      <button
                        type="button"
                        onClick={() => openEditModal(loan)}
                        className="rounded-xl border border-[#e4ebe7] px-3 py-2 text-xs font-semibold text-[#60736b] transition hover:bg-[#f7faf8]"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteLoan(loan)}
                        className="rounded-xl border border-[#ffd4d4] p-2 text-[#c74448] transition hover:bg-[#fff5f5]"
                        title="Delete loan"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>

      {/* Add / Edit Modal */}
      {(showAddModal || showEditModal) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#10231c]/30 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-3xl border border-[#e4ebe7] bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#edf1ef] pb-4">
              <h2 className="text-xl font-bold text-[#10231c]">
                {showEditModal ? "Edit Loan" : "Add New Loan"}
              </h2>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setShowEditModal(false);
                }}
                className="rounded-lg p-1 text-[#91a09a] hover:bg-[#f1f8f4]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form
              onSubmit={showEditModal ? handleUpdateLoan : handleAddLoan}
              className="mt-5 space-y-4"
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-[#30463d]">Lender / Bank</label>
                  <input
                    type="text"
                    value={lender}
                    onChange={(e) => setLender(e.target.value)}
                    placeholder="e.g. HDFC Ltd"
                    className="mt-1 h-11 w-full rounded-xl border border-[#e4ebe7] bg-[#f8faf9] px-3 text-sm outline-none focus:border-[#078653] focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#30463d]">Loan Type</label>
                  <select
                    value={loanType}
                    onChange={(e) => setLoanType(e.target.value as Loan["loanType"])}
                    className="mt-1 h-11 w-full rounded-xl border border-[#e4ebe7] bg-[#f8faf9] px-3 text-sm outline-none focus:border-[#078653] focus:bg-white"
                  >
                    <option value="personal">Personal Loan</option>
                    <option value="home">Home Loan</option>
                    <option value="vehicle">Vehicle Loan</option>
                    <option value="education">Education Loan</option>
                    <option value="other">Other Loan</option>
                  </select>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-[#30463d]">Original Principal (₹)</label>
                  <input
                    type="number"
                    value={originalPrincipal}
                    onChange={(e) => setOriginalPrincipal(e.target.value)}
                    placeholder="500000"
                    className="mt-1 h-11 w-full rounded-xl border border-[#e4ebe7] bg-[#f8faf9] px-3 text-sm outline-none focus:border-[#078653] focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#30463d]">Current Outstanding (₹)</label>
                  <input
                    type="number"
                    value={currentOutstanding}
                    onChange={(e) => setCurrentOutstanding(e.target.value)}
                    placeholder="350000"
                    className="mt-1 h-11 w-full rounded-xl border border-[#e4ebe7] bg-[#f8faf9] px-3 text-sm outline-none focus:border-[#078653] focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-[#30463d]">Interest Rate (% p.a.)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={interestRate}
                    onChange={(e) => setInterestRate(e.target.value)}
                    placeholder="9.50"
                    className="mt-1 h-11 w-full rounded-xl border border-[#e4ebe7] bg-[#f8faf9] px-3 text-sm outline-none focus:border-[#078653] focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#30463d]">Monthly EMI (₹)</label>
                  <input
                    type="number"
                    value={emi}
                    onChange={(e) => setEmi(e.target.value)}
                    placeholder="12500"
                    className="mt-1 h-11 w-full rounded-xl border border-[#e4ebe7] bg-[#f8faf9] px-3 text-sm outline-none focus:border-[#078653] focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#30463d]">Start Date</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="mt-1 h-11 w-full rounded-xl border border-[#e4ebe7] bg-[#f8faf9] px-3 text-sm outline-none focus:border-[#078653] focus:bg-white"
                />
              </div>

              {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-600">
                  {error}
                </div>
              )}

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setShowEditModal(false);
                  }}
                  className="h-11 rounded-xl border border-[#e4ebe7] px-4 text-xs font-semibold text-[#60736b]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#078653] px-5 text-xs font-semibold text-white shadow-sm hover:bg-[#056b43]"
                >
                  {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                  {showEditModal ? "Save Changes" : "Add Loan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && selectedLoan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#10231c]/30 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-[#e4ebe7] bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#edf1ef] pb-4">
              <div>
                <h2 className="text-lg font-bold text-[#10231c]">Record EMI Payment</h2>
                <p className="text-xs text-[#60736b]">
                  {selectedLoan.lender} ({getLoanTypeLabel(selectedLoan.loanType)})
                </p>
              </div>
              <button onClick={() => setShowPaymentModal(false)} className="rounded-lg p-1 text-[#91a09a]">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleRecordEmi} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#30463d]">
                  Current Outstanding: {formatCurrency(Number(selectedLoan.currentOutstanding))}
                </label>
                <div className="relative mt-2">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[#91a09a]">
                    ₹
                  </span>
                  <input
                    type="number"
                    min={1}
                    step="0.01"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    placeholder="12500"
                    autoFocus
                    className="h-11 w-full rounded-xl border border-[#e4ebe7] bg-[#f8faf9] pl-8 pr-3 text-sm outline-none focus:border-[#078653] focus:bg-white"
                  />
                </div>
              </div>

              {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-600">
                  {error}
                </div>
              )}

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  className="h-11 rounded-xl border border-[#e4ebe7] px-4 text-xs font-semibold text-[#60736b]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#078653] px-5 text-xs font-semibold text-white shadow-sm hover:bg-[#056b43]"
                >
                  {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                  Record Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}

function SummaryCard({
  label,
  value,
  description,
  positive = false,
  alert = false,
}: {
  label: string;
  value: string;
  description: string;
  positive?: boolean;
  alert?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-[#e4ebe7] bg-white p-5 shadow-[0_8px_30px_rgba(16,35,28,0.04)]">
      <p className="text-xs font-medium text-[#91a09a]">{label}</p>
      <p
        className={`mt-2 text-2xl font-semibold tracking-[-0.04em] ${
          positive
            ? "text-[#078653]"
            : alert
            ? "text-red-600"
            : "text-[#10231c]"
        }`}
      >
        {value}
      </p>
      <p className="mt-1 text-xs text-[#91a09a]">{description}</p>
    </div>
  );
}
