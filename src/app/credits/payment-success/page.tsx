"use client";

import {
  useEffect,
  useState,
} from "react";

import {
  useRouter,
  useSearchParams,
} from "next/navigation";

import {
  verifyCreditPayment,
} from "@/services/v1Service";

import AlertService from "@/services/alertService";

export default function CreditPaymentSuccessPage() {
  const router = useRouter();

  const searchParams =
    useSearchParams();

  const orderId =
    searchParams.get(
      "order_id",
    );

  const [loading, setLoading] =
    useState(true);

  const [message, setMessage] =
    useState("");

  const [success, setSuccess] =
    useState(false);

  // ==========================================================
  // VERIFY PAYMENT
  // ==========================================================

  useEffect(() => {
    if (!orderId) {
      setLoading(false);
      setSuccess(false);

      const errorMessage =
        "Order ID not found. We could not verify your payment.";

      setMessage(
        errorMessage,
      );

      AlertService.error(
        "Payment Verification Failed",
        errorMessage,
      );

      return;
    }

    verify();
  }, [orderId]);

  // ==========================================================
  // VERIFY
  // ==========================================================

  const verify = async () => {
    if (!orderId) {
      return;
    }

    try {
      const res =
        await verifyCreditPayment(
          orderId,
        );

      console.log(
        "CREDIT PAYMENT VERIFICATION:",
        res,
      );

      const paymentSuccess =
        Boolean(res?.success);

      const responseMessage =
        res?.message ||
        (
          paymentSuccess
            ? "Your credits have been added successfully."
            : "Your payment could not be completed."
        );

      setSuccess(
        paymentSuccess,
      );

      setMessage(
        responseMessage,
      );

      // ======================================================
      // VERIFICATION FAILED
      // ======================================================

      if (!paymentSuccess) {
        AlertService.error(
          "Payment Failed",
          responseMessage,
        );
      }
    } catch (err: unknown) {
      console.error(
        "Credit payment verification error:",
        err,
      );

      // ======================================================
      // EXTRACT ERROR MESSAGE
      // ======================================================

      let errorMessage =
        "Unable to verify payment. Please try again.";

      if (
        typeof err ===
          "object" &&
        err !== null
      ) {
        const possibleError =
          err as {
            response?: {
              data?: {
                message?: string;
                detail?: string;
                error?: string;
              };
            };
            message?: string;
          };

        errorMessage =
          possibleError
            .response
            ?.data
            ?.message ||
          possibleError
            .response
            ?.data
            ?.detail ||
          possibleError
            .response
            ?.data
            ?.error ||
          possibleError.message ||
          errorMessage;
      }

      setSuccess(false);

      setMessage(
        errorMessage,
      );

      AlertService.error(
        "Payment Verification Failed",
        errorMessage,
      );
    } finally {
      setLoading(false);
    }
  };

  // ==========================================================
  // LOADING
  // ==========================================================

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="flex flex-col items-center gap-4">

          <div className="w-10 h-10 rounded-full border-4 border-violet-500 border-t-transparent animate-spin" />

          <p className="text-sm text-white/60">
            Verifying your payment...
          </p>

        </div>
      </div>
    );
  }

  // ==========================================================
  // RESULT
  // ==========================================================

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4">

      <div className="bg-white rounded-3xl p-8 sm:p-10 w-full max-w-md text-center shadow-2xl">

        {success ? (
          <>
            {/* ================================================
                SUCCESS
                ================================================ */}

            <div className="text-6xl mb-6">
              🎉
            </div>

            <h1 className="text-3xl font-bold text-gray-900">
              Credits Added
            </h1>

            <p className="text-gray-500 mt-4 leading-6">
              {message}
            </p>

            {orderId && (
              <div className="mt-5 rounded-xl bg-gray-50 border border-gray-100 px-4 py-3">
                <p className="text-xs text-gray-400">
                  Order ID
                </p>

                <p className="mt-1 text-sm font-medium text-gray-700 break-all">
                  {orderId}
                </p>
              </div>
            )}

            <button
              type="button"
              onClick={() =>
                router.push(
                  "/student/credits",
                )
              }
              className="mt-8 w-full rounded-xl bg-violet-600 hover:bg-violet-700 text-white py-3 font-semibold transition"
            >
              Continue
            </button>
          </>
        ) : (
          <>
            {/* ================================================
                FAILURE
                ================================================ */}

            <div className="text-6xl mb-6">
              ❌
            </div>

            <h1 className="text-3xl font-bold text-gray-900">
              Payment Failed
            </h1>

            <p className="text-gray-500 mt-4 leading-6">
              {message}
            </p>

            {orderId && (
              <div className="mt-5 rounded-xl bg-gray-50 border border-gray-100 px-4 py-3">
                <p className="text-xs text-gray-400">
                  Order ID
                </p>

                <p className="mt-1 text-sm font-medium text-gray-700 break-all">
                  {orderId}
                </p>
              </div>
            )}

            <button
              type="button"
              onClick={() =>
                router.push(
                  "/student/credits",
                )
              }
              className="mt-8 w-full rounded-xl bg-red-600 hover:bg-red-700 text-white py-3 font-semibold transition"
            >
              Back
            </button>
          </>
        )}

      </div>
    </div>
  );
}