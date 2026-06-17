'use client';

import { Provider } from 'react-redux';
import { store } from '@/redux/store';

import {
  CallProvider,
} from '@/contexts/CallContext';

import FloatingCallWidget
  from '@/components/FloatingCallWidget';

export function Providers({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Provider store={store}>
      <CallProvider>

        <FloatingCallWidget />

        {children}

      </CallProvider>
    </Provider>
  );
}