'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';
import { RootState } from '@/redux/store';
import { getStudentDashboard } from '@/services/v1Service';
import { connectSocket, disconnectSocket } from '@/services/versionSocketService';
import { getTokens } from '@/services/storageService';
import DashboardSidebar from '@/components/DashboardSidebar';

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  const user = useSelector((state: RootState) => state.auth.user);
  const router = useRouter();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [wallet, setWallet] = useState({ real: 0, bonus: 0 });
  const [notificationCount, setNotificationCount] = useState(2); // dummy

  const displayName =
    user?.first_name || user?.display_name || user?.email?.split('@')[0] || 'Student';

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
            case 'NOTIFICATION':
              setNotificationCount(prev => prev + 1);
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

                      case 'NOTIFICATION':

                        setNotificationCount(
                          prev => prev + 1
                        );

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
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-gray-200 bg-white px-4 shadow-sm">
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
          <div className="hidden md:flex items-center gap-2">
            <div className="rounded-lg bg-indigo-600 p-1">
              <span className="text-lg text-white">⚡</span>
            </div>
            <span className="text-xl font-bold tracking-tight text-[#0f0f23]">Instant Skill</span>
          </div>
        </div>

        {/* Center: Search */}
        <div className="hidden flex-1 max-w-md mx-4 sm:block">
          <div className="relative">
            <input
              type="text"
              placeholder="Search for topics, tutors or doubts..."
              className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2 pl-4 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <span className="absolute right-3 top-2 text-xs text-gray-400 hidden sm:inline">⌘ K</span>
          </div>
        </div>

        {/* Right: notifications, wallet, user */}
        <div className="flex items-center gap-2 sm:gap-4">
          <button className="relative rounded-full p-2 text-gray-600 hover:bg-gray-100">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            {notificationCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] text-white">
                {notificationCount}
              </span>
            )}
          </button>

          <button
            onClick={() => router.push('/student/wallet')}
            className="hidden sm:flex items-center gap-1 rounded-lg bg-indigo-50 px-3 py-1.5 text-xs font-bold text-indigo-600 transition hover:bg-indigo-100"
          >
            💰 ₹{wallet.real + wallet.bonus}
          </button>

          <button
            onClick={() => router.push('/profile')}
            className="flex items-center gap-2 rounded-full bg-indigo-100 px-3 py-1.5"
          >
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-600 text-xs text-white">
              {displayName.charAt(0).toUpperCase()}
            </span>
            <span className="hidden sm:inline text-xs font-semibold text-indigo-900">{displayName}</span>
          </button>
        </div>
      </header>

      {/* MAIN LAYOUT: sidebar + page content */}
      <div className="flex min-h-[calc(100vh-4rem)]">
        <DashboardSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main className="min-w-0 flex-1 overflow-x-hidden p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}