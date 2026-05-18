'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { getMyDoubts } from '@/services/doubtService';
import { getTokens } from '@/services/storageService';
import { WS_BASE_URL } from '@/config/env';

// ============================================
// Types
// ============================================
interface Doubt {
  id: number;
  title: string;
  category: string;
  mode: 'pool' | 'specific';
  status: 'open' | 'assigned' | 'completed';
  preferred_explanation: 'text' | 'audio' | 'video' | 'live_video';
  created_at: string;
  fixed_price: number | null;
  is_fixed_price: boolean;
  has_bids: boolean;
  has_session: boolean;
  session_id: number | null;
  tutor_id: number | null;
  tutor_name: string | null;
}

type StatusFilter = 'all' | 'open' | 'assigned' | 'completed';
type ModeFilter = 'all' | 'pool' | 'specific';
type PriceFilter = 'all' | 'fixed' | 'bidding';

// ============================================
// Helper Functions
// ============================================
const getStatusColor = (status: string): string => {
  switch (status) {
    case 'open': return 'bg-amber-500';
    case 'assigned': return 'bg-blue-500';
    case 'completed': return 'bg-green-500';
    default: return 'bg-gray-500';
  }
};

const getStatusEmoji = (status: string): string => {
  switch (status) {
    case 'open': return '🟡';
    case 'assigned': return '🔵';
    case 'completed': return '✅';
    default: return '⚪';
  }
};

const getModeIcon = (mode: string): string => (mode === 'pool' ? '🌊' : '🎯');
const getExplanationIcon = (exp: string): string => {
  switch (exp) {
    case 'text': return '📝';
    case 'audio': return '🎧';
    case 'video': return '🎥';
    case 'live_video': return '📹';
    default: return '💬';
  }
};

const formatDate = (isoString: string): string => {
  const date = new Date(isoString);
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};

// ============================================
// Filter Section Component (Collapsible)
// ============================================
const FilterSection = ({ title, icon, children, defaultOpen = true }: {
  title: string;
  icon: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-gray-200 bg-white px-4 py-2">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between py-2 text-left"
      >
        <div className="flex items-center gap-2">
          <span className="text-lg">{icon}</span>
          <span className="font-semibold text-gray-700">{title}</span>
        </div>
        <span className="text-gray-400 transition-transform duration-200" style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>
          ▼
        </span>
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden pb-3"
          >
            <div className="flex flex-wrap gap-2 pt-1">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const FilterChip = ({ label, value, emoji, active, onClick }: {
  label: string;
  value: string;
  emoji: string;
  active: boolean;
  onClick: () => void;
}) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-1 rounded-full px-3 py-1.5 text-sm font-medium transition ${
      active
        ? 'bg-indigo-600 text-white shadow-sm'
        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
    }`}
  >
    <span>{emoji}</span>
    <span>{label}</span>
  </button>
);

// ============================================
// Main Component
// ============================================
export default function MyDoubtsPage() {
  const router = useRouter();

  // Data states
  const [doubts, setDoubts] = useState<Doubt[]>([]);
  const [filteredDoubts, setFilteredDoubts] = useState<Doubt[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Pagination
  const [nextPageUrl, setNextPageUrl] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  // Filters
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [modeFilter, setModeFilter] = useState<ModeFilter>('all');
  const [priceFilter, setPriceFilter] = useState<PriceFilter>('all');

  // Refs for intersection observer
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  // ---------- Data Fetching (with pagination) ----------
  const fetchDoubts = useCallback(async (url?: string, isRefresh = false) => {
    if (!isRefresh && !url && loadingMore) return;
    if (isRefresh) {
      setRefreshing(true);
      setDoubts([]);
      setNextPageUrl(null);
      setHasMore(true);
    }
    if (!isRefresh && url === null) return;

    try {
      const params: any = {};
      if (modeFilter !== 'all') params.mode = modeFilter;
      if (statusFilter !== 'all') params.status = statusFilter;
      if (priceFilter === 'fixed') params.type = 'fixed';

      const response = await getMyDoubts(params, url || undefined);
      // response structure: { data: { count, next, previous, results: { message, data } } }
      const results = response.data?.results;
      const newDoubts = results?.data || [];
      const nextUrl = results ? (response.data.next || null) : null;

      if (isRefresh || !url) {
        setDoubts(newDoubts);
      } else {
        setDoubts(prev => [...prev, ...newDoubts]);
      }
      setNextPageUrl(nextUrl);
      setHasMore(!!nextUrl);
    } catch (err: any) {
      console.error('Fetch doubts error:', err);
      setError(err?.message || 'Failed to load doubts.');
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  }, [modeFilter, statusFilter, priceFilter]);

  // Initial load & filter changes
  useEffect(() => {
    setLoading(true);
    fetchDoubts(undefined, true);
  }, [fetchDoubts]);

  // Apply local filters (status & mode & price)
  useEffect(() => {
    let filtered = [...doubts];
    if (statusFilter !== 'all') {
      filtered = filtered.filter(d => d.status === statusFilter);
    }
    if (modeFilter !== 'all') {
      filtered = filtered.filter(d => d.mode === modeFilter);
    }
    if (priceFilter === 'fixed') {
      filtered = filtered.filter(d => d.is_fixed_price === true);
    } else if (priceFilter === 'bidding') {
      filtered = filtered.filter(d => d.is_fixed_price === false);
    }
    setFilteredDoubts(filtered);
  }, [doubts, statusFilter, modeFilter, priceFilter]);

  // Infinite scroll observer
  useEffect(() => {
    if (observerRef.current) observerRef.current.disconnect();
    if (!hasMore || loadingMore) return;

    observerRef.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore && !loadingMore && !loading) {
        setLoadingMore(true);
        fetchDoubts(nextPageUrl || undefined);
      }
    }, { threshold: 0.1 });

    if (loadMoreRef.current) observerRef.current.observe(loadMoreRef.current);
    return () => observerRef.current?.disconnect();
  }, [hasMore, loadingMore, loading, nextPageUrl, fetchDoubts]);

  // ---------- WebSocket Real‑time Updates ----------
  useEffect(() => {
    let socket: WebSocket | null = null;
    const connect = async () => {
      const tokens = await getTokens();
      if (!tokens?.access) return;
      socket = new WebSocket(`${WS_BASE_URL}/ws/doubts/?token=${tokens.access}`);
      socket.onopen = () => console.log('🔥 DOUBTS WS CONNECTED');
      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          handleRealtime(data);
        } catch (err) { console.error('WS parse error', err); }
      };
      socket.onerror = (err) => console.error('WS error', err);
    };
    connect();
    return () => { if (socket) socket.close(); };
  }, []);

  const handleRealtime = (data: any) => {
    if (data.type === 'DOUBT_LIST') {
      if (Array.isArray(data.doubts)) setDoubts(data.doubts);
      return;
    }
    if (data.event === 'DOUBT_CREATED') {
      const newDoubt = data.data;
      if (newDoubt) setDoubts(prev => [newDoubt, ...prev]);
      return;
    }
    if (data.event === 'DOUBT_UPDATED') {
      const updated = data.data;
      if (updated?.id) {
        setDoubts(prev => prev.map(d => d.id === updated.id ? updated : d));
      }
    }
  };

  // Navigation handlers
  const handleDoubtClick = (doubtId: number) => {
    router.push(`/student/doubts/${doubtId}`);
  };
  const handleViewHistory = (sessionId: number, tutorId?: number | null, tutorName?: string | null) => {
    router.push(`/student/chat/history?sessionId=${sessionId}&tutorId=${tutorId}&tutorName=${tutorName}`);
  };
  const handleViewRecordings = (doubtId: number) => {
    router.push(`/student/doubts/${doubtId}/recordings`);
  };

  // Refresh handler
  const onRefresh = () => {
    setRefreshing(true);
    fetchDoubts(undefined, true);
  };

  // Loading & error states
  if (loading && !refreshing) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
          <p className="mt-3 text-gray-600">Loading your doubts...</p>
        </div>
      </div>
    );
  }

  if (error && !loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-4">
        <div className="text-5xl mb-3">⚠️</div>
        <p className="text-red-500 text-center mb-4">{error}</p>
        <button
          onClick={onRefresh}
          className="rounded-full bg-indigo-600 px-5 py-2 text-white font-semibold hover:bg-indigo-700"
        >
          ⟳ Retry
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      <div className="mx-auto max-w-3xl px-4 pt-6">
        {/* Header with Refresh Button */}
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-800">📋 My Doubts</h1>
          <button
            onClick={onRefresh}
            disabled={refreshing}
            className="rounded-full bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm ring-1 ring-gray-200 hover:bg-gray-50 disabled:opacity-50"
          >
            {refreshing ? 'Refreshing...' : '⟳ Refresh'}
          </button>
        </div>

        {/* Collapsible Filters */}
        <div className="mb-5 overflow-hidden rounded-xl bg-white shadow-sm">
          <FilterSection title="Status" icon="📌">
            <FilterChip label="All" value="all" emoji="📋" active={statusFilter === 'all'} onClick={() => setStatusFilter('all')} />
            <FilterChip label="Open" value="open" emoji="🟡" active={statusFilter === 'open'} onClick={() => setStatusFilter('open')} />
            <FilterChip label="Assigned" value="assigned" emoji="🔵" active={statusFilter === 'assigned'} onClick={() => setStatusFilter('assigned')} />
            <FilterChip label="Completed" value="completed" emoji="✅" active={statusFilter === 'completed'} onClick={() => setStatusFilter('completed')} />
          </FilterSection>

          <FilterSection title="Mode" icon="🎯">
            <FilterChip label="All" value="all" emoji="🌐" active={modeFilter === 'all'} onClick={() => setModeFilter('all')} />
            <FilterChip label="Pool" value="pool" emoji="🌊" active={modeFilter === 'pool'} onClick={() => setModeFilter('pool')} />
            <FilterChip label="Specific" value="specific" emoji="🎯" active={modeFilter === 'specific'} onClick={() => setModeFilter('specific')} />
          </FilterSection>

          <FilterSection title="Price Type" icon="💰">
            <FilterChip label="All" value="all" emoji="💵" active={priceFilter === 'all'} onClick={() => setPriceFilter('all')} />
            <FilterChip label="Fixed" value="fixed" emoji="🔒" active={priceFilter === 'fixed'} onClick={() => setPriceFilter('fixed')} />
            <FilterChip label="Bidding" value="bidding" emoji="⚖️" active={priceFilter === 'bidding'} onClick={() => setPriceFilter('bidding')} />
          </FilterSection>
        </div>

        {/* Doubts List */}
        {filteredDoubts.length === 0 ? (
          <div className="rounded-2xl bg-white p-10 text-center shadow-sm">
            <div className="text-6xl mb-3">📭</div>
            <p className="text-lg font-semibold text-gray-700">No doubts found</p>
            <p className="text-gray-500">
              {statusFilter !== 'all' || modeFilter !== 'all' || priceFilter !== 'all'
                ? 'No doubts match the selected filters. Try changing filters.'
                : "You haven't posted any doubts yet. Tap 'Post Doubt' to get started!"}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredDoubts.map((doubt, idx) => (
              <motion.div
                key={doubt.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="cursor-pointer rounded-xl bg-white p-5 shadow-sm transition hover:shadow-md"
                onClick={() => handleDoubtClick(doubt.id)}
              >
                {/* Header: Title + Status */}
                <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
                  <h3 className="text-lg font-bold text-gray-900 line-clamp-2">{doubt.title}</h3>
                  <div className={`flex items-center gap-1 rounded-full px-3 py-1 text-white ${getStatusColor(doubt.status)}`}>
                    <span>{getStatusEmoji(doubt.status)}</span>
                    <span className="text-xs font-semibold">{doubt.status.toUpperCase()}</span>
                  </div>
                </div>

                {/* Meta Row: Mode + Explanation */}
                <div className="mb-2 flex flex-wrap gap-3">
                  <span className="flex items-center gap-1 rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-700">
                    <span>{getModeIcon(doubt.mode)}</span>
                    <span>{doubt.mode === 'pool' ? 'Pool' : 'Specific Tutor'}</span>
                  </span>
                  <span className="flex items-center gap-1 rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-700">
                    <span>{getExplanationIcon(doubt.preferred_explanation)}</span>
                    <span>{doubt.preferred_explanation.replace('_', ' ').toUpperCase()}</span>
                  </span>
                </div>

                {/* Fixed Price Badge */}
                {doubt.is_fixed_price && doubt.fixed_price !== null && (
                  <div className="mb-2 inline-block rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
                    💰 Fixed: ₹{doubt.fixed_price}
                  </div>
                )}

                {/* Footer: Category + Date */}
                <div className="mt-3 flex items-center justify-between border-t border-gray-100 pt-3 text-xs text-gray-500">
                  <span>📚 {doubt.category}</span>
                  <span>📅 {formatDate(doubt.created_at)}</span>
                </div>

                {/* Extra Badges */}
                <div className="mt-2 flex flex-wrap gap-2">
                  {doubt.has_bids && (
                    <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-600">💰 Has bids</span>
                  )}
                  {doubt.has_session && (
                    <span className="rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-600">🎓 Session scheduled</span>
                  )}
                </div>

                {/* Action Buttons for Completed Doubts */}
                {doubt.status === 'completed' && doubt.session_id && (
                  <div className="mt-4 flex flex-wrap gap-3 border-t border-gray-100 pt-3">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleViewHistory(doubt.session_id!, doubt.tutor_id, doubt.tutor_name);
                      }}
                      className="rounded-lg bg-indigo-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-indigo-700"
                    >
                      📜 View History
                    </button>
                    {doubt.preferred_explanation === 'video' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewRecordings(doubt.id);
                        }}
                        className="rounded-lg bg-emerald-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-emerald-700"
                      >
                        🎥 View Recordings
                      </button>
                    )}
                  </div>
                )}
              </motion.div>
            ))}

            {/* Infinite scroll sentinel */}
            {hasMore && (
              <div ref={loadMoreRef} className="py-4 text-center">
                {loadingMore ? (
                  <div className="flex justify-center">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
                  </div>
                ) : (
                  <span className="text-sm text-gray-400">Scroll for more</span>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}