"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import {
  BarChart3,
  Banknote,
  CalendarClock,
  CircleHelp,
  CreditCard,
  Home,
  LineChart,
  Landmark,
  Lightbulb,
  LogOut,
  Menu,
  PiggyBank,
  Receipt,
  Settings,
  Target,
  Umbrella,
  WalletCards,
} from "lucide-react";

const navItems = [
  { section: "Money", label: "Dashboard", href: "/", icon: Home },
  { section: "Money", label: "Transactions", href: "/transactions", icon: Receipt },
  { section: "Money", label: "Accounts", href: "/accounts", icon: Landmark },
  { section: "Credit & Protection", label: "Credit Cards", href: "/credit-cards", icon: CreditCard },
  { section: "Credit & Protection", label: "Loans", href: "/loans", icon: Banknote },
  { section: "Credit & Protection", label: "Insurance", href: "/insurance", icon: Umbrella },
  { section: "Credit & Protection", label: "Investment Portfolio", href: "/portfolio", icon: LineChart },
  { section: "Planning", label: "Budgets", href: "/budgets", icon: WalletCards },
  { section: "Planning", label: "Goals", href: "/goals", icon: Target },
  { section: "Planning", label: "Recurring & Calendar", href: "/recurring", icon: CalendarClock },
  { section: "Planning", label: "Net Worth", href: "/net-worth", icon: PiggyBank },
  { section: "Insights", label: "Reports & Analytics", href: "/reports", icon: BarChart3 },
  { section: "Insights", label: "Insights", href: "/insights", icon: Lightbulb },
];

const bottomNavItems = [
  {
    label: "Settings",
    href: "/settings",
    icon: Settings,
  },
  {
    label: "Help & Support",
    href: "/help",
    icon: CircleHelp,
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  async function handleLogout() {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch (err) {
      console.error("Logout failed", err);
    }
    router.replace("/login");
    router.refresh();
  }

  return (
    <>
      <button
        type="button"
        aria-label="Open navigation"
        onClick={() => setMobileOpen(true)}
        className="fixed left-4 top-4 z-50 flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[var(--text-primary)] shadow-sm lg:hidden"
      >
        <Menu className="h-5 w-5" />
      </button>
      <aside className={`${mobileOpen ? "flex" : "hidden"} fixed inset-y-0 left-0 z-[60] h-screen w-[280px] shrink-0 flex-col border-r bg-[var(--sidebar-bg)] border-[var(--sidebar-border)] shadow-xl lg:sticky lg:top-3 lg:flex lg:h-[calc(100vh-1.5rem)] lg:w-[260px] lg:rounded-2xl lg:border lg:shadow-[var(--shadow-card)] transition-colors duration-200 overflow-y-auto`}>
      {/* Logo */}
      <div className="flex h-[72px] items-center border-b border-[var(--sidebar-border)] px-6">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--accent-soft)] text-base font-bold text-[var(--accent)]">
            W
          </div>
          <div>
            <p className="text-[16px] font-bold tracking-[-0.03em] text-[var(--text-primary)]">
              Wealthly
            </p>
            <p className="mt-0.5 text-[10px] font-medium tracking-wide text-[var(--text-muted)]">
              Small steps. Bigger tomorrows.
            </p>
          </div>
        </Link>
      </div>

      {/* Main nav */}
      <nav className="flex-1 px-3 py-5 overflow-y-auto">
        <div className="space-y-0.5">
          {navItems.map((item, index) => {
            const Icon = item.icon;
            const isActive =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);

            return (
              <div key={item.href}>
                {(index === 0 || navItems[index - 1].section !== item.section) && (
                  <p className={`${index === 0 ? "" : "mt-5"} mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--text-muted)]`}>
                    {item.section}
                  </p>
                )}
                <Link
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-[var(--sidebar-active)] text-[var(--sidebar-active-text)]"
                    : "text-[var(--sidebar-text)] hover:bg-[var(--sidebar-hover)] hover:text-[var(--text-primary)]"
                }`}
                style={isActive ? { boxShadow: "inset 3px 0 0 var(--accent)" } : undefined}
              >
                <Icon
                  className={`h-[18px] w-[18px] shrink-0 ${
                    isActive
                      ? "text-[var(--accent)]"
                      : "text-[var(--text-muted)] group-hover:text-[var(--sidebar-text)]"
                  }`}
                  strokeWidth={1.8}
                />
                <span>{item.label}</span>
                </Link>
              </div>
            );
          })}
        </div>
      </nav>

      {/* Bottom nav */}
      <div className="border-t border-[var(--sidebar-border)] px-3 py-4">
        <div className="space-y-0.5">
          {bottomNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-[var(--sidebar-active)] text-[var(--sidebar-active-text)]"
                    : "text-[var(--sidebar-text)] hover:bg-[var(--sidebar-hover)] hover:text-[var(--text-primary)]"
                }`}
                style={isActive ? { boxShadow: "inset 3px 0 0 var(--accent)" } : undefined}
              >
                <Icon
                  className={`h-[18px] w-[18px] shrink-0 ${
                    isActive
                      ? "text-[var(--accent)]"
                      : "text-[var(--text-muted)] group-hover:text-[var(--sidebar-text)]"
                  }`}
                  strokeWidth={1.8}
                />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>

        <button
          type="button"
          onClick={handleLogout}
          className="group mt-2 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-[var(--sidebar-text)] transition-colors hover:bg-[var(--danger-soft)] hover:text-[var(--danger)]"
        >
          <LogOut
            className="h-[18px] w-[18px] text-[var(--text-muted)] group-hover:text-[var(--danger)]"
            strokeWidth={1.8}
          />
          <span>Log out</span>
        </button>

        <div className="mt-4 px-3">
          <p className="text-[10px] font-medium text-[var(--text-muted)]">Wealthly v1.0</p>
        </div>
      </div>
      </aside>
      {mobileOpen && (
        <button
          type="button"
          aria-label="Close navigation overlay"
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 z-50 bg-black/30 lg:hidden"
        />
      )}
    </>
  );
}
