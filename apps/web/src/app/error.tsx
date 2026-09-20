"use client";

import { RefreshCcw } from "lucide-react";

export default function ErrorPage({
  reset,
}: {
  reset: () => void;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f8faf9] px-6">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-600">
          <span className="text-lg font-bold">!</span>
        </div>

        <h1 className="mt-5 text-xl font-bold text-slate-900">
          Something went wrong
        </h1>

        <p className="mt-2 text-sm leading-6 text-slate-500">
          We couldn't load your financial dashboard.
          Check that the API is running and try again.
        </p>

        <button
          onClick={() => reset()}
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700"
        >
          <RefreshCcw className="h-4 w-4" />
          Try again
        </button>
      </div>
    </div>
  );
}