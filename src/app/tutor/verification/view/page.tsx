"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { getTutorBankVerification } from "@/services/v1Service";
import toast from "react-hot-toast";

export default function VerificationViewPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [verification, setVerification] = useState<any>(null);

  useEffect(() => {
    const fetchVerification = async () => {
      try {
        const res = await getTutorBankVerification();
        if (!res.submitted) {
          router.replace("/tutor/verification");
          return;
        }
        setVerification(res.data);
      } catch {
        toast.error("Failed to load verification.");
      } finally {
        setLoading(false);
      }
    };
    fetchVerification();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e] flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-12 h-12 border-4 border-violet-400 border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-white/70">Loading verification...</p>
        </div>
      </div>
    );
  }

  if (!verification) return null;

  const infoItems = [
    { title: "Account Holder", value: verification.account_holder_name },
    { title: "Account Number", value: `XXXXXX${verification.account_number.slice(-4)}` },
    { title: "IFSC", value: verification.ifsc_code },
    { title: "Bank", value: verification.bank_name },
    { title: "Branch", value: verification.branch_name },
    { title: "Account Type", value: verification.account_type },
    { title: "PAN", value: verification.pan_number },
    { title: "Aadhaar", value: `XXXXXXXX${verification.aadhaar_number.slice(-4)}` },
    { title: "Mobile", value: verification.mobile_number },
    { title: "Status", value: verification.status.toUpperCase() },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e] relative overflow-hidden p-4 sm:p-6">
      {/* Animated blobs */}
      <div className="absolute top-0 -left-20 w-72 h-72 bg-purple-500/20 rounded-full mix-blend-multiply filter blur-3xl animate-blob" />
      <div className="absolute top-0 -right-20 w-72 h-72 bg-fuchsia-500/20 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000" />
      <div className="absolute -bottom-20 left-40 w-72 h-72 bg-cyan-500/20 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="relative z-10 max-w-3xl mx-auto bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl p-6 sm:p-8"
      >
        <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-violet-300 to-fuchsia-300 mb-8">
          Bank Verification
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {infoItems.map((item, idx) => (
            <motion.div
              key={idx}
              whileHover={{ scale: 1.02 }}
              className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-4"
            >
              <p className="text-sm text-white/50">{item.title}</p>
              <p className="font-semibold text-white mt-1">{item.value}</p>
            </motion.div>
          ))}
        </div>

        {verification.rejection_reason && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-6 rounded-xl bg-rose-500/10 border border-rose-400/30 backdrop-blur-md p-4"
          >
            <p className="font-semibold text-rose-300">Rejection Reason</p>
            <p className="text-rose-200/80 mt-1">{verification.rejection_reason}</p>
          </motion.div>
        )}

        <div className="flex gap-3 mt-8">
          <button
            onClick={() => router.push("/tutor/wallet")}
            className="flex-1 bg-white/10 hover:bg-white/20 text-white/80 font-semibold py-3 rounded-xl border border-white/10 transition"
          >
            Back
          </button>
          {verification.status === "rejected" && (
            <button
              onClick={() => router.push("/tutor/verification")}
              className="flex-1 bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:from-violet-600 hover:to-fuchsia-600 text-white font-semibold py-3 rounded-xl shadow-lg shadow-violet-500/25 transition"
            >
              Update Verification
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}