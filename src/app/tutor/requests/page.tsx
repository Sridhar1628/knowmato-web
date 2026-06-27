"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { getTutorRequests, handleDirectRequest } from "@/services/v1Service";
import { subscribeSocket } from "@/services/socketEventBus";
import { SocketEvents } from "@/services/versionSocketEvents";
import toast from "react-hot-toast";

import {
  tutorRequestsCache,
} from "@/store/tutorRequestsCache";

import {
  subscribeTutorRequests,
  setTutorRequests,
  clearTutorRequests,
  addTutorRequest,
  removeTutorRequest,
  updateTutorRequest,
} from "@/store/tutorRequestsRealtime";

// ---------- Types ----------
interface TutorRequest {
  request_id: number;
  doubt_id: number;
  title: string;
  description: string;
  category: string;
  preferred_explanation: string;
  status: string; // 'pending', 'accepted', 'countered', 'proposed'
  price: number | null;
  created_at: string;
  student: {
    id: number;
    name: string;
  };
}

const statusIcons: Record<string, string> = {
  pending: "⏳",
  accepted: "✅",
  countered: "🔄",
  proposed: "💡",
};
const statusBadgeClass = (status: string) => {
  const map: Record<string, string> = {
    pending: "bg-amber-400/20 text-amber-300 border-amber-400/40",
    accepted: "bg-emerald-400/20 text-emerald-300 border-emerald-400/40",
    countered: "bg-purple-400/20 text-purple-300 border-purple-400/40",
    proposed: "bg-sky-400/20 text-sky-300 border-sky-400/40",
  };
  return map[status] || "bg-gray-400/20 text-gray-300 border-gray-400/40";
};

export default function TutorRequestsPage() {
  const router = useRouter();
  const [, forceUpdate] = useState({});

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [searchStudent, setSearchStudent] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("All");
  const [sortBy, setSortBy] = useState("newest");
  const [requestFilter, setRequestFilter] = useState<"new" | "completed">("new");
  const [statusOptions, setStatusOptions] = useState<string[]>(["All"]);

  const [filterModalOpen, setFilterModalOpen] = useState(false);

  const socketUnsubRef = useRef<(() => void) | null>(null);

  // Redux subscription
  useEffect(() => {
    const unsubscribe = subscribeTutorRequests(() => {
      forceUpdate({});
    });
    return unsubscribe;
  }, []);

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  const extractStatuses = (requests: TutorRequest[]) => {
    const statuses = ["All", ...new Set(requests.map((r) => r.status))];
    setStatusOptions(statuses);
  };

  const fetchRequests = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getTutorRequests();
      const data = res?.data?.data || res?.data || [];
      setTutorRequests(data);
      extractStatuses(data);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load requests.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const filteredRequests = tutorRequestsCache.requests
    .filter((request) => {
      if (searchStudent && !request.student.name.toLowerCase().includes(searchStudent.toLowerCase())) return false;
      if (selectedStatus !== "All" && request.status !== selectedStatus) return false;
      if (startDate && new Date(request.created_at) < new Date(startDate)) return false;
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        if (new Date(request.created_at) > end) return false;
      }
      if (requestFilter === "new" && request.status !== "pending") return false;
      if (requestFilter === "completed" && request.status !== "accepted" && request.status !== "completed") return false;
      return true;
    })
    .sort((a, b) => {
      if (sortBy === "oldest") return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      if (sortBy === "student_asc") return a.student.name.localeCompare(b.student.name);
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

  // Initial load & cache rehydration
  useEffect(() => {
    const load = async () => {
      if (tutorRequestsCache.loaded) {
        extractStatuses(tutorRequestsCache.requests);
        forceUpdate({});
        setLoading(false);
        return;
      }
      clearTutorRequests();
      await fetchRequests();
    };
    load();
  }, []);

  const handleAccept = async (requestId: number) => {
    if (!window.confirm("Accept this request?")) return;
    try {
      await handleDirectRequest({ request_id: requestId, action: "accept" });
      removeTutorRequest(requestId);
      toast.success("Request accepted!");
    } catch (error) {
      console.error("Accept error:", error);
      toast.error("Failed to accept request.");
    }
  };

  const handleReject = async (requestId: number) => {
    if (!window.confirm("Reject this request?")) return;
    try {
      await handleDirectRequest({ request_id: requestId, action: "reject" });
      toast.success("Request rejected.");
      removeTutorRequest(requestId);
    } catch (error) {
      console.error("Reject error:", error);
      toast.error("Failed to reject request.");
    }
  };

  // Socket real-time events
  useEffect(() => {
    const unsub = subscribeSocket((event, data) => {
      console.log("📡 REQUEST EVENT:", event, data);
      if (event === SocketEvents.NEW_DOUBT_REQUEST) addTutorRequest(data);
      if (event === SocketEvents.DIRECT_REJECTED) removeTutorRequest(data.request_id);
      if (event === "DIRECT_UPDATED") updateTutorRequest(data);
      if (event === "DIRECT_CANCELLED") removeTutorRequest(data.request_id);
      if (event === SocketEvents.DIRECT_ACCEPTED) {
        removeTutorRequest(data.request_id);
        if (data.session_id) {
          if (data.session_type === "chat") router.push(`/chat/${data.session_id}`);
          else router.push(`/videocall/${data.session_id}`);
        }
      }
    });
    socketUnsubRef.current = unsub;
    return () => {
      if (socketUnsubRef.current) socketUnsubRef.current();
    };
  }, [router]);

  const resetFilters = () => {
    setSearchStudent("");
    setStartDate("");
    setEndDate("");
    setSelectedStatus("All");
    setSortBy("newest");
    setFilterModalOpen(false);
  };

  if (loading && !refreshing) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e]">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-violet-400 border-t-transparent" />
          <p className="mt-4 text-white/70">Loading requests...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e] relative overflow-hidden">
      {/* Animated blobs */}
      <div className="absolute top-0 -left-20 w-72 h-72 bg-purple-500/20 rounded-full mix-blend-multiply filter blur-3xl animate-blob" />
      <div className="absolute top-0 -right-20 w-72 h-72 bg-fuchsia-500/20 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000" />
      <div className="absolute -bottom-20 left-40 w-72 h-72 bg-cyan-500/20 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000" />

      <div className="relative z-10">
        {/* Header */}
        <div className="backdrop-blur-xl bg-white/5 border-b border-white/10 px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-violet-300 to-fuchsia-300">
            📨 Tutor Requests
          </h1>
          <button
            onClick={() => setFilterModalOpen(true)}
            className="bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white px-4 py-2 rounded-full font-semibold text-sm hover:from-violet-600 hover:to-fuchsia-600 transition shadow-lg"
          >
            🔍 Filter
          </button>
        </div>

        {/* Sort Chips */}
        <div className="backdrop-blur-xl bg-white/5 border-b border-white/10 px-4 py-2 flex gap-2 overflow-x-auto scrollbar-hide">
          <button
            onClick={() => setRequestFilter("new")}
            className={`px-3 py-1 rounded-full text-sm font-semibold transition ${
              requestFilter === "new"
                ? "bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white"
                : "bg-white/10 text-white/70 hover:bg-white/20"
            }`}
          >
            🆕 New Requests
          </button>
          <button
            onClick={() => setRequestFilter("completed")}
            className={`px-3 py-1 rounded-full text-sm font-semibold transition ${
              requestFilter === "completed"
                ? "bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white"
                : "bg-white/10 text-white/70 hover:bg-white/20"
            }`}
          >
            ✅ Completed
          </button>
          <button
            onClick={() => setSortBy("oldest")}
            className={`px-3 py-1 rounded-full text-sm font-semibold whitespace-nowrap transition ${
              sortBy === "oldest"
                ? "bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white"
                : "bg-white/10 text-white/70 hover:bg-white/20"
            }`}
          >
            🕒 Oldest
          </button>
          <button
            onClick={() => setSortBy("student_asc")}
            className={`px-3 py-1 rounded-full text-sm font-semibold whitespace-nowrap transition ${
              sortBy === "student_asc"
                ? "bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white"
                : "bg-white/10 text-white/70 hover:bg-white/20"
            }`}
          >
            👤 Student A–Z
          </button>
        </div>

        {/* Refresh */}
        <div className="px-4 py-3 flex justify-end">
          <button
            onClick={async () => {
              setRefreshing(true);
              if (!tutorRequestsCache.loaded) await fetchRequests();
            }}
            disabled={refreshing}
            className="flex items-center gap-2 text-sm text-violet-300 hover:text-violet-200 disabled:opacity-50"
          >
            <svg
              className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
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
            {refreshing ? "Refreshing..." : "Refresh"}
          </button>
        </div>

        {/* Request Cards Grid */}
        <div className="px-4 pb-20 grid grid-cols-1 lg:grid-cols-3 gap-5">
          {filteredRequests.length === 0 && !loading && (
            <div className="col-span-full text-center py-16 text-white/50">
              <span className="text-4xl mb-4 block">📭</span>
              <p className="text-lg font-semibold">No requests match filters</p>
            </div>
          )}

          <AnimatePresence>
            {filteredRequests.map((item) => {
              const isPending = item.status === "pending";
              const badgeClass = statusBadgeClass(item.status);
              const statusIcon = statusIcons[item.status] || "📌";

              return (
                <motion.div
                  key={item.request_id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="group relative bg-white/5 backdrop-blur-xl rounded-2xl p-5 border border-white/10 shadow-xl hover:border-violet-400/40 transition-all duration-300 hover:-translate-y-1 flex flex-col"
                >
                  <h2 className="text-lg font-bold text-white group-hover:text-violet-300 transition-colors line-clamp-2">
                    {item.title}
                  </h2>
                  <p className="text-sm text-white/60 mt-1 line-clamp-2 flex-1">
                    {item.description}
                  </p>

                  <div className="flex flex-wrap items-center gap-2 mt-3">
                    <span className="bg-violet-500/20 text-violet-300 text-xs font-semibold px-2 py-1 rounded-full border border-violet-400/30">
                      📂 {item.category}
                    </span>
                    <span className="text-sm text-white/70 flex items-center gap-1">
                      👤 {item.student?.name || "Unknown"}
                    </span>
                    <span className="text-sm text-white/70 flex items-center gap-1">
                      💬 {item.preferred_explanation}
                    </span>
                  </div>

                  <div className="flex items-center justify-between mt-3">
                    <span className="text-xs text-white/50">
                      📅 {formatDate(item.created_at)}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold border ${badgeClass}`}
                    >
                      {statusIcon} {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                    </span>
                  </div>

                  <div className="mt-4">
                    {isPending ? (
                      <div className="flex gap-3">
                        <button
                          onClick={() => handleAccept(item.request_id)}
                          className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-semibold py-2.5 rounded-xl transition shadow-lg shadow-emerald-500/25"
                        >
                          ✓ Accept
                        </button>
                        <button
                          onClick={() => handleReject(item.request_id)}
                          className="flex-1 bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white font-semibold py-2.5 rounded-xl transition shadow-lg shadow-rose-500/25"
                        >
                          ✗ Reject
                        </button>
                      </div>
                    ) : (
                      <div className="text-center py-3 bg-white/10 rounded-xl text-sm text-white/70 font-medium border border-white/10">
                        Request {item.status}
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {/* Filter Modal */}
        <AnimatePresence>
          {filterModalOpen && (
            <div
              className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm"
              onClick={() => setFilterModalOpen(false)}
            >
              <motion.div
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 50 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-gradient-to-b from-[#1a1535] to-[#0f0c29] w-full max-w-md rounded-t-3xl sm:rounded-3xl p-6 max-h-[80vh] overflow-y-auto border border-white/10 shadow-2xl"
              >
                <h2 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-violet-300 to-fuchsia-300 mb-4">
                  🔧 Filter Requests
                </h2>

                <label className="block text-sm font-medium text-white/80 mb-1">👤 Student Name</label>
                <input
                  type="text"
                  placeholder="Search by student name"
                  value={searchStudent}
                  onChange={(e) => setSearchStudent(e.target.value)}
                  className="w-full bg-gray-900/60 border border-white/20 rounded-xl px-4 py-2 text-sm text-white placeholder-white/40 focus:ring-4 focus:ring-violet-500/50 focus:border-violet-400 outline-none mb-4"
                />

                <label className="block text-sm font-medium text-white/80 mb-1">📅 Date Range</label>
                <div className="flex gap-2 mb-4">
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="flex-1 bg-gray-900/60 border border-white/20 rounded-xl px-3 py-2 text-sm text-white"
                  />
                  <span className="self-center text-white/40">–</span>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="flex-1 bg-gray-900/60 border border-white/20 rounded-xl px-3 py-2 text-sm text-white"
                  />
                </div>

                <label className="block text-sm font-medium text-white/80 mb-1">📌 Status</label>
                <div className="flex flex-wrap gap-2 mb-4">
                  {statusOptions.map((status) => (
                    <button
                      key={status}
                      onClick={() => setSelectedStatus(status)}
                      className={`px-3 py-1 rounded-full text-sm font-semibold transition ${
                        selectedStatus === status
                          ? "bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white"
                          : "bg-white/10 text-white/70 hover:bg-white/20"
                      }`}
                    >
                      {status === "All" ? "All" : status.charAt(0).toUpperCase() + status.slice(1)}
                    </button>
                  ))}
                </div>

                <div className="flex gap-3 mt-4">
                  <button
                    onClick={resetFilters}
                    className="flex-1 bg-white/10 hover:bg-white/20 text-white/80 font-semibold py-2 rounded-xl border border-white/20"
                  >
                    Reset All
                  </button>
                  <button
                    onClick={() => setFilterModalOpen(false)}
                    className="flex-1 bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:from-violet-600 hover:to-fuchsia-600 text-white font-semibold py-2 rounded-xl shadow-lg"
                  >
                    Apply & Close
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}