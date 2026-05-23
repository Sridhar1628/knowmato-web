'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { getStudentSessions, endSession, StudentSession } from '@/services/sessionService';
import { getTokens } from '@/services/storageService';
import { submitReview } from '@/services/reviewService';

// Helper functions
const formatDate = (dateString?: string) => {
  if (!dateString) return 'Not scheduled';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return 'Not scheduled';
  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const getStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
    case 'active': return 'bg-blue-500';
    case 'completed': return 'bg-green-500';
    case 'cancelled': return 'bg-red-500';
    case 'scheduled': return 'bg-amber-500';
    default: return 'bg-gray-500';
  }
};

const getStatusEmoji = (status: string) => {
  switch (status.toLowerCase()) {
    case 'active': return '🟢';
    case 'completed': return '✅';
    case 'cancelled': return '❌';
    case 'scheduled': return '⏳';
    default: return '⚪';
  }
};

type Session = StudentSession; // assuming same shape

export default function StudentSessionsPage() {
  const router = useRouter();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [endingSessionId, setEndingSessionId] = useState<number | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Filter and sort sessions
  const filteredSessions = useMemo(() => {
    let filtered = sessions;
    if (selectedStatus !== 'all') {
      filtered = filtered.filter(s => s.status === selectedStatus);
    }
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        s => s.doubt.toLowerCase().includes(query) || s.tutor.toLowerCase().includes(query)
      );
    }
    // Sort by scheduled_time (newest first)
    return [...filtered].sort(
      (a, b) => new Date(b.scheduled_time).getTime() - new Date(a.scheduled_time).getTime()
    );
  }, [sessions, selectedStatus, searchQuery]);

  const fetchSessions = useCallback(async (isRefresh = false) => {
    if (!isRefresh) setLoading(true);
    try {
      const data = await getStudentSessions();
      setSessions(Array.isArray(data) ? data : []);
    } catch (error: any) {
      console.error('Fetch sessions error:', error);
      alert(error?.response?.data?.error || 'Could not load your sessions.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  // WebSocket connections for real-time updates
  useEffect(() => {
    let sessionSockets: WebSocket[] = [];
    let userSocket: WebSocket | null = null;

    const connectSockets = async () => {
      try {
        const tokens = await getTokens();
        if (!tokens?.access) return;

        // Connect to each active session's WebSocket
        const activeSessions = sessions.filter(s => s.status === 'active');
        activeSessions.forEach(session => {
          const socket = new WebSocket(
            `ws://127.0.0.1:8000/ws/session/${session.session_id}/?token=${tokens.access}`
          );
          socket.onopen = () => console.log(`🔥 Session WS Connected: ${session.session_id}`);
          socket.onmessage = (event) => {
            const data = JSON.parse(event.data);
            handleSessionRealtime(data);
          };
          socket.onerror = (err) => console.error('❌ Session WS Error:', err);
          socket.onclose = () => console.log(`🔌 Session WS Closed: ${session.session_id}`);
          sessionSockets.push(socket);
        });

        // Connect to user's personal WebSocket
        const payload = JSON.parse(atob(tokens.access.split('.')[1]));
        const userId = payload.user_id;
        userSocket = new WebSocket(
          `ws://127.0.0.1:8000/ws/user/${userId}/?token=${tokens.access}`
        );
        userSocket.onopen = () => console.log('🔥 USER WS CONNECTED');
        userSocket.onmessage = (event) => {
          const data = JSON.parse(event.data);
          handleUserRealtime(data);
        };
        userSocket.onerror = (err) => console.error('❌ USER WS ERROR:', err);
        userSocket.onclose = () => console.log('🔌 USER WS CLOSED');
      } catch (err) {
        console.error('Socket connection error:', err);
      }
    };

    if (sessions.length > 0) {
      connectSockets();
    }

    return () => {
      sessionSockets.forEach(s => s.close());
      if (userSocket) userSocket.close();
    };
  }, [sessions]);

  const handleUserRealtime = (data: any) => {
    if (!data?.event) return;

    if (data.event === 'SESSION_CREATED') {
      const newSession = data.data;
      setSessions(prev => {
        if (prev.some(s => s.session_id === newSession.session_id)) return prev;
        return [newSession, ...prev];
      });
    }

    if (data.event === 'SESSION_STARTED') {
      const updated = data.data;
      setSessions(prev =>
        prev.map(s => (s.session_id === updated.session_id ? { ...s, status: 'active' } : s))
      );
    }

    if (data.event === 'SESSION_ENDED') {
      const updated = data.data;
      setSessions(prev =>
        prev.map(s => (s.session_id === updated.session_id ? { ...s, status: 'completed' } : s))
      );
    }
  };

  const handleSessionRealtime = (data: any) => {
    if (!data?.type) return;
    if (data.type === 'SESSION_STARTED') {
      setSessions(prev =>
        prev.map(s => (s.session_id === data.session_id ? { ...s, status: 'active' } : s))
      );
    }
    if (data.type === 'SESSION_ISSUE') {
      alert(`Session Issue: ${data.issue}`);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchSessions(true);
  };

  const handleEndSession = async (sessionId: number) => {
    if (!confirm('Are you sure you want to end this session? You will be asked to rate the tutor afterwards.')) {
      return;
    }
    setEndingSessionId(sessionId);
    try {
      await endSession(sessionId);
      alert('Session ended. Please submit a review.');
      setSessions(prev =>
        prev.map(s => (s.session_id === sessionId ? { ...s, status: 'completed' } : s))
      );
      router.push(`/student/review/${sessionId}`);
    } catch (err: any) {
      const msg = err?.response?.data?.error || 'Failed to end session.';
      alert(msg);
    } finally {
      setEndingSessionId(null);
    }
  };

  const handleJoinChat = (sessionId: number) => {
    router.push(`/student/chat/${sessionId}`);
  };

  const handleReview = (sessionId: number) => {
    router.push(`/student/review/${sessionId}`);
  };

  if (loading && !refreshing) {
    return (
      <div className="flex min-min-h-[100dvh] items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
          <p className="mt-3 text-gray-600">Loading your sessions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-min-h-[100dvh] bg-gray-50 py-6">
      <div className="mx-auto max-w-3xl px-4">
        {/* Search Bar */}
        <div className="mb-4">
          <input
            type="text"
            placeholder="🔍 Search by doubt or tutor..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-full border border-gray-300 bg-white px-5 py-2.5 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        {/* Filter Chips */}
        <div className="mb-6 flex flex-wrap gap-2">
          {['all', 'active', 'completed', 'cancelled', 'scheduled'].map((status) => (
            <button
              key={status}
              onClick={() => setSelectedStatus(status)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
                selectedStatus === status
                  ? 'bg-indigo-600 text-white shadow'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-100'
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
          <button
            onClick={onRefresh}
            disabled={refreshing}
            className="ml-auto rounded-full bg-white px-4 py-1.5 text-sm font-medium text-gray-700 border border-gray-300 hover:bg-gray-100 disabled:opacity-50"
          >
            {refreshing ? 'Refreshing...' : '⟳ Refresh'}
          </button>
        </div>

        {/* Sessions List */}
        {filteredSessions.length === 0 ? (
          <div className="mt-10 rounded-2xl bg-white p-8 text-center shadow-sm">
            <div className="text-5xl mb-3">📭</div>
            <h3 className="text-lg font-semibold text-gray-800">No sessions found</h3>
            <p className="text-gray-500">
              {searchQuery || selectedStatus !== 'all'
                ? 'Try changing your filters or search query.'
                : 'When you book a doubt session, it will appear here.'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredSessions.map((session) => {
              const isActive = session.status === 'active';
              const isCompleted = session.status === 'completed';
              const isCancelled = session.status === 'cancelled';
              const isScheduled = session.status === 'scheduled';
              const isEnding = endingSessionId === session.session_id;

              return (
                <div key={session.session_id} className="rounded-2xl bg-white p-5 shadow-sm transition hover:shadow-md">
                  <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-gray-900 line-clamp-2">{session.doubt}</h3>
                      <p className="text-xs text-gray-500 mt-0.5">Session ID: {session.session_id}</p>
                    </div>
                    <div className={`flex items-center gap-1 rounded-full px-3 py-1 text-white ${getStatusColor(session.status)}`}>
                      <span>{getStatusEmoji(session.status)}</span>
                      <span className="text-xs font-semibold">{session.status.toUpperCase()}</span>
                    </div>
                  </div>

                  <div className="space-y-1 text-sm">
                    <div className="flex">
                      <span className="w-24 text-gray-500">👨‍🏫 Tutor:</span>
                      <span className="font-medium text-gray-800">{session.tutor}</span>
                    </div>
                    <div className="flex">
                      <span className="w-24 text-gray-500">📅 Scheduled:</span>
                      <span className="font-medium text-gray-800">{formatDate(session.scheduled_time)}</span>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-3 pt-3 border-t border-gray-100">
                    {isActive && (
                      <>
                        <button
                          onClick={() => handleJoinChat(session.session_id)}
                          className="flex-1 rounded-full bg-indigo-600 py-2 text-center text-sm font-semibold text-white transition hover:bg-indigo-700"
                        >
                          💬 Chat
                        </button>
                        <button
                          onClick={() => handleEndSession(session.session_id)}
                          disabled={isEnding}
                          className="flex-1 rounded-full bg-red-500 py-2 text-center text-sm font-semibold text-white transition hover:bg-red-600 disabled:opacity-50"
                        >
                          {isEnding ? 'Ending...' : '⏹️ End Session'}
                        </button>
                      </>
                    )}
                    {isCompleted && (
                      <button
                        onClick={() => handleReview(session.session_id)}
                        className="w-full rounded-full bg-green-600 py-2 text-center text-sm font-semibold text-white transition hover:bg-green-700"
                      >
                        ⭐ Review Tutor
                      </button>
                    )}
                    {isScheduled && (
                      <div className="w-full rounded-full bg-amber-100 py-2 text-center text-sm font-medium text-amber-700">
                        ⏰ Waiting to start
                      </div>
                    )}
                    {isCancelled && (
                      <div className="w-full rounded-full bg-red-100 py-2 text-center text-sm font-medium text-red-700">
                        🚫 Session cancelled
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}