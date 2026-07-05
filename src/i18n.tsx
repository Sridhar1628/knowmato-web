import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import enTranslation from './locales/en.json';
import taTranslation from './locales/ta.json';

const resources = {
  en: { translation: enTranslation },
  ta: { translation: taTranslation },
};

i18n
  .use(LanguageDetector)          // detects language from browser/localStorage
  .use(initReactI18next)          // connects to React
  .init({
    resources,
    fallbackLng: 'en',
    debug: true,                  // set to false in production
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],   // persist language choice
    },
  });

console.log('✅ i18n initialized with languages:', i18n.languages); // optional check

export default i18n;              // ✅ MUST export the instance