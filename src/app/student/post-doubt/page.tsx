'use client';

import { useState, useEffect, Suspense, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { getTutors } from '@/services/tutorService';
import {
  postDoubt,
  getBalanceByCategory,
  getCreditCosts,
  getMyDoubts,
} from '@/services/v1Service';
import { connectSocket, disconnectSocket } from '@/services/versionSocketService';
import { getTokens } from '@/services/storageService';
import { dashboardCache } from '@/store/dashboardCache';
import { subscribeDashboard } from '@/store/dashboardRealtime';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';

// Types
interface Tutor {
  id: number;
  name?: string;
  display_name?: string;
  skills?: string;
  is_online?: boolean;
}

interface RecentDoubt {
  doubt_id: number;
  title: string;
  category: string;
  status: string;
  mode: string;
  created_at: string;
}

const DEFAULT_CATEGORIES = [
  'Programming', 'Python', 'Java', 'JavaScript', 'React', 'Django',
  'Data Structures', 'Algorithms', 'Database', 'SQL',
  'Machine Learning', 'Artificial Intelligence', 'Cloud Computing',
  'DevOps', 'Interview Preparation', 'Other',
];

// ===== LOADING FALLBACK =====
function LoadingFallback() {
  const { t } = useTranslation();
  return (
    <div className="p-4 text-center text-white">
      {t('common.loading') || 'Loading...'}
    </div>
  );
}

// ===== MAIN COMPONENT =====
function PostDoubtContent() {
  const { t } = useTranslation();
  const router = useRouter();
  const searchParams = useSearchParams();
  const tutorIdParam = searchParams.get('tutorId');
  const tutorNameParam = searchParams.get('tutorName');

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [customCategory, setCustomCategory] = useState('');
  const [mode, setMode] = useState<'pool' | 'specific'>('pool');
  const [preferredExplanation, setPreferredExplanation] = useState<'text' | 'live_video'>('text');
  const [selectedTutor, setSelectedTutor] = useState<Tutor | null>(null);
  const [tutors, setTutors] = useState<Tutor[]>([]);
  const [loadingTutors, setLoadingTutors] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showTutorModal, setShowTutorModal] = useState(false);
  const [recentDoubts, setRecentDoubts] = useState<RecentDoubt[]>([]);

  // Credit info state
  const [doubtCredits, setDoubtCredits] = useState<number>(0);
  const [doubtCreditCost, setDoubtCreditCost] = useState<number>(1);
  const [loadingCredits, setLoadingCredits] = useState(true);

  useEffect(() => {
    const unsubscribe = subscribeDashboard(() => {
      setRecentDoubts([...dashboardCache.recentDoubts]);
      setTutors([...dashboardCache.onlineTutors]);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (dashboardCache.loaded) {
      setRecentDoubts(dashboardCache.recentDoubts);
      return;
    }
    fetchRecentDoubts();
  }, []);

  // Pre‑fill tutor from query params
  useEffect(() => {
    if (tutorIdParam && tutorNameParam) {
      setMode('specific');
      setSelectedTutor({
        id: parseInt(tutorIdParam, 10),
        display_name: tutorNameParam,
      });
    }
  }, [tutorIdParam, tutorNameParam]);

  // Presence socket
  useEffect(() => {
    let mounted = true;

    const initSocket = async () => {
      const tokens = await getTokens();
      if (!tokens?.access) return;

      connectSocket(tokens.access, (event: string, data: any) => {
        if (!mounted) return;

        if (event === 'PRESENCE_UPDATE') {
          setTutors((prev) => {
            const updated = prev.map((t) =>
              t.id === data.user_id ? { ...t, is_online: data.is_online } : t
            );
            return updated.sort((a, b) => Number(b.is_online) - Number(a.is_online));
          });

          setSelectedTutor((prev) => {
            if (prev && prev.id === data.user_id) {
              return { ...prev, is_online: data.is_online };
            }
            return prev;
          });
        }
      });
    };

    initSocket();
    return () => {
      mounted = false;
      disconnectSocket();
    };
  }, []);

  // Load credit balance and cost
  useEffect(() => {
    loadCreditInformation();
  }, []);

  const loadCreditInformation = async () => {
    try {
      setLoadingCredits(true);
      const [balanceRes, costRes] = await Promise.all([
        getBalanceByCategory('doubts'),
        getCreditCosts(),
      ]);

      setDoubtCredits(balanceRes?.data?.balance ?? 0);

      const doubtCost = costRes?.data?.find(
        (item: any) => item.category_name?.toLowerCase() === 'doubt'
      );
      if (doubtCost) {
        setDoubtCreditCost(doubtCost.cost);
      }
    } catch (error) {
      console.error('Failed to load credit information:', error);
      // Fallback to default 1 credit cost if fetch fails
    } finally {
      setLoadingCredits(false);
    }
  };

  const fetchRecentDoubts = async () => {
    try {
      const res = await getMyDoubts({ page: 1 });
      const doubtsData = res?.results?.data || res?.data || [];
      const latest = doubtsData.slice(0, 5);
      dashboardCache.recentDoubts = latest;
      dashboardCache.loaded = true;
      setRecentDoubts(latest);
    } catch (error) {
      console.error('Recent doubts error:', error);
    }
  };

  const fetchTutors = async () => {
    setLoadingTutors(true);
    try {
      const response = await getTutors();
      let tutorsArray: Tutor[] = [];

      if (response.data && Array.isArray(response.data.data)) {
        tutorsArray = response.data.data;
      } else if (response.data && Array.isArray(response.data)) {
        tutorsArray = response.data;
      } else if (Array.isArray(response)) {
        tutorsArray = response;
      }

      const withPresence = tutorsArray.map((t) => ({
        ...t,
        is_online: t.is_online ?? false,
      }));
      withPresence.sort((a, b) => Number(b.is_online) - Number(a.is_online));
      dashboardCache.onlineTutors = withPresence;
      setTutors(withPresence);
    } catch (error) {
      console.error('Failed to fetch tutors:', error);
      toast.error(t('postDoubt.loadTutorsError') || 'Could not load tutors. Please check your connection.');
    } finally {
      setLoadingTutors(false);
    }
  };

  useEffect(() => {
    if (mode === 'specific' && tutors.length === 0 && !loadingTutors) {
      fetchTutors();
    }
  }, [mode]);

  const isSelectedTutorOnline = useCallback(() => {
    if (mode === 'specific' && selectedTutor) {
      return selectedTutor.is_online === true;
    }
    return false;
  }, [mode, selectedTutor]);

  // Submit flow – now credit‑based
  const handleSubmit = async () => {
    if (mode === 'specific' && selectedTutor && !selectedTutor.is_online) {
      toast.error(t('postDoubt.offlineError') || '⚠️ The selected tutor is offline. Please select an online tutor or post in the Doubt Pool.');
      return;
    }

    if (!title.trim()) {
      toast.error(t('postDoubt.enterTitle') || 'Please enter a title.');
      return;
    }
    if (!description.trim()) {
      toast.error(t('postDoubt.enterDescription') || 'Please describe your doubt.');
      return;
    }
    if (!category) {
      toast.error(t('postDoubt.selectCategory') || 'Please select a category.');
      return;
    }
    if (mode === 'specific' && !selectedTutor) {
      toast.error(t('postDoubt.selectTutor') || 'Please select a tutor.');
      return;
    }
    if (submitting) return;

    // Show confirmation with credit cost
    const confirmed = window.confirm(
      `💳 ${t('postDoubt.confirmPayment') || 'Use Credits'}\n\n` +
      `${t('postDoubt.costPerDoubt') || 'Cost'}: ${doubtCreditCost} ${t('postDoubt.doubtCredit') || 'Doubt Credit'}${doubtCreditCost > 1 ? 's' : ''}\n` +
      `${t('postDoubt.availableCredits') || 'Available'}: ${doubtCredits}\n\n` +
      `${t('postDoubt.continuePrompt') || 'Do you want to continue?'}`
    );
    if (!confirmed) return;

    setSubmitting(true);
    try {
      const payload: any = {
        title: title.trim(),
        description: description.trim(),
        category,
        mode,
        preferred_explanation: preferredExplanation,
      };
      if (mode === 'specific' && selectedTutor) {
        payload.selected_tutor = selectedTutor.id;
      }

      const postRes = await postDoubt(payload);
      const doubtId = postRes.data?.doubt_id || postRes.data?.id || postRes.doubt_id;
      if (!doubtId) throw new Error('Doubt ID missing from response');

      // Refresh credit info after successful deduction
      await loadCreditInformation();

      router.replace(`/student/matching?doubtId=${doubtId}`);
    } catch (err: any) {
      console.error('Post error:', err?.response?.data || err.message);
      const errorMessage =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        t('postDoubt.tryAgain') || 'Please try again.';

      if (
        errorMessage.toLowerCase().includes('insufficient') &&
        errorMessage.toLowerCase().includes('credit')
      ) {
        // Insufficient credits – show alert with option to buy credits
        const shouldBuy = window.confirm(
          `${t('postDoubt.insufficientCredits') || 'Insufficient Doubt Credits'}\n\n` +
          `${errorMessage}\n\n` +
          `${t('postDoubt.buyCreditsPrompt') || 'Would you like to buy more credits?'}`
        );
        if (shouldBuy) {
          router.push('/student/credits');
        }
      } else {
        toast.error(
          (t('postDoubt.submissionFailed') || 'Submission failed') + ': ' + errorMessage
        );
      }
    } finally {
      setSubmitting(false);
    }
  };

  // ---- Tutor Modal ----
  const renderTutorList = () => (
    <div className="max-h-[60vh] overflow-y-auto p-4">
      {loadingTutors ? (
        <div className="flex justify-center py-10">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-violet-400 border-t-transparent" />
        </div>
      ) : tutors.length === 0 ? (
        <p className="py-10 text-center text-white/50">{t('postDoubt.noTutors')}</p>
      ) : (
        <div className="space-y-3">
          {tutors.map((tutor) => {
            const isOnline = tutor.is_online === true;
            return (
              <button
                key={tutor.id}
                onClick={() => {
                  if (!isOnline) {
                    toast.error(t('postDoubt.offlineSelect') || '🔴 This tutor is offline. Please select an online tutor.');
                    return;
                  }
                  setSelectedTutor(tutor);
                  setShowTutorModal(false);
                }}
                className={`flex w-full items-center gap-4 rounded-xl border p-3 text-left transition ${
                  selectedTutor?.id === tutor.id
                    ? 'border-violet-400 bg-violet-400/20'
                    : isOnline
                    ? 'border-white/10 hover:bg-white/10'
                    : 'border-white/10 opacity-50 cursor-not-allowed'
                }`}
                disabled={!isOnline}
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white text-lg font-bold">
                  {(tutor.name || tutor.display_name || 'T').charAt(0).toUpperCase()}
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-white">
                    {tutor.name || tutor.display_name || 'Tutor'}
                  </p>
                  <p className="text-sm">
                    {isOnline ? '🟢 ' + t('postDoubt.online') : '🔴 ' + t('postDoubt.offlineUnselectable')} ·{' '}
                    {tutor.skills || 'Coding Tutor'}
                  </p>
                </div>
                {selectedTutor?.id === tutor.id && <span className="text-xl text-violet-400">✅</span>}
                {!isOnline && <span className="text-xl text-rose-400">🔒</span>}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e] relative overflow-hidden">
      {/* Animated blobs */}
      <div className="absolute top-0 -left-20 w-72 h-72 bg-purple-500/20 rounded-full mix-blend-multiply filter blur-3xl animate-blob" />
      <div className="absolute top-0 -right-20 w-72 h-72 bg-fuchsia-500/20 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000" />
      <div className="absolute -bottom-20 left-40 w-72 h-72 bg-cyan-500/20 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000" />

      <div className="relative z-10 mx-auto max-w-[1600px] px-6 pt-0 pb-6">
        <div className="flex flex-col gap-6 lg:flex-row">
          {/* --- MAIN FORM (LEFT) --- */}
          <div className="flex-1">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="rounded-3xl bg-white/5 backdrop-blur-xl border border-white/10 p-6 shadow-2xl md:p-8"
            >
              {/* Banner with credit info */}
              <div className="mb-8 overflow-hidden rounded-2xl bg-gradient-to-r from-violet-600 via-fuchsia-600 to-violet-700 p-6 text-white shadow-lg">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <h1 className="text-3xl font-bold">🚀 {t('postDoubt.postTitle')}</h1>
                    <p className="mt-2 text-violet-100">
                      {t('postDoubt.postSubtitle')}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="rounded-xl bg-white/10 px-5 py-3 backdrop-blur-sm">
                      <div className="text-xs text-violet-200">{t('postDoubt.avgResponseTime')}</div>
                      <div className="text-xl font-bold">{t('postDoubt.avgResponseValue')}</div>
                    </div>
                    {/* Credit info card */}
                    {!loadingCredits && (
                      <div className="rounded-xl bg-white/10 px-5 py-3 backdrop-blur-sm">
                        <div className="text-xs text-violet-200">💳 {t('postDoubt.availableCredits') || 'Available'}</div>
                        <div className="text-xl font-bold">{doubtCredits}</div>
                        <div className="text-xs text-violet-200 mt-1">⚡ {t('postDoubt.costPerDoubt') || 'Cost'}: {doubtCreditCost}</div>
                      </div>
                    )}
                    {loadingCredits && (
                      <div className="rounded-xl bg-white/10 px-5 py-3 backdrop-blur-sm">
                        <div className="h-6 w-20 animate-pulse rounded bg-white/20" />
                      </div>
                    )}
                  </div>
                </div>
                <div className="mt-6 grid gap-4 md:grid-cols-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">📝</span>
                    <span className="text-sm">{t('postDoubt.step1')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xl">👨‍🏫</span>
                    <span className="text-sm">{t('postDoubt.step2')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xl">🎯</span>
                    <span className="text-sm">{t('postDoubt.step3')}</span>
                  </div>
                </div>
              </div>

              {/* TITLE + CATEGORY */}
              <div className="mb-6 grid gap-4 lg:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-white/80">
                    {t('postDoubt.titleLabel')}
                  </label>
                  <input
                    type="text"
                    placeholder={t('postDoubt.titlePlaceholder')}
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    maxLength={200}
                    className="w-full rounded-xl border-2 border-white/20 bg-gray-900/60 px-4 py-3 text-white placeholder-white/40 focus:border-violet-400 focus:ring-4 focus:ring-violet-500/50 outline-none transition-all"
                  />
                  <p className="mt-1 text-right text-xs text-white/40">{title.length}/200</p>
                </div>
                <div>
                  <label className="mb-2 block text-sm font-semibold text-white/80">
                    {t('postDoubt.categoryLabel')}
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full rounded-xl border-2 border-white/20 bg-gray-900/60 px-4 py-3 text-white focus:border-violet-400 focus:ring-4 focus:ring-violet-500/50 outline-none transition-all appearance-none"
                  >
                    <option value="" className="bg-gray-900">{t('postDoubt.selectCategory')}</option>
                    {DEFAULT_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat} className="bg-gray-900">{cat}</option>
                    ))}
                  </select>
                  {category === 'Other' && (
                    <input
                      type="text"
                      value={customCategory}
                      onChange={(e) => setCustomCategory(e.target.value)}
                      placeholder={t('postDoubt.customCategoryPlaceholder')}
                      className="mt-3 w-full rounded-xl border-2 border-white/20 bg-gray-900/60 px-4 py-3 text-white placeholder-white/40 focus:border-violet-400 focus:ring-4 focus:ring-violet-500/50 outline-none transition-all"
                    />
                  )}
                </div>
              </div>

              {/* DESCRIPTION */}
              <div className="mb-6">
                <label className="mb-2 block text-sm font-semibold text-white/80">
                  {t('postDoubt.descriptionLabel')}
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={t('postDoubt.descriptionPlaceholder')}
                  maxLength={2000}
                  className="w-full rounded-xl border-2 border-white/20 bg-gray-900/60 px-4 py-3 text-white placeholder-white/40 focus:border-violet-400 focus:ring-4 focus:ring-violet-500/50 outline-none transition-all resize-y"
                />
                <div className="mt-2 flex justify-between text-xs text-white/40">
                  <span>{t('postDoubt.descriptionHint')}</span>
                  <span>{description.length}/2000</span>
                </div>
              </div>

              {/* EXPLANATION + MODE */}
              <div className="mb-6 grid gap-4 lg:grid-cols-2">
                <div>
                  <h3 className="mb-2 text-sm font-semibold text-white/80">
                    {t('postDoubt.preferredExplanationLabel')}
                  </h3>
                  <div className="space-y-3">
                    <button
                      type="button"
                      onClick={() => setPreferredExplanation('live_video')}
                      className={`w-full rounded-xl border p-4 text-left transition-all ${
                        preferredExplanation === 'live_video'
                          ? 'border-violet-400 bg-violet-400/20 text-violet-300'
                          : 'border-white/10 bg-white/5 text-white/70 hover:bg-white/10'
                      }`}
                    >
                      📹 {t('postDoubt.liveVideoOption')}
                    </button>
                    <button
                      type="button"
                      onClick={() => setPreferredExplanation('text')}
                      className={`w-full rounded-xl border p-4 text-left transition-all ${
                        preferredExplanation === 'text'
                          ? 'border-violet-400 bg-violet-400/20 text-violet-300'
                          : 'border-white/10 bg-white/5 text-white/70 hover:bg-white/10'
                      }`}
                    >
                      💬 {t('postDoubt.textChatOption')}
                    </button>
                  </div>
                </div>
                <div>
                  <h3 className="mb-2 text-sm font-semibold text-white/80">
                    {t('postDoubt.modeLabel')}
                  </h3>
                  <div className="space-y-3">
                    <button
                      type="button"
                      onClick={() => setMode('pool')}
                      className={`w-full rounded-xl border p-4 text-left transition-all ${
                        mode === 'pool'
                          ? 'border-violet-400 bg-violet-400/20 text-violet-300'
                          : 'border-white/10 bg-white/5 text-white/70 hover:bg-white/10'
                      }`}
                    >
                      📢 {t('postDoubt.doubtPool')}
                    </button>
                    <button
                      type="button"
                      onClick={() => setMode('specific')}
                      className={`w-full rounded-xl border p-4 text-left transition-all ${
                        mode === 'specific'
                          ? 'border-violet-400 bg-violet-400/20 text-violet-300'
                          : 'border-white/10 bg-white/5 text-white/70 hover:bg-white/10'
                      }`}
                    >
                      👨‍🏫 {t('postDoubt.specificTutor')}
                    </button>
                  </div>
                </div>
              </div>

              {/* 6. Select Tutor (only in Specific Mode) */}
              {mode === 'specific' && (
                <div className="mb-6">
                  <h3 className="mb-1 text-sm font-semibold text-white/80">{t('postDoubt.selectTutorLabel')}</h3>
                  {selectedTutor ? (
                    <div>
                      <button
                        onClick={() => setShowTutorModal(true)}
                        className={`flex w-full items-center gap-4 rounded-xl border p-3 text-left ${
                          selectedTutor.is_online
                            ? 'border-violet-400 bg-violet-400/20'
                            : 'border-rose-400/30 bg-rose-400/20'
                        }`}
                      >
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white text-lg font-bold">
                          {(selectedTutor.name || selectedTutor.display_name || 'T').charAt(0)}
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-white">
                            {selectedTutor.name || selectedTutor.display_name}
                          </p>
                          <p className={`text-sm ${selectedTutor.is_online ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {selectedTutor.is_online ? '🟢 ' + t('postDoubt.onlineNow') : '🔴 ' + t('postDoubt.currentlyOffline')}
                          </p>
                        </div>
                        <span className="text-xl text-violet-400">✏️</span>
                      </button>

                      {!selectedTutor.is_online && (
                        <div className="mt-3 rounded-lg border border-rose-400/30 bg-rose-400/10 p-4 text-sm backdrop-blur-md">
                          <p className="text-rose-300">
                            ⚠️ {t('postDoubt.offlineWarning')}
                          </p>
                          <div className="mt-3 flex flex-wrap gap-3">
                            <button
                              onClick={() => setShowTutorModal(true)}
                              className="rounded-lg bg-violet-500 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-600"
                            >
                              👨‍🏫 {t('postDoubt.viewOnlineTutors')}
                            </button>
                            <button
                              onClick={() => setMode('pool')}
                              className="rounded-lg border border-violet-400/30 bg-white/10 px-4 py-2 text-sm font-semibold text-white hover:bg-white/20"
                            >
                              📢 {t('postDoubt.switchToPool')}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <button
                      onClick={() => setShowTutorModal(true)}
                      className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-violet-400/40 bg-white/5 p-4 text-violet-300 transition hover:bg-white/10"
                    >
                      <span className="text-2xl">➕</span>
                      <span className="font-medium">{t('postDoubt.pickTutor')}</span>
                    </button>
                  )}
                </div>
              )}

              {/* Submit Button */}
              <button
                onClick={handleSubmit}
                disabled={Boolean(submitting || (mode === 'specific' && selectedTutor?.is_online === false))}
                className={`mt-4 flex w-full items-center justify-center gap-2 rounded-xl py-3 font-bold text-white shadow-lg transition ${
                  submitting || (mode === 'specific' && selectedTutor?.is_online === false)
                    ? 'bg-violet-400/50 cursor-not-allowed'
                    : 'bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:from-violet-600 hover:to-fuchsia-600 shadow-violet-500/25'
                }`}
              >
                {submitting ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    {t('common.loading') || 'Submitting...'}
                  </div>
                ) : (
                  '🚀 ' + t('postDoubt.postDoubt')
                )}
              </button>
            </motion.div>
          </div>

          {/* --- RIGHT SIDEBAR --- */}
          <div className="hidden w-80 shrink-0 flex-col gap-6 lg:flex">
            {/* Recent Doubts Posted */}
            <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-6 shadow-2xl">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-bold text-white">{t('postDoubt.recentDoubtsPosted')}</h3>
                <button
                  onClick={() => router.push('/student/my-doubts')}
                  className="text-xs font-semibold text-violet-300 hover:underline"
                >
                  {t('common.viewAll')}
                </button>
              </div>
              <div className="space-y-4">
                {recentDoubts.map((doubt) => (
                  <div key={doubt.doubt_id} className="rounded-xl p-3 transition hover:bg-white/10">
                    <div className="flex items-center gap-2 text-[10px] font-semibold text-white/50">
                      <span className="text-violet-400">⬇️</span> {doubt.mode === 'specific' ? t('postDoubt.specificTutor') : t('postDoubt.doubtPool')}
                    </div>
                    <p className="text-sm font-semibold text-white">{doubt.title}</p>
                    <div className="mt-1 flex items-center justify-between text-[10px] text-white/40">
                      <span>{doubt.category}</span>
                      <span>• {new Date(doubt.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </div>
              <button
                onClick={() => router.push('/student/my-doubts')}
                className="mt-4 w-full rounded-lg bg-violet-500/20 py-2 text-center text-xs font-semibold text-violet-300 border border-violet-400/30 hover:bg-violet-500/30 transition"
              >
                {t('postDoubt.viewAllDoubts')}
              </button>
            </div>
          </div>
        </div>

        {/* Tutor Modal */}
        <AnimatePresence>
          {showTutorModal && (
            <motion.div
              className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm sm:items-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowTutorModal(false)}
            >
              <motion.div
                className="w-full max-w-md rounded-t-2xl bg-[#1a1530] border border-white/10 backdrop-blur-2xl shadow-2xl sm:rounded-2xl"
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
                  <h3 className="text-xl font-bold text-white">👨‍🏫 {t('postDoubt.chooseTutor')}</h3>
                  <button
                    onClick={() => setShowTutorModal(false)}
                    className="text-2xl text-white/50 hover:text-white"
                  >
                    ❌
                  </button>
                </div>
                {renderTutorList()}
                <p className="border-t border-white/10 px-5 py-3 text-center text-xs text-white/40">
                  🟢 {t('postDoubt.online')} · 🔴 {t('postDoubt.offlineUnselectable')}
                </p>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ===== EXPORT =====
export default function PostDoubtPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <PostDoubtContent />
    </Suspense>
  );
}