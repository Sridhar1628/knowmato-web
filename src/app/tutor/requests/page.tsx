"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
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
const statusColors: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700",
  accepted: "bg-emerald-100 text-emerald-700",
  countered: "bg-purple-100 text-purple-700",
  proposed: "bg-blue-100 text-blue-700",
};

export default function TutorRequestsPage() {
  const router = useRouter();
  const [, forceUpdate] = useState({});

  // Data
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters
  const [searchStudent, setSearchStudent] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("All");
  const [sortBy, setSortBy] = useState("newest");
  const [requestFilter, setRequestFilter] = useState<"new" | "completed">("new");
  const [statusOptions, setStatusOptions] = useState<string[]>(["All"]);

  // Filter modal
  const [filterModalOpen, setFilterModalOpen] = useState(false);

  // Socket
  const socketUnsubRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    const unsubscribe = subscribeTutorRequests(() => {
      forceUpdate({});
    });
    return unsubscribe;
  }, []);

  // ---------- Helpers ----------
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

  // ---------- Fetch Requests ----------
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
      if (
        searchStudent &&
        !request.student.name
          .toLowerCase()
          .includes(searchStudent.toLowerCase())
      ) {
        return false;
      }
      if (selectedStatus !== "All" && request.status !== selectedStatus) {
        return false;
      }
      if (startDate && new Date(request.created_at) < new Date(startDate)) {
        return false;
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        if (new Date(request.created_at) > end) {
          return false;
        }
      }
      if (requestFilter === "new" && request.status !== "pending") {
        return false;
      }
      if (
        requestFilter === "completed" &&
        request.status !== "accepted" &&
        request.status !== "completed"
      ) {
        return false;
      }
      return true;
    })
    .sort((a, b) => {
      if (sortBy === "oldest") {
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      }
      if (sortBy === "student_asc") {
        return a.student.name.localeCompare(b.student.name);
      }
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

  // Re-fetch when filters change (except initial load)
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

  // ---------- Accept / Reject ----------
  const handleAccept = async (requestId: number) => {
    if (!window.confirm("Accept this request?")) return;
    try {
      await handleDirectRequest({
        request_id: requestId,
        action: "accept",
      });
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

  // ---------- Socket Real‑time ----------
  useEffect(() => {
    const unsub = subscribeSocket((event, data) => {
      console.log("📡 REQUEST EVENT:", event, data);
      if (event === SocketEvents.NEW_DOUBT_REQUEST) {
        addTutorRequest(data);
      }
      if (event === SocketEvents.DIRECT_REJECTED) {
        removeTutorRequest(data.request_id);
      }
      if (event === "DIRECT_UPDATED") {
        updateTutorRequest(data);
      }
      if (event === "DIRECT_CANCELLED") {
        removeTutorRequest(data.request_id);
      }
      if (event === SocketEvents.DIRECT_ACCEPTED) {
        removeTutorRequest(data.request_id);
        const sessionId = data.session_id;
        if (!sessionId) return;
        if (data.session_type === "chat") {
          router.push(`/chat/${sessionId}`);
        } else {
          router.push(`/videocall/${sessionId}`);
        }
      }
    });
    socketUnsubRef.current = unsub;
    return () => {
      if (socketUnsubRef.current) socketUnsubRef.current();
    };
  }, [router]);

  // ---------- Filter Handlers ----------
  const resetFilters = () => {
    setSearchStudent("");
    setStartDate("");
    setEndDate("");
    setSelectedStatus("All");
    setSortBy("newest");
    setFilterModalOpen(false);
  };

  // ---------- Render ----------
  if (loading && !refreshing) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
          <p className="mt-4 text-gray-600">Loading requests...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-800">📨 Tutor Requests</h1>
        <button
          onClick={() => setFilterModalOpen(true)}
          className="bg-indigo-600 text-white px-4 py-2 rounded-full font-semibold text-sm hover:bg-indigo-700 transition"
        >
          🔍 Filter
        </button>
      </div>

      {/* Sort Chips */}
      <div className="bg-white border-b border-gray-200 px-4 py-2 flex gap-2 overflow-x-auto scrollbar-hide">
        <button
          onClick={() => setRequestFilter("new")}
          className={`px-3 py-1 rounded-full text-sm font-semibold ${
            requestFilter === "new"
              ? "bg-indigo-600 text-white"
              : "bg-gray-100 text-gray-700"
          }`}
        >
          🆕 New Requests
        </button>
        <button
          onClick={() => setRequestFilter("completed")}
          className={`px-3 py-1 rounded-full text-sm font-semibold ${
            requestFilter === "completed"
              ? "bg-indigo-600 text-white"
              : "bg-gray-100 text-gray-700"
          }`}
        >
          ✅ Completed
        </button>
        <button
          onClick={() => setSortBy("oldest")}
          className={`px-3 py-1 rounded-full text-sm font-semibold whitespace-nowrap ${
            sortBy === "oldest"
              ? "bg-indigo-600 text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          🕒 Oldest
        </button>
        <button
          onClick={() => setSortBy("student_asc")}
          className={`px-3 py-1 rounded-full text-sm font-semibold whitespace-nowrap ${
            sortBy === "student_asc"
              ? "bg-indigo-600 text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
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
            if (!tutorRequestsCache.loaded) {
              await fetchRequests();
            }
          }}
          disabled={refreshing}
          className="flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-800 disabled:opacity-50"
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

      {/* Request Cards Grid: 1 col on mobile, 3 cols on desktop */}
      <div className="px-4 pb-20 grid grid-cols-1 lg:grid-cols-3 gap-5">
        {filteredRequests.length === 0 && !loading && (
          <div className="col-span-full text-center py-16 text-gray-400">
            <span className="text-4xl mb-4 block">📭</span>
            <p className="text-lg font-semibold">No requests match filters</p>
          </div>
        )}

        {filteredRequests.map((item) => {
          const isPending = item.status === "pending";
          const statusColor = statusColors[item.status] || "bg-gray-100 text-gray-700";
          const statusIcon = statusIcons[item.status] || "📌";

          return (
            <div
              key={item.request_id}
              className="group relative bg-white rounded-2xl p-5 border border-gray-200 shadow-sm hover:shadow-xl hover:border-indigo-200 transition-all duration-300 ease-out hover:-translate-y-1 flex flex-col"
            >
              {/* Title & Description */}
              <h2 className="text-lg font-bold text-gray-800 group-hover:text-indigo-700 transition-colors line-clamp-2">
                {item.title}
              </h2>
              <p className="text-sm text-gray-500 mt-1 line-clamp-2 flex-1">
                {item.description}
              </p>

              {/* Meta info */}
              <div className="flex flex-wrap items-center gap-2 mt-3">
                <span className="bg-indigo-50 text-indigo-700 text-xs font-semibold px-2 py-1 rounded-full">
                  📂 {item.category}
                </span>
                <span className="text-sm text-gray-600 flex items-center gap-1">
                  👤 {item.student?.name || "Unknown"}
                </span>
                <span className="text-sm text-gray-600 flex items-center gap-1">
                  💬 {item.preferred_explanation}
                </span>
              </div>

              {/* Date & Status */}
              <div className="flex items-center justify-between mt-3">
                <span className="text-xs text-gray-400">
                  📅 {formatDate(item.created_at)}
                </span>
                <span
                  className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${statusColor}`}
                >
                  {statusIcon} {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                </span>
              </div>

              {/* Action buttons or status */}
              <div className="mt-4">
                {isPending ? (
                  <div className="flex gap-3">
                    <button
                      onClick={() => handleAccept(item.request_id)}
                      className="flex-1 bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-white font-semibold py-2.5 rounded-xl transition-colors shadow-sm hover:shadow-md"
                    >
                      ✓ Accept
                    </button>
                    <button
                      onClick={() => handleReject(item.request_id)}
                      className="flex-1 bg-red-500 hover:bg-red-600 active:bg-red-700 text-white font-semibold py-2.5 rounded-xl transition-colors shadow-sm hover:shadow-md"
                    >
                      ✗ Reject
                    </button>
                  </div>
                ) : (
                  <div className="text-center py-3 bg-gray-100 rounded-xl text-sm text-gray-700 font-medium border border-gray-200">
                    Request {item.status}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Filter Modal (Drawer) */}
      {filterModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black bg-opacity-50"
          onClick={() => setFilterModalOpen(false)}
        >
          <div
            className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl p-6 max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl font-bold mb-4">🔧 Filter Requests</h2>

            {/* Student Name */}
            <label className="block text-sm font-medium mb-1">👤 Student Name</label>
            <input
              type="text"
              placeholder="Search by student name"
              value={searchStudent}
              onChange={(e) => setSearchStudent(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-2 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />

            {/* Date Range */}
            <label className="block text-sm font-medium mb-1">📅 Date Range</label>
            <div className="flex gap-2 mb-4">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm"
              />
              <span className="self-center text-gray-400">–</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm"
              />
            </div>

            {/* Status */}
            <label className="block text-sm font-medium mb-1">📌 Status</label>
            <div className="flex flex-wrap gap-2 mb-4">
              {statusOptions.map((status) => (
                <button
                  key={status}
                  onClick={() => setSelectedStatus(status)}
                  className={`px-3 py-1 rounded-full text-sm font-semibold ${
                    selectedStatus === status
                      ? "bg-indigo-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {status === "All"
                    ? "All"
                    : status.charAt(0).toUpperCase() + status.slice(1)}
                </button>
              ))}
            </div>

            {/* Buttons */}
            <div className="flex gap-3 mt-4">
              <button
                onClick={resetFilters}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-2 rounded-xl"
              >
                Reset All
              </button>
              <button
                onClick={() => setFilterModalOpen(false)}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 rounded-xl"
              >
                Apply & Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}