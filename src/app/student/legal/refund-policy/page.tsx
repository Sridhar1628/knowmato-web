// app/student/refund-policy/page.tsx
"use client";

import { useRouter } from "next/navigation";

export default function RefundCancellationPolicyPage() {
  const router = useRouter();

  const sections = [
    {
      title: "✅ Eligible Refunds",
      content:
        "Refunds are available under specific conditions defined below. They apply only to credit‑based transactions on the KnowMato platform. Refunds are generally processed in the form of Credits returned to your KnowMato wallet, not as cash, unless required by applicable law. Eligibility depends on who initiates the cancellation, the timing, and the reason.",
    },
    {
      title: "👨‍🎓 Student Cancellation",
      content:
        "As a student, you may cancel a doubt request or session after a mentor has been matched, but only within the permitted cancellation window — currently 5 minutes from the time of successful matching. If cancelled within this window, you will receive a refund of the session credits minus the applicable platform fee (see Platform Fee section). If the mentor has already begun substantial work (e.g., started explaining, sharing materials), the session may be considered non‑refundable.",
    },
    {
      title: "👨‍🏫 Mentor Cancellation",
      content:
        "If a mentor cancels an accepted session without a valid reason (e.g., they are unable to attend, disconnect, or fail to provide the guidance), the student will receive a full refund of credits. The mentor's reliability score may also be reduced. Repeated cancellations by a mentor can result in fewer doubt assignments or temporary suspension.",
    },
    {
      title: "🛡 Platform Cancellation",
      content:
        "KnowMato may cancel a session or doubt request due to policy violations, suspicious activity, or technical issues. If KnowMato cancels the session, the student will receive a full refund of credits. No platform fee will be deducted in such cases. This may also apply if a mentor is found to be in breach of terms during a session.",
    },
    {
      title: "🔧 Technical Failure",
      content:
        "If a live session (chat, audio, or video) cannot be completed due to verified platform‑side technical issues — such as server downtime, connectivity loss on KnowMato's side, or app malfunction — we will investigate and provide an appropriate credit refund or session rescheduling. You may need to provide details or logs for verification. This does not cover issues arising from the user's own device, internet connection, or third‑party apps.",
    },
    {
      title: "⚖️ Partial Refunds",
      content:
        "In some cases, only a partial refund may be applicable. For example: if a session was partially completed but the remaining time was unusable due to a minor issue, we may refund a proportion of credits. Partial refunds are determined at KnowMato's discretion after reviewing the session context.",
    },
    {
      title: "🏦 Platform Fee",
      content:
        "When a student cancels within the eligible window, a small platform fee (currently up to 5% of the session cost) is deducted to cover payment processing and operational costs. For example, a 5‑credit session would incur a 0.25‑credit fee, resulting in a 4.75‑credit refund. This fee is not deducted if the mentor cancels or if KnowMato cancels the session.",
    },
    {
      title: "👛 Wallet Refund",
      content:
        "All eligible refunds are credited back to your KnowMato credit wallet. Credits are not refunded as cash to your bank account or payment source unless specifically required by law or in cases where a credit purchase itself is refundable (e.g., accidental duplicate purchase). Wallet credits can be used for any future service.",
    },
    {
      title: "🚫 Non‑refundable Services",
      content:
        "The following are generally non‑refundable:\n\n" +
        "• Consumed credits already used in a completed session.\n" +
        "• Courses or learning paths that have been substantially accessed or completed.\n" +
        "• Premium assessments that have been attempted.\n" +
        "• Expired credits (credit expiry is not grounds for a refund).\n" +
        "• Promotional credits (these have no cash value and cannot be refunded).\n\n" +
        "Refund requests for non‑refundable items will be declined.",
    },
    {
      title: "⏱️ Processing Time",
      content:
        "Once a refund is approved, it is processed within 24–48 hours. Your credit wallet will be updated, and you will receive an in‑app notification or email confirmation. In rare cases where a cash refund is applicable, processing may take 5–10 business days depending on your payment provider.",
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
          💰 Refund & Cancellation Policy
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