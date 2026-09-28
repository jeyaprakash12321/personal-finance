"use client";

import { useEffect, useState } from "react";
import { AlertCircle, Bell, CheckCircle2, Monitor, Moon, Search, Sun } from "lucide-react";
import { useTheme } from "../../theme-provider";

type UserProfile = {
  id: string;
  name: string | null;
  email: string;
};

type Notification = {
  id: string;
  title: string;
  message: string;
  severity: "warning" | "danger" | "info";
};

export function Topbar() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const { theme, setTheme } = useTheme();

  const cycleTheme = () => {
    if (theme === "light") setTheme("dark");
    else if (theme === "dark") setTheme("system");
    else setTheme("light");
  };

  useEffect(() => {
    async function loadUser() {
      try {
        const response = await fetch("/api/auth/me");
        if (response.ok) {
          const data = await response.json();
          setUser(data);
        }
      } catch (err) {
        console.error("Failed to fetch user in Topbar", err);
      }
    }
    loadUser();
  }, []);

  const displayName = user?.name || user?.email?.split("@")[0] || "User";
  const initials = displayName
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  async function toggleNotifications() {
    const nextOpen = !notificationsOpen;
    setNotificationsOpen(nextOpen);
    if (!nextOpen || notifications.length > 0) return;

    setNotificationsLoading(true);
    try {
      const response = await fetch("/api/notifications", { cache: "no-store" });
      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications ?? []);
      }
    } catch (error) {
      console.error("Failed to load notifications", error);
    } finally {
      setNotificationsLoading(false);
    }
  }

  return (
    <header className="sticky top-0 z-30 flex h-[72px] items-center justify-between rounded-b-2xl border border-t-0 bg-[var(--topbar-bg)] border-[var(--topbar-border)] px-4 backdrop-blur-xl sm:px-6 lg:rounded-2xl lg:border-t lg:px-8 transition-colors duration-200">
      <div className="ml-12 flex min-w-0 flex-1 lg:ml-0">
        <div className="relative hidden w-full max-w-md sm:block">
          <Search className="absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-[var(--text-muted)]" />

          <input
            type="search"
            placeholder="Search transactions, goals..."
            className="h-11 w-full rounded-xl border border-[var(--input-border)] bg-[var(--input-bg)] pl-10 pr-4 text-[13px] text-[var(--text-primary)] outline-none placeholder:text-[var(--text-muted)] transition focus:border-[var(--accent)] focus:bg-[var(--surface)] focus:ring-4 focus:ring-[color-mix(in_srgb,var(--accent)_20%,transparent)]"
          />
        </div>
        <div className="flex items-center gap-3 sm:hidden">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--accent-soft)] text-sm font-bold text-[var(--accent)]">
            {initials}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-[var(--text-primary)]">{displayName}</p>
            <p className="text-[11px] text-[var(--text-muted)]">Your financial overview</p>
          </div>
        </div>
      </div>

      <div className="ml-4 flex shrink-0 items-center gap-3">
        <button
          type="button"
          onClick={cycleTheme}
          title={`Current theme: ${theme}. Click to change.`}
          className="hidden h-10 w-10 items-center justify-center rounded-xl text-[var(--text-muted)] transition hover:bg-[var(--surface-muted)] hover:text-[var(--text-primary)] sm:flex"
        >
          {theme === "light" && <Sun className="h-[19px] w-[19px] text-amber-500" />}
          {theme === "dark" && <Moon className="h-[19px] w-[19px] text-indigo-400" />}
          {theme === "system" && <Monitor className="h-[19px] w-[19px]" />}
        </button>

        <div className="relative">
          <button
            type="button"
            onClick={toggleNotifications}
            className="relative flex h-10 w-10 items-center justify-center rounded-xl text-[var(--text-muted)] transition hover:bg-[var(--surface-muted)] hover:text-[var(--text-primary)]"
            aria-label="Notifications"
            aria-expanded={notificationsOpen}
            aria-controls="notifications-panel"
          >
            <Bell className="h-[19px] w-[19px]" />
            {notifications.length > 0 && <span className="absolute right-2.5 top-2 h-1.5 w-1.5 rounded-full bg-emerald-500" />}
          </button>
          {notificationsOpen && (
            <div id="notifications-panel" className="absolute right-0 top-12 z-50 w-[min(22rem,calc(100vw-2rem))] rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-3 shadow-xl" role="region" aria-label="Notifications panel">
              <div className="flex items-center justify-between px-2 pb-2">
                <h2 className="text-sm font-bold text-[var(--text-primary)]">Notifications</h2>
                <span className="text-xs text-[var(--text-muted)]">{notifications.length}</span>
              </div>
              {notificationsLoading ? (
                <p className="px-2 py-5 text-sm text-[var(--text-secondary)]">Checking your accounts...</p>
              ) : notifications.length === 0 ? (
                <div className="flex items-center gap-2 px-2 py-5 text-sm text-[var(--text-secondary)]">
                  <CheckCircle2 className="h-4 w-4 text-[var(--accent)]" aria-hidden="true" /> You&apos;re all caught up.
                </div>
              ) : (
                <div className="max-h-80 space-y-1 overflow-y-auto">
                  {notifications.map((notification) => (
                    <div key={notification.id} className="flex gap-2 rounded-xl p-2.5 hover:bg-[var(--surface-muted)]">
                      <AlertCircle className={`mt-0.5 h-4 w-4 shrink-0 ${notification.severity === "danger" ? "text-[var(--danger)]" : "text-amber-500"}`} aria-hidden="true" />
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-[var(--text-primary)]">{notification.title}</p>
                        <p className="mt-0.5 text-xs leading-5 text-[var(--text-secondary)]">{notification.message}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="hidden h-7 w-px bg-[var(--border)] sm:block" />

        <div className="flex items-center gap-3">
          <div className="hidden text-right sm:block">
            <p className="text-sm font-semibold text-[var(--text-primary)]">
              {displayName}
            </p>

            <p className="text-xs text-[var(--text-muted)]">
              Keep going 🌱
            </p>
          </div>

          <div className="hidden h-10 w-10 items-center justify-center rounded-full bg-[var(--accent-soft)] text-sm font-bold text-[var(--accent)] sm:flex">
            {initials}
          </div>
        </div>
      </div>
    </header>
  );
}
