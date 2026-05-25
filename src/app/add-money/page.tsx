"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { load } from "@cashfreepayments/cashfree-js";
import {
  createCashfreeOrder,
  getAvailableWalletOffers,
  getTransactionHistory,
} from "@/services/v1Service";
import styles from "./AddMoney.module.css";

/* -------------------------------------------------------------------------- */
/* TYPES */
/* -------------------------------------------------------------------------- */

interface WalletOffer {
  id: number;
  title: string;
  description?: string;
  min_amount: number;
  bonus_percentage: number;
  max_bonus: number;
}

const PRESET_AMOUNTS = [100, 250, 500, 1000, 2000];

const AddMoneyPage = () => {
  const router = useRouter();

  /* -------------------------------------------------------------------------- */
  /* STATE */
  /* -------------------------------------------------------------------------- */

  const [selectedAmount, setSelectedAmount] = useState<number>(500);
  const [customAmount, setCustomAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [walletBalance, setWalletBalance] = useState(0);
  const [offers, setOffers] = useState<WalletOffer[]>([]);
  const [selectedOffer, setSelectedOffer] = useState<WalletOffer | null>(null);
  const [showValidation, setShowValidation] = useState(false);
  const params = new URLSearchParams(
    typeof window !== "undefined" ? window.location.search : ""
  );
  const fromApp = params.get("from_app");

  if (fromApp === "true") {
    localStorage.setItem("from_app", "true");
  }

  /* -------------------------------------------------------------------------- */
  /* FETCH DATA */
  /* -------------------------------------------------------------------------- */

  useEffect(() => {
    if (offers.length > 0) {
      findBestOffer(selectedAmount, offers);
    }
  }, [selectedAmount, offers]);

  useEffect(() => {

    const params = new URLSearchParams(window.location.search);

    const token = params.get("token");

    if (token) {

      localStorage.setItem(
        "access_token",
        token
      );

      console.log("TOKEN SAVED");
    }

  }, []);

  const fetchWalletData = async () => {
    try {
      const res = await getTransactionHistory();
      const data = res?.results || res;

      if (!data?.wallet) {
        console.log("Invalid wallet response:", res);
        return;
      }
      setWalletBalance(
        Number(data?.wallet?.total_balance || 0)
      );
    } catch (err) {
      console.log("Wallet Fetch Error:", err);
    }
  };

  const fetchOffers = async () => {
    try {
      const res = await getAvailableWalletOffers();
      const data = res.data || [];
      setOffers(data);
    } catch (err) {
      console.log("Offer Fetch Error:", err);
    }
  };

  /* -------------------------------------------------------------------------- */
  /* SELECT BEST OFFER */
  /* -------------------------------------------------------------------------- */

  const findBestOffer = (amount: number, availableOffers: WalletOffer[]) => {
    const validOffers = availableOffers.filter(
      (offer) => amount >= offer.min_amount
    );
    if (validOffers.length === 0) {
      setSelectedOffer(null);
      return;
    }
    validOffers.sort((a, b) => b.bonus_percentage - a.bonus_percentage);
    setSelectedOffer(validOffers[0]);
  };

  /* -------------------------------------------------------------------------- */
  /* HANDLE AMOUNT CHANGE */
  /* -------------------------------------------------------------------------- */

  const handlePresetClick = (amount: number) => {
    setSelectedAmount(amount);
    setCustomAmount("");
    findBestOffer(amount, offers);
  };

  const handleCustomAmount = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setCustomAmount(value);
    const parsed = Number(value);
    if (!isNaN(parsed) && parsed > 0) {
      setSelectedAmount(parsed);
      findBestOffer(parsed, offers);
    }
  };

  /* -------------------------------------------------------------------------- */
  /* BONUS CALCULATION */
  /* -------------------------------------------------------------------------- */

  const calculatedBonus = useMemo(() => {
    if (!selectedOffer) return 0;
    const percentageBonus =
      (selectedAmount * selectedOffer.bonus_percentage) / 100;
    return Math.min(percentageBonus, selectedOffer.max_bonus);
  }, [selectedAmount, selectedOffer]);

  const totalCredit = selectedAmount + calculatedBonus;

  /* -------------------------------------------------------------------------- */
  /* VALIDATION */
  /* -------------------------------------------------------------------------- */

  const isValidAmount = selectedAmount >= 10 && selectedAmount <= 50000;

  /* -------------------------------------------------------------------------- */
  /* HANDLE PAYMENT */
  /* -------------------------------------------------------------------------- */

  const handlePayment = async () => {
    if (!isValidAmount) {
      setShowValidation(true);
      setTimeout(() => setShowValidation(false), 1000);
      return;
    }

    try {
      setLoading(true);
      const res = await createCashfreeOrder({
        amount: selectedAmount,
      });
      console.log("Cashfree Order:", res);

      if (!res?.payment_session_id) {
        alert("Failed to create payment session");
        return;
      }

      localStorage.setItem("wallet_amount", String(selectedAmount));

      const cashfree = await load({
        mode: "sandbox", // change to production
      });

      await cashfree.checkout({
        paymentSessionId: res.payment_session_id,
        redirectTarget: "_self",
      });
    } catch (err) {
      console.log("Payment Error:", err);
      alert("Payment initialization failed");
    } finally {
      setLoading(false);
    }
  };

  /* -------------------------------------------------------------------------- */
  /* RENDER */
  /* -------------------------------------------------------------------------- */

  return (
    <div className={styles.container}>
      {/* HEADER */}
      <div className={styles.header}>
        <button className={styles.backBtn} onClick={() => router.back()}>
          ←
        </button>
        <div>
          <h1 className={styles.title}>Add Money</h1>
          <p className={styles.subtitle}>Secure wallet top‑up</p>
        </div>
      </div>

      {/* DESKTOP TWO‑COLUMN LAYOUT */}
      <div className={styles.desktopLayout}>
        {/* LEFT COLUMN */}
        <div className={styles.leftColumn}>
          {/* BALANCE CARD */}
          <div className={styles.balanceCard}>
            <p className={styles.balanceLabel}>Current Balance</p>
            <h2 className={styles.balanceAmount}>
              ₹{walletBalance.toFixed(2)}
            </h2>
          </div>

          {/* SELECT AMOUNT */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Select Amount</h3>
            <div className={styles.amountGrid}>
              {PRESET_AMOUNTS.map((amount) => (
                <button
                  type="button"
                  key={amount}
                  className={`${styles.amountBtn} ${
                    selectedAmount === amount && customAmount === ""
                      ? styles.activeAmountBtn
                      : ""
                  }`}
                  onTouchStart={() => handlePresetClick(amount)}
                  onClick={() => handlePresetClick(amount)}
                >
                  ₹{amount}
                </button>
              ))}
            </div>
          </div>

          {/* CUSTOM AMOUNT */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Custom Amount</h3>
            <input
              type="number"
              placeholder="Enter amount"
              value={customAmount}
              onChange={handleCustomAmount}
              className={styles.input}
            />
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className={styles.rightColumn}>
          {/* OFFER */}
          {selectedOffer && (
            <div className={styles.offerCard}>
              <p className={styles.offerTitle}>🎁 {selectedOffer.title}</p>
              <p className={styles.offerText}>
                Get {selectedOffer.bonus_percentage}% bonus up to ₹
                {selectedOffer.max_bonus}
              </p>
            </div>
          )}

          {/* SUMMARY */}
          <div className={styles.summaryCard}>
            <div className={styles.summaryRow}>
              <span>Amount</span>
              <span>₹{selectedAmount}</span>
            </div>
            <div className={styles.summaryRow}>
              <span>Bonus</span>
              <span className={styles.bonusText}>
                + ₹{calculatedBonus.toFixed(2)}
              </span>
            </div>
            <div className={styles.summaryDivider}></div>
            <div className={styles.summaryRow}>
              <span className={styles.totalLabel}>Total Credit</span>
              <span className={styles.totalValue}>
                ₹{totalCredit.toFixed(2)}
              </span>
            </div>
          </div>

          {/* VALIDATION ERROR */}
          <p
            className={`${styles.errorText} ${
              !isValidAmount && showValidation ? styles.errorShake : ""
            }`}
          >
            Amount should be between ₹10 and ₹50,000
          </p>

          {/* PAY BUTTON */}
          <button
            className={`${styles.payBtn} ${loading ? styles.payBtnLoading : ""}`}
            disabled={!isValidAmount || loading}
            onClick={handlePayment}
            type="button"
          >
            {loading ? (
              <span className={styles.spinner} />
            ) : (
              `Proceed to Pay ₹${selectedAmount}`
            )}
          </button>

          {/* SECURITY */}
          <div className={styles.securityBox}>
            🔒 100% Secure payments powered by Cashfree
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddMoneyPage;