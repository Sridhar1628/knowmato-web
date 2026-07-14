// app/student/about-knowmato/page.tsx (or your preferred path)
"use client";

import { useTranslation } from "react-i18next";
import { useRouter } from "next/navigation";

export default function AboutKnowMatoPage() {
  const { t } = useTranslation();
  const router = useRouter();

  // Static content – easily replaceable with translations
  const sections = [
    {
      title: "👋 Welcome to KnowMato",
      content: `KnowMato is an end-to-end educational technology platform built by Jeblio Corporation Private Limited. We connect students, mentors, institutions, and companies in a safe, productive environment designed to accelerate learning and career growth.`,
    },
    {
      title: "🏢 About Jeblio Corporation",
      content: `Jeblio Corporation Private Limited is an Indian technology company focused on building accessible, high‑quality educational products. Incorporated under the Companies Act, our registered office is in India (address available on request). We are a passionate team of engineers, educators, and designers committed to transforming how India learns.`,
    },
    {
      title: "🔭 Vision",
      content: `To become India’s most trusted learning companion — where every student, regardless of background, can instantly access expert guidance, quality resources, and meaningful career opportunities.`,
    },
    {
      title: "🎯 Mission",
      content: `To democratise education by bridging the gap between curiosity and clarity. We simplify complex concepts through instant doubt resolution, live mentor sessions, structured courses, and AI‑assisted tools — all within a single, affordable ecosystem.`,
    },
    {
      title: "❓ What is KnowMato?",
      content: `KnowMato is the core platform that enables real‑time educational interactions. Students can post doubts via text, image, voice, or AI assistant, and get connected with verified mentors for chat, audio, or video sessions. It also includes a discussion forum, current affairs, coding practice, assessments, and a credit‑based system to access premium features.`,
    },
    {
      title: "✨ What is KnowMato+?",
      content: `KnowMato+ is the premium layer of the platform offering structured learning paths: video lectures, interactive quizzes, coding lectures, practice exercises, assignments, and resource libraries. It is designed for students who want a guided, curriculum‑aligned learning journey alongside on‑demand help.`,
    },
    {
      title: "🧩 Platform Features",
      content: `KnowMato offers a comprehensive set of tools:\n\n• Instant Doubt Resolution (text, voice, image)\n• Doubt Pool & Individual Mentor Requests\n• Live Chat, Audio, & Video Sessions\n• Solved Doubts History\n• Current Affairs (updated daily)\n• Discussion Forum\n• Courses & Coding Practice\n• Integrated Programming Compiler\n• Assessments & Skill Score\n• Internships & Job Opportunities\n• AI‑powered Voice Assistant & Smart Recommendations`,
    },
    {
      title: "🌐 Supported Languages",
      content: `KnowMato is built for India’s linguistic diversity. The platform currently supports:\n\n• English\n• தமிழ் (Tamil)\n• More languages are being added regularly to ensure every student can learn in their mother tongue.`,
    },
    {
      title: "💰 Credits System",
      content: `KnowMato uses virtual “Credits” as its internal currency. You can purchase credits via UPI, cards, net banking, or wallets. Credits are consumed when you post doubts, request mentors, enroll in courses, or access premium services.\n\nCredits are non‑transferable and have no cash value outside the platform. Unused credits remain in your wallet. For detailed pricing and refund rules, please see our Credits Policy and Refund & Cancellation Policy.`,
    },
    {
      title: "🌟 Why KnowMato?",
      content: `• Instant access to verified mentors — no scheduling delays.\n• Pay only for what you use — flexible credit packs.\n• Safe, monitored environment with AI & human moderation.\n• Comprehensive learning: doubts + courses + practice + career.\n• Trusted by thousands of students across India.\n• Continuous innovation: AI voice input, Skill Score, and more.`,
    },
    {
      title: "💎 Our Values",
      content: `📘 **Accessibility** – Education should be barrier‑free.\n🛡️ **Safety** – Zero tolerance for abuse or misconduct.\n🤝 **Respect** – Every learner and mentor deserves dignity.\n💡 **Innovation** – We harness technology to simplify learning.\n🏆 **Excellence** – We strive for the highest quality in every interaction.`,
    },
    {
      title: "📞 Contact Information",
      content: `**Jeblio Corporation Private Limited**\n\n📧 Email: support@knowmato.in\n🌐 Website: https://www.knowmato.in\n📍 Registered Office: [Address available on request]\n🕘 Business Hours: Monday – Saturday, 09:00 AM – 06:00 PM (IST)\n\nFor legal notices, please refer to the Terms & Conditions.`,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e] relative overflow-hidden">
      {/* Animated blobs */}
      <div className="absolute top-0 -left-20 w-72 h-72 bg-purple-500/20 rounded-full mix-blend-multiply filter blur-3xl animate-blob" />
      <div className="absolute top-0 -right-20 w-72 h-72 bg-fuchsia-500/20 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000" />
      <div className="absolute -bottom-20 left-40 w-72 h-72 bg-cyan-500/20 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000" />

      <div className="relative z-10 max-w-3xl mx-auto px-4 py-10 sm:px-6 lg:px-8">
        {/* Back button (optional) */}
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
          ℹ️ About KnowMato
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

        {/* Footer note */}
        <p className="mt-8 text-center text-xs text-white/30">
          © {new Date().getFullYear()} Jeblio Corporation Private Limited. All rights reserved.
        </p>
      </div>
    </div>
  );
}