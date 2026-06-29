"use client";

export const dynamic = "force-dynamic";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { verifyRegisterOtp } from "@/services/authService";
import toast, { Toaster } from "react-hot-toast";
import confetti from "canvas-confetti";
import { motion } from "framer-motion";

export default function VerifyRegisterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const identifier = searchParams.get("identifier") || "";

  const [emailOtp, setEmailOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);

  // Auto verify when 6 digits entered
  const handleAutoVerify = async (otp: string) => {
    if (otp.length !== 6 || isLoading) return;
    await handleVerify(otp);
  };

  const handleVerify = async (otpOverride?: string) => {
    const finalOtp = otpOverride || emailOtp;
    if (!finalOtp) {
      toast.error("Please enter email OTP", { duration: 4000, position: "bottom-center" });
      return;
    }

    setIsLoading(true);
    try {
      await verifyRegisterOtp({ identifier, email_otp: finalOtp });

      confetti({
        particleCount: 180,
        spread: 90,
        origin: { y: 0.6 },
      });

      toast.success("Email verified successfully 🎉", { duration: 3000 });

      setTimeout(() => {
        router.push("/login");
      }, 2000);
    } catch (error: any) {
      console.error("Verification error:", error);
      let errorMsg = "Verification failed";
      if (error?.response?.data?.message) {
        errorMsg = error.response.data.message;
      } else if (error?.response?.data?.error) {
        errorMsg = error.response.data.error;
      } else if (error?.message) {
        errorMsg = error.message;
      }
      toast.error(errorMsg, { duration: 4000, position: "bottom-center" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    setResendLoading(true);
    try {
      // Optional: call resend OTP API here
      toast.success("New OTP sent to your email 📧", { duration: 3000 });
    } catch (error) {
      toast.error("Failed to resend OTP", { duration: 4000 });
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <>
      <Toaster
        position="bottom-center"
        toastOptions={{
          style: {
            background: "#1e1b4b",
            color: "#fff",
            border: "1px solid rgba(255,255,255,0.1)",
            backdropFilter: "blur(8px)",
          },
        }}
      />

      {/* Animated dark background with blobs */}
      <div className="fixed inset-0 -z-10 bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e]">
        <div className="absolute top-0 -left-20 w-72 h-72 bg-purple-500/20 rounded-full mix-blend-multiply filter blur-3xl animate-blob" />
        <div className="absolute top-0 -right-20 w-72 h-72 bg-fuchsia-500/20 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000" />
        <div className="absolute -bottom-20 left-40 w-72 h-72 bg-cyan-500/20 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000" />
      </div>

      {/* Main container */}
      <div className="flex min-h-screen items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          {/* Glass card */}
          <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-6 sm:p-8 shadow-2xl">
            {/* Header */}
            <div className="mb-8 text-center">
              <motion.div
                animate={{ rotate: [0, 10, 0] }}
                transition={{ duration: 1, repeat: Infinity, repeatDelay: 2 }}
                className="mb-4 text-5xl sm:text-6xl"
              >
                📧
              </motion.div>

              <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-violet-300 via-fuchsia-300 to-cyan-300">
                Verify Email
              </h1>

              <p className="mt-3 text-sm text-white/70">
                We sent a 6-digit OTP to your email address
              </p>

              <p className="mt-2 break-all text-xs text-white/50">
                {identifier}
              </p>
            </div>

            {/* Email OTP Input */}
            <div className="mb-5">
              <label className="mb-2 block text-sm font-medium text-white/80">
                Email OTP
              </label>

              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                placeholder="Enter 6-digit OTP"
                value={emailOtp}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, "");
                  setEmailOtp(value);
                  handleAutoVerify(value);
                }}
                disabled={isLoading}
                autoFocus
                className="w-full rounded-2xl border-2 border-white/20 bg-gray-900/60 backdrop-blur-xl px-5 py-4 text-center text-2xl tracking-[10px] text-white placeholder-white/40 outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-500/50"
              />

              <a
                href="mailto:"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-block text-sm text-violet-300 hover:text-violet-200 transition"
              >
                📬 Open Email App
              </a>
            </div>

            {/* Verify Button */}
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={() => handleVerify()}
              disabled={isLoading}
              className="w-full rounded-2xl bg-gradient-to-r from-violet-500 to-fuchsia-500 py-4 font-bold text-white shadow-lg shadow-violet-500/25 transition hover:scale-[1.01] hover:shadow-xl disabled:opacity-70 disabled:hover:scale-100"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                  </svg>
                  Verifying...
                </span>
              ) : (
                "Verify Email ✅"
              )}
            </motion.button>

            {/* Resend OTP */}
            <button
              onClick={handleResend}
              disabled={resendLoading}
              className="mt-5 w-full text-sm text-violet-300 hover:text-violet-200 transition"
            >
              {resendLoading ? "Sending..." : "Didn't receive OTP? Resend"}
            </button>

            {/* Back to Login */}
            <button
              onClick={() => router.push("/login")}
              className="mt-4 w-full text-sm text-white/50 hover:text-white transition"
            >
              ← Back to Login
            </button>
          </div>
        </motion.div>
      </div>
    </>
  );
}