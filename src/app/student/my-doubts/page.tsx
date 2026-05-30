'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { getMyDoubts } from '@/services/v1Service';
import { apiGet } from '@/services/apiService';

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

  const hasFetched =
  useRef(false);

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

  const quickFilters = ['all', 'live', 'live_video', 'text', 'completed'];
  const categoryOptions = ['', 'Python', 'JavaScript', 'Java', 'C++', 'React', 'Web Development', 'Other'];
  const modeOptions = ['', 'pool', 'specific'];

  /* ---------- Fetch doubts ---------- */
  const fetchDoubts = useCallback(async (loadMore = false) => {
    if (!loadMore) setLoading(true);
    else setLoadingMore(true);

    try {
      if (loadMore && nextPageUrl) {
        const res = await apiGet(nextPageUrl);
        const data = res?.data || res;
        const newDoubts = data.results?.data || [];
        setAllDoubts(prev => [

          ...prev,
          ...newDoubts,

        ]);
        setNextPageUrl(

          data.next
            ?.replace(
              'http://',
              'https://'
            ) || null

        );
        return;
      }

      const params: any = { page: 1 };
      const res = await getMyDoubts(params);
      const data = res?.data || res;
      const newDoubts = data.results?.data || [];

      setAllDoubts(newDoubts);
      setNextPageUrl(

        data.next
          ?.replace(
            'http://',
            'https://'
          ) || null

      );
      setTotalCount(data.count || 0);
    } catch (error) {
      console.error('Fetch doubts error:', error);
      window.alert('Failed to load doubts. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  }, [
    nextPageUrl,
  ]);

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

    setFilters({
      ...tempFilters
    });

    setFilterModalVisible(false);

  };

  // Reset filters
  const resetFilters = () => {

    const empty = {

      status: '',
      category: '',
      mode: '',
      search: '',
      from_date: '',
      to_date: '',

    };

    setTempFilters(empty);

    setFilters(empty);

    setFilterModalVisible(false);

  };

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchText), 700);
    return () => clearTimeout(timer);
  }, [searchText]);

  useEffect(() => {
    setFilters(prev => ({ ...prev, search: debouncedSearch }));
  }, [debouncedSearch]);


  useEffect(() => {

    let filtered =
      [...allDoubts];

      console.log(
        'FILTERED:',
        filtered.length
      );

    // -----------------------------------
    // QUICK FILTERS
    // -----------------------------------

    if (
      activeQuickFilter ===
      'completed'
    ) {

      filtered =
        filtered.filter(
          item =>
            item.status ===
            'completed'
        );
    }

    if (
      activeQuickFilter ===
      'live'
    ) {

      filtered =
        filtered.filter(
          item =>
            item.status ===
            'assigned'
        );
    }

    if (
      activeQuickFilter ===
      'live_video'
    ) {

      filtered =
        filtered.filter(
          item =>
            item.preferred_explanation ===
            'live_video'
        );
    }

    if (
      activeQuickFilter ===
      'text'
    ) {

      filtered =
        filtered.filter(
          item =>
            item.preferred_explanation ===
            'text'
        );
    }

    // -----------------------------------
    // CATEGORY
    // -----------------------------------

    if (
      filters.category
    ) {

      filtered =
        filtered.filter(
          item =>
            item.category ===
            filters.category
        );
    }

    // -----------------------------------
    // MODE
    // -----------------------------------

    if (
      filters.mode
    ) {

      filtered =
        filtered.filter(
          item =>
            item.mode ===
            filters.mode
        );
    }

    // -----------------------------------
    // STATUS
    // -----------------------------------

    if (
      filters.status
    ) {

      filtered =
        filtered.filter(
          item =>
            item.status ===
            filters.status
        );
    }

    // -----------------------------------
    // SEARCH
    // -----------------------------------

    if (
      filters.search
    ) {

      const search =
        filters.search
          .toLowerCase();

      filtered =
        filtered.filter(
          item =>

            item.title
              .toLowerCase()
              .includes(search)
        );
    }

    // -----------------------------------
    // DATE FILTER
    // -----------------------------------

    if (
      filters.from_date
    ) {

      filtered =
        filtered.filter(
          item =>

            new Date(
              item.created_at
            ) >=

            new Date(
              filters.from_date
            )
        );
    }

    if (
      filters.to_date
    ) {

      filtered =
        filtered.filter(
          item =>

            new Date(
              item.created_at
            ) <=

            new Date(
              filters.to_date
            )
        );
    }

    // -----------------------------------
    // UPDATE UI
    // -----------------------------------

    setDoubts(filtered);

    setTotalCount(
      filtered.length
    );

  }, [

    allDoubts,

    activeQuickFilter,

    filters.category,

    filters.mode,

    filters.search,

    filters.from_date,

    filters.to_date,

  ]);

  useEffect(() => {

    if (
      hasFetched.current
    ) return;

    hasFetched.current = true;

    fetchDoubts(false);

  }, []);
  
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
        return { emoji: '🟢', color: '#10B981', bg: '#D1FAE5' };
      case 'assigned':
        return { emoji: '🔵', color: '#3B82F6', bg: '#DBEAFE' };
      case 'completed':
        return { emoji: '✅', color: '#6B7280', bg: '#F3F4F6' };
      default:
        return { emoji: '⚪', color: '#6B7280', bg: '#F3F4F6' };
    }
  };

  const renderStars = (rating: number) => '⭐'.repeat(rating);

  const getExplanationStyle = (type: string) => {
    if (type === 'live_video') {
      return { icon: '🎥', text: 'Live Video Session', color: '#7C3AED', bg: '#F3E8FF' };
    }
    return { icon: '💬', text: 'Text/Chat Session', color: '#059669', bg: '#D1FAE5' };
  };

  const handleDoubtPress = (item: Doubt) => {
    router.push(`/student/my-doubts/${item.doubt_id}`);
  };

  /* ---------- Render ---------- */
  if (loading && !refreshing) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      {/* Page heading */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 md:text-3xl">📋 My Doubts</h1>
          <p className="text-sm text-gray-500">Total: {totalCount} doubts</p>
        </div>
        <button
          onClick={onRefresh}
          disabled={refreshing}
          className="rounded-lg bg-white p-2 text-gray-600 shadow-sm hover:bg-gray-50 disabled:opacity-50"
          title="Refresh"
        >
          {refreshing ? (
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
          ) : (
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          )}
        </button>
      </div>

      {/* Ask New Doubt + Search */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <button
          onClick={() => router.push('/student/post-doubt')}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-2.5 font-semibold text-white shadow-md hover:bg-indigo-500 transition"
        >
          ✨ Ask New Doubt
        </button>
        <div className="relative flex-1 sm:max-w-xs">
          <input
            type="text"
            placeholder="Search doubts..."
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
            className="w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-4 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <span className="absolute right-3 top-2.5 text-gray-400">🔍</span>
        </div>
      </div>

      {/* Quick Filters */}
      <div className="mb-6 flex flex-wrap gap-2">
        {quickFilters.map(filter => {
          const active = activeQuickFilter === filter;
          const labelMap: any = {
            all: '📱 All',
            live: '🟢 Live Doubts',
            live_video: '🎥 Live Video',
            text: '💬 Text/Chat',
            completed: '✅ Completed',
          };
          return (
            <button
              key={filter}
              onClick={() => {

                setActiveQuickFilter(
                  filter
                );

              }}
              className={`rounded-full px-4 py-1.5 text-xs font-semibold transition ${
                active
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              {labelMap[filter]}
            </button>
          );
        })}
        <button
          onClick={() => setFilterModalVisible(true)}
          className="ml-auto flex items-center gap-1 rounded-full bg-white px-4 py-1.5 text-xs font-semibold text-gray-600 shadow-sm border border-gray-200 hover:bg-gray-50"
        >
          🔍 Filters
        </button>
      </div>

      {/* Doubts List */}
      <div className="space-y-4">
        {doubts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <span className="text-5xl mb-4">📭</span>
            <h3 className="text-lg font-semibold text-gray-800">
              {activeQuickFilter === 'live' ? 'No Live Doubts' : 'No Doubts Found'}
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              {activeQuickFilter === 'live'
                ? 'New doubts will appear here instantly'
                : 'Try changing filters or search'}
            </p>
          </div>
        ) : (
          <>
            {doubts.map(item => {
              const statusStyle = getStatusStyle(item.status);
              const explanationStyle = getExplanationStyle(item.preferred_explanation);
              const hasReview = !!item.review;

              return (
                <div
                  key={item.doubt_id}
                  onClick={() => handleDoubtPress(item)}
                  className="cursor-pointer rounded-2xl bg-white p-5 shadow-sm border border-gray-100 hover:shadow-md transition"
                >
                  {/* Top Row */}
                  <div className="flex items-start gap-3">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-2xl">
                      {item.preferred_explanation === 'live_video' ? '🎥' : '💬'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-400">ID: {item.doubt_id}</span>
                        <span
                          className="inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold"
                          style={{ backgroundColor: statusStyle.bg, color: statusStyle.color }}
                        >
                          {item.status === 'completed' ? 'Completed ✅' : item.status}
                        </span>
                      </div>
                      <h3 className="mt-1 font-semibold text-gray-900 truncate">{item.title}</h3>
                    </div>
                    <span className="text-lg font-bold text-indigo-600">₹{item.price || 0}</span>
                  </div>

                  {/* Category & Type */}
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-indigo-50 px-3 py-0.5 text-xs font-medium text-indigo-700">
                      {item.category}
                    </span>
                    <span className="text-gray-300">|</span>
                    <span
                      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold"
                      style={{ backgroundColor: explanationStyle.bg, color: explanationStyle.color }}
                    >
                      {explanationStyle.icon} {explanationStyle.text}
                    </span>
                  </div>

                  {/* Tutor & Date */}
                  <div className="mt-3 flex items-center justify-between text-sm">
                    <span className="text-gray-500">
                      👨‍🏫 Tutor: <span className="font-medium text-gray-700">{item.tutor || 'Not Assigned'}</span>
                    </span>
                    <span className="text-xs text-gray-400">📅 {formatDate(item.created_at)}</span>
                  </div>

                  {/* Review Section */}
                  {item.status === 'completed' && (
                    <div className="mt-4 rounded-xl bg-gray-50 p-3">
                      {hasReview ? (
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-600 text-white font-bold">
                              {item.review?.rating}.0
                            </div>
                            <div>
                              <h4 className="text-sm font-semibold text-gray-800">Your Review</h4>
                              <div className="text-yellow-400">{renderStars(item.review?.rating || 0)}</div>
                              <span className="text-xs text-gray-400">
                                📅 {formatDate(item.review?.created_at || '')}
                              </span>
                            </div>
                          </div>
                          <span className="text-2xl text-gray-300">›</span>
                        </div>
                      ) : (
                        <button
                          onClick={e => {
                            e.stopPropagation();
                            router.push(`/student/submit-review/${item.session?.session_id}`);
                          }}
                          className="w-full rounded-lg bg-indigo-600 py-2 text-sm font-semibold text-white hover:bg-indigo-500 transition"
                        >
                          ⭐ Add Review
                        </button>
                      )}
                    </div>
                  )}

                  {/* ====================================== */}
                  {/* JOIN ACTIVE SESSION */}
                  {/* ====================================== */}

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

                            router.push(
                              `/videocall/${session.session_id}`
                            );

                          } else {

                            router.push(
                              `/chat/${session.session_id}`
                            );

                          }

                        }}

                        className="
                          w-full
                          rounded-xl
                          bg-gradient-to-r
                          from-green-500
                          to-emerald-600
                          py-3
                          text-sm
                          font-bold
                          text-white
                          shadow-md
                          transition
                          hover:scale-[1.01]
                        "
                      >

                        🚀 Join Session

                      </button>

                    </div>

                  )}

                  {/* Action Buttons */}
                  {item.session?.status === 'completed' && (
                    <div className="mt-3 flex gap-2">
                      {item.session.session_type === 'live_video' ? (
                        <button
                          onClick={e => {
                            e.stopPropagation();
                            router.push(`/recording/${item.session?.session_id}`);
                          }}
                          className="flex-1 rounded-lg border border-indigo-600 bg-white py-2 text-sm font-semibold text-indigo-600 hover:bg-indigo-50 transition"
                        >
                          🎥 View Recording
                        </button>
                      ) : (
                        <button
                          onClick={e => {
                            e.stopPropagation();
                            router.push(
                              `/chat-history?sessionId=${item.session?.session_id}&tutorId=${item.tutor_id}&tutorName=${item.tutor || 'Tutor'}`
                            );
                          }}
                          className="flex-1 rounded-lg border border-indigo-600 bg-white py-2 text-sm font-semibold text-indigo-600 hover:bg-indigo-50 transition"
                        >
                          💬 View Chat History
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
                className="w-full rounded-xl bg-gray-100 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-200 disabled:opacity-50 transition"
              >
                {loadingMore ? 'Loading...' : `See More (${doubts.length}/${totalCount})`}
              </button>
            )}
            {loadingMore && (
              <div className="flex justify-center py-4">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
              </div>
            )}
          </>
        )}
      </div>

      {/* Filter Modal */}
      {filterModalVisible && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center"
          onClick={() => setFilterModalVisible(false)}
        >
          <div
            className="w-full max-w-md rounded-t-2xl bg-white p-6 shadow-xl sm:rounded-2xl"
            onClick={e => e.stopPropagation()}
          >
            <h2 className="mb-4 text-xl font-bold text-gray-900">Filters</h2>

            <label className="mb-2 block text-sm font-semibold text-gray-700">Category</label>
            <div className="mb-4 flex flex-wrap gap-2">
              {categoryOptions.map(cat => (
                <button
                  key={cat}
                  onClick={() => setTempFilters(prev => ({ ...prev, category: cat }))}
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    tempFilters.category === cat
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {cat || 'All'}
                </button>
              ))}
            </div>

            <label className="mb-2 block text-sm font-semibold text-gray-700">Mode</label>
            <div className="mb-4 flex flex-wrap gap-2">
              {modeOptions.map(mode => (
                <button
                  key={mode}
                  onClick={() => setTempFilters(prev => ({ ...prev, mode }))}
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    tempFilters.mode === mode
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {mode || 'All'}
                </button>
              ))}
            </div>

            <label className="mb-2 block text-sm font-semibold text-gray-700">Status</label>
            <select
              value={tempFilters.status}
              onChange={e => setTempFilters(prev => ({ ...prev, status: e.target.value }))}
              className="mb-4 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">All</option>
              <option value="open">Open</option>
              <option value="assigned">Assigned</option>
              <option value="completed">Completed</option>
            </select>

            <div className="mb-4 grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-sm font-semibold text-gray-700">From</label>
                <input
                  type="date"
                  value={tempFilters.from_date}
                  onChange={e => setTempFilters(prev => ({ ...prev, from_date: e.target.value }))}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold text-gray-700">To</label>
                <input
                  type="date"
                  value={tempFilters.to_date}
                  onChange={e => setTempFilters(prev => ({ ...prev, to_date: e.target.value }))}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={resetFilters}
                className="flex-1 rounded-lg border border-gray-300 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
              >
                Reset
              </button>
              <button
                onClick={applyFilters}
                className="flex-1 rounded-lg bg-indigo-600 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyDoubtsScreen;