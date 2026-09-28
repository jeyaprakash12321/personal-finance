"use client";


import { useState, useEffect } from "react";
import { TrendingUp, Plus, Link2, Pencil, Trash2, PieChart } from "lucide-react";
import { getErrorMessage } from "../../../lib/errors";
import { useConfirmDialog } from "../../components/ui/dialog-provider";

interface Holding {
  id: string;
  symbol: string;
  name: string;
  assetType: "stock" | "etf" | "mutual_fund" | "bond";
  quantity: string;
  averageCost: string;
  currentPrice: string;
  investedValue: number;
  currentValue: number;
  pnl: number;
  pnlPercent: number;
}

interface PortfolioSummary {
  totalInvested: number;
  totalCurrentValue: number;
  totalPnL: number;
  totalPnLPercent: number;
  holdingsCount: number;
}

const BROKERS = ["Zerodha Kite", "Groww", "Upstox", "Angel One", "ICICI Direct"];

export default function PortfolioPage() {
  const { confirm, notify } = useConfirmDialog();
  const [summary, setSummary] = useState<PortfolioSummary | null>(null);
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal State
  const [isHoldingModalOpen, setIsHoldingModalOpen] = useState(false);
  const [isBrokerModalOpen, setIsBrokerModalOpen] = useState(false);
  const [editingHolding, setEditingHolding] = useState<Holding | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [selectedBroker, setSelectedBroker] = useState(BROKERS[0]);

  // Form State
  const [formData, setFormData] = useState({
    symbol: "",
    name: "",
    assetType: "stock" as Holding["assetType"],
    quantity: "",
    averageCost: "",
    currentPrice: "",
  });

  const fetchPortfolio = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/portfolio");
      if (!res.ok) throw new Error("Failed to load portfolio");
      const data = await res.json();
      setSummary(data.summary);
      setHoldings(data.holdings || []);
    } catch (err: unknown) {
      setError(getErrorMessage(err, "An error occurred"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    queueMicrotask(() => void fetchPortfolio());
  }, []);

  const handleOpenAdd = () => {
    setEditingHolding(null);
    setFormData({
      symbol: "",
      name: "",
      assetType: "stock",
      quantity: "",
      averageCost: "",
      currentPrice: "",
    });
    setIsHoldingModalOpen(true);
  };

  const handleOpenEdit = (h: Holding) => {
    setEditingHolding(h);
    setFormData({
      symbol: h.symbol,
      name: h.name,
      assetType: h.assetType,
      quantity: h.quantity,
      averageCost: h.averageCost,
      currentPrice: h.currentPrice,
    });
    setIsHoldingModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!(await confirm({ title: "Remove holding?", description: "This holding will be removed from your portfolio tracking.", confirmLabel: "Remove holding", destructive: true }))) return;
    try {
      const res = await fetch(`/api/portfolio/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete holding");
      fetchPortfolio();
    } catch (err: unknown) {
      notify(getErrorMessage(err, "Failed to delete holding"), "error");
    }
  };

  const handleSubmitHolding = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const payload = {
      symbol: formData.symbol,
      name: formData.name,
      assetType: formData.assetType,
      quantity: parseFloat(formData.quantity),
      averageCost: parseFloat(formData.averageCost),
      currentPrice: parseFloat(formData.currentPrice),
    };

    try {
      const url = editingHolding ? `/api/portfolio/${editingHolding.id}` : "/api/portfolio";
      const method = editingHolding ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || "Failed to save holding");
      }

      setIsHoldingModalOpen(false);
      fetchPortfolio();
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Failed to save holding"));
    } finally {
      setSubmitting(false);
    }
  };

  const handleBrokerSync = async () => {
    setSubmitting(true);
    try {
      const res = await fetch("/api/portfolio/broker-sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brokerName: selectedBroker }),
      });

      if (!res.ok) throw new Error("Broker sync failed");
      const data = await res.json();
      notify(data.message, "success");
      setIsBrokerModalOpen(false);
      fetchPortfolio();
    } catch (err: unknown) {
      notify(getErrorMessage(err, "Failed to sync broker"), "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-5 border-b border-[var(--border)] pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--accent)]">Investment overview</p>
          <h1 className="mt-1 flex items-center gap-2 text-[28px] font-bold tracking-[-0.04em] text-[var(--text-primary)] sm:text-[32px]">
            <TrendingUp className="h-7 w-7 text-[var(--accent)]" />
            Portfolio
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--text-secondary)]">
            Monitor your holdings, invested capital, current value, and profit or loss at a glance.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsBrokerModalOpen(true)}
            className="inline-flex h-11 items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] px-4 text-sm font-semibold text-[var(--text-primary)] transition hover:border-[var(--accent-border)] hover:bg-[var(--accent-soft)]"
          >
            <Link2 className="w-4 h-4 text-blue-500" /> Connect Broker
          </button>
          <button
            onClick={handleOpenAdd}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[var(--accent)] px-5 text-sm font-semibold text-white shadow-[var(--shadow-sm)] transition hover:bg-[var(--accent-hover)]"
          >
            <Plus className="w-4 h-4" /> Add Holding
          </button>
        </div>
      </div>

      {error && !isHoldingModalOpen && !isBrokerModalOpen && (
        <div className="flex items-start gap-3 rounded-2xl border border-[var(--danger-soft)] bg-[var(--danger-soft)] p-4 text-sm text-[var(--danger)]" role="alert">
          <TrendingUp className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Summary Metrics */}
      {summary && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] p-5 shadow-[var(--shadow-sm)]">
            <p className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Invested Value</p>
            <p className="text-2xl font-bold text-[var(--text-primary)] mt-2">₹{summary.totalInvested.toLocaleString()}</p>
          </div>

          <div className="rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] p-5 shadow-[var(--shadow-sm)]">
            <p className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Current Value</p>
            <p className="text-2xl font-bold text-[var(--text-primary)] mt-2">₹{summary.totalCurrentValue.toLocaleString()}</p>
          </div>

          <div className="rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] p-5 shadow-[var(--shadow-sm)]">
            <p className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Total P&L</p>
            <div className="flex items-center gap-2 mt-2">
              <span className={`text-2xl font-bold ${summary.totalPnL >= 0 ? "text-[var(--accent)]" : "text-rose-600 dark:text-rose-400"}`}>
                {summary.totalPnL >= 0 ? "+" : ""}₹{summary.totalPnL.toLocaleString()}
              </span>
              <span
                className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                  summary.totalPnL >= 0
                    ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                    : "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300"
                }`}
              >
                {summary.totalPnLPercent >= 0 ? "+" : ""}{summary.totalPnLPercent.toFixed(2)}%
              </span>
            </div>
          </div>

          <div className="rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] p-5 shadow-[var(--shadow-sm)]">
            <p className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Total Assets</p>
            <p className="text-2xl font-bold text-[var(--text-primary)] mt-2">{summary.holdingsCount} Holdings</p>
          </div>
        </div>
      )}

      {/* Main Table / Grid */}
      {loading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2].map((item) => <div key={item} className="h-24 animate-pulse rounded-2xl border border-[var(--border)] bg-[var(--card-bg)]" />)}
        </div>
      ) : holdings.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--card-bg)] px-6 py-16 text-center shadow-[var(--shadow-sm)]">
          <PieChart className="w-12 h-12 text-slate-400 dark:text-slate-600 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-[var(--text-primary)]">No Portfolio Holdings</h3>
          <p className="text-[var(--text-secondary)] text-sm mt-1 mb-6">
            Track your stocks, ETFs, mutual funds, or connect your broker account automatically.
          </p>
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => setIsBrokerModalOpen(true)}
              className="inline-flex items-center gap-2 bg-slate-100 dark:bg-[var(--surface-muted)] text-[var(--text-primary)] px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-slate-200 transition"
            >
              <Link2 className="w-4 h-4 text-blue-500" /> Connect Broker
            </button>
            <button
              onClick={handleOpenAdd}
              className="inline-flex items-center gap-2 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white px-4 py-2.5 rounded-xl text-sm font-medium transition"
            >
              <Plus className="w-4 h-4" /> Add Manual Holding
            </button>
          </div>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] shadow-[var(--shadow-sm)]">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-[var(--border)] bg-[var(--surface-subtle)] text-xs uppercase tracking-wider text-[var(--text-secondary)]">
                <tr>
                  <th className="p-4">Symbol / Name</th>
                  <th className="p-4">Asset Type</th>
                  <th className="p-4 text-right">Quantity</th>
                  <th className="p-4 text-right">Avg Cost</th>
                  <th className="p-4 text-right">Current Price</th>
                  <th className="p-4 text-right">Invested</th>
                  <th className="p-4 text-right">Current Value</th>
                  <th className="p-4 text-right">P&L</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-[var(--border)]">
                {holdings.map((h) => {
                  const isProfit = h.pnl >= 0;
                  return (
                    <tr key={h.id} className="transition hover:bg-[var(--surface-subtle)]">
                      <td className="p-4">
                        <div className="font-bold text-[var(--text-primary)]">{h.symbol}</div>
                        <div className="text-xs text-[var(--text-secondary)]">{h.name}</div>
                      </td>
                      <td className="p-4 capitalize">
                        <span className="px-2.5 py-1 bg-slate-100 dark:bg-[var(--surface-muted)] text-slate-700 dark:text-slate-300 rounded-full text-xs font-semibold">
                          {h.assetType.replace("_", " ")}
                        </span>
                      </td>
                      <td className="p-4 text-right font-mono font-medium">{h.quantity}</td>
                      <td className="p-4 text-right font-mono">₹{parseFloat(h.averageCost).toLocaleString()}</td>
                      <td className="p-4 text-right font-mono font-semibold">₹{parseFloat(h.currentPrice).toLocaleString()}</td>
                      <td className="p-4 text-right font-mono">₹{h.investedValue.toLocaleString()}</td>
                      <td className="p-4 text-right font-mono font-bold text-[var(--text-primary)]">₹{h.currentValue.toLocaleString()}</td>
                      <td className="p-4 text-right font-mono">
                        <div className={`font-bold ${isProfit ? "text-[var(--accent)]" : "text-[var(--danger)]"}`}>
                          {isProfit ? "+" : ""}₹{h.pnl.toLocaleString()}
                        </div>
                        <div className="text-xs font-semibold">
                          {isProfit ? "+" : ""}{h.pnlPercent.toFixed(2)}%
                        </div>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleOpenEdit(h)}
                            className="p-1.5 hover:bg-slate-100 dark:hover:bg-[var(--surface-muted)] rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white transition"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(h.id)}
                            className="p-1.5 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg text-rose-500 hover:text-rose-600 transition"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add / Edit Holding Modal */}
      {isHoldingModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-[var(--card-bg)] border border-slate-200 dark:border-[var(--border)] rounded-2xl w-full max-w-lg p-6 shadow-xl space-y-4">
            <h2 className="text-xl font-bold text-[var(--text-primary)]">
              {editingHolding ? "Edit Holding" : "Add Portfolio Holding"}
            </h2>

            {error && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 text-rose-600 text-xs rounded-xl">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmitHolding} className="wl-modal-form space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-[var(--text-secondary)]">Symbol *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., RELIANCE"
                    value={formData.symbol}
                    onChange={(e) => setFormData({ ...formData, symbol: e.target.value })}
                    className="wl-input h-11 rounded-xl px-3 text-sm font-mono uppercase"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-[var(--text-secondary)]">Asset Type *</label>
                  <select
                    value={formData.assetType}
                    onChange={(e) => setFormData({ ...formData, assetType: e.target.value as Holding["assetType"] })}
                    className="wl-input h-11 rounded-xl px-3 text-sm capitalize"
                  >
                    <option value="stock">Stock</option>
                    <option value="etf">ETF</option>
                    <option value="mutual_fund">Mutual Fund</option>
                    <option value="bond">Bond</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-[var(--text-secondary)]">Asset Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Reliance Industries Ltd"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="wl-input h-11 rounded-xl px-3 text-sm"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-[var(--text-secondary)]">Quantity *</label>
                  <input
                    type="number"
                    required
                    step="any"
                    min="0"
                    placeholder="10"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                    className="wl-input h-11 rounded-xl px-3 text-sm font-mono"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-[var(--text-secondary)]">Avg Cost (₹) *</label>
                  <input
                    type="number"
                    required
                    step="any"
                    min="0"
                    placeholder="2600"
                    value={formData.averageCost}
                    onChange={(e) => setFormData({ ...formData, averageCost: e.target.value })}
                    className="wl-input h-11 rounded-xl px-3 text-sm font-mono"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-[var(--text-secondary)]">Current Price (₹) *</label>
                  <input
                    type="number"
                    required
                    step="any"
                    min="0"
                    placeholder="2920"
                    value={formData.currentPrice}
                    onChange={(e) => setFormData({ ...formData, currentPrice: e.target.value })}
                    className="wl-input h-11 rounded-xl px-3 text-sm font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-[var(--border)]">
                <button
                  type="button"
                  onClick={() => setIsHoldingModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm disabled:opacity-50"
                >
                  {submitting ? "Saving..." : editingHolding ? "Save Changes" : "Add Holding"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Connect Broker Modal */}
      {isBrokerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-[var(--card-bg)] border border-slate-200 dark:border-[var(--border)] rounded-2xl w-full max-w-md p-6 shadow-xl space-y-4">
            <h2 className="text-xl font-bold text-[var(--text-primary)] flex items-center gap-2">
              <Link2 className="w-5 h-5 text-blue-500" />
              Broker Integration
            </h2>

            <p className="text-xs text-[var(--text-secondary)]">
              Wealthly uses official broker OAuth API tokens to import holdings without asking for your broker password.
            </p>

            <div>
              <label className="mb-1 block text-xs font-semibold text-[var(--text-secondary)]">Select Broker</label>
              <select
                value={selectedBroker}
                onChange={(e) => setSelectedBroker(e.target.value)}
                className="wl-input h-11 rounded-xl px-3 text-sm"
              >
                {BROKERS.map((b) => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setIsBrokerModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleBrokerSync}
                disabled={submitting}
                className="px-5 py-2 rounded-xl text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 transition shadow-sm disabled:opacity-50"
              >
                {submitting ? "Authenticating..." : `Authorize & Import from ${selectedBroker}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
