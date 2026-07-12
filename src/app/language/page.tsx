'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { saveLanguage, AppLanguage } from '@/services/languageService';
import { useTranslation } from 'react-i18next';

export default function LanguageSelectionPage() {
  const router = useRouter();
  const { i18n } = useTranslation();

  const [loading, setLoading] = useState(false);

  const handleSelectLanguage = async (language: AppLanguage) => {
    setLoading(true);

    try {
      saveLanguage(language);

      await i18n.changeLanguage(language);

      router.replace('/');
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e] flex items-center justify-center px-6">

      <motion.div
        initial={{ opacity: 0, y: 25 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: .5 }}
        className="w-full max-w-md rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-8 shadow-2xl"
      >

        <div className="text-center">

          <div className="text-7xl mb-6">
            🌍
          </div>

          <h1 className="text-4xl font-bold text-white">
            Choose Your Language
          </h1>

          <p className="mt-3 text-white/70">
            உங்கள் மொழியைத் தேர்ந்தெடுக்கவும்
          </p>

        </div>

        <div className="mt-10 space-y-4">

          <button
            disabled={loading}
            onClick={() => handleSelectLanguage('en')}
            className="w-full rounded-2xl border border-white/10 bg-white/10 hover:bg-violet-500 transition-all py-5 flex items-center justify-center gap-4 text-white text-lg font-semibold"
          >
            <span className="text-3xl">🇬🇧</span>

            <div className="text-left">
              <div>English</div>
              <div className="text-sm text-white/60 font-normal">
                Continue in English
              </div>
            </div>
          </button>

          <button
            disabled={loading}
            onClick={() => handleSelectLanguage('ta')}
            className="w-full rounded-2xl border border-white/10 bg-white/10 hover:bg-violet-500 transition-all py-5 flex items-center justify-center gap-4 text-white text-lg font-semibold"
          >
            <span className="text-3xl">🇮🇳</span>

            <div className="text-left">
              <div>தமிழ்</div>
              <div className="text-sm text-white/60 font-normal">
                தமிழில் தொடரவும்
              </div>
            </div>
          </button>

        </div>

        {loading && (

          <div className="mt-8 text-center text-white/70">

            Saving your preference...

          </div>

        )}

      </motion.div>

    </div>
  );
}