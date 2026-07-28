"use client";

import { useEffect, useState } from "react";
"use client";

import { useSearchParams } from "next/navigation";

import { mobilePaymentLogin } from "@/services/v2Service";
import { saveTokens } from "@/services/storageService";
import { createCreditOrder } from "@/services/v1Service";
import { load } from "@cashfreepayments/cashfree-js";

export default function MobilePaymentPage() {

    const searchParams = useSearchParams();


    const [message, setMessage] = useState(
        "Preparing your payment..."
    );

    useEffect(() => {

        const startPayment = async () => {

            try {

                const token =
                    searchParams.get("token");

                if (!token) {

                    setMessage("Invalid payment session.");

                    return;

                }

                setMessage("Signing you in...");

                const login =
                    await mobilePaymentLogin(token);

                if (!login.success) {

                    setMessage(login.message);

                    return;

                }

                const data = login.data;

                saveTokens(
                    data.access,
                    data.refresh
                );

                setMessage("Creating payment...");

                const order =
                    await createCreditOrder(
                        data.plan_id
                    );

                if (!order.success) {

                    setMessage(order.message);

                    return;

                }

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

                    setMessage(
                        "Unable to load payment."
                    );

                    return;

                }

                setMessage(
                    "Redirecting to payment..."
                );

                await cashfree.checkout({

                    paymentSessionId:
                        order.data.payment_session_id,

                    redirectTarget:
                        "_self",

                });

            } catch (error) {

                console.error(error);

                setMessage(
                    "Unable to start payment."
                );

            }

        };

        startPayment();

    }, [searchParams]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#0B1020]">
            <div className="text-center">
                <div className="animate-spin h-10 w-10 border-4 border-violet-500 border-t-transparent rounded-full mx-auto mb-6"/>
                <h1 className="text-2xl text-white font-bold">
                    {message}
                </h1>
            </div>
        </div>
    );
}