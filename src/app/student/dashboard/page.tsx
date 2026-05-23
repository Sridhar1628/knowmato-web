'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useRouter } from 'next/navigation';
import { RootState } from '@/redux/store';
import { clearTokens } from '@/services/storageService';
import { logout } from '@/redux/slices/authSlice';
import { getStudentDashboard } from '@/services/v1Service';
import { connectSocket, disconnectSocket } from '@/services/versionSocketService';
import { getTokens } from '@/services/storageService';
import toast from 'react-hot-toast';

// --- Dummy Data for UI (Replace with real API) ---
interface DummyTutor {
  id: number; name: string; expertise: string; rating: number; sessions: string;
}
interface DummyCourse {
  id: number; title: string; progress: number; icon: string; color: string;
}
interface DummySession {
  id: number; doubt_title: string; tutor_name: string; type: 'Live Video' | 'Text/Chat'; status: 'Completed' | 'In Progress'; rating: number | null; date: string;
}
interface DummyNews {
  id: number; headline: string; category: string; time: string; image: string;
}

const DUMMY_TUTORS: DummyTutor[] = [
  { id: 1, name: 'Expert_2207', expertise: 'Java, DSA, Spring Boot', rating: 4.9, sessions: '1.2k' },
  { id: 2, name: 'CodeMaster', expertise: 'Python, Django, ML', rating: 4.8, sessions: '980' },
  { id: 3, name: 'DataWizard', expertise: 'Data Structures, C++', rating: 4.9, sessions: '1.5k' },
  { id: 4, name: 'AlgoExpert', expertise: 'Algorithms, Competitive Programming', rating: 4.7, sessions: '750' },
];

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
  const user = useSelector((state: RootState) => state.auth.user);
  const dispatch = useDispatch();
  const router = useRouter();

  const [wallet, setWallet] = useState({ real: 0, bonus: 0 });
  const [currentPrice, setCurrentPrice] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [notificationCount] = useState<number>(0);

  const displayName = user?.first_name || user?.display_name || user?.email?.split('@')[0] || 'Student';

  // Fetch dashboard data 
  const fetchDashboardData = useCallback(async () => {
    try {
      const res = await getStudentDashboard();
      const data = res.data || res;
      setCurrentPrice(data.current_price ?? null);
      // You can also set stats & recent doubts here if your API provides them
    } catch (error) {
      console.error('Dashboard fetch error:', error);
      toast.error('Could not load dashboard data.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    const initSocket = async () => {
      try {
        const tokens = await getTokens();
        if (!tokens?.access) return;

        connectSocket(tokens.access, (event: string, data: any) => {
          switch (event) {
            case 'DOUBT_LIST': fetchDashboardData(); break;
            case 'SESSION_STARTED': router.push(`/student/chat?sessionId=${data.session_id}`); break;
            case 'SESSION_ENDED': router.push(`/student/submit-review?sessionId=${data.session_id}`); break;
            case 'DIRECT_ACCEPTED': router.push(`/student/chat?sessionId=${data.session_id}`); break;
            case 'DIRECT_REJECTED': toast.error('Tutor rejected, finding another...'); break;
            case 'WALLET_UPDATE': setWallet({ real: data.real_balance ?? 0, bonus: data.bonus_balance ?? 0 }); break;
            default: break;
          }
        });
      } catch (error) {
        console.log('Socket init error:', error);
      }
    };
    initSocket();
    return () => disconnectSocket();
  }, [fetchDashboardData, router]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  if (loading && !refreshing) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
          <p className="mt-4 text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-6">
      {/* MAIN CONTENT COLUMN (Left) */}
      <div className="flex-1">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div className="relative w-1/2">
            <input 
              type="text" 
              placeholder="Search for topics, tutors or doubts..." 
              className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-4 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <span className="absolute right-3 top-2 text-gray-400">⌘ K</span>
          </div>
          <div className="flex items-center gap-4">
            <button className="relative rounded-full p-2 text-gray-600 hover:bg-gray-100">
              🔔 <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] text-white">2</span>
            </button>
            <button className="rounded-lg bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-600">💰 ₹{wallet.real + wallet.bonus}</button>
            <div className="flex items-center gap-2 rounded-full bg-indigo-100 px-3 py-1">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-600 text-xs text-white">
                {displayName.charAt(0).toUpperCase()}
              </span>
              <span className="text-xs font-semibold text-indigo-900">{displayName}</span>
            </div>
          </div>
        </div>

        {/* Hero Banner */}
        <div className="relative mb-6 flex flex-col-reverse items-center justify-between overflow-x-hidden rounded-2xl bg-[#0f0f23] p-8 md:flex-row">
          <div className="z-10 text-center md:text-left">
            <h1 className="text-3xl font-bold leading-tight text-white md:text-4xl">
              Human Intelligence.<br />Faster. Smarter. Better.
            </h1>
            <p className="mt-2 text-sm text-gray-400">Connect with verified experts in less than 60 seconds and get your doubts solved instantly.</p>
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
             <div className="h-40 w-40 rounded-xl bg-gradient-to-b from-indigo-500 to-purple-600 opacity-50 blur-xl" />
             <div className="absolute inset-0 flex items-center justify-center text-6xl text-white opacity-80">🧑‍💻</div>
          </div>
        </div>

        {/* Ask a Doubt Widget */}
        <div className="mb-8 rounded-xl bg-white p-6 shadow-sm">
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
            <textarea className="w-full bg-transparent text-sm focus:outline-none" rows={3} placeholder="Type your doubt here..."></textarea>
            <div className="mt-3 flex flex-wrap items-center justify-between gap-4 border-t border-gray-200 pt-3">
              <div className="flex gap-2">
                <button className="flex items-center gap-1 rounded-full bg-white px-3 py-1 text-xs shadow-sm hover:bg-gray-50">📎 Upload Image</button>
                <button className="flex items-center gap-1 rounded-full bg-white px-3 py-1 text-xs shadow-sm hover:bg-gray-50">📄 Upload File</button>
              </div>
              <div className="flex items-center gap-3">
                <select className="rounded-lg border border-gray-200 bg-white px-3 py-1 text-xs focus:outline-none">
                  <option>Select Subject</option>
                  <option>Python</option>
                  <option>Java</option>
                  <option>Data Structures</option>
                </select>
                <button className="rounded-lg bg-indigo-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-indigo-500">Find Experts →</button>
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
          <div className="overflow-x-hidden rounded-xl border border-gray-200 bg-white">
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

      {/* RIGHT SIDEBAR (Only visible on Desktop) */}
      <aside className="hidden w-80 flex-col gap-6 lg:flex">
        {/* Live Tutors */}
        <div>
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-base font-bold text-gray-800">Live Tutors Online</h3>
            <button className="text-xs text-indigo-600 hover:underline">View All</button>
          </div>
          <div className="space-y-3">
            {DUMMY_TUTORS.map((tutor) => (
              <div key={tutor.id} className="flex items-center justify-between rounded-lg border border-gray-100 p-3 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-50 text-lg font-bold text-indigo-600">
                    {tutor.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-800">{tutor.name}</p>
                    <p className="text-[10px] text-gray-500">{tutor.expertise}</p>
                    <div className="flex items-center gap-1 text-[10px] text-gray-500">
                      <span>⭐ {tutor.rating}</span>
                      <span>• {tutor.sessions} sessions</span>
                    </div>
                  </div>
                </div>
                <button className="rounded-lg border border-indigo-600 px-3 py-1 text-[10px] font-bold text-indigo-600 hover:bg-indigo-50">
                  Request
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Current Affairs */}
        <div>
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-base font-bold text-gray-800">Current Affairs</h3>
            <button className="text-xs text-indigo-600 hover:underline">View All</button>
          </div>
          <div className="space-y-4">
             {DUMMY_NEWS.map((news) => (
               <div key={news.id} className="overflow-x-hidden rounded-xl border border-gray-100 shadow-sm">
                 <div className="h-32 w-full bg-gray-200 bg-cover bg-center" style={{ backgroundImage: `url(${news.image})` }} />
                 <div className="p-3">
                   <p className="text-xs font-bold text-gray-900 leading-tight line-clamp-2">{news.headline}</p>
                   <div className="mt-2 flex items-center justify-between text-[10px] text-gray-500">
                     <span>{news.category}</span>
                     <span>• {news.time}</span>
                   </div>
                 </div>
               </div>
             ))}
          </div>
        </div>
      </aside>
    </div>
  );
}