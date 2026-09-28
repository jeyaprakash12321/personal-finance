"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Landmark, Plus, Receipt, Settings } from "lucide-react";

const items = [
  { label: "Home", href: "/", icon: Home },
  { label: "Activity", href: "/transactions", icon: Receipt },
  { label: "Accounts", href: "/accounts", icon: Landmark },
  { label: "Settings", href: "/settings", icon: Settings },
];

export function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Mobile navigation"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-[var(--border)] bg-[color-mix(in_srgb,var(--surface)_94%,transparent)] px-3 pb-[calc(0.65rem+env(safe-area-inset-bottom))] pt-2 shadow-[0_-8px_30px_rgba(15,23,42,0.08)] backdrop-blur-xl lg:hidden"
    >
      <div className="mx-auto flex max-w-md items-end justify-around">
        {items.slice(0, 2).map((item) => {
          const Icon = item.icon;
          const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex min-w-16 flex-col items-center gap-1 rounded-xl px-2 py-1.5 text-[10px] font-semibold transition-colors ${
                active ? "text-[var(--accent)]" : "text-[var(--text-muted)]"
              }`}
            >
              <Icon className="h-5 w-5" strokeWidth={active ? 2.25 : 1.8} />
              <span>{item.label}</span>
            </Link>
          );
        })}

        <Link
          href="/transactions"
          aria-label="Add transaction"
          className="-mt-7 flex h-14 w-14 items-center justify-center rounded-full border-4 border-[var(--background)] bg-[var(--accent)] text-white shadow-lg shadow-[color-mix(in_srgb,var(--accent)_30%,transparent)] transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[color-mix(in_srgb,var(--accent)_30%,transparent)]"
        >
          <Plus className="h-7 w-7" strokeWidth={2.25} />
        </Link>

        {items.slice(2).map((item) => {
          const Icon = item.icon;
          const active = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex min-w-16 flex-col items-center gap-1 rounded-xl px-2 py-1.5 text-[10px] font-semibold transition-colors ${
                active ? "text-[var(--accent)]" : "text-[var(--text-muted)]"
              }`}
            >
              <Icon className="h-5 w-5" strokeWidth={active ? 2.25 : 1.8} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
