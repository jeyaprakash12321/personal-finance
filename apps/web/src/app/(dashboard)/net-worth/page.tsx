"use client";

import { useState, useEffect } from "react";
import { Scale, TrendingUp, Landmark, CreditCard, Coins, Camera } from "lucide-react";
import { getErrorMessage } from "../../../lib/errors";
import { useConfirmDialog } from "../../components/ui/dialog-provider";

interface NetWorthData {
  live: {
    totalAssets: number;
    totalLiabilities: number;
    netWorth: number;
    assetsBreakdown: {
      bankAccountsAndCash: number;
      investments: number;
    };
    liabilitiesBreakdown: {
      creditCards: number;
      loans: number;
    };
  };
  snapshots: Array<{
    id: string;
    snapshotDate: string;
    totalAssets: string;
    totalLiabilities: string;
    netWorth: string;
  }>;
}

export default function NetWorthPage() {
  const { notify } = useConfirmDialog();
  const [data, setData] = useState<NetWorthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [takingSnapshot, setTakingSnapshot] = useState(false);

  const fetchNetWorth = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/net-worth");

      if (!res.ok) {
        throw new Error(`Failed to load net worth data (${res.status})`);
      }

      const json = await res.json();
      setData(json);
    } catch (err: unknown) {
      console.error("Net worth error:", err);
      setError(getErrorMessage(err, "Failed to load net worth data"));
      // Set default empty data so page still shows
      setData({
        live: {
          totalAssets: 0,
          totalLiabilities: 0,
          netWorth: 0,
          assetsBreakdown: { bankAccountsAndCash: 0, investments: 0 },
          liabilitiesBreakdown: { creditCards: 0, loans: 0 },
        },
        snapshots: [],
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    queueMicrotask(() => void fetchNetWorth());
  }, []);

  const handleTakeSnapshot = async () => {
    try {
      setTakingSnapshot(true);
      const res = await fetch("/api/net-worth/snapshot", { method: "POST" });
      if (!res.ok) throw new Error("Failed to take snapshot");
      notify("Snapshot recorded successfully!", "success");
      fetchNetWorth();
    } catch (err: unknown) {
      notify(getErrorMessage(err, "Failed to record snapshot"), "error");
    } finally {
      setTakingSnapshot(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12 text-[var(--text-secondary)]">
        Calculating Net Worth...
      </div>
    );
  }

  const live = data?.live || {
    totalAssets: 0,
    totalLiabilities: 0,
    netWorth: 0,
    assetsBreakdown: { bankAccountsAndCash: 0, investments: 0 },
    liabilitiesBreakdown: { creditCards: 0, loans: 0 },
  };

  return (
    <div className="space-y-6">
      {/* Error Alert */}
      {error && (
        <div className="rounded-xl border border-[var(--danger-border,#ffb3b8)] bg-[var(--danger-soft)] px-4 py-3 text-sm text-[var(--danger)]">
          {error}
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)] flex items-center gap-2">
            <Scale className="w-7 h-7 text-[var(--accent)]" />
            Net Worth Engine
          </h1>
          <p className="text-[var(--text-secondary)] text-sm mt-1">
            Net Worth = Total Assets − Total Liabilities
          </p>
        </div>
        <button
          onClick={handleTakeSnapshot}
          disabled={takingSnapshot}
          className="inline-flex items-center justify-center gap-2 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white px-4 py-2.5 rounded-xl font-medium transition shadow-sm disabled:opacity-50"
        >
          <Camera className="w-4 h-4" /> {takingSnapshot ? "Recording..." : "Record Snapshot"}
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] p-6 shadow-[var(--shadow-sm)]">
          <p className="text-sm font-medium text-[var(--text-secondary)]">Total Assets</p>
          <p className="mt-3 text-2xl font-bold tracking-tight text-[var(--text-primary)]">
            ₹{live.totalAssets.toLocaleString("en-IN")}
          </p>
          <div className="mt-4 space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <Landmark className="h-4 w-4 text-[var(--accent)]" />
              <span className="text-[var(--text-secondary)]">
                Bank: ₹{live.assetsBreakdown.bankAccountsAndCash.toLocaleString("en-IN")}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <TrendingUp className="h-4 w-4 text-[var(--accent)]" />
              <span className="text-[var(--text-secondary)]">
                Investments: ₹{live.assetsBreakdown.investments.toLocaleString("en-IN")}
              </span>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] p-6 shadow-[var(--shadow-sm)]">
          <p className="text-sm font-medium text-[var(--text-secondary)]">Total Liabilities</p>
          <p className="mt-3 text-2xl font-bold tracking-tight text-[var(--danger)]">
            ₹{live.totalLiabilities.toLocaleString("en-IN")}
          </p>
          <div className="mt-4 space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <CreditCard className="h-4 w-4 text-[var(--danger)]" />
              <span className="text-[var(--text-secondary)]">
                Credit Cards: ₹{live.liabilitiesBreakdown.creditCards.toLocaleString("en-IN")}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Coins className="h-4 w-4 text-[var(--danger)]" />
              <span className="text-[var(--text-secondary)]">
                Loans: ₹{live.liabilitiesBreakdown.loans.toLocaleString("en-IN")}
              </span>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] p-6 shadow-[var(--shadow-sm)]">
          <p className="text-sm font-medium text-[var(--text-secondary)]">Net Worth</p>
          <p
            className={`mt-3 text-2xl font-bold tracking-tight ${
              live.netWorth >= 0 ? "text-[var(--accent)]" : "text-[var(--danger)]"
            }`}
          >
            ₹{live.netWorth.toLocaleString("en-IN")}
          </p>
          <p className="mt-4 text-xs text-[var(--text-muted)]">
            {live.netWorth >= 0 ? "Assets exceed liabilities" : "Liabilities exceed assets"}
          </p>
        </div>

        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] p-6 shadow-[var(--shadow-sm)]">
          <p className="text-sm font-medium text-[var(--text-secondary)]">Asset Ratio</p>
          <p className="mt-3 text-2xl font-bold tracking-tight text-[var(--text-primary)]">
            {live.totalLiabilities > 0 ? ((live.totalAssets / (live.totalAssets + live.totalLiabilities)) * 100).toFixed(1) : 100}%
          </p>
          <p className="mt-4 text-xs text-[var(--text-muted)]">
            Percentage of total wealth in assets
          </p>
        </div>
      </div>

      {/* Snapshots History */}
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] p-6 shadow-[var(--shadow-sm)]">
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">Net Worth History</h2>

        {data?.snapshots && data.snapshots.length > 0 ? (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border)]">
                  <th className="px-4 py-2 text-left font-semibold text-[var(--text-secondary)]">
                    Date
                  </th>
                  <th className="px-4 py-2 text-right font-semibold text-[var(--text-secondary)]">
                    Assets
                  </th>
                  <th className="px-4 py-2 text-right font-semibold text-[var(--text-secondary)]">
                    Liabilities
                  </th>
                  <th className="px-4 py-2 text-right font-semibold text-[var(--text-secondary)]">
                    Net Worth
                  </th>
                </tr>
              </thead>
              <tbody>
                {[...data.snapshots]
                  .sort(
                    (left, right) =>
                      new Date(right.snapshotDate).getTime() -
                      new Date(left.snapshotDate).getTime(),
                  )
                  .map((snapshot) => (
                  <tr
                    key={snapshot.id}
                    className="border-b border-[var(--border)] hover:bg-[var(--surface-subtle)]"
                  >
                    <td className="px-4 py-3 text-[var(--text-primary)]">
                      {new Date(snapshot.snapshotDate).toLocaleDateString("en-IN")}
                    </td>
                    <td className="px-4 py-3 text-right text-[var(--text-primary)]">
                      ₹{Number(snapshot.totalAssets).toLocaleString("en-IN")}
                    </td>
                    <td className="px-4 py-3 text-right text-[var(--text-primary)]">
                      ₹{Number(snapshot.totalLiabilities).toLocaleString("en-IN")}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-[var(--text-primary)]">
                      ₹{Number(snapshot.netWorth).toLocaleString("en-IN")}
                    </td>
                  </tr>
                  ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="mt-4 text-center text-[var(--text-muted)]">
            No snapshots recorded yet. Click &quot;Record Snapshot&quot; to start tracking your net worth history.
          </p>
        )}
      </div>
    </div>
  );
}
