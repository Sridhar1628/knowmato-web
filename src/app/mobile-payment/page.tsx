"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

import { mobilePaymentLogin } from "@/services/v2Service";
import { saveTokens } from "@/services/storageService";
import { createCreditOrder } from "@/services/v1Service";
import { load } from "@cashfreepayments/cashfree-js";
import AlertService from "@/services/alertService";

export default function MobilePaymentPage() {
  const searchParams =
    useSearchParams();

  const [message, setMessage] =
    useState(
      "Preparing your payment..."
    );

  useEffect(() => {
    const startPayment =
      async () => {
        try {
          // ----------------------------------------
          // 1. Get token from URL
          // ----------------------------------------

          const token =
            searchParams.get(
              "token"
            );

          const source =
            searchParams.get(
              "source"
            );

          if (!token) {
            const errorMessage =
              "Invalid payment session.";

            setMessage(
              errorMessage
            );

            AlertService.error(
              "Invalid Payment Session",
              errorMessage
            );

            return;
          }

          // ----------------------------------------
          // 2. Login using mobile payment token
          // ----------------------------------------

          setMessage(
            "Signing you in..."
          );

          const loginResponse =
            await mobilePaymentLogin(
              token
            );

          // AxiosResponse -> API response body
          const login =
            loginResponse.data;

          console.log(
            "MOBILE PAYMENT LOGIN:",
            login
          );

          if (!login.success) {
            const errorMessage =
              login.message ||
              "Unable to sign you in.";

            setMessage(
              errorMessage
            );

            AlertService.error(
              "Payment Login Failed",
              errorMessage
            );

            return;
          }

          // ----------------------------------------
          // 3. Get login data
          // ----------------------------------------

          const data =
            login.data;

          if (
            !data?.access ||
            !data?.refresh
          ) {
            const errorMessage =
              "Invalid login response.";

            setMessage(
              errorMessage
            );

            AlertService.error(
              "Authentication Failed",
              errorMessage
            );

            return;
          }

          if (!data?.plan_id) {
            const errorMessage =
              "No payment plan found.";

            setMessage(
              errorMessage
            );

            AlertService.error(
              "Payment Plan Not Found",
              errorMessage
            );

            return;
          }

          // ----------------------------------------
          // 4. Save authentication tokens
          // ----------------------------------------

          await saveTokens(
            data.access,
            data.refresh
          );

          // ----------------------------------------
          // 5. Create Cashfree order
          // ----------------------------------------

          setMessage(
            "Creating payment..."
          );

          const orderResponse =
            await createCreditOrder(
              data.plan_id,
              source === "mobile"
            );

          console.log(
            "CREATE CREDIT ORDER RESPONSE:",
            orderResponse
          );

          /*
           * If createCreditOrder() returns
           * the API response directly:
           *
           * {
           *   success: true,
           *   status: 200,
           *   message: "...",
           *   data: {...}
           * }
           */

          const order =
            orderResponse;

          if (!order.success) {
            const errorMessage =
              order.message ||
              "Unable to create payment.";

            setMessage(
              errorMessage
            );

            AlertService.error(
              "Payment Creation Failed",
              errorMessage
            );

            return;
          }

          const paymentData =
            order.data;

          if (
            !paymentData?.payment_session_id
          ) {
            const errorMessage =
              "Payment session was not created.";

            setMessage(
              errorMessage
            );

            AlertService.error(
              "Payment Session Failed",
              errorMessage
            );

            return;
          }

          // ----------------------------------------
          // 6. Load Cashfree SDK
          // ----------------------------------------

          const cashfree =
            await load({
              mode:
                process.env
                  .NEXT_PUBLIC_CASHFREE_ENV ===
                "PRODUCTION"
                  ? "production"
                  : "sandbox",
            });

          if (!cashfree) {
            const errorMessage =
              "Unable to load payment gateway.";

            setMessage(
              errorMessage
            );

            AlertService.error(
              "Payment Gateway Unavailable",
              errorMessage
            );

            return;
          }

          // ----------------------------------------
          // 7. Open Cashfree checkout
          // ----------------------------------------

          setMessage(
            "Redirecting to payment..."
          );

          await cashfree.checkout({
            paymentSessionId:
              paymentData.payment_session_id,

            redirectTarget:
              "_self",
          });
        } catch (error: unknown) {
          console.error(
            "MOBILE PAYMENT ERROR:",
            error
          );

          // ----------------------------------------
          // Extract meaningful error message
          // ----------------------------------------

          let errorMessage =
            "Unable to start payment. Please try again.";

          if (
            typeof error ===
              "object" &&
            error !== null
          ) {
            const possibleError =
              error as {
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

          setMessage(
            errorMessage
          );

          AlertService.error(
            "Payment Failed",
            errorMessage
          );
        }
      };

    startPayment();
  }, [searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0B1020]">
      <div className="text-center">

        <div
          className="
            animate-spin
            h-10
            w-10
            border-4
            border-violet-500
            border-t-transparent
            rounded-full
            mx-auto
            mb-6
          "
        />

        <h1 className="text-2xl text-white font-bold">
          {message}
        </h1>

      </div>
    </div>
  );
}