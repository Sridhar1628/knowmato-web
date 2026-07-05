'use client';
import { useTranslation } from 'react-i18next';
export default function InternshipsPage() {
  const { t } = useTranslation();
  return (
    <div className="p-6 text-white">
      <h1 className="text-2xl font-bold">{t('knowmatoPlus.internships') || 'Internships'}</h1>
      <p className="mt-4 text-white/70">Find internship opportunities here.</p>
    </div>
  );
}