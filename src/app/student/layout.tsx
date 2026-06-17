'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';
import { RootState } from '@/redux/store';
import { getStudentDashboard } from '@/services/v1Service';
import { connectSocket, disconnectSocket } from '@/services/versionSocketService';
import { getTokens } from '@/services/storageService';
import DashboardSidebar from '@/components/DashboardSidebar';
import {

  updateOnlineTutor,

  updateRecentDoubt,

} from '@/store/dashboardRealtime';

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  const user = useSelector((state: RootState) => state.auth.user);
  const router = useRouter();

  const [

    search,

    setSearch

  ] = useState('');

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [wallet, setWallet] = useState<{
    real: number;
    bonus: number;
  } | null>(null);

  const [

    cachedName,

    setCachedName,

  ] = useState('');

  useEffect(() => {

    const storedName =
      localStorage.getItem(
        'display_name'
      );

    if (storedName) {

      setCachedName(
        storedName
      );

    }

  }, []);

  useEffect(() => {

    const name =

      user?.first_name ||

      user?.display_name ||

      user?.email?.split('@')[0];

    if (name) {

      localStorage.setItem(
        'display_name',
        name
      );

      setCachedName(name);

    }

  }, [user]);

  const fetchDashboardData = useCallback(async () => {
    try {
      const res = await getStudentDashboard();
      const data = res.data || res;
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
    } catch (error) {
      console.error('Layout fetch error:', error);
    }
  }, []);

  // Socket setup (shared across student pages)
  useEffect(() => {
    const initSocket = async () => {
      try {
        const tokens = await getTokens();
        if (!tokens?.access) return;
        connectSocket(tokens.access, (event: string, data: any) => {
          switch (event) {

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

            case 'PRESENCE_UPDATE':

              updateOnlineTutor(
                data.user_id,
                data.is_online
              );

              break;

            case 'DOUBT_CREATED':

            case 'DOUBT_UPDATED':

              updateRecentDoubt(data);

              break;

            default:
              break;
          }
        });
      } catch (error) {
        console.log('Socket init error:', error);
      }
    };
    initSocket();
    return () => disconnectSocket();
  }, []);

  useEffect(() => {

    const handleVisibilityChange =
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
              tokens?.access
            ) {

              disconnectSocket();

              setTimeout(() => {

                connectSocket(
                  tokens.access,

                  (
                    event: string,
                    data: any
                  ) => {

                    switch (event) {

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

                      default:
                        break;
                    }

                  }
                );

              }, 500);
            }

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
      handleVisibilityChange
    );

    return () => {

      document.removeEventListener(
        'visibilitychange',
        handleVisibilityChange
      );

    };

  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* TOP HEADER – only once */}
      <header
        className="
          sticky
          top-0
          z-30
          flex
          h-16
          items-center
          justify-between
          border-b
          border-gray-200
          bg-white
          px-4
          shadow-sm

          lg:ml-72
        "
      >
        {/* Left: hamburger (mobile) + logo */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-gray-600 hover:text-gray-900 md:hidden"
            aria-label="Open sidebar"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>

        {/* Center: Search */}
        <div className="hidden flex-1 max-w-md mx-4 sm:block">
          <div className="relative">
            <input

              type="text"

              value={search}

              onChange={(e) =>
                setSearch(
                  e.target.value
                )
              }

              onKeyDown={(e) => {

                if (
                  e.key === 'Enter' &&
                  search.trim()
                ) {

                  router.push(
                    `/student/search?q=${encodeURIComponent(
                      search.trim()
                    )}`
                  );

                }

              }}

              placeholder="
                Search for topics,
                tutors or doubts...
              "

              className="
                w-full
                rounded-lg
                border
                border-gray-300
                bg-white
                py-2
                pl-4
                pr-10
                text-sm
                font-medium
                text-black
                placeholder:text-gray-400
                focus:outline-none
                focus:ring-2
                focus:ring-indigo-500
              "
            />
            <span className="absolute right-3 top-2 text-xs text-gray-400 hidden sm:inline">⌘ K</span>
          </div>
        </div>

        {/* Right: notifications, wallet, user */}
        <div className="flex items-center gap-2 sm:gap-4">          <button
            onClick={() => router.push('/student/wallet')}
            className="hidden sm:flex items-center gap-1 rounded-lg bg-indigo-50 px-3 py-1.5 text-xs font-bold text-indigo-600 transition hover:bg-indigo-100"
          >
            💰 ₹{wallet
              ? wallet.real + wallet.bonus
              : '...'}
          </button>

          <button
            onClick={() => router.push('/profile')}
            className="flex items-center gap-2 rounded-full bg-indigo-100 px-3 py-1.5"
          >
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-600 text-xs text-white">
              {cachedName.charAt(0).toUpperCase()}
            </span>
            <span className="hidden sm:inline text-xs font-semibold text-indigo-900">{cachedName ||'Student'}</span>
          </button>
        </div>
      </header>

      {/* MAIN LAYOUT: sidebar + page content */}
      <div className="flex min-h-[calc(100vh-4rem)]">
        <DashboardSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main
          className="
            min-w-0
            flex-1
            overflow-x-hidden
            p-4
            md:p-6

            lg:ml-72
          "
        >{children}</main>
      </div>
    </div>
  );
}