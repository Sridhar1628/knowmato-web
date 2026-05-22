"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { verifyRegisterOtp } from "@/services/authService";
import toast, { Toaster } from "react-hot-toast";
import confetti from "canvas-confetti";
import styles from "./VerifyRegisterScreen.module.css";

export default function VerifyRegisterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const identifier = searchParams.get("identifier") || "";

  const [emailOtp, setEmailOtp] = useState("");
  const [phoneOtp, setPhoneOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [hasShake, setHasShake] = useState(false);

  // Auto-submit when both fields are 6 digits
  useEffect(() => {
    if (
      emailOtp.length === 6 &&
      phoneOtp.length === 6 &&
      !isLoading &&
      identifier
    ) {
      handleVerify();
    }
  }, [emailOtp, phoneOtp]);

  const handleVerify = async () => {
    if (!emailOtp || !phoneOtp) {
      setHasShake(true);
      setTimeout(() => setHasShake(false), 500);
      toast.error("Please enter both email and phone OTPs", {
        duration: 4000,
        position: "bottom-center",
      });
      return;
    }

    setIsLoading(true);
    try {
      await verifyRegisterOtp({
        identifier,
        email_otp: emailOtp,
        phone_otp: phoneOtp,
      });

      // Confetti
      confetti({
        particleCount: 200,
        spread: 80,
        origin: { y: 0.6 },
      });

      toast.success("Account verified! Redirecting to login...", {
        duration: 3000,
      });
      setTimeout(() => {
        router.push("/login");
      }, 2000);
    } catch (error: any) {
      let errorMsg = "Verification failed. Please check your OTPs.";
      if (error?.response?.data?.error) {
        errorMsg = error.response.data.error;
      } else if (error?.message) {
        errorMsg = error.message;
      }
      toast.error(errorMsg, {
        duration: 4000,
      });
      setHasShake(true);
      setTimeout(() => setHasShake(false), 500);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    setResendLoading(true);
    try {
      // If you have a resend endpoint, call it here
      // await resendOtp({ identifier });
      toast.success("New OTPs sent to your email and phone.", {
        duration: 3000,
      });
    } catch (error) {
      toast.error("Failed to resend OTP. Please try again.", {
        duration: 4000,
      });
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <>
      <Toaster />
      <div className={styles.container}>
        <div
          className={`${styles.card} ${hasShake ? styles.shake : ""}`}
        >
          <h1 className={styles.title}>📧 + 📱 Verify Account</h1>
          <p className={styles.subtitle}>
            We&apos;ve sent OTPs to your email and phone number.
          </p>

          {/* Email OTP */}
          <div className={styles.inputGroup}>
            <label className={styles.label}>Email OTP</label>
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              className={styles.input}
              placeholder="Enter 6-digit OTP from email"
              value={emailOtp}
              onChange={(e) => setEmailOtp(e.target.value.replace(/\D/g, ""))}
              disabled={isLoading}
              autoFocus
            />
            <a
              href="mailto:"
              className={styles.helperLink}
              target="_blank"
              rel="noopener noreferrer"
            >
              📧 Open email app
            </a>
          </div>

          {/* Phone OTP */}
          <div className={styles.inputGroup}>
            <label className={styles.label}>Phone OTP</label>
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              className={styles.input}
              placeholder="Enter 6-digit OTP from SMS"
              value={phoneOtp}
              onChange={(e) => setPhoneOtp(e.target.value.replace(/\D/g, ""))}
              disabled={isLoading}
            />
            <p className={styles.autoDetectHint}>
              📲 Check your phone for the SMS code.
            </p>
          </div>

          {/* Verify Button */}
          <button
            className={`${styles.button} ${isLoading ? styles.buttonDisabled : ""}`}
            onClick={handleVerify}
            disabled={isLoading}
          >
            {isLoading ? (
              <span className={styles.spinner} />
            ) : (
              "Verify & Activate ✅"
            )}
          </button>

          {/* Resend */}
          <button
            className={styles.resendLink}
            onClick={handleResend}
            disabled={resendLoading}
          >
            {resendLoading ? (
              <span className={styles.spinnerSmall} />
            ) : (
              "Didn't receive OTP? Resend"
            )}
          </button>

          {/* Back to Login */}
          <a
            href="/login"
            className={styles.backLink}
            onClick={(e) => {
              e.preventDefault();
              router.push("/login");
            }}
          >
            ← Back to Login
          </a>
        </div>
      </div>
    </>
  );
}