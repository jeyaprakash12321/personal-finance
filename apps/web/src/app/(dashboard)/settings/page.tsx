"use client";

import { useState } from "react";
import {
  Bell,
  Check,
  ChevronRight,
  CircleDollarSign,
  Globe,
  Lock,
  Moon,
  Palette,
  Shield,
  User,
} from "lucide-react";

type ToggleProps = {
  enabled: boolean;
  onChange: (value: boolean) => void;
};

function Toggle({ enabled, onChange }: ToggleProps) {
  return (
    <button
      type="button"
      onClick={() => onChange(!enabled)}
      className={`relative h-6 w-11 rounded-full transition ${
        enabled ? "bg-[#16a36a]" : "bg-[#d9e2dd]"
      }`}
      aria-pressed={enabled}
    >
      <span
        className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow-sm transition ${
          enabled ? "left-6" : "left-1"
        }`}
      />
    </button>
  );
}

export default function SettingsPage() {
  const [notifications, setNotifications] = useState(true);
  const [monthlySummary, setMonthlySummary] = useState(true);
  const [goalReminders, setGoalReminders] = useState(true);
  const [compactMode, setCompactMode] = useState(false);

  const [currency, setCurrency] = useState("INR");
  const [saved, setSaved] = useState(false);

  function handleSave() {
    setSaved(true);

    window.setTimeout(() => {
      setSaved(false);
    }, 2000);
  }

  return (
    <div className="min-h-screen px-5 py-6 sm:px-8 lg:px-10">
      <div className="mx-auto max-w-[1100px]">
        {/* Header */}
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#16a36a]">
            Preferences
          </p>

          <h1 className="mt-2 text-[30px] font-bold tracking-[-0.04em] text-[#10231c] sm:text-[36px]">
            Settings
          </h1>

          <p className="mt-2 text-sm leading-6 text-[#71817a]">
            Personalize how Wealthly works for you.
          </p>
        </div>

        <div className="mt-7 space-y-6">
          {/* Profile */}
          <section className="overflow-hidden rounded-2xl border border-[#e4ebe7] bg-white shadow-[0_8px_30px_rgba(16,35,28,0.04)]">
            <div className="border-b border-[#edf1ef] px-5 py-5 sm:px-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#ecfdf5] text-[#16a36a]">
                  <User className="h-5 w-5" />
                </div>

                <div>
                  <h2 className="text-[16px] font-bold text-[#10231c]">
                    Profile
                  </h2>

                  <p className="mt-0.5 text-xs text-[#82908a]">
                    Your personal Wealthly profile.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid gap-5 p-5 sm:grid-cols-2 sm:p-6">
              <SettingField
                label="Name"
                value="Test User"
                placeholder="Your name"
              />

              <SettingField
                label="Email"
                value="test@example.com"
                placeholder="Your email"
              />
            </div>
          </section>

          {/* Preferences */}
          <section className="overflow-hidden rounded-2xl border border-[#e4ebe7] bg-white shadow-[0_8px_30px_rgba(16,35,28,0.04)]">
            <div className="border-b border-[#edf1ef] px-5 py-5 sm:px-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#eef4ff] text-[#4c8df6]">
                  <Palette className="h-5 w-5" />
                </div>

                <div>
                  <h2 className="text-[16px] font-bold text-[#10231c]">
                    Preferences
                  </h2>

                  <p className="mt-0.5 text-xs text-[#82908a]">
                    Choose how financial information is displayed.
                  </p>
                </div>
              </div>
            </div>

            <div className="divide-y divide-[#edf1ef]">
              <PreferenceRow
                icon={<CircleDollarSign className="h-4 w-4" />}
                title="Default currency"
                description="Currency used throughout Wealthly."
              >
                <select
                  value={currency}
                  onChange={(event) =>
                    setCurrency(event.target.value)
                  }
                  className="rounded-lg border border-[#dfe8e2] bg-white px-3 py-2 text-sm font-medium text-[#30453c] outline-none focus:border-[#16a36a]"
                >
                  <option value="INR">INR — ₹</option>
                  <option value="USD">USD — $</option>
                  <option value="EUR">EUR — €</option>
                  <option value="GBP">GBP — £</option>
                </select>
              </PreferenceRow>

              <PreferenceRow
                icon={<Globe className="h-4 w-4" />}
                title="Language"
                description="Language used across the application."
              >
                <span className="text-sm font-medium text-[#60736b]">
                  English
                </span>
              </PreferenceRow>

              <PreferenceRow
                icon={<Moon className="h-4 w-4" />}
                title="Compact mode"
                description="Use tighter spacing across financial lists."
              >
                <Toggle
                  enabled={compactMode}
                  onChange={setCompactMode}
                />
              </PreferenceRow>
            </div>
          </section>

          {/* Notifications */}
          <section className="overflow-hidden rounded-2xl border border-[#e4ebe7] bg-white shadow-[0_8px_30px_rgba(16,35,28,0.04)]">
            <div className="border-b border-[#edf1ef] px-5 py-5 sm:px-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#fff7e8] text-[#e4a62b]">
                  <Bell className="h-5 w-5" />
                </div>

                <div>
                  <h2 className="text-[16px] font-bold text-[#10231c]">
                    Notifications
                  </h2>

                  <p className="mt-0.5 text-xs text-[#82908a]">
                    Decide which financial reminders you receive.
                  </p>
                </div>
              </div>
            </div>

            <div className="divide-y divide-[#edf1ef]">
              <PreferenceRow
                icon={<Bell className="h-4 w-4" />}
                title="Financial notifications"
                description="Receive important updates about your finances."
              >
                <Toggle
                  enabled={notifications}
                  onChange={setNotifications}
                />
              </PreferenceRow>

              <PreferenceRow
                icon={<CircleDollarSign className="h-4 w-4" />}
                title="Monthly summary"
                description="Get a summary of your monthly financial activity."
              >
                <Toggle
                  enabled={monthlySummary}
                  onChange={setMonthlySummary}
                />
              </PreferenceRow>

              <PreferenceRow
                icon={<Shield className="h-4 w-4" />}
                title="Goal reminders"
                description="Receive reminders about your financial goals."
              >
                <Toggle
                  enabled={goalReminders}
                  onChange={setGoalReminders}
                />
              </PreferenceRow>
            </div>
          </section>

          {/* Security */}
          <section className="overflow-hidden rounded-2xl border border-[#e4ebe7] bg-white shadow-[0_8px_30px_rgba(16,35,28,0.04)]">
            <div className="border-b border-[#edf1ef] px-5 py-5 sm:px-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#f2edff] text-[#8b6cf6]">
                  <Lock className="h-5 w-5" />
                </div>

                <div>
                  <h2 className="text-[16px] font-bold text-[#10231c]">
                    Security
                  </h2>

                  <p className="mt-0.5 text-xs text-[#82908a]">
                    Account security controls will be connected after
                    authentication is enabled.
                  </p>
                </div>
              </div>
            </div>

            <div className="p-5 sm:p-6">
              <button
                type="button"
                disabled
                className="flex w-full items-center justify-between rounded-xl border border-[#edf1ef] bg-[#f8faf9] px-4 py-4 text-left opacity-70"
              >
                <div>
                  <p className="text-sm font-semibold text-[#40534b]">
                    Change password
                  </p>

                  <p className="mt-1 text-xs text-[#91a09a]">
                    Available when account authentication is enabled.
                  </p>
                </div>

                <ChevronRight className="h-4 w-4 text-[#a0ada7]" />
              </button>
            </div>
          </section>

          {/* Save */}
          <div className="flex items-center justify-end gap-3 pb-8">
            {saved && (
              <span className="flex items-center gap-1.5 text-sm font-medium text-[#078653]">
                <Check className="h-4 w-4" />
                Preferences saved
              </span>
            )}

            <button
              type="button"
              onClick={handleSave}
              className="rounded-xl bg-[#078653] px-5 py-3 text-sm font-semibold text-white shadow-[0_8px_20px_rgba(7,134,83,0.18)] transition hover:bg-[#056b43]"
            >
              Save preferences
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function SettingField({
  label,
  value,
  placeholder,
}: {
  label: string;
  value: string;
  placeholder: string;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-semibold text-[#60736b]">
        {label}
      </span>

      <input
        value={value}
        placeholder={placeholder}
        readOnly
        className="w-full rounded-xl border border-[#e1e9e4] bg-[#f8faf9] px-4 py-3 text-sm font-medium text-[#40534b] outline-none"
      />
    </label>
  );
}

function PreferenceRow({
  icon,
  title,
  description,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-5 px-5 py-5 sm:px-6">
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#f5f8f6] text-[#71817a]">
          {icon}
        </div>

        <div className="min-w-0">
          <p className="text-sm font-semibold text-[#30453c]">
            {title}
          </p>

          <p className="mt-0.5 text-xs leading-5 text-[#91a09a]">
            {description}
          </p>
        </div>
      </div>

      <div className="shrink-0">{children}</div>
    </div>
  );
}