// app/student/open-source-licenses/page.tsx
"use client";

import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";

export default function OpenSourceLicensesPage() {
  const { t } = useTranslation();
  const router = useRouter();

  // Fetch the libraries array from translations (with returnObjects: true)
  const libraries = t("openSourceLicenses.libraries", {
    returnObjects: true,
  }) as Array<{
    name: string;
    description: string;
    license: string;
    url: string;
  }>;

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
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          {t("common.goBack")}
        </button>

        <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-violet-300 via-fuchsia-300 to-cyan-300 mb-8">
          📄 {t("openSourceLicenses.pageTitle")}
        </h1>

        <div className="rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 p-6 shadow-2xl">
          <p className="text-white/80 text-sm mb-6 leading-relaxed">
            {t("openSourceLicenses.intro")}
          </p>

          <div className="space-y-4">
            {libraries.map((lib, idx) => (
              <div
                key={idx}
                className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-white/10 pb-4 last:border-0 last:pb-0 gap-2"
              >
                <div className="flex-1">
                  <h3 className="text-white font-semibold">{lib.name}</h3>
                  <p className="text-white/60 text-sm">{lib.description}</p>
                </div>
                <div className="flex-shrink-0">
                  <a
                    href={lib.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-violet-400 hover:text-violet-300 text-sm font-medium underline"
                  >
                    {lib.license}
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="mt-8 text-center text-xs text-white/30">
          {t("common.copyright", { year: new Date().getFullYear() })}
        </p>
      </div>
    </div>
  );
}