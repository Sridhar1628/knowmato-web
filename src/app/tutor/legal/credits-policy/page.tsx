// app/student/credits-policy/page.tsx
"use client";

import { useRouter } from "next/navigation";

export default function CreditsPolicyPage() {
  const router = useRouter();

  const sections = [
    {
      title: "💰 What are Credits?",
      content:
        "Credits are the virtual currency used within the KnowMato platform. They allow you to access premium educational services, including posting doubts, requesting mentors, enrolling in courses, taking assessments, and more. Credits have no cash value outside the platform and are not legal tender. Your credit balance is displayed in your wallet at all times.",
    },
    {
      title: "🛒 Buying Credits",
      content:
        "You can purchase credit packs through the KnowMato app or website. Supported payment methods include UPI, debit/credit cards, net banking, and mobile wallets. Payments are processed via secure third‑party gateways; KnowMato does not store your full banking credentials. Purchased credits are added to your wallet immediately upon successful payment confirmation.",
    },
    {
      title: "🔄 Top‑up",
      content:
        "Top‑up refers to adding more credits to your existing balance. There is no limit on how many times you can top up. Auto‑top‑up options may be offered in the future to ensure uninterrupted learning. All top‑up purchases are final unless covered by our refund policy.",
    },
    {
      title: "🏫 Institution Credits",
      content:
        "Educational institutions partnering with KnowMato may purchase credit packs in bulk and distribute them to their students. Institution‑issued credits are subject to the same usage and expiry rules. Institutions may set their own expiry dates for distributed credits, which will be communicated to students at the time of allocation.",
    },
    {
      title: "🎁 Promotional Credits",
      content:
        "KnowMato may offer promotional credits as part of welcome offers, referral bonuses, event participation, or seasonal campaigns. Promotional credits are non‑transferable and may come with an expiry date. They cannot be redeemed for cash or refunded. Any misuse (fake accounts, automated scripts) to obtain promotional credits will lead to account suspension.",
    },
    {
      title: "📘 Using Credits",
      content:
        "Credits are deducted from your wallet when you:\n\n" +
        "• Post a doubt in the Doubt Pool\n" +
        "• Request a specific mentor for an individual session\n" +
        "• Start a live chat, audio, or video session\n" +
        "• Enroll in a premium course or learning path\n" +
        "• Take an advanced assessment\n" +
        "• Access other premium features as marked in the app\n\n" +
        "The exact credit cost for each service is displayed before you confirm the action. You will always be notified of the deduction.",
    },
    {
      title: "⏳ Expiry",
      content:
        "Purchased credits generally remain valid for 12 months from the date of purchase, unless stated otherwise. Promotional credits may have a shorter validity (e.g., 30 days). Any unused credits after expiry will be forfeited. KnowMato will make reasonable efforts to notify you before credits expire. Expired credits cannot be reinstated.",
    },
    {
      title: "↩️ Refund of Credits",
      content:
        "Refunds are governed by our Refund & Cancellation Policy. In summary:\n\n" +
        "• If a mentor cancels, you get a full eligible credit refund.\n" +
        "• If you cancel within the permitted window (usually 5 minutes after matching), you receive a refund minus any platform fee.\n" +
        "• Technical failures validated by KnowMato may result in a full or partial credit adjustment.\n\n" +
        "Completed sessions, substantially accessed courses, and already consumed premium services are non‑refundable. To request a refund, contact support with the session details.",
    },
    {
      title: "🔄 Transfer",
      content:
        "Credits are intended for personal use and are non‑transferable. You cannot send, sell, or transfer credits to another user unless explicitly permitted by KnowMato in special circumstances (e.g., institutional credit distribution). Unauthorized transfer may result in account restriction.",
    },
    {
      title: "🚫 Restrictions",
      content:
        "The following activities are strictly prohibited and may lead to credit forfeiture and account suspension:\n\n" +
        "• Purchasing credits using fraudulent payment methods\n" +
        "• Exploiting bugs or loopholes to gain credits\n" +
        "• Using multiple fake accounts to collect promotional credits\n" +
        "• Trading credits outside the platform\n" +
        "• Attempting to sell credits for real money\n\n" +
        "KnowMato reserves the right to reverse, void, or confiscate credits obtained through misuse.",
    },
    {
      title: "🛡 Fraud Prevention",
      content:
        "To protect users, KnowMato monitors credit transactions for suspicious activity. Unusual purchase patterns, rapid credit consumption, or login from high‑risk locations may trigger a security review. In such cases, we may temporarily freeze your credit balance until the review is complete. You will be notified if any action is taken on your account.",
    },
  ];

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
          💳 Credits Policy
        </h1>

        <div className="space-y-6">
          {sections.map((section, idx) => (
            <div
              key={idx}
              className="rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 p-6 shadow-2xl hover:border-violet-400/40 transition-all"
            >
              <h2 className="text-xl font-bold text-white mb-3">{section.title}</h2>
              <div className="text-white/80 whitespace-pre-line leading-relaxed text-sm sm:text-base">
                {section.content}
              </div>
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