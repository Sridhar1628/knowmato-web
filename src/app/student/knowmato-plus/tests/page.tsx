'use client';

import { useTranslation } from 'react-i18next';
import CodeCompiler from '@/components/CodeCompiler';

export default function TestsPage() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e] p-6 text-white">
      <div className="mx-auto max-w-5xl">
        <h1 className="text-2xl font-bold mb-6">
          {t('knowmatoPlus.tests') || 'Tests'}
        </h1>
        <p className="text-white/70 mb-8">
          Practice coding problems and run your solutions below.
        </p>

        <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-6 shadow-lg">
          <CodeCompiler />
        </div>
      </div>
    </div>
  );
}