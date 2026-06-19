'use client';

import { Provider } from 'react-redux';
import { store } from '@/redux/store';

import {
  CallProvider,
} from '@/contexts/CallContext';

import FloatingCallWidget
  from '@/components/FloatingCallWidget';
import { useEffect } from 'react';

export function Providers({
  children,
}: {
  children: React.ReactNode;
}) {

    useEffect(() => {

    if (
      typeof window !== 'undefined' &&
      'Notification' in window
    ) {

      Notification.requestPermission();

    }

  }, []);
  return (
    <Provider store={store}>
      <CallProvider>

        <FloatingCallWidget />

        {children}

      </CallProvider>
    </Provider>
  );
}