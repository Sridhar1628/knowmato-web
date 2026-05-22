"use client";

export const dynamic = "force-dynamic";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import styles from "./PaymentSuccess.module.css";

const PaymentSuccessPage = () => {
  const router = useRouter();

  const [loading, setLoading] = useState(true);

  const [success, setSuccess] = useState(false);

  const [message, setMessage] = useState("");

  useEffect(() => {
    handleSuccess();
  }, []);

  const handleSuccess = async () => {
    try {
      // Ensure browser environment
      if (typeof window === "undefined") {
        return;
      }

      console.log(window.location.href);

      // Get query params safely
      const params = new URLSearchParams(
        window.location.search
      );

      console.log(params.toString());

      const order_id = params.get("order_id");

      console.log("ORDER ID:", order_id);

      // If order ID missing
      if (!order_id) {
        setSuccess(false);

        setMessage(
          "Invalid payment session."
        );

        setTimeout(() => {
          router.replace("/payment-failed");
        }, 1500);

        return;
      }

      // ------------------------------------------------
      // WEBHOOK MODE
      // Backend will automatically update wallet
      // ------------------------------------------------

      setSuccess(true);

      setMessage(
        "Your payment was received successfully. Your wallet will update automatically within a few seconds."
      );

    } catch (err) {
      console.log(
        "SUCCESS PAGE ERROR:",
        err
      );

      setSuccess(false);

      setMessage(
        "Something went wrong while processing payment."
      );

      setTimeout(() => {
        router.replace("/payment-failed");
      }, 1500);

    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>

        {loading ? (
          <>
            <div className={styles.spinner}></div>

            <h2>
              Processing Payment...
            </h2>
          </>
        ) : success ? (
          <>
            <div
              className={styles.successIcon}
            >
              ✅
            </div>

            <h1 className={styles.title}>
              Payment Successful
            </h1>

            <p className={styles.message}>
              {message}
            </p>

            <button
              type="button"
              className={styles.btn}
              onClick={() =>
                router.push(
                  "/student/wallet"
                )
              }
            >
              Back to Wallet
            </button>
          </>
        ) : (
          <>
            <div
              className={styles.failedIcon}
            >
              ❌
            </div>

            <h1 className={styles.title}>
              Payment Failed
            </h1>

            <p className={styles.message}>
              {message}
            </p>

            <button
              type="button"
              className={styles.btn}
              onClick={() =>
                router.push(
                  "/wallet/add-money"
                )
              }
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