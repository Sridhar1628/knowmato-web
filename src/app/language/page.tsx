'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  saveLanguage,
  AppLanguage,
} from '@/services/languageService';
import { useTranslation } from 'react-i18next';
import AlertService from '@/services/alertService';

export default function LanguageSelectionPage() {
  const router = useRouter();
  const { i18n } = useTranslation();

  const [loading, setLoading] =
    useState(false);

  // ==========================================================
  // LANGUAGE SELECTION
  // ==========================================================

  const handleSelectLanguage = async (
    language: AppLanguage,
  ) => {
    if (loading) {
      return;
    }

    setLoading(true);

    try {
      // ========================================================
      // SAVE LANGUAGE PREFERENCE
      // ========================================================

      saveLanguage(language);

      // ========================================================
      // CHANGE I18N LANGUAGE
      // ========================================================

      await i18n.changeLanguage(
        language,
      );

      // ========================================================
      // REDIRECT
      // ========================================================

      router.replace('/');
    } catch (error: unknown) {
      console.error(
        'Language selection error:',
        error,
      );

      // ========================================================
      // ERROR MESSAGE
      // ========================================================

      let errorMessage =
        'Unable to save your language preference. Please try again.';

      if (
        typeof error === 'object' &&
        error !== null
      ) {
        const possibleError =
          error as {
            response?: {
              data?: {
                message?: string;
                detail?: string;
                error?: string;
              };
            };
            message?: string;
          };

        errorMessage =
          possibleError
            .response
            ?.data
            ?.message ||
          possibleError
            .response
            ?.data
            ?.detail ||
          possibleError
            .response
            ?.data
            ?.error ||
          possibleError.message ||
          errorMessage;
      }

      // ========================================================
      // GLOBAL ERROR ALERT
      // ========================================================

      AlertService.error(
        'Language Selection Failed',
        errorMessage,
      );
    } finally {
      setLoading(false);
    }
  };

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e] flex items-center justify-center px-6">

      <motion.div
        initial={{
          opacity: 0,
          y: 25,
        }}
        animate={{
          opacity: 1,
          y: 0,
        }}
        transition={{
          duration: 0.5,
        }}
        className="w-full max-w-md rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-8 shadow-2xl"
      >

        {/* ====================================================
            HEADER
            ==================================================== */}

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

        {/* ====================================================
            LANGUAGE OPTIONS
            ==================================================== */}

        <div className="mt-10 space-y-4">

          {/* ==================================================
              ENGLISH
              ================================================== */}

          <button
            type="button"
            disabled={loading}
            onClick={() =>
              handleSelectLanguage(
                'en',
              )
            }
            className="w-full rounded-2xl border border-white/10 bg-white/10 hover:bg-violet-500 transition-all py-5 flex items-center justify-center gap-4 text-white text-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >

            <span className="text-3xl">
              🇬🇧
            </span>

            <div className="text-left">

              <div>
                English
              </div>

              <div className="text-sm text-white/60 font-normal">
                Continue in English
              </div>

            </div>

          </button>

          {/* ==================================================
              TAMIL
              ================================================== */}

          <button
            type="button"
            disabled={loading}
            onClick={() =>
              handleSelectLanguage(
                'ta',
              )
            }
            className="w-full rounded-2xl border border-white/10 bg-white/10 hover:bg-violet-500 transition-all py-5 flex items-center justify-center gap-4 text-white text-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >

            <span className="text-3xl">
              🇮🇳
            </span>

            <div className="text-left">

              <div>
                தமிழ்
              </div>

              <div className="text-sm text-white/60 font-normal">
                தமிழில் தொடரவும்
              </div>

            </div>

          </button>

        </div>

        {/* ====================================================
            LOADING
            ==================================================== */}

        {loading && (
          <div className="mt-8 text-center text-white/70">
            Saving your preference...
          </div>
        )}

      </motion.div>

    </div>
  );
}