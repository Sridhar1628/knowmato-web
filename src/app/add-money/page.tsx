"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { load } from "@cashfreepayments/cashfree-js";
import {
  createCashfreeOrder,
  getAvailableWalletOffers,
  getTransactionHistory,
} from "@/services/v1Service";

import {
  connectSocket,
  disconnectSocket,
} from '@/services/versionSocketService';

import {
  getTokens,
} from '@/services/storageService';

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
    const initSocket = async () => {
      try {
        const tokens = await getTokens();
        if (!tokens?.access) return;

        connectSocket(tokens.access, (event: string, data: any) => {
          if (event === 'WALLET_UPDATE') {
            setWalletBalance(
              Number(data.real_balance || 0) + Number(data.bonus_balance || 0)
            );
          }
        });
      } catch (err) {
        console.log('Socket Error:', err);
      }
    };

    initSocket();
    return () => disconnectSocket();
  }, []);

  useEffect(() => {
    const loadPage = async () => {
      await Promise.all([fetchWalletData(), fetchOffers()]);
    };
    loadPage();
  }, []);

  useEffect(() => {
    if (offers.length > 0) {
      findBestOffer(selectedAmount, offers);
    }
  }, [selectedAmount, offers]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    if (token) {
      localStorage.setItem("access_token", token);
      console.log("TOKEN SAVED");
    }
  }, []);

  const fetchWalletData = async () => {
    try {
      const res = await getTransactionHistory();
      console.log('💰 WALLET RESPONSE:', res);
      const data = res?.results || res;
      console.log('💰 WALLET DATA:', data);

      if (!data?.wallet) {
        console.log('Invalid wallet response:', res);
        return;
      }

      setWalletBalance(Number(data.wallet.total_balance || 0));
    } catch (err) {
      console.log('Wallet Fetch Error:', err);
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
      const res = await createCashfreeOrder({ amount: selectedAmount });
      console.log("Cashfree Order:", res);

      if (!res?.payment_session_id) {
        alert("Failed to create payment session");
        return;
      }

      localStorage.setItem("wallet_amount", String(selectedAmount));

      const cashfree = await load({ mode: "sandbox" });

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
    <div className="min-h-screen bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e] relative overflow-hidden">
      {/* Animated blobs */}
      <div className="absolute top-0 -left-20 w-72 h-72 bg-purple-500/20 rounded-full mix-blend-multiply filter blur-3xl animate-blob" />
      <div className="absolute top-0 -right-20 w-72 h-72 bg-fuchsia-500/20 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000" />
      <div className="absolute -bottom-20 left-40 w-72 h-72 bg-cyan-500/20 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000" />

      <div className="relative z-10 max-w-5xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/10 border border-white/20 text-white hover:bg-white/20 transition"
          >
            ←
          </button>
          <div>
            <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-violet-300 to-fuchsia-300">
              Add Money
            </h1>
            <p className="text-white/60 text-sm">Secure wallet top‑up</p>
          </div>
        </div>

        {/* Desktop two‑column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* LEFT COLUMN */}
          <div className="space-y-6">
            {/* Balance Card */}
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-2xl">
              <p className="text-sm text-white/50">Current Balance</p>
              <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-violet-300 to-fuchsia-300 mt-1">
                ₹{walletBalance.toFixed(2)}
              </h2>
            </div>

            {/* Select Amount */}
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-2xl">
              <h3 className="text-lg font-semibold text-white mb-4">Select Amount</h3>
              <div className="flex flex-wrap gap-3">
                {PRESET_AMOUNTS.map((amount) => (
                  <button
                    type="button"
                    key={amount}
                    onClick={() => handlePresetClick(amount)}
                    className={`px-5 py-3 rounded-2xl font-bold text-sm transition-all duration-300 ${
                      selectedAmount === amount && customAmount === ""
                        ? "bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white shadow-lg shadow-violet-500/25"
                        : "bg-white/10 border border-white/20 text-white hover:bg-white/20"
                    }`}
                  >
                    ₹{amount}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Amount */}
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-2xl">
              <h3 className="text-lg font-semibold text-white mb-4">Custom Amount</h3>
              <input
                type="number"
                placeholder="Enter amount"
                value={customAmount}
                onChange={handleCustomAmount}
                className="w-full rounded-2xl border-2 border-white/20 bg-gray-900/60 p-4 text-white placeholder-white/40 focus:ring-4 focus:ring-violet-500/50 focus:border-violet-400 outline-none transition"
              />
            </div>
          </div>

          {/* RIGHT COLUMN */}
          <div className="space-y-6">
            {/* Offer Card */}
            {selectedOffer && (
              <div className="bg-amber-400/10 backdrop-blur-md border border-amber-400/30 rounded-3xl p-6 shadow-xl">
                <p className="text-lg font-semibold text-amber-300">
                  🎁 {selectedOffer.title}
                </p>
                <p className="text-white/80 text-sm mt-1">
                  Get {selectedOffer.bonus_percentage}% bonus up to ₹
                  {selectedOffer.max_bonus}
                </p>
              </div>
            )}

            {/* Summary Card */}
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-2xl">
              <div className="flex justify-between text-white/70 text-sm mb-2">
                <span>Amount</span>
                <span>₹{selectedAmount}</span>
              </div>
              <div className="flex justify-between text-emerald-300 text-sm mb-2">
                <span>Bonus</span>
                <span>+ ₹{calculatedBonus.toFixed(2)}</span>
              </div>
              <div className="border-b border-white/10 my-3" />
              <div className="flex justify-between text-white font-bold text-lg">
                <span>Total Credit</span>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-300 to-fuchsia-300">
                  ₹{totalCredit.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Validation Error */}
            {!isValidAmount && showValidation && (
              <p className="text-rose-400 text-sm font-medium animate-pulse text-center">
                Amount should be between ₹10 and ₹50,000
              </p>
            )}

            {/* Pay Button */}
            <button
              disabled={!isValidAmount || loading}
              onClick={handlePayment}
              className={`w-full py-4 rounded-2xl font-bold text-lg transition-all duration-300 ${
                loading || !isValidAmount
                  ? "bg-gray-500/30 cursor-not-allowed text-gray-300"
                  : "bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white shadow-lg shadow-violet-500/25 hover:from-violet-600 hover:to-fuchsia-600"
              }`}
            >
              {loading ? (
                <span className="inline-block w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                `Proceed to Pay ₹${selectedAmount}`
              )}
            </button>

            {/* Security */}
            <div className="flex items-center justify-center gap-2 text-white/50 text-sm">
              🔒 100% Secure payments powered by Cashfree
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddMoneyPage;