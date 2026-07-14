// app/student/privacy-policy/page.tsx
"use client";

import { useRouter } from "next/navigation";

export default function PrivacyPolicyPage() {
  const router = useRouter();

  const sections = [
    {
      title: "Introduction",
      content:
        "This Privacy Policy explains how Jeblio Corporation Private Limited (“KnowMato”, “we”, “our”, or “us”) collects, uses, discloses, and protects your personal information when you access the KnowMato platform (website, mobile app, APIs, and services).\n\n" +
        "By using KnowMato, you consent to the practices described in this policy. If you do not agree, please discontinue use of the platform.",
    },
    {
      title: "Information We Collect",
      content:
        "We collect information to provide, improve, and secure our services. The categories of data we collect fall into two groups: information you provide directly, and information collected automatically.",
    },
    {
      title: "Information You Provide",
      content:
        "When you create an account, post a doubt, apply to a job/internship, communicate with mentors, or otherwise interact with the platform, we may collect:\n\n" +
        "• **Account Data** – Name, email address, phone number, profile picture, educational background, skills, and role (student, mentor, institution, etc.).\n" +
        "• **Content Data** – Text, images, voice inputs, documents, and videos you upload or share.\n" +
        "• **Communication Data** – Messages, session recordings (if applicable), feedback, and support tickets.\n" +
        "• **Payment Data** – Transaction records, billing address, and partial payment method details (we do not store full card numbers).\n" +
        "• **Application Data** – For companies: registration number, GST, PAN, address; for students: resumes, cover letters.",
    },
    {
      title: "Automatically Collected Data",
      content:
        "When you use the platform, we automatically collect certain information, including:\n\n" +
        "• **Device Information** – Device type, operating system, browser type, IP address, and unique device identifiers.\n" +
        "• **Usage Data** – Pages visited, features used, session duration, clicks, and navigation patterns.\n" +
        "• **Log Data** – Timestamps, error logs, crash reports, and performance data.\n" +
        "• **Location Data** – Approximate location derived from IP address; precise location only if you grant permission.\n" +
        "• **Cookies & Similar Technologies** – Used on our website for authentication, preferences, analytics, and security.",
    },
    {
      title: "Permissions Used",
      content:
        "Our mobile app requests specific device permissions to enable core features. You can control these permissions in your device settings.",
    },
    {
      title: "Camera",
      content:
        "Used to capture images for doubt posting, scanning documents, and during live video sessions. The camera is only activated with your explicit action and can be revoked anytime.",
    },
    {
      title: "Microphone",
      content:
        "Used for voice-based doubt posting (voice-to-text), AI voice assistant, and live audio/video sessions. Recordings are processed securely and never stored without notification.",
    },
    {
      title: "Location",
      content:
        "Approximate location may be derived from your IP to improve content relevance (e.g., language, local news). Precise GPS location is only accessed if you enable location-based features (e.g., job filtering) and can be turned off.",
    },
    {
      title: "Storage",
      content:
        "Access to device storage is required to upload images, PDFs, or resumes from your gallery/file manager. We only access files you select.",
    },
    {
      title: "Notifications",
      content:
        "We use push notifications to alert you about session invites, mentor responses, job updates, and platform announcements. You can disable notifications in your device settings.",
    },
    {
      title: "Device Information",
      content:
        "We collect device model, OS version, and network type to optimize performance, troubleshoot issues, and ensure compatibility.",
    },
    {
      title: "Cookies (Website)",
      content:
        "Our website uses cookies and similar technologies for authentication, remembering language preferences, analytics, and security. You can manage cookie preferences through your browser settings. Disabling cookies may affect functionality.",
    },
    {
      title: "How We Use Information",
      content:
        "We use collected data to:\n\n" +
        "• Provide, maintain, and improve the platform.\n" +
        "• Process transactions (credit purchases, subscriptions).\n" +
        "• Match students with mentors based on skills and availability.\n" +
        "• Facilitate communication and live sessions.\n" +
        "• Personalize content (language, recommended mentors, courses).\n" +
        "• Monitor for policy violations, spam, and fraud.\n" +
        "• Send service updates, security alerts, and support messages.\n" +
        "• Comply with legal obligations and enforce our Terms.\n" +
        "• Conduct research and analytics to enhance user experience.",
    },
    {
      title: "AI Processing",
      content:
        "KnowMato uses artificial intelligence to improve the platform, including:\n\n" +
        "• **Voice-to-Text** – Your voice input is transcribed to create doubt posts.\n" +
        "• **Smart Recommendations** – AI suggests mentors, courses, and content based on your activity.\n" +
        "• **Moderation** – Automated systems detect spam, abusive language, and contact sharing.\n" +
        "• **Voice Assistant** – Interactions are processed to provide relevant assistance.\n\n" +
        "AI processing is done in compliance with this Privacy Policy. Unless explicitly stated, AI-generated responses are not a substitute for human mentors. You remain responsible for verifying AI‑assisted information.",
    },
    {
      title: "Data Sharing",
      content:
        "We do not sell your personal information. We share data only in the following circumstances:\n\n" +
        "• **With your consent** – E.g., applying for a job directly shares your resume with the company.\n" +
        "• **Service Providers** – Trusted third parties who assist us (cloud hosting, payment gateways, analytics, notification services) and are bound by confidentiality.\n" +
        "• **Legal Obligations** – When required by law, court order, or to protect rights/safety.\n" +
        "• **Business Transfers** – In the event of a merger, acquisition, or asset sale, user data may be transferred with prior notice.\n\n" +
        "When you interact with mentors, institutions, or companies, those parties may see your profile information necessary for the interaction (e.g., your name, skills, and doubt content).",
    },
    {
      title: "Third Parties",
      content:
        "Our platform may integrate with third‑party services (payment gateways, video conferencing, AI providers). These services have their own privacy policies, and we recommend reviewing them. KnowMato is not responsible for the practices of third‑party services once you leave our platform.",
    },
    {
      title: "Security",
      content:
        "We implement industry‑standard security measures (encryption, firewalls, access controls) to protect your data. However, no online service is completely secure. You should also protect your account credentials and avoid sharing sensitive personal information during sessions.",
    },
    {
      title: "Data Retention",
      content:
        "We retain personal information for as long as necessary to provide services, resolve disputes, comply with legal obligations, and enforce our Terms. Even after account closure, we may retain certain data for legitimate business or legal reasons (e.g., transaction logs, moderation records).",
    },
    {
      title: "Account Deletion",
      content:
        "You can request account deletion via the app or by contacting support. Upon verification, we will delete or anonymize your personal data, subject to any retention requirements. Please note that deletion may remove access to purchased credits, course progress, and learning history.",
    },
    {
      title: "Children's Privacy",
      content:
        "KnowMato is intended for users 13 years and older. We do not knowingly collect personal information from children under 13 without parental consent. If you are a parent and believe your child has provided us with personal data, contact us immediately so we can delete it.",
    },
    {
      title: "Your Rights",
      content:
        "Depending on your jurisdiction, you may have rights to:\n\n" +
        "• Access and obtain a copy of your data.\n" +
        "• Rectify inaccurate or incomplete information.\n" +
        "• Request deletion of your data.\n" +
        "• Restrict or object to certain processing.\n" +
        "• Data portability.\n" +
        "• Withdraw consent at any time (does not affect prior lawful processing).\n\n" +
        "To exercise these rights, contact us at support@knowmato.in. We will respond within a reasonable timeframe.",
    },
    {
      title: "Contact",
      content:
        "For privacy‑related questions, requests, or complaints, please contact us at:\n\n" +
        "**Jeblio Corporation Private Limited**\n" +
        "📧 Email: support@knowmato.in\n" +
        "🌐 Website: https://www.knowmato.in\n" +
        "📍 Registered Office: [Address available on request]\n" +
        "🕘 Business Hours: Monday – Saturday, 09:00 AM – 06:00 PM (IST)",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e] relative overflow-hidden">
      {/* Animated background blobs */}
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
          🔒 Privacy Policy
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