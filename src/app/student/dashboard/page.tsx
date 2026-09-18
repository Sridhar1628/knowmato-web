'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  getStudentDashboard,
  getOnlineTutors,
  getCurrentAffairs,
  CurrentAffair,
  getMyDoubts,
  getStudentProfile,
} from '@/services/v1Service';
import { dashboardCache } from '@/store/dashboardCache';
import { subscribeDashboard } from '@/store/dashboardRealtime';
import PostDoubtModal from '@/components/dashboard/PostDoubtModal';
import { connectSocket } from '@/services/versionSocketService';
import { updateDashboardCache } from '@/store/dashboardEvents';
import { useTranslation } from 'react-i18next';
import AlertService from '@/services/alertService';

interface OnlineTutor {
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

interface RecentDoubt {
  doubt_id: number;
  title: string;
  category: string;
  preferred_explanation: string;
  status: string;
  mode: string;
  tutor: string | null;
  created_at: string;
  session?: {
    session_id: number;
    status: string;
    session_type: string;
  };
}

/* =========================================================
   PROFILE REMINDER CONSTANTS
========================================================== */

const PROFILE_REMINDER_STORAGE_KEY = "profile_reminder_time";
const PROFILE_REMINDER_DURATION = 24 * 60 * 60 * 1000;

/*
 * Store the reminder per user when an id is available.
 * This prevents another student's old timestamp from
 * suppressing this student's first reminder.
 */
const getProfileReminderKey = (
  userId?: string | number | null
): string => {
  if (
    userId !== undefined &&
    userId !== null &&
    String(userId).trim() !== ""
  ) {
    return `${PROFILE_REMINDER_STORAGE_KEY}_${String(userId)}`;
  }

  return PROFILE_REMINDER_STORAGE_KEY;
};

const shouldShowProfileReminder = (
  userId?: string | number | null
): boolean => {
  if (typeof window === "undefined") {
    console.log("[PROFILE REMINDER] SSR -> no alert decision");
    return false;
  }

  const storageKey = getProfileReminderKey(userId);

  console.group("[PROFILE REMINDER] Visibility check");
  console.log("User ID:", userId ?? "NOT AVAILABLE");
  console.log("Storage key:", storageKey);

  try {
    const savedTime = localStorage.getItem(storageKey);

    console.log("Saved timestamp:", savedTime);

    // No timestamp = this user has never clicked Ask Me Later.
    if (!savedTime) {
      console.log(">>> FIRST TIME: SHOW ALERT <<<");
      console.groupEnd();
      return true;
    }

    const lastReminderTime = Number(savedTime);

    if (
      !Number.isFinite(lastReminderTime) ||
      lastReminderTime <= 0
    ) {
      console.warn(
        "Invalid timestamp. Removing it and showing alert."
      );

      localStorage.removeItem(storageKey);

      console.log(">>> INVALID TIMESTAMP: SHOW ALERT <<<");
      console.groupEnd();
      return true;
    }

    const now = Date.now();
    const elapsed = now - lastReminderTime;
    const elapsedHours =
      elapsed / (60 * 60 * 1000);

    console.log("Current timestamp:", now);
    console.log(
      "Last Ask Me Later timestamp:",
      lastReminderTime
    );
    console.log(
      "Elapsed hours:",
      elapsedHours.toFixed(2)
    );

    if (elapsed < 0) {
      console.warn(
        "System clock moved backwards."
      );

      console.log(">>> SHOW ALERT <<<");
      console.groupEnd();
      return true;
    }

    if (elapsed < PROFILE_REMINDER_DURATION) {
      const remainingHours =
        (PROFILE_REMINDER_DURATION - elapsed) /
        (60 * 60 * 1000);

      console.log(
        ">>> WITHIN 24 HOURS: HIDE ALERT <<<"
      );
      console.log(
        "Remaining hours:",
        remainingHours.toFixed(2)
      );

      console.groupEnd();
      return false;
    }

    console.log(
      ">>> 24 HOURS COMPLETED: SHOW ALERT <<<"
    );
    console.groupEnd();

    return true;
  } catch (error) {
    console.error(
      "[PROFILE REMINDER] localStorage error:",
      error
    );

    console.log(
      ">>> STORAGE ERROR: SHOW ALERT <<<"
    );

    console.groupEnd();
    return true;
  }
};

const saveProfileReminderTime = (
  userId?: string | number | null
): void => {
  if (typeof window === "undefined") {
    return;
  }

  const storageKey = getProfileReminderKey(userId);
  const timestamp = Date.now();

  try {
    localStorage.setItem(
      storageKey,
      String(timestamp)
    );

    console.group(
      "[PROFILE REMINDER] Ask Me Later"
    );
    console.log("User ID:", userId ?? "NOT AVAILABLE");
    console.log("Storage key:", storageKey);
    console.log("Saved timestamp:", timestamp);
    console.log(
      "Reminder suppressed for: 24 hours"
    );
    console.groupEnd();
  } catch (error) {
    console.error(
      "[PROFILE REMINDER] Failed to save timestamp:",
      error
    );
  }
};
export default function DashboardPage() {
  const { t } = useTranslation();
  const router = useRouter();

  const [currentPrice, setCurrentPrice] =
    useState<number | null>(null);

  const [loading, setLoading] =
    useState(!dashboardCache.loaded);

  const [onlineTutors, setOnlineTutors] =
    useState<OnlineTutor[]>([]);

  const [selectedTutor, setSelectedTutor] =
    useState<OnlineTutor | null>(null);

  const [showTutorProfile, setShowTutorProfile] =
    useState(false);

  const [currentAffairs, setCurrentAffairs] =
    useState<CurrentAffair[]>([]);

  const [showPostModal, setShowPostModal] =
    useState(false);

  const [quickDoubt, setQuickDoubt] =
    useState('');

  const [recentDoubts, setRecentDoubts] =
    useState<RecentDoubt[]>([]);

  const [showProfileAlert, setShowProfileAlert] =
    useState(false);

  
  /*
   * Used to make the Ask-Me-Later timestamp account-specific.
   */
  const [profileUserId, setProfileUserId] =
    useState<string | number | null>(null);

const [checkingProfile, setCheckingProfile] =
    useState(true);

  /* =========================================================
     FETCH DASHBOARD DATA
  ========================================================== */

  const fetchDashboardData = useCallback(async () => {
    try {
      const res = await getStudentDashboard();

      const data = res.data || res;

      dashboardCache.currentPrice =
        data.current_price;

      setCurrentPrice(
        data.current_price ?? null
      );

      /* -----------------------------------------------
         CURRENT AFFAIRS
      ------------------------------------------------ */

      const currentAffairsRes =
        await getCurrentAffairs();

      const affairsData =
        (currentAffairsRes?.data || []).filter(
          (item: CurrentAffair) => {
            const createdAt =
              new Date(item.created_at);

            const now = new Date();

            const diffHours =
              (now.getTime() -
                createdAt.getTime()) /
              (1000 * 60 * 60);

            return diffHours <= 24;
          }
        );

      dashboardCache.currentAffairs =
        affairsData;

      setCurrentAffairs(affairsData);

      /* -----------------------------------------------
         RECENT DOUBTS
      ------------------------------------------------ */

      const doubtsRes =
        await getMyDoubts({
          page: 1,
        });

      const doubtsData =
        doubtsRes?.results?.data ||
        doubtsRes?.data ||
        [];

      dashboardCache.recentDoubts =
        doubtsData.slice(0, 6);

      setRecentDoubts(
        doubtsData.slice(0, 6)
      );

      /* -----------------------------------------------
         ONLINE TUTORS
      ------------------------------------------------ */

      const tutorsRes =
        await getOnlineTutors();

      const tutorsData =
        tutorsRes?.data || [];

      console.log(
        'ONLINE TUTORS API',
        tutorsData
      );

      dashboardCache.onlineTutors =
        tutorsData;

      setOnlineTutors(tutorsData);
    } catch (error) {
      console.error(
        'Dashboard fetch error:',
        error
      );

      AlertService.error(
        'Dashboard Error',
        t('studentHome.dashboardError') ||
          'Could not load dashboard data.'
      );
    } finally {
      setLoading(false);
    }

    dashboardCache.loaded = true;
    dashboardCache.lastFetched =
      Date.now();
  }, [t]);

  /* =========================================================
   PROFILE CHECK + 24-HOUR REMINDER
========================================================== */

useEffect(() => {
  let mounted = true;

  const checkStudentProfile = async () => {
    console.group(
      "[PROFILE CHECK] Student dashboard"
    );

    try {
      console.log(
        "[PROFILE CHECK] Calling getStudentProfile()..."
      );

      const profileResponse = await getStudentProfile();

      console.log(
        "[PROFILE CHECK] FULL API RESPONSE:",
        profileResponse
      );

      if (!mounted) {
        console.log(
          "[PROFILE CHECK] Component unmounted."
        );
        console.groupEnd();
        return;
      }

      /*
      * getStudentProfile() returns:
      *
      * {
      *   success: boolean;
      *   data: StudentProfile;
      * }
      */
      /*
       * getStudentProfile() returns:
       *
       * {
       *   success: boolean;
       *   data: StudentProfile;
       * }
       *
       * StudentProfile contains the profile fields directly.
       * Do not access profileData.user or profileData.user.id here.
       */
      const profileData = profileResponse.data;

      const userId =
        profileData?.id ?? null;

      const rawProfileCompleted =
        profileData?.profile_completed;

      console.log(
        "[PROFILE CHECK] Extracted profileData:",
        profileData
      );

      console.log(
        "[PROFILE CHECK] Extracted profile id:",
        userId
      );

      console.log(
        "[PROFILE CHECK] Raw profile_completed:",
        rawProfileCompleted
      );

      console.log(
        "[PROFILE CHECK] profile_completed type:",
        typeof rawProfileCompleted
      );

      /*
       * Normalize backend values.
       *
       * Complete:
      *   true / "1" / "true"
       *
       * Incomplete:
       *   false / 0 / "0" / "false" / null / undefined
       */
      const profileCompleted =
        rawProfileCompleted === true ||
        String(rawProfileCompleted) === "1" ||
        String(rawProfileCompleted) === "true";

      console.log(
        "[PROFILE CHECK] Normalized profileCompleted:",
        profileCompleted
      );

      if (userId !== null) {
        setProfileUserId(userId);
      }

      /*
       * COMPLETE PROFILE
       */
      if (profileCompleted) {
        console.log(
          "[PROFILE CHECK] PROFILE COMPLETE -> HIDE ALERT"
        );

        setShowProfileAlert(false);

        console.groupEnd();
        return;
      }

      /*
       * INCOMPLETE PROFILE
       */
      console.log(
        "[PROFILE CHECK] PROFILE INCOMPLETE"
      );

      const shouldShow =
        shouldShowProfileReminder(userId);

      console.log(
        "[PROFILE CHECK] Final alert decision:",
        shouldShow
      );

      setShowProfileAlert(shouldShow);

      if (shouldShow) {
        console.log(
          "🟣 [PROFILE CHECK] >>> SHOWING PROFILE ALERT <<<"
        );
      } else {
        console.log(
          "🟡 [PROFILE CHECK] >>> ALERT HIDDEN FOR 24 HOURS <<<"
        );
      }

      console.groupEnd();
    } catch (err) {
      console.error(
        "[PROFILE CHECK] API FAILED:",
        err
      );

      if (!mounted) {
        console.groupEnd();
        return;
      }

      setShowProfileAlert(false);

      AlertService.error(
        "Profile Verification Failed",
        t("studentHome.profileError") ||
          "Unable to verify your profile."
      );

      router.replace(
        "/student/profile"
      );

      console.groupEnd();
    } finally {
      if (mounted) {
        setCheckingProfile(false);

        console.log(
          "[PROFILE CHECK] checkingProfile = false"
        );
      }
    }
  };

  checkStudentProfile();

  return () => {
    mounted = false;

    console.log(
      "[PROFILE CHECK] Cleanup"
    );
  };
}, [router, t]);



  /* =========================================================
     REALTIME DASHBOARD SUBSCRIPTION
  ========================================================== */

  useEffect(() => {
    const unsubscribe =
      subscribeDashboard(() => {
        console.log(
          '🔄 Dashboard Realtime Update'
        );

        setOnlineTutors([
          ...dashboardCache.onlineTutors,
        ]);

        setRecentDoubts([
          ...dashboardCache.recentDoubts,
        ]);

        setCurrentAffairs([
          ...dashboardCache.currentAffairs,
        ]);

        setCurrentPrice(
          dashboardCache.currentPrice
        );
      });

    return unsubscribe;
  }, []);

  /* =========================================================
     REFRESH ONLINE TUTORS
  ========================================================== */

  useEffect(() => {
    const refreshTutors = async () => {
      try {
        const tutorsRes =
          await getOnlineTutors();

        const tutorsData =
          tutorsRes?.data || [];

        console.log(
          'REFRESHED TUTORS',
          tutorsData
        );

        dashboardCache.onlineTutors =
          tutorsData;

        setOnlineTutors(tutorsData);
      } catch (err) {
        console.error(
          'Tutor refresh failed',
          err
        );
      }
    };

    const handleRefresh = () => {
      refreshTutors();
    };

    window.addEventListener(
      'refresh-online-tutors',
      handleRefresh
    );

    return () =>
      window.removeEventListener(
        'refresh-online-tutors',
        handleRefresh
      );
  }, []);

  /* =========================================================
     DASHBOARD CACHE
  ========================================================== */

  useEffect(() => {
    if (dashboardCache.loaded) {
      setCurrentPrice(
        dashboardCache.currentPrice
      );

      setOnlineTutors(
        dashboardCache.onlineTutors
      );

      setCurrentAffairs(
        dashboardCache.currentAffairs
      );

      setRecentDoubts(
        dashboardCache.recentDoubts
      );

      return;
    }

    fetchDashboardData();
  }, [fetchDashboardData]);

  /* =========================================================
     LOADING
  ========================================================== */

  if (loading || checkingProfile) {
    return (
      <div className="relative flex h-64 items-center justify-center overflow-hidden rounded-3xl bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e]">
        <div className="absolute -left-20 top-0 h-72 w-72 rounded-full bg-purple-500/20 blur-3xl" />

        <div className="absolute -right-20 top-0 h-72 w-72 rounded-full bg-fuchsia-500/20 blur-3xl" />

        <div className="relative z-10 text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-violet-400 border-t-transparent" />

          <p className="mt-3 text-sm text-white/70">
            {t('studentHome.loading')}
          </p>
        </div>
      </div>
    );
  }

  /* =========================================================
     TIME AGO
  ========================================================== */

  const getTimeAgo = (
    dateString: string
  ) => {
    const created =
      new Date(dateString);

    const now =
      new Date();

    const diffMs =
      now.getTime() -
      created.getTime();

    const minutes =
      Math.floor(
        diffMs /
          (1000 * 60)
      );

    const hours =
      Math.floor(
        diffMs /
          (1000 * 60 * 60)
      );

    if (minutes < 60) {
      return `${minutes} ${t(
        'studentHome.minAgo'
      )}`;
    }

    if (hours < 24) {
      return `${hours} ${t(
        'studentHome.hrAgo'
      )}`;
    }

    return created.toLocaleDateString();
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e]">

      {/* =========================================================
          ANIMATED BACKGROUND BLOBS
      ========================================================== */}

      <div className="absolute left-[-5rem] top-0 h-72 w-72 animate-blob rounded-full bg-purple-500/20 blur-3xl mix-blend-multiply" />

      <div className="animation-delay-2000 absolute right-[-5rem] top-0 h-72 w-72 animate-blob rounded-full bg-fuchsia-500/20 blur-3xl mix-blend-multiply" />

      <div className="animation-delay-4000 absolute bottom-[-5rem] left-40 h-72 w-72 animate-blob rounded-full bg-cyan-500/20 blur-3xl mix-blend-multiply" />

      <div className="relative z-10 flex flex-col gap-6 p-4 sm:p-6 lg:p-8 xl:flex-row">

        {/* =====================================================
            MAIN CONTENT COLUMN
        ====================================================== */}

        <div className="min-w-0 flex-1">

          {/* Hero Banner */}

          <div className="relative mb-6 flex flex-col-reverse items-center justify-between overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur-xl md:flex-row md:p-8">

            <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 blur-2xl" />

            <div className="z-10 text-center md:text-left">

              <h1 className="bg-gradient-to-r from-violet-300 via-fuchsia-300 to-cyan-300 bg-clip-text text-2xl font-bold leading-tight text-transparent md:text-3xl lg:text-4xl">
                {t('studentHome.heroTitle')}
              </h1>

              <p className="mt-2 text-sm text-white/70">
                {t('studentHome.heroSubtitle')}
              </p>

              <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">

                <button
                  onClick={() =>
                    router.push(
                      '/student/post-doubt'
                    )
                  }
                  className="rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 px-6 py-2.5 font-bold text-white shadow-lg shadow-violet-500/25 transition-all hover:from-violet-600 hover:to-fuchsia-600"
                >
                  🚀 {t('sidebar.askDoubt')}
                </button>

                <button className="rounded-full border border-white/20 px-6 py-2.5 font-semibold text-white transition-all hover:bg-white/10">
                  ▶️ {t(
                    'studentHome.howItWorks'
                  )}
                </button>

              </div>
            </div>

            <div className="relative mb-4 md:mb-0">

              <div className="h-32 w-32 rounded-xl bg-gradient-to-b from-indigo-400 to-purple-500 opacity-30 blur-xl md:h-40 md:w-40" />

              <div className="absolute inset-0 flex items-center justify-center text-5xl text-white/80 md:text-6xl">
                🧑‍💻
              </div>

            </div>
          </div>

          {/* =====================================================
              ASK A DOUBT
          ====================================================== */}

          <div className="mb-8 rounded-2xl border border-white/10 bg-white/5 p-4 shadow-2xl backdrop-blur-xl md:p-6">

            <div className="mb-4 flex items-center justify-between">

              <div>
                <h3 className="text-lg font-bold text-white">
                  {t(
                    'studentHome.explainDoubtTitle'
                  )}
                </h3>

                <p className="text-xs text-white/50">
                  {t(
                    'studentHome.explainDoubtSub'
                  )}
                </p>
              </div>

              <div className="flex items-center gap-1 rounded-full border border-emerald-400/30 bg-emerald-400/20 px-3 py-1 text-xs font-bold text-emerald-300">
                <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />

                {t(
                  'studentHome.avgConnectTime',
                  {
                    seconds: 45,
                  }
                )}
              </div>

            </div>

            <div className="rounded-xl border border-white/10 bg-white/10 p-4">

              <textarea
                value={quickDoubt}
                onChange={(e) =>
                  setQuickDoubt(
                    e.target.value
                  )
                }
                placeholder={t(
                  'studentHome.explainPlaceholder'
                )}
                className="min-h-[120px] w-full rounded-2xl border-2 border-white/20 bg-gray-900/60 p-5 text-white placeholder-white/40 shadow-sm outline-none transition-all focus:border-violet-400 focus:ring-4 focus:ring-violet-500/50"
              />

              <div className="mt-3 flex flex-wrap items-center justify-between gap-4 border-t border-white/10 pt-3">

                <div className="flex gap-2" />

                <div className="flex items-center gap-3">

                  <button
                    onClick={() => {

                      if (
                        !quickDoubt.trim()
                      ) {
                        AlertService.warning(
                          'Doubt Required',
                          t(
                            'studentHome.pleaseDescribeDoubt'
                          ),
                          []
                        );

                        return;
                      }

                      setShowPostModal(
                        true
                      );
                    }}
                    className="rounded-2xl bg-gradient-to-r from-violet-500 to-fuchsia-500 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-violet-500/25 transition-all hover:scale-[1.02]"
                  >
                    🚀 {t(
                      'studentHome.findExperts'
                    )}
                  </button>

                </div>
              </div>
            </div>
          </div>

          {/* =====================================================
              RECENT DOUBTS
          ====================================================== */}

          <div className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-2xl backdrop-blur-xl">

            <div className="mb-4 flex items-center justify-between">

              <div>
                <h2 className="text-lg font-bold text-white">
                  📚 {t(
                    'studentHome.recentDoubtsTitle'
                  )}
                </h2>

                <p className="text-xs text-white/50">
                  {t(
                    'studentHome.recentDoubtsSub'
                  )}
                </p>
              </div>

              <button
                onClick={() =>
                  router.push(
                    '/student/my-doubts'
                  )
                }
                className="text-sm font-semibold text-violet-300 hover:text-violet-200"
              >
                {t('common.viewAll')}
              </button>

            </div>

            {recentDoubts.length === 0 ? (

              <div className="rounded-2xl border border-dashed border-white/20 p-8 text-center">
                <p className="text-sm text-white/50">
                  {t(
                    'studentHome.noRecentDoubts'
                  )}
                </p>
              </div>

            ) : (

              <div className="scrollbar-hide flex gap-4 overflow-x-auto pb-2">

                {recentDoubts.map(
                  (doubt) => (
                    <button
                      key={
                        doubt.doubt_id
                      }
                      onClick={() =>
                        router.push(
                          `/student/my-doubts/${doubt.doubt_id}`
                        )
                      }
                      className="min-w-[280px] flex-shrink-0 rounded-2xl border border-white/10 bg-white/5 p-4 text-left shadow-lg backdrop-blur-xl transition-all hover:-translate-y-1 hover:border-violet-400/40 hover:shadow-xl"
                    >

                      <div className="mb-3 flex items-center justify-between">

                        <span className="rounded-full border border-violet-400/30 bg-violet-400/20 px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-violet-300">
                          {doubt.category}
                        </span>

                        <span
                          className={`rounded-full px-2 py-1 text-[10px] font-bold ${
                            doubt.status ===
                            'completed'
                              ? 'border border-emerald-400/30 bg-emerald-400/20 text-emerald-300'
                              : 'border border-amber-400/30 bg-amber-400/20 text-amber-300'
                          }`}
                        >
                          {doubt.status ===
                          'completed'
                            ? t(
                                'myDoubts.completed'
                              )
                            : t(
                                'myDoubts.open'
                              )}
                        </span>

                      </div>

                      <h3 className="line-clamp-2 text-base font-bold text-white">
                        {doubt.title}
                      </h3>

                      <p className="mt-2 text-sm text-white/50">
                        👨‍🏫{' '}
                        {doubt.tutor ||
                          t(
                            'myDoubts.notAssigned'
                          )}
                      </p>

                      <div className="mt-3 flex items-center gap-2 text-xs text-white/40">

                        <span>
                          {doubt.session
                            ?.session_type ===
                          'live_video'
                            ? '🎥 ' +
                              t(
                                'myDoubts.liveVideo'
                              )
                            : '💬 ' +
                              t(
                                'myDoubts.textChat'
                              )}
                        </span>

                        <span>•</span>

                        <span>
                          {doubt.mode ===
                          'specific'
                            ? t(
                                'myDoubts.specific'
                              )
                            : t(
                                'myDoubts.pool'
                              )}
                        </span>

                      </div>

                      <p className="mt-4 text-xs text-white/30">
                        {new Date(
                          doubt.created_at
                        ).toLocaleDateString()}
                      </p>

                    </button>
                  )
                )}

              </div>
            )}

          </div>
        </div>

        {/* =====================================================
            RIGHT SIDEBAR
        ====================================================== */}

        <aside className="hidden self-start xl:sticky xl:top-20 xl:flex xl:w-80 xl:flex-col xl:gap-6">

          {/* Live Tutors */}

          <div>

            <div className="mb-4 flex items-center justify-between">

              <h3 className="text-base font-bold text-white">
                {t(
                  'studentHome.liveTutorsTitle'
                )}
              </h3>

              <button
                onClick={() =>
                  router.push(
                    '/student/tutors'
                  )
                }
                className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm font-semibold text-cyan-300 transition-all hover:bg-white/10 hover:text-cyan-200"
              >
                {t('common.viewAll')}

                <svg
                  className="h-4 w-4"
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

            </div>

            <div className="scrollbar-hide max-h-[350px] space-y-3 overflow-y-auto pr-2">

              {onlineTutors.length ===
                0 && (
                <div className="rounded-xl border border-dashed border-white/20 bg-white/5 p-6 text-center backdrop-blur-md">
                  <p className="text-sm text-white/50">
                    {t(
                      'studentHome.noTutorsOnline'
                    )}
                  </p>
                </div>
              )}

              {onlineTutors.map(
                (tutor) => (
                  <div
                    key={tutor.id}
                    onClick={() => {
                      setSelectedTutor(
                        tutor
                      );
                      setShowTutorProfile(
                        true
                      );
                    }}
                    className="flex cursor-pointer items-center justify-between rounded-xl border border-white/10 bg-white/5 p-3 shadow-lg backdrop-blur-md transition hover:border-violet-400/40 hover:shadow-xl"
                  >

                    <div className="flex items-center gap-3">

                      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 text-sm font-bold text-white shadow-lg">
                        {tutor.display_name.charAt(
                          0
                        )}
                      </div>

                      <div>

                        <div className="flex items-center gap-1">

                          <p className="text-sm font-bold text-white">
                            {tutor.display_name}
                          </p>

                          {tutor.is_verified && (
                            <span
                              title={t(
                                'studentHome.verified'
                              )}
                            >
                              ✅
                            </span>
                          )}

                          {tutor.is_top_tutor && (
                            <span
                              title={t(
                                'studentHome.topTutor'
                              )}
                            >
                              ⭐
                            </span>
                          )}

                        </div>

                        <p className="max-w-[180px] truncate text-[11px] text-white/50">
                          {tutor.skills}
                        </p>

                        <div className="mt-1 flex items-center gap-2 text-[10px] text-white/40">
                          <span>
                            ⭐{' '}
                            {tutor.average_rating ||
                              0}
                          </span>

                          <span>
                            •{' '}
                            {
                              tutor.total_reviews
                            }{' '}
                            {t(
                              'studentHome.reviews'
                            )}
                          </span>
                        </div>

                      </div>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();

                        router.push(
                          `/student/post-doubt?tutorId=${tutor.id}&tutorName=${encodeURIComponent(
                            tutor.display_name
                          )}`
                        );
                      }}
                      className="rounded-lg border border-violet-400/30 bg-violet-500/20 px-3 py-1.5 text-[11px] font-bold text-violet-300 transition-all hover:bg-violet-500/30"
                    >
                      {t(
                        'studentHome.requestButton'
                      )}
                    </button>

                  </div>
                )
              )}

            </div>
          </div>

          {/* Current Affairs */}

          <div className="scrollbar-hide max-h-[650px] space-y-4 overflow-y-auto pr-2">

            <div className="mb-4 flex items-center justify-between">

              <div>

                <h2 className="text-lg font-bold text-white">
                  📰 {t(
                    'currentAffairs.title'
                  )}
                </h2>

                <p className="text-xs text-white/50">
                  {t(
                    'currentAffairs.subtitle'
                  )}
                </p>

              </div>

              <button
                onClick={() =>
                  router.push(
                    '/student/current-affairs'
                  )
                }
                className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm font-semibold text-cyan-300 transition-all hover:bg-white/10 hover:text-cyan-200"
              >
                {t('common.viewAll')}

                <span className="rounded-full border border-violet-400/30 bg-violet-500/20 px-2 py-0.5 text-[10px] text-violet-300">
                  {currentAffairs.length}
                </span>
              </button>

            </div>

            {currentAffairs.length ===
              0 && (
              <div className="rounded-xl border border-dashed border-white/20 bg-white/5 p-6 text-center backdrop-blur-md">
                <p className="text-sm text-white/50">
                  {t(
                    'currentAffairs.empty'
                  )}
                </p>
              </div>
            )}

            <div className="space-y-4">

              {currentAffairs
                .slice(0, 5)
                .map((item) => (
                  <div
                    key={item.id}
                    onClick={() =>
                      router.push(
                        '/student/current-affairs/'
                      )
                    }
                    className="cursor-pointer overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md transition hover:border-violet-400/40 hover:shadow-xl"
                  >

                    {item.image_url && (
                      <img
                        src={
                          item.image_url
                        }
                        alt={item.title}
                        className="h-44 w-full object-cover"
                      />
                    )}

                    <div className="p-4">

                      <span className="inline-block rounded-full border border-violet-400/30 bg-violet-400/20 px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-violet-300">
                        {item.category}
                      </span>

                      <h3 className="mt-3 text-base font-bold text-white">
                        {item.title}
                      </h3>

                      <p className="mt-2 line-clamp-3 text-sm leading-6 text-white/70">
                        {item.description}
                      </p>

                      <div className="mt-4 flex items-center justify-between">

                        <span className="rounded-full bg-white/10 px-2 py-1 text-[10px] font-semibold text-white/50">
                          🕒{' '}
                          {getTimeAgo(
                            item.created_at
                          )}
                        </span>

                        <span className="text-[11px] text-white/30">
                          {new Date(
                            item.created_at
                          ).toLocaleString(
                            [],
                            {
                              month:
                                'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute:
                                '2-digit',
                            }
                          )}
                        </span>

                      </div>
                    </div>

                  </div>
                ))}

            </div>
          </div>
        </aside>

        {/* =====================================================
            TUTOR PROFILE MODAL
        ====================================================== */}

        {showTutorProfile &&
          selectedTutor && (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
              onClick={() =>
                setShowTutorProfile(false)
              }
            >
              <div
                onClick={(e) =>
                  e.stopPropagation()
                }
                className="w-full max-w-md rounded-3xl border border-white/10 bg-[#15122f]/90 p-6 shadow-2xl backdrop-blur-xl"
              >

                <div className="text-center">

                  <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 text-3xl font-bold text-white shadow-lg">
                    {selectedTutor.display_name.charAt(
                      0
                    )}
                  </div>

                  <h2 className="mt-4 text-2xl font-bold text-white">
                    {
                      selectedTutor.display_name
                    }
                  </h2>

                  <p className="mt-1 text-sm text-white/70">
                    {
                      selectedTutor.skills
                    }
                  </p>

                  <div className="mt-3 flex flex-wrap justify-center gap-2">

                    {selectedTutor.is_online && (
                      <span className="rounded-full border border-emerald-400/30 bg-emerald-400/20 px-3 py-1 text-xs font-bold text-emerald-300">
                        🟢{' '}
                        {t(
                          'studentHome.online'
                        )}
                      </span>
                    )}

                    {selectedTutor.is_verified && (
                      <span className="rounded-full border border-sky-400/30 bg-sky-400/20 px-3 py-1 text-xs font-bold text-sky-300">
                        ✅{' '}
                        {t(
                          'studentHome.verified'
                        )}
                      </span>
                    )}

                    {selectedTutor.is_top_tutor && (
                      <span className="rounded-full border border-amber-400/30 bg-amber-400/20 px-3 py-1 text-xs font-bold text-amber-300">
                        ⭐{' '}
                        {t(
                          'studentHome.topTutor'
                        )}
                      </span>
                    )}

                  </div>
                </div>

                <div className="mt-6 grid grid-cols-3 gap-4 text-center">

                  <div>
                    <p className="text-xl font-bold text-white">
                      {
                        selectedTutor.experience
                      }
                    </p>

                    <p className="text-xs text-white/50">
                      {t(
                        'studentHome.years'
                      )}
                    </p>
                  </div>

                  <div>
                    <p className="text-xl font-bold text-white">
                      ⭐{' '}
                      {
                        selectedTutor.average_rating
                      }
                    </p>

                    <p className="text-xs text-white/50">
                      {t(
                        'studentHome.rating'
                      )}
                    </p>
                  </div>

                  <div>
                    <p className="text-xl font-bold text-white">
                      {
                        selectedTutor.total_reviews
                      }
                    </p>

                    <p className="text-xs text-white/50">
                      {t(
                        'studentHome.reviews'
                      )}
                    </p>
                  </div>

                </div>

                <button
                  onClick={() =>
                    router.push(
                      `/student/post-doubt?tutorId=${selectedTutor.id}&tutorName=${encodeURIComponent(
                        selectedTutor.display_name
                      )}`
                    )
                  }
                  className="mt-6 w-full rounded-2xl bg-gradient-to-r from-violet-500 to-fuchsia-500 py-3 font-bold text-white shadow-lg shadow-violet-500/25 transition-all hover:from-violet-600 hover:to-fuchsia-600"
                >
                  🚀{' '}
                  {t(
                    'studentHome.requestDoubtButton'
                  )}
                </button>

              </div>
            </div>
          )}

        {/* =====================================================
            POST DOUBT MODAL
        ====================================================== */}

        <PostDoubtModal
          open={showPostModal}
          description={quickDoubt}
          onDescriptionChange={
            setQuickDoubt
          }
          onClose={() =>
            setShowPostModal(false)
          }
        />

      </div>

      {/* =========================================================
          PROFILE COMPLETION REMINDER
      ========================================================== */}

      {showProfileAlert && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#05030f]/75 p-4 backdrop-blur-md">

          {/* Decorative background glow */}

          <div className="pointer-events-none absolute inset-0 overflow-hidden">

            <div className="absolute left-[15%] top-[20%] h-64 w-64 rounded-full bg-violet-600/20 blur-3xl" />

            <div className="absolute right-[15%] top-[25%] h-64 w-64 rounded-full bg-fuchsia-600/15 blur-3xl" />

            <div className="absolute bottom-[15%] left-[40%] h-56 w-56 rounded-full bg-cyan-500/10 blur-3xl" />

          </div>

          {/* Alert Card */}

          <div className="relative w-full max-w-lg overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-[#171334]/95 via-[#211b4a]/95 to-[#15132f]/95 p-6 shadow-2xl shadow-violet-900/30 backdrop-blur-2xl sm:p-8">

            {/* Top gradient line */}

            <div className="absolute left-0 right-0 top-0 h-1 bg-gradient-to-r from-violet-500 via-fuchsia-500 to-cyan-400" />

            {/* Decorative glow */}

            <div className="absolute -right-20 -top-20 h-40 w-40 rounded-full bg-violet-500/15 blur-3xl" />

            <div className="absolute -bottom-20 -left-20 h-40 w-40 rounded-full bg-cyan-500/10 blur-3xl" />

            <div className="relative z-10 text-center">

              {/* Icon */}

              <div className="relative mx-auto mb-6 flex h-20 w-20 items-center justify-center">

                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-violet-500/30 to-fuchsia-500/30 blur-xl" />

                <div className="relative flex h-20 w-20 items-center justify-center rounded-3xl border border-violet-300/20 bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 text-4xl shadow-lg shadow-violet-500/20">
                  🎓
                </div>

              </div>

              {/* Badge */}

              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-violet-300/20 bg-violet-500/10 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-violet-200">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-cyan-400" />

                Complete your profile
              </div>

              {/* Title */}

              <h2 className="text-2xl font-black tracking-tight text-white sm:text-3xl">
                {t(
                  'studentHome.welcome'
                )}
              </h2>

              {/* Description */}

              <p className="mt-4 text-sm leading-7 text-white/65 sm:text-base">
                {t(
                  'studentHome.completeProfileDesc'
                )}

                <br />
                <br />

                {t(
                  'studentHome.thisHelps'
                )}
              </p>

              {/* Benefits */}

              <div className="mt-6 space-y-3 rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-left backdrop-blur-xl">

                <p className="flex items-start gap-3 text-sm text-white/75">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-400/15 text-xs text-emerald-300">
                    ✓
                  </span>

                  <span>
                    {t(
                      'studentHome.matchTutors'
                    )}
                  </span>
                </p>

                <p className="flex items-start gap-3 text-sm text-white/75">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-400/15 text-xs text-emerald-300">
                    ✓
                  </span>

                  <span>
                    {t(
                      'studentHome.recommendSubjects'
                    )}
                  </span>
                </p>

                <p className="flex items-start gap-3 text-sm text-white/75">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-400/15 text-xs text-emerald-300">
                    ✓
                  </span>

                  <span>
                    {t(
                      'studentHome.personalizeJourney'
                    )}
                  </span>
                </p>

                <p className="flex items-start gap-3 text-sm text-white/75">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-400/15 text-xs text-emerald-300">
                    ✓
                  </span>

                  <span>
                    {t(
                      'studentHome.connectFaster'
                    )}
                  </span>
                </p>

              </div>

              {/* Buttons */}

              <div className="mt-7 flex flex-col gap-3 sm:flex-row">

                {/* ASK ME LATER */}

                <button
                  onClick={() => {
                    // Store the exact time the user selected
                    // "Ask Me Later". This starts the 24-hour
                    // suppression period.
                    saveProfileReminderTime(
                      profileUserId
                    );

                    // Close the alert immediately.
                    setShowProfileAlert(false);
                  }}
                  className="flex-1 rounded-2xl border border-white/15 bg-white/[0.05] px-5 py-3.5 font-semibold text-white/75 backdrop-blur-xl transition-all hover:border-white/25 hover:bg-white/10 hover:text-white"
                >
                  {t(
                    'studentHome.askLater'
                  )}
                </button>

                {/* COMPLETE PROFILE */}

                <button
                  onClick={() => {
                    /*
                     * Do NOT store an Ask-Me-Later timestamp.
                     *
                     * User is actively going to the
                     * profile page.
                     */
                    router.replace(
                      '/student/profile'
                    );
                  }}
                  className="flex-1 rounded-2xl bg-gradient-to-r from-violet-500 via-fuchsia-500 to-violet-500 px-5 py-3.5 font-bold text-white shadow-lg shadow-violet-500/25 transition-all hover:scale-[1.01] hover:shadow-violet-500/40"
                >
                  {t(
                    'studentHome.completeProfile'
                  )}
                </button>

              </div>

              {/* Reminder information */}

              <p className="mt-4 text-xs text-white/35">
                You can complete your profile
                anytime from your profile
                settings.
              </p>

            </div>
          </div>
        </div>
      )}

      {/* =========================================================
          KNOWMATO AGENT FLOATING BUTTON
      ========================================================== */}

      <button
        onClick={() =>
          router.push(
            '/knowmato-agent'
          )
        }
        className="
          fixed
          bottom-12
          right-8
          z-[999]
          flex
          items-center
          gap-3
          rounded-full
          bg-gradient-to-r
          from-violet-600
          to-fuchsia-600
          px-5
          py-3
          font-bold
          text-white
          shadow-2xl
          shadow-violet-500/40
          transition-all
          duration-300
          hover:scale-105
          hover:shadow-fuchsia-500/40
        "
      >

        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-2xl">
          🤖
        </span>

        <div className="text-left">

          <p className="text-sm font-bold leading-none">
            KnowMato Agent
          </p>

          <p className="text-xs text-white/80">
            AI Assistant
          </p>

        </div>

      </button>

    </div>
  );
}