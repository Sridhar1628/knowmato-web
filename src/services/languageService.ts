const LANGUAGE_KEY = 'knowmato_language';

export type AppLanguage = 'en' | 'ta';

/**
 * Save selected language
 */
export const saveLanguage = (language: AppLanguage): void => {
  if (typeof window === 'undefined') return;

  localStorage.setItem(LANGUAGE_KEY, language);
};

/**
 * Get saved language
 */
export const getLanguage = (): AppLanguage | null => {
  if (typeof window === 'undefined') return null;

  const language = localStorage.getItem(LANGUAGE_KEY);

  if (language === 'en' || language === 'ta') {
    return language;
  }

  return null;
};

/**
 * Remove saved language
 */
export const removeLanguage = (): void => {
  if (typeof window === 'undefined') return;

  localStorage.removeItem(LANGUAGE_KEY);
};

/**
 * Check whether language has already been selected
 */
export const hasSelectedLanguage = (): boolean => {
  return getLanguage() !== null;
};