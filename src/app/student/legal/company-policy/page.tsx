// app/student/company-policy/page.tsx
"use client";

import { useRouter } from "next/navigation";

export default function CompanyRecruiterPolicyPage() {
  const router = useRouter();

  const sections = [
    {
      title: "🏢 Company Registration",
      content:
        "Companies and recruiters can register on KnowMato to post jobs, internships, and search for candidates. Registration requires accurate company information, including legal name, registration number, GST/PAN (if applicable), and contact details. KnowMato may verify this information before activating the employer account. Providing false or misleading information may result in immediate removal.",
    },
    {
      title: "📢 Posting Jobs",
      content:
        "Employers can publish full‑time, part‑time, contract, and remote job listings. All job postings must accurately reflect the role, required skills, experience level, location, and salary range. Fake or misleading job descriptions are strictly prohibited. KnowMato reserves the right to remove any job listing that violates these policies without prior notice.",
    },
    {
      title: "🎓 Posting Internships",
      content:
        "Internships posted on KnowMato must provide real learning opportunities. Include internship type (full‑time, part‑time, remote, hybrid), duration, stipend, and expected skills. Unpaid internships must be clearly labelled and comply with applicable laws. PPO (Pre‑Placement Offer) details, if any, should be mentioned upfront.",
    },
    {
      title: "🔍 Candidate Search",
      content:
        "Employers can search for candidates based on skills, Skill Scores, and profile information. Use the search tools responsibly. Do not misuse candidate data or contact candidates for purposes unrelated to recruitment. Bulk messaging, scraping, or automated harvesting of candidate data is forbidden.",
    },
    {
      title: "📊 Skill Score",
      content:
        "The Skill Score is an internal metric that helps assess a candidate's platform‑based learning performance. It can be used as one factor in recruitment decisions but does not represent formal certification. Employers should not rely solely on the Skill Score when making hiring decisions.",
    },
    {
      title: "🤝 Fair Recruitment",
      content:
        "KnowMato expects all employers to follow fair recruitment practices. Do not discriminate based on race, religion, caste, gender, age, disability, or any other protected characteristic. Job listings and candidate evaluations must be based on merit and relevant qualifications.",
    },
    {
      title: "🚫 No Fraud",
      content:
        "Fraudulent activities are strictly forbidden. This includes:\n\n" +
        "• Posting non‑existent jobs or internships\n" +
        "• Misrepresenting salary, benefits, or role responsibilities\n" +
        "• Impersonating a legitimate company or recruiter\n" +
        "• Phishing for personal or financial information\n" +
        "• Running any form of employment scam\n\n" +
        "Fraudulent accounts will be permanently banned and may be reported to law enforcement.",
    },
    {
      title: "💸 No Fees from Candidates",
      content:
        "Companies and recruiters are prohibited from charging candidates any fees for recruitment, application processing, training deposits, or job guarantees through the platform. If any fee is legally required (e.g., a professional certification fee), it must be clearly disclosed in the job description and must not be a condition for application.",
    },
    {
      title: "🔒 Data Usage",
      content:
        "Candidate data (resumes, contact details, profiles) obtained through KnowMato must be used solely for recruitment purposes. Employers must not:\n\n" +
        "• Sell, rent, or share candidate data with third parties\n" +
        "• Use candidate data for marketing or unsolicited offers\n" +
        "• Retain candidate data indefinitely without consent\n\n" +
        "Employers must comply with applicable data protection and privacy laws when handling candidate information.",
    },
    {
      title: "🚨 Reporting Violations",
      content:
        "Employers should report any misuse of their company account or any suspicious activity by candidates or other employers. Conversely, candidates and students can report employers who violate these policies. Reports can be submitted via the app or by emailing support@knowmato.in.",
    },
    {
      title: "🚫 Termination",
      content:
        "KnowMato may suspend or permanently terminate a company's account for:\n\n" +
        "• Repeated policy violations\n" +
        "• Fraudulent job or internship listings\n" +
        "• Charging illegal fees to candidates\n" +
        "• Misusing candidate data\n" +
        "• Discriminatory or unethical recruitment practices\n\n" +
        "Upon termination, all active job listings will be removed, and access to candidate information will be revoked. The company may be restricted from re‑registering.",
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
          🏢 Company / Recruiter Policy
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