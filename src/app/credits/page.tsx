"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { load } from "@cashfreepayments/cashfree-js";
import AlertService from "@/services/alertService";
// Existing services (adjust paths as needed)
import {
  getPlans,
  getMyCreditBalances,
  createCreditOrder,
  CreditPlan,
  CreditBalance,
} from "@/services/v1Service";

// New services you’ve added
import {
  getMyActivePlans,
  getPurchaseHistory,
  ActivePlan,
  PurchaseHistory,
  ActivePlansResponse,
  PurchaseHistoryResponse,
} from "@/services/v2Service"; // adjust import path

const TABS = ["Overview", "Active Plans", "History", "Buy Credits"] as const;
type Tab = (typeof TABS)[number];

const CreditPlansPage = () => {
  const router = useRouter();

  // Data states
  const [balances, setBalances] = useState<CreditBalance[]>([]);
  const [activePlans, setActivePlans] = useState<ActivePlan[]>([]);
  const [purchases, setPurchases] = useState<PurchaseHistory[]>([]);
  const [plans, setPlans] = useState<CreditPlan[]>([]);

  // UI states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("Overview");
  const [purchasingPlanId, setPurchasingPlanId] = useState<number | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<CreditPlan | null>(null);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [balancesRes, activePlansRes, purchasesRes, plansRes] =
        await Promise.all([
          getMyCreditBalances(),
          getMyActivePlans(),
          getPurchaseHistory(),
          getPlans(),
        ]);

      setBalances(balancesRes.data || []);
      setActivePlans(activePlansRes.data || []);
      setPurchases(purchasesRes.data || []);
      setPlans(plansRes.data || []);
    } catch (err: any) {
      console.error("Failed to load credits data:", err);
      setError("Unable to load your credits. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async () => {
    // ==========================================================
    // VALIDATE SELECTED PLAN
    // ==========================================================

    if (!selectedPlan) {
      AlertService.warning(
        "No Plan Selected",
        "Please select a credit plan before continuing.",[]
      );

      return;
    }

    // ==========================================================
    // PREVENT DUPLICATE PURCHASE
    // ==========================================================

    if (
      purchasingPlanId ===
      selectedPlan.id
    ) {
      return;
    }

    try {
      setPurchasingPlanId(
        selectedPlan.id,
      );

      // ========================================================
      // CREATE CASHFREE ORDER
      // ========================================================

      const response =
        await createCreditOrder(
          selectedPlan.id,
        );

      console.log(
        "CREATE ORDER RESPONSE:",
        response,
      );

      // ========================================================
      // CHECK ORDER CREATION
      // ========================================================

      if (
        !response?.success
      ) {
        AlertService.error(
          "Payment Unavailable",
          response?.message ||
            "Unable to create the payment order. Please try again.",
        );

        return;
      }

      const paymentData =
        response?.data;

      // ========================================================
      // VALIDATE PAYMENT DATA
      // ========================================================

      if (
        !paymentData?.order_id ||
        !paymentData
          ?.payment_session_id
      ) {
        AlertService.error(
          "Payment Unavailable",
          "The payment session could not be created. Please try again.",
        );

        return;
      }

      console.log(
        "ORDER ID:",
        paymentData.order_id,
      );

      console.log(
        "PAYMENT SESSION:",
        paymentData.payment_session_id,
      );

      // ========================================================
      // SAVE ORDER ID
      // ========================================================

      localStorage.setItem(
        "credit_order_id",
        paymentData.order_id,
      );

      // ========================================================
      // LOAD CASHFREE
      // ========================================================

      const cashfree =
        await load({
          mode:
            process.env
              .NEXT_PUBLIC_CASHFREE_ENV ===
            "PRODUCTION"
              ? "production"
              : "sandbox",
        });

      // ========================================================
      // CASHFREE LOAD FAILURE
      // ========================================================

      if (!cashfree) {
        AlertService.error(
          "Payment Unavailable",
          "The payment service could not be loaded. Please try again.",
        );

        return;
      }

      // ========================================================
      // CLOSE OUR CONFIRMATION MODAL
      // ========================================================

      setShowPurchaseModal(
        false,
      );

      // ========================================================
      // OPEN CASHFREE CHECKOUT
      // ========================================================

      await cashfree.checkout({
        paymentSessionId:
          paymentData.payment_session_id,

        redirectTarget:
          "_self",
      });
    } catch (error: unknown) {
      console.error(
        "Credit purchase error:",
        error,
      );

      // ========================================================
      // EXTRACT ERROR MESSAGE
      // ========================================================

      let message =
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

        message =
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
          message;
      }

      // ========================================================
      // ERROR ALERT
      // ========================================================

      AlertService.error(
        "Payment Failed",
        message,
      );
    } finally {
      setPurchasingPlanId(
        null,
      );
    }
  };
  // Helper to format date
  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0f172a] via-[#1e1b4b] to-[#111827] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0f172a] via-[#1e1b4b] to-[#111827] flex flex-col items-center justify-center gap-4">
        <p className="text-red-400 text-lg">{error}</p>
        <button
          onClick={loadData}
          className="px-6 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg transition"
        >
          Retry
        </button>
      </div>
    );
  }

  // Total overall remaining credits across all active plans (for a quick glance)
  const totalOverallRemaining = activePlans.reduce(
    (sum, plan) => sum + parseFloat(plan.remaining_credits),
    0
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f172a] via-[#1e1b4b] to-[#111827]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => router.back()}
            className="w-11 h-11 rounded-xl bg-white/10 hover:bg-white/20 text-white transition flex items-center justify-center"
          >
            ←
          </button>
          <div>
            <h1 className="text-3xl font-bold text-white">Credits</h1>
            <p className="text-white/60 mt-1">
              Manage your credits, view active plans and purchase more.
            </p>
          </div>
        </div>

        {/* Category Balances (from overall user balance) */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {balances.map((balance) => (
            <div
              key={balance.id}
              className="bg-white/10 backdrop-blur-xl rounded-2xl p-5 border border-white/10"
            >
              <p className="text-sm text-white/60">{balance.category_name}</p>
              <h3 className="text-3xl font-bold text-violet-300 mt-2">
                {balance.balance}
              </h3>
              <p className="text-xs text-white/40 mt-1">Overall Balance</p>
            </div>
          ))}
          {/* Quick stat: total remaining credits from active plans */}
          {activePlans.length > 0 && (
            <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-5 border border-white/10 col-span-2 md:col-span-2">
              <p className="text-sm text-white/60">
                Active Plans Remaining Credits
              </p>
              <h3 className="text-3xl font-bold text-emerald-300 mt-2">
                {totalOverallRemaining}
              </h3>
              <p className="text-xs text-white/40 mt-1">
                Across {activePlans.length} active plan(s)
              </p>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-white/10 pb-2">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                activeTab === tab
                  ? "bg-violet-600 text-white"
                  : "text-white/60 hover:text-white hover:bg-white/5"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div>
          {/* Overview Tab */}
          {activeTab === "Overview" && (
            <div className="space-y-8">
              {/* Active Plans Summary */}
              {activePlans.length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {activePlans.map((plan) => (
                    <div
                      key={plan.id}
                      className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/10 p-6"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-xl font-bold text-white">
                            {plan.plan_name}
                          </h3>
                          <p className="text-white/60 text-sm mt-1">
                            Purchased on {formatDate(plan.purchased_at)}
                          </p>
                        </div>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            plan.status === "active"
                              ? "bg-emerald-500/20 text-emerald-300"
                              : plan.status === "expired"
                              ? "bg-red-500/20 text-red-300"
                              : "bg-gray-500/20 text-gray-300"
                          }`}
                        >
                          {plan.status.toUpperCase()}
                        </span>
                      </div>

                      <div className="mt-4 space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-white/70">Credits</span>
                          <span className="text-violet-300 font-medium">
                            {plan.remaining_credits} / {plan.total_credits}
                          </span>
                        </div>
                      </div>

                      <div className="mt-4 flex justify-between items-center">
                        <span className="text-white/50 text-xs">
                          Expires: {formatDate(plan.expires_at)} &bull;{" "}
                          {plan.remaining_days} days left
                        </span>
                        <span className="text-violet-300 font-semibold">
                          {plan.remaining_credits} total remaining
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 bg-white/5 rounded-2xl">
                  <p className="text-white/60">You have no active plans.</p>
                  <button
                    onClick={() => setActiveTab("Buy Credits")}
                    className="mt-4 px-6 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg transition"
                  >
                    Buy Your First Plan
                  </button>
                </div>
              )}

              {/* Recent Purchases (last 3) */}
              {purchases.length > 0 && (
                <div>
                  <h2 className="text-xl font-semibold text-white mb-4">
                    Recent Purchases
                  </h2>
                  <div className="space-y-3">
                    {purchases.slice(0, 3).map((purchase) => (
                      <div
                        key={purchase.id}
                        className="flex justify-between items-center bg-white/5 rounded-xl p-4 border border-white/10"
                      >
                        <div>
                          <p className="text-white font-medium">{purchase.plan_name}</p>
                          <p className="text-white/50 text-sm">
                            {formatDate(purchase.purchased_at)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-white font-semibold">
                            ₹{purchase.purchase_amount}
                          </p>
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full ${
                              purchase.status === "active"
                                ? "bg-emerald-500/20 text-emerald-300"
                                : purchase.status === "expired"
                                ? "bg-red-500/20 text-red-300"
                                : "bg-gray-500/20 text-gray-300"
                            }`}
                          >
                            {purchase.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Active Plans Tab - full list with progress bars */}
          {activeTab === "Active Plans" && (
            <div>
              {activePlans.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {activePlans.map((plan) => (
                    <div
                      key={plan.id}
                      className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/10 p-6"
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-xl font-bold text-white">
                            {plan.plan_name}
                          </h3>
                          <p className="text-white/60 text-sm">
                            Purchased {formatDate(plan.purchased_at)}
                          </p>
                        </div>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            plan.status === "active"
                              ? "bg-emerald-500/20 text-emerald-300"
                              : "bg-red-500/20 text-red-300"
                          }`}
                        >
                          {plan.status.toUpperCase()}
                        </span>
                      </div>

                      <div className="space-y-3">
                        <div className="flex justify-between text-sm">
                          <span className="text-white/70">Credits</span>
                          <span className="text-violet-300 font-medium">
                            {plan.remaining_credits} / {plan.total_credits}
                          </span>
                        </div>
                      </div>

                      <div className="mt-4 flex justify-between items-center text-sm">
                        <span className="text-white/50">
                          Expires {formatDate(plan.expires_at)}
                        </span>
                        <span className="text-violet-300 font-semibold">
                          {plan.remaining_days} days left
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 bg-white/5 rounded-2xl">
                  <p className="text-white/60">No active plans right now.</p>
                </div>
              )}
            </div>
          )}

          {/* Purchase History Tab */}
          {activeTab === "History" && (
            <div>
              {purchases.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="border-b border-white/10">
                      <tr className="text-white/60 text-sm">
                        <th className="pb-3 pr-4">Plan</th>
                        <th className="pb-3 pr-4">Amount</th>
                        <th className="pb-3 pr-4">Purchased</th>
                        <th className="pb-3 pr-4">Expires</th>
                        <th className="pb-3 pr-4">Remaining Days</th>
                        <th className="pb-3 pr-4">Status</th>
                        <th className="pb-3">Remaining Credits</th>
                      </tr>
                    </thead>
                    <tbody>
                      {purchases.map((purchase) => (
                        <tr
                          key={purchase.id}
                          className="border-b border-white/5 text-sm"
                        >
                          <td className="py-4 pr-4 text-white font-medium">
                            {purchase.plan_name}
                          </td>
                          <td className="py-4 pr-4 text-white">
                            ₹{purchase.purchase_amount}
                          </td>
                          <td className="py-4 pr-4 text-white/70">
                            {formatDate(purchase.purchased_at)}
                          </td>
                          <td className="py-4 pr-4 text-white/70">
                            {formatDate(purchase.expires_at)}
                          </td>
                          <td className="py-4 pr-4 text-white/70">
                            {purchase.remaining_days}
                          </td>
                          <td className="py-4 pr-4">
                            <span
                              className={`px-2 py-1 rounded-full text-xs ${
                                purchase.status === "active"
                                  ? "bg-emerald-500/20 text-emerald-300"
                                  : purchase.status === "expired"
                                  ? "bg-red-500/20 text-red-300"
                                  : "bg-gray-500/20 text-gray-300"
                              }`}
                            >
                              {purchase.status}
                            </span>
                          </td>
                          <td className="py-4 text-violet-300 font-semibold">
                            {purchase.remaining_credits}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12 bg-white/5 rounded-2xl">
                  <p className="text-white/60">No purchase history yet.</p>
                </div>
              )}
            </div>
          )}

          {/* Buy Credits Tab */}
          {activeTab === "Buy Credits" && (
            <div>
              {plans.length === 0 ? (
                <div className="text-center py-12 bg-white/5 rounded-2xl">
                  <p className="text-white/60">No plans available at the moment.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {plans.map((plan) => (
                    <div
                      key={plan.id}
                      className="bg-white/10 backdrop-blur-xl rounded-3xl border border-white/10 p-6 flex flex-col"
                    >
                      <h3 className="text-2xl font-bold text-white">{plan.name}</h3>
                      <p className="text-white/60 mt-2">{plan.description}</p>
                      <div className="text-4xl font-bold text-violet-300 mt-6">
                        ₹{plan.price}
                      </div>

                      <div className="mt-6 space-y-3 flex-1">
                        {plan.items.map((item) => (
                          <div
                            key={item.id}
                            className="flex items-center gap-3 text-white/90"
                          >
                            <span className="text-emerald-400">✔</span>
                            <span>
                              {item.quantity} {item.category_name} Credits
                            </span>
                          </div>
                        ))}
                      </div>

                      <button
                        onClick={() => {
                          setSelectedPlan(plan);
                          setShowPurchaseModal(true);
                        }}
                        disabled={purchasingPlanId === plan.id}
                        className="mt-8 w-full rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 text-white py-3 font-semibold transition disabled:opacity-50"
                      >
                        {purchasingPlanId === plan.id
                          ? "Processing..."
                          : "Buy Now"}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Purchase Confirmation Modal */}
        {showPurchaseModal && selectedPlan && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-[#111827] border border-white/10 rounded-3xl p-8 w-full max-w-lg">
              <h2 className="text-3xl font-bold text-white">💎 Purchase Plan</h2>
              <p className="text-white/60 mt-2">Confirm your purchase.</p>

              <div className="mt-8">
                <h3 className="text-2xl text-white font-bold">
                  {selectedPlan.name}
                </h3>
                <p className="text-white/60 mt-2">{selectedPlan.description}</p>

                <div className="text-5xl font-bold text-violet-400 mt-6">
                  ₹{selectedPlan.price}
                </div>

                <div className="mt-8 space-y-4">
                  {selectedPlan.items.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between border-b border-white/5 pb-3"
                    >
                      <span className="text-white">{item.category_name}</span>
                      <span className="text-violet-300 font-semibold">
                        {item.quantity}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-4 mt-10">
                <button
                  onClick={() => setShowPurchaseModal(false)}
                  className="flex-1 rounded-xl border border-white/20 text-white py-3"
                >
                  Cancel
                </button>
                <button
                  onClick={handlePurchase}
                  disabled={purchasingPlanId === selectedPlan.id}
                  className="flex-1 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 py-3 text-white font-semibold disabled:opacity-50"
                >
                  {purchasingPlanId === selectedPlan.id
                    ? "Processing..."
                    : "Continue"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CreditPlansPage;