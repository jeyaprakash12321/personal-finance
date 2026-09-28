"use client";

export function DashboardErrorPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[var(--background)]">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">
          Something went wrong
        </h1>
        <p className="mt-2 text-[var(--text-secondary)]">
          We couldn&apos;t load your financial dashboard.
          Check that the API is running and try again.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 rounded-lg bg-[var(--accent)] px-4 py-2 text-white hover:bg-[var(--accent-hover)]"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
