'use client';

import { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useRouter } from 'next/navigation';
import { RootState } from '@/redux/store';
import { clearTokens } from '@/services/storageService';
import { logout } from '@/redux/slices/authSlice';
import api from '@/api/axiosInstance';

interface DashboardData {
  wallet_balance: number | null;
  pending_requests: number;
  active_sessions: number;
}

export default function TutorDashboard() {
  const user = useSelector((state: RootState) => state.auth.user);
  const dispatch = useDispatch();
  const router = useRouter();

  const [dashboard, setDashboard] = useState<DashboardData>({
    wallet_balance: null,
    pending_requests: 0,
    active_sessions: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboardData = async () => {
    try {
      const res = await api.get('/accounts/tutor/dashboard/');
      setDashboard({
        wallet_balance: res.data.wallet_balance,
        pending_requests: res.data.pending_requests,
        active_sessions: res.data.active_sessions,
      });
    } catch (error) {
      console.error('Dashboard data fetch error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchDashboardData();
  };

  const handleLogout = async () => {
    try {
      await clearTokens();
      dispatch(logout());
      router.push('/entry');
    } catch (error) {
      console.error('Logout Error:', error);
    }
  };

  const formatCurrency = (amount: number | null) => {
    if (amount === null) return '--';
    return `₹${amount.toFixed(2)}`;
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Section */}
      <div className="bg-white shadow-sm px-6 py-4 border-b border-gray-100">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center text-2xl">
              🧑‍🏫
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-800">
                Hello, {user?.display_name || 'Tutor'}!
              </h1>
              <p className="text-sm text-gray-500">Ready to inspire minds today?</p>
            </div>
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-2 rounded-full hover:bg-gray-100 transition"
            aria-label="Refresh"
          >
            <svg
              className={`w-5 h-5 text-gray-600 ${refreshing ? 'animate-spin' : ''}`}
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
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {/* Stats Cards Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-green-500 rounded-2xl shadow-md p-5 text-center text-white">
            <div className="text-3xl mb-2">📋</div>
            <div className="text-2xl font-bold">{dashboard.pending_requests}</div>
            <div className="text-sm opacity-90">Pending Requests</div>
          </div>
          <div className="bg-orange-500 rounded-2xl shadow-md p-5 text-center text-white">
            <div className="text-3xl mb-2">🎓</div>
            <div className="text-2xl font-bold">{dashboard.active_sessions}</div>
            <div className="text-sm opacity-90">Active Sessions</div>
          </div>
          <div className="bg-blue-500 rounded-2xl shadow-md p-5 text-center text-white">
            <div className="text-3xl mb-2">💰</div>
            <div className="text-2xl font-bold">{formatCurrency(dashboard.wallet_balance)}</div>
            <div className="text-sm opacity-90">Wallet Balance</div>
          </div>
        </div>

        {/* Quick Actions Section */}
        <h2 className="text-xl font-semibold text-gray-800 mb-4">⚡ Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          <button
            onClick={() => router.push('/tutor/doubts')}
            className="bg-green-600 hover:bg-green-700 rounded-2xl p-5 shadow-md transition transform hover:-translate-y-1 text-white text-center"
          >
            <div className="text-4xl mb-2">📚</div>
            <div className="font-semibold">Browse Doubts</div>
            <div className="text-xs opacity-90">Find & place bids</div>
          </button>

          <button
            onClick={() => router.push('/tutor/requests')}
            className="bg-orange-500 hover:bg-orange-600 rounded-2xl p-5 shadow-md transition transform hover:-translate-y-1 text-white text-center"
          >
            <div className="text-4xl mb-2">📩</div>
            <div className="font-semibold">View Requests</div>
            <div className="text-xs opacity-90">
              {dashboard.pending_requests > 0
                ? `${dashboard.pending_requests} waiting`
                : 'No pending'}
            </div>
          </button>

          <button
            onClick={() => router.push('/tutor/sessions')}
            className="bg-teal-500 hover:bg-teal-600 rounded-2xl p-5 shadow-md transition transform hover:-translate-y-1 text-white text-center"
          >
            <div className="text-4xl mb-2">🎥</div>
            <div className="font-semibold">My Sessions</div>
            <div className="text-xs opacity-90">
              {dashboard.active_sessions > 0
                ? `${dashboard.active_sessions} ongoing`
                : 'No active'}
            </div>
          </button>

          <button
            onClick={() => router.push('/tutor/bid-doubts')}
            className="bg-purple-600 hover:bg-purple-700 rounded-2xl p-5 shadow-md transition transform hover:-translate-y-1 text-white text-center"
          >
            <div className="text-4xl mb-2">📊</div>
            <div className="font-semibold">Bid Doubts</div>
            <div className="text-xs opacity-90">Manage your bid doubts</div>
          </button>

          <button
            onClick={() => router.push('/tutor/fixed-doubts')}
            className="bg-red-500 hover:bg-red-600 rounded-2xl p-5 shadow-md transition transform hover:-translate-y-1 text-white text-center"
          >
            <div className="text-4xl mb-2">✅</div>
            <div className="font-semibold">Fixed Doubts</div>
            <div className="text-xs opacity-90">View your resolved doubts</div>
          </button>
        </div>

        {/* Pro Tip Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 flex items-start gap-4 mb-8">
          <div className="text-3xl">💡</div>
          <div>
            <h3 className="font-semibold text-gray-800">Pro Tip</h3>
            <p className="text-sm text-gray-600">
              Respond to requests within 5 minutes to increase your acceptance rate and earn the
              "Top Tutor" badge!
            </p>
          </div>
        </div>

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className="w-full sm:w-auto bg-red-500 hover:bg-red-600 text-white font-semibold py-3 px-8 rounded-full shadow-md transition mx-auto block"
        >
          🚪 Sign Out
        </button>
      </div>
    </div>
  );
}