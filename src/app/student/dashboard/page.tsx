'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';
import { RootState } from '@/redux/store';
import { getStudentDashboard, getOnlineTutors, getCurrentAffairs, CurrentAffair , getMyDoubts} from '@/services/v1Service';
import toast from 'react-hot-toast';
import { dashboardCache } from '@/store/dashboardCache';
import {
  subscribeDashboard,
} from '@/store/dashboardRealtime';

import PostDoubtModal from '@/components/dashboard/PostDoubtModal';

import {
  connectSocket,
} from '@/services/versionSocketService';

import {
  updateDashboardCache,
} from '@/store/dashboardEvents';


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


export default function DashboardPage() {
  const router = useRouter();
  const [currentPrice, setCurrentPrice] = useState<number | null>(null);
  const [loading, setLoading] =
  useState(!dashboardCache.loaded);

  const [onlineTutors, setOnlineTutors] = useState<OnlineTutor[]>([]);

  const [

    selectedTutor,

    setSelectedTutor,

  ] = useState<OnlineTutor | null>(
    null
  );

  const [

    showTutorProfile,

    setShowTutorProfile,

  ] = useState(false);
  const [

    currentAffairs,

    setCurrentAffairs

  ] = useState<
    CurrentAffair[]
  >([]);

  const [

    showPostModal,

    setShowPostModal,

  ] = useState(false);

  const [

    quickDoubt,

    setQuickDoubt,

  ] = useState('');

  const [

    recentDoubts,

    setRecentDoubts,

  ] = useState<
    RecentDoubt[]
  >([]);

  const fetchDashboardData =
    useCallback(async () => {

      try {

        // DASHBOARD

        const res =
          await getStudentDashboard();

        const data =
          res.data || res;

        dashboardCache.currentPrice =
        data.current_price;

        setCurrentPrice(
          data.current_price ?? null
        );

        // ====================================
        // CURRENT AFFAIRS
        // ====================================

        const currentAffairsRes =

          await getCurrentAffairs();

        const affairsData =
          (currentAffairsRes?.data || [])
          .filter((item: CurrentAffair) => {

            const createdAt =
              new Date(item.created_at);

            const now =
              new Date();

            const diffHours =
              (now.getTime() -
                createdAt.getTime()) /
              (1000 * 60 * 60);

            return diffHours <= 24;

          });

        dashboardCache.currentAffairs =
        affairsData;

        setCurrentAffairs(
          affairsData
        );

        // ====================================
        // RECENT DOUBTS
        // ====================================

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

        // ====================================
        // ONLINE TUTORS
        // ====================================

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

        setOnlineTutors(
          tutorsData
        );

      } catch (error) {

        console.error(
          'Dashboard fetch error:',
          error
        );

        toast.error(
          'Could not load dashboard data.'
        );



      } finally {

        setLoading(false);
      }

      dashboardCache.loaded = true;

      dashboardCache.lastFetched =
        Date.now();
    }, []);

    useEffect(() => {

      const unsubscribe =
        subscribeDashboard(() => {

          console.log(
            '🔄 Dashboard Realtime Update'
          );

          setOnlineTutors([
            ...dashboardCache.onlineTutors
          ]);

          setRecentDoubts([
            ...dashboardCache.recentDoubts
          ]);

          setCurrentAffairs([
            ...dashboardCache.currentAffairs
          ]);

          setCurrentPrice(
            dashboardCache.currentPrice
          );

        });

      return unsubscribe;

    }, []);

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

          setOnlineTutors(
            tutorsData
          );

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

      return () => {

        window.removeEventListener(
          'refresh-online-tutors',
          handleRefresh
        );

      };

    }, []);

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

  }, []);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
          <p className="mt-2 text-sm text-gray-500">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

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
      return `${minutes} min ago`;
    }

    if (hours < 24) {
      return `${hours} hr ago`;
    }

    return created.toLocaleDateString();
  };

  return (
    <div className="flex flex-col gap-6 xl:flex-row">
      {/* MAIN CONTENT COLUMN */}
      <div className="flex-1 min-w-0">
        {/* Hero Banner */}
        <div className="relative mb-6 flex flex-col-reverse items-center justify-between overflow-hidden rounded-2xl bg-[#0f0f23] p-6 md:p-8 md:flex-row">
          <div className="z-10 text-center md:text-left">
            <h1 className="text-2xl font-bold leading-tight text-white md:text-3xl lg:text-4xl">
              Human Intelligence.<br />Faster. Smarter. Better.
            </h1>
            <p className="mt-2 text-sm text-gray-400">
              Connect with verified experts in less than 60 seconds and get your doubts solved instantly.
            </p>
            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
              <button
                onClick={() => router.push('/student/post-doubt')}
                className="rounded-full bg-indigo-600 px-6 py-2.5 font-semibold text-white shadow-md hover:bg-indigo-500"
              >
                🚀 Ask a Doubt
              </button>
              <button className="rounded-full border border-gray-600 px-6 py-2.5 font-semibold text-white hover:bg-white/5">
                ▶️ How it Works?
              </button>
            </div>
          </div>
          <div className="relative mb-4 md:mb-0">
            <div className="h-32 w-32 rounded-xl bg-gradient-to-b from-indigo-500 to-purple-600 opacity-50 blur-xl md:h-40 md:w-40" />
            <div className="absolute inset-0 flex items-center justify-center text-5xl text-white opacity-80 md:text-6xl">🧑‍💻</div>
          </div>
        </div>

        {/* Ask a Doubt Widget */}
        <div className="mb-8 rounded-xl bg-white p-4 shadow-sm md:p-6">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-gray-800">Explain Your Doubt Here</h3>
              <p className="text-xs text-gray-500">Get instant help from expert tutors</p>
            </div>
            <div className="flex items-center gap-1 rounded-full bg-green-50 px-3 py-1 text-xs font-bold text-green-700">
              <span className="h-2 w-2 rounded-full bg-green-500"></span> Avg Connect Time: 45 sec
            </div>
          </div>
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
            <textarea

              value={quickDoubt}

              onChange={(e) =>
                setQuickDoubt(
                  e.target.value
                )
              }

              placeholder="
                Describe your doubt...
                Example:
                My React useEffect keeps rerendering infinitely
              "

              className="
                min-h-[120px]
                w-full
                rounded-3xl
                border
                border-gray-200
                bg-white
                p-5
                text-gray-800
                placeholder:text-gray-400
                shadow-sm
                outline-none
                transition-all
                focus:border-indigo-500
                focus:ring-4
                focus:ring-indigo-100
              "
            />

            <div className="mt-3 flex flex-wrap items-center justify-between gap-4 border-t border-gray-200 pt-3">
              <div className="flex gap-2">
                
              </div>
              <div className="flex items-center gap-3">
                
                <button

                  onClick={() => {

                    if (
                      !quickDoubt.trim()
                    ) {

                      toast.error(
                        'Please describe your doubt first'
                      );

                      return;
                    }

                    setShowPostModal(true);
                  }}

                  className="
                    rounded-2xl
                    bg-gradient-to-r
                    from-indigo-600
                    to-purple-600
                    px-6
                    py-3
                    text-sm
                    font-bold
                    text-white
                    shadow-lg
                    transition
                    hover:scale-[1.02]
                  "
                >

                  Find Experts 🚀

                </button>

              </div>
            </div>
          </div>
        </div>

        <div
          className="
            rounded-3xl
            bg-white
            p-5
            shadow-sm
          "
        >

          {/* HEADER */}

          <div
            className="
              mb-4
              flex
              items-center
              justify-between
            "
          >

            <div>

              <h2
                className="
                  text-lg
                  font-bold
                  text-gray-800
                "
              >

                📚 Recent Doubts

              </h2>

              <p
                className="
                  text-xs
                  text-gray-500
                "
              >

                Your latest learning sessions

              </p>

            </div>

            <button

              onClick={() =>
                router.push(
                  '/student/my-doubts'
                )
              }

              className="
                text-sm
                font-semibold
                text-indigo-600
              "
            >

              View All

            </button>

          </div>

          {/* EMPTY */}

          {recentDoubts.length === 0 ? (

            <div
              className="
                rounded-2xl
                border
                border-dashed
                border-gray-200
                p-8
                text-center
              "
            >

              <p
                className="
                  text-sm
                  text-gray-500
                "
              >

                No doubts posted yet

              </p>

            </div>

          ) : (

            <div
              className="
                flex
                gap-4
                overflow-x-auto
                pb-2
                scrollbar-hide
              "
            >

              {recentDoubts.map(
                (doubt) => (

                  <button

                    key={doubt.doubt_id}

                    onClick={() =>

                      router.push(
                        `/student/my-doubts/${doubt.doubt_id}`
                      )
                    }

                    className="
                      min-w-[280px]
                      flex-shrink-0
                      rounded-2xl
                      border
                      border-gray-100
                      bg-white
                      p-4
                      text-left
                      shadow-sm
                      transition-all
                      hover:-translate-y-1
                      hover:border-indigo-200
                      hover:shadow-md
                    "
                  >

                    {/* CATEGORY */}

                    <div
                      className="
                        mb-3
                        flex
                        items-center
                        justify-between
                      "
                    >

                      <span
                        className="
                          rounded-full
                          bg-indigo-100
                          px-3
                          py-1
                          text-[10px]
                          font-bold
                          uppercase
                          tracking-wide
                          text-indigo-700
                        "
                      >

                        {doubt.category}

                      </span>

                      <span
                        className={`
                          rounded-full
                          px-2
                          py-1
                          text-[10px]
                          font-bold

                          ${
                            doubt.status === 'completed'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-yellow-100 text-yellow-700'
                          }
                        `}
                      >

                        {doubt.status}

                      </span>

                    </div>

                    {/* TITLE */}

                    <h3
                      className="
                        line-clamp-2
                        text-base
                        font-bold
                        text-gray-800
                      "
                    >

                      {doubt.title}

                    </h3>

                    {/* TUTOR */}

                    <p
                      className="
                        mt-2
                        text-sm
                        text-gray-500
                      "
                    >

                      👨‍🏫 {doubt.tutor || 'Waiting for tutor'}
                    </p>

                    {/* SESSION */}

                    <div
                      className="
                        mt-3
                        flex
                        items-center
                        gap-2
                        text-xs
                        text-gray-500
                      "
                    >

                      <span>

                        {doubt.session?.session_type ===
                        'live_video'

                          ? '🎥 Live Video'

                          : '💬 Chat'}

                      </span>

                      <span>•</span>

                      <span>

                        {doubt.mode === 'specific'

                          ? 'Specific Tutor'

                          : 'Doubt Pool'}

                      </span>

                    </div>

                    {/* DATE */}

                    <p
                      className="
                        mt-4
                        text-xs
                        text-gray-400
                      "
                    >

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

      {/* RIGHT SIDEBAR (Visible only on large screens) */}
      <aside
        className="
          hidden
          xl:flex
          xl:w-80
          xl:flex-col
          xl:gap-6
          xl:sticky
          xl:top-20
          self-start
        "
      >
        {/* Live Tutors */}
        <div>
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-base font-bold text-gray-800">Live Tutors Online</h3>
            <button
              onClick={() =>
                router.push(
                  '/student/tutors'
                )
              }
            >
              View All →
            </button>
          </div>

          <div
            className="
              max-h-[350px]
              space-y-3
              overflow-y-auto
              pr-2
            "
          >

            {onlineTutors.length === 0 && (

              <div
                className="
                  rounded-xl
                  border
                  border-dashed
                  border-gray-200
                  bg-white
                  p-6
                  text-center
                "
              >

                <p
                  className="
                    text-sm
                    text-gray-500
                  "
                >

                  No tutors online right now

                </p>

              </div>
            )}

            {onlineTutors.map((tutor) => (
              <div
                key={tutor.id}
                onClick={() => {

                  setSelectedTutor(tutor);

                  setShowTutorProfile(true);

                }}
                className="
                  flex
                  cursor-pointer
                  items-center
                  justify-between
                  rounded-xl
                  border
                  border-gray-100
                  bg-white
                  p-3
                  shadow-sm
                  transition
                  hover:shadow-md
                "
              >

                <div className="flex items-center gap-3">

                  {/* AVATAR */}

                  <div
                    className="
                      flex
                      h-11
                      w-11
                      items-center
                      justify-center
                      rounded-full
                      bg-gradient-to-br
                      from-indigo-500
                      to-purple-500
                      text-sm
                      font-bold
                      text-white
                    "
                  >

                    {tutor.display_name.charAt(0)}

                  </div>

                  {/* INFO */}

                  <div>

                    <div className="flex items-center gap-1">

                      <p
                        className="
                          text-sm
                          font-bold
                          text-gray-800
                        "
                      >

                        {tutor.display_name}

                      </p>

                      {tutor.is_verified && (
                        <span title="Verified">
                          ✅
                        </span>
                      )}

                      {tutor.is_top_tutor && (
                        <span title="Top Tutor">
                          ⭐
                        </span>
                      )}

                    </div>

                    <p
                      className="
                        max-w-[180px]
                        truncate
                        text-[11px]
                        text-gray-500
                      "
                    >

                      {tutor.skills}

                    </p>

                    <div
                      className="
                        mt-1
                        flex
                        items-center
                        gap-2
                        text-[10px]
                        text-gray-500
                      "
                    >

                      <span>
                        ⭐ {tutor.average_rating || 0}
                      </span>

                      <span>
                        • {tutor.total_reviews} reviews
                      </span>

                    </div>

                  </div>

                </div>

                {/* ACTION */}

                <button
                  onClick={(e) => {

                    e.stopPropagation();

                    router.push(
                      `/student/post-doubt?tutorId=${tutor.id}&tutorName=${encodeURIComponent(
                        tutor.display_name
                      )}`
                    );

                  }}
                  className="
                    rounded-lg
                    bg-indigo-50
                    px-3
                    py-1.5
                    text-[11px]
                    font-bold
                    text-indigo-600
                    transition
                    hover:bg-indigo-100
                  "
                >

                  Request

                </button>

              </div>

            ))}
          </div>
        </div>

        {/* ====================================== */}
        {/* CURRENT AFFAIRS */}
        {/* ====================================== */}

        <div
          className="
            max-h-[650px]
            space-y-4
            overflow-y-auto
            pr-2
          "
        >

          {/* HEADER */}

          <div
            className="
              mb-4
              flex
              items-center
              justify-between
            "
          >
            <div>

              <h2
                className="
                  text-lg
                  font-bold
                  text-gray-800
                "
              >
                📰 Current Affairs
              </h2>

              <p
                className="
                  text-xs
                  text-gray-500
                "
              >
                Stay updated with latest tech & AI news
              </p>

            </div>

            <button
              onClick={() =>
                router.push(
                  '/student/current-affairs'
                )
              }
              className="
                flex
                items-center
                gap-1
                text-sm
                font-semibold
                text-indigo-600
              "
            >
              View All

              <span
                className="
                  rounded-full
                  bg-indigo-100
                  px-2
                  py-0.5
                  text-[10px]
                "
              >
                {currentAffairs.length}
              </span>
            </button>

          </div>

          {/* EMPTY */}

          {currentAffairs.length === 0 && (

            <div
              className="
                rounded-xl
                border
                border-dashed
                border-gray-200
                p-6
                text-center
              "
            >

              <p
                className="
                  text-sm
                  text-gray-500
                "
              >

                No current affairs available

              </p>

            </div>
          )}

          {/* LIST */}

          {/* Replace the current affairs list in your dashboard’s <aside> */}
          <div className="space-y-4">
            {currentAffairs
              .slice(0, 5)
              .map((item) => (
              <div
                key={item.id}
                onClick={() => router.push(`/student/current-affairs/`)}
                className="cursor-pointer overflow-hidden rounded-2xl border border-gray-100 bg-gray-50 transition hover:shadow-md"
              >
                {/* IMAGE */}
                {item.image_url && (
                  <img
                    src={item.image_url}
                    alt={item.title}
                    className="h-44 w-full object-cover"
                  />
                )}
                {/* CONTENT */}
                <div className="p-4">
                  <span className="inline-block rounded-full bg-indigo-100 px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-indigo-700">
                    {item.category}
                  </span>
                  <h3 className="mt-3 text-base font-bold text-gray-800">
                    {item.title}
                  </h3>
                  <p className="mt-2 line-clamp-3 text-sm leading-6 text-gray-600">
                    {item.description}
                  </p>
                  <div
                    className="
                      mt-4
                      flex
                      items-center
                      justify-between
                    "
                  >
                    <span
                      className="
                        rounded-full
                        bg-gray-100
                        px-2
                        py-1
                        text-[10px]
                        font-semibold
                        text-gray-600
                      "
                    >
                      🕒 {getTimeAgo(item.created_at)}
                    </span>

                    <span
                      className="
                        text-[11px]
                        text-gray-400
                      "
                    >
                      {new Date(
                        item.created_at
                      ).toLocaleString([], {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

        </div>

      </aside>

      {showTutorProfile && selectedTutor && (

        <div
          className="
            fixed
            inset-0
            z-50
            flex
            items-center
            justify-center
            bg-black/50
          "
          onClick={() =>
            setShowTutorProfile(false)
          }
        >

          <div
            onClick={(e) =>
              e.stopPropagation()
            }
            className="
              w-full
              max-w-md
              rounded-3xl
              bg-white
              p-6
              shadow-xl
            "
          >

            <div className="text-center">

              <div
                className="
                  mx-auto
                  flex
                  h-20
                  w-20
                  items-center
                  justify-center
                  rounded-full
                  bg-gradient-to-br
                  from-indigo-500
                  to-purple-500
                  text-3xl
                  font-bold
                  text-white
                "
              >

                {selectedTutor.display_name.charAt(0)}

              </div>

              <h2
                className="
                  mt-4
                  text-2xl
                  font-bold
                  text-gray-800
                "
              >

                {selectedTutor.display_name}

              </h2>

              <p
                className="
                  mt-1
                  text-sm
                  text-gray-500
                "
              >

                {selectedTutor.skills}

              </p>

              <div
                className="
                  mt-3
                  flex
                  justify-center
                  gap-2
                "
              >

                {selectedTutor.is_online && (
                  <span
                    className="
                      rounded-full
                      bg-green-100
                      px-3
                      py-1
                      text-xs
                      font-bold
                      text-green-700
                    "
                  >
                    🟢 Online
                  </span>
                )}

                {selectedTutor.is_verified && (
                  <span
                    className="
                      rounded-full
                      bg-blue-100
                      px-3
                      py-1
                      text-xs
                      font-bold
                      text-blue-700
                    "
                  >
                    ✅ Verified
                  </span>
                )}

                {selectedTutor.is_top_tutor && (
                  <span
                    className="
                      rounded-full
                      bg-yellow-100
                      px-3
                      py-1
                      text-xs
                      font-bold
                      text-yellow-700
                    "
                  >
                    ⭐ Top Tutor
                  </span>
                )}

              </div>

            </div>

            <div
              className="
                mt-6
                grid
                grid-cols-3
                gap-4
                text-center
              "
            >

              <div>

                <p
                  className="
                    text-xl
                    font-bold
                  "
                >

                  {selectedTutor.experience}

                </p>

                <p
                  className="
                    text-xs
                    text-gray-500
                  "
                >

                  Years

                </p>

              </div>

              <div>

                <p
                  className="
                    text-xl
                    font-bold
                  "
                >

                  ⭐ {selectedTutor.average_rating}

                </p>

                <p
                  className="
                    text-xs
                    text-gray-500
                  "
                >

                  Rating

                </p>

              </div>

              <div>

                <p
                  className="
                    text-xl
                    font-bold
                  "
                >

                  {selectedTutor.total_reviews}

                </p>

                <p
                  className="
                    text-xs
                    text-gray-500
                  "
                >

                  Reviews

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
              className="
                mt-6
                w-full
                rounded-2xl
                bg-indigo-600
                py-3
                font-bold
                text-white
                hover:bg-indigo-700
              "
            >

              🚀 Request Doubt

            </button>

          </div>

        </div>

      )}
      <PostDoubtModal

        open={showPostModal}

        description={quickDoubt}

        onClose={() =>
          setShowPostModal(false)
        }
      />


    </div>
  );
}