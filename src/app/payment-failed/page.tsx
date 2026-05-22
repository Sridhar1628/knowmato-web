"use client";

import React from "react";

import { useRouter } from "next/navigation";

import styles from "./PaymentFailed.module.css";

const PaymentFailedPage = () => {
  const router = useRouter();

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        {/* FAILED ICON */}
        <div className={styles.failedIcon}>
          ❌
        </div>

        {/* TITLE */}
        <h1 className={styles.title}>
          Payment Failed
        </h1>

        {/* MESSAGE */}
        <p className={styles.message}>
          Your payment could not be completed.
          <br />
          If money was deducted, it will
          automatically be refunded by your bank.
        </p>

        {/* ACTIONS */}
        <div className={styles.btnGroup}>
          <button
            className={styles.retryBtn}
            onClick={() =>
              router.push("/add-money")
            }
          >
            Try Again
          </button>

          <button
            className={styles.walletBtn}
            onClick={() =>
              router.push("/student/wallet")
            }
          >
            Back to Wallet
          </button>
        </div>

        {/* HELP TEXT */}
        <div className={styles.helpBox}>
          Need help? Contact support from
          the Help section inside the app.
        </div>
      </div>
    </div>
  );
};

export default PaymentFailedPage;