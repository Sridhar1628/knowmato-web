// app/student/ai-usage-policy/page.tsx
"use client";

import { useRouter } from "next/navigation";

export default function AIUsagePolicyPage() {
  const router = useRouter();

  const sections = [
    {
      title: "🤖 KnowMato AI",
      content:
        "KnowMato integrates artificial intelligence to enhance the learning experience, improve platform safety, and provide intelligent assistance. AI is not a replacement for human mentors but a tool to make education faster, more accessible, and more personalised. This policy explains how AI is used, what data it processes, and your rights regarding AI‑powered features.",
    },
    {
      title: "🎙️ Voice Assistant",
      content:
        "The KnowMato Voice Assistant allows you to interact with the platform using natural language. You can post doubts, search for mentors, or get course recommendations by speaking. Voice input is transcribed into text using AI speech‑to‑text models. The transcribed text is then processed to understand your intent and provide appropriate responses. Voice recordings are processed in real time and are not stored permanently unless required for quality improvement or safety review.",
    },
    {
      title: "🛡️ AI Monitoring",
      content:
        "To maintain a safe and respectful environment, KnowMato uses AI to monitor platform interactions, including:\n\n" +
        "• Detection of spam, fraud, and scam patterns\n" +
        "• Identification of abusive language, hate speech, or harassment\n" +
        "• Detection of personal contact details (phone, email, social IDs) shared in chats\n" +
        "• Prevention of external platform promotion\n\n" +
        "AI monitoring runs automatically in the background. Content flagged as high‑risk may be reviewed by our Trust & Safety team.",
    },
    {
      title: "🧹 AI Moderation",
      content:
        "AI moderation works alongside human moderators to enforce Community Guidelines and Terms & Conditions. It can:\n\n" +
        "• Temporarily hide or blur flagged messages\n" +
        "• Prevent posting of prohibited content\n" +
        "• Automatically suspend accounts showing clear patterns of malicious behaviour\n\n" +
        "Automated decisions that significantly affect your account (e.g., suspension) are subject to human review upon appeal. Minor automated actions (e.g., hiding a spammy post) may not require human intervention.",
    },
    {
      title: "🎯 AI Recommendations",
      content:
        "KnowMato uses AI to personalise your experience by analysing your activity, skills, interests, and past interactions. This includes:\n\n" +
        "• Recommending mentors who match your subject and language preferences\n" +
        "• Suggesting relevant courses, assessments, and learning paths\n" +
        "• Highlighting current affairs and discussion topics you may find useful\n" +
        "• Recommending internship/job listings based on your profile\n\n" +
        "Recommendation algorithms are designed to improve your learning outcomes and do not use sensitive personal attributes in a discriminatory manner.",
    },
    {
      title: "👁️ Human Review",
      content:
        "Certain AI‑processed data may be reviewed by authorised KnowMato personnel to:\n\n" +
        "• Improve AI accuracy and reduce false positives\n" +
        "• Investigate serious safety concerns or policy violations\n" +
        "• Handle appeals against automated decisions\n\n" +
        "All human reviews are conducted in accordance with our Privacy Policy and confidentiality commitments.",
    },
    {
      title: "🔄 Data Processing",
      content:
        "AI features process the following types of data:\n\n" +
        "• **Voice Input** – Converted to text; raw audio is not retained long‑term.\n" +
        "• **Text Content** – Doubts, chat messages, forum posts are analysed for moderation and recommendations.\n" +
        "• **Behavioural Signals** – Clicks, session duration, and feature usage inform personalisation.\n" +
        "• **Profile Data** – Skills, interests, language preferences used for matching.\n\n" +
        "Data used for AI is handled according to our Privacy Policy and is not shared with third parties for external AI training.",
    },
    {
      title: "⚠️ Limitations",
      content:
        "AI systems are not perfect. You should be aware of the following:\n\n" +
        "• Voice transcription may have errors, especially with accents or background noise.\n" +
        "• Automated moderation may occasionally flag legitimate content.\n" +
        "• AI‑generated responses (e.g., assistant answers) are for informational purposes and may not always be accurate.\n" +
        "• AI does not replace professional mentors, counsellors, or career advisors.\n\n" +
        "Always use your judgment, especially when acting on AI‑generated information. When in doubt, consult a human mentor.",
    },
    {
      title: "🔍 Transparency",
      content:
        "We are committed to transparency in AI usage:\n\n" +
        "• AI‑powered features are labelled as such within the platform.\n" +
        "• Automated decisions that materially affect your experience will be communicated to you.\n" +
        "• This policy will be updated whenever we introduce new AI capabilities.\n\n" +
        "If you have questions about how a specific AI feature works, you can contact us at support@knowmato.in.",
    },
    {
      title: "✅ User Responsibilities",
      content:
        "While using AI‑powered features, you agree to:\n\n" +
        "• Not attempt to manipulate or deceive AI systems (e.g., jailbreaking, injecting harmful prompts).\n" +
        "• Not use AI features to generate spam, abusive content, or disinformation.\n" +
        "• Respect the limitations of AI and verify critical information from trusted sources.\n" +
        "• Report unexpected or harmful AI behaviour through the in‑app reporting tool.\n\n" +
        "Misuse of AI features may result in restricted access or account suspension.",
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
          🤖 AI Usage Policy
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