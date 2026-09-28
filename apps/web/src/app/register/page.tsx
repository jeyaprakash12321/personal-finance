"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import {
  ArrowRight,
  Eye,
  EyeOff,
  Lock,
  Mail,
  Sparkles,
  User,
} from "lucide-react";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          email,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Unable to create your account");
        return;
      }

      router.push("/");
      router.refresh();
    } catch {
      setError("Unable to connect to Wealthly. Make sure the API is running.");
    } finally {
      setLoading(false);
    }
  }


  return (
    <main className="min-h-screen bg-[var(--background)]">
      <div className="grid min-h-screen lg:grid-cols-2">
        {/* Left */}
        <div className="hidden overflow-hidden bg-[var(--accent)] p-10 lg:flex lg:flex-col lg:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 text-lg font-bold text-white">
                W
              </div>

              <div>
                <p className="text-[17px] font-bold tracking-[-0.03em] text-white">
                  Wealthly
                </p>

                <p className="text-[10px] text-white/60">
                  Small steps. Bigger tomorrows.
                </p>
              </div>
            </div>
          </div>

          <div className="max-w-md">
            <Sparkles className="h-7 w-7 text-[#b7efd3]" />

            <h1 className="mt-6 text-[42px] font-bold leading-[1.08] tracking-[-0.05em] text-white">
              Build better
              <br />
              money habits.
            </h1>

            <p className="mt-6 text-sm leading-6 text-white/70">
              Track your money, build meaningful goals,
              and get a clearer picture of your financial
              future.
            </p>
          </div>

          <p className="text-xs text-white/45">
            Wealthly v1.0
          </p>
        </div>

        {/* Right */}
        <div className="flex items-center justify-center px-5 py-10 sm:px-8">
          <div className="w-full max-w-[430px]">
            <div className="mb-8 lg:hidden">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--accent-soft)] text-lg font-bold text-[var(--accent)]">
                  W
                </div>

                <div>
                  <p className="text-[17px] font-bold text-[var(--text-primary)]">
                    Wealthly
                  </p>

                  <p className="text-[10px] text-[var(--text-muted)]">
                    Small steps. Bigger tomorrows.
                  </p>
                </div>
              </div>
            </div>

            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--accent)]">
                Get started
              </p>

              <h2 className="mt-2 text-[30px] font-bold tracking-[-0.04em] text-[var(--text-primary)]">
                Create your account
              </h2>

              <p className="mt-2 text-sm text-[var(--text-secondary)]">
                Start building your financial picture.
              </p>
            </div>

            <form
              onSubmit={handleSubmit}
              className="mt-8 space-y-5"
            >
              <div>
                <label htmlFor="register-name" className="mb-2 block text-xs font-semibold text-[var(--text-secondary)]">
                  Name
                </label>

                <div className="relative">
                  <User className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />

                  <input
                    id="register-name"
                    type="text"
                    value={name}
                    onChange={(event) =>
                      setName(event.target.value)
                    }
                    placeholder="Your name"
                    required
                    autoComplete="name"
                    className="w-full rounded-xl border border-[var(--input-border)] bg-[var(--input-bg)] py-3.5 pl-11 pr-4 text-sm text-[var(--text-primary)] outline-none transition placeholder:text-[var(--text-muted)] focus:border-[var(--accent)] focus:ring-4 focus:ring-[var(--accent-soft)]"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="register-email" className="mb-2 block text-xs font-semibold text-[var(--text-secondary)]">
                  Email
                </label>

                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />

                  <input
                    id="register-email"
                    type="email"
                    value={email}
                    onChange={(event) =>
                      setEmail(event.target.value)
                    }
                    placeholder="you@example.com"
                    required
                    autoComplete="email"
                    className="w-full rounded-xl border border-[var(--input-border)] bg-[var(--input-bg)] py-3.5 pl-11 pr-4 text-sm text-[var(--text-primary)] outline-none transition placeholder:text-[var(--text-muted)] focus:border-[var(--accent)] focus:ring-4 focus:ring-[var(--accent-soft)]"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="register-password" className="mb-2 block text-xs font-semibold text-[var(--text-secondary)]">
                  Password
                </label>

                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />

                  <input
                    id="register-password"
                    type={
                      showPassword
                        ? "text"
                        : "password"
                    }
                    value={password}
                    onChange={(event) =>
                      setPassword(
                        event.target.value
                      )
                    }
                    placeholder="At least 8 characters"
                    required
                    minLength={8}
                    autoComplete="new-password"
                    className="w-full rounded-xl border border-[var(--input-border)] bg-[var(--input-bg)] py-3.5 pl-11 pr-12 text-sm text-[var(--text-primary)] outline-none transition placeholder:text-[var(--text-muted)] focus:border-[var(--accent)] focus:ring-4 focus:ring-[var(--accent-soft)]"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowPassword(
                        (value) => !value
                      )
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-2 text-[var(--text-muted)] hover:bg-[var(--surface-muted)] hover:text-[var(--text-secondary)]"
                    aria-label={
                      showPassword
                        ? "Hide password"
                        : "Show password"
                    }
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {error && (
                <div className="rounded-xl border border-[var(--danger-border,#ffb3b8)] bg-[var(--danger-soft)] px-4 py-3 text-sm text-[var(--danger)]">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--accent)] px-5 py-3.5 text-sm font-semibold text-white shadow-[0_8px_20px_rgba(var(--accent-rgb),0.18)] transition hover:bg-[var(--accent-hover)] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading
                  ? "Creating account..."
                  : "Create account"}

                {!loading && (
                  <ArrowRight className="h-4 w-4" />
                )}
              </button>
            </form>

            <p className="mt-7 text-center text-sm text-[var(--text-secondary)]">
              Already have an account?{" "}
              <Link
                href="/login"
                className="font-semibold text-[var(--accent)] hover:text-[var(--accent-hover)]"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
