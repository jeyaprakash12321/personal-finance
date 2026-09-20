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

import { setToken } from "../../lib/auth";

export default function RegisterPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] =
    useState("");
  const [password, setPassword] =
    useState("");

  const [showPassword, setShowPassword] =
    useState(false);

  const [error, setError] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");
    setLoading(true);

    try {
      const response = await fetch(
        "http://localhost:4000/auth/register",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            name,
            email,
            password,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(
          data.message ||
            "Unable to create your account"
        );

        return;
      }

      setToken(data.token);

      router.push("/");
      router.refresh();
    } catch {
      setError(
        "Unable to connect to Wealthly. Make sure the API is running."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f7faf8]">
      <div className="grid min-h-screen lg:grid-cols-2">
        {/* Left */}
        <div className="hidden overflow-hidden bg-[#078653] p-10 lg:flex lg:flex-col lg:justify-between">
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
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#d9f7e9] text-lg font-bold text-[#078653]">
                  W
                </div>

                <div>
                  <p className="text-[17px] font-bold text-[#10231c]">
                    Wealthly
                  </p>

                  <p className="text-[10px] text-[#91a09a]">
                    Small steps. Bigger tomorrows.
                  </p>
                </div>
              </div>
            </div>

            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#16a36a]">
                Get started
              </p>

              <h2 className="mt-2 text-[30px] font-bold tracking-[-0.04em] text-[#10231c]">
                Create your account
              </h2>

              <p className="mt-2 text-sm text-[#71817a]">
                Start building your financial picture.
              </p>
            </div>

            <form
              onSubmit={handleSubmit}
              className="mt-8 space-y-5"
            >
              <div>
                <label className="mb-2 block text-xs font-semibold text-[#40534b]">
                  Name
                </label>

                <div className="relative">
                  <User className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#91a09a]" />

                  <input
                    type="text"
                    value={name}
                    onChange={(event) =>
                      setName(event.target.value)
                    }
                    placeholder="Your name"
                    required
                    autoComplete="name"
                    className="w-full rounded-xl border border-[#dfe8e2] bg-white py-3.5 pl-11 pr-4 text-sm text-[#30453c] outline-none transition placeholder:text-[#a0ada7] focus:border-[#16a36a] focus:ring-4 focus:ring-[#ecfdf5]"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-xs font-semibold text-[#40534b]">
                  Email
                </label>

                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#91a09a]" />

                  <input
                    type="email"
                    value={email}
                    onChange={(event) =>
                      setEmail(event.target.value)
                    }
                    placeholder="you@example.com"
                    required
                    autoComplete="email"
                    className="w-full rounded-xl border border-[#dfe8e2] bg-white py-3.5 pl-11 pr-4 text-sm text-[#30453c] outline-none transition placeholder:text-[#a0ada7] focus:border-[#16a36a] focus:ring-4 focus:ring-[#ecfdf5]"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-xs font-semibold text-[#40534b]">
                  Password
                </label>

                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#91a09a]" />

                  <input
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
                    className="w-full rounded-xl border border-[#dfe8e2] bg-white py-3.5 pl-11 pr-12 text-sm text-[#30453c] outline-none transition placeholder:text-[#a0ada7] focus:border-[#16a36a] focus:ring-4 focus:ring-[#ecfdf5]"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowPassword(
                        (value) => !value
                      )
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-2 text-[#91a09a] hover:bg-[#f1f8f4] hover:text-[#60736b]"
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
                <div className="rounded-xl border border-[#ffd8d9] bg-[#fff5f5] px-4 py-3 text-sm text-[#c9474b]">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#078653] px-5 py-3.5 text-sm font-semibold text-white shadow-[0_8px_20px_rgba(7,134,83,0.18)] transition hover:bg-[#056b43] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading
                  ? "Creating account..."
                  : "Create account"}

                {!loading && (
                  <ArrowRight className="h-4 w-4" />
                )}
              </button>
            </form>

            <p className="mt-7 text-center text-sm text-[#71817a]">
              Already have an account?{" "}
              <Link
                href="/login"
                className="font-semibold text-[#078653] hover:text-[#056b43]"
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