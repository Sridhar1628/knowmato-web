// app/student/about-knowmato/page.tsx
"use client";

import { useTranslation } from "react-i18next";
import { useRouter } from "next/navigation";

export default function AboutKnowMatoPage() {
  const { t } = useTranslation();
  const router = useRouter();

  // Section keys – keep this list stable
  const sectionKeys = [
    "welcome",
    "aboutJeblio",
    "vision",
    "mission",
    "whatIsKnowmato",
    "whatIsKnowmatoPlus",
    "platformFeatures",
    "supportedLanguages",
    "creditsSystem",
    "whyKnowmato",
    "ourValues",
    "contactInformation",
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
          {t("common.goBack")}
        </button>

        <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-violet-300 via-fuchsia-300 to-cyan-300 mb-8">
          {t("aboutKnowmato.pageTitle")}
        </h1>

        <div className="space-y-6">
          {sectionKeys.map((key) => (
            <div
              key={key}
              className="rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 p-6 shadow-2xl hover:border-violet-400/40 transition-all"
            >
              <h2 className="text-xl font-bold text-white mb-3">
                {t(`aboutKnowmato.sections.${key}.title`)}
              </h2>
              <div className="text-white/80 whitespace-pre-line leading-relaxed text-sm sm:text-base">
                {t(`aboutKnowmato.sections.${key}.content`)}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <p className="mt-8 text-center text-xs text-white/30">
          © {new Date().getFullYear()} {t("common.copyright")}
        </p>
      </div>
    </div>
  );
}