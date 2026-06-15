'use client';

import { useState, useEffect, Suspense, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { getTutors } from '@/services/tutorService';
import {
  postDoubt,
  getCurrentPrice,
  paymentSuccess,
  getMyDoubts
} from '@/services/v1Service';
import { connectSocket, disconnectSocket } from '@/services/versionSocketService';
import { getTokens } from '@/services/storageService';

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

  'Programming',

  'Python',

  'Java',

  'JavaScript',

  'React',

  'Django',

  'Data Structures',

  'Algorithms',

  'Database',

  'SQL',

  'Machine Learning',

  'Artificial Intelligence',

  'Cloud Computing',

  'DevOps',

  'Interview Preparation',

  'Other',

];

function PostDoubtContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tutorIdParam = searchParams.get('tutorId');
  const tutorNameParam = searchParams.get('tutorName');

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [

    category,

    setCategory,

  ] = useState('');

  const [

    customCategory,

    setCustomCategory,

  ] = useState('');
  const [mode, setMode] = useState<'pool' | 'specific'>('pool');
  const [preferredExplanation, setPreferredExplanation] = useState<'text' | 'live_video'>('text');
  const [selectedTutor, setSelectedTutor] = useState<Tutor | null>(null);
  const [tutors, setTutors] = useState<Tutor[]>([]);
  const [loadingTutors, setLoadingTutors] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showTutorModal, setShowTutorModal] = useState(false);
  

  const [

    recentDoubts,

    setRecentDoubts,

  ] = useState<
    RecentDoubt[]
  >([]);

  useEffect(() => {

    fetchRecentDoubts();

  }, []);

  // Pre‑fill tutor from query params (as in Android)
  useEffect(() => {
    if (tutorIdParam && tutorNameParam) {
      setMode('specific');
      setSelectedTutor({
        id: parseInt(tutorIdParam, 10),
        display_name: tutorNameParam,
      });
    }
  }, [tutorIdParam, tutorNameParam]);

  // Presence socket – keeps tutors’ online status live
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

  const fetchRecentDoubts =
    async () => {

      try {

        const res =
          await getMyDoubts({
            page: 1,
          });

        console.log(
          'Recent doubts:',
          res
        );

        const doubtsData =

          res?.results?.data ||

          res?.data ||

          [];

        setRecentDoubts(
          doubtsData.slice(0, 5)
        );

      } catch (error) {

        console.error(
          'Recent doubts error:',
          error
        );

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

  // Submit flow – mirrors Android with exact payload shape
  const handleSubmit = async () => {
    if (mode === 'specific' && selectedTutor && !selectedTutor.is_online) {
      alert(
        '⚠️ The selected tutor is offline. Please select an online tutor from the list or post your doubt in the Doubt Pool.'
      );
      return;
    }

    if (!title.trim()) return alert('Please enter a title for your doubt.');
    if (!description.trim()) return alert('Please describe your doubt.');
    if (!category) return alert('Please select a category.');
    if (mode === 'specific' && !selectedTutor) return alert('Please select a tutor.');

    if (submitting) return;
    setSubmitting(true);

    try {
      const priceRes = await getCurrentPrice();
      const price = priceRes.data?.price ?? priceRes.price;
      if (!price) throw new Error('Price not available');

      const confirmed = window.confirm(
        `💰 Posting this doubt will cost ₹${price}. Continue?`
      );
      if (!confirmed) {
        setSubmitting(false);
        return;
      }

      // Build exactly the required payload
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
      const doubtId =
        postRes.data?.doubt_id || postRes.data?.id || postRes.doubt_id;
      if (!doubtId) throw new Error('Doubt ID missing from response');

      await paymentSuccess({ doubt_id: doubtId });

      router.replace(`/student/matching?doubtId=${doubtId}`);
    } catch (err: any) {
      console.error('Post error:', err?.response?.data || err.message);
      const message =
        err?.response?.data?.message ||
        err.message ||
        'Could not post doubt. Please try again.';
      alert(`Submission Failed: ${message}`);
      setSubmitting(false);
    }
  };

  // ---- Tutor Modal ----
  const renderTutorList = () => (
    <div className="max-h-[60vh] overflow-y-auto p-4">
      {loadingTutors ? (
        <div className="flex justify-center py-10">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
        </div>
      ) : tutors.length === 0 ? (
        <p className="py-10 text-center text-gray-500">No tutors available</p>
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
                    ? 'border-indigo-600 bg-indigo-50'
                    : isOnline
                    ? 'border-gray-200 hover:bg-gray-50'
                    : 'border-gray-200 opacity-50 cursor-not-allowed'
                }`}
                disabled={!isOnline}
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-600 text-white text-lg font-bold">
                  {(tutor.name || tutor.display_name || 'T').charAt(0).toUpperCase()}
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-900">
                    {tutor.name || tutor.display_name || 'Tutor'}
                  </p>
                  <p className="text-sm">
                    {isOnline ? '🟢 Online' : '🔴 Offline'} ·{' '}
                    {tutor.skills || 'Coding Tutor'}
                  </p>
                </div>
                {selectedTutor?.id === tutor.id && <span className="text-xl">✅</span>}
                {!isOnline && <span className="text-xl">🔒</span>}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );

  return (
    <div className="mx-auto max-w-[1600px] px-6 pt-0 pb-6">
      <div className="flex flex-col gap-6 lg:flex-row">
        {/* --- MAIN FORM (LEFT) --- */}
        <div className="flex-1">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="rounded-2xl bg-white p-6 shadow-sm md:p-8"
          >
            <div className="mb-6 flex flex-col items-start justify-between sm:flex-row sm:items-center">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Post a Doubt</h1>
                <p className="text-sm text-gray-500">Get instant help from verified experts</p>
              </div>
              <div className="mt-3 sm:mt-0 flex items-center gap-1 rounded-lg bg-purple-50 px-4 py-2 text-sm font-semibold text-purple-700">
                <span className="text-lg">⚡</span>
                <div className="flex flex-col leading-tight">
                  <span className="text-[10px] font-normal text-purple-600">Average Response Time</span>
                  <span>Under 60 sec</span>
                </div>
              </div>
            </div>

            {/* ===================================== */}
            {/* TITLE + CATEGORY */}
            {/* ===================================== */}

            <div
              className="
                mb-6
                grid
                gap-4
                lg:grid-cols-2
              "
            >

              {/* TITLE */}

              <div>

                <label
                  className="
                    mb-2
                    block
                    text-sm
                    font-semibold
                    text-gray-800
                  "
                >
                  1. Doubt Title
                </label>

                <input
                  type="text"
                  placeholder="
                    e.g. React useEffect Hook
                    not working as expected
                  "
                  value={title}
                  onChange={(e) =>
                    setTitle(e.target.value)
                  }
                  maxLength={200}
                  className="
                    w-full
                    rounded-xl
                    border
                    border-gray-200
                    bg-gray-50
                    px-4
                    py-3
                    text-gray-900
                    placeholder:text-gray-500
                    focus:border-indigo-500
                    focus:outline-none
                  "
                />

                <p
                  className="
                    mt-1
                    text-right
                    text-xs
                    text-gray-400
                  "
                >
                  {title.length}/200
                </p>

              </div>

              {/* CATEGORY */}

              <div>

                <label
                  className="
                    mb-2
                    block
                    text-sm
                    font-semibold
                    text-gray-800
                  "
                >
                  2. Category
                </label>

                <select
                  value={category}
                  onChange={(e) =>
                    setCategory(
                      e.target.value
                    )
                  }
                  className="
                    w-full
                    rounded-xl
                    border
                    border-gray-200
                    bg-gray-50
                    px-4
                    py-3
                    text-gray-900
                    focus:border-indigo-500
                    focus:outline-none
                  "
                >
                  <option value="">
                    Select Category
                  </option>

                  {DEFAULT_CATEGORIES.map(
                    (cat) => (
                      <option
                        key={cat}
                        value={cat}
                      >
                        {cat}
                      </option>
                    )
                  )}
                </select>

                {category === 'Other' && (

                  <input
                    type="text"
                    value={customCategory}
                    onChange={(e) =>
                      setCustomCategory(
                        e.target.value
                      )
                    }
                    placeholder="
                      Enter custom category
                    "
                    className="
                      mt-3
                      w-full
                      rounded-xl
                      border
                      border-gray-200
                      bg-gray-50
                      px-4
                      py-3
                      text-gray-900
                      placeholder:text-gray-500
                      focus:border-indigo-500
                      focus:outline-none
                    "
                  />

                )}

              </div>

            </div>

            {/* ===================================== */}
            {/* DESCRIPTION */}
            {/* ===================================== */}

            <div className="mb-6">

              <label
                className="
                  mb-2
                  block
                  text-sm
                  font-semibold
                  text-gray-800
                "
              >
                3. Describe Your Doubt
              </label>

              <textarea
                rows={3}
                value={description}
                onChange={(e) =>
                  setDescription(
                    e.target.value
                  )
                }
                placeholder="
                  Explain your problem
                  in detail...
                "
                maxLength={2000}
                className="
                  w-full
                  rounded-xl
                  border
                  border-gray-200
                  bg-gray-50
                  px-4
                  py-3
                  text-gray-900
                  placeholder:text-gray-500
                  focus:border-indigo-500
                  focus:outline-none
                "
              />

              <div
                className="
                  mt-2
                  flex
                  justify-between
                  text-xs
                  text-gray-400
                "
              >

                <span>
                  More details = faster help
                </span>

                <span>
                  {description.length}/2000
                </span>

              </div>

            </div>

            {/* ===================================== */}
            {/* EXPLANATION + MODE */}
            {/* ===================================== */}

            <div
              className="
                mb-6
                grid
                gap-4
                lg:grid-cols-2
              "
            >

              {/* EXPLANATION */}

              <div>

                <h3
                  className="
                    mb-2
                    text-sm
                    font-semibold
                    text-gray-800
                  "
                >
                  4. Preferred Explanation
                </h3>

                <div className="space-y-3">

                  <button
                    type="button"
                    onClick={() =>
                      setPreferredExplanation(
                        'live_video'
                      )
                    }
                    className={`
                      w-full
                      rounded-xl
                      border
                      p-4
                      text-left
                      text-gray-900
                      transition-all
                      ${
                        preferredExplanation === 'live_video'
                          ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                          : 'border-gray-200 bg-white hover:bg-gray-50'
                      }
                    `}
                  >
                    📹 Live Video
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setPreferredExplanation(
                        'text'
                      )
                    }
                    className={`
                      w-full
                      rounded-xl
                      border
                      p-4
                      text-left
                      text-gray-900
                      transition-all
                      ${
                        preferredExplanation === 'text'
                          ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                          : 'border-gray-200 bg-white hover:bg-gray-50'
                      }
                    `}
                  >
                    💬 Text / Chat
                  </button>

                </div>

              </div>

              {/* MODE */}

              <div>

                <h3
                  className="
                    mb-2
                    text-sm
                    font-semibold
                    text-gray-800
                  "
                >
                  5. Mode
                </h3>

                <div className="space-y-3">

                  <button
                    type="button"
                    onClick={() =>
                      setMode('pool')
                    }
                    className={`
                      w-full
                      rounded-xl
                      border
                      p-4
                      text-left
                      text-gray-900
                      transition-all
                      ${
                        mode === 'pool'
                          ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                          : 'border-gray-200 bg-white hover:bg-gray-50'
                      }
                    `}
                  >
                    📢 Doubt Pool
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setMode('specific')
                    }
                    className={`
                      w-full
                      rounded-xl
                      border
                      p-4
                      text-left
                      text-gray-900
                      transition-all
                      ${
                        mode === 'specific'
                          ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                          : 'border-gray-200 bg-white hover:bg-gray-50'
                      }
                    `}
                  >
                    👨‍🏫 Specific Tutor
                  </button>

                </div>

              </div>

            </div>

            {/* 6. Select Tutor (only in Specific Mode) */}
            {mode === 'specific' && (
              <div className="mb-6">
                <h3 className="mb-1 text-sm font-semibold text-gray-800">6. Select Tutor</h3>
                {selectedTutor ? (
                  <div>
                    <button
                      onClick={() => setShowTutorModal(true)}
                      className={`flex w-full items-center gap-4 rounded-xl border p-3 text-left ${
                        selectedTutor.is_online
                          ? 'border-indigo-600 bg-indigo-50'
                          : 'border-red-300 bg-red-50'
                      }`}
                    >
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-600 text-white text-lg font-bold">
                        {(selectedTutor.name || selectedTutor.display_name || 'T').charAt(0)}
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900">
                          {selectedTutor.name || selectedTutor.display_name}
                        </p>
                        <p className={`text-sm ${selectedTutor.is_online ? 'text-green-600' : 'text-red-600'}`}>
                          {selectedTutor.is_online ? '🟢 Online Now' : '🔴 Currently Offline'}
                        </p>
                      </div>
                      <span className="text-xl">✏️</span>
                    </button>

                    {!selectedTutor.is_online && (
                      <div className="mt-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm">
                        <p className="text-red-800">
                          ⚠️ The selected tutor is offline. Please select an online tutor
                          from the list or post your doubt in the Doubt Pool.
                        </p>
                        <div className="mt-3 flex flex-wrap gap-3">
                          <button
                            onClick={() => setShowTutorModal(true)}
                            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
                          >
                            👨‍🏫 View Online Tutors
                          </button>
                          <button
                            onClick={() => setMode('pool')}
                            className="rounded-lg border border-indigo-600 bg-white px-4 py-2 text-sm font-semibold text-indigo-600 hover:bg-indigo-50"
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
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-gray-400 bg-white p-4 text-indigo-600 transition hover:bg-gray-50"
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
              disabled={Boolean(
                submitting ||
                (mode === 'specific' && selectedTutor?.is_online === false)
              )}
              className={`mt-4 flex w-full items-center justify-center gap-2 rounded-xl py-3 font-bold text-white shadow-md transition ${
                submitting ||
                (mode === 'specific' && selectedTutor?.is_online === false)
                  ? 'bg-indigo-300 cursor-not-allowed'
                  : 'bg-indigo-600 hover:bg-indigo-700'
              }`}
            >
              {submitting ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Submitting...
                </div>
              ) : (
                <>
                  🚀 Post Doubt
                </>
              )}
            </button>

          </motion.div>
        </div>

        {/* --- RIGHT SIDEBAR (unchanged) --- */}
        <div className="hidden w-80 shrink-0 flex-col gap-6 lg:flex">
          {/* How it Works */}
          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <h3 className="mb-4 text-lg font-bold text-gray-800">How It Works</h3>
            <div className="space-y-4">
              <div className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">
                    📝
                  </div>
                  <div className="h-full w-px bg-gray-200"></div>
                </div>
                <div>
                  <p className="font-semibold text-gray-800">Post Your Doubt</p>
                  <p className="text-[10px] text-gray-500">Describe your doubt and add any files or images.</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">
                    👤
                  </div>
                  <div className="h-full w-px bg-gray-200"></div>
                </div>
                <div>
                  <p className="font-semibold text-gray-800">Experts Get Notified</p>
                  <p className="text-[10px] text-gray-500">Relevant online tutors will see your doubt.</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">
                    ✅
                  </div>
                  <div className="h-full w-px bg-gray-200"></div>
                </div>
                <div>
                  <p className="font-semibold text-gray-800">Get Connected</p>
                  <p className="text-[10px] text-gray-500">The first tutor to accept will connect with you.</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">
                    🎯
                  </div>
                </div>
                <div>
                  <p className="font-semibold text-gray-800">Doubt Solved</p>
                  <p className="text-[10px] text-gray-500">Get your doubt solved instantly!</p>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Doubts Posted */}
          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-800">Recent Doubts Posted</h3>
              <button

                onClick={() =>
                  router.push(
                    '/student/my-doubts'
                  )
                }

                className="
                  text-xs
                  font-semibold
                  text-indigo-600
                  hover:underline
                "
              >
                View All
              </button>
            </div>
            <div className="space-y-4">
              {recentDoubts.map((doubt) => (
                <div key={doubt.doubt_id} className="border-b border-gray-100 pb-3 last:border-0 last:pb-0">
                  <div className="flex items-center gap-2 text-[10px] font-semibold text-gray-500">
                    <span className="text-indigo-600">⬇️</span> {doubt.mode === 'specific'
                                                                                  ? 'Specific Tutor'
                                                                                  : 'Doubt Pool'}
                  </div>
                  <p className="text-sm font-semibold text-gray-800">{doubt.title}</p>
                  <div className="mt-1 flex items-center justify-between text-[10px] text-gray-400">
                    <span>{doubt.category}</span>
                    <span>• {new Date(
                                        doubt.created_at
                                      ).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
            <button

              onClick={() =>
                router.push(
                  '/student/my-doubts'
                )
              }

              className="
                mt-4
                w-full
                rounded-lg
                bg-indigo-50
                py-2
                text-center
                text-xs
                font-semibold
                text-indigo-600
                transition
                hover:bg-indigo-100
              "
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
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowTutorModal(false)}
          >
            <motion.div
              className="w-full max-w-md rounded-t-2xl bg-white shadow-xl sm:rounded-2xl"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
                <h3 className="text-xl font-bold text-gray-900">
                  👨‍🏫 Choose a Tutor
                </h3>
                <button
                  onClick={() => setShowTutorModal(false)}
                  className="text-2xl text-gray-500 hover:text-gray-700"
                >
                  ❌
                </button>
              </div>
              {renderTutorList()}
              <p className="border-t border-gray-100 px-5 py-3 text-center text-xs text-gray-400">
                🟢 Online · 🔴 Offline (Unselectable)
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function PostDoubtPage() {
  return (
    <Suspense fallback={<div className="p-4 text-center">Loading...</div>}>
      <PostDoubtContent />
    </Suspense>
  );
}