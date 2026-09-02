'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getOnlineTutors } from '@/services/v1Service';
import { subscribeDashboard } from '@/store/dashboardRealtime';
import { dashboardCache } from '@/store/dashboardCache';
import { useTranslation } from 'react-i18next';
import AlertService from '@/services/alertService';

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
  const { t } = useTranslation();
  const router = useRouter();

  const [tutors, setTutors] = useState<Tutor[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    let mounted = true;

    const fetchTutors = async () => {
      try {
        setLoading(true);

        const res = await getOnlineTutors();

        if (!mounted) return;

        const responseData = res?.data;

        const tutorData: Tutor[] = Array.isArray(responseData)
          ? responseData
          : Array.isArray(responseData?.results)
            ? responseData.results
            : Array.isArray(responseData?.tutors)
              ? responseData.tutors
              : [];

        dashboardCache.onlineTutors = tutorData;
        setTutors([...tutorData]);
      } catch (error) {
        console.error('Error fetching online tutors:', error);

        if (mounted) {
          setTutors([]);
          AlertService.error(
            'Tutors Error',
            'Failed to load tutors. Please try again.',
          );
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchTutors();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    const unsubscribe = subscribeDashboard(() => {
      console.log('🔄 Tutors Realtime Update');
      setTutors([...(dashboardCache.onlineTutors || [])]);
    });

    return unsubscribe;
  }, []);

  const filteredTutors = useMemo(() => {
    const query = search.toLowerCase().trim();

    if (!query) {
      return tutors;
    }

    return tutors.filter((tutor) => {
      const displayName = tutor.display_name?.toLowerCase() || '';
      const skills = tutor.skills?.toLowerCase() || '';

      return displayName.includes(query) || skills.includes(query);
    });
  }, [tutors, search]);

  const handleRequestTutor = (tutor: Tutor) => {
    const tutorName = tutor.display_name || 'Tutor';

    router.push(
      `/student/post-doubt?tutorId=${encodeURIComponent(
        String(tutor.id),
      )}&tutorName=${encodeURIComponent(tutorName)}`,
    );
  };

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
              👨‍🏫 {t('tutorsPage.title')}
            </h1>

            <p className="mt-2 text-white/70">
              {t('tutorsPage.subtitle')}
            </p>
          </div>

          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('tutorsPage.searchPlaceholder')}
            aria-label={t('tutorsPage.searchPlaceholder')}
            className="w-full rounded-xl border-2 border-white/20 bg-gray-900/60 backdrop-blur-md px-4 py-3 text-white placeholder-white/40 focus:ring-4 focus:ring-violet-500/50 focus:border-violet-400 outline-none transition-all md:w-80"
          />
        </div>

        {loading ? (
          <div className="flex justify-center py-20 text-white/70 text-lg">
            <div className="text-center">
              <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-violet-400 border-t-transparent" />
              <p className="mt-3">{t('tutorsPage.loading')}</p>
            </div>
          </div>
        ) : filteredTutors.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/20 bg-white/5 backdrop-blur-md p-10 text-center">
            <div className="mb-3 text-4xl">👨‍🏫</div>

            <p className="text-white/60 text-lg">
              {t('tutorsPage.noTutors')}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredTutors.map((tutor) => {
              const displayName = tutor.display_name || 'Tutor';
              const initial = displayName.charAt(0).toUpperCase();

              return (
                <div
                  key={tutor.id}
                  className="group rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-6 shadow-xl transition-all duration-300 hover:-translate-y-1 hover:border-violet-400/40 hover:shadow-2xl"
                >
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 font-bold text-white shadow-lg">
                        {initial}
                      </div>

                      <div className="min-w-0">
                        <h3 className="font-semibold text-white truncate">
                          {displayName}
                        </h3>

                        <p className="text-sm text-white/60">
                          {t('tutorsPage.yearsExperience', {
                            experience: tutor.experience ?? 0,
                          })}
                        </p>
                      </div>
                    </div>

                    {/* Online/Offline indicator */}
                    <span
                      title={tutor.is_online ? 'Online' : 'Offline'}
                      aria-label={tutor.is_online ? 'Online' : 'Offline'}
                      className={`mt-1 h-3 w-3 shrink-0 rounded-full shadow-lg ${
                        tutor.is_online
                          ? 'bg-emerald-400 shadow-emerald-400/50 animate-pulse'
                          : 'bg-rose-400 shadow-rose-400/30'
                      }`}
                    />
                  </div>

                  {/* Skills */}
                  <div className="mt-4 min-h-[42px]">
                    <p className="text-sm text-white/70 line-clamp-2">
                      {tutor.skills || '—'}
                    </p>
                  </div>

                  {/* Badges */}
                  <div className="mt-4 flex min-h-[30px] flex-wrap gap-2">
                    {tutor.is_verified && (
                      <span className="rounded-full bg-sky-400/20 text-sky-300 border border-sky-400/30 px-3 py-1 text-xs font-semibold">
                        ✅ {t('studentHome.verified')}
                      </span>
                    )}

                    {tutor.is_top_tutor && (
                      <span className="rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30 px-3 py-1 text-xs font-semibold">
                        ⭐ {t('studentHome.topTutor')}
                      </span>
                    )}
                  </div>

                  {/* Rating */}
                  <div className="mt-4 text-sm text-white/50">
                    {t('tutorsPage.ratingAndReviews', {
                      rating: Number(tutor.average_rating || 0).toFixed(1),
                      reviews: tutor.total_reviews || 0,
                    })}
                  </div>

                  {/* Action Button */}
                  <button
                    type="button"
                    onClick={() => handleRequestTutor(tutor)}
                    className="mt-6 w-full rounded-xl bg-gradient-to-r from-violet-500 to-fuchsia-500 py-3 font-semibold text-white shadow-lg shadow-violet-500/25 transition hover:from-violet-600 hover:to-fuchsia-600 active:scale-[0.98]"
                  >
                    {t('tutorsPage.requestTutorButton')}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
