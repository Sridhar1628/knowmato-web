"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
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

// ---------- Type definition (mirroring Android) ----------
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

  // ---------- State ----------
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [activeTab, setActiveTab] = useState<"new" | "accepted">("new");
  const [acceptingId, setAcceptingId] = useState<number | null>(null);
  const hasNavigated = useRef(false);

  useEffect(() => {

      const unsubscribe =
          subscribeTutorPool(() => {

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

      setTutorPool(

          open,

          assigned

      );
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
      const res =
    await AcceptPoolDoubt({

            doubt_id : doubtId

        });

    if (
        res?.session_id
    ) {

        acceptPoolDoubt(

            doubtId,

            res.session_id

        );

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

      const unsubscribe =
          subscribeSocket((event, data) => {

              console.log(
                  "📡 POOL EVENT:",
                  event,
                  data
              );

              switch (event) {

                  case SocketEvents.NEW_DOUBT_REQUEST:

                      addPoolDoubt(data);

                      break;

                  case SocketEvents.POOL_DOUBT_ACCEPTED:

                      acceptPoolDoubt(

                          data.doubt_id,

                          data.session_id

                      );

                      if (
                          hasNavigated.current
                      ) return;

                      hasNavigated.current = true;

                      setTimeout(() => {

                          if (
                              data.session_type ===
                              "live_video"
                          ) {

                              router.push(
                                  `/videocall/${data.session_id}`
                              );

                          } else {

                              router.push(
                                  `/chat/${data.session_id}`
                              );

                          }

                      }, 800);

                      break;

                  case "DOUBT_EXPIRED":

                      removePoolDoubt(
                          data.doubt_id
                      );

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

          if (
        tutorPoolCache.loaded
    ) {

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
    const diffMin = Math.floor(
      (now.getTime() - created.getTime()) / 60000
    );
    if (diffMin < 1) return "Just now";
    if (diffMin < 60) return `${diffMin} min ago`;
    const hrs = Math.floor(diffMin / 60);
    return `${hrs} hr ago`;
  };

  const isVideo = (item: Doubt) =>
    item.preferred_explanation === "live_video";

  const filteredDoubts = useMemo(() => {

      return tutorPoolCache.openDoubts

          // Remove expired
          .filter((d) =>

              (
                  tutorPoolCache.timers[
                      d.doubt_id
                  ] ?? d.expires_in

              ) > 0

          )

          // Search
          .filter((d) =>

              searchQuery.trim() === ""

                  ||

              d.title
                  .toLowerCase()
                  .includes(
                      searchQuery.toLowerCase()
                  )

          )

          // Category
          .filter((d) =>

              selectedCategory === "All"

                  ||

              d.category.toLowerCase() ===
              selectedCategory.toLowerCase()

          );

  }, [

      searchQuery,

      selectedCategory,

      tutorPoolCache.openDoubts,

      tutorPoolCache.timers,

  ]);

  

  // ---------- Render card ----------
  const renderCard = (item: Doubt) => {
    const video = isVideo(item);
    const remaining = tutorPoolCache.timers[item.doubt_id] ?? item.expires_in;
    const isExpired = remaining <= 0;

    return (
      <div
        key={item.doubt_id}
        className="bg-white rounded-2xl p-5 mb-4 shadow-sm border border-gray-100 transition hover:shadow-md"
      >
        {/* Top row: type badge + time ago */}
        <div className="flex justify-between items-center mb-3">
          <span
            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${
              video
                ? "bg-indigo-50 text-indigo-700"
                : "bg-emerald-50 text-emerald-700"
            }`}
          >
            {video ? "📹 Live Video" : "💬 Text / Chat"}
          </span>
          <span className="text-xs text-gray-400">
            {formatTimeAgo(item.created_at)}
          </span>
        </div>

        {/* Title & description */}
        <h3 className="text-lg font-bold text-gray-800 mb-1">{item.title}</h3>
        <p className="text-sm text-gray-500 line-clamp-2 mb-3">
          {item.description}
        </p>

        {/* Tags */}
        <div className="flex flex-wrap gap-2 mb-4">
          <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded-lg text-xs font-semibold">
            {item.category}
          </span>
          <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded-lg text-xs font-semibold">
            {item.mode === "specific" ? "Specific" : "General"}
          </span>
        </div>

        {/* Price */}
        <div className="flex items-center gap-1 mb-4">
          <span className="text-gray-500 text-sm">Budget:</span>
          <span className="text-xl font-extrabold text-gray-800">
            ₹{item.price}
          </span>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          {activeTab === "new" ? (
            <>
              <button
                onClick={() =>
                  alert("Reject feature coming soon!")
                }
                className="flex-1 bg-white border border-gray-200 text-gray-600 py-3 rounded-xl font-semibold hover:bg-gray-50 transition"
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
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : "bg-indigo-600 text-white hover:bg-indigo-700"
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
              className="flex-1 bg-emerald-500 text-white py-3 rounded-xl font-semibold hover:bg-emerald-600 transition"
            >
              🚀 Join Session
            </button>
          )}
        </div>

        {/* Timer (new tab only) */}
        {activeTab === "new" && (
          <div className="mt-3 text-center text-xs text-red-500">
            ⏰ Expires in 00:{String(remaining).padStart(2, "0")}
          </div>
        )}
      </div>
    );
  };

  // ---------- Loading state ----------
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-gray-600">Loading doubts...</p>
        </div>
      </div>
    );
  }

  // ---------- Main UI ----------
  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-800">
          Doubts for You
        </h1>
        <button
          onClick={onRefresh}
          disabled={refreshing}
          className="p-2 rounded-full hover:bg-gray-200 transition"
        >
          <svg
            className={`w-6 h-6 text-gray-600 ${refreshing ? "animate-spin" : ""}`}
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
      <div className="mb-4 space-y-3">
        <input
          type="text"
          placeholder="Search by title..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-4 py-3 border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
        />
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-full text-sm font-semibold whitespace-nowrap transition ${
                selectedCategory === cat
                  ? "bg-indigo-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Tabs: New / Accepted */}
      <div className="flex bg-indigo-50 rounded-xl p-1 mb-6">
        <button
          onClick={() => setActiveTab("new")}
          className={`flex-1 py-3 rounded-lg text-center font-semibold transition ${
            activeTab === "new"
              ? "bg-indigo-600 text-white shadow"
              : "text-gray-600"
          }`}
        >
          New ({filteredDoubts.length})
        </button>
        <button
          onClick={() => setActiveTab("accepted")}
          className={`flex-1 py-3 rounded-lg text-center font-semibold transition ${
            activeTab === "accepted"
              ? "bg-indigo-600 text-white shadow"
              : "text-gray-600"
          }`}
        >
          Accepted ({tutorPoolCache.acceptedDoubts.length})
        </button>
      </div>

      {/* Doubt List */}
      {activeTab === "new" ? (
        filteredDoubts.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            No doubts available right now.
          </div>
        ) : (
          filteredDoubts.map(renderCard)
        )
      ) : tutorPoolCache.acceptedDoubts.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          You haven't accepted any doubts yet.
        </div>
      ) : (
        tutorPoolCache.acceptedDoubts.map(renderCard)
      )}
    </div>
  );
}