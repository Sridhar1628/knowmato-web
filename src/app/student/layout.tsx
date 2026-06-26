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
  const [searchResults, setSearchResults] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [debouncedSearch, setDebouncedSearch] =
  useState('');

  const [showSuggestions, setShowSuggestions] =
  useState(false);

  const [

    search,

    setSearch

  ] = useState('');

  const [recentSearches, setRecentSearches] = useState<string[]>([]);

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

    if (
      debouncedSearch.length >= 1
    ) {

      saveRecentSearch(
        debouncedSearch
      );

    }

  }, [debouncedSearch]);

  useEffect(() => {

    if (
      debouncedSearch.length >= 1
    ) {

      router.replace(
        `/student/search?q=${encodeURIComponent(
          debouncedSearch
        )}`
      );

    }

  }, [debouncedSearch]);

  useEffect(() => {

    const timer = setTimeout(() => {

      setDebouncedSearch(
        search.trim()
      );

    }, 300);

    return () => clearTimeout(timer);

  }, [search]);

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

  const saveRecentSearch = (query: string) => {

    const existing =
      JSON.parse(
        localStorage.getItem('recent_searches') || '[]'
      );

    const updated = [
      query,
      ...existing.filter(
        (item: string) =>
          item.toLowerCase() !==
          query.toLowerCase()
      ),
    ].slice(0, 5);

    localStorage.setItem(
      'recent_searches',
      JSON.stringify(updated)
    );

    setRecentSearches(updated);
  };

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

              window.dispatchEvent(
                new Event(
                  'refresh-online-tutors'
                )
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
          z-50
          flex
          h-20
          items-center
          justify-between
          border-b
          border-white/20
          bg-white/80
          backdrop-blur-2xl
          px-6
          shadow-[0_8px_30px_rgba(15,23,42,0.08)]
          lg:ml-72
        "
      >
        {/* Left: hamburger (mobile) + logo */}
        <div className="flex items-center gap-5">
          <button
            onClick={() => setSidebarOpen(true)}
            className="
              md:hidden
              flex
              h-11
              w-11
              items-center
              justify-center
              rounded-xl
              border
              border-slate-200
              bg-white
              text-slate-600
              shadow-sm
              transition-all
              duration-300
              hover:scale-105
              hover:border-cyan-300
              hover:text-cyan-600
              hover:shadow-lg
              "
            aria-label="Open sidebar"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>

        {/* Center: Search */}
        <div className="hidden flex-1 max-w-2xl mx-4 sm:block">
          <div className="relative group">

            {/* Search Icon */}

            <svg
              className="
                absolute
                left-4
                top-1/2
                h-5
                w-5
                -translate-y-1/2
                text-slate-400
                transition
                group-focus-within:text-cyan-500
              "
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 21l-4.3-4.3m1.3-5.2a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>

            <div
              className="
                absolute
                -inset-0.5
                rounded-2xl
                bg-gradient-to-r
                from-cyan-400
                via-blue-500
                to-violet-500
                opacity-0
                blur
                transition-all
                duration-300
                group-focus-within:opacity-25
              "
            />

            <input
              type="text"
              value={search}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => {
                setTimeout(() => {
                  setShowSuggestions(false);
                }, 200);
              }}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search tutors, doubts or topics..."

              className="
                relative
                w-full
                rounded-2xl
                border
                border-slate-200/80
                bg-white/90
                backdrop-blur-xl
                py-3.5
                pl-12
                pr-20
                text-sm
                font-medium
                text-slate-800
                placeholder:text-slate-400
                shadow-sm
                transition-all
                duration-300
                outline-none
                hover:border-cyan-300
                hover:shadow-md
                focus:border-cyan-500
                focus:ring-4
                focus:ring-cyan-100
                focus:shadow-[0_0_40px_rgba(34,211,238,0.18)]
              "
            />
          </div>
        </div>

        {/* Right: notifications, wallet, user */}
        <div className="flex items-center gap-4">          <button
            onClick={() => router.push('/student/wallet')}
            className="
              hidden
              sm:flex
              items-center
              gap-2
              rounded-2xl
              border
              border-emerald-200
              bg-gradient-to-r
              from-emerald-50
              to-cyan-50
              px-4
              py-2.5
              text-sm
              font-semibold
              text-emerald-700
              shadow-sm
              transition-all
              duration-300
              hover:-translate-y-0.5
              hover:shadow-lg
              "
          >
            💰 ₹{wallet
              ? wallet.real
              : '...'}
          </button>

          <button
            onClick={() => router.push('/profile')}
            className="
              flex
              items-center
              gap-3
              rounded-2xl
              border
              border-slate-200
              bg-white
              px-3
              py-2
              shadow-sm
              transition-all
              duration-300
              hover:border-cyan-300
              hover:shadow-lg
              "
          >
            <span className="
                    flex
                    h-10
                    w-10
                    items-center
                    justify-center
                    rounded-xl
                    bg-gradient-to-br
                    from-cyan-500
                    to-blue-600
                    text-sm
                    font-bold
                    text-white
                    shadow-md
                    ">
              {cachedName.charAt(0).toUpperCase()}
            </span>
            <span className="hidden sm:inline text-sm font-semibold text-indigo-900">{cachedName ||'Student'}</span>
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