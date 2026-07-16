'use client';

import {
  postDoubt,
  paymentSuccess,
  getCurrentPrice,
} from '@/services/v1Service';

import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';
import { getOnlineTutors } from '@/services/v1Service';
import { useTranslation } from 'react-i18next'; // ✅ added

interface Tutor {
  id: number;
  display_name: string;
  skills: string;
  average_rating: number;
  total_reviews: number;
  is_verified: boolean;
  is_top_tutor: boolean;
  is_online: boolean;
}

interface Props {
  open: boolean;
  description: string;
  onDescriptionChange: (value: string) => void;
  onClose: () => void;
}

export default function PostDoubtModal({
  open,
  description,
  onDescriptionChange,
  onClose,
}: Props) {
  const { t } = useTranslation(); // ✅
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  // FORM
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [keywords, setKeywords] = useState('');
  const [editingDescription, setEditingDescription] = useState(false);

  // PREFERRED EXPLANATION
  const [preferredExplanation, setPreferredExplanation] = useState<'text' | 'live_video'>('text');

  // MODE
  const [mode, setMode] = useState<'pool' | 'specific'>('pool');

  // TUTORS
  const [tutors, setTutors] = useState<Tutor[]>([]);
  const [loadingTutors, setLoadingTutors] = useState(false);
  const [selectedTutor, setSelectedTutor] = useState<Tutor | null>(null);

  // CATEGORIES (translated list)
  const categories = t('postDoubt.categories', { returnObjects: true }) as string[];

  // Set initial category to first category when categories load
  useEffect(() => {
    if (categories.length > 0 && !category) {
      setCategory(categories[0]);
    }
  }, [categories, category]);

  // FETCH ONLINE TUTORS
  useEffect(() => {
    const fetchTutors = async () => {
      if (mode !== 'specific') return;
      try {
        setLoadingTutors(true);
        const res = await getOnlineTutors();
        const tutorsData = res?.data || [];
        const onlineOnly = tutorsData.filter((t: Tutor) => t.is_online);
        setTutors(onlineOnly);
      } catch (error) {
        console.error('Tutor fetch error:', error);
      } finally {
        setLoadingTutors(false);
      }
    };
    fetchTutors();
  }, [mode]);

  const handleSubmit = async () => {
    // VALIDATION
    if (!title.trim()) {
      toast.error(t('postDoubt.enterTitle'));
      return;
    }
    if (!category) {
      toast.error(t('postDoubt.selectCategory'));
      return;
    }
    if (mode === 'specific' && !selectedTutor) {
      toast.error(t('postDoubt.selectTutor'));
      return;
    }

    try {
      setSubmitting(true);

      // GET CURRENT PRICE
      const priceRes = await getCurrentPrice();
      const price = priceRes?.data?.price || priceRes?.price || 10;

      // CONFIRM
      const confirmed = window.confirm(
        t('postDoubt.paymentMessage', { price })
      );
      if (!confirmed) {
        setSubmitting(false);
        return;
      }

      // BUILD PAYLOAD
      const payload: any = {
        title: title.trim(),
        description: description.trim(),
        category,
        preferred_explanation: preferredExplanation,
        mode,
      };

      if (mode === 'specific' && selectedTutor) {
        payload.selected_tutor = selectedTutor.id;
      }

      // POST DOUBT
      const res = await postDoubt(payload);
      const doubtId = res?.data?.doubt_id || res?.data?.id || res?.doubt_id;
      if (!doubtId) throw new Error('Doubt ID missing');

      // PAYMENT SUCCESS
      await paymentSuccess({ doubt_id: doubtId });

      // SUCCESS
      toast.success(t('postDoubt.findingExperts'));

      onClose();
      setTitle('');
      setKeywords('');
      setSelectedTutor(null);

      router.push(`/student/matching?doubtId=${doubtId}`);
    } catch (error: any) {
      console.error(error);
      toast.error(error?.response?.data?.message || t('postDoubt.submissionFailed'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-md"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.95 }}
            transition={{ duration: 0.25 }}
            onClick={(e) => e.stopPropagation()}
            className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-[32px] border border-white/10 bg-gradient-to-br from-[#111827] via-[#1E293B] to-[#0F172A] p-6 shadow-2xl"
          >
            {/* HEADER */}
            <div className="mb-8 flex items-start justify-between">
              <div>
                <h2 className="text-3xl font-black tracking-tight text-white">
                  🚀 {t('postDoubt.modalTitle')}
                </h2>
                <p className="mt-2 text-sm text-gray-300">
                  {t('postDoubt.completeDetails')}
                </p>
              </div>
              <button onClick={onClose} className="text-2xl text-gray-400 transition hover:text-white">
                ✕
              </button>
            </div>

            {/* FORM */}
            <div className="space-y-5">
              {/* TITLE */}
              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-200">
                  {t('postDoubt.doubtTitleLabel')}
                </label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={t('postDoubt.modalTitlePlaceholder')}
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-white placeholder:text-gray-400 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20"
                />
              </div>

              {/* DESCRIPTION (editable) */}
              <div className="mb-6 rounded-2xl border border-indigo-100 bg-indigo-50 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">
                    {t('postDoubt.doubtDescriptionLabel')}
                  </p>
                  <button
                    type="button"
                    onClick={() => setEditingDescription(!editingDescription)}
                    className="rounded-lg bg-white px-3 py-1 text-xs font-semibold text-indigo-600 shadow-sm transition hover:bg-indigo-100"
                  >
                    {editingDescription ? t('postDoubt.save') : t('postDoubt.edit')}
                  </button>
                </div>
                {editingDescription ? (
                  <textarea
                    value={description}
                    onChange={(e) => onDescriptionChange(e.target.value)}
                    className="min-h-[140px] w-full rounded-xl border border-indigo-200 bg-white p-4 text-sm text-gray-700 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
                  />
                ) : (
                  <p className="whitespace-pre-wrap text-sm leading-6 text-gray-700">
                    {description}
                  </p>
                )}
              </div>

              {/* CATEGORY */}
              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-200">
                  {t('postDoubt.categoryLabel')}
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-[#1E293B] px-5 py-4 text-white outline-none focus:border-indigo-500"
                >
                  {categories.map((cat, idx) => (
                    <option key={idx} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              {/* KEYWORDS */}
              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-200">
                  {t('postDoubt.keywordsLabel')}
                </label>
                <input
                  value={keywords}
                  onChange={(e) => setKeywords(e.target.value)}
                  placeholder={t('postDoubt.keywordsPlaceholder')}
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-white placeholder:text-gray-400 outline-none"
                />
              </div>

              {/* PREFERRED EXPLANATION */}
              <div>
                <label className="mb-3 block text-sm font-semibold text-gray-200">
                  {t('postDoubt.preferredExplanation')}
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { id: 'text', label: t('postDoubt.textChatOption') },   // "💬 Text / Chat"
                    { id: 'live_video', label: t('postDoubt.liveVideoOption') } // "📹 Live Video"
                  ].map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setPreferredExplanation(item.id as any)}
                      className={`rounded-2xl border px-4 py-4 text-sm font-bold transition ${
                        preferredExplanation === item.id
                          ? 'border-indigo-500 bg-gradient-to-r from-indigo-600 to-purple-600 text-white'
                          : 'border-white/10 bg-white/5 text-gray-300'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* MODE */}
              <div>
                <label className="mb-3 block text-sm font-semibold text-gray-200">
                  {t('postDoubt.selectModeLabel')}
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { id: 'pool', label: `🌍 ${t('postDoubt.doubtPool')}` },
                    { id: 'specific', label: `👨‍🏫 ${t('postDoubt.specificTutor')}` }
                  ].map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setMode(item.id as any)}
                      className={`rounded-2xl border px-4 py-4 text-sm font-bold transition ${
                        mode === item.id
                          ? 'border-indigo-500 bg-gradient-to-r from-indigo-600 to-purple-600 text-white'
                          : 'border-white/10 bg-white/5 text-gray-300'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* SPECIFIC TUTOR */}
              {mode === 'specific' && (
                <div>
                  <label className="mb-3 block text-sm font-semibold text-gray-200">
                    {t('postDoubt.availableTutorsLabel')}
                  </label>
                  {loadingTutors ? (
                    <div className="py-10 text-center text-gray-400">
                      {t('postDoubt.loadingTutors')}
                    </div>
                  ) : tutors.length === 0 ? (
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-5 text-center text-sm text-gray-400">
                      {t('postDoubt.noTutorsOnline')}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {tutors.map((tutor) => (
                        <button
                          key={tutor.id}
                          type="button"
                          onClick={() => setSelectedTutor(tutor)}
                          className={`flex w-full items-center justify-between rounded-2xl border p-4 transition ${
                            selectedTutor?.id === tutor.id
                              ? 'border-indigo-500 bg-indigo-500/20'
                              : 'border-white/10 bg-white/5'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 font-bold text-white">
                              {tutor.display_name.charAt(0)}
                            </div>
                            <div className="text-left">
                              <div className="flex items-center gap-1">
                                <p className="font-semibold text-white">
                                  {tutor.display_name}
                                </p>
                                {tutor.is_verified && <span>✅</span>}
                                {tutor.is_top_tutor && <span>⭐</span>}
                              </div>
                              <p className="text-xs text-gray-400">
                                {tutor.skills}
                              </p>
                            </div>
                          </div>
                          {selectedTutor?.id === tutor.id && (
                            <span className="text-xl">✅</span>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* FOOTER */}
            <div className="mt-8 flex justify-end gap-3">
              <button
                onClick={onClose}
                className="rounded-2xl border border-white/10 px-5 py-3 text-sm font-semibold text-gray-300"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className={`rounded-2xl px-6 py-3 text-sm font-bold text-white shadow-lg transition ${
                  submitting
                    ? 'cursor-not-allowed bg-gray-500'
                    : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:scale-[1.02]'
                }`}
              >
                {submitting ? t('postDoubt.posting') : `🚀 ${t('postDoubt.postDoubt')}`}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}