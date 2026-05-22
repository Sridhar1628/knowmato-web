"use client";

import React, { useEffect, useState } from "react";

import { useRouter, useSearchParams } from "next/navigation";

import styles from "./PaymentSuccess.module.css";

const PaymentSuccessPage = () => {
  const router = useRouter();

  const searchParams = useSearchParams();

  const [loading, setLoading] = useState(true);

  const [success, setSuccess] = useState(false);

  const [message, setMessage] = useState("");

  useEffect(() => {
    handleSuccess();
  }, []);

  const handleSuccess = async () => {
    try {

      console.log(window.location.href);

      console.log(searchParams.toString());

      const order_id =
        searchParams.get("order_id");

      console.log("ORDER ID:", order_id);

      if (!order_id) {

        router.replace("/payment-failed");

        return;
      }

      // ------------------------------------------------
      // WEBHOOK MODE
      // Backend will credit wallet automatically
      // ------------------------------------------------

      setSuccess(true);

      setMessage(
        "Your payment was received successfully. Wallet will update automatically."
      );

    } catch (err) {

      console.log("SUCCESS PAGE ERROR:", err);

      router.replace("/payment-failed");

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

            <h2>Processing Payment...</h2>
          </>
        ) : success ? (
          <>
            <div className={styles.successIcon}>
              ✅
            </div>

            <h1 className={styles.title}>
              Payment Successful
            </h1>

            <p className={styles.message}>
              {message}
            </p>

            <button
              className={styles.btn}
              onClick={() =>
                router.push("/student/wallet")
              }
            >
              Back to Wallet
            </button>
          </>
        ) : (
          <>
            <div className={styles.failedIcon}>
              ❌
            </div>

            <h1 className={styles.title}>
              Payment Failed
            </h1>

            <p className={styles.message}>
              Something went wrong while processing payment.
            </p>

            <button
              className={styles.btn}
              onClick={() =>
                router.push("/wallet/add-money")
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