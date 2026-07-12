'use client';

import { ReactNode, useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';

import { getLanguage } from '@/services/languageService';

interface Props {
  children: ReactNode;
}

export default function LanguageGate({
  children,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const { i18n } = useTranslation();

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeLanguage = async () => {
      const language = getLanguage();

      // Allow language page without redirect
      if (pathname === '/language') {
        setLoading(false);
        return;
      }

      // First launch
      if (!language) {
        router.replace('/language');
        return;
      }

      // Load saved language
      if (i18n.language !== language) {
        await i18n.changeLanguage(language);
      }

      setLoading(false);
    };

    initializeLanguage();
  }, [pathname]);

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-white">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-violet-600 border-t-transparent" />
      </div>
    );
  }

  return <>{children}</>;
}