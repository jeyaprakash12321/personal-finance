"use client";

import { AlertTriangle, CheckCircle2, Info, X } from "lucide-react";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

type ConfirmOptions = {
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
};

type Notice = { message: string; tone: "success" | "error" | "info" };
type DialogContextValue = {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
  notify: (message: string, tone?: Notice["tone"]) => void;
};

const DialogContext = createContext<DialogContextValue | null>(null);

export function DialogProvider({ children }: { children: ReactNode }) {
  const [confirmation, setConfirmation] = useState<(ConfirmOptions & { resolve: (value: boolean) => void }) | null>(null);
  const [notice, setNotice] = useState<Notice | null>(null);

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(null), 3600);
    return () => window.clearTimeout(timer);
  }, [notice]);

  const confirm = (options: ConfirmOptions) => new Promise<boolean>((resolve) => setConfirmation({ ...options, resolve }));
  const closeConfirmation = (value: boolean) => {
    confirmation?.resolve(value);
    setConfirmation(null);
  };

  return (
    <DialogContext.Provider value={{ confirm, notify: (message, tone = "info") => setNotice({ message, tone }) }}>
      {children}
      {confirmation && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm" role="presentation">
          <div role="dialog" aria-modal="true" aria-labelledby="confirmation-title" className="w-full max-w-md rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-2xl">
            <div className="flex items-start gap-4">
              <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${confirmation.destructive ? "bg-[var(--danger-soft)] text-[var(--danger)]" : "bg-[var(--accent-soft)] text-[var(--accent)]"}`}>
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <h2 id="confirmation-title" className="text-lg font-bold text-[var(--text-primary)]">{confirmation.title}</h2>
                <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">{confirmation.description}</p>
              </div>
              <button type="button" aria-label="Close dialog" onClick={() => closeConfirmation(false)} className="rounded-xl p-2 text-[var(--text-muted)] hover:bg-[var(--surface-muted)] hover:text-[var(--text-primary)]">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button type="button" onClick={() => closeConfirmation(false)} className="rounded-xl border border-[var(--border)] px-4 py-2.5 text-sm font-semibold text-[var(--text-secondary)] hover:bg-[var(--surface-muted)]">{confirmation.cancelLabel ?? "Cancel"}</button>
              <button type="button" onClick={() => closeConfirmation(true)} className={`rounded-xl px-4 py-2.5 text-sm font-semibold text-white shadow-lg ${confirmation.destructive ? "bg-[var(--danger)]" : "bg-[var(--accent)]"}`}>{confirmation.confirmLabel ?? "Confirm"}</button>
            </div>
          </div>
        </div>
      )}
      {notice && (
        <div role="status" className="fixed right-4 top-4 z-[110] flex max-w-sm items-start gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 shadow-2xl">
          {notice.tone === "success" ? <CheckCircle2 className="mt-0.5 h-5 w-5 text-[var(--accent)]" /> : notice.tone === "error" ? <AlertTriangle className="mt-0.5 h-5 w-5 text-[var(--danger)]" /> : <Info className="mt-0.5 h-5 w-5 text-[var(--info)]" />}
          <p className="text-sm font-medium text-[var(--text-primary)]">{notice.message}</p>
          <button type="button" aria-label="Dismiss notification" onClick={() => setNotice(null)} className="text-[var(--text-muted)]"><X className="h-4 w-4" /></button>
        </div>
      )}
    </DialogContext.Provider>
  );
}

export function useConfirmDialog() {
  const context = useContext(DialogContext);
  if (!context) throw new Error("useConfirmDialog must be used inside DialogProvider");
  return context;
}
