'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useRouter } from 'next/navigation';
import { RootState } from '@/redux/store';
import { clearTokens } from '@/services/storageService';
import { logout } from '@/redux/slices/authSlice';
import api from '@/api/axiosInstance';
import { getMyReviews } from '@/services/reviewService';
import { connectSocket, disconnectSocket } from '@/services/socketService';
import { getTokens } from '@/services/storageService';
import toast from 'react-hot-toast';

interface Session {
  session_id: number;
  doubt: string;
  tutor: string;
  status: string;
}

interface DashboardStats {
  doubtCount: number;
  sessionCount: number;
  reviewCount: number;
}

export default function StudentDashboard() {
  const user = useSelector((state: RootState) => state.auth.user);
  const dispatch = useDispatch();
  const router = useRouter();

  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [activeSessions, setActiveSessions] = useState<Session[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    doubtCount: 0,
    sessionCount: 0,
    reviewCount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [notificationCount, setNotificationCount] = useState<number>(0);

  const displayName =
    user?.first_name || user?.display_name || user?.email?.split('@')[0] || 'Student';

  // Fetch dashboard data from APIs
  const fetchDashboardData = useCallback(async () => {
    try {
      // Profile for wallet balance
      const profileRes = await api.get('/accounts/profile/');
      setWalletBalance(profileRes.data.data.wallet_balance || 0);

      // Active sessions
      const sessionsRes = await api.get('/sessions/my-sessions/');
      const allSessions = Array.isArray(sessionsRes?.data)
        ? sessionsRes.data
        : Array.isArray(sessionsRes?.data?.data)
        ? sessionsRes.data.data
        : [];
      const active = allSessions.filter((s: Session) => s.status === 'active');
      setActiveSessions(active);

      // Doubts count
      const doubtsRes = await api.get('/doubts/my-doubts/');
      const doubts = Array.isArray(doubtsRes?.data?.data)
        ? doubtsRes.data.data
        : [];

      // Reviews count
      let reviews: any[] = [];
      try {
        const res = await getMyReviews();
        reviews = Array.isArray(res) ? res : [];
      } catch (e) {
        console.log('Review fetch failed:', e);
      }

      setStats({
        doubtCount: doubts.length,
        sessionCount: allSessions.length,
        reviewCount: reviews.length,
      });
    } catch (error) {
      console.error('Dashboard fetch error:', error);
      toast.error('Could not load dashboard data.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // WebSocket connection for real-time updates
  useEffect(() => {
    const initSocket = async () => {
      try {
        const tokens = await getTokens();
        if (!tokens?.access || !user?.id) return;

        connectSocket(user.id, tokens.access, (data: any) => {
          // New doubt created
          if (data.event === 'DOUBT_CREATED') {
            setStats((prev) => ({
              ...prev,
              doubtCount: prev.doubtCount + 1,
            }));
          }
          // Wallet update
          if (data.event === 'WALLET_UPDATED') {
            setWalletBalance(Number(data.data.balance));
          }
          // New session created
          if (data.event === 'SESSION_CREATED') {
            const newSession = data.data;
            setActiveSessions((prev) => {
              const exists = prev.some((s) => s.session_id === newSession.session_id);
              if (exists) return prev;
              return [newSession, ...prev];
            });
          }
          // Session updated
          if (data.event === 'SESSION_UPDATED') {
            const updatedSession = data.data;
            setActiveSessions((prev) => {
              const index = prev.findIndex((s) => s.session_id === updatedSession.session_id);
              if (index === -1) return prev;
              const newSessions = [...prev];
              newSessions[index] = updatedSession;
              return newSessions;
            });
          }
          console.log('📡 WebSocket event:', data);
        });
      } catch (error) {
        console.log('Socket init error:', error);
      }
    };

    initSocket();
    return () => {
      disconnectSocket();
    };
  }, [user?.id]);

  // Initial data load
  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
  };

  const handleLogout = async () => {
    try {
      disconnectSocket();
      await clearTokens();
      dispatch(logout());
      router.push('/entry');
    } catch (error) {
      toast.error('Failed to logout. Please try again.');
    }
  };

  if (loading && !refreshing) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
          <p className="mt-4 text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Gradient Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-indigo-800 pb-6 pt-10 shadow-lg">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/20">
                <span className="text-2xl font-bold text-white">
                  {displayName.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <p className="text-sm text-indigo-100">Welcome back,</p>
                <h1 className="text-xl font-bold text-white">{displayName}</h1>
                <div className="mt-1 flex items-center gap-1 rounded-full bg-white/20 px-2 py-0.5 text-xs text-white">
                  <span>🎓</span> Student
                </div>
              </div>
            </div>
            <button
              onClick={() => router.push('/student/notifications')}
              className="relative rounded-full bg-white/15 p-2 text-white hover:bg-white/25"
            >
              🔔
              {notificationCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
                  {notificationCount > 99 ? '99+' : notificationCount}
                </span>
              )}
            </button>
          </div>

          {/* Wallet Card */}
          <button
            onClick={() => router.push('/student/wallet')}
            className="mt-5 flex w-full items-center justify-between rounded-xl bg-white/15 px-4 py-3 text-white transition hover:bg-white/25"
          >
            <span>💰</span>
            <span className="text-lg font-bold">₹{walletBalance.toFixed(2)}</span>
            <span>➡️</span>
          </button>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        {/* Refresh button */}
        <div className="mb-4 flex justify-end">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="rounded-full bg-white p-2 shadow hover:bg-gray-50 disabled:opacity-50"
          >
            <svg
              className={`h-5 w-5 text-gray-600 ${refreshing ? 'animate-spin' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          </button>
        </div>

        {/* Quick Actions */}
        <h2 className="mb-3 text-xl font-bold text-gray-800">⚡ Quick Actions</h2>
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <button
            onClick={() => router.push('/student/post-doubt')}
            className="rounded-2xl bg-gradient-to-r from-indigo-500 to-indigo-600 p-5 text-center text-white shadow-md transition hover:-translate-y-1"
          >
            <div className="text-3xl">❓</div>
            <div className="mt-2 font-semibold">Post Doubt</div>
          </button>
          <button
            onClick={() => router.push('/student/my-doubts')}
            className="rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 p-5 text-center text-white shadow-md transition hover:-translate-y-1"
          >
            <div className="text-3xl">📋</div>
            <div className="mt-2 font-semibold">My Doubts</div>
          </button>
          <button
            onClick={() => router.push('/student/reviews')}
            className="rounded-2xl bg-gradient-to-r from-emerald-500 to-green-500 p-5 text-center text-white shadow-md transition hover:-translate-y-1"
          >
            <div className="text-3xl">👥</div>
            <div className="mt-2 font-semibold">My Reviews</div>
          </button>
        </div>

        {/* Wallet Promo */}
        <button
          onClick={() => router.push('/student/wallet')}
          className="mb-8 w-full rounded-2xl bg-amber-50 p-4 text-left shadow-sm transition hover:bg-amber-100"
        >
          <div className="flex items-center gap-3">
            <span className="text-2xl">⚡</span>
            <div className="flex-1">
              <p className="font-semibold text-amber-800">Wallet Offer</p>
              <p className="text-sm text-gray-600">
                Use wallet & save ₹3 on your next session
              </p>
            </div>
            <span className="text-xl text-amber-600">➡️</span>
          </div>
        </button>

        {/* Active Sessions */}
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-800">🟢 Active Sessions</h2>
          <button
            onClick={() => router.push('/student/sessions')}
            className="text-sm font-medium text-indigo-600 hover:underline"
          >
            See All
          </button>
        </div>
        <div className="mb-8 space-y-3">
          {activeSessions.length === 0 ? (
            <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center">
              <div className="text-4xl">⏳</div>
              <p className="mt-2 font-semibold text-gray-800">No active sessions</p>
              <p className="text-sm text-gray-500">
                Your ongoing doubt solving sessions will appear here
              </p>
            </div>
          ) : (
            activeSessions.map((session) => (
              <button
                key={session.session_id}
                onClick={() =>
                  router.push(`/student/chats?sessionId=${session.session_id}`)
                }
                className="flex w-full items-center gap-3 rounded-2xl border border-gray-200 bg-white p-4 text-left shadow-sm transition hover:shadow-md"
              >
                <span className="text-2xl">💬</span>
                <div className="flex-1">
                  <p className="font-semibold text-gray-800">{session.doubt}</p>
                  <p className="text-sm text-gray-500">Tutor: {session.tutor}</p>
                </div>
                <span className="text-sm font-medium text-green-600">● Active</span>
              </button>
            ))
          )}
        </div>

        {/* Your Activity Stats */}
        <h2 className="mb-3 text-xl font-bold text-gray-800">📊 Your Activity</h2>
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-gray-200 bg-white p-5 text-center">
            <p className="text-3xl font-bold text-gray-800">{stats.doubtCount}</p>
            <p className="text-sm text-gray-500">Doubts Posted</p>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-white p-5 text-center">
            <p className="text-3xl font-bold text-gray-800">{stats.sessionCount}</p>
            <p className="text-sm text-gray-500">Sessions</p>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-white p-5 text-center">
            <p className="text-3xl font-bold text-gray-800">{stats.reviewCount}</p>
            <p className="text-sm text-gray-500">Reviews</p>
          </div>
        </div>

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-200 bg-white py-3 text-red-600 transition hover:bg-red-50"
        >
          <span>🚪</span>
          <span className="font-semibold">Logout</span>
        </button>
      </div>
    </div>
  );
}