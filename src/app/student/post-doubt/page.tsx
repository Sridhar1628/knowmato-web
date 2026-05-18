'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { createDoubt, sendDirectRequest, CreateDoubtPayload } from '@/services/doubtService';
import { getTutors } from '@/services/tutorService';
import { sendMessage } from '@/services/socketService';
import { parseApiError } from '@/utils/errorHandler';

// Types
interface Tutor {
  id: number;
  name?: string;
  display_name?: string;
  skills?: string;
  average_rating?: number;
}

// Constants
const CATEGORIES = [
  'Python', 'JavaScript', 'Java', 'C++', 'Data Structures',
  'Algorithms', 'Web Development', 'React', 'Node.js', 'Databases', 'Other',
];

const EXPLANATION_TYPES = [
  { label: '📝 Text', value: 'text' },
  { label: '🎧 Audio', value: 'audio' },
  { label: '🎥 Video', value: 'video' },
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
  const [mode, setMode] = useState<'pool' | 'specific'>('pool');
  const [preferredExplanation, setPreferredExplanation] = useState<'text' | 'audio' | 'video'>('text');
  const [selectedTutor, setSelectedTutor] = useState<Tutor | null>(null);
  const [tutors, setTutors] = useState<Tutor[]>([]);
  const [loadingTutors, setLoadingTutors] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showTutorModal, setShowTutorModal] = useState(false);

  // Pre-fill tutor from query params
  useEffect(() => {
    if (tutorIdParam && tutorNameParam) {
      setMode('specific');
      setSelectedTutor({
        id: parseInt(tutorIdParam),
        display_name: tutorNameParam,
      });
    }
  }, [tutorIdParam, tutorNameParam]);

  // Fetch tutors when mode switches to specific
  useEffect(() => {
    if (mode === 'specific' && tutors.length === 0 && !loadingTutors) {
      fetchTutors();
    }
  }, [mode]);

  const fetchTutors = async () => {
    setLoadingTutors(true);
    try {
      const response = await getTutors();
      // Handle different response structures
      let tutorsArray: Tutor[] = [];
      if (response.data && Array.isArray(response.data.data)) {
        tutorsArray = response.data.data;
      } else if (response.data && Array.isArray(response.data)) {
        tutorsArray = response.data;
      } else if (Array.isArray(response)) {
        tutorsArray = response;
      }
      setTutors(tutorsArray);
    } catch (error) {
      console.error('Failed to fetch tutors:', error);
      alert('Could not load tutors. Please check your connection.');
    } finally {
      setLoadingTutors(false);
    }
  };

  const handleSubmit = async () => {
    // Validation
    if (!title.trim()) return alert('Please enter a title.');
    if (!description.trim()) return alert('Please describe your doubt.');
    if (!category) return alert('Please select a category.');
    if (mode === 'specific' && !selectedTutor) return alert('Please select a tutor.');

    setSubmitting(true);

    try {
      // 1. Create doubt
      const doubtPayload: CreateDoubtPayload = {
        title: title.trim(),
        description: description.trim(),
        category,
        mode,
        preferred_explanation: preferredExplanation,
      };

      const doubtRes = await createDoubt(doubtPayload);
      const doubtId = doubtRes.data?.id || doubtRes.data?.data?.id;
      if (!doubtId) throw new Error('No doubt id returned from server');

      // 2. If specific mode, assign tutor
      if (mode === 'specific' && selectedTutor) {
        await sendDirectRequest({ doubt: doubtId, tutor: selectedTutor.id });
      }

      // 3. Socket notification (optional)
      const newDoubt = {
        id: doubtId,
        title: doubtPayload.title,
        description: doubtPayload.description,
        category: doubtPayload.category,
        mode: doubtPayload.mode,
        status: 'open',
        preferred_explanation: preferredExplanation,
        created_at: new Date().toISOString(),
      };
      sendMessage({ event: 'DOUBT_CREATED', data: newDoubt });

      alert('Doubt posted successfully!');
      router.push('/student/my-doubts');
    } catch (error: any) {
      console.error('Submission error:', error);
      const message = parseApiError(error);
      alert(`Submission Failed: ${message}`);
    } finally {
      setSubmitting(false);
    }
  };

  // Tutor selection modal component
  const TutorModal = () => {
    if (!showTutorModal) return null;

    return (
      <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center">
        <div className="w-full max-w-md rounded-t-2xl bg-white shadow-xl sm:rounded-2xl">
          <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
            <h3 className="text-xl font-bold text-gray-900">👨‍🏫 Choose a Tutor</h3>
            <button
              onClick={() => setShowTutorModal(false)}
              className="text-2xl text-gray-500 hover:text-gray-700"
            >
              ❌
            </button>
          </div>
          <div className="max-h-[60vh] overflow-y-auto p-4">
            {loadingTutors ? (
              <div className="flex justify-center py-10">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
              </div>
            ) : tutors.length === 0 ? (
              <p className="py-10 text-center text-gray-500">No tutors available</p>
            ) : (
              <div className="space-y-3">
                {tutors.map((tutor) => (
                  <button
                    key={tutor.id}
                    onClick={() => {
                      setSelectedTutor(tutor);
                      setShowTutorModal(false);
                    }}
                    className={`flex w-full items-center gap-4 rounded-xl border p-3 text-left transition ${
                      selectedTutor?.id === tutor.id
                        ? 'border-indigo-600 bg-indigo-50'
                        : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-600 text-white">
                      {(tutor.name || tutor.display_name || 'T').charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900">
                        {tutor.name || tutor.display_name || 'Tutor'}
                      </p>
                      <p className="text-sm text-gray-500">
                        {tutor.skills || 'Coding Tutor'} ⭐ {tutor.average_rating ?? 'New'}
                      </p>
                    </div>
                    {selectedTutor?.id === tutor.id && <span className="text-xl">✅</span>}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="mx-auto max-w-2xl px-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="rounded-2xl bg-white p-6 shadow-sm md:p-8"
        >
          <h1 className="mb-6 text-center text-3xl font-bold text-gray-900">
            📝 Post Your Doubt
          </h1>

          {/* Title */}
          <div className="mb-5">
            <label className="mb-1 block font-semibold text-gray-800">📌 Title</label>
            <input
              type="text"
              placeholder="Min 5 characters"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={100}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          {/* Description */}
          <div className="mb-5">
            <label className="mb-1 block font-semibold text-gray-800">💬 Description</label>
            <textarea
              rows={5}
              placeholder="Describe your doubt in detail..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          {/* Category */}
          <div className="mb-5">
            <label className="mb-1 block font-semibold text-gray-800">🏷️ Category</label>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                    category === cat
                      ? 'bg-indigo-600 text-white'
                      : 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Mode Selection */}
          <div className="mb-5">
            <label className="mb-1 block font-semibold text-gray-800">🎯 Mode</label>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <button
                onClick={() => setMode('pool')}
                className={`rounded-xl border p-4 text-center transition ${
                  mode === 'pool'
                    ? 'border-indigo-600 bg-indigo-50'
                    : 'border-gray-300 bg-white hover:bg-gray-50'
                }`}
              >
                <div className="text-3xl">🟢</div>
                <div className={`font-semibold ${mode === 'pool' ? 'text-indigo-600' : 'text-gray-800'}`}>
                  Doubt Pool
                </div>
                <div className="text-xs text-gray-500">Get bids from multiple tutors</div>
              </button>
              <button
                onClick={() => setMode('specific')}
                className={`rounded-xl border p-4 text-center transition ${
                  mode === 'specific'
                    ? 'border-indigo-600 bg-indigo-50'
                    : 'border-gray-300 bg-white hover:bg-gray-50'
                }`}
              >
                <div className="text-3xl">🔵</div>
                <div className={`font-semibold ${mode === 'specific' ? 'text-indigo-600' : 'text-gray-800'}`}>
                  Specific Tutor
                </div>
                <div className="text-xs text-gray-500">Choose a tutor directly</div>
              </button>
            </div>
          </div>

          {/* Preferred Explanation */}
          <div className="mb-5">
            <label className="mb-1 block font-semibold text-gray-800">🎧 Preferred Explanation</label>
            <div className="flex flex-wrap gap-3">
              {EXPLANATION_TYPES.map((exp) => (
                <button
                  key={exp.value}
                  onClick={() => setPreferredExplanation(exp.value as any)}
                  className={`rounded-full px-5 py-2 text-sm font-medium transition ${
                    preferredExplanation === exp.value
                      ? 'bg-indigo-600 text-white'
                      : 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {exp.label}
                </button>
              ))}
            </div>
          </div>

          {/* Info box for pool mode */}
          {mode === 'pool' && (
            <div className="mb-5 rounded-lg border-l-4 border-indigo-600 bg-indigo-50 p-3 text-sm text-indigo-800">
              💡 Tutors will provide explanation based on your selected preference.
            </div>
          )}

          {/* Tutor Selection (specific mode) */}
          {mode === 'specific' && (
            <div className="mb-6">
              <label className="mb-1 block font-semibold text-gray-800">👨‍🏫 Select Tutor</label>
              {selectedTutor ? (
                <button
                  onClick={() => setShowTutorModal(true)}
                  className="flex w-full items-center gap-4 rounded-xl border border-indigo-600 bg-indigo-50 p-3 text-left"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-600 text-white">
                    {(selectedTutor.name || selectedTutor.display_name || 'T').charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">
                      {selectedTutor.name || selectedTutor.display_name}
                    </p>
                    <p className="text-sm text-gray-500">{selectedTutor.skills || 'Coding Expert'}</p>
                  </div>
                  <span className="text-xl">✏️</span>
                </button>
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
            disabled={submitting}
            className="mt-4 w-full rounded-xl bg-indigo-600 py-3 font-bold text-white shadow-md transition hover:bg-indigo-700 disabled:opacity-70"
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

      {/* Tutor Modal */}
      <TutorModal />
    </div>
  );
}

export default function PostDoubtPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PostDoubtContent />
    </Suspense>
  );
}