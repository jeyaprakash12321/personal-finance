/**
 * PageShell — consistent page wrapper used by all dashboard pages.
 * Provides standard padding, max-width, and vertical rhythm.
 */
export function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[var(--background)] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <div className="mx-auto max-w-[1400px]">{children}</div>
    </div>
  );
}

/**
 * PageHeader — standard page heading block.
 * - eyebrow: small label above the title (optional)
 * - title: main h1
 * - description: subtitle (optional)
 * - action: primary CTA node rendered top-right (optional)
 */
export function PageHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {eyebrow && (
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--accent)]">
            {eyebrow}
          </p>
        )}
        <h1
          className={`font-bold tracking-[-0.04em] text-[var(--text-primary)] text-[26px] sm:text-[30px] ${eyebrow ? "mt-1" : ""}`}
        >
          {title}
        </h1>
        {description && (
          <p className="mt-1.5 max-w-2xl text-sm leading-6 text-[var(--text-secondary)]">
            {description}
          </p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

/**
 * SectionCard — standard white card used across all dashboard sections.
 */
export function SectionCard({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] shadow-[var(--shadow-card)] ${className}`}
    >
      {children}
    </div>
  );
}

/**
 * StatCard — small summary tile used in the 3-4 column row at the top of most pages.
 */
export function StatCard({
  label,
  value,
  description,
  valueClassName,
}: {
  label: string;
  value: string;
  description?: string;
  valueClassName?: string;
}) {
  return (
    <SectionCard className="p-5">
      <p className="text-xs font-medium text-[var(--text-muted)]">{label}</p>
      <p className={`mt-2 text-xl font-bold tracking-[-0.03em] text-[var(--text-primary)] ${valueClassName ?? ""}`}>
        {value}
      </p>
      {description && (
        <p className="mt-1 text-xs text-[var(--text-muted)]">{description}</p>
      )}
    </SectionCard>
  );
}

/**
 * EmptyState — consistent empty state used when a list has no items.
 */
export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <SectionCard className="flex min-h-[320px] flex-col items-center justify-center px-6 py-16 text-center border-dashed">
      {icon && (
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--accent-soft)] text-[var(--accent)]">
          {icon}
        </div>
      )}
      <h2 className="text-lg font-bold text-[var(--text-primary)]">{title}</h2>
      {description && (
        <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-[var(--text-secondary)]">
          {description}
        </p>
      )}
      {action && <div className="mt-6">{action}</div>}
    </SectionCard>
  );
}

/**
 * AlertBanner — error / success inline alert.
 */
export function AlertBanner({
  type,
  message,
}: {
  type: "error" | "success" | "warning";
  message: string;
}) {
  const styles = {
    error: "border-[var(--danger-soft)] bg-[var(--danger-soft)] text-[var(--danger)]",
    success: "border-[var(--accent-border)] bg-[var(--accent-soft)] text-[var(--accent-hover)]",
    warning: "border-[var(--warning-soft)] bg-[var(--warning-soft)] text-[var(--warning)]",
  };

  return (
    <div
      className={`rounded-xl border px-4 py-3 text-sm font-medium ${styles[type]}`}
      role="alert"
    >
      {message}
    </div>
  );
}
