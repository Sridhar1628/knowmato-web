'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';
import { RootState } from '@/redux/store';
import { getStudentDashboard, getOnlineTutors, getCurrentAffairs, CurrentAffair } from '@/services/v1Service';
import toast from 'react-hot-toast';

import PostDoubtModal from '@/components/dashboard/PostDoubtModal';


interface DummyCourse {
  id: number; title: string; progress: number; icon: string; color: string;
}
interface DummySession {
  id: number; doubt_title: string; tutor_name: string; type: 'Live Video' | 'Text/Chat'; status: 'Completed' | 'In Progress'; rating: number | null; date: string;
}
interface DummyNews {
  id: number; headline: string; category: string; time: string; image: string;
}

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


const DUMMY_COURSES: DummyCourse[] = [
  { id: 1, title: 'Python List Comprehension', progress: 75, icon: '🐍', color: 'text-blue-600' },
  { id: 2, title: 'Java Collections Framework', progress: 50, icon: '☕', color: 'text-orange-600' },
  { id: 3, title: 'Data Structures in C++', progress: 30, icon: '⚙️', color: 'text-purple-600' },
  { id: 4, title: 'JavaScript Promises', progress: 20, icon: '📜', color: 'text-yellow-600' },
];

const DUMMY_SESSIONS: DummySession[] = [
  { id: 101, doubt_title: 'Explain Binary Search in Java', tutor_name: 'Expert_2207', type: 'Live Video', status: 'Completed', rating: 5.0, date: '08 May 2026' },
  { id: 102, doubt_title: 'Array in Python', tutor_name: 'Expert_2207', type: 'Text/Chat', status: 'Completed', rating: 4.0, date: '08 May 2026' },
];

const DUMMY_NEWS: DummyNews[] = [
  { id: 1, headline: "India's Startup Ecosystem Reaches New Heights in 2026", category: 'Tech & Business', time: '2h ago', image: 'https://via.placeholder.com/400x200/333/fff?text=India+Startup' },
  { id: 2, headline: 'ISRO Successfully Launches EOS-08 Satellite', category: 'Science', time: '3h ago', image: 'https://via.placeholder.com/400x200/333/fff?text=ISRO' },
  { id: 3, headline: 'Global AI Summit 2026: Key Highlights', category: 'Technology', time: '5h ago', image: 'https://via.placeholder.com/400x200/333/fff?text=AI+Summit' },
];

export default function DashboardPage() {
  const router = useRouter();
  const [currentPrice, setCurrentPrice] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  const [onlineTutors, setOnlineTutors] = useState<OnlineTutor[]>([]);
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



  const fetchDashboardData =
    useCallback(async () => {

      try {

        // DASHBOARD

        const res =
          await getStudentDashboard();

        const data =
          res.data || res;

        setCurrentPrice(
          data.current_price ?? null
        );

        // ====================================
        // CURRENT AFFAIRS
        // ====================================

        const currentAffairsRes =

          await getCurrentAffairs();

        const affairsData =

          currentAffairsRes?.data || [];

        setCurrentAffairs(
          affairsData
        );

        // ====================================
        // ONLINE TUTORS
        // ====================================

        const tutorsRes =
          await getOnlineTutors();

        const tutorsData =
          tutorsRes?.data || [];

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

    }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

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
              <h3 className="text-lg font-bold text-gray-800">Ask a Doubt</h3>
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
                border-white/10
                bg-white/5
                p-5
                text-white
                placeholder:text-gray-400
                outline-none
                transition
                focus:border-indigo-500
                focus:ring-4
                focus:ring-indigo-500/20
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

        {/* Continue Learning */}
        <div className="mb-8">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-bold text-gray-800">Continue Learning</h3>
            <button className="text-xs font-medium text-indigo-600 hover:underline">View All</button>
          </div>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {DUMMY_COURSES.map((course) => (
              <div key={course.id} className="rounded-xl border border-gray-200 bg-white p-4 hover:shadow-md transition">
                <div className="mb-3 flex items-center gap-2">
                  <span className="text-2xl">{course.icon}</span>
                  <span className={`text-xs font-bold ${course.color}`}>{course.title.split(' ')[0]}</span>
                </div>
                <p className="mb-3 text-xs font-semibold text-gray-700">{course.title}</p>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-gray-500">{course.progress}% Completed</span>
                  <div className="h-2 w-16 rounded-full bg-gray-100">
                    <div className="h-2 rounded-full bg-indigo-500" style={{ width: `${course.progress}%` }}></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Sessions Table */}
        <div>
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-bold text-gray-800">My Recent Sessions</h3>
            <button className="text-xs font-medium text-indigo-600 hover:underline">View All</button>
          </div>
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Doubt</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Tutor</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Rating</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {DUMMY_SESSIONS.length === 0 ? (
                    <tr><td colSpan={6} className="py-8 text-center text-sm text-gray-500">No recent sessions found.</td></tr>
                  ) : (
                    DUMMY_SESSIONS.map((session) => (
                      <tr key={session.id}>
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">
                          {session.doubt_title}
                          <span className="ml-2 rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-600">Java</span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          <div className="flex items-center gap-2">
                             <div className="h-6 w-6 rounded-full bg-gray-200"></div>
                             <span className="font-medium text-gray-900">{session.tutor_name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          <div className="flex items-center gap-1">
                            <span>{session.type === 'Live Video' ? '🟣' : '💬'}</span>
                            <span>{session.type}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <span className="inline-flex rounded-full bg-green-100 px-2 text-xs font-semibold leading-5 text-green-800">
                            {session.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">⭐ {session.rating ?? 'N/A'}</td>
                        <td className="px-6 py-4 text-sm text-gray-500">{session.date}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT SIDEBAR (Visible only on large screens) */}
      <aside className="hidden xl:flex xl:w-80 xl:flex-col xl:gap-6">
        {/* Live Tutors */}
        <div>
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-base font-bold text-gray-800">Live Tutors Online</h3>
            <button className="text-xs text-indigo-600 hover:underline">View All</button>
          </div>

          <div className="space-y-3">

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
                className="
                  flex
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
            mt-8
            rounded-2xl
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

          <div
            className="
              space-y-4
            "
          >

            {currentAffairs.map(
              (item) => (

                <div

                  key={item.id}

                  className="
                    overflow-hidden
                    rounded-2xl
                    border
                    border-gray-100
                    bg-gray-50
                    transition
                    hover:shadow-md
                  "
                >

                  {/* IMAGE */}

                  {item.image_url && (

                    <img

                      src={item.image_url}

                      alt={item.title}

                      className="
                        h-44
                        w-full
                        object-cover
                      "
                    />
                  )}

                  {/* CONTENT */}

                  <div
                    className="
                      p-4
                    "
                  >

                    {/* CATEGORY */}

                    <span
                      className="
                        inline-block
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

                      {item.category}

                    </span>

                    {/* TITLE */}

                    <h3
                      className="
                        mt-3
                        text-base
                        font-bold
                        text-gray-800
                      "
                    >

                      {item.title}

                    </h3>

                    {/* DESCRIPTION */}

                    <p
                      className="
                        mt-2
                        line-clamp-3
                        text-sm
                        leading-6
                        text-gray-600
                      "
                    >

                      {item.description}

                    </p>

                    {/* DATE */}

                    <p
                      className="
                        mt-3
                        text-xs
                        text-gray-400
                      "
                    >

                      {new Date(
                        item.created_at
                      ).toLocaleDateString()}

                    </p>

                  </div>

                </div>
              )
            )}

          </div>

        </div>

      </aside>
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