'use client';

import { useEffect, useState, useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { useRouter } from 'next/navigation';
import { logout } from '@/redux/slices/authSlice';
import { clearTokens } from '@/services/storageService';
import api from '@/api/axiosInstance';
import toast from 'react-hot-toast';

interface AdminStats {
  totalUsers: number;
  totalTutors: number;
  totalSessions: number;
  totalRevenue: number;
  pendingTutors: number;
  reportedDoubts: number;
}

export default function AdminDashboard() {
  const dispatch = useDispatch();
  const router = useRouter();

  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    totalTutors: 0,
    totalSessions: 0,
    totalRevenue: 0,
    pendingTutors: 0,
    reportedDoubts: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboardStats = useCallback(async () => {
    try {
      // Fetch admin statistics from backend
      const response = await api.get('/admin/dashboard/stats/');
      const data = response.data;
      setStats({
        totalUsers: data.total_users || 0,
        totalTutors: data.total_tutors || 0,
        totalSessions: data.total_sessions || 0,
        totalRevenue: data.total_revenue || 0,
        pendingTutors: data.pending_tutors || 0,
        reportedDoubts: data.reported_doubts || 0,
      });
    } catch (error) {
      console.error('Failed to fetch admin stats:', error);
      toast.error('Could not load dashboard data.');
      // Fallback to dummy data for demo (remove in production)
      setStats({
        totalUsers: 1248,
        totalTutors: 342,
        totalSessions: 1890,
        totalRevenue: 45280,
        pendingTutors: 12,
        reportedDoubts: 5,
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardStats();
  }, [fetchDashboardStats]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchDashboardStats();
  };

  const handleLogout = async () => {
    try {
      await clearTokens();
      dispatch(logout());
      router.push('/entry');
    } catch (error) {
      toast.error('Logout failed. Please try again.');
    }
  };

  if (loading && !refreshing) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
          <p className="mt-4 text-gray-600">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-min-h-[100dvh] bg-gray-50">
      {/* Gradient Header */}
      <div className="bg-gradient-to-r from-gray-800 to-gray-900 pb-6 pt-10 shadow-lg">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/20">
                <span className="text-2xl font-bold text-white">A</span>
              </div>
              <div>
                <p className="text-sm text-gray-300">Admin Panel</p>
                <h1 className="text-xl font-bold text-white">Dashboard</h1>
                <div className="mt-1 flex items-center gap-1 rounded-full bg-white/20 px-2 py-0.5 text-xs text-white">
                  <span>🛡️</span> Administrator
                </div>
              </div>
            </div>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="rounded-full bg-white/15 p-2 text-white hover:bg-white/25 disabled:opacity-50"
            >
              <svg
                className={`h-5 w-5 ${refreshing ? 'animate-spin' : ''}`}
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
      </div>

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        {/* Stats Cards */}
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-2xl bg-white p-5 shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Users</p>
                <p className="text-3xl font-bold text-gray-800">{stats.totalUsers}</p>
              </div>
              <span className="text-3xl">👥</span>
            </div>
          </div>
          <div className="rounded-2xl bg-white p-5 shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Tutors</p>
                <p className="text-3xl font-bold text-gray-800">{stats.totalTutors}</p>
              </div>
              <span className="text-3xl">🧑‍🏫</span>
            </div>
          </div>
          <div className="rounded-2xl bg-white p-5 shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Sessions</p>
                <p className="text-3xl font-bold text-gray-800">{stats.totalSessions}</p>
              </div>
              <span className="text-3xl">🎥</span>
            </div>
          </div>
          <div className="rounded-2xl bg-white p-5 shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Revenue (₹)</p>
                <p className="text-3xl font-bold text-gray-800">
                  ₹{stats.totalRevenue.toLocaleString()}
                </p>
              </div>
              <span className="text-3xl">💰</span>
            </div>
          </div>
          <div className="rounded-2xl bg-white p-5 shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Pending Tutor Approvals</p>
                <p className="text-3xl font-bold text-amber-600">{stats.pendingTutors}</p>
              </div>
              <span className="text-3xl">⏳</span>
            </div>
          </div>
          <div className="rounded-2xl bg-white p-5 shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Reported Doubts</p>
                <p className="text-3xl font-bold text-red-600">{stats.reportedDoubts}</p>
              </div>
              <span className="text-3xl">⚠️</span>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <h2 className="mb-3 text-xl font-bold text-gray-800">⚡ Admin Actions</h2>
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <button
            onClick={() => router.push('/admin/users')}
            className="rounded-2xl bg-gradient-to-r from-blue-500 to-blue-600 p-5 text-center text-white shadow-md transition hover:-translate-y-1"
          >
            <div className="text-3xl">👥</div>
            <div className="mt-2 font-semibold">Manage Users</div>
            <div className="text-xs opacity-90">View, edit, or suspend accounts</div>
          </button>
          <button
            onClick={() => router.push('/admin/tutors')}
            className="rounded-2xl bg-gradient-to-r from-green-500 to-green-600 p-5 text-center text-white shadow-md transition hover:-translate-y-1"
          >
            <div className="text-3xl">🧑‍🏫</div>
            <div className="mt-2 font-semibold">Tutor Approvals</div>
            <div className="text-xs opacity-90">
              {stats.pendingTutors > 0
                ? `${stats.pendingTutors} pending`
                : 'No pending approvals'}
            </div>
          </button>
          <button
            onClick={() => router.push('/admin/doubts')}
            className="rounded-2xl bg-gradient-to-r from-purple-500 to-purple-600 p-5 text-center text-white shadow-md transition hover:-translate-y-1"
          >
            <div className="text-3xl">❓</div>
            <div className="mt-2 font-semibold">Reported Doubts</div>
            <div className="text-xs opacity-90">
              {stats.reportedDoubts > 0
                ? `${stats.reportedDoubts} flagged`
                : 'No reports'}
            </div>
          </button>
          <button
            onClick={() => router.push('/admin/sessions')}
            className="rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 p-5 text-center text-white shadow-md transition hover:-translate-y-1"
          >
            <div className="text-3xl">🎥</div>
            <div className="mt-2 font-semibold">All Sessions</div>
            <div className="text-xs opacity-90">Monitor ongoing & past sessions</div>
          </button>
          <button
            onClick={() => router.push('/admin/reports')}
            className="rounded-2xl bg-gradient-to-r from-red-500 to-red-600 p-5 text-center text-white shadow-md transition hover:-translate-y-1"
          >
            <div className="text-3xl">📊</div>
            <div className="mt-2 font-semibold">Analytics & Reports</div>
            <div className="text-xs opacity-90">Platform usage & revenue reports</div>
          </button>
          <button
            onClick={() => router.push('/admin/settings')}
            className="rounded-2xl bg-gradient-to-r from-gray-500 to-gray-600 p-5 text-center text-white shadow-md transition hover:-translate-y-1"
          >
            <div className="text-3xl">⚙️</div>
            <div className="mt-2 font-semibold">Platform Settings</div>
            <div className="text-xs opacity-90">Configure fees, policies, etc.</div>
          </button>
        </div>

        {/* Insight Card */}
        <div className="mb-8 rounded-2xl bg-indigo-50 p-5">
          <div className="flex items-start gap-3">
            <span className="text-2xl">💡</span>
            <div>
              <h3 className="font-semibold text-indigo-800">Admin Tip</h3>
              <p className="text-sm text-gray-700">
                Regularly review pending tutor approvals and reported doubts to maintain platform quality. 
                You can also export analytics from the Reports section.
              </p>
            </div>
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