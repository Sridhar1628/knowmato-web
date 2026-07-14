// app/student/mentor-guidelines/page.tsx
"use client";

import { useRouter } from "next/navigation";

export default function MentorGuidelinesPage() {
  const router = useRouter();

  const sections = [
    {
      title: "🧑‍🏫 Becoming a Mentor",
      content:
        "To become a KnowMato mentor, you must apply through the official process (via the app or website). You need to provide your educational qualifications, skills, experience, and identity documents. Mentors are subject to verification before their profile goes live. KnowMato reserves the right to accept or reject any application.",
    },
    {
      title: "✅ Verification",
      content:
        "All mentors undergo identity and qualification verification. You may be asked to submit: government ID, degree certificates, experience letters, or live video verification. Providing false documents leads to immediate rejection and possible legal action. Verified mentors receive a 'Verified' badge on their profile.",
    },
    {
      title: "📋 Profile",
      content:
        "Keep your profile complete and accurate. Include: clear display name, professional photo (optional but recommended), detailed skills list, language proficiency, years of experience, and a brief bio. A high-quality profile increases your chances of being selected by students.",
    },
    {
      title: "🤝 Accepting Doubts",
      content:
        "You can browse the Doubt Pool and accept doubts that match your expertise. Do not accept doubts you cannot solve. Accept only if you can provide quality guidance in a timely manner. Repeatedly accepting and then abandoning doubts harms your reliability score.",
    },
    {
      title: "🟢 Online / Offline Status",
      content:
        "Set your availability accurately. When online, you may receive doubt requests. Going offline while a session is active is considered a cancellation unless due to a genuine technical issue. If you're unavailable for extended periods, set your status to offline.",
    },
    {
      title: "👤 Individual Requests",
      content:
        "Students may send you direct doubt requests. You can accept or decline. Declining frequently is fine, but avoid ignoring requests. If you accept, commit to providing quality help. Your responsiveness influences your visibility in search results.",
    },
    {
      title: "🎯 Session Quality",
      content:
        "Provide clear, step‑by‑step explanations. Adapt your teaching style to the student's level. Use whiteboard, code sharing, or screen sharing tools when helpful. Do not rush sessions to earn more credits. Focus on concept clarity, not just answers.",
    },
    {
      title: "🤝 Professional Behaviour",
      content:
        "Treat every student with respect and patience. Do not use abusive language, sarcasm, or make students feel inferior. Maintain a supportive and encouraging tone. Avoid discussing personal or unrelated topics during sessions.",
    },
    {
      title: "⭐ Ratings & Reviews",
      content:
        "Students rate sessions. High ratings improve your visibility and earning potential. Low ratings due to poor quality may reduce your chance of receiving new doubts. Do not ask students to give you high ratings or coerce them. If you receive an unfair rating, contact support.",
    },
    {
      title: "📊 Reliability Score",
      content:
        "Your reliability score is based on: response time, cancellation rate, session completion rate, and student ratings. A low score may result in fewer doubt assignments or temporary suspension. You can improve your score by consistently delivering quality sessions and avoiding cancellations.",
    },
    {
      title: "💰 Earnings",
      content:
        "Mentors earn credits or monetary compensation as per the agreed terms. Earnings are calculated per session or per doubt. KnowMato deducts a platform commission as communicated. Earnings are reflected in your mentor wallet.",
    },
    {
      title: "🏦 Withdrawals",
      content:
        "You can withdraw your earnings after reaching a minimum threshold (e.g., ₹500). Withdrawals are processed within 3–7 business days to your registered bank account or UPI ID. Ensure your payout details are correct. Any tax liability is the mentor's responsibility.",
    },
    {
      title: "❌ Cancellation",
      content:
        "Avoid cancelling accepted sessions. If you must cancel, do so immediately with a valid reason. Frequent cancellations reduce your reliability score and may lead to fewer doubt assignments. If a student cancels, you will be notified. If KnowMato cancels due to platform issues, it will not affect your score.",
    },
    {
      title: "🚨 Reporting Students",
      content:
        "If a student behaves inappropriately, shares personal contact details, or violates guidelines, report them immediately via the session screen or support. Do not engage in arguments. Your report helps maintain platform safety.",
    },
    {
      title: "©️ Copyright",
      content:
        "Do not upload copyrighted materials (e.g., scanned books, pirated software) unless you own the rights. Respect intellectual property. Violations can lead to content removal and account suspension. If you believe your content has been misused, file a complaint.",
    },
    {
      title: "🚫 Suspension",
      content:
        "KnowMato may suspend or permanently ban mentors for: fraud, fake credentials, misconduct, harassment, sharing personal contact details, demanding external payments, or repeated cancellations. Serious offences (e.g., sexual harassment) result in immediate termination and possible reporting to authorities.",
    },
    {
      title: "📨 Appeals",
      content:
        "If you believe your account was suspended or terminated in error, you can appeal by contacting support@knowmato.in. Provide relevant evidence and details. KnowMato reviews appeals on a case‑by‑case basis. Decisions are final, but we strive to be fair.",
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
          👨‍🏫 Mentor Guidelines
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