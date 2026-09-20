"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BarChart3,
  CircleHelp,
  Home,
  Landmark,
  Lightbulb,
  LogOut,
  Receipt,
  Settings,
  Target,
  WalletCards,
} from "lucide-react";

import { removeToken } from "../../../lib/auth";

const navItems = [
  {
    label: "Dashboard",
    href: "/",
    icon: Home,
  },
  {
    label: "Transactions",
    href: "/transactions",
    icon: Receipt,
  },
  {
    label: "Budgets",
    href: "/budgets",
    icon: WalletCards,
  },
  {
    label: "Goals",
    href: "/goals",
    icon: Target,
  },
  {
    label: "Accounts",
    href: "/accounts",
    icon: Landmark,
  },
  {
    label: "Reports",
    href: "/reports",
    icon: BarChart3,
  },
  {
    label: "Insights",
    href: "/insights",
    icon: Lightbulb,
  },
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

  function handleLogout() {
    removeToken();

    router.push("/login");
    router.refresh();
  }

  return (
    <aside className="hidden h-screen w-[250px] shrink-0 border-r border-[#e4ebe7] bg-white/95 lg:flex lg:flex-col">
      <div className="flex h-[88px] items-center border-b border-[#edf1ef] px-6">
        <Link
          href="/"
          className="flex items-center gap-3"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#d9f7e9] text-lg font-bold text-[#078653]">
            W
          </div>

          <div>
            <p className="text-[17px] font-bold tracking-[-0.03em] text-[#10231c]">
              Wealthly
            </p>

            <p className="mt-0.5 text-[10px] font-medium tracking-wide text-[#91a09a]">
              Small steps. Bigger tomorrows.
            </p>
          </div>
        </Link>
      </div>

      <nav className="flex-1 px-4 py-6">
        <p className="mb-3 px-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#a0ada7]">
          Overview
        </p>

        <div className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;

            const isActive =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                  isActive
                    ? "bg-[#dff6ea] text-[#056b43] shadow-[inset_3px_0_0_#16a36a]"
                    : "text-[#60736b] hover:bg-[#f1f8f4] hover:text-[#10231c]"
                }`}
              >
                <Icon
                  className={`h-[18px] w-[18px] shrink-0 ${
                    isActive
                      ? "text-[#078653]"
                      : "text-[#91a09a] group-hover:text-[#60736b]"
                  }`}
                  strokeWidth={1.8}
                />

                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      <div className="border-t border-[#edf1ef] px-4 py-5">
        <div className="space-y-1">
          {bottomNavItems.map((item) => {
            const Icon = item.icon;

            const isActive =
              pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                  isActive
                    ? "bg-[#dff6ea] text-[#056b43] shadow-[inset_3px_0_0_#16a36a]"
                    : "text-[#60736b] hover:bg-[#f1f8f4] hover:text-[#10231c]"
                }`}
              >
                <Icon
                  className={`h-[18px] w-[18px] shrink-0 ${
                    isActive
                      ? "text-[#078653]"
                      : "text-[#91a09a] group-hover:text-[#60736b]"
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
          className="group mt-3 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-[#60736b] transition hover:bg-[#fff5f5] hover:text-[#c9474b]"
        >
          <LogOut
            className="h-[18px] w-[18px] text-[#91a09a] group-hover:text-[#c9474b]"
            strokeWidth={1.8}
          />

          <span>Log out</span>
        </button>

        <div className="mt-5 px-3">
          <p className="text-[10px] font-medium text-[#b0bbb6]">
            Wealthly v1.0
          </p>
        </div>
      </div>
    </aside>
  );
}