'use client';

import { useTranslation } from 'react-i18next';

export default function KnowmatoPlusCoursesPage() {
  const { t } = useTranslation();

  return (
    <div className="p-6 text-white">
      <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-violet-300 via-fuchsia-300 to-cyan-300">
        {t('knowmatoPlus.courses') || 'Courses'}
      </h1>
      <p className="mt-4 text-white/70">
        {t('knowmatoPlus.enableDescription') || 'Premium courses coming soon...'}
      </p>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-6 shadow-2xl"
          >
            <div className="h-32 rounded-lg bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20" />
            <h3 className="mt-4 font-bold text-white">Course {i}</h3>
            <p className="mt-1 text-sm text-white/50">Learn something new</p>
            <button className="mt-4 rounded-lg bg-gradient-to-r from-violet-500 to-fuchsia-500 px-4 py-2 text-sm font-bold text-white">
              {t('common.enroll') || 'Enroll'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}