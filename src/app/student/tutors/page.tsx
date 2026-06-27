'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getOnlineTutors } from '@/services/v1Service';
import { subscribeDashboard } from '@/store/dashboardRealtime';
import { dashboardCache } from '@/store/dashboardCache';

interface Tutor {
  id: number;
  display_name: string;
  skills: string;
  experience: number;
  average_rating: number;
  total_reviews: number;
  is_verified: boolean;
  is_top_tutor: boolean;
  is_online: boolean;
}

export default function TutorsPage() {
  const router = useRouter();
  const [tutors, setTutors] = useState<Tutor[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchTutors = async () => {
      try {
        const res = await getOnlineTutors();
        const tutorData = res.data || [];
        dashboardCache.onlineTutors = tutorData;
        setTutors(tutorData);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchTutors();
  }, []);

  useEffect(() => {
    const unsubscribe = subscribeDashboard(() => {
      console.log('🔄 Tutors Realtime Update');
      setTutors([...dashboardCache.onlineTutors]);
    });
    return unsubscribe;
  }, []);

  const filteredTutors = tutors.filter((tutor) => {
    const q = search.toLowerCase().trim();
    return (
      tutor.display_name.toLowerCase().includes(q) ||
      tutor.skills?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e] relative overflow-hidden">
      {/* Animated background blobs */}
      <div className="absolute top-0 -left-20 w-72 h-72 bg-purple-500/20 rounded-full mix-blend-multiply filter blur-3xl animate-blob" />
      <div className="absolute top-0 -right-20 w-72 h-72 bg-fuchsia-500/20 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000" />
      <div className="absolute -bottom-20 left-40 w-72 h-72 bg-cyan-500/20 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000" />

      <div className="relative z-10 mx-auto max-w-7xl p-6">
        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-violet-300 to-fuchsia-300">
              👨‍🏫 Expert Tutors
            </h1>
            <p className="mt-2 text-white/70">Connect with verified experts</p>
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tutors..."
            className="w-full rounded-xl border-2 border-white/20 bg-gray-900/60 backdrop-blur-md px-4 py-3 text-white placeholder-white/40 focus:ring-4 focus:ring-violet-500/50 focus:border-violet-400 outline-none transition-all md:w-80"
          />
        </div>

        {loading ? (
          <div className="flex justify-center py-20 text-white/70 text-lg">
            <div className="text-center">
              <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-violet-400 border-t-transparent" />
              <p className="mt-3">Loading tutors...</p>
            </div>
          </div>
        ) : filteredTutors.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/20 bg-white/5 backdrop-blur-md p-10 text-center">
            <p className="text-white/60 text-lg">No tutors available.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredTutors.map((tutor) => (
              <div
                key={tutor.id}
                className="group rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-6 shadow-xl transition-all duration-300 hover:-translate-y-1 hover:border-violet-400/40 hover:shadow-2xl"
              >
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 font-bold text-white shadow-lg">
                      {tutor.display_name?.charAt(0)?.toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-semibold text-white">{tutor.display_name}</h3>
                      <p className="text-sm text-white/60">
                        {tutor.experience}+ Years Experience
                      </p>
                    </div>
                  </div>
                  {/* Online/Offline indicator */}
                  <span
                    className={`h-3 w-3 rounded-full shadow-lg ${
                      tutor.is_online
                        ? 'bg-emerald-400 shadow-emerald-400/50 animate-pulse'
                        : 'bg-rose-400 shadow-rose-400/30'
                    }`}
                  />
                </div>

                {/* Skills */}
                <div className="mt-4">
                  <p className="text-sm text-white/70 line-clamp-2">{tutor.skills}</p>
                </div>

                {/* Badges */}
                <div className="mt-4 flex flex-wrap gap-2">
                  {tutor.is_verified && (
                    <span className="rounded-full bg-sky-400/20 text-sky-300 border border-sky-400/30 px-3 py-1 text-xs font-semibold">
                      ✅ Verified
                    </span>
                  )}
                  {tutor.is_top_tutor && (
                    <span className="rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30 px-3 py-1 text-xs font-semibold">
                      ⭐ Top Tutor
                    </span>
                  )}
                </div>

                {/* Rating */}
                <div className="mt-4 text-sm text-white/50">
                  ⭐ {tutor.average_rating} • {tutor.total_reviews} Reviews
                </div>

                {/* Action Button */}
                <button
                  onClick={() =>
                    router.push(`/student/post-doubt?tutorId=${tutor.id}`)
                  }
                  className="mt-6 w-full rounded-xl bg-gradient-to-r from-violet-500 to-fuchsia-500 py-3 font-semibold text-white shadow-lg shadow-violet-500/25 transition hover:from-violet-600 hover:to-fuchsia-600"
                >
                  Request Tutor
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}