"use client";

export const dynamic = "force-dynamic";

import React, { useEffect, useState, useRef, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import styles from "./PaymentSuccess.module.css";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const REDIRECT_DELAY_MS = 2000;
const FAILURE_REDIRECT_DELAY_MS = 1500;
const APP_DEEPLINK = "knowmato://payment-success";
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
  const duration = 1000; // ms
  const end = Date.now() + duration;
  const colors = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444"];

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

// Basic confetti function (minimal)
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
    <div className={styles.container}>
      <div className={styles.card}>
        {loading ? (
          <div className={styles.loadingState}>
            <div className={styles.spinner} />
            <h2>Verifying payment...</h2>
            <p className={styles.subtle}>Please do not close this window</p>
          </div>
        ) : success ? (
          <>
            <div className={styles.iconWrapper}>
              <div className={`${styles.icon} ${styles.successIcon}`}>
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
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
            <h1 className={styles.title}>Payment Successful</h1>
            <p className={styles.message}>{message}</p>
            <button
              type="button"
              className={styles.btn}
              onClick={() => router.push("/student/wallet")}
            >
              Go to Wallet
              <span className={styles.btnArrow}>→</span>
            </button>
          </>
        ) : (
          <>
            <div className={styles.iconWrapper}>
              <div className={`${styles.icon} ${styles.failedIcon}`}>
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
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
            <h1 className={styles.title}>Payment Failed</h1>
            <p className={styles.message}>{message}</p>
            <button
              type="button"
              className={`${styles.btn} ${styles.btnOutline}`}
              onClick={() => router.push("/wallet/add-money")}
            >
              Try Again
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default PaymentSuccessPage;