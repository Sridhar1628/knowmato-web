'use client';

import { ReactNode, useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';

import { getLanguage } from '@/services/languageService';

interface Props {
  children: ReactNode;
}

/**
 * Routes that must remain publicly accessible without
 * forcing the user through the language-selection screen.
 *
 * These routes contain SEO/indexable content.
 */
function isPublicSeoRoute(pathname: string): boolean {
  return (
    pathname === '/' ||
    pathname === '/courses' ||
    pathname.startsWith('/courses/') ||
    pathname === '/become-a-tutor' ||
    pathname === '/become-a-partner'
  );
}

export default function LanguageGate({
  children,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const { i18n } = useTranslation();

  /**
   * IMPORTANT:
   *
   * Public SEO pages must NOT start with a loading screen.
   *
   * usePathname() is available during the client render, so we can
   * determine this synchronously instead of waiting for useEffect().
   *
   * This prevents Google and other crawlers from receiving the
   * language-selection/loading screen as the initial page UI.
   */
  const [loading, setLoading] = useState(
    () => !isPublicSeoRoute(pathname),
  );

  useEffect(() => {
    /**
     * ============================================================
     * PUBLIC SEO ROUTES
     * ============================================================
     *
     * These pages must render directly.
     *
     * We intentionally do NOT:
     * - redirect to /language
     * - read the saved language
     * - change the i18n language
     * - display the loading screen
     *
     * The public SEO pages are written in English and must remain
     * directly accessible to search engines and first-time visitors.
     */
    if (isPublicSeoRoute(pathname)) {
      setLoading(false);
      return;
    }

    /**
     * ============================================================
     * LANGUAGE SELECTION PAGE
     * ============================================================
     *
     * The language page itself must remain accessible so users can
     * choose their language on first launch.
     */
    if (pathname === '/language') {
      setLoading(false);
      return;
    }

    /**
     * ============================================================
     * APPLICATION LANGUAGE INITIALIZATION
     * ============================================================
     *
     * Existing application behavior is preserved for:
     *
     * /login
     * /register
     * /student/*
     * /tutor/*
     * /admin/*
     * and other application routes.
     */
    const initializeLanguage = async () => {
      const language = getLanguage();

      /**
       * No language selected yet.
       *
       * Send the user to the existing language-selection page.
       */
      if (!language) {
        router.replace('/language');
        return;
      }

      /**
       * Load the saved language into i18next.
       */
      if (i18n.language !== language) {
        await i18n.changeLanguage(language);
      }

      setLoading(false);
    };

    initializeLanguage();
  }, [pathname, router, i18n]);

  /**
   * ============================================================
   * LOADING STATE
   * ============================================================
   *
   * Only application routes that require language initialization
   * should display this loading screen.
   *
   * Public SEO pages never enter this state on their first render.
   */
  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-white">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-violet-600 border-t-transparent" />
      </div>
    );
  }

  return <>{children}</>;
}