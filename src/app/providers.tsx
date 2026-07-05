'use client';

import { Provider } from 'react-redux';
import { store } from '@/redux/store';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/i18n'; // ✅ import your i18n config
import {
  CallProvider,
} from '@/contexts/CallContext';
import FloatingCallWidget from '@/components/FloatingCallWidget';
import { useEffect } from 'react';
import { AuthProvider } from '@/contexts/AuthContext';

export function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      Notification.requestPermission();
    }
  }, []);

  return (
    <I18nextProvider i18n={i18n}>   {/* ✅ wrap everything */}
      <Provider store={store}>
        <AuthProvider>
          <CallProvider>
            <FloatingCallWidget />
            {children}
          </CallProvider>
        </AuthProvider>
      </Provider>
    </I18nextProvider>
  );
}