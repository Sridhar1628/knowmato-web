'use client';

import {
  useState,
  useEffect,
  useCallback,
} from 'react';

import { useSelector } from 'react-redux';

import {
  useRouter,
} from 'next/navigation';

import {
  RootState,
} from '@/redux/store';

import {
  getTokens,
} from '@/services/storageService';

import {
  connectSocket,
  disconnectSocket,
} from '@/services/versionSocketService';

import {
  emitSocketEvent,
} from '@/services/socketEventBus';

import {
  getTutorDashboard,
} from '@/services/v1Service';

import TutorSidebar
  from '@/components/TutorSidebar';

interface WalletState {
  real: number;
  bonus: number;
}

interface NotificationState {
  title: string;
  message: string;
  type: string;
  data?: any;
}

export default function TutorLayout({
  children,
}: {
  children: React.ReactNode;
}) {

  const router = useRouter();

  const user = useSelector(
    (state: RootState) =>
      state.auth.user
  );

  const [sidebarOpen, setSidebarOpen] =
    useState(false);

  const [wallet, setWallet] =
    useState<WalletState>({
      real: 0,
      bonus: 0,
    });

  const [notificationCount,
    setNotificationCount] =
      useState(0);

  const [notification,
    setNotification] =
      useState<NotificationState | null>(
        null
      );

  const displayName =
    user?.display_name ||
    user?.first_name ||
    user?.email?.split('@')[0] ||
    'Tutor';

  // =========================================
  // DASHBOARD FETCH
  // =========================================

  const fetchDashboard =
    useCallback(async () => {

      try {

        const res =
          await getTutorDashboard();

        const data =
          res.data || res;

        // ✅ WALLET
        if (data.wallet) {

          setWallet({

            real: parseFloat(
              data.wallet.real_balance || '0'
            ),

            bonus: parseFloat(
              data.wallet.bonus_balance || '0'
            ),

          });
        }

      } catch (err) {

        console.log(
          'Dashboard error:',
          err
        );

      }

    }, []);

  // =========================================
  // GLOBAL SOCKET EVENT HANDLER
  // =========================================

  const handleSocketEvent =
    (
      event: string,
      data: any
    ) => {

      // ✅ GLOBAL EVENT BUS
      emitSocketEvent(
        event,
        data
      );

      console.log(
        '🔥 TUTOR WS:',
        event,
        data
      );

      switch (event) {

        // =================================
        // NEW DOUBT REQUEST
        // =================================

        case 'NEW_DOUBT_REQUEST':

          setNotification({

            title:
              '📬 New Doubt Request',

            message:
              data?.title ||
              'A new doubt request arrived',

            type: event,

            data,
          });

          setNotificationCount(
            prev => prev + 1
          );

          break;

        // =================================
        // DIRECT REQUEST
        // =================================

        case 'NEW_DIRECT_REQUEST':

          setNotification({

            title:
              '📩 Direct Request',

            message:
              data?.title ||
              'A direct request arrived',

            type: event,

            data,
          });

          setNotificationCount(
            prev => prev + 1
          );

          break;

        // =================================
        // WALLET UPDATE
        // =================================

        case 'WALLET_UPDATE':

          setWallet({

            real: parseFloat(
              data.real_balance || '0'
            ),

            bonus: parseFloat(
              data.bonus_balance || '0'
            ),

          });

          break;

        // =================================
        // SESSION EVENTS
        // =================================

        case 'SESSION_STARTED':

        case 'DIRECT_ACCEPTED':

        case 'TUTOR_ACCEPTED':

          if (!data?.session_id)
            return;

          const type =
            (
              data.session_type || ''
            ).toLowerCase();

          if (
            type === 'live_video'
          ) {

            router.push(
              `/videocall/${data.session_id}`
            );

          } else {

            router.push(
              `/chat/${data.session_id}`
            );

          }

          break;

        // =================================
        // PRESENCE UPDATE
        // =================================

        case 'PRESENCE_UPDATE':

          console.log(
            '🟢 PRESENCE UPDATE:',
            data
          );

          break;

        default:
          break;
      }
    };

  // =========================================
  // INITIAL SOCKET CONNECTION
  // =========================================

  useEffect(() => {

    let mounted = true;

    const initSocket =
      async () => {

        try {

          const tokens =
            await getTokens();

          if (
            !tokens?.access
          ) return;

          console.log(
            '🌐 CONNECTING GLOBAL TUTOR SOCKET'
          );

          connectSocket(
            tokens.access,
            (
              event,
              data
            ) => {

              if (!mounted)
                return;

              handleSocketEvent(
                event,
                data
              );

            }
          );

        } catch (err) {

          console.log(
            'Socket init error:',
            err
          );

        }
      };

    initSocket();

    return () => {

      mounted = false;

      disconnectSocket();

    };

  }, []);

  // =========================================
  // TAB VISIBILITY RECONNECT
  // =========================================

  useEffect(() => {

    const handleVisibility =
      async () => {

        // TAB ACTIVE AGAIN
        if (
          document.visibilityState ===
          'visible'
        ) {

          console.log(
            '🌐 TAB ACTIVE AGAIN'
          );

          try {

            const tokens =
              await getTokens();

            if (
              !tokens?.access
            ) return;

            // CLEAN OLD SOCKET
            disconnectSocket();

            // RECONNECT
            setTimeout(() => {

              connectSocket(
                tokens.access,
                handleSocketEvent
              );

            }, 500);

          } catch (err) {

            console.log(
              'Reconnect error:',
              err
            );

          }
        }
      };

    document.addEventListener(
      'visibilitychange',
      handleVisibility
    );

    return () => {

      document.removeEventListener(
        'visibilitychange',
        handleVisibility
      );

    };

  }, []);

  // =========================================
  // INITIAL DASHBOARD LOAD
  // =========================================

  useEffect(() => {

    fetchDashboard();

  }, [fetchDashboard]);

  // =========================================
  // AUTO HIDE NOTIFICATION
  // =========================================

  useEffect(() => {

    if (!notification)
      return;

    const timer =
      setTimeout(() => {

        setNotification(null);

      }, 5000);

    return () =>
      clearTimeout(timer);

  }, [notification]);

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ================================= */}
      {/* SIDEBAR */}
      {/* ================================= */}

      <TutorSidebar
        open={sidebarOpen}
        onClose={() =>
          setSidebarOpen(false)
        }
      />

      {/* ================================= */}
      {/* MAIN CONTENT */}
      {/* ================================= */}

      <div className="md:ml-72">

        {/* ============================= */}
        {/* HEADER */}
        {/* ============================= */}

        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-gray-200 bg-white px-4 shadow-sm">

          {/* LEFT */}
          <div className="flex items-center gap-3">

            {/* MOBILE MENU */}
            <button
              onClick={() =>
                setSidebarOpen(true)
              }
              className="rounded-lg p-2 transition hover:bg-gray-100 md:hidden"
            >
              ☰
            </button>

            {/* USER */}
            <div>

              <p className="text-xs text-gray-500">
                Welcome back
              </p>

              <h2 className="text-lg font-bold text-gray-900">
                {displayName}
              </h2>

            </div>
          </div>

          {/* RIGHT */}
          <div className="flex items-center gap-3">

            {/* NOTIFICATIONS */}
            <button className="relative rounded-full p-2 transition hover:bg-gray-100">

              🔔

              {notificationCount > 0 && (

                <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">

                  {notificationCount}

                </span>

              )}

            </button>

            {/* WALLET */}
            <button
              onClick={() =>
                router.push(
                  '/tutor/wallet'
                )
              }
              className="rounded-xl bg-indigo-50 px-4 py-2 text-sm font-bold text-indigo-600 transition hover:bg-indigo-100"
            >
              💰 ₹
              {wallet.real +
                wallet.bonus}
            </button>

          </div>
        </header>

        {/* ============================= */}
        {/* PAGE CONTENT */}
        {/* ============================= */}

        <main className="p-4 md:p-6">

          {children}

        </main>
      </div>

      {/* ================================= */}
      {/* GLOBAL NOTIFICATION */}
      {/* ================================= */}

      {notification && (

        <div className="fixed right-4 top-20 z-50 w-[340px] animate-[slideIn_0.3s_ease] rounded-2xl border border-indigo-100 bg-white p-4 shadow-2xl">

          <div className="flex items-start justify-between gap-3">

            <div>

              <h3 className="font-bold text-gray-900">
                {notification.title}
              </h3>

              <p className="mt-1 text-sm text-gray-600">
                {notification.message}
              </p>

            </div>

            <button
              onClick={() =>
                setNotification(null)
              }
              className="text-gray-400 transition hover:text-gray-700"
            >
              ✕
            </button>

          </div>

          {/* ACTION */}
          <button
            onClick={() => {

              if (
                notification.type ===
                'NEW_DIRECT_REQUEST'
              ) {

                router.push(
                  '/tutor/requests'
                );

              } else {

                router.push(
                  '/tutor/doubts'
                );

              }

              setNotification(null);

            }}
            className="mt-4 w-full rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700"
          >
            Open
          </button>

        </div>

      )}

    </div>
  );
}