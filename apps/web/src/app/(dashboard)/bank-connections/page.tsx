"use client";


import { useState, useEffect } from "react";
import { Landmark, Plus, RefreshCw, CheckCircle2, Unlink, Lock, ShieldCheck } from "lucide-react";
import { getErrorMessage } from "../../../lib/errors";
import { useConfirmDialog } from "../../components/ui/dialog-provider";

interface BankConnection {
  id: string;
  institutionName: string;
  status: "connected" | "disconnected" | "error";
  lastSyncedAt: string;
  createdAt: string;
}

const POPULAR_BANKS = ["HDFC Bank", "State Bank of India (SBI)", "ICICI Bank", "Axis Bank", "Kotak Mahindra Bank", "IndusInd Bank"];

function formatTimeAgo(dateStr: string) {
  if (!dateStr) return "Never";
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins} minutes ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours} hours ago`;
  return `${Math.floor(diffHours / 24)} days ago`;
}

export default function BankConnectionsPage() {
  const { confirm, notify } = useConfirmDialog();
  const [connections, setConnections] = useState<BankConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedBank, setSelectedBank] = useState(POPULAR_BANKS[0]);
  const [customBankName, setCustomBankName] = useState("");
  const [createAccount, setCreateAccount] = useState(true);
  const [initialBalance, setInitialBalance] = useState("50000");
  const [connecting, setConnecting] = useState(false);
  const [syncingId, setSyncingId] = useState<string | null>(null);

  const fetchConnections = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/bank-connections");
      if (!res.ok) throw new Error("Failed to load bank connections");
      const data = await res.json();
      setConnections(data);
    } catch (err: unknown) {
      setError(getErrorMessage(err, "An error occurred"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    queueMicrotask(() => void fetchConnections());
  }, []);

  const handleConnectBank = async (e: React.FormEvent) => {
    e.preventDefault();
    setConnecting(true);
    setError(null);

    const bankName = selectedBank === "Other" ? customBankName : selectedBank;

    try {
      const res = await fetch("/api/bank-connections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          institutionName: bankName,
          accountsToCreate: createAccount
            ? [
                {
                  name: "Primary Account",
                  type: "checking",
                  initialBalance: parseFloat(initialBalance || "0"),
                },
              ]
            : [],
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || "Failed to connect bank");
      }

      setIsModalOpen(false);
      fetchConnections();
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Failed to connect bank"));
    } finally {
      setConnecting(false);
    }
  };

  const handleSync = async (id: string) => {
    try {
      setSyncingId(id);
      const res = await fetch(`/api/bank-connections/${id}/sync`, { method: "POST" });
      if (!res.ok) throw new Error("Sync failed");
      fetchConnections();
    } catch (err: unknown) {
      notify(getErrorMessage(err, "Failed to sync connection"), "error");
    } finally {
      setSyncingId(null);
    }
  };

  const handleReconnect = async (id: string) => {
    try {
      const res = await fetch(`/api/bank-connections/${id}/reconnect`, { method: "POST" });
      if (!res.ok) throw new Error("Reconnect failed");
      notify("Bank re-authenticated successfully!", "success");
      fetchConnections();
    } catch (err: unknown) {
      notify(getErrorMessage(err, "Failed to reconnect bank"), "error");
    }
  };

  const handleDisconnect = async (id: string) => {
    if (!(await confirm({ title: "Disconnect bank?", description: "This connection will be removed. Existing Wealthly records will remain unchanged.", confirmLabel: "Disconnect", destructive: true }))) return;
    try {
      const res = await fetch(`/api/bank-connections/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Disconnect failed");
      fetchConnections();
    } catch (err: unknown) {
      notify(getErrorMessage(err, "Failed to disconnect bank"), "error");
    }
  };

  const getTimeAgo = (dateStr: string) => formatTimeAgo(dateStr);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)] flex items-center gap-2">
            <Landmark className="w-7 h-7 text-[var(--accent)]" />
            Bank Connections
          </h1>
          <p className="text-[var(--text-secondary)] text-sm mt-1">
            Securely link bank institutions via Open Banking provider tokens
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center justify-center gap-2 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white px-4 py-2.5 rounded-xl font-medium transition shadow-sm"
        >
          <Plus className="w-4 h-4" /> Connect Bank
        </button>
      </div>

      {/* Security Banner */}
      <div className="bg-[var(--accent-soft)]/40 border border-[var(--accent-border)] rounded-2xl p-4 flex items-start gap-3">
        <Lock className="w-5 h-5 text-[var(--accent)] shrink-0 mt-0.5" />
        <div>
          <h3 className="font-semibold text-[var(--text-primary)] text-sm">Bank-Grade Security Architecture</h3>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5">
            Wealthly never stores your online banking passwords. Connections rely exclusively on encrypted OAuth read-only API tokens.
          </p>
        </div>
      </div>

      {/* Main Content */}
      {loading ? (
        <div className="text-center py-12 text-[var(--text-secondary)]">Loading bank connections...</div>
      ) : connections.length === 0 ? (
        <div className="bg-white dark:bg-[var(--card-bg)] border border-slate-200 dark:border-[var(--border)] rounded-2xl p-12 text-center">
          <Landmark className="w-12 h-12 text-slate-400 dark:text-slate-600 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-[var(--text-primary)]">No Connected Banks</h3>
          <p className="text-[var(--text-secondary)] text-sm mt-1 mb-6">
            Connect your primary bank to automatically sync balances and transactions.
          </p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white px-4 py-2.5 rounded-xl text-sm font-medium transition"
          >
            <Plus className="w-4 h-4" /> Connect Your First Bank
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {connections.map((conn) => (
            <div
              key={conn.id}
              className="bg-[var(--card-bg)] border border-[var(--border)] rounded-2xl p-6 shadow-[var(--shadow-card)] hover:border-[var(--accent-border)] transition flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-emerald-100 dark:bg-emerald-950 text-[var(--accent)] rounded-xl font-bold">
                      <Landmark className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-[var(--text-primary)] text-base">{conn.institutionName}</h3>
                      <p className="text-xs text-[var(--text-secondary)]">
                        Demo connection · no external provider linked
                      </p>
                    </div>
                  </div>

                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
                      conn.status === "connected"
                        ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300"
                        : "bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300"
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {conn.status === "connected" ? "Connected" : conn.status}
                  </span>
                </div>

                <div className="mt-5 p-3 bg-slate-50 dark:bg-[var(--surface-muted)]/50 rounded-xl text-xs space-y-1">
                  <div className="flex justify-between text-slate-600 dark:text-slate-400">
                    <span>Last Synced:</span>
                    <span className="font-medium text-[var(--text-primary)]">{getTimeAgo(conn.lastSyncedAt)}</span>
                  </div>
                  <div className="flex justify-between text-slate-600 dark:text-slate-400">
                    <span>Connection Type:</span>
                    <span className="font-medium text-[var(--text-primary)]">Read-Only Financial Aggregator</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 dark:border-[var(--border)] flex items-center justify-between">
                <button
                  onClick={() => handleSync(conn.id)}
                  disabled={syncingId === conn.id}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--accent)] hover:text-emerald-700 transition"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${syncingId === conn.id ? "animate-spin" : ""}`} />
                  {syncingId === conn.id ? "Syncing..." : "Sync Now"}
                </button>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleReconnect(conn.id)}
                    className="text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition"
                  >
                    Reconnect
                  </button>
                  <button
                    onClick={() => handleDisconnect(conn.id)}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-rose-500 hover:text-rose-600 transition"
                  >
                    <Unlink className="w-3.5 h-3.5" /> Disconnect
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Connect Bank Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-[var(--card-bg)] border border-slate-200 dark:border-[var(--border)] rounded-2xl w-full max-w-md p-6 shadow-xl space-y-4">
            <h2 className="text-xl font-bold text-[var(--text-primary)] flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              Connect Bank Institution
            </h2>

            {error && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 text-rose-600 text-xs rounded-xl">
                {error}
              </div>
            )}

            <form onSubmit={handleConnectBank} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Select Financial Institution
                </label>
                <select
                  value={selectedBank}
                  onChange={(e) => setSelectedBank(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-[var(--surface-muted)] border border-slate-200 dark:border-[var(--border)] rounded-xl text-sm dark:text-white"
                >
                  {POPULAR_BANKS.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                  <option value="Other">Other Institution</option>
                </select>
              </div>

              {selectedBank === "Other" && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Bank Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., Canara Bank"
                    value={customBankName}
                    onChange={(e) => setCustomBankName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-[var(--surface-muted)] border border-slate-200 dark:border-[var(--border)] rounded-xl text-sm dark:text-white"
                  />
                </div>
              )}

              <div className="p-3 bg-slate-50 dark:bg-[var(--surface-muted)] rounded-xl text-xs space-y-2">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="create-linked-acc"
                    checked={createAccount}
                    onChange={(e) => setCreateAccount(e.target.checked)}
                    className="w-4 h-4 text-emerald-600 rounded"
                  />
                  <label htmlFor="create-linked-acc" className="font-semibold text-slate-800 dark:text-slate-200">
                    Create linked checking account in Wealthly
                  </label>
                </div>

                {createAccount && (
                  <div>
                    <label className="block text-[11px] text-slate-500 mb-1">Synced Initial Balance (₹)</label>
                    <input
                      type="number"
                      value={initialBalance}
                      onChange={(e) => setInitialBalance(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white dark:bg-[var(--card-bg)] border border-slate-200 dark:border-[var(--border)] rounded-lg text-xs dark:text-white"
                    />
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-[var(--border)]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-[var(--surface-muted)]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={connecting}
                  className="px-5 py-2 rounded-xl text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 transition shadow-sm disabled:opacity-50"
                >
                  {connecting ? "Connecting..." : "Authenticate via Provider"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
