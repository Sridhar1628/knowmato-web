// app/student/terms-and-conditions/page.tsx
"use client";

import { useRouter } from "next/navigation";

export default function TermsAndConditionsPage() {
  const router = useRouter();

  const sections = [
    {
      title: "1. Acceptance of Terms",
      content:
        "Welcome to KnowMato. These Terms & Conditions govern your access to and use of KnowMato, KnowMato+, the website, mobile applications, APIs, services, and any related products operated by Jeblio Corporation Private Limited (“KnowMato”, “we”, “our”, or “us”).\n\n" +
        "By creating an account, accessing, browsing, or using the Platform, you agree to comply with these Terms, our Privacy Policy, Community Guidelines, Refund Policy, and all other applicable policies. If you do not agree, you must discontinue using the Platform immediately.",
    },
    {
      title: "2. Definitions",
      content:
        "• **Platform** – KnowMato, KnowMato+, website, apps, APIs and related services.\n" +
        "• **User** – Any person accessing the Platform.\n" +
        "• **Student** – A learner using KnowMato for educational purposes.\n" +
        "• **Mentor** – A verified expert providing educational guidance.\n" +
        "• **Institution** – Schools, colleges, universities, coaching centres registered with KnowMato.\n" +
        "• **Company** – Recruiters, employers or organizations posting jobs/internships.\n" +
        "• **Credits** – The virtual currency used within KnowMato.\n" +
        "• **Session** – Any interaction between users (chat, audio, video, AI, etc.).",
    },
    {
      title: "3. Eligibility",
      content:
        "• Users 18 years or older may register independently.\n" +
        "• Users below 18 may use the Platform only with consent from a parent, guardian, or institution where legally required.\n" +
        "• You agree to provide true, complete, and up-to-date information during registration. False information may lead to suspension or permanent termination.",
    },
    {
      title: "4. User Accounts",
      content:
        "• Each account is personal and non-transferable.\n" +
        "• You are responsible for maintaining confidentiality of your login credentials and for all activities under your account.\n" +
        "• You must notify KnowMato immediately if you suspect unauthorized access.\n" +
        "• KnowMato is not liable for losses arising from your failure to protect your account.",
    },
    {
      title: "5. Platform Usage",
      content:
        "**Services** – KnowMato provides instant doubt resolution, live sessions, courses, coding practice, assessments, job/internship listings, AI tools, and more.\n\n" +
        "**General Prohibitions** – Users must not:\n" +
        "• Share personal contact details (phone, WhatsApp, Telegram, email, etc.)\n" +
        "• Promote external tuition or competing platforms\n" +
        "• Upload illegal, copyrighted, or harmful material\n" +
        "• Abuse, harass, discriminate, or impersonate others\n" +
        "• Attempt to bypass the Platform or solicit external payments\n\n" +
        "**Students** agree to ask genuine questions, respect mentors, and follow Community Guidelines.\n" +
        "**Mentors** agree to maintain professional conduct, deliver accurate guidance, and never demand external payments.\n\n" +
        "Violation may result in warnings, temporary restrictions, or permanent termination.",
    },
    {
      title: "6. Payments",
      content:
        "• Credits can be purchased via UPI, debit/credit cards, net banking, wallets, and other supported payment methods.\n" +
        "• Payments are processed through authorised third‑party gateways; KnowMato does not store complete banking credentials.\n" +
        "• Refunds: Students may cancel a doubt before the mentor substantially begins (within 5 minutes of matching) for a partial refund after platform fees. Full refund if mentor cancels without valid reason. Technical failures may also be eligible for refunds.\n" +
        "• Non‑refundable: consumed credits, completed sessions, substantially accessed courses, and already delivered premium services.",
    },
    {
      title: "7. Credits",
      content:
        "• Credits are virtual currency used for posting doubts, requesting mentors, purchasing courses, premium assessments, etc.\n" +
        "• Credits have no cash value outside the Platform and cannot be transferred between users unless officially permitted.\n" +
        "• KnowMato reserves the right to modify pricing, credit requirements, and promotional offers at any time.",
    },
    {
      title: "8. Intellectual Property",
      content:
        "• All rights to the Platform — including KnowMato, KnowMato+, Jeblio Corporation, logos, UI, software, source code, designs, trademarks, databases, and documentation — are owned by or licensed to Jeblio Corporation Private Limited.\n" +
        "• No user may copy, modify, reverse engineer, or commercially exploit any part of the Platform without prior written permission.\n" +
        "• Users retain ownership of their original content but grant KnowMato a non‑exclusive, royalty‑free license to store, display, and process it solely for operating the Platform.",
    },
    {
      title: "9. Suspension & Termination",
      content:
        "KnowMato may suspend or terminate accounts for fraud, repeated policy violations, sharing contact details to bypass the Platform, illegal activities, copyright infringement, harassment, hate speech, or misuse of services.\n\n" +
        "Actions may include: warning, temporary restriction, temporary suspension, or permanent account termination. For serious offences, immediate permanent termination may occur without prior warning.\n" +
        "Users may contact support to appeal certain actions where applicable.",
    },
    {
      title: "10. Limitation of Liability",
      content:
        "KnowMato is a technology platform connecting users; it does not guarantee uninterrupted access, that every doubt will be answered, admission, exam success, internship/employment placement, or career advancement.\n\n" +
        "To the maximum extent permitted by law, Jeblio Corporation Private Limited shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from the use of the Platform.",
    },
    {
      title: "11. Governing Law",
      content:
        "These Terms shall be governed by and interpreted in accordance with the laws of the Republic of India. Any disputes shall be subject to the exclusive jurisdiction of the competent courts located in the jurisdiction of the registered office of Jeblio Corporation Private Limited.",
    },
    {
      title: "12. Dispute Resolution",
      content:
        "Users are encouraged to first contact KnowMato Support for an amicable resolution. Where mutually agreed and legally permissible, disputes may be resolved through negotiation or mediation before litigation. Nothing limits statutory rights available under applicable law.",
    },
    {
      title: "13. Contact Information",
      content:
        "**Jeblio Corporation Private Limited**\n\n" +
        "📧 Email: support@knowmato.in\n" +
        "🌐 Website: https://www.knowmato.in\n" +
        "📍 Registered Office: [Address available on request]\n" +
        "🕘 Business Hours: Monday – Saturday, 09:00 AM – 06:00 PM (IST)",
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
          📜 Terms & Conditions (Master Agreement)
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