"use client";

import { FormEvent, useState } from "react";
import { loginWithOtp } from "@/services/authService";
import { apiDelete } from "@/services/apiService";

export default function DeleteAccountPage() {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [confirmed, setConfirmed] = useState(false);

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (
    e: FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    if (loading) return;

    setError("");
    setSuccess(false);

    const trimmedIdentifier = identifier.trim();

    if (!trimmedIdentifier) {
      setError("Please enter your email.");
      return;
    }

    if (!password) {
      setError("Please enter your account password.");
      return;
    }

    if (!confirmed) {
      setError(
        "Please confirm that you understand the account deletion is permanent."
      );
      return;
    }

    setLoading(true);

    try {
      /*
       * STEP 1
       * Authenticate the user using the same login
       * service used by the KnowMato web application.
       *
       * The backend returns:
       * {
       *   access: "...",
       *   refresh: "...",
       *   user_id: ...,
       *   role: "...",
       *   display_name: "...",
       *   email: "..."
       * }
       */

      const loginResponse = await loginWithOtp({
        identifier: trimmedIdentifier,
        password,
      });

      const accessToken = loginResponse?.access;

      if (!accessToken) {
        throw new Error(
          "Unable to verify your account. Please check your email and password."
        );
      }

      /*
       * STEP 2
       * Permanently delete the authenticated account.
       *
       * IMPORTANT:
       * We do NOT save the access token to localStorage.
       * It is used only for this deletion request.
       */

      await apiDelete(
        "accounts/delete-account/",
        {
          confirm: true,
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      /*
       * STEP 3
       * Show successful deletion state.
       */

      setSuccess(true);

      setIdentifier("");
      setPassword("");
      setConfirmed(false);
    } catch (err: any) {
      console.error("Account deletion error:", err);

      /*
       * Your axios service may return a normalized error,
       * so check several possible message locations.
       */

      const message =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.response?.data?.detail ||
        err?.message ||
        "Something went wrong while deleting your account. Please try again.";

      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e] relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute top-0 -left-20 w-72 h-72 bg-purple-500/20 rounded-full blur-3xl" />

      <div className="absolute top-0 -right-20 w-72 h-72 bg-fuchsia-500/20 rounded-full blur-3xl" />

      <div className="absolute -bottom-20 left-40 w-72 h-72 bg-cyan-500/20 rounded-full blur-3xl" />

      <div className="relative z-10 min-h-screen flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-lg">

          {/* Card */}
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl p-6 sm:p-8">

            {/* Logo / Brand */}
            <div className="text-center mb-8">
              <div className="mx-auto mb-4 w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center shadow-lg shadow-violet-500/25">
                <span className="text-2xl font-extrabold text-white">
                  K
                </span>
              </div>

              <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-violet-300 to-fuchsia-300">
                KnowMato
              </h1>

              <p className="mt-2 text-white/60 text-sm">
                Account Deletion
              </p>
            </div>

            {!success ? (
              <>
                {/* Heading */}
                <div className="mb-6">
                  <h2 className="text-xl font-bold text-white">
                    Delete Your Account
                  </h2>

                  <p className="mt-2 text-sm leading-6 text-white/65">
                    Use this page to permanently delete your KnowMato
                    account and associated account data.
                  </p>
                </div>

                {/* Warning */}
                <div className="mb-6 rounded-2xl border border-rose-500/25 bg-rose-500/10 p-4">
                  <div className="flex gap-3">

                    <div className="flex-shrink-0">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        className="w-6 h-6 text-rose-400"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M12 9v4"
                        />

                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M12 17h.01"
                        />

                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M10.3 3.7 2.6 17a2 2 0 0 0 1.73 3h15.34a2 2 0 0 0 1.73-3L13.7 3.7a2 2 0 0 0-3.4 0Z"
                        />
                      </svg>
                    </div>

                    <div>
                      <h3 className="font-semibold text-rose-300">
                        This action is permanent
                      </h3>

                      <p className="mt-1 text-sm leading-5 text-white/60">
                        Deleting your account will permanently remove
                        your KnowMato account and associated data. You
                        will not be able to recover the account after
                        deletion.
                      </p>
                    </div>

                  </div>
                </div>

                {/* Error */}
                {error && (
                  <div
                    role="alert"
                    className="mb-6 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200"
                  >
                    {error}
                  </div>
                )}

                {/* Form */}
                <form
                  onSubmit={handleSubmit}
                  className="space-y-5"
                >

                  {/* Email */}
                  <div>
                    <label
                      htmlFor="identifier"
                      className="block text-sm font-medium text-white/80 mb-2"
                    >
                      Email
                    </label>

                    <input
                      id="identifier"
                      type="email"
                      autoComplete="email"
                      value={identifier}
                      onChange={(e) =>
                        setIdentifier(e.target.value)
                      }
                      disabled={loading}
                      placeholder="Enter your KnowMato email"
                      className="w-full border-2 border-white/15 rounded-xl px-4 py-3 bg-gray-900/60 text-white placeholder-white/35 outline-none transition focus:ring-4 focus:ring-violet-500/30 focus:border-violet-400 disabled:opacity-60"
                    />
                  </div>

                  {/* Password */}
                  <div>
                    <label
                      htmlFor="password"
                      className="block text-sm font-medium text-white/80 mb-2"
                    >
                      Password
                    </label>

                    <input
                      id="password"
                      type="password"
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) =>
                        setPassword(e.target.value)
                      }
                      disabled={loading}
                      placeholder="Enter your KnowMato password"
                      className="w-full border-2 border-white/15 rounded-xl px-4 py-3 bg-gray-900/60 text-white placeholder-white/35 outline-none transition focus:ring-4 focus:ring-violet-500/30 focus:border-violet-400 disabled:opacity-60"
                    />
                  </div>

                  {/* Confirmation */}
                  <label className="flex items-start gap-3 cursor-pointer rounded-xl border border-white/10 bg-white/[0.03] p-4">
                    <input
                      type="checkbox"
                      checked={confirmed}
                      onChange={(e) =>
                        setConfirmed(e.target.checked)
                      }
                      disabled={loading}
                      className="mt-1 w-4 h-4 accent-violet-500"
                    />

                    <span className="text-sm leading-5 text-white/70">
                      I understand that deleting my KnowMato account
                      is permanent and cannot be undone.
                    </span>
                  </label>

                  {/* Delete button */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3.5 px-5 rounded-xl bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 text-white font-bold shadow-lg shadow-rose-500/20 transition disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <svg
                          className="animate-spin w-5 h-5"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          />

                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                          />
                        </svg>

                        Deleting Account...
                      </>
                    ) : (
                      <>
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          className="w-5 h-5"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M3 6h18"
                          />

                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M8 6V4.8A1.8 1.8 0 0 1 9.8 3h4.4A1.8 1.8 0 0 1 16 4.8V6"
                          />

                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M19 6l-.8 13.2a1.8 1.8 0 0 1-1.8 1.7H7.6a1.8 1.8 0 0 1-1.8-1.7L5 6"
                          />

                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M10 10v7"
                          />

                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M14 10v7"
                          />
                        </svg>

                        Permanently Delete Account
                      </>
                    )}
                  </button>
                </form>

                {/* Information */}
                <div className="mt-6 pt-6 border-t border-white/10">
                  <p className="text-xs leading-5 text-white/45 text-center">
                    If you do not want to delete your account,
                    simply close this page without submitting
                    the form.
                  </p>
                </div>
              </>
            ) : (

              /* SUCCESS STATE */

              <div className="text-center py-6">

                <div className="mx-auto mb-5 w-16 h-16 rounded-full bg-emerald-500/15 border border-emerald-400/30 flex items-center justify-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className="w-8 h-8 text-emerald-400"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="m5 12 4 4L19 6"
                    />
                  </svg>
                </div>

                <h2 className="text-2xl font-bold text-emerald-300">
                  Account Deleted
                </h2>

                <p className="mt-3 text-sm leading-6 text-white/65">
                  Your KnowMato account and associated account data
                  have been permanently deleted successfully.
                </p>

                <p className="mt-4 text-xs leading-5 text-white/45">
                  You can close this page now.
                </p>
              </div>
            )}

          </div>

          {/* Footer */}
          <p className="text-center text-xs text-white/35 mt-6">
            © {new Date().getFullYear()} KnowMato.
            All rights reserved.
          </p>

        </div>
      </div>
    </main>
  );
}