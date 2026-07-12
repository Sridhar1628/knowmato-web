"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { load } from "@cashfreepayments/cashfree-js";

import {
  getPlans,
  getMyCreditBalances,
  createCreditOrder,
  CreditPlan,
  CreditBalance,
} from "@/services/v1Service";

const CreditPlansPage = () => {
  const router = useRouter();

  const [plans, setPlans] = useState<CreditPlan[]>([]);
  const [balances, setBalances] = useState<CreditBalance[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchasingPlanId, setPurchasingPlanId] = useState<number | null>(null);
  const [selectedPlan, setSelectedPlan] =
    useState<CreditPlan | null>(null);

    const [showPurchaseModal, setShowPurchaseModal] =
    useState(false);

  useEffect(() => {
    loadPage();
  }, []);

  const loadPage = async () => {
    try {
      setLoading(true);

      const [plansRes, balancesRes] = await Promise.all([
        getPlans(),
        getMyCreditBalances(),
      ]);

      setPlans(plansRes.data || []);
      setBalances(balancesRes.data || []);
    } catch (error) {
      console.error("Failed to load credits:", error);
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async () => {

    if (!selectedPlan) return;

    try {

        setPurchasingPlanId(
            selectedPlan.id
        );

        const response =
            await createCreditOrder(
                selectedPlan.id
            );

        if (!response.success) {
        alert(response.message || "Unable to create payment.");
        return;
        }

        localStorage.setItem(
        "credit_order_id",
        response.order_id
        );

        const cashfree = await load({
        mode:
            process.env.NEXT_PUBLIC_CASHFREE_ENV === "PRODUCTION"
            ? "production"
            : "sandbox",
        });

        await cashfree.checkout({
        paymentSessionId: response.payment_session_id,
        redirectTarget: "_self",
        });

    } catch (error: any) {
        console.error(error);

        alert(
        error?.message ||
        "Unable to start payment."
        );
    } finally {
        setPurchasingPlanId(null);
    }
    };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f172a] via-[#1e1b4b] to-[#111827]">
      <div className="max-w-6xl mx-auto px-6 py-10">

        {/* Header */}

        <div className="flex items-center gap-4 mb-10">

          <button
            onClick={() => router.back()}
            className="w-11 h-11 rounded-xl bg-white/10 hover:bg-white/20 text-white transition"
          >
            ←
          </button>

          <div>

            <h1 className="text-3xl font-bold text-white">
              Buy Credits
            </h1>

            <p className="text-white/60 mt-1">
              Purchase credit plans to access KnowMato services.
            </p>

          </div>

        </div>

        {loading ? (

          <div className="flex justify-center py-24">

            <div className="w-10 h-10 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />

          </div>

        ) : (

          <>

            {/* Credit Balances */}

            <div className="mb-12">

              <h2 className="text-xl font-semibold text-white mb-5">
                Your Credits
              </h2>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-5">

                {balances.map((balance) => (

                  <div
                    key={balance.id}
                    className="bg-white/10 backdrop-blur-xl rounded-2xl p-5 border border-white/10"
                  >

                    <p className="text-sm text-white/60">
                      {balance.category_name}
                    </p>

                    <h3 className="text-3xl font-bold text-violet-300 mt-2">
                      {balance.balance}
                    </h3>

                  </div>

                ))}

              </div>

            </div>

            {/* Plans */}

            <div>

              <h2 className="text-xl font-semibold text-white mb-5">
                Available Plans
              </h2>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {plans.map((plan) => (

                  <div
                    key={plan.id}
                    className="bg-white/10 backdrop-blur-xl rounded-3xl border border-white/10 p-6"
                  >

                    <h3 className="text-2xl font-bold text-white">
                      {plan.name}
                    </h3>

                    <p className="text-white/60 mt-2">
                      {plan.description}
                    </p>

                    <div className="text-4xl font-bold text-violet-300 mt-6">
                      ₹{plan.price}
                    </div>

                    <div className="mt-8 space-y-3">

                      {plan.items.map((item) => (

                        <div
                          key={item.id}
                          className="flex items-center gap-3 text-white/90"
                        >
                          <span>✔</span>

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
                        className="mt-8 w-full rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 text-white py-3 font-semibold transition"
                        >
                        {purchasingPlanId === plan.id
                            ? "Processing..."
                            : "Buy Now"}
                        </button>

                  </div>

                ))}

              </div>

            </div>

          </>

        )}

      </div>
      {showPurchaseModal &&
        selectedPlan && (

        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">

        <div className="bg-[#111827] border border-white/10 rounded-3xl p-8 w-full max-w-lg">

        <h2 className="text-3xl font-bold text-white">

        💎 Purchase Plan

        </h2>

        <p className="text-white/60 mt-2">

        Confirm your purchase.

        </p>

        <div className="mt-8">

        <h3 className="text-2xl text-white font-bold">

        {selectedPlan.name}

        </h3>

        <p className="text-white/60 mt-2">

        {selectedPlan.description}

        </p>

        <div className="text-5xl font-bold text-violet-400 mt-6">

        ₹{selectedPlan.price}

        </div>

        <div className="mt-8 space-y-4">

        {selectedPlan.items.map(item => (

        <div
        key={item.id}
        className="flex items-center justify-between border-b border-white/5 pb-3"
        >

        <span className="text-white">

        {item.category_name}

        </span>

        <span className="text-violet-300 font-semibold">

        {item.quantity}

        </span>

        </div>

        ))}

        </div>

        </div>

        <div className="flex gap-4 mt-10">

        <button

        onClick={()=>{
        setShowPurchaseModal(false);
        }}

        className="flex-1 rounded-xl border border-white/20 text-white py-3"

        >

        Cancel

        </button>

        <button

        onClick={handlePurchase}

        disabled={
        purchasingPlanId===selectedPlan.id
        }

        className="flex-1 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 py-3 text-white font-semibold"

        >

        {

        purchasingPlanId===selectedPlan.id

        ?

        "Processing..."

        :

        "Continue"

        }

        </button>

        </div>

        </div>

        </div>

        )}
    </div>
  );
};

export default CreditPlansPage;