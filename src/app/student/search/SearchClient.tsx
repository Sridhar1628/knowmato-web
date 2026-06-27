'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  getMyDoubts,
  getAvailableTutors,
} from '@/services/v1Service';
import toast from 'react-hot-toast';

interface SearchDoubt {
  doubt_id: number;
  title: string;
  category: string;
  status: string;
  tutor: string | null;
  created_at?: string;
}

interface SearchTutor {
  id: number;
  name: string;
  skills: string;
  average_rating: number;
  total_reviews: number;
  is_online: boolean;
  is_verified: boolean;
  is_top_tutor: boolean;
}

export default function SearchPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const query = searchParams.get('q')?.trim() || '';

  const [loading, setLoading] = useState(true);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [doubts, setDoubts] = useState<SearchDoubt[]>([]);
  const [tutors, setTutors] = useState<SearchTutor[]>([]);

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem('recent_searches') || '[]');
    setRecentSearches(stored);
  }, []);

  const fetchResults = useCallback(async () => {
    if (!query) {
      setDoubts([]);
      setTutors([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      const [doubtsRes, tutorsRes] = await Promise.all([
        getMyDoubts({ search: query, page: 1 }),
        getAvailableTutors(),
      ]);

      console.log('Doubts:', doubtsRes);
      console.log('Tutors:', tutorsRes);

      const doubtsData =
        doubtsRes?.results?.data || doubtsRes?.data || doubtsRes?.results || [];
      const tutorsData = tutorsRes?.data || [];

      const filteredDoubts = doubtsData.filter(
        (d: SearchDoubt) =>
          d.title?.toLowerCase().includes(query.toLowerCase()) ||
          d.category?.toLowerCase().includes(query.toLowerCase())
      );

      const filteredTutors = tutorsData.filter((t: SearchTutor) => {
        const name = t.name?.toLowerCase() || '';
        const skills = t.skills?.toLowerCase() || '';
        const search = query.toLowerCase();
        return name.includes(search) || skills.includes(search);
      });

      setDoubts(filteredDoubts);
      setTutors(filteredTutors);
    } catch (error) {
      console.error('Search error:', error);
      toast.error('Failed to load search results');
    } finally {
      setLoading(false);
    }
  }, [query]);

  useEffect(() => {
    fetchResults();
  }, [fetchResults]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e] relative overflow-hidden p-4 sm:p-6 lg:p-8">
      {/* Animated background blobs */}
      <div className="absolute top-0 -left-20 w-72 h-72 bg-purple-500/20 rounded-full mix-blend-multiply filter blur-3xl animate-blob" />
      <div className="absolute top-0 -right-20 w-72 h-72 bg-fuchsia-500/20 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000" />
      <div className="absolute -bottom-20 left-40 w-72 h-72 bg-cyan-500/20 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000" />

      <div className="relative z-10 mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-violet-300 to-fuchsia-300">
            🔍 Search Results
          </h1>
          <p className="mt-2 text-white/70">
            Search Query:
            <span className="ml-2 font-semibold text-violet-300">
              {query || 'None'}
            </span>
          </p>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-violet-400 border-t-transparent" />
          </div>
        )}

        {/* Results */}
        {!loading && (
          <>
            {/* Doubts */}
            <div className="mb-10">
              <h2 className="mb-4 text-xl font-bold text-white">
                📚 My Doubts
                <span className="ml-2 text-sm text-white/50">({doubts.length})</span>
              </h2>

              {doubts.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-white/20 bg-white/5 backdrop-blur-md p-6 text-center">
                  <p className="text-white/50">No matching doubts found.</p>
                </div>
              ) : (
                <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                  {doubts.map((doubt) => (
                    <button
                      key={doubt.doubt_id}
                      onClick={() =>
                        router.push(`/student/my-doubts/${doubt.doubt_id}`)
                      }
                      className="group rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-5 text-left shadow-lg transition-all duration-300 hover:-translate-y-1 hover:border-violet-400/40 hover:shadow-xl"
                    >
                      <div className="flex items-start justify-between">
                        <h3 className="line-clamp-2 font-semibold text-white group-hover:text-violet-300 transition-colors">
                          {doubt.title}
                        </h3>
                        <span className="rounded-full bg-violet-400/20 px-2 py-1 text-xs font-medium text-violet-300 border border-violet-400/30">
                          {doubt.status}
                        </span>
                      </div>
                      <p className="mt-3 text-sm text-white/50">{doubt.category}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Tutors */}
            <div>
              <h2 className="mb-4 text-xl font-bold text-white">
                👨‍🏫 Tutors
                <span className="ml-2 text-sm text-white/50">({tutors.length})</span>
              </h2>

              {tutors.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-white/20 bg-white/5 backdrop-blur-md p-6 text-center">
                  <p className="text-white/50">No matching tutors found.</p>
                </div>
              ) : (
                <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                  {tutors.map((tutor) => (
                    <div
                      key={tutor.id}
                      className="group rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-5 shadow-lg transition-all duration-300 hover:-translate-y-1 hover:border-violet-400/40 hover:shadow-xl"
                    >
                      <div className="flex items-center gap-3 mb-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 text-lg font-bold text-white shadow-md">
                          {tutor.name?.charAt(0)?.toUpperCase()}
                        </div>
                        <div>
                          <h3 className="font-semibold text-white group-hover:text-violet-300 transition-colors">
                            {tutor.name}
                          </h3>
                          <p
                            className={`text-xs font-medium ${
                              tutor.is_online ? 'text-emerald-400' : 'text-rose-400'
                            }`}
                          >
                            {tutor.is_online ? '🟢 Online' : '🔴 Offline'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 mb-2">
                        {tutor.is_verified && <span>✅</span>}
                        {tutor.is_top_tutor && <span>⭐</span>}
                      </div>

                      <p className="mt-2 text-sm text-white/50">{tutor.skills}</p>
                      <p className="mt-2 text-xs text-white/40">
                        ⭐ {tutor.average_rating}
                        {' • '}
                        {tutor.total_reviews} reviews
                      </p>

                      <button
                        disabled={!tutor.is_online}
                        onClick={() =>
                          router.push(
                            `/student/post-doubt?tutorId=${tutor.id}&tutorName=${encodeURIComponent(
                              tutor.name
                            )}`
                          )
                        }
                        className={`mt-4 w-full rounded-lg px-4 py-2 text-sm font-semibold text-white transition ${
                          tutor.is_online
                            ? 'bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:from-violet-600 hover:to-fuchsia-600 shadow-lg shadow-violet-500/25'
                            : 'cursor-not-allowed bg-white/10 text-white/40 border border-white/10'
                        }`}
                      >
                        {tutor.is_online ? '🚀 Request This Tutor' : '🔴 Tutor Offline'}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}