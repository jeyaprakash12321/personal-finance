"use client";


import { useState, useEffect } from "react";
import {
  ShieldCheck,
  Plus,
  AlertTriangle,
  Calendar,
  HeartHandshake,
  Car,
  Home,
  Plane,
  FileText,
  Pencil,
  Trash2,
  Clock,
  DollarSign
} from "lucide-react";
import { getErrorMessage } from "../../../lib/errors";
import { useConfirmDialog } from "../../components/ui/dialog-provider";

interface InsurancePolicy {
  id: string;
  provider: string;
  policyNumber: string;
  policyType: "health" | "life" | "vehicle" | "home" | "travel" | "other";
  coverageAmount: string;
  premium: string;
  premiumFrequency: string;
  startDate: string;
  renewalDate: string;
  nominee?: string | null;
  notes?: string | null;
  daysUntilRenewal?: number;
  isRenewalDueSoon?: boolean;
}

const todayForForm = new Date().toISOString().split("T")[0];
const renewalDateForForm = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

export default function InsurancePage() {
  const { confirm, notify } = useConfirmDialog();
  const [policies, setPolicies] = useState<InsurancePolicy[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState<InsurancePolicy | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    provider: "",
    policyNumber: "",
    policyType: "health" as InsurancePolicy["policyType"],
    coverageAmount: "",
    premium: "",
    premiumFrequency: "annual",
    startDate: todayForForm,
    renewalDate: renewalDateForForm,
    nominee: "",
    notes: "",
  });

  const fetchPolicies = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/insurance");
      if (!res.ok) throw new Error("Failed to fetch insurance policies");
      const data = await res.json();
      setPolicies(data);
    } catch (err: unknown) {
      setError(getErrorMessage(err, "An error occurred"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    queueMicrotask(() => void fetchPolicies());
  }, []);

  const handleOpenAdd = () => {
    setEditingPolicy(null);
    setFormData({
      provider: "",
      policyNumber: "",
      policyType: "health",
      coverageAmount: "",
      premium: "",
      premiumFrequency: "annual",
      startDate: todayForForm,
      renewalDate: renewalDateForForm,
      nominee: "",
      notes: "",
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (policy: InsurancePolicy) => {
    setEditingPolicy(policy);
    setFormData({
      provider: policy.provider,
      policyNumber: policy.policyNumber,
      policyType: policy.policyType,
      coverageAmount: policy.coverageAmount,
      premium: policy.premium,
      premiumFrequency: policy.premiumFrequency || "annual",
      startDate: new Date(policy.startDate).toISOString().split("T")[0],
      renewalDate: new Date(policy.renewalDate).toISOString().split("T")[0],
      nominee: policy.nominee || "",
      notes: policy.notes || "",
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!(await confirm({ title: "Delete insurance policy?", description: "This policy and its renewal tracking will be permanently removed.", confirmLabel: "Delete policy", destructive: true }))) return;
    try {
      const res = await fetch(`/api/insurance/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete policy");
      fetchPolicies();
    } catch (err: unknown) {
      notify(getErrorMessage(err, "Failed to delete policy"), "error");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const payload = {
      provider: formData.provider,
      policyNumber: formData.policyNumber,
      policyType: formData.policyType,
      coverageAmount: parseFloat(formData.coverageAmount),
      premium: parseFloat(formData.premium),
      premiumFrequency: formData.premiumFrequency,
      startDate: new Date(formData.startDate).toISOString(),
      renewalDate: new Date(formData.renewalDate).toISOString(),
      nominee: formData.nominee || null,
      notes: formData.notes || null,
    };

    try {
      const url = editingPolicy ? `/api/insurance/${editingPolicy.id}` : "/api/insurance";
      const method = editingPolicy ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || "Failed to save policy");
      }

      setIsModalOpen(false);
      fetchPolicies();
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Failed to save policy"));
    } finally {
      setSubmitting(false);
    }
  };

  // Calculations
  const totalCoverage = policies.reduce((acc, p) => acc + parseFloat(p.coverageAmount || "0"), 0);
  const totalPremium = policies.reduce((acc, p) => acc + parseFloat(p.premium || "0"), 0);
  const upcomingRenewals = policies.filter((p) => p.isRenewalDueSoon);

  const getPolicyIcon = (type: InsurancePolicy["policyType"]) => {
    switch (type) {
      case "health":
        return <HeartHandshake className="w-5 h-5 text-rose-500" />;
      case "life":
        return <ShieldCheck className="w-5 h-5 text-blue-500" />;
      case "vehicle":
        return <Car className="w-5 h-5 text-amber-500" />;
      case "home":
        return <Home className="w-5 h-5 text-emerald-500" />;
      case "travel":
        return <Plane className="w-5 h-5 text-purple-500" />;
      default:
        return <FileText className="w-5 h-5 text-slate-500" />;
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-5 border-b border-[var(--border)] pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--accent)]">Protection planning</p>
          <h1 className="mt-1 flex items-center gap-2 text-[28px] font-bold tracking-[-0.04em] text-[var(--text-primary)] sm:text-[32px]">
            <ShieldCheck className="h-7 w-7 text-[var(--accent)]" />
            Insurance
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--text-secondary)]">
            Keep your coverage, premiums, nominees, and renewal dates organized in one secure view.
          </p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[var(--accent)] px-5 text-sm font-semibold text-white shadow-[var(--shadow-sm)] transition hover:bg-[var(--accent-hover)]"
        >
          <Plus className="w-4 h-4" /> Add Policy
        </button>
      </div>

      {error && !isModalOpen && (
        <div className="flex items-start gap-3 rounded-2xl border border-[var(--danger-soft)] bg-[var(--danger-soft)] p-4 text-sm text-[var(--danger)]" role="alert">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] p-5 shadow-[var(--shadow-sm)]">
          <p className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Total Active Policies</p>
          <div className="flex items-center justify-between mt-2">
            <span className="text-2xl font-bold text-[var(--text-primary)]">{policies.length}</span>
            <ShieldCheck className="w-8 h-8 text-emerald-500/20 dark:text-emerald-400/20" />
          </div>
        </div>

        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] p-5 shadow-[var(--shadow-sm)]">
          <p className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Total Coverage</p>
          <div className="flex items-center justify-between mt-2">
            <span className="text-2xl font-bold text-[var(--text-primary)]">₹{totalCoverage.toLocaleString()}</span>
            <DollarSign className="w-8 h-8 text-blue-500/20 dark:text-blue-400/20" />
          </div>
        </div>

        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] p-5 shadow-[var(--shadow-sm)]">
          <p className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Total Annual Premium</p>
          <div className="flex items-center justify-between mt-2">
            <span className="text-2xl font-bold text-[var(--text-primary)]">₹{totalPremium.toLocaleString()}</span>
            <Calendar className="w-8 h-8 text-purple-500/20 dark:text-purple-400/20" />
          </div>
        </div>

        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] p-5 shadow-[var(--shadow-sm)]">
          <p className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Renewals Due Soon</p>
          <div className="flex items-center justify-between mt-2">
            <span className={`text-2xl font-bold ${upcomingRenewals.length > 0 ? "text-amber-600 dark:text-amber-400" : "text-[var(--text-primary)]"}`}>
              {upcomingRenewals.length}
            </span>
            <AlertTriangle className={`w-8 h-8 ${upcomingRenewals.length > 0 ? "text-amber-500" : "text-slate-400/20"}`} />
          </div>
        </div>
      </div>

      {/* Renewal Alert Banner if any */}
      {upcomingRenewals.length > 0 && (
        <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-800/60 dark:bg-amber-950/40">
          <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-amber-900 dark:text-amber-200 text-sm">Upcoming Policy Renewals</h3>
            <p className="text-xs text-amber-800 dark:text-amber-300 mt-0.5">
              You have {upcomingRenewals.length} policy(ies) requiring renewal within the next 30 days:{" "}
              {upcomingRenewals.map((p) => `${p.provider} (${p.policyNumber})`).join(", ")}
            </p>
          </div>
        </div>
      )}

      {/* Main Grid */}
      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {[1, 2, 3].map((item) => <div key={item} className="h-64 animate-pulse rounded-2xl border border-[var(--border)] bg-[var(--card-bg)]" />)}
        </div>
      ) : policies.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--card-bg)] px-6 py-16 text-center shadow-[var(--shadow-sm)]">
          <ShieldCheck className="w-12 h-12 text-slate-400 dark:text-slate-600 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-[var(--text-primary)]">No Insurance Policies Found</h3>
          <p className="text-[var(--text-secondary)] text-sm mt-1 mb-6">
            Keep track of your health, life, and asset coverage in one place.
          </p>
          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-2 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white px-4 py-2.5 rounded-xl text-sm font-medium transition"
          >
            <Plus className="w-4 h-4" /> Add Your First Policy
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {policies.map((policy) => {
            const daysLeft = policy.daysUntilRenewal ?? 0;
            const isDueSoon = policy.isRenewalDueSoon;

            return (
              <div
                key={policy.id}
                className="group flex flex-col justify-between rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] p-5 shadow-[var(--shadow-sm)] transition hover:-translate-y-0.5 hover:border-[var(--accent-border)] hover:shadow-[var(--shadow-card)]"
              >
                <div>
                  {/* Card Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="rounded-xl bg-[var(--accent-soft)] p-2.5">
                        {getPolicyIcon(policy.policyType)}
                      </div>
                      <div>
                        <h3 className="font-bold text-[var(--text-primary)]">{policy.provider}</h3>
                        <p className="text-xs text-[var(--text-secondary)] font-mono">#{policy.policyNumber}</p>
                      </div>
                    </div>
                    <span className="rounded-full bg-[var(--surface-muted)] px-2.5 py-1 text-xs font-semibold capitalize text-[var(--text-secondary)]">
                      {policy.policyType}
                    </span>
                  </div>

                  {/* Coverage & Premium */}
                  <div className="mt-5 grid grid-cols-2 gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface-subtle)] p-3">
                    <div>
                      <p className="text-xs text-[var(--text-secondary)]">Coverage</p>
                      <p className="text-sm font-bold text-[var(--text-primary)] mt-0.5">
                        ₹{parseFloat(policy.coverageAmount).toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-[var(--text-secondary)]">Premium ({policy.premiumFrequency})</p>
                      <p className="text-sm font-bold text-[var(--text-primary)] mt-0.5">
                        ₹{parseFloat(policy.premium).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {/* Dates & Nominee */}
                  <div className="mt-4 space-y-2 text-xs text-slate-600 dark:text-slate-400">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-slate-500">
                        <Calendar className="w-3.5 h-3.5" /> Renewal Date:
                      </span>
                      <span className="font-medium text-[var(--text-primary)]">
                        {new Date(policy.renewalDate).toLocaleDateString()}
                      </span>
                    </div>

                    {policy.nominee && (
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Nominee:</span>
                        <span className="font-medium text-[var(--text-primary)]">{policy.nominee}</span>
                      </div>
                    )}

                    {policy.notes && (
                      <p className="text-[var(--text-secondary)] italic text-[11px] pt-1 border-t border-slate-100 dark:border-[var(--border)] line-clamp-2">
                        &quot;{policy.notes}&quot;
                      </p>
                    )}
                  </div>
                </div>

                {/* Card Footer */}
                <div className="mt-5 flex items-center justify-between border-t border-[var(--border)] pt-4">
                  <div className="flex items-center gap-1.5 text-xs">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    {daysLeft > 0 ? (
                      <span className={isDueSoon ? "text-amber-600 dark:text-amber-400 font-semibold" : "text-slate-500"}>
                        {daysLeft} days until renewal
                      </span>
                    ) : daysLeft === 0 ? (
                      <span className="text-rose-600 font-semibold">Renews Today!</span>
                    ) : (
                      <span className="text-rose-500">Expired ({Math.abs(daysLeft)} days ago)</span>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEdit(policy)}
                      className="p-1.5 hover:bg-slate-100 dark:hover:bg-[var(--surface-muted)] rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white transition"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(policy.id)}
                      className="p-1.5 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg text-rose-500 hover:text-rose-600 transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Policy Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-[var(--card-bg)] border border-slate-200 dark:border-[var(--border)] rounded-2xl w-full max-w-xl p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-[var(--text-primary)] mb-4">
              {editingPolicy ? "Edit Policy" : "Add Insurance Policy"}
            </h2>

            {error && (
              <div className="mb-4 p-3 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 text-sm rounded-xl">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="wl-modal-form space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Insurance Provider *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., Star Health, HDFC ERGO"
                    value={formData.provider}
                    onChange={(e) => setFormData({ ...formData, provider: e.target.value })}
                    className="wl-input h-11 rounded-xl px-3 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Policy Number *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., POL-99201"
                    value={formData.policyNumber}
                    onChange={(e) => setFormData({ ...formData, policyNumber: e.target.value })}
                    className="wl-input h-11 rounded-xl px-3 text-sm font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Policy Type *
                  </label>
                  <select
                    value={formData.policyType}
                    onChange={(e) => setFormData({ ...formData, policyType: e.target.value as InsurancePolicy["policyType"] })}
                    className="wl-input h-11 rounded-xl px-3 text-sm capitalize"
                  >
                    <option value="health">Health Insurance</option>
                    <option value="life">Life Insurance</option>
                    <option value="vehicle">Vehicle Insurance</option>
                    <option value="home">Home Insurance</option>
                    <option value="travel">Travel Insurance</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Coverage Amount (₹) *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    placeholder="e.g., 500000"
                    value={formData.coverageAmount}
                    onChange={(e) => setFormData({ ...formData, coverageAmount: e.target.value })}
                    className="wl-input h-11 rounded-xl px-3 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Premium Amount (₹) *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    placeholder="e.g., 12000"
                    value={formData.premium}
                    onChange={(e) => setFormData({ ...formData, premium: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-[var(--surface-muted)] border border-slate-200 dark:border-[var(--border)] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Premium Frequency
                  </label>
                  <select
                    value={formData.premiumFrequency}
                    onChange={(e) => setFormData({ ...formData, premiumFrequency: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-[var(--surface-muted)] border border-slate-200 dark:border-[var(--border)] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:text-white"
                  >
                    <option value="annual">Annual</option>
                    <option value="semi-annual">Semi-Annual</option>
                    <option value="quarterly">Quarterly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-[var(--surface-muted)] border border-slate-200 dark:border-[var(--border)] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Renewal Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.renewalDate}
                    onChange={(e) => setFormData({ ...formData, renewalDate: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-[var(--surface-muted)] border border-slate-200 dark:border-[var(--border)] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Nominee (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g., Spouse / Parent name"
                  value={formData.nominee}
                  onChange={(e) => setFormData({ ...formData, nominee: e.target.value })}
                  className="wl-input h-11 rounded-xl px-3 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Notes / Policy Details (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Additional coverage details or claim helpline numbers..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="wl-input min-h-24 resize-y rounded-xl px-3 py-2 text-sm"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-[var(--border)]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-[var(--surface-muted)] transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl text-sm font-medium bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white transition shadow-sm disabled:opacity-50"
                >
                  {submitting ? "Saving..." : editingPolicy ? "Save Changes" : "Create Policy"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
