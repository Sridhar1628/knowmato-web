'use client';

import { useState, useEffect, Suspense, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { getTutors } from '@/services/tutorService';
import {
  postDoubt,
  getCurrentPrice,
  paymentSuccess,
  getMyDoubts,
} from '@/services/v1Service';
import { connectSocket, disconnectSocket } from '@/services/versionSocketService';
import { getTokens } from '@/services/storageService';
import { dashboardCache } from '@/store/dashboardCache';
import { subscribeDashboard } from '@/store/dashboardRealtime';

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

function PostDoubtContent() {
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
      alert('Could not load tutors. Please check your connection.');
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

  // Submit flow
  const handleSubmit = async () => {
    if (mode === 'specific' && selectedTutor && !selectedTutor.is_online) {
      alert('⚠️ The selected tutor is offline. Please select an online tutor or post in the Doubt Pool.');
      return;
    }

    if (!title.trim()) return alert('Please enter a title.');
    if (!description.trim()) return alert('Please describe your doubt.');
    if (!category) return alert('Please select a category.');
    if (mode === 'specific' && !selectedTutor) return alert('Please select a tutor.');
    if (submitting) return;

    setSubmitting(true);
    try {
      const priceRes = await getCurrentPrice();
      const price = priceRes.data?.price ?? priceRes.price;
      if (!price) throw new Error('Price not available');

      const confirmed = window.confirm(`💰 Posting this doubt will cost ₹${price}. Continue?`);
      if (!confirmed) {
        setSubmitting(false);
        return;
      }

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
      if (!doubtId) throw new Error('Doubt ID missing');

      await paymentSuccess({ doubt_id: doubtId });
      router.replace(`/student/matching?doubtId=${doubtId}`);
    } catch (err: any) {
      console.error('Post error:', err?.response?.data || err.message);
      alert(`Submission Failed: ${err?.response?.data?.message || err.message || 'Please try again.'}`);
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
        <p className="py-10 text-center text-white/50">No tutors available</p>
      ) : (
        <div className="space-y-3">
          {tutors.map((tutor) => {
            const isOnline = tutor.is_online === true;
            return (
              <button
                key={tutor.id}
                onClick={() => {
                  if (!isOnline) {
                    alert('🔴 This tutor is offline. Please select an online tutor.');
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
                    {isOnline ? '🟢 Online' : '🔴 Offline'} ·{' '}
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
              {/* Banner */}
              <div className="mb-8 overflow-hidden rounded-2xl bg-gradient-to-r from-violet-600 via-fuchsia-600 to-violet-700 p-6 text-white shadow-lg">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <h1 className="text-3xl font-bold">🚀 Post a Doubt</h1>
                    <p className="mt-2 text-violet-100">
                      Connect instantly with verified experts and get your doubts solved in minutes.
                    </p>
                  </div>
                  <div className="rounded-xl bg-white/10 px-5 py-3 backdrop-blur-sm">
                    <div className="text-xs text-violet-200">Average Response Time</div>
                    <div className="text-xl font-bold">Under 60 Seconds</div>
                  </div>
                </div>
                <div className="mt-6 grid gap-4 md:grid-cols-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">📝</span>
                    <span className="text-sm">Post Your Doubt</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xl">👨‍🏫</span>
                    <span className="text-sm">Expert Accepts</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xl">🎯</span>
                    <span className="text-sm">Get It Solved</span>
                  </div>
                </div>
              </div>

              {/* TITLE + CATEGORY */}
              <div className="mb-6 grid gap-4 lg:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-white/80">
                    1. Doubt Title
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. React useEffect Hook not working as expected"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    maxLength={200}
                    className="w-full rounded-xl border-2 border-white/20 bg-gray-900/60 px-4 py-3 text-white placeholder-white/40 focus:border-violet-400 focus:ring-4 focus:ring-violet-500/50 outline-none transition-all"
                  />
                  <p className="mt-1 text-right text-xs text-white/40">{title.length}/200</p>
                </div>
                <div>
                  <label className="mb-2 block text-sm font-semibold text-white/80">
                    2. Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full rounded-xl border-2 border-white/20 bg-gray-900/60 px-4 py-3 text-white focus:border-violet-400 focus:ring-4 focus:ring-violet-500/50 outline-none transition-all appearance-none"
                  >
                    <option value="" className="bg-gray-900">Select Category</option>
                    {DEFAULT_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat} className="bg-gray-900">{cat}</option>
                    ))}
                  </select>
                  {category === 'Other' && (
                    <input
                      type="text"
                      value={customCategory}
                      onChange={(e) => setCustomCategory(e.target.value)}
                      placeholder="Enter custom category"
                      className="mt-3 w-full rounded-xl border-2 border-white/20 bg-gray-900/60 px-4 py-3 text-white placeholder-white/40 focus:border-violet-400 focus:ring-4 focus:ring-violet-500/50 outline-none transition-all"
                    />
                  )}
                </div>
              </div>

              {/* DESCRIPTION */}
              <div className="mb-6">
                <label className="mb-2 block text-sm font-semibold text-white/80">
                  3. Describe Your Doubt
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Explain your problem in detail..."
                  maxLength={2000}
                  className="w-full rounded-xl border-2 border-white/20 bg-gray-900/60 px-4 py-3 text-white placeholder-white/40 focus:border-violet-400 focus:ring-4 focus:ring-violet-500/50 outline-none transition-all resize-y"
                />
                <div className="mt-2 flex justify-between text-xs text-white/40">
                  <span>More details = faster Solution</span>
                  <span>{description.length}/2000</span>
                </div>
              </div>

              {/* EXPLANATION + MODE */}
              <div className="mb-6 grid gap-4 lg:grid-cols-2">
                <div>
                  <h3 className="mb-2 text-sm font-semibold text-white/80">
                    4. Preferred Explanation
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
                      📹 Live Video
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
                      💬 Text / Chat
                    </button>
                  </div>
                </div>
                <div>
                  <h3 className="mb-2 text-sm font-semibold text-white/80">
                    5. Mode
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
                      📢 Doubt Pool
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
                      👨‍🏫 Specific Tutor
                    </button>
                  </div>
                </div>
              </div>

              {/* 6. Select Tutor (only in Specific Mode) */}
              {mode === 'specific' && (
                <div className="mb-6">
                  <h3 className="mb-1 text-sm font-semibold text-white/80">6. Select Tutor</h3>
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
                            {selectedTutor.is_online ? '🟢 Online Now' : '🔴 Currently Offline'}
                          </p>
                        </div>
                        <span className="text-xl text-violet-400">✏️</span>
                      </button>

                      {!selectedTutor.is_online && (
                        <div className="mt-3 rounded-lg border border-rose-400/30 bg-rose-400/10 p-4 text-sm backdrop-blur-md">
                          <p className="text-rose-300">
                            ⚠️ The selected tutor is offline. Please select an online tutor or switch to Doubt Pool.
                          </p>
                          <div className="mt-3 flex flex-wrap gap-3">
                            <button
                              onClick={() => setShowTutorModal(true)}
                              className="rounded-lg bg-violet-500 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-600"
                            >
                              👨‍🏫 View Online Tutors
                            </button>
                            <button
                              onClick={() => setMode('pool')}
                              className="rounded-lg border border-violet-400/30 bg-white/10 px-4 py-2 text-sm font-semibold text-white hover:bg-white/20"
                            >
                              📢 Switch to Pool
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
                      <span className="font-medium">Pick a Tutor</span>
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
                    Submitting...
                  </div>
                ) : (
                  '🚀 Post Doubt'
                )}
              </button>
            </motion.div>
          </div>

          {/* --- RIGHT SIDEBAR --- */}
          <div className="hidden w-80 shrink-0 flex-col gap-6 lg:flex">
            {/* Recent Doubts Posted */}
            <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-6 shadow-2xl">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-bold text-white">Recent Doubts Posted</h3>
                <button
                  onClick={() => router.push('/student/my-doubts')}
                  className="text-xs font-semibold text-violet-300 hover:underline"
                >
                  View All
                </button>
              </div>
              <div className="space-y-4">
                {recentDoubts.map((doubt) => (
                  <div key={doubt.doubt_id} className="rounded-xl p-3 transition hover:bg-white/10">
                    <div className="flex items-center gap-2 text-[10px] font-semibold text-white/50">
                      <span className="text-violet-400">⬇️</span> {doubt.mode === 'specific' ? 'Specific Tutor' : 'Doubt Pool'}
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
                View All Doubts
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
                  <h3 className="text-xl font-bold text-white">👨‍🏫 Choose a Tutor</h3>
                  <button
                    onClick={() => setShowTutorModal(false)}
                    className="text-2xl text-white/50 hover:text-white"
                  >
                    ❌
                  </button>
                </div>
                {renderTutorList()}
                <p className="border-t border-white/10 px-5 py-3 text-center text-xs text-white/40">
                  🟢 Online · 🔴 Offline (Unselectable)
                </p>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default function PostDoubtPage() {
  return (
    <Suspense fallback={<div className="p-4 text-center text-white">Loading...</div>}>
      <PostDoubtContent />
    </Suspense>
  );
}