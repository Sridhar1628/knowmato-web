// app/student/faq/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

interface FAQItem {
  question: string;
  answer: string;
}

const faqItems: FAQItem[] = [
  {
    question: "How to buy credits?",
    answer:
      "Open your Wallet from the sidebar or dashboard. Choose a credit pack that fits your needs. You can pay securely via UPI, debit/credit card, net banking, or supported wallets. Credits are added instantly after payment confirmation.",
  },
  {
    question: "How refund works?",
    answer:
      "If you cancel a session within 5 minutes of mentor matching, you get a partial refund (credits minus platform fee). If the mentor cancels, you get a full refund. Verified technical issues are also eligible. Refunds are credited to your wallet. Completed sessions are non‑refundable.",
  },
  {
    question: "How to become a mentor?",
    answer:
      "Apply via the KnowMato website or app under ‘Become a Tutor’. Fill in your qualifications, skills, and experience. Our team verifies your documents. Once approved, set up your profile and start accepting doubts.",
  },
  {
    question: "How jobs work?",
    answer:
      "Companies post job and internship listings on KnowMato. You can browse, search, and apply directly through the platform. KnowMato does not guarantee interviews or placements. Always verify offers before accepting.",
  },
  {
    question: "Can I delete my account?",
    answer:
      "Yes. You can request account deletion through Settings or by contacting support@knowmato.in. Please note that deletion permanently removes your purchased credits, progress, and history, subject to legal retention requirements.",
  },
  {
    question: "Can I change the language?",
    answer:
      "Absolutely. Go to Settings and choose between English and Tamil (தமிழ்). The entire app will switch immediately. More languages are planned.",
  },
  {
    question: "How Skill Score works?",
    answer:
      "Your Skill Score is an internal metric based on assessments, course completions, and coding challenges you complete on KnowMato. It helps mentors understand your strengths and may be visible to companies. It is not a formal certificate.",
  },
  {
    question: "What if a mentor doesn’t respond?",
    answer:
      "If a mentor doesn’t accept your doubt or goes offline, you can cancel the request (within the allowed window) to get a partial refund, or wait — the doubt may return to the Doubt Pool for another mentor to pick up.",
  },
  {
    question: "Can I report someone?",
    answer:
      "Yes. Use the Report button inside chats, on a user’s profile, or during a session. You can also email support@knowmato.in. We review all reports and take action according to our policies.",
  },
  {
    question: "How AI works?",
    answer:
      "KnowMato uses AI for voice‑to‑text doubt posting, mentor recommendations, and safety moderation. AI assists but does not replace real mentors. AI‑generated answers should be verified by you. No raw audio is stored long‑term.",
  },
];

export default function FAQPage() {
  const router = useRouter();
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleItem = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e] relative overflow-hidden">
      {/* Animated blobs */}
      <div className="absolute top-0 -left-20 w-72 h-72 bg-purple-500/20 rounded-full mix-blend-multiply filter blur-3xl animate-blob" />
      <div className="absolute top-0 -right-20 w-72 h-72 bg-fuchsia-500/20 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000" />
      <div className="absolute -bottom-20 left-40 w-72 h-72 bg-cyan-500/20 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000" />

      <div className="relative z-10 max-w-3xl mx-auto px-4 py-10 sm:px-6 lg:px-8">
        {/* Back button */}
        <button
          onClick={() => router.back()}
          className="mb-6 flex items-center gap-2 text-white/60 hover:text-white transition"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>

        <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-violet-300 via-fuchsia-300 to-cyan-300 mb-8">
          ❔ Frequently Asked Questions
        </h1>

        <div className="space-y-3">
          {faqItems.map((item, index) => (
            <div
              key={index}
              className="rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 overflow-hidden shadow-2xl transition-all hover:border-violet-400/40"
            >
              <button
                onClick={() => toggleItem(index)}
                className="w-full flex items-center justify-between p-5 text-left"
              >
                <span className="text-white font-semibold pr-4">{item.question}</span>
                <motion.div
                  animate={{ rotate: openIndex === index ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                  className="flex-shrink-0"
                >
                  <svg className="w-5 h-5 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </motion.div>
              </button>
              <AnimatePresence>
                {openIndex === index && (
                  <motion.div
                    initial={{ height : 0, opacity: 0 }}
                    animate={{ height : "auto", opacity: 1 }}
                    exit={{ height : 0, opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    className="overflow-hidden"
                  >
                    <div className="px-5 pb-5 text-white/80 text-sm sm:text-base leading-relaxed whitespace-pre-line">
                      {item.answer}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>

        <p className="mt-8 text-center text-xs text-white/30">
          © {new Date().getFullYear()} Jeblio Corporation Private Limited. All rights reserved.
        </p>
      </div>
    </div>
  );
}