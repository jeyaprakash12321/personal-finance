"use client";

import { Bell, Search } from "lucide-react";

export function Topbar() {
  return (
    <header className="sticky top-0 z-30 flex h-[72px] items-center justify-between border-b border-[#e9efec] bg-white/90 px-4 backdrop-blur-xl sm:px-6 lg:px-8">
      <div className="ml-12 flex min-w-0 flex-1 lg:ml-0">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-slate-400" />

          <input
            type="search"
            placeholder="Search transactions, goals..."
            className="h-11 w-full rounded-xl border border-[#edf1ef] bg-[#f8faf9] pl-10 pr-4 text-[13px] text-[#42574e] outline-none placeholder:text-[#9aa8a2] transition focus:border-[#b7efd3] focus:bg-white focus:ring-4 focus:ring-[#d9f7e9]"
          />
        </div>
      </div>

      <div className="ml-4 flex shrink-0 items-center gap-4">
        <button
          className="relative flex h-10 w-10 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-50 hover:text-slate-800"
          aria-label="Notifications"
        >
          <Bell className="h-[19px] w-[19px]" />

          <span className="absolute right-2.5 top-2 h-1.5 w-1.5 rounded-full bg-emerald-500" />
        </button>

        <div className="hidden h-7 w-px bg-slate-200 sm:block" />

        <div className="flex items-center gap-3">
          <div className="hidden text-right sm:block">
            <p className="text-sm font-semibold text-slate-800">
              Jeyaprakash
            </p>

            <p className="text-xs text-slate-400">
              Keep going 🌱
            </p>
          </div>

          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#d9f7e9] text-sm font-bold text-[#056b43]">
            JP
          </div>
        </div>
      </div>
    </header>
  );
}