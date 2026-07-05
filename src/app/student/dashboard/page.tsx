'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';
import { RootState } from '@/redux/store';
import {
  getStudentDashboard,
  getOnlineTutors,
  getCurrentAffairs,
  CurrentAffair,
  getMyDoubts,
} from '@/services/v1Service';
import toast from 'react-hot-toast';
import { dashboardCache } from '@/store/dashboardCache';
import { subscribeDashboard } from '@/store/dashboardRealtime';
import PostDoubtModal from '@/components/dashboard/PostDoubtModal';
import { connectSocket } from '@/services/versionSocketService';
import { updateDashboardCache } from '@/store/dashboardEvents';
import { getStudentProfile } from "@/services/v1Service";
import { useTranslation } from 'react-i18next'; // ✅ added

interface OnlineTutor {
  id: number;
  display_name: string;
  skills: string;
  experience: number;
  average_rating: number;
  total_reviews: number;
  is_verified: boolean;
  is_top_tutor: boolean;
  is_online: boolean;
}

interface RecentDoubt {
  doubt_id: number;
  title: string;
  category: string;
  preferred_explanation: string;
  status: string;
  mode: string;
  tutor: string | null;
  created_at: string;
  session?: {
    session_id: number;
    status: string;
    session_type: string;
  };
}

export default function DashboardPage() {
  const { t } = useTranslation(); // ✅ added
  const router = useRouter();
  const [currentPrice, setCurrentPrice] = useState<number | null>(null);
  const [loading, setLoading] = useState(!dashboardCache.loaded);

  const [onlineTutors, setOnlineTutors] = useState<OnlineTutor[]>([]);
  const [selectedTutor, setSelectedTutor] = useState<OnlineTutor | null>(null);
  const [showTutorProfile, setShowTutorProfile] = useState(false);
  const [currentAffairs, setCurrentAffairs] = useState<CurrentAffair[]>([]);
  const [showPostModal, setShowPostModal] = useState(false);
  const [quickDoubt, setQuickDoubt] = useState('');
  const [recentDoubts, setRecentDoubts] = useState<RecentDoubt[]>([]);

  const [showProfileAlert, setShowProfileAlert] = useState(false);
  const [checkingProfile, setCheckingProfile] = useState(true);

  useEffect(() => {
    const checkStudentProfile = async () => {
      try {
        const profile = await getStudentProfile();
        if (!profile.data.profile_completed) {
          setShowProfileAlert(true);
          return;
        }
        fetchDashboardData();
      } catch (err) {
        toast.error(t('studentHome.profileError') || "Unable to verify your profile.");
        router.replace("/student/profile");
      } finally {
        setCheckingProfile(false);
        const lastShown = localStorage.getItem("profile_reminder_time");
        if (lastShown) {
          const diff = Date.now() - Number(lastShown);
          const HOURS_24 = 24 * 60 * 60 * 1000;
          if (diff < HOURS_24) {
            await fetchDashboardData();
            return;
          }
        }
        setShowProfileAlert(true);
        await fetchDashboardData();
      }
    };
    checkStudentProfile();
  }, []);

  const fetchDashboardData = useCallback(async () => {
    try {
      const res = await getStudentDashboard();
      const data = res.data || res;
      dashboardCache.currentPrice = data.current_price;
      setCurrentPrice(data.current_price ?? null);

      const currentAffairsRes = await getCurrentAffairs();
      const affairsData = (currentAffairsRes?.data || []).filter((item: CurrentAffair) => {
        const createdAt = new Date(item.created_at);
        const now = new Date();
        const diffHours = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);
        return diffHours <= 24;
      });
      dashboardCache.currentAffairs = affairsData;
      setCurrentAffairs(affairsData);

      const doubtsRes = await getMyDoubts({ page: 1 });
      const doubtsData = doubtsRes?.results?.data || doubtsRes?.data || [];
      dashboardCache.recentDoubts = doubtsData.slice(0, 6);
      setRecentDoubts(doubtsData.slice(0, 6));

      const tutorsRes = await getOnlineTutors();
      const tutorsData = tutorsRes?.data || [];
      console.log('ONLINE TUTORS API', tutorsData);
      dashboardCache.onlineTutors = tutorsData;
      setOnlineTutors(tutorsData);
    } catch (error) {
      console.error('Dashboard fetch error:', error);
      toast.error(t('studentHome.dashboardError') || 'Could not load dashboard data.');
    } finally {
      setLoading(false);
    }
    dashboardCache.loaded = true;
    dashboardCache.lastFetched = Date.now();
  }, [t]);

  useEffect(() => {
    const unsubscribe = subscribeDashboard(() => {
      console.log('🔄 Dashboard Realtime Update');
      setOnlineTutors([...dashboardCache.onlineTutors]);
      setRecentDoubts([...dashboardCache.recentDoubts]);
      setCurrentAffairs([...dashboardCache.currentAffairs]);
      setCurrentPrice(dashboardCache.currentPrice);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    const refreshTutors = async () => {
      try {
        const tutorsRes = await getOnlineTutors();
        const tutorsData = tutorsRes?.data || [];
        console.log('REFRESHED TUTORS', tutorsData);
        dashboardCache.onlineTutors = tutorsData;
        setOnlineTutors(tutorsData);
      } catch (err) {
        console.error('Tutor refresh failed', err);
      }
    };
    const handleRefresh = () => {
      refreshTutors();
    };
    window.addEventListener('refresh-online-tutors', handleRefresh);
    return () => window.removeEventListener('refresh-online-tutors', handleRefresh);
  }, []);

  useEffect(() => {
    if (dashboardCache.loaded) {
      setCurrentPrice(dashboardCache.currentPrice);
      setOnlineTutors(dashboardCache.onlineTutors);
      setCurrentAffairs(dashboardCache.currentAffairs);
      setRecentDoubts(dashboardCache.recentDoubts);
      return;
    }
    fetchDashboardData();
  }, []);

  if (loading || checkingProfile) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-violet-400 border-t-transparent" />
          <p className="mt-2 text-sm text-white/70">{t('studentHome.loading')}</p>
        </div>
      </div>
    );
  }

  const getTimeAgo = (dateString: string) => {
    const created = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - created.getTime();
    const minutes = Math.floor(diffMs / (1000 * 60));
    const hours = Math.floor(diffMs / (1000 * 60 * 60));

    if (minutes < 60) {
      return `${minutes} ${t('studentHome.minAgo')}`;
    }
    if (hours < 24) {
      return `${hours} ${t('studentHome.hrAgo')}`;
    }
    return created.toLocaleDateString();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e] relative overflow-hidden">
      {/* Animated background blobs */}
      <div className="absolute top-0 -left-20 w-72 h-72 bg-purple-500/20 rounded-full mix-blend-multiply filter blur-3xl animate-blob" />
      <div className="absolute top-0 -right-20 w-72 h-72 bg-fuchsia-500/20 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000" />
      <div className="absolute -bottom-20 left-40 w-72 h-72 bg-cyan-500/20 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000" />

      <div className="relative z-10 flex flex-col gap-6 xl:flex-row p-4 sm:p-6 lg:p-8">
        {/* MAIN CONTENT COLUMN */}
        <div className="flex-1 min-w-0">
          {/* Hero Banner */}
          <div className="relative mb-6 flex flex-col-reverse items-center justify-between overflow-hidden rounded-3xl bg-white/5 backdrop-blur-xl border border-white/10 p-6 md:p-8 md:flex-row shadow-2xl">
            <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 rounded-full blur-2xl" />
            <div className="z-10 text-center md:text-left">
              <h1 className="text-2xl font-bold leading-tight text-transparent bg-clip-text bg-gradient-to-r from-violet-300 via-fuchsia-300 to-cyan-300 md:text-3xl lg:text-4xl">
                {t('studentHome.heroTitle')}
              </h1>
              <p className="mt-2 text-sm text-white/70">
                {t('studentHome.heroSubtitle')}
              </p>
              <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
                <button
                  onClick={() => router.push('/student/post-doubt')}
                  className="rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 px-6 py-2.5 font-bold text-white shadow-lg shadow-violet-500/25 hover:from-violet-600 hover:to-fuchsia-600 transition-all"
                >
                  🚀 {t('sidebar.askDoubt')}
                </button>
                <button className="rounded-full border border-white/20 px-6 py-2.5 font-semibold text-white hover:bg-white/10 transition-all">
                  ▶️ {t('studentHome.howItWorks')}
                </button>
              </div>
            </div>
            <div className="relative mb-4 md:mb-0">
              <div className="h-32 w-32 rounded-xl bg-gradient-to-b from-indigo-400 to-purple-500 opacity-30 blur-xl md:h-40 md:w-40" />
              <div className="absolute inset-0 flex items-center justify-center text-5xl text-white/80 md:text-6xl">🧑‍💻</div>
            </div>
          </div>

          {/* Ask a Doubt Widget */}
          <div className="mb-8 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 p-4 md:p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-white">{t('studentHome.explainDoubtTitle')}</h3>
                <p className="text-xs text-white/50">{t('studentHome.explainDoubtSub')}</p>
              </div>
              <div className="flex items-center gap-1 rounded-full bg-emerald-400/20 px-3 py-1 text-xs font-bold text-emerald-300 border border-emerald-400/30">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span> {t('studentHome.avgConnectTime', { seconds: 45 })}
              </div>
            </div>
            <div className="rounded-xl bg-white/10 border border-white/10 p-4">
              <textarea
                value={quickDoubt}
                onChange={(e) => setQuickDoubt(e.target.value)}
                placeholder={t('studentHome.explainPlaceholder')}
                className="min-h-[120px] w-full rounded-2xl border-2 border-white/20 bg-gray-900/60 p-5 text-white placeholder-white/40 shadow-sm outline-none transition-all focus:border-violet-400 focus:ring-4 focus:ring-violet-500/50"
              />
              <div className="mt-3 flex flex-wrap items-center justify-between gap-4 border-t border-white/10 pt-3">
                <div className="flex gap-2"></div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => {
                      if (!quickDoubt.trim()) {
                        toast.error(t('studentHome.pleaseDescribeDoubt'));
                        return;
                      }
                      setShowPostModal(true);
                    }}
                    className="rounded-2xl bg-gradient-to-r from-violet-500 to-fuchsia-500 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-violet-500/25 hover:scale-[1.02] transition-all"
                  >
                    🚀 {t('studentHome.findExperts')}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Doubts */}
          <div className="rounded-3xl bg-white/5 backdrop-blur-xl border border-white/10 p-5 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-white">📚 {t('studentHome.recentDoubtsTitle')}</h2>
                <p className="text-xs text-white/50">{t('studentHome.recentDoubtsSub')}</p>
              </div>
              <button
                onClick={() => router.push('/student/my-doubts')}
                className="text-sm font-semibold text-violet-300 hover:text-violet-200"
              >
                {t('common.viewAll')}
              </button>
            </div>

            {recentDoubts.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-white/20 p-8 text-center">
                <p className="text-sm text-white/50">{t('studentHome.noRecentDoubts')}</p>
              </div>
            ) : (
              <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
                {recentDoubts.map((doubt) => (
                  <button
                    key={doubt.doubt_id}
                    onClick={() =>
                      router.push(`/student/my-doubts/${doubt.doubt_id}`)
                    }
                    className="min-w-[280px] flex-shrink-0 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-4 text-left shadow-lg transition-all hover:-translate-y-1 hover:border-violet-400/40 hover:shadow-xl"
                  >
                    <div className="mb-3 flex items-center justify-between">
                      <span className="rounded-full bg-violet-400/20 px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-violet-300 border border-violet-400/30">
                        {doubt.category}
                      </span>
                      <span
                        className={`rounded-full px-2 py-1 text-[10px] font-bold ${
                          doubt.status === 'completed'
                            ? 'bg-emerald-400/20 text-emerald-300 border border-emerald-400/30'
                            : 'bg-amber-400/20 text-amber-300 border border-amber-400/30'
                        }`}
                      >
                        {doubt.status === 'completed' ? t('myDoubts.completed') : t('myDoubts.open')}
                      </span>
                    </div>
                    <h3 className="line-clamp-2 text-base font-bold text-white">
                      {doubt.title}
                    </h3>
                    <p className="mt-2 text-sm text-white/50">
                      👨‍🏫 {doubt.tutor || t('myDoubts.notAssigned')}
                    </p>
                    <div className="mt-3 flex items-center gap-2 text-xs text-white/40">
                      <span>
                        {doubt.session?.session_type === 'live_video' ? '🎥 ' + t('myDoubts.liveVideo') : '💬 ' + t('myDoubts.textChat')}
                      </span>
                      <span>•</span>
                      <span>{doubt.mode === 'specific' ? t('myDoubts.specific') : t('myDoubts.pool')}</span>
                    </div>
                    <p className="mt-4 text-xs text-white/30">
                      {new Date(doubt.created_at).toLocaleDateString()}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT SIDEBAR */}
        <aside className="hidden xl:flex xl:w-80 xl:flex-col xl:gap-6 xl:sticky xl:top-20 self-start">
          {/* Live Tutors */}
          <div>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-base font-bold text-white">{t('studentHome.liveTutorsTitle')}</h3>
              <button
                onClick={() => router.push('/student/tutors')}
                className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm font-semibold text-cyan-300 hover:bg-white/10 hover:text-cyan-200 transition-all"
              >
                {t('common.viewAll')}
                <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            <div className="max-h-[350px] space-y-3 overflow-y-auto pr-2 scrollbar-hide">
              {onlineTutors.length === 0 && (
                <div className="rounded-xl border border-dashed border-white/20 bg-white/5 backdrop-blur-md p-6 text-center">
                  <p className="text-sm text-white/50">{t('studentHome.noTutorsOnline')}</p>
                </div>
              )}

              {onlineTutors.map((tutor) => (
                <div
                  key={tutor.id}
                  onClick={() => {
                    setSelectedTutor(tutor);
                    setShowTutorProfile(true);
                  }}
                  className="flex cursor-pointer items-center justify-between rounded-xl border border-white/10 bg-white/5 backdrop-blur-md p-3 shadow-lg transition hover:border-violet-400/40 hover:shadow-xl"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 text-sm font-bold text-white shadow-lg">
                      {tutor.display_name.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center gap-1">
                        <p className="text-sm font-bold text-white">{tutor.display_name}</p>
                        {tutor.is_verified && <span title={t('studentHome.verified')}>✅</span>}
                        {tutor.is_top_tutor && <span title={t('studentHome.topTutor')}>⭐</span>}
                      </div>
                      <p className="max-w-[180px] truncate text-[11px] text-white/50">{tutor.skills}</p>
                      <div className="mt-1 flex items-center gap-2 text-[10px] text-white/40">
                        <span>⭐ {tutor.average_rating || 0}</span>
                        <span>• {tutor.total_reviews} {t('studentHome.reviews')}</span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(
                        `/student/post-doubt?tutorId=${tutor.id}&tutorName=${encodeURIComponent(
                          tutor.display_name
                        )}`
                      );
                    }}
                    className="rounded-lg bg-violet-500/20 px-3 py-1.5 text-[11px] font-bold text-violet-300 border border-violet-400/30 hover:bg-violet-500/30 transition-all"
                  >
                    {t('studentHome.requestButton')}
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Current Affairs */}
          <div className="max-h-[650px] space-y-4 overflow-y-auto pr-2 scrollbar-hide">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-white">📰 {t('currentAffairs.title')}</h2>
                <p className="text-xs text-white/50">{t('currentAffairs.subtitle')}</p>
              </div>
              <button
                onClick={() => router.push('/student/current-affairs')}
                className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm font-semibold text-cyan-300 hover:bg-white/10 hover:text-cyan-200 transition-all"
              >
                {t('common.viewAll')}
                <span className="rounded-full bg-violet-500/20 px-2 py-0.5 text-[10px] text-violet-300 border border-violet-400/30">
                  {currentAffairs.length}
                </span>
              </button>
            </div>

            {currentAffairs.length === 0 && (
              <div className="rounded-xl border border-dashed border-white/20 bg-white/5 backdrop-blur-md p-6 text-center">
                <p className="text-sm text-white/50">{t('currentAffairs.empty')}</p>
              </div>
            )}

            <div className="space-y-4">
              {currentAffairs.slice(0, 5).map((item) => (
                <div
                  key={item.id}
                  onClick={() => router.push(`/student/current-affairs/`)}
                  className="cursor-pointer overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md transition hover:border-violet-400/40 hover:shadow-xl"
                >
                  {item.image_url && (
                    <img
                      src={item.image_url}
                      alt={item.title}
                      className="h-44 w-full object-cover"
                    />
                  )}
                  <div className="p-4">
                    <span className="inline-block rounded-full bg-violet-400/20 px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-violet-300 border border-violet-400/30">
                      {item.category}
                    </span>
                    <h3 className="mt-3 text-base font-bold text-white">{item.title}</h3>
                    <p className="mt-2 line-clamp-3 text-sm leading-6 text-white/70">{item.description}</p>
                    <div className="mt-4 flex items-center justify-between">
                      <span className="rounded-full bg-white/10 px-2 py-1 text-[10px] font-semibold text-white/50">
                        🕒 {getTimeAgo(item.created_at)}
                      </span>
                      <span className="text-[11px] text-white/30">
                        {new Date(item.created_at).toLocaleString([], {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </aside>

        {/* Tutor Profile Modal */}
        {showTutorProfile && selectedTutor && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
            onClick={() => setShowTutorProfile(false)}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md rounded-3xl bg-white/5 backdrop-blur-xl border border-white/10 p-6 shadow-2xl"
            >
              <div className="text-center">
                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 text-3xl font-bold text-white shadow-lg">
                  {selectedTutor.display_name.charAt(0)}
                </div>
                <h2 className="mt-4 text-2xl font-bold text-white">{selectedTutor.display_name}</h2>
                <p className="mt-1 text-sm text-white/70">{selectedTutor.skills}</p>
                <div className="mt-3 flex justify-center gap-2">
                  {selectedTutor.is_online && (
                    <span className="rounded-full bg-emerald-400/20 px-3 py-1 text-xs font-bold text-emerald-300 border border-emerald-400/30">
                      🟢 {t('studentHome.online')}
                    </span>
                  )}
                  {selectedTutor.is_verified && (
                    <span className="rounded-full bg-sky-400/20 px-3 py-1 text-xs font-bold text-sky-300 border border-sky-400/30">
                      ✅ {t('studentHome.verified')}
                    </span>
                  )}
                  {selectedTutor.is_top_tutor && (
                    <span className="rounded-full bg-amber-400/20 px-3 py-1 text-xs font-bold text-amber-300 border border-amber-400/30">
                      ⭐ {t('studentHome.topTutor')}
                    </span>
                  )}
                </div>
              </div>

              <div className="mt-6 grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-xl font-bold text-white">{selectedTutor.experience}</p>
                  <p className="text-xs text-white/50">{t('studentHome.years')}</p>
                </div>
                <div>
                  <p className="text-xl font-bold text-white">⭐ {selectedTutor.average_rating}</p>
                  <p className="text-xs text-white/50">{t('studentHome.rating')}</p>
                </div>
                <div>
                  <p className="text-xl font-bold text-white">{selectedTutor.total_reviews}</p>
                  <p className="text-xs text-white/50">{t('studentHome.reviews')}</p>
                </div>
              </div>

              <button
                onClick={() =>
                  router.push(
                    `/student/post-doubt?tutorId=${selectedTutor.id}&tutorName=${encodeURIComponent(
                      selectedTutor.display_name
                    )}`
                  )
                }
                className="mt-6 w-full rounded-2xl bg-gradient-to-r from-violet-500 to-fuchsia-500 py-3 font-bold text-white shadow-lg shadow-violet-500/25 hover:from-violet-600 hover:to-fuchsia-600 transition-all"
              >
                🚀 {t('studentHome.requestDoubtButton')}
              </button>
            </div>
          </div>
        )}

        <PostDoubtModal
          open={showPostModal}
          description={quickDoubt}
          onDescriptionChange={setQuickDoubt}
          onClose={() => setShowPostModal(false)}
        />
      </div>

      {showProfileAlert && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl">
            <div className="text-center">
              <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-violet-100 text-5xl">
                🎓
              </div>
              <h2 className="text-2xl font-bold text-gray-900">
                {t('studentHome.welcome')}
              </h2>
              <p className="mt-4 text-gray-600 leading-7">
                {t('studentHome.completeProfileDesc')}
                <br /><br />
                {t('studentHome.thisHelps')}
              </p>
              <div className="mt-5 space-y-2 text-left text-sm text-gray-700">
                <p>✅ {t('studentHome.matchTutors')}</p>
                <p>✅ {t('studentHome.recommendSubjects')}</p>
                <p>✅ {t('studentHome.personalizeJourney')}</p>
                <p>✅ {t('studentHome.connectFaster')}</p>
              </div>
              <div className="mt-8 flex gap-3">
                <button
                  onClick={() => {
                    setShowProfileAlert(false);
                    localStorage.setItem(
                      "profile_reminder_time",
                      Date.now().toString()
                    );
                  }}
                  className="flex-1 rounded-2xl border border-gray-300 py-3 font-semibold text-gray-700 transition hover:bg-gray-100"
                >
                  {t('studentHome.askLater')}
                </button>
                <button
                  onClick={() => {
                    router.replace("/student/profile");
                  }}
                  className="flex-1 rounded-2xl bg-gradient-to-r from-violet-600 to-fuchsia-600 py-3 font-semibold text-white transition hover:opacity-90"
                >
                  {t('studentHome.completeProfile')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}