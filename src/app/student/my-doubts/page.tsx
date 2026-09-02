'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import AlertService from "@/services/alertService";
import { getMyDoubts } from '@/services/v1Service';
import { apiGet } from '@/services/apiService';
import { myDoubtsCache } from '@/store/myDoubtsCache';
import { subscribeMyDoubts } from '@/store/myDoubtsRealtime';
import { Zap } from 'lucide-react';
import { useTranslation } from 'react-i18next'; // ✅ added

/* ---------- TYPES ---------- */
interface Doubt {
  doubt_id: number;
  title: string;
  category: string;
  preferred_explanation: 'text' | 'live_video';
  status: 'open' | 'assigned' | 'completed';
  price: number | null;
  mode: 'pool' | 'specific';
  created_at: string;
  tutor_id: number;
  tutor: string | null;
  session: {
    session_id: number;
    status: string;
    session_type: 'text' | 'chat' | 'live_video';
  } | null;
  review: {
    review_id: number;
    rating: number;
    feedback: string;
    created_at: string;
  } | null;
}

interface FilterOptions {
  status: string;
  category: string;
  mode: string;
  search: string;
  from_date: string;
  to_date: string;
}

const MyDoubtsScreen = () => {
  const { t } = useTranslation(); // ✅ added
  const router = useRouter();

  // Data
  const [doubts, setDoubts] = useState<Doubt[]>([]);
  const [allDoubts, setAllDoubts] = useState<Doubt[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [nextPageUrl, setNextPageUrl] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [activeQuickFilter, setActiveQuickFilter] = useState('all');
  const [searchText, setSearchText] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Filters
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [filters, setFilters] = useState<FilterOptions>({
    status: '',
    category: '',
    mode: '',
    search: '',
    from_date: '',
    to_date: '',
  });
  const [tempFilters, setTempFilters] = useState<FilterOptions>(filters);

  // Quick filter labels (translated)
  const quickFilters = ['all', 'live', 'live_video', 'text', 'completed'];
  const quickFilterLabelMap: Record<string, string> = {
    all: t('myDoubts.all'),
    live: t('myDoubts.live'),
    live_video: t('myDoubts.liveVideo'),
    text: t('myDoubts.textChat'),
    completed: t('myDoubts.completed'),
  };

  // Category options: we keep internal values untranslated, but display labels translated.
  // For the "All" option we show common.all. For "Other" we show myDoubts.other.
  const categoryOptions = ['', 'Python', 'JavaScript', 'Java', 'C++', 'React', 'Web Development', 'Other'];
  const modeOptions = ['', 'pool', 'specific'];

  /* ---------- Fetch doubts ---------- */
  const fetchDoubts = useCallback(
    async (loadMore = false) => {
      if (!loadMore) setLoading(true);
      else setLoadingMore(true);

      try {
        if (loadMore && nextPageUrl) {
          const res = await apiGet(nextPageUrl);
          const data = res?.data || res;
          const newDoubts = data.results?.data || [];
          setAllDoubts((prev) => [...prev, ...newDoubts]);
          setNextPageUrl(data.next || null);
          return;
        }

        const params: any = { page: 1 };
        const res = await getMyDoubts(params);
        const data = res?.data || res;
        const newDoubts = data.results?.data || [];

        const nextUrl =
          process.env.NODE_ENV === 'production'
            ? data.next?.replace('http://', 'https://')
            : data.next;

        myDoubtsCache.doubts = newDoubts;
        myDoubtsCache.nextPageUrl = nextUrl || null;
        myDoubtsCache.totalCount = data.count || 0;
        myDoubtsCache.initialized = true;

        setAllDoubts(newDoubts as Doubt[]);
        setNextPageUrl(myDoubtsCache.nextPageUrl);
        setTotalCount(myDoubtsCache.totalCount);
      } catch (error) {
        console.error('Fetch doubts error:', error);
        AlertService.error(
          t('myDoubts.loadErrorTitle', { defaultValue: 'Unable to Load Doubts' }),
          t('myDoubts.loadError', { defaultValue: 'Failed to load your doubts. Please try again.' }),
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
        setLoadingMore(false);
      }
    },
    [nextPageUrl, t]
  );

  // Load more
  const loadMore = () => {
    if (nextPageUrl && !loadingMore) fetchDoubts(true);
  };

  // Manual refresh
  const onRefresh = () => {
    setRefreshing(true);
    fetchDoubts(false);
  };

  // Apply filters from modal
  const applyFilters = () => {
    setFilters({ ...tempFilters });
    setFilterModalVisible(false);
  };

  // Reset filters
  const resetFilters = () => {
    const empty = { status: '', category: '', mode: '', search: '', from_date: '', to_date: '' };
    setTempFilters(empty);
    setFilters(empty);
    setFilterModalVisible(false);
  };

  useEffect(() => {
    const unsubscribe = subscribeMyDoubts(() => {
      setAllDoubts([...myDoubtsCache.doubts]);
    });
    return unsubscribe;
  }, []);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchText), 700);
    return () => clearTimeout(timer);
  }, [searchText]);

  useEffect(() => {
    setFilters((prev) => ({ ...prev, search: debouncedSearch }));
  }, [debouncedSearch]);

  useEffect(() => {
    let filtered = [...allDoubts];

    if (activeQuickFilter === 'completed') {
      filtered = filtered.filter((item) => item.status === 'completed');
    }
    if (activeQuickFilter === 'live') {
      filtered = filtered.filter((item) => item.status === 'assigned');
    }
    if (activeQuickFilter === 'live_video') {
      filtered = filtered.filter((item) => item.preferred_explanation === 'live_video');
    }
    if (activeQuickFilter === 'text') {
      filtered = filtered.filter((item) => item.preferred_explanation === 'text');
    }

    if (filters.category) {
      filtered = filtered.filter((item) => item.category === filters.category);
    }
    if (filters.mode) {
      filtered = filtered.filter((item) => item.mode === filters.mode);
    }
    if (filters.status) {
      filtered = filtered.filter((item) => item.status === filters.status);
    }
    if (filters.search) {
      const search = filters.search.toLowerCase();
      filtered = filtered.filter((item) => item.title.toLowerCase().includes(search));
    }
    if (filters.from_date) {
      filtered = filtered.filter((item) => new Date(item.created_at) >= new Date(filters.from_date));
    }
    if (filters.to_date) {
      const toDate = new Date(`${filters.to_date}T23:59:59.999`);
      filtered = filtered.filter((item) => new Date(item.created_at) <= toDate);
    }

    setDoubts(filtered);
    setTotalCount(filtered.length);
  }, [
    allDoubts,
    activeQuickFilter,
    filters.category,
    filters.mode,
    filters.status,
    filters.search,
    filters.from_date,
    filters.to_date,
  ]);

  useEffect(() => {
    if (myDoubtsCache.initialized) {
      setAllDoubts(myDoubtsCache.doubts as unknown as Doubt[]);
      setDoubts(myDoubtsCache.doubts as unknown as Doubt[]);
      setNextPageUrl(myDoubtsCache.nextPageUrl);
      setTotalCount(myDoubtsCache.totalCount);
      setLoading(false);
      return;
    }

    fetchDoubts(false);
  }, [fetchDoubts]);

  /* ---------- Helpers ---------- */
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'open':
        return {
          emoji: '🟢',
          textColor: 'text-emerald-300',
          bg: 'bg-emerald-400/20',
          border: 'border-emerald-400/30',
        };
      case 'assigned':
        return {
          emoji: '🔵',
          textColor: 'text-sky-300',
          bg: 'bg-sky-400/20',
          border: 'border-sky-400/30',
        };
      case 'completed':
        return {
          emoji: '✅',
          textColor: 'text-white/60',
          bg: 'bg-white/10',
          border: 'border-white/20',
        };
      default:
        return {
          emoji: '⚪',
          textColor: 'text-white/60',
          bg: 'bg-white/10',
          border: 'border-white/20',
        };
    }
  };

  const renderStars = (rating: number) => '⭐'.repeat(rating);

  const getExplanationStyle = (type: string) => {
    if (type === 'live_video') {
      return {
        icon: '🎥',
        text: t('myDoubts.liveVideo'),
        textColor: 'text-violet-300',
        bg: 'bg-violet-400/20',
        border: 'border-violet-400/30',
      };
    }
    return {
      icon: '💬',
      text: t('myDoubts.textChat'),
      textColor: 'text-emerald-300',
      bg: 'bg-emerald-400/20',
      border: 'border-emerald-400/30',
    };
  };

  const handleDoubtPress = (item: Doubt) => {
    router.push(`/student/my-doubts/${item.doubt_id}`);
  };

  /* ---------- Render ---------- */
  if (loading && !refreshing) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-violet-400 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e] relative overflow-hidden">
      {/* Animated background blobs */}
      <div className="absolute top-0 -left-20 w-72 h-72 bg-purple-500/20 rounded-full mix-blend-multiply filter blur-3xl animate-blob" />
      <div className="absolute top-0 -right-20 w-72 h-72 bg-fuchsia-500/20 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000" />
      <div className="absolute -bottom-20 left-40 w-72 h-72 bg-cyan-500/20 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000" />

      <div className="relative z-10 mx-auto max-w-7xl px-4 py-6">
        {/* Page heading + refresh */}
        <div className="relative mb-6 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-violet-300 via-fuchsia-300 to-cyan-300">
              📋 {t('myDoubts.title')}
            </h1>
          </div>
          <button
            onClick={onRefresh}
            disabled={refreshing}
            className="absolute right-0 rounded-xl bg-white/10 backdrop-blur-md p-2 text-white/80 border border-white/10 transition hover:bg-white/20 disabled:opacity-50"
            title={t('common.refresh')}
            aria-label={t('common.refresh')}
          >
            {refreshing ? (
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-violet-400 border-t-transparent" />
            ) : (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
            )}
          </button>
        </div>

        {/* Search */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 sm:max-w-xs">
            <input
              type="text"
              placeholder={t('myDoubts.search')}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="w-full rounded-xl border-2 border-white/20 bg-gray-900/60 backdrop-blur-sm py-3 pl-4 pr-12 text-sm font-medium text-white placeholder-white/40 outline-none transition-all focus:border-violet-400 focus:ring-4 focus:ring-violet-500/50"
            />
            <span className="absolute right-3 top-2.5 text-white/40">🔍</span>
          </div>
        </div>

        {/* Quick Filters */}
        <div className="mb-6 flex flex-wrap gap-2">
          {quickFilters.map((filter) => {
            const active = activeQuickFilter === filter;
            return (
              <button
                key={filter}
                onClick={() => setActiveQuickFilter(filter)}
                className={`rounded-full px-4 py-1.5 text-xs font-semibold transition ${
                  active
                    ? 'bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white shadow-lg shadow-violet-500/25'
                    : 'bg-white/10 backdrop-blur-sm text-white/70 hover:bg-white/20 border border-white/20'
                }`}
              >
                {quickFilterLabelMap[filter]}
              </button>
            );
          })}
          <button
            onClick={() => setFilterModalVisible(true)}
            className="ml-auto flex items-center gap-1 rounded-full bg-white/10 backdrop-blur-sm px-4 py-1.5 text-xs font-semibold text-white/70 border border-white/20 hover:bg-white/20"
          >
            🔍 {t('myDoubts.filtersTitle')}
          </button>
        </div>

        {/* Doubts Grid */}
        <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
          {doubts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center col-span-full">
              <span className="text-5xl mb-4">📭</span>
              <h3 className="text-lg font-semibold text-white">
                {activeQuickFilter === 'live'
                  ? t('myDoubts.emptyTitleLive')
                  : t('myDoubts.emptyTitleAll')}
              </h3>
              <p className="text-sm text-white/50 mt-1">
                {activeQuickFilter === 'live'
                  ? t('myDoubts.emptyDescLive')
                  : t('myDoubts.emptyDescAll')}
              </p>
            </div>
          ) : (
            <>
              {doubts.map((item) => {
                const statusStyle = getStatusStyle(item.status);
                const explanationStyle = getExplanationStyle(item.preferred_explanation);
                const hasReview = !!item.review;
                const translatedStatus = t(`myDoubts.${item.status}`) || item.status;

                return (
                  <div
                    key={item.doubt_id}
                    onClick={() => handleDoubtPress(item)}
                    className="group cursor-pointer rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-5 shadow-lg transition-all duration-300 hover:-translate-y-1 hover:border-violet-400/40 hover:shadow-xl"
                  >
                    {/* Top Row */}
                    <div className="flex items-start gap-3">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-violet-400/20 text-2xl">
                        {item.preferred_explanation === 'live_video' ? '🎥' : '💬'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-white/40">
                            {t('myDoubts.doubtId')} {item.doubt_id}
                          </span>
                          <span
                            className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold border ${statusStyle.bg} ${statusStyle.textColor} ${statusStyle.border}`}
                          >
                            {statusStyle.emoji} {translatedStatus}
                          </span>
                        </div>
                        <h3 className="mt-1 font-semibold text-white truncate">
                          {item.title}
                        </h3>
                      </div>
                    </div>

                    {/* Category & Type */}
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-violet-400/20 px-3 py-0.5 text-xs font-medium text-violet-300 border border-violet-400/30">
                        {item.category}
                      </span>
                      <span className="text-white/30">|</span>
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold border ${explanationStyle.bg} ${explanationStyle.textColor} ${explanationStyle.border}`}
                      >
                        {explanationStyle.icon} {explanationStyle.text}
                      </span>
                    </div>

                    {/* Tutor & Date */}
                    <div className="mt-3 flex items-center justify-between text-sm">
                      <span className="text-white/50">
                        {t('myDoubts.tutor')}:{' '}
                        <span className="font-medium text-white/80">
                          {item.tutor || t('myDoubts.notAssigned')}
                        </span>
                      </span>
                      <span className="text-xs text-white/40">
                        📅 {formatDate(item.created_at)}
                      </span>
                    </div>

                    {/* Review Section */}
                    {item.status === 'completed' && (
                      <div className="mt-4 rounded-xl bg-white/5 p-3 border border-white/10">
                        {hasReview ? (
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white font-bold">
                                {item.review?.rating}.0
                              </div>
                              <div>
                                <h4 className="text-sm font-semibold text-white">
                                  {t('myDoubts.yourReview')}
                                </h4>
                                <div className="text-yellow-400">
                                  {renderStars(item.review?.rating || 0)}
                                </div>
                                <span className="text-xs text-white/40">
                                  📅 {formatDate(item.review?.created_at || '')}
                                </span>
                              </div>
                            </div>
                            <span className="text-2xl text-white/30">›</span>
                          </div>
                        ) : (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (!item.session?.session_id) {
                                AlertService.warning(
                                  t('myDoubts.sessionNotFoundTitle', {
                                    defaultValue: 'Session Not Found',
                                  }),
                                  t('myDoubts.sessionNotFound', {
                                    defaultValue: 'The session is not available yet. Please try again later.',
                                  }),
                                  [],
                                );
                                return;
                              }
                              router.push(
                                `/student/submit-review/${item.session.session_id}`
                              );
                            }}
                            className="group flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 py-3 text-sm font-bold text-white shadow-lg transition-all duration-300 hover:shadow-xl active:scale-[0.98]"
                          >
                            <span className="transition-transform duration-300 group-hover:rotate-12">
                              ⭐
                            </span>
                            <span>{t('myDoubts.addReview')}</span>
                            <svg
                              className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth={2}
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M9 5l7 7-7 7"
                              />
                            </svg>
                          </button>
                        )}
                      </div>
                    )}

                    {/* Join Active Session */}
                    {item.status === 'assigned' &&
                      item.session &&
                      item.session.status !== 'completed' && (
                        <div className="mt-4">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              const session = item.session;
                              if (!session) return;
                              if (session.session_type === 'live_video') {
                                router.push(`/videocall/${session.session_id}`);
                              } else {
                                router.push(`/chat/${session.session_id}`);
                              }
                            }}
                            className="w-full rounded-xl bg-gradient-to-r from-green-400 to-emerald-600 py-3 text-sm font-bold text-white shadow-md hover:scale-[1.01] transition"
                          >
                            🚀 {t('myDoubts.joinSession')}
                          </button>
                        </div>
                      )}

                    {/* Action Buttons (Completed) */}
                    {item.session?.status === 'completed' && (
                      <div className="mt-3 flex gap-2">
                        {item.session.session_type === 'live_video' ? (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(
                                `/recording/${item.session?.session_id}`
                              );
                            }}
                            className="flex-1 rounded-lg border border-violet-400/40 bg-white/10 backdrop-blur-sm py-2 text-sm font-semibold text-violet-300 hover:bg-violet-500/20 transition"
                          >
                            🎥 {t('myDoubts.viewRecording')}
                          </button>
                        ) : (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(
                                `/student/chat-history?sessionId=${item.session?.session_id}&tutorId=${item.tutor_id}&tutorName=${
                                  item.tutor || t('myDoubts.notAssigned')
                                }`
                              );
                            }}
                            className="flex-1 rounded-lg border border-violet-400/40 bg-white/10 backdrop-blur-sm py-2 text-sm font-semibold text-violet-300 hover:bg-violet-500/20 transition"
                          >
                            💬 {t('myDoubts.viewChat')}
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}

              {/* "See More" Pagination */}
              {nextPageUrl && (
                <button
                  onClick={loadMore}
                  disabled={loadingMore}
                  className="w-full rounded-xl bg-white/10 backdrop-blur-md py-3 text-sm font-semibold text-white/80 hover:bg-white/20 disabled:opacity-50 transition border border-white/10"
                >
                  {loadingMore
                    ? t('common.loading')
                    : t('myDoubts.seeMore', {
                        count: doubts.length,
                        total: totalCount,
                      })}
                </button>
              )}
              {loadingMore && (
                <div className="flex justify-center py-4">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-violet-400 border-t-transparent" />
                </div>
              )}
            </>
          )}
        </div>

        {/* Floating Ask Doubt Button */}
        <button
          onClick={() => router.push('/student/post-doubt')}
          className="fixed bottom-6 right-6 z-40 flex items-center gap-2 rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 px-5 py-3 text-sm font-bold text-white shadow-xl shadow-violet-500/25 transition-all duration-300 hover:scale-105 hover:shadow-2xl"
        >
          <Zap size={18} />
          {t('sidebar.askDoubt')}
        </button>

        {/* Filter Modal */}
        {filterModalVisible && (
          <div
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm sm:items-center"
            onClick={() => setFilterModalVisible(false)}
          >
            <div
              className="w-full max-w-md rounded-t-2xl bg-[#1a1738] border border-white/10 backdrop-blur-xl p-6 shadow-2xl sm:rounded-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="mb-4 text-xl font-bold text-white">
                {t('myDoubts.filtersTitle')}
              </h2>

              <label className="mb-2 block text-sm font-semibold text-white/80">
                {t('myDoubts.category')}
              </label>
              <div className="mb-4 flex flex-wrap gap-2">
                {categoryOptions.map((cat) => (
                  <button
                    key={cat}
                    onClick={() =>
                      setTempFilters((prev) => ({ ...prev, category: cat }))
                    }
                    className={`rounded-full px-3 py-1 text-xs font-semibold border ${
                      tempFilters.category === cat
                        ? 'bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white border-transparent'
                        : 'bg-white/10 text-white/70 border-white/20 hover:bg-white/20'
                    }`}
                  >
                    {cat === ''
                      ? t('common.all')
                      : cat === 'Other'
                      ? t('myDoubts.other')
                      : cat}
                  </button>
                ))}
              </div>

              <label className="mb-2 block text-sm font-semibold text-white/80">
                {t('myDoubts.mode')}
              </label>
              <div className="mb-4 flex flex-wrap gap-2">
                {modeOptions.map((mode) => (
                  <button
                    key={mode}
                    onClick={() =>
                      setTempFilters((prev) => ({ ...prev, mode }))
                    }
                    className={`rounded-full px-3 py-1 text-xs font-semibold border ${
                      tempFilters.mode === mode
                        ? 'bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white border-transparent'
                        : 'bg-white/10 text-white/70 border-white/20 hover:bg-white/20'
                    }`}
                  >
                    {mode === ''
                      ? t('common.all')
                      : t(`myDoubts.${mode}`) || mode}
                  </button>
                ))}
              </div>

              <label className="mb-2 block text-sm font-semibold text-white/80">
                {t('myDoubts.status')}
              </label>
              <select
                value={tempFilters.status}
                onChange={(e) =>
                  setTempFilters((prev) => ({ ...prev, status: e.target.value }))
                }
                className="mb-4 w-full rounded-xl border-2 border-white/20 bg-gray-900/60 backdrop-blur-sm px-4 py-3 text-sm text-white font-medium outline-none transition-all focus:border-violet-400 focus:ring-4 focus:ring-violet-500/50"
              >
                <option value="">{t('common.all')}</option>
                <option value="open">{t('myDoubts.open')}</option>
                <option value="assigned">{t('myDoubts.assigned')}</option>
                <option value="completed">{t('myDoubts.completed')}</option>
              </select>

              <div className="mb-4 grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-semibold text-white/80">
                    {t('common.from')}
                  </label>
                  <input
                    type="date"
                    value={tempFilters.from_date}
                    onChange={(e) =>
                      setTempFilters((prev) => ({
                        ...prev,
                        from_date: e.target.value,
                      }))
                    }
                    className="w-full rounded-xl border-2 border-white/20 bg-gray-900/60 backdrop-blur-sm px-4 py-3 text-sm text-white outline-none transition-all focus:border-violet-400 focus:ring-4 focus:ring-violet-500/50"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-semibold text-white/80">
                    {t('common.to')}
                  </label>
                  <input
                    type="date"
                    value={tempFilters.to_date}
                    onChange={(e) =>
                      setTempFilters((prev) => ({
                        ...prev,
                        to_date: e.target.value,
                      }))
                    }
                    className="w-full rounded-xl border-2 border-white/20 bg-gray-900/60 backdrop-blur-sm px-4 py-3 text-sm text-white outline-none transition-all focus:border-violet-400 focus:ring-4 focus:ring-violet-500/50"
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={resetFilters}
                  className="flex-1 rounded-lg border border-white/20 bg-white/10 py-2 text-sm font-semibold text-white/80 hover:bg-white/20"
                >
                  {t('common.reset')}
                </button>
                <button
                  onClick={applyFilters}
                  className="flex-1 rounded-lg bg-gradient-to-r from-violet-500 to-fuchsia-500 py-2 text-sm font-semibold text-white hover:shadow-lg"
                >
                  {t('common.apply')}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyDoubtsScreen;