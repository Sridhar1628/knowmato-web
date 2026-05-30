"use client";

export const dynamic = "force-dynamic";

import {
  useState,
} from "react";

import {
  useRouter,
  useSearchParams,
} from "next/navigation";

import {
  verifyRegisterOtp,
} from "@/services/authService";

import toast, {
  Toaster,
} from "react-hot-toast";

import confetti from "canvas-confetti";

import {
  motion,
} from "framer-motion";

// ============================================
// COMPONENT
// ============================================

export default function VerifyRegisterPage() {

  const router = useRouter();

  const searchParams =
    useSearchParams();

  const identifier =
    searchParams.get(
      "identifier"
    ) || "";

  const [emailOtp, setEmailOtp] =
    useState("");

  // ============================================
  // TEMPORARILY DISABLED
  // PHONE OTP
  // ============================================

  /*
  const [phoneOtp, setPhoneOtp] =
    useState("");
  */

  const [isLoading, setIsLoading] =
    useState(false);

  const [resendLoading, setResendLoading] =
    useState(false);

  // ============================================
  // AUTO VERIFY
  // ============================================

  const handleAutoVerify =
    async (otp: string) => {

      if (
        otp.length !== 6 ||
        isLoading
      ) {

        return;
      }

      await handleVerify(otp);
    };

  // ============================================
  // VERIFY
  // ============================================

  const handleVerify =
    async (
      otpOverride?: string
    ) => {

      const finalOtp =
        otpOverride || emailOtp;

      if (!finalOtp) {

        toast.error(
          "Please enter email OTP",
          {
            duration: 4000,
            position:
              "bottom-center",
          }
        );

        return;
      }

      setIsLoading(true);

      try {

        // ========================================
        // VERIFY EMAIL OTP ONLY
        // ========================================

        await verifyRegisterOtp({

          identifier,

          email_otp: finalOtp,

          // ====================================
          // TEMPORARILY DISABLED
          // PHONE OTP
          // ====================================

          /*
          phone_otp?: phoneOtp,
          */
        });

        // ========================================
        // CONFETTI
        // ========================================

        confetti({

          particleCount: 180,

          spread: 90,

          origin: {
            y: 0.6,
          },
        });

        toast.success(
          "Email verified successfully 🎉",
          {
            duration: 3000,
          }
        );

        // ========================================
        // REDIRECT
        // ========================================

        setTimeout(() => {

          router.push(
            "/login"
          );

        }, 2000);

      } catch (error: any) {

        console.error(
          "Verification error:",
          error
        );

        let errorMsg =
          "Verification failed";

        if (
          error?.response
            ?.data?.message
        ) {

          errorMsg =
            error.response
              .data.message;

        } else if (
          error?.response
            ?.data?.error
        ) {

          errorMsg =
            error.response
              .data.error;

        } else if (
          error?.message
        ) {

          errorMsg =
            error.message;
        }

        toast.error(
          errorMsg,
          {
            duration: 4000,
            position:
              "bottom-center",
          }
        );

      } finally {

        setIsLoading(false);
      }
    };

  // ============================================
  // RESEND
  // ============================================

  const handleResend =
    async () => {

      setResendLoading(true);

      try {

        // ========================================
        // OPTIONAL:
        // CALL RESEND API HERE
        // ========================================

        /*
        await resendOtp({
          identifier
        });
        */

        toast.success(
          "New OTP sent to your email 📧",
          {
            duration: 3000,
          }
        );

      } catch (error) {

        toast.error(
          "Failed to resend OTP",
          {
            duration: 4000,
          }
        );

      } finally {

        setResendLoading(false);
      }
    };

  // ============================================
  // UI
  // ============================================

  return (

    <>

      <Toaster />

      {/* BACKGROUND */}

      <div
        className="
          fixed
          inset-0
          -z-10
          bg-[radial-gradient(circle_at_top_left,_#6366F1,_transparent_35%),radial-gradient(circle_at_bottom_right,_#8B5CF6,_transparent_35%),linear-gradient(to_bottom_right,_#0F172A,_#111827,_#1E293B)]
        "
      />

      {/* MAIN */}

      <div
        className="
          flex
          min-h-screen
          items-center
          justify-center
          px-4
        "
      >

        <motion.div

          initial={{
            opacity: 0,
            y: 40,
          }}

          animate={{
            opacity: 1,
            y: 0,
          }}

          transition={{
            duration: 0.5,
          }}

          className="
            w-full
            max-w-md
          "
        >

          {/* CARD */}

          <div
            className="
              rounded-[32px]
              border
              border-white/10
              bg-white/10
              p-8
              shadow-2xl
              backdrop-blur-2xl
            "
          >

            {/* HEADER */}

            <div
              className="
                mb-8
                text-center
              "
            >

              <motion.div

                animate={{
                  rotate: [0, 10, 0],
                }}

                transition={{
                  duration: 1,
                  repeat: Infinity,
                  repeatDelay: 2,
                }}

                className="
                  mb-4
                  text-6xl
                "
              >

                📧

              </motion.div>

              <h1
                className="
                  text-4xl
                  font-black
                  tracking-tight
                  text-white
                "
              >

                Verify Email

              </h1>

              <p
                className="
                  mt-3
                  text-sm
                  text-indigo-100
                "
              >

                We sent a 6-digit OTP
                to your email address

              </p>

              <p
                className="
                  mt-2
                  break-all
                  text-xs
                  text-gray-300
                "
              >

                {identifier}

              </p>

            </div>

            {/* EMAIL OTP */}

            <div
              className="
                mb-5
              "
            >

              <label
                className="
                  mb-2
                  block
                  text-sm
                  font-medium
                  text-white
                "
              >

                Email OTP

              </label>

              <input

                type="text"

                inputMode="numeric"

                maxLength={6}

                placeholder="Enter 6-digit OTP"

                value={emailOtp}

                onChange={(e) => {

                  const value =
                    e.target.value.replace(
                      /\D/g,
                      ""
                    );

                  setEmailOtp(value);

                  handleAutoVerify(
                    value
                  );
                }}

                disabled={isLoading}

                autoFocus

                className="
                  w-full
                  rounded-2xl
                  border
                  border-white/10
                  bg-white/10
                  px-5
                  py-4
                  text-center
                  text-2xl
                  tracking-[10px]
                  text-white
                  outline-none
                  backdrop-blur-xl
                  transition
                  focus:border-indigo-400
                  focus:ring-2
                  focus:ring-indigo-500/30
                "
              />

              <a
                href="mailto:"
                target="_blank"
                rel="noopener noreferrer"
                className="
                  mt-3
                  inline-block
                  text-sm
                  text-indigo-300
                  hover:text-indigo-200
                "
              >

                📬 Open Email App

              </a>

            </div>

            {/* ==================================== */}
            {/* TEMPORARILY DISABLED */}
            {/* PHONE OTP */}
            {/* ==================================== */}

            {/*
            <div>
              Phone OTP UI here
            </div>
            */}

            {/* VERIFY BUTTON */}

            <motion.button

              whileTap={{
                scale: 0.98,
              }}

              onClick={() =>
                handleVerify()
              }

              disabled={isLoading}

              className="
                w-full
                rounded-2xl
                bg-gradient-to-r
                from-indigo-500
                via-purple-500
                to-pink-500
                py-4
                font-bold
                text-white
                shadow-lg
                transition
                hover:scale-[1.01]
                hover:shadow-purple-500/30
                disabled:opacity-70
              "
            >

              {isLoading

                ? "Verifying..."

                : "Verify Email ✅"}

            </motion.button>

            {/* RESEND */}

            <button

              onClick={handleResend}

              disabled={resendLoading}

              className="
                mt-5
                w-full
                text-sm
                text-indigo-300
                transition
                hover:text-indigo-200
              "
            >

              {resendLoading

                ? "Sending..."

                : "Didn't receive OTP? Resend"}

            </button>

            {/* BACK */}

            <button

              onClick={() =>
                router.push(
                  "/login"
                )
              }

              className="
                mt-4
                w-full
                text-sm
                text-gray-400
                transition
                hover:text-gray-300
              "
            >

              ← Back to Login

            </button>

          </div>

        </motion.div>

      </div>

    </>
  );
}
