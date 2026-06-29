"use client";

export const dynamic = "force-dynamic";

import React, { useEffect, useState, useRef, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const REDIRECT_DELAY_MS = 2000;
const FAILURE_REDIRECT_DELAY_MS = 1500;
const APP_DEEPLINK = "knowMato://payment-success";
const FROM_APP_STORAGE_KEY = "from_app";

// ---------------------------------------------------------------------------
// Custom Hook: Manages redirect timers and app deeplink
// ---------------------------------------------------------------------------
const usePaymentRedirect = () => {
  const router = useRouter();
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const scheduleRedirect = useCallback(
    (destination: string, delayMs: number, isExternal = false) => {
      const timer = setTimeout(() => {
        if (isExternal) {
          window.location.href = destination;
        } else {
          router.replace(destination);
        }
      }, delayMs);
      timersRef.current.push(timer);
      return timer;
    },
    [router]
  );

  const clearAllTimers = useCallback(() => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
  }, []);

  useEffect(() => {
    return clearAllTimers;
  }, [clearAllTimers]);

  return { scheduleRedirect, clearAllTimers };
};

// ---------------------------------------------------------------------------
// Confetti effect (lightweight, canvas-based)
// ---------------------------------------------------------------------------
const runConfetti = () => {
  if (typeof window === "undefined") return;
  const duration = 1000;
  const end = Date.now() + duration;
  const colors = ["#a78bfa", "#f472b6", "#38bdf8", "#34d399"]; // violet, pink, cyan, emerald

  const frame = () => {
    if (Date.now() > end) return;
    confetti({
      particleCount: 2,
      angle: 60,
      spread: 55,
      origin: { x: 0, y: 0.6 },
      colors: colors,
    });
    confetti({
      particleCount: 2,
      angle: 120,
      spread: 55,
      origin: { x: 1, y: 0.6 },
      colors: colors,
    });
    requestAnimationFrame(frame);
  };
  frame();
};

function confetti(options: {
  particleCount: number;
  angle: number;
  spread: number;
  origin: { x: number; y: number };
  colors: string[];
}) {
  const canvas = document.createElement("canvas");
  canvas.style.position = "fixed";
  canvas.style.top = "0";
  canvas.style.left = "0";
  canvas.style.width = "100%";
  canvas.style.height = "100%";
  canvas.style.pointerEvents = "none";
  canvas.style.zIndex = "9999";
  document.body.appendChild(canvas);
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  const particles: Array<{
    x: number;
    y: number;
    vx: number;
    vy: number;
    color: string;
    size: number;
    alpha: number;
  }> = [];

  for (let i = 0; i < options.particleCount; i++) {
    const rad = (options.angle * Math.PI) / 180;
    const speed = 5 + Math.random() * 8;
    const vx = Math.cos(rad) * speed * (Math.random() * 0.8 + 0.6);
    const vy = Math.sin(rad) * speed * (Math.random() * 0.8 + 0.6);
    particles.push({
      x: options.origin.x * canvas.width,
      y: options.origin.y * canvas.height,
      vx: vx * (Math.random() - 0.5),
      vy: vy * (Math.random() - 0.5),
      color: options.colors[Math.floor(Math.random() * options.colors.length)],
      size: 4 + Math.random() * 6,
      alpha: 1,
    });
  }

  let animationId: number;
  const animate = () => {
    if (!ctx || !canvas.parentNode) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    let allDead = true;
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.2;
      p.alpha -= 0.02;
      if (p.alpha <= 0 || p.y > canvas.height + 50) continue;
      allDead = false;
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x, p.y, p.size, p.size);
    }
    if (allDead) {
      cancelAnimationFrame(animationId);
      canvas.remove();
    } else {
      animationId = requestAnimationFrame(animate);
    }
  };
  animate();
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------
const PaymentSuccessPage: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { scheduleRedirect, clearAllTimers } = usePaymentRedirect();

  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [message, setMessage] = useState("");

  const handlePaymentSuccess = useCallback(async () => {
    try {
      const orderId = searchParams.get("order_id");
      if (!orderId) {
        setSuccess(false);
        setMessage("Invalid payment session. Redirecting...");
        scheduleRedirect("/payment-failed", FAILURE_REDIRECT_DELAY_MS);
        return;
      }

      // Simulate backend verification (optional)
      // If you have a verification API, call it here.
      // For now, assume success.
      setSuccess(true);
      setMessage("Your wallet has been topped up!");

      // Trigger confetti on success
      runConfetti();

      const fromApp = localStorage.getItem(FROM_APP_STORAGE_KEY) === "true";
      if (fromApp) {
        localStorage.removeItem(FROM_APP_STORAGE_KEY);
        scheduleRedirect(APP_DEEPLINK, REDIRECT_DELAY_MS, true);
      } else {
        scheduleRedirect("/student/wallet", REDIRECT_DELAY_MS);
      }
    } catch (err) {
      console.error("Payment success page error:", err);
      setSuccess(false);
      setMessage("Something went wrong. Please contact support.");
      scheduleRedirect("/payment-failed", FAILURE_REDIRECT_DELAY_MS);
    } finally {
      setLoading(false);
    }
  }, [searchParams, scheduleRedirect]);

  useEffect(() => {
    handlePaymentSuccess();
    return () => clearAllTimers();
  }, [handlePaymentSuccess, clearAllTimers]);

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e] relative overflow-hidden flex items-center justify-center p-4">
      {/* Animated background blobs */}
      <div className="absolute top-0 -left-20 w-72 h-72 bg-purple-500/20 rounded-full mix-blend-multiply filter blur-3xl animate-blob" />
      <div className="absolute top-0 -right-20 w-72 h-72 bg-fuchsia-500/20 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000" />
      <div className="absolute -bottom-20 left-40 w-72 h-72 bg-cyan-500/20 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000" />

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="relative z-10 w-full max-w-lg bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl text-center"
      >
        {loading ? (
          <div className="flex flex-col items-center gap-4">
            <div className="w-14 h-14 border-4 border-violet-400 border-t-transparent rounded-full animate-spin" />
            <h2 className="text-2xl font-bold text-white">Verifying payment...</h2>
            <p className="text-white/50 text-sm">Please do not close this window</p>
          </div>
        ) : success ? (
          <>
            <div className="flex justify-center mb-4">
              <div className="w-20 h-20 rounded-full bg-emerald-400/20 border-2 border-emerald-400/40 flex items-center justify-center">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  className="w-10 h-10 text-emerald-300"
                >
                  <path
                    d="M20 6L9 17L4 12"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 to-cyan-300">
              Payment Successful
            </h1>
            <p className="mt-3 text-lg text-white/80">{message}</p>
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => router.push("/student/wallet")}
                className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-bold shadow-lg shadow-emerald-500/25 hover:from-emerald-600 hover:to-cyan-600 transition flex items-center justify-center gap-2"
              >
                Go to Wallet
                <span>→</span>
              </motion.button>
              <p className="text-white/40 text-sm">or wait for auto‑redirect</p>
            </div>
          </>
        ) : (
          <>
            <div className="flex justify-center mb-4">
              <div className="w-20 h-20 rounded-full bg-rose-400/20 border-2 border-rose-400/40 flex items-center justify-center">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  className="w-10 h-10 text-rose-300"
                >
                  <path
                    d="M18 6L6 18M6 6L18 18"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-rose-300 to-pink-300">
              Payment Failed
            </h1>
            <p className="mt-3 text-lg text-white/80">{message}</p>
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => router.push("/wallet/add-money")}
                className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-rose-500/20 border border-rose-400/40 text-rose-300 font-bold hover:bg-rose-500/30 transition"
              >
                Try Again
              </motion.button>
              <p className="text-white/40 text-sm">Redirecting soon</p>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
};

export default PaymentSuccessPage;