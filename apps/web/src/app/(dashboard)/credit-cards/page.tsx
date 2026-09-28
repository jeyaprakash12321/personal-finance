"use client";

import { useCallback, useEffect, useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useConfirmDialog } from "../../components/ui/dialog-provider";
import {
  Calendar,
  CreditCard as CreditCardIcon,
  Loader2,
  Plus,
  Trash2,
  X,
} from "lucide-react";

type CreditCard = {
  id: string;
  cardName: string;
  bankIssuer: string;
  cardType: string;
  last4: string;
  creditLimit: string;
  currentOutstanding: string;
  statementDate: string;
  paymentDueDate: string;
  interestRate: string;
  annualFee: string;
  cardStatus: "active" | "inactive" | "blocked";
  availableCredit: number;
  utilizationPercentage: number;
  daysUntilDue: number;
};

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

function CreditCardVisual({ card }: { card: CreditCard }) {
  const isVisa = card.cardType.toLowerCase().includes("visa");

  return (
    <div className="relative mb-5 min-h-[190px] overflow-hidden rounded-[22px] bg-[linear-gradient(135deg,#5b21b6_0%,#7c3aed_45%,#ff7043_145%)] p-5 text-white shadow-lg shadow-purple-900/20">
      <div className="absolute -right-12 -top-16 h-44 w-44 rounded-full border-[22px] border-white/10" />
      <div className="absolute -bottom-24 -left-10 h-48 w-48 rounded-full border-[26px] border-white/10" />
      <div className="relative flex items-start justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/70">{card.bankIssuer}</p>
          <p className="mt-1 text-base font-semibold">{card.cardName}</p>
        </div>
        <CreditCardIcon className="h-7 w-7 text-white/85" />
      </div>
      <div className="relative mt-8 flex items-center gap-3">
        <span className="h-7 w-10 rounded-md bg-gradient-to-br from-yellow-100 to-yellow-500 shadow-inner" />
        <span className="text-sm tracking-[0.18em] text-white/90">•••• {card.last4}</span>
      </div>
      <div className="relative mt-5 flex items-end justify-between text-[10px] uppercase tracking-widest text-white/65">
        <span>Wealthly member</span>
        <span className="text-sm font-black tracking-normal text-white">{isVisa ? "VISA" : card.cardType}</span>
      </div>
    </div>
  );
}

export default function CreditCardsPage() {
  const router = useRouter();
  const { confirm, notify } = useConfirmDialog();

  const [cards, setCards] = useState<CreditCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedCard, setSelectedCard] = useState<CreditCard | null>(null);

  // Form states
  const [cardName, setCardName] = useState("");
  const [bankIssuer, setBankIssuer] = useState("");
  const [cardType, setCardType] = useState("Visa");
  const [last4, setLast4] = useState("");
  const [creditLimit, setCreditLimit] = useState("");
  const [currentOutstanding, setCurrentOutstanding] = useState("0");
  const [statementDate, setStatementDate] = useState("1");
  const [paymentDueDate, setPaymentDueDate] = useState("15");
  const [interestRate, setInterestRate] = useState("18.50");
  const [annualFee, setAnnualFee] = useState("0");

  const [paymentAmount, setPaymentAmount] = useState("");

  const loadCards = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const res = await fetch("/api/credit-cards");
      if (res.status === 401) {
        router.push("/login");
        return;
      }
      if (!res.ok) {
        throw new Error("Failed to load credit cards");
      }
      const data = await res.json();
      setCards(data);
    } catch (err) {
      console.error(err);
      setError("Unable to load credit cards.");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    queueMicrotask(() => void loadCards());
  }, [loadCards]);

  const totalLimit = cards.reduce((sum, c) => sum + Number(c.creditLimit), 0);
  const totalOutstanding = cards.reduce((sum, c) => sum + Number(c.currentOutstanding), 0);
  const overallUtilization = totalLimit > 0 ? (totalOutstanding / totalLimit) * 100 : 0;

  function resetForm() {
    setCardName("");
    setBankIssuer("");
    setCardType("Visa");
    setLast4("");
    setCreditLimit("");
    setCurrentOutstanding("0");
    setStatementDate("1");
    setPaymentDueDate("15");
    setInterestRate("18.50");
    setAnnualFee("0");
    setError("");
  }

  function openAddModal() {
    resetForm();
    setShowAddModal(true);
  }

  function openEditModal(card: CreditCard) {
    setSelectedCard(card);
    setCardName(card.cardName);
    setBankIssuer(card.bankIssuer);
    setCardType(card.cardType);
    setLast4(card.last4);
    setCreditLimit(card.creditLimit);
    setCurrentOutstanding(card.currentOutstanding);
    setStatementDate(card.statementDate);
    setPaymentDueDate(card.paymentDueDate);
    setInterestRate(card.interestRate);
    setAnnualFee(card.annualFee);
    setError("");
    setShowEditModal(true);
  }

  function openPaymentModal(card: CreditCard) {
    setSelectedCard(card);
    setPaymentAmount("");
    setError("");
    setShowPaymentModal(true);
  }

  async function handleAddCard(e: FormEvent) {
    e.preventDefault();
    if (!cardName.trim() || !bankIssuer.trim() || last4.length !== 4 || !creditLimit) {
      setError("Please fill in all required fields cleanly.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const res = await fetch("/api/credit-cards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cardName: cardName.trim(),
          bankIssuer: bankIssuer.trim(),
          cardType,
          last4,
          creditLimit: Number(creditLimit),
          currentOutstanding: Number(currentOutstanding || 0),
          statementDate,
          paymentDueDate,
          interestRate: Number(interestRate || 18.5),
          annualFee: Number(annualFee || 0),
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.message || "Failed to add card");
      }

      setShowAddModal(false);
      await loadCards();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error adding card.");
    } finally {
      setSaving(false);
    }
  }

  async function handleUpdateCard(e: FormEvent) {
    e.preventDefault();
    if (!selectedCard) return;

    setSaving(true);
    setError("");

    try {
      const res = await fetch(`/api/credit-cards/${selectedCard.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cardName: cardName.trim(),
          bankIssuer: bankIssuer.trim(),
          cardType,
          last4,
          creditLimit: Number(creditLimit),
          currentOutstanding: Number(currentOutstanding),
          statementDate,
          paymentDueDate,
          interestRate: Number(interestRate),
          annualFee: Number(annualFee),
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.message || "Failed to update card");
      }

      setShowEditModal(false);
      setSelectedCard(null);
      await loadCards();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error updating card.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteCard(card: CreditCard) {
    if (!(await confirm({ title: "Delete credit card?", description: `${card.cardName} and its tracking data will be permanently removed.`, confirmLabel: "Delete card", destructive: true }))) return;

    try {
      const res = await fetch(`/api/credit-cards/${card.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete card");
      await loadCards();
    } catch {
      notify("Failed to delete card.", "error");
    }
  }

  async function handleRecordPayment(e: FormEvent) {
    e.preventDefault();
    if (!selectedCard || !paymentAmount || Number(paymentAmount) <= 0) {
      setError("Please enter a valid payment amount.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const res = await fetch(`/api/credit-cards/${selectedCard.id}/payment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: Number(paymentAmount) }),
      });

      if (!res.ok) throw new Error("Failed to record payment");

      setShowPaymentModal(false);
      setSelectedCard(null);
      await loadCards();
    } catch {
      setError("Failed to record payment.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="min-h-screen bg-[var(--background)] px-2 py-2 sm:px-4 sm:py-4">
      <div className="mx-auto max-w-[1400px]">
        {/* Header */}
        <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-medium text-[var(--accent)]">Borrowing & Credit</p>
            <h1 className="mt-1 text-3xl font-semibold tracking-[-0.04em] text-[var(--text-primary)]">
              Credit Cards
            </h1>
            <p className="mt-1 max-w-xl text-sm text-[var(--text-secondary)]">
              Track credit limits, outstanding balances, utilization rates, and upcoming statement dues.
            </p>
          </div>

          <button
            type="button"
            onClick={openAddModal}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[var(--accent)] px-5 text-sm font-semibold text-white shadow-lg shadow-purple-500/20 transition hover:bg-[var(--accent-hover)]"
          >
            <Plus className="h-4 w-4" />
            Add Credit Card
          </button>
        </div>

        {/* Summary Metrics */}
        <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <SummaryCard
            label="Total Credit Limit"
            value={formatCurrency(totalLimit)}
            description="Across all cards"
          />
          <SummaryCard
            label="Total Outstanding Dues"
            value={formatCurrency(totalOutstanding)}
            description="Current balance due"
            alert={totalOutstanding > 0}
          />
          <SummaryCard
            label="Available Credit"
            value={formatCurrency(Math.max(0, totalLimit - totalOutstanding))}
            description="Remaining limit"
            positive
          />
          <SummaryCard
            label="Overall Utilization"
            value={`${overallUtilization.toFixed(1)}%`}
            description={overallUtilization > 30 ? "High utilization warning" : "Healthy credit ratio"}
            warning={overallUtilization > 30}
          />
        </div>

        {/* Cards Grid */}
        <section className="mt-8">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold tracking-[-0.03em] text-[var(--text-primary)]">
              Your Cards ({cards.length})
            </h2>
          </div>

          {loading ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2].map((i) => (
                <div key={i} className="h-64 animate-pulse rounded-2xl border border-[#e4ebe7] bg-white" />
              ))}
            </div>
          ) : cards.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[#cddbd4] bg-white p-12 text-center shadow-[0_8px_30px_rgba(16,35,28,0.04)]">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#edf8f2] text-[#078653]">
                <CreditCardIcon className="h-7 w-7" />
              </div>
              <h3 className="mt-4 text-base font-bold text-[#10231c]">No credit cards added</h3>
              <p className="mt-1 text-sm text-[#91a09a]">Add your credit cards to manage utilization and payment dues.</p>
              <button
                type="button"
                onClick={openAddModal}
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#078653] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#056b43]"
              >
                <Plus className="h-4 w-4" />
                Add Card
              </button>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {cards.map((card) => {
                const limit = Number(card.creditLimit);
                const outstanding = Number(card.currentOutstanding);
                const util = card.utilizationPercentage;

                return (
                  <div
                    key={card.id}
                    className="group relative overflow-hidden rounded-2xl border border-[#e4ebe7] bg-white p-6 shadow-[0_8px_30px_rgba(16,35,28,0.04)] transition hover:-translate-y-0.5 hover:shadow-[0_14px_35px_rgba(16,35,28,0.08)]"
                  >
                    <CreditCardVisual card={card} />

                    {/* Top Brand Banner */}
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-xs font-semibold uppercase tracking-wider text-[#91a09a]">
                          {card.bankIssuer}
                        </span>
                        <h3 className="text-lg font-bold tracking-[-0.02em] text-[#10231c]">
                          {card.cardName}
                        </h3>
                        <p className="mt-0.5 text-xs font-medium text-[#60736b]">
                          •••• •••• •••• {card.last4} ({card.cardType})
                        </p>
                      </div>
                      <span
                        className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${
                          util > 70
                            ? "bg-red-50 text-red-600"
                            : util > 30
                            ? "bg-amber-50 text-amber-600"
                            : "bg-[#edf8f2] text-[#078653]"
                        }`}
                      >
                        {util}% Utilized
                      </span>
                    </div>

                    {/* Dues & Limit */}
                    <div className="mt-6">
                      <div className="flex items-baseline justify-between">
                        <span className="text-xs text-[#91a09a]">Outstanding</span>
                        <span className="text-xs text-[#91a09a]">Limit</span>
                      </div>
                      <div className="mt-1 flex items-baseline justify-between">
                        <span className="text-2xl font-bold tracking-[-0.03em] text-[#10231c]">
                          {formatCurrency(outstanding)}
                        </span>
                        <span className="text-sm font-semibold text-[#60736b]">
                          {formatCurrency(limit)}
                        </span>
                      </div>

                      {/* Utilization Gauge */}
                      <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#f1f8f4]">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            util > 70
                              ? "bg-red-500"
                              : util > 30
                              ? "bg-amber-500"
                              : "bg-[#16a36a]"
                          }`}
                          style={{ width: `${Math.min(100, util)}%` }}
                        />
                      </div>
                    </div>

                    {/* Payment Reminder Box */}
                    <div className="mt-5 rounded-xl border border-[#edf1ef] bg-[#f8faf9] p-3.5 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-[#078653]" />
                        <div>
                          <p className="font-semibold text-[#10231c]">
                            Due in {card.daysUntilDue} days
                          </p>
                          <p className="text-[10px] text-[#91a09a]">
                            Payment due date: {card.paymentDueDate}th of month
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="mt-6 flex items-center gap-2 pt-2 border-t border-[#edf1ef]">
                      <button
                        type="button"
                        onClick={() => openPaymentModal(card)}
                        className="flex-1 rounded-xl bg-[#078653] py-2 text-xs font-semibold text-white transition hover:bg-[#056b43]"
                      >
                        Make Payment
                      </button>
                      <button
                        type="button"
                        onClick={() => openEditModal(card)}
                        className="rounded-xl border border-[#e4ebe7] px-3 py-2 text-xs font-semibold text-[#60736b] transition hover:bg-[#f7faf8]"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteCard(card)}
                        className="rounded-xl border border-[#ffd4d4] p-2 text-[#c74448] transition hover:bg-[#fff5f5]"
                        title="Delete card"
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
                {showEditModal ? "Edit Credit Card" : "Add Credit Card"}
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
              onSubmit={showEditModal ? handleUpdateCard : handleAddCard}
              className="mt-5 space-y-4"
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-[#30463d]">Card Name</label>
                  <input
                    type="text"
                    value={cardName}
                    onChange={(e) => setCardName(e.target.value)}
                    placeholder="e.g. Regalia First"
                    className="mt-1 h-11 w-full rounded-xl border border-[#e4ebe7] bg-[#f8faf9] px-3 text-sm outline-none focus:border-[#078653] focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#30463d]">Bank / Issuer</label>
                  <input
                    type="text"
                    value={bankIssuer}
                    onChange={(e) => setBankIssuer(e.target.value)}
                    placeholder="e.g. HDFC Bank"
                    className="mt-1 h-11 w-full rounded-xl border border-[#e4ebe7] bg-[#f8faf9] px-3 text-sm outline-none focus:border-[#078653] focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-[#30463d]">Card Network</label>
                  <select
                    value={cardType}
                    onChange={(e) => setCardType(e.target.value)}
                    className="mt-1 h-11 w-full rounded-xl border border-[#e4ebe7] bg-[#f8faf9] px-3 text-sm outline-none focus:border-[#078653] focus:bg-white"
                  >
                    <option value="Visa">Visa</option>
                    <option value="Mastercard">Mastercard</option>
                    <option value="Amex">American Express</option>
                    <option value="RuPay">RuPay</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#30463d]">Last 4 Digits</label>
                  <input
                    type="text"
                    maxLength={4}
                    value={last4}
                    onChange={(e) => setLast4(e.target.value)}
                    placeholder="4821"
                    className="mt-1 h-11 w-full rounded-xl border border-[#e4ebe7] bg-[#f8faf9] px-3 text-sm outline-none focus:border-[#078653] focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-[#30463d]">Credit Limit (₹)</label>
                  <input
                    type="number"
                    value={creditLimit}
                    onChange={(e) => setCreditLimit(e.target.value)}
                    placeholder="100000"
                    className="mt-1 h-11 w-full rounded-xl border border-[#e4ebe7] bg-[#f8faf9] px-3 text-sm outline-none focus:border-[#078653] focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#30463d]">Current Dues (₹)</label>
                  <input
                    type="number"
                    value={currentOutstanding}
                    onChange={(e) => setCurrentOutstanding(e.target.value)}
                    placeholder="18500"
                    className="mt-1 h-11 w-full rounded-xl border border-[#e4ebe7] bg-[#f8faf9] px-3 text-sm outline-none focus:border-[#078653] focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-[#30463d]">Statement Day</label>
                  <input
                    type="number"
                    min={1}
                    max={31}
                    value={statementDate}
                    onChange={(e) => setStatementDate(e.target.value)}
                    className="mt-1 h-11 w-full rounded-xl border border-[#e4ebe7] bg-[#f8faf9] px-3 text-sm outline-none focus:border-[#078653] focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#30463d]">Payment Due Day</label>
                  <input
                    type="number"
                    min={1}
                    max={31}
                    value={paymentDueDate}
                    onChange={(e) => setPaymentDueDate(e.target.value)}
                    className="mt-1 h-11 w-full rounded-xl border border-[#e4ebe7] bg-[#f8faf9] px-3 text-sm outline-none focus:border-[#078653] focus:bg-white"
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
                  {showEditModal ? "Save Changes" : "Add Card"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && selectedCard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#10231c]/30 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-[#e4ebe7] bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#edf1ef] pb-4">
              <div>
                <h2 className="text-lg font-bold text-[#10231c]">Record Payment</h2>
                <p className="text-xs text-[#60736b]">
                  {selectedCard.bankIssuer} {selectedCard.cardName} (•••• {selectedCard.last4})
                </p>
              </div>
              <button onClick={() => setShowPaymentModal(false)} className="rounded-lg p-1 text-[#91a09a]">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleRecordPayment} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#30463d]">
                  Current Dues: {formatCurrency(Number(selectedCard.currentOutstanding))}
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
                    placeholder="e.g. 7200"
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
  warning = false,
}: {
  label: string;
  value: string;
  description: string;
  positive?: boolean;
  alert?: boolean;
  warning?: boolean;
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
            : warning
            ? "text-amber-600"
            : "text-[#10231c]"
        }`}
      >
        {value}
      </p>
      <p className="mt-1 text-xs text-[#91a09a]">{description}</p>
    </div>
  );
}
