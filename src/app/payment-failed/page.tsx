"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

const PaymentFailedPage = () => {
  const router = useRouter();

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e] flex items-center justify-center px-4">
      {/* Animated background blobs */}
      <div className="absolute top-0 -left-20 w-72 h-72 bg-purple-500/20 rounded-full mix-blend-multiply filter blur-3xl animate-blob" />
      <div className="absolute top-0 -right-20 w-72 h-72 bg-fuchsia-500/20 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000" />
      <div className="absolute -bottom-20 left-40 w-72 h-72 bg-cyan-500/20 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative z-10 w-full max-w-md rounded-3xl bg-white/5 backdrop-blur-xl border border-white/10 p-8 sm:p-10 shadow-2xl text-center"
      >
        {/* Failed Icon with subtle shake */}
        <motion.div
          className="text-6xl mb-4"
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 150, duration: 0.5 }}
          whileHover={{ rotate: [0, -10, 10, -10, 0] }}
        >
          ❌
        </motion.div>

        {/* Title */}
        <h1 className="text-3xl sm:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-rose-300 to-orange-300 mb-3">
          Payment Failed
        </h1>

        {/* Message */}
        <p className="text-white/70 text-sm sm:text-base mb-6 leading-relaxed">
          Your payment could not be completed. If money was deducted, it will
          automatically be refunded by your bank.
        </p>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <button
            onClick={() => router.push("/add-money")}
            className="w-full py-3 rounded-2xl bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white font-bold shadow-lg shadow-violet-500/25 hover:from-violet-600 hover:to-fuchsia-600 transition-all active:scale-95"
          >
            Try Again
          </button>
          <button
            onClick={() => router.push("/student/wallet")}
            className="w-full py-3 rounded-2xl bg-white/10 border border-white/20 text-white font-semibold hover:bg-white/20 transition-all active:scale-95"
          >
            Back to Wallet
          </button>
        </div>

        {/* Help Text */}
        <div className="text-xs text-white/40">
          Need help? Contact support from the Help section inside the app.
        </div>
      </motion.div>
    </div>
  );
};

export default PaymentFailedPage;