'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useRouter, usePathname } from 'next/navigation';
import { RootState } from '@/redux/store';
import { getStudentDashboard, getActiveMatching } from '@/services/v1Service';
import { connectSocket, disconnectSocket } from '@/services/versionSocketService';
import { getTokens } from '@/services/storageService';
import MatchingBanner from '@/components/matching/MatchingBanner';
import DashboardSidebar from '@/components/DashboardSidebar';
import {
  updateOnlineTutor,
  updateRecentDoubt,
} from '@/store/dashboardRealtime';
import { useTranslation } from 'react-i18next';
import { store } from '@/redux/store';

import {
  startMatching,
  setDecisionState,
} from '@/redux/slices/matchingSlice';

import {
  startMatchingTimer,
  isMatchingTimerRunning,
} from '@/services/matchingTimerService';

export default function StudentLayoutContent({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation();
  const user = useSelector((state: RootState) => (state as RootState).auth.user);
  const router = useRouter();
  const pathname = usePathname(); // ✅ get current path for sidebar mode
  const dispatch = useDispatch();

  const [searchResults, setSearchResults] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [search, setSearch] = useState('');
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [wallet, setWallet] = useState<{
    real: number;
    bonus: number;
  } | null>(null);
  const [cachedName, setCachedName] = useState('');

  console.log("🏠 StudentLayoutContent rendered");

  useEffect(() => {
    console.log("🚀 Restore effect started");
    const restoreMatching = async () => {
      try {
        console.log("① Calling API");
        const res = await getActiveMatching();
        console.log("② API Response:", res);

        if (!res.has_matching) {
          console.log("❌ No active matching");
          return;
        }

        console.log("③ Dispatch startMatching");
        dispatch(
          startMatching({
            doubtId: res.doubt_id,
            waitingRound: res.waiting_round,
            matchingStartedAt: res.started_at,
            matchingExpiresAt: res.expires_at,
            remainingSeconds: res.remaining_seconds,
          })
        );

        console.log("④ Redux after dispatch:", store.getState().matching);

        if (res.status === "decision") {
          console.log("⑤ Setting decision state");
          dispatch(setDecisionState());
          console.log("⑥ Redux after decision:", store.getState().matching);
        }

        if (!isMatchingTimerRunning()) {
          console.log("⑦ Starting timer");
          startMatchingTimer();
        }

        console.log("✅ Restore complete");
      } catch (err) {
        console.error("❌ Restore failed:", err);
      }
    };
    restoreMatching();
  }, []);

  // --- Search and debounce ---
  useEffect(() => {
    if (debouncedSearch.length >= 1) {
      saveRecentSearch(debouncedSearch);
    }
  }, [debouncedSearch]);

  useEffect(() => {
    if (debouncedSearch.length >= 1) {
      router.replace(`/student/search?q=${encodeURIComponent(debouncedSearch)}`);
    }
  }, [debouncedSearch]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // --- Cached name ---
  useEffect(() => {
    const storedName = localStorage.getItem('display_name');
    if (storedName) {
      setCachedName(storedName);
    }
  }, []);

  useEffect(() => {
    const name = user?.first_name || user?.display_name || user?.email?.split('@')[0];
    if (name) {
      localStorage.setItem('display_name', name);
      setCachedName(name);
    }
  }, [user]);

  // --- Wallet fetch ---
  const fetchDashboardData = useCallback(async () => {
    try {
      const res = await getStudentDashboard();
      const data = res.data || res;
      if (data.wallet) {
        setWallet({
          real: parseFloat(data.wallet.real_balance || '0'),
          bonus: parseFloat(data.wallet.bonus_balance || '0'),
        });
      }
    } catch (error) {
      console.error('Layout fetch error:', error);
    }
  }, []);

  const saveRecentSearch = (query: string) => {
    const existing = JSON.parse(localStorage.getItem('recent_searches') || '[]');
    const updated = [
      query,
      ...existing.filter((item: string) => item.toLowerCase() !== query.toLowerCase()),
    ].slice(0, 5);
    localStorage.setItem('recent_searches', JSON.stringify(updated));
    setRecentSearches(updated);
  };

  // --- Socket setup ---
  useEffect(() => {
    const initSocket = async () => {
      try {
        const tokens = await getTokens();
        if (!tokens?.access) return;
        connectSocket(tokens.access, (event: string, data: any) => {
          switch (event) {
            case 'WALLET_UPDATE':
              setWallet({
                real: parseFloat(data.real_balance || '0'),
                bonus: parseFloat(data.bonus_balance || '0'),
              });
              break;
            case 'PRESENCE_UPDATE':
              updateOnlineTutor(data.user_id, data.is_online);
              window.dispatchEvent(new Event('refresh-online-tutors'));
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

  // --- Visibility change ---
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible') {
        console.log('🌐 TAB ACTIVE AGAIN');
        try {
          const tokens = await getTokens();
          if (tokens?.access) {
            disconnectSocket();
            setTimeout(() => {
              connectSocket(tokens.access, (event: string, data: any) => {
                switch (event) {
                  case 'WALLET_UPDATE':
                    setWallet({
                      real: parseFloat(data.real_balance || '0'),
                      bonus: parseFloat(data.bonus_balance || '0'),
                    });
                    break;
                  default:
                    break;
                }
              });
            }, 500);
          }
        } catch (err) {
          console.log('Reconnect error:', err);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e] relative overflow-hidden">
      {/* Animated background blobs */}
      <div className="absolute top-0 -left-20 w-72 h-72 bg-purple-500/20 rounded-full mix-blend-multiply filter blur-3xl animate-blob" />
      <div className="absolute top-0 -right-20 w-72 h-72 bg-fuchsia-500/20 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000" />
      <div className="absolute -bottom-20 left-40 w-72 h-72 bg-cyan-500/20 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000" />

      {/* TOP HEADER */}
      <header className="sticky top-0 z-50 flex h-20 items-center justify-between border-b border-white/10 bg-white/5 backdrop-blur-xl shadow-2xl px-6 lg:ml-72">
        {/* Left: hamburger (mobile) */}
        <div className="flex items-center gap-5">
          <button
            onClick={() => setSidebarOpen(true)}
            className="md:hidden flex h-11 w-11 items-center justify-center rounded-xl border border-white/20 bg-white/10 text-white shadow-sm transition-all duration-300 hover:scale-105 hover:border-violet-400/40 hover:text-violet-300 hover:shadow-lg"
            aria-label={t('common.openSidebar')}
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>

        {/* Search Bar */}
        <div className="hidden flex-1 max-w-2xl mx-4 sm:block">
          <div className="relative group">
            <svg
              className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-white/40 transition group-focus-within:text-violet-400"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.3-4.3m1.3-5.2a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <div className="absolute -inset-0.5 rounded-2xl bg-gradient-to-r from-violet-400 via-fuchsia-500 to-cyan-400 opacity-0 blur transition-all duration-300 group-focus-within:opacity-25" />
            <input
              type="text"
              value={search}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('studentHome.searchPlaceholder')}
              className="relative w-full rounded-2xl border-2 border-white/20 bg-gray-900/60 backdrop-blur-xl py-3.5 pl-12 pr-20 text-sm font-medium text-white placeholder-white/40 shadow-sm transition-all duration-300 outline-none hover:border-violet-400/40 hover:shadow-md focus:border-violet-400 focus:ring-4 focus:ring-violet-500/50 focus:shadow-[0_0_40px_rgba(167,139,250,0.2)]"
            />
          </div>
        </div>

        {/* Right: profile */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push('/student/profile')}
            className="flex items-center gap-3 rounded-2xl border border-white/20 bg-white/10 backdrop-blur-md px-3 py-2 shadow-sm transition-all duration-300 hover:border-violet-400/40 hover:shadow-lg"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 text-sm font-bold text-white shadow-md">
              {cachedName.charAt(0).toUpperCase()}
            </span>
            <span className="hidden sm:inline text-sm font-semibold text-white/90">
              {cachedName || t('common.student')}
            </span>
          </button>
        </div>
      </header>

      {/* Main area */}
      <div className="flex min-h-[calc(100vh-4rem)]">
        {/* ✅ Pass pathname to sidebar */}
        <DashboardSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} pathname={pathname} />
        <main className="min-w-0 flex-1 overflow-x-hidden p-4 md:p-6 lg:ml-72 relative z-10">
          <MatchingBanner />
          {children}
        </main>
      </div>
    </div>
  );
}