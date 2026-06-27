"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { getTutorPoolDoubts, AcceptPoolDoubt } from "@/services/v1Service";
import { subscribeSocket } from "@/services/socketEventBus";
import { SocketEvents } from "@/services/versionSocketEvents";

import {
  tutorPoolCache,
} from "@/store/tutorPoolCache";

import {
  subscribeTutorPool,
  setTutorPool,
  addPoolDoubt,
  acceptPoolDoubt,
  removePoolDoubt,
  tickPoolTimers,
  clearTutorPool,
} from "@/store/tutorPoolRealtime";

// ---------- Type definition ----------
interface Doubt {
  doubt_id: number;
  title: string;
  description: string;
  category: string;
  preferred_explanation: string;
  mode: string;
  price: number;
  created_at: string;
  status?: string;
  session_id?: number;
  student: {
    name: string;
  };
  expires_in: number;
}

const categories = [
  "All",
  "Python",
  "JavaScript",
  "Java",
  "C++",
  "Data Structures",
  "React",
  "Other",
];

export default function TutorDoubtsPage() {
  const router = useRouter();
  const [, forceUpdate] = useState({});

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [activeTab, setActiveTab] = useState<"new" | "accepted">("new");
  const [acceptingId, setAcceptingId] = useState<number | null>(null);
  const hasNavigated = useRef(false);

  // Cache subscription
  useEffect(() => {
    const unsubscribe = subscribeTutorPool(() => {
      forceUpdate({});
    });
    return () => {
      unsubscribe();
    };
  }, []);

  // ---------- Fetch pool doubts ----------
  const fetchDoubts = async () => {
    try {
      const res = await getTutorPoolDoubts();
      const data = res?.data || [];
      const open = data.filter((d: Doubt) => d.status === "open");
      const assigned = data.filter((d: Doubt) => d.status === "assigned");
      setTutorPool(open, assigned);
    } catch (err) {
      console.error("❌ Fetch pool doubts error:", err);
      alert("Failed to load available doubts.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // ---------- Accept doubt ----------
  const handleAccept = async (doubtId: number, title: string) => {
    const confirmed = window.confirm(
      `Are you sure you want to accept "${title}"?`
    );
    if (!confirmed) return;

    setAcceptingId(doubtId);
    try {
      const res = await AcceptPoolDoubt({ doubt_id: doubtId });
      if (res?.session_id) {
        acceptPoolDoubt(doubtId, res.session_id);
      }
      alert("Your session is being created...");
    } catch (error) {
      console.error("Accept error:", error);
      alert("Failed to accept doubt. Please try again.");
    } finally {
      setAcceptingId(null);
    }
  };

  // ---------- Socket real‑time updates ----------
  useEffect(() => {
    const unsubscribe = subscribeSocket((event, data) => {
      console.log("📡 POOL EVENT:", event, data);
      switch (event) {
        case SocketEvents.NEW_DOUBT_REQUEST:
          addPoolDoubt(data);
          break;

        case SocketEvents.POOL_DOUBT_ACCEPTED:
          acceptPoolDoubt(data.doubt_id, data.session_id);
          if (hasNavigated.current) return;
          hasNavigated.current = true;
          setTimeout(() => {
            if (data.session_type === "live_video") {
              router.push(`/videocall/${data.session_id}`);
            } else {
              router.push(`/chat/${data.session_id}`);
            }
          }, 800);
          break;

        case "DOUBT_EXPIRED":
          removePoolDoubt(data.doubt_id);
          break;

        default:
          break;
      }
    });
    return unsubscribe;
  }, [router]);

  // Reset navigation flag on tab focus
  useEffect(() => {
    const reset = () => {
      hasNavigated.current = false;
    };
    window.addEventListener("focus", reset);
    return () => window.removeEventListener("focus", reset);
  }, []);

  // Initial load
  useEffect(() => {
    if (tutorPoolCache.loaded) {
      setLoading(false);
    } else {
      fetchDoubts();
    }
  }, []);

  // ---------- Timer countdown ----------
  useEffect(() => {
    const timer = setInterval(() => {
      tickPoolTimers();
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // ---------- Refresh handler ----------
  const onRefresh = async () => {
    setRefreshing(true);
    clearTutorPool();
    await fetchDoubts();
  };

  // ---------- Helpers ----------
  const formatTimeAgo = (dateStr: string) => {
    const now = new Date();
    const created = new Date(dateStr);
    const diffMin = Math.floor((now.getTime() - created.getTime()) / 60000);
    if (diffMin < 1) return "Just now";
    if (diffMin < 60) return `${diffMin} min ago`;
    const hrs = Math.floor(diffMin / 60);
    return `${hrs} hr ago`;
  };

  const isVideo = (item: Doubt) =>
    item.preferred_explanation === "live_video";

  const filteredDoubts = useMemo(() => {
    return tutorPoolCache.openDoubts
      .filter(
        (d) => (tutorPoolCache.timers[d.doubt_id] ?? d.expires_in) > 0
      )
      .filter(
        (d) =>
          searchQuery.trim() === "" ||
          d.title.toLowerCase().includes(searchQuery.toLowerCase())
      )
      .filter(
        (d) =>
          selectedCategory === "All" ||
          d.category.toLowerCase() === selectedCategory.toLowerCase()
      );
  }, [searchQuery, selectedCategory, tutorPoolCache.openDoubts, tutorPoolCache.timers]);

  // ---------- Render card ----------
  const renderCard = (item: Doubt) => {
    const video = isVideo(item);
    const remaining = tutorPoolCache.timers[item.doubt_id] ?? item.expires_in;
    const isExpired = remaining <= 0;

    return (
      <motion.div
        key={item.doubt_id}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        layout
        className="bg-white/5 backdrop-blur-xl rounded-2xl p-5 border border-white/10 shadow-xl hover:border-violet-400/40 transition w-full"
      >
        {/* Top row: type badge + time ago */}
        <div className="flex justify-between items-center mb-3">
          <span
            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${
              video
                ? "bg-violet-500/20 text-violet-300 border border-violet-400/30"
                : "bg-emerald-500/20 text-emerald-300 border border-emerald-400/30"
            }`}
          >
            {video ? "📹 Live Video" : "💬 Text / Chat"}
          </span>
          <span className="text-xs text-white/50">
            {formatTimeAgo(item.created_at)}
          </span>
        </div>

        {/* Title & description */}
        <h3 className="text-lg font-bold text-white mb-1">{item.title}</h3>
        <p className="text-sm text-white/70 line-clamp-2 mb-3">
          {item.description}
        </p>

        {/* Tags */}
        <div className="flex flex-wrap gap-2 mb-4">
          <span className="bg-white/10 text-white/80 px-2 py-1 rounded-lg text-xs font-semibold border border-white/10">
            {item.category}
          </span>
          <span className="bg-white/10 text-white/80 px-2 py-1 rounded-lg text-xs font-semibold border border-white/10">
            {item.mode === "specific" ? "Specific" : "General"}
          </span>
        </div>

        {/* Price */}
        <div className="flex items-center gap-1 mb-4">
          <span className="text-white/50 text-sm">Budget:</span>
          <span className="text-xl font-extrabold bg-gradient-to-r from-amber-300 to-orange-300 bg-clip-text text-transparent">
            ₹{item.price}
          </span>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          {activeTab === "new" ? (
            <>
              <button
                onClick={() => alert("Reject feature coming soon!")}
                className="flex-1 bg-white/10 border border-white/20 text-white/70 py-3 rounded-xl font-semibold hover:bg-white/20 transition"
              >
                Reject
              </button>
              <button
                disabled={isExpired || acceptingId === item.doubt_id}
                onClick={() => {
                  if (!acceptingId) {
                    handleAccept(item.doubt_id, item.title);
                  }
                }}
                className={`flex-1 py-3 rounded-xl font-semibold transition ${
                  isExpired
                    ? "bg-gray-500/50 text-gray-400 cursor-not-allowed"
                    : "bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white hover:from-violet-600 hover:to-fuchsia-600 shadow-lg shadow-violet-500/25"
                }`}
              >
                {isExpired
                  ? "Expired"
                  : acceptingId === item.doubt_id
                  ? "Accepting..."
                  : "Accept"}
              </button>
            </>
          ) : (
            <button
              onClick={() => {
                if (!item.session_id) return;
                if (video) {
                  router.push(`/videocall/${item.session_id}`);
                } else {
                  router.push(`/chat/${item.session_id}`);
                }
              }}
              className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-500 text-white py-3 rounded-xl font-semibold hover:from-emerald-600 hover:to-teal-600 shadow-lg shadow-emerald-500/25 transition"
            >
              🚀 Join Session
            </button>
          )}
        </div>

        {/* Timer (new tab only) */}
        {activeTab === "new" && (
          <div className="mt-3 text-center text-xs text-rose-400">
            ⏰ Expires in 00:{String(remaining).padStart(2, "0")}
          </div>
        )}
      </motion.div>
    );
  };

  // ---------- Loading state ----------
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e] flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-12 h-12 border-4 border-violet-400 border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-white/70">Loading doubts...</p>
        </div>
      </div>
    );
  }

  // ---------- Main UI ----------
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e] relative overflow-hidden p-4 sm:p-6 max-w-5xl mx-auto">
      {/* Animated blobs */}
      <div className="absolute top-0 -left-20 w-72 h-72 bg-purple-500/20 rounded-full mix-blend-multiply filter blur-3xl animate-blob" />
      <div className="absolute top-0 -right-20 w-72 h-72 bg-fuchsia-500/20 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000" />
      <div className="absolute -bottom-20 left-40 w-72 h-72 bg-cyan-500/20 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000" />

      <div className="relative z-10">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-violet-300 to-fuchsia-300">
            Doubts for You
          </h1>
          <button
            onClick={onRefresh}
            disabled={refreshing}
            className="p-2 rounded-full bg-white/5 hover:bg-white/10 transition border border-white/10"
          >
            <svg
              className={`w-6 h-6 text-white/70 ${refreshing ? "animate-spin" : ""}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          </button>
        </div>

        {/* Search & Category Filters */}
        <div className="mb-6 space-y-3">
          <input
            type="text"
            placeholder="Search by title..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white/5 backdrop-blur-md border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/40 focus:ring-4 focus:ring-violet-500/50 focus:border-violet-400 outline-none transition"
          />
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-full text-sm font-semibold whitespace-nowrap transition ${
                  selectedCategory === cat
                    ? "bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white shadow-lg"
                    : "bg-white/5 border border-white/10 text-white/70 hover:bg-white/10"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Tabs: New / Accepted */}
        <div className="flex bg-white/5 backdrop-blur-md rounded-xl p-1 mb-6 border border-white/10">
          <button
            onClick={() => setActiveTab("new")}
            className={`flex-1 py-3 rounded-lg text-center font-semibold transition ${
              activeTab === "new"
                ? "bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white shadow-lg"
                : "text-white/60 hover:text-white"
            }`}
          >
            New ({filteredDoubts.length})
          </button>
          <button
            onClick={() => setActiveTab("accepted")}
            className={`flex-1 py-3 rounded-lg text-center font-semibold transition ${
              activeTab === "accepted"
                ? "bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white shadow-lg"
                : "text-white/60 hover:text-white"
            }`}
          >
            Accepted ({tutorPoolCache.acceptedDoubts.length})
          </button>
        </div>

        {/* Doubt List — Responsive Grid */}
        <AnimatePresence>
          {activeTab === "new" ? (
            filteredDoubts.length === 0 ? (
              <motion.div
                key="empty-new"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-center py-16 text-white/50"
              >
                No doubts available right now.
              </motion.div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {filteredDoubts.map(renderCard)}
              </div>
            )
          ) : tutorPoolCache.acceptedDoubts.length === 0 ? (
            <motion.div
              key="empty-accepted"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center py-16 text-white/50"
            >
              You haven't accepted any doubts yet.
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {tutorPoolCache.acceptedDoubts.map(renderCard)}
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}