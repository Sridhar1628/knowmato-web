'use client';

import { Provider } from 'react-redux';
import { store } from '@/redux/store';

import {
  I18nextProvider,
} from 'react-i18next';

import i18n from '@/i18n';

import {
  CallProvider,
} from '@/contexts/CallContext';

import FloatingCallWidget from '@/components/FloatingCallWidget';

import { useEffect } from 'react';

import {
  AuthProvider,
} from '@/contexts/AuthContext';

import LanguageGate from '@/components/LanguageGate';

import CustomAlert from '@/components/common/CustomAlert/CustomAlert';

import {
  registerNotificationSoundUnlock,
} from '@/services/notificationSoundService';

export function Providers({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    /**
     * ========================================================
     * BROWSER NOTIFICATION PERMISSION
     * ========================================================
     *
     * Existing KnowMato notification permission behavior.
     * Leave this unchanged.
     */
    if (
      typeof window !== 'undefined' &&
      'Notification' in window
    ) {
      Notification.requestPermission();
    }

    /**
     * ========================================================
     * 🔊 NOTIFICATION SOUND UNLOCK
     * ========================================================
     *
     * Browsers may block audio that is triggered
     * automatically by WebSocket events.
     *
     * The sound service listens for the user's first
     * interaction with the application and unlocks
     * browser audio.
     */
    const removeSoundUnlockListeners =
      registerNotificationSoundUnlock();

    /**
     * Cleanup.
     */
    return () => {
      removeSoundUnlockListeners();
    };
  }, []);

  return (
    <I18nextProvider i18n={i18n}>
      <Provider store={store}>
        <AuthProvider>
          <LanguageGate>
            <CallProvider>

              {/* Global custom alert system */}
              <CustomAlert />

              {/* Existing global call widget */}
              <FloatingCallWidget />

              {children}

            </CallProvider>
          </LanguageGate>
        </AuthProvider>
      </Provider>
    </I18nextProvider>
  );
}