"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import {
  verifyCreditPayment,
} from "@/services/v1Service";

export default function CreditPaymentSuccessPage() {

  const router = useRouter();

  const searchParams = useSearchParams();

  const orderId = searchParams.get("order_id");

  const [loading, setLoading] = useState(true);

  const [message, setMessage] = useState("");

  const [success, setSuccess] = useState(false);

  useEffect(() => {

    if (!orderId) {

      setLoading(false);

      setSuccess(false);

      setMessage("Order ID not found.");

      return;

    }

    verify();

  }, [orderId]);

  const verify = async () => {

    try {

      const res = await verifyCreditPayment(
        orderId!
      );

      setSuccess(res.success);

      setMessage(res.message);

    } catch (err: any) {

      console.log(err);

      setSuccess(false);

      setMessage(
        err?.response?.data?.message ||
        "Unable to verify payment."
      );

    } finally {

      setLoading(false);

    }

  };

  if (loading) {

    return (

      <div className="min-h-screen flex items-center justify-center bg-slate-950">

        <div className="w-10 h-10 rounded-full border-4 border-violet-500 border-t-transparent animate-spin" />

      </div>

    );

  }

  return (

    <div className="min-h-screen flex items-center justify-center bg-slate-950">

      <div className="bg-white rounded-3xl p-10 w-full max-w-md text-center">

        {success ? (

          <>

            <div className="text-6xl mb-6">
              🎉
            </div>

            <h1 className="text-3xl font-bold">
              Credits Added
            </h1>

            <p className="text-gray-500 mt-4">
              {message}
            </p>

            <button
              onClick={() => router.push("/student/credits")}
              className="mt-8 w-full rounded-xl bg-violet-600 text-white py-3"
            >
              Continue
            </button>

          </>

        ) : (

          <>

            <div className="text-6xl mb-6">
              ❌
            </div>

            <h1 className="text-3xl font-bold">
              Payment Failed
            </h1>

            <p className="text-gray-500 mt-4">
              {message}
            </p>

            <button
              onClick={() => router.push("/student/credits")}
              className="mt-8 w-full rounded-xl bg-red-600 text-white py-3"
            >
              Back
            </button>

          </>

        )}

      </div>

    </div>

  );

}