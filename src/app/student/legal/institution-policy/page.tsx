// app/student/institution-policy/page.tsx
"use client";

import { useRouter } from "next/navigation";

export default function InstitutionPolicyPage() {
  const router = useRouter();

  const sections = [
    {
      title: "🏫 Institution Registration",
      content:
        "Educational institutions (schools, colleges, coaching centres, universities) can register on KnowMato as an Institution. Registration requires submitting accurate institutional details, including official name, address, contact information, and proof of affiliation (if applicable). KnowMato reserves the right to verify these details before activating the institution account. Providing false information may result in immediate termination.",
    },
    {
      title: "👨‍💼 Admin Accounts",
      content:
        "Every institution account has one or more designated Administrators. Admins are responsible for managing the institution's presence on KnowMato, including:\n\n" +
        "• Adding or removing teacher and student accounts\n" +
        "• Purchasing and distributing institution credits\n" +
        "• Monitoring usage and compliance with platform policies\n" +
        "• Ensuring data accuracy\n\n" +
        "Admins must be authorised representatives of the institution. Compromised admin accounts should be reported immediately to support.",
    },
    {
      title: "🧑‍🏫 Teacher Accounts",
      content:
        "Teachers affiliated with a registered institution can be given dedicated accounts. They may access institution-issued credits, manage course materials, and interact with students on the platform. Teachers must adhere to the same professional conduct standards as individual mentors, including respecting student privacy and not sharing personal contact details.",
    },
    {
      title: "👩‍🎓 Student Accounts",
      content:
        "Institutions can onboard their students to KnowMato in bulk. Student accounts created under an institution may have access to institutional credits, assigned courses, and institution-specific learning paths. Institutions are responsible for ensuring students comply with platform guidelines. Student data remains subject to our Privacy Policy.",
    },
    {
      title: "💰 Institution Credits",
      content:
        "Institutions can purchase credit packs in bulk and distribute them to teachers and students. These credits function the same as regular credits but may have institution‑defined expiry dates or usage restrictions. KnowMato is not responsible for disputes between institutions and their members regarding credit distribution.",
    },
    {
      title: "🛡️ Institution Responsibilities",
      content:
        "Institutions agree to:\n\n" +
        "• Provide accurate and updated institutional information.\n" +
        "• Ensure that all users (admins, teachers, students) follow KnowMato's Terms, Community Guidelines, and applicable policies.\n" +
        "• Protect student data in accordance with applicable educational and privacy laws.\n" +
        "• Not misuse the platform for non‑educational purposes, promotional activities, or competitive intelligence.\n" +
        "• Report any policy violations by their users to KnowMato.",
    },
    {
      title: "🔒 Data Privacy",
      content:
        "Institutions must respect the privacy of all users. They shall not collect, store, or process personal data of students or teachers obtained through KnowMato for purposes beyond educational engagement without explicit consent and compliance with applicable data protection laws. KnowMato processes institutional data as described in our Privacy Policy.",
    },
    {
      title: "🚨 Reporting Violations",
      content:
        "Institutions should promptly report any violations of platform policies by their members or other users. Use the in‑app reporting tools or contact support@knowmato.in. KnowMato may investigate and take action, including suspension of individual accounts or the institution itself, if violations are substantiated.",
    },
    {
      title: "🚫 Termination",
      content:
        "An institution's account may be suspended or terminated for:\n\n" +
        "• Providing false information during registration.\n" +
        "• Repeated or serious policy violations by the institution or its members.\n" +
        "• Misuse of platform resources or credits.\n" +
        "• Any activity that harms the safety or integrity of the platform.\n\n" +
        "Upon termination, institutional credits may be forfeited, and access to associated accounts may be restricted. Institutions can contact support to discuss reinstatement.",
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
          🏫 Institution Policy
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