// app/student/community-guidelines/page.tsx
"use client";

import { useRouter } from "next/navigation";

export default function CommunityGuidelinesPage() {
  const router = useRouter();

  const sections = [
    {
      title: "🤝 Respect Others",
      content:
        "KnowMato is built on mutual respect. Every user — whether a student, mentor, institution, or recruiter — deserves to be treated with dignity. Always communicate politely, even when you disagree. Constructive feedback is welcome; personal attacks are not.",
    },
    {
      title: "🚫 Harassment",
      content:
        "Harassment of any kind is strictly prohibited. This includes, but is not limited to:\n\n" +
        "• Bullying or intimidation\n" +
        "• Unwanted contact or stalking\n" +
        "• Repeatedly messaging someone after being asked to stop\n" +
        "• Using insults, threats, or derogatory language\n" +
        "• Sexual harassment in any form\n\n" +
        "Harassment reports are taken seriously and may lead to immediate suspension.",
    },
    {
      title: "🛑 Hate Speech",
      content:
        "We do not tolerate hate speech or content that attacks or degrades individuals or groups based on:\n\n" +
        "• Race, ethnicity, or national origin\n" +
        "• Religion or belief system\n" +
        "• Gender, gender identity, or sexual orientation\n" +
        "• Caste, disability, or medical condition\n" +
        "• Age or socioeconomic status\n\n" +
        "Hate speech includes slurs, symbols, and any content intended to incite hatred or violence.",
    },
    {
      title: "📢 Spam",
      content:
        "Spam includes, but is not limited to:\n\n" +
        "• Repeatedly posting the same or similar content\n" +
        "• Unsolicited mass messaging\n" +
        "• Advertising external products or services without permission\n" +
        "• Flooding discussions with irrelevant messages\n" +
        "• Posting links to phishing sites or malware\n\n" +
        "Spam degrades the experience for everyone and will be removed. Repeat offenders may lose access to the platform.",
    },
    {
      title: "⚠️ Scams",
      content:
        "Do not engage in or promote any scam or fraudulent activity, including:\n\n" +
        "• Phishing attempts\n" +
        "• Fake job/internship offers\n" +
        "• Pyramid or multi‑level marketing schemes\n" +
        "• Requests for money, OTPs, passwords, or sensitive data\n" +
        "• Impersonation of mentors, staff, or other users\n\n" +
        "If you encounter a scam, report it immediately. We will block the user and, if necessary, involve law enforcement.",
    },
    {
      title: "📵 External Promotions",
      content:
        "Users are not allowed to promote external platforms, businesses, tuition services, coaching centres, or competing products within KnowMato. This includes:\n\n" +
        "• Sharing links to other learning platforms\n" +
        "• Advertising personal coaching or classes\n" +
        "• Recruiting for external groups or channels\n\n" +
        "KnowMato is a self‑contained learning ecosystem. Keep all educational interactions inside the platform.",
    },
    {
      title: "🔒 Sharing Contact Details",
      content:
        "To protect your privacy and safety, never share personal contact information with other users. Prohibited information includes:\n\n" +
        "• Phone numbers\n" +
        "• WhatsApp numbers\n" +
        "• Telegram IDs\n" +
        "• Email addresses\n" +
        "• Social media handles (Instagram, Facebook, etc.)\n" +
        "• Physical addresses\n\n" +
        "This rule applies to chat, doubt posts, discussion forum, and live sessions. If someone asks for your contact details, please report them.",
    },
    {
      title: "©️ Copyright",
      content:
        "Respect intellectual property rights. You may only upload content you own or have permission to use. Do not post:\n\n" +
        "• Copyrighted books, notes, or videos without authorization\n" +
        "• Software, games, or media you did not create\n" +
        "• Plagiarized assignments or answers\n\n" +
        "If you believe your work has been used without permission, you can file a copyright complaint by contacting support.",
    },
    {
      title: "🚨 Fake Information",
      content:
        "Misrepresenting your identity, qualifications, or affiliation is forbidden. This includes:\n\n" +
        "• Creating fake accounts (students or mentors)\n" +
        "• Posting false company or institution profiles\n" +
        "• Lying about credentials or experience\n" +
        "• Providing misleading information during applications\n\n" +
        "Fake information harms trust and safety. Accounts found in violation may be permanently terminated.",
    },
    {
      title: "💬 Discussion Forum Rules",
      content:
        "The Discussion Forum is a space for collaborative learning. Follow these rules:\n\n" +
        "• Ask educational, career, or technology‑related questions\n" +
        "• Provide helpful, accurate answers\n" +
        "• Keep conversations civil and on‑topic\n" +
        "• Do not post political or religious debates\n" +
        "• Do not share personal contact information\n" +
        "• Do not advertise products or services\n\n" +
        "We reserve the right to remove any post that violates these guidelines.",
    },
    {
      title: "🎥 Live Session Rules",
      content:
        "Live chat, audio, and video sessions are for learning only. During a live session:\n\n" +
        "• Use respectful language at all times\n" +
        "• Do not record the session without consent\n" +
        "• Do not share your screen inappropriately\n" +
        "• Do not share personal contact details\n" +
        "• Do not engage in any form of harassment\n\n" +
        "Mentors must maintain professional boundaries. Students should never feel pressured to share personal information or continue communication outside the platform.",
    },
    {
      title: "🚨 Reporting Users",
      content:
        "If you witness a violation, please report it:\n\n" +
        "• Use the Report button inside chats, doubt threads, or profiles\n" +
        "• Provide as much detail as possible\n" +
        "• You can also email support@knowmato.in\n\n" +
        "KnowMato reviews all reports and takes appropriate action, which may include a warning, temporary restriction, or permanent ban. Your identity remains confidential during the investigation.",
    },
    {
      title: "📛 Consequences",
      content:
        "Violating these Community Guidelines can lead to:\n\n" +
        "• **Warning** – First‑time minor violation\n" +
        "• **Temporary Restriction** – Limited access for a set period\n" +
        "• **Temporary Suspension** – Full account suspension for repeat offences\n" +
        "• **Permanent Termination** – Immediate ban for severe violations (harassment, scams, hate speech)\n\n" +
        "In extreme cases, we may also report illegal activities to law enforcement. We reserve the right to take action at our discretion to protect the community.",
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
          🛡 Community Guidelines
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