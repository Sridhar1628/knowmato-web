// app/student/student-guidelines/page.tsx
"use client";

import { useRouter } from "next/navigation";

export default function StudentGuidelinesPage() {
  const router = useRouter();

  const sections = [
    {
      title: "📝 Creating an Account",
      content:
        "Create only one account per person. Use your real name and accurate information. Fake, duplicate, or impersonating accounts will be suspended. Students under 18 must have parental or guardian consent. Keep your login credentials secure and never share them.",
    },
    {
      title: "❓ Posting Doubts",
      content:
        "Doubts must be genuine educational questions. Provide a clear title, detailed description, relevant category, and any supporting images or documents. Vague or off‑topic posts may be rejected. You can post via text, voice, or image upload. Ensure content is appropriate and non‑offensive.",
    },
    {
      title: "🎯 Doubt Pool",
      content:
        "When you post a doubt in the Doubt Pool, it becomes visible to eligible mentors. Credits are deducted upon posting. A mentor may accept your doubt; you can then start a live session. You may cancel within 5 minutes of matching for a partial refund (platform fee applies).",
    },
    {
      title: "👤 Individual Requests",
      content:
        "You can directly request a specific mentor. Credits are higher for individual requests. The mentor must accept before a session begins. Respect their availability — if they decline or are offline, choose another mentor or use the Doubt Pool.",
    },
    {
      title: "💰 Credits",
      content:
        "Credits are required for posting doubts and accessing premium services. Purchase credits via UPI, cards, or wallets. Promotional credits may have expiry dates. Credits are non‑transferable and cannot be sold. Misuse (e.g., exploiting referral systems) leads to forfeiture.",
    },
    {
      title: "↩️ Refunds",
      content:
        "Refer to the Refund & Cancellation Policy for full details. In brief: cancel within 5 minutes of matching for a partial refund; full refund if the mentor cancels or KnowMato cancels due to technical issues. Completed sessions are non‑refundable.",
    },
    {
      title: "🎥 Session Behaviour",
      content:
        "During live chat, audio, or video sessions: be respectful and stay on topic. Do not share personal contact information (phone, WhatsApp, email, social IDs). Do not record sessions without explicit consent. Harassment, abuse, or inappropriate behaviour will result in immediate action.",
    },
    {
      title: "⭐ Ratings & Reviews",
      content:
        "After a session, you can rate the mentor and leave feedback. Be honest and constructive. False or malicious ratings are against policy. Your ratings help maintain quality and influence mentor visibility. You cannot edit ratings after submission; contact support for genuine errors.",
    },
    {
      title: "💬 Discussion Forum",
      content:
        "Use the forum to ask questions, share knowledge, and help peers. Follow Community Guidelines: no spam, hate speech, contact sharing, or promotions. Stay on educational topics. Moderators may remove inappropriate posts. Repeated violations can lead to forum access being revoked.",
    },
    {
      title: "📚 Courses & Learning",
      content:
        "Enrol in courses using credits. Watch lectures, complete quizzes, and do assignments. Progress is tracked. Do not share course materials outside the platform. Cheating on assessments (plagiarism, copying) is prohibited. Course access may expire based on the plan.",
    },
    {
      title: "📝 Tests & Assessments",
      content:
        "Take assessments honestly. Do not use unauthorised aids or impersonate others. Results contribute to your Skill Score. Attempting to cheat or exploit assessment flows may result in score nullification and account restriction.",
    },
    {
      title: "📊 Skill Score",
      content:
        "Your Skill Score is an internal metric based on assessments, course completions, and platform activity. It is not a formal certificate but helps match you with relevant mentors and opportunities. Provide accurate skills to maintain a true reflection.",
    },
    {
      title: "📰 Current Affairs",
      content:
        "Read daily current affairs to stay updated. Use the information for your own knowledge. Do not misuse the comment section (if any) for political or religious debates. Respect others' viewpoints. Content is curated; factual errors can be reported.",
    },
    {
      title: "🚨 Reporting Mentors",
      content:
        "If a mentor behaves inappropriately, violates guidelines, or asks for external contact/payment, report them immediately via the session screen or support@knowmato.in. Provide evidence if possible. Knowingly false reports may be considered a violation.",
    },
    {
      title: "⛔ Prohibited Activities",
      content:
        "As a student, you must NOT:\n\n" +
        "• Share personal contact details\n" +
        "• Request or make payments outside KnowMato\n" +
        "• Promote external coaching or platforms\n" +
        "• Upload copyrighted or illegal content\n" +
        "• Harass, bully, or discriminate against anyone\n" +
        "• Use abusive language or hate speech\n" +
        "• Create multiple fake accounts\n" +
        "• Attempt to defraud the credit system\n\n" +
        "Violations will be met with consequences up to permanent termination.",
    },
    {
      title: "🔒 Account Suspension",
      content:
        "Serious or repeated violations can lead to suspension or permanent ban. KnowMato may issue a warning first, but gross misconduct (e.g., fraud, harassment) may result in immediate termination. You can appeal by contacting support. During suspension, access to credits and services is restricted.",
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
          👨‍🎓 Student Guidelines
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