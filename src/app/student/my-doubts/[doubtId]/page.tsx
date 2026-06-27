"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { getDoubtDetails } from "@/services/v1Service";
import { connectSocket, disconnectSocket } from "@/services/versionSocketService";
import { getTokens } from "@/services/storageService";
import toast from "react-hot-toast";

// ---------- Types ----------
interface DoubtDetail {
  id: number;
  title: string;
  description: string;
  category: string;
  mode: "pool" | "specific";
  status: "open" | "assigned" | "completed";
  preferred_explanation: string;
  price: number | null;
  keywords: string;
  created_at: string;
  student: { id: number; name: string };
  tutor: { id: number; name: string } | null;
  session: {
    id: number;
    status: string;
    session_type: string;
    started_at: string | null;
    ended_at: string | null;
    price: number;
  } | null;
  direct_request: {
    request_id: number;
    tutor_name: string;
    price: number;
  } | null;
  review?: {
    rating: number;
    comment: string;
  } | null;
}

export default function MyDoubtsDetailsPage() {
  const params = useParams();
  const doubtId = Number(params.doubtId);
  const router = useRouter();

  const [doubt, setDoubt] = useState<DoubtDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  const hasReview = doubt?.review != null;

  const fetchDetails = useCallback(async () => {
    try {
      const res = await getDoubtDetails(doubtId);
      const data = res?.data?.data || res?.data;
      setDoubt(data);
    } catch (error) {
      console.error("Fetch details error:", error);
      toast.error("Failed to load doubt details.");
    } finally {
      setLoading(false);
    }
  }, [doubtId]);

  useEffect(() => {
    fetchDetails();
  }, [fetchDetails]);

  useEffect(() => {
    let mounted = true;

    const initSocket = async () => {
      const tokens = await getTokens();
      if (!tokens?.access) return;

      connectSocket(tokens.access, (event, data) => {
        if (!mounted) return;
        console.log("📡 DOUBT DETAILS EVENT:", event, data);

        if (event === "TUTOR_ACCEPTED" || event === "SESSION_STARTED") {
          if (data?.doubt_id === doubtId) {
            fetchDetails();
          }
        }
        if (event === "REQUEST_UPDATED") {
          if (data?.doubt_id === doubtId) {
            fetchDetails();
          }
        }
      });
    };

    initSocket();
    return () => {
      mounted = false;
      disconnectSocket();
    };
  }, [doubtId, fetchDetails]);

  const joinSession = () => {
    if (!doubt?.session?.id) return;
    const sessionType = doubt.session.session_type;
    if (sessionType === "live_video") {
      router.push(`/videocall/${doubt.session.id}`);
    } else {
      router.push(`/chat/${doubt.session.id}`);
    }
  };

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "open":
        return {
          emoji: "🟢",
          color: "text-emerald-300",
          bg: "bg-emerald-400/20 border-emerald-400/40",
          text: "Open",
        };
      case "assigned":
        return {
          emoji: "🔵",
          color: "text-sky-300",
          bg: "bg-sky-400/20 border-sky-400/40",
          text: "Assigned",
        };
      case "completed":
        return {
          emoji: "✅",
          color: "text-gray-300",
          bg: "bg-gray-400/20 border-gray-400/40",
          text: "Completed",
        };
      default:
        return {
          emoji: "⚪",
          color: "text-gray-300",
          bg: "bg-gray-400/20 border-gray-400/40",
          text: status,
        };
    }
  };

  // ================== LOADING STATE ==================
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e] relative overflow-hidden flex items-center justify-center">
        <div className="absolute top-0 -left-20 w-72 h-72 bg-purple-500/20 rounded-full mix-blend-multiply filter blur-3xl animate-blob" />
        <div className="absolute top-0 -right-20 w-72 h-72 bg-fuchsia-500/20 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000" />
        <div className="absolute -bottom-20 left-40 w-72 h-72 bg-cyan-500/20 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000" />
        <div className="relative z-10 text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-violet-400 border-t-transparent" />
          <p className="mt-4 text-white/80 font-medium">Loading doubt details...</p>
        </div>
      </div>
    );
  }

  // ================== NOT FOUND ==================
  if (!doubt) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e] relative overflow-hidden flex items-center justify-center">
        <div className="absolute top-0 -left-20 w-72 h-72 bg-purple-500/20 rounded-full mix-blend-multiply filter blur-3xl animate-blob" />
        <div className="absolute top-0 -right-20 w-72 h-72 bg-fuchsia-500/20 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000" />
        <div className="absolute -bottom-20 left-40 w-72 h-72 bg-cyan-500/20 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000" />
        <div className="relative z-10 text-center text-white">
          <p className="text-xl text-rose-400">Doubt not found</p>
        </div>
      </div>
    );
  }

  const statusStyle = getStatusStyle(doubt.status);
  const hasSession = doubt.session && doubt.session.id;
  const hasDirectRequest = doubt.direct_request && doubt.status === "open";

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e] relative overflow-hidden p-4 sm:p-6 lg:p-8">
      {/* Animated background blobs */}
      <div className="absolute top-0 -left-20 w-72 h-72 bg-purple-500/20 rounded-full mix-blend-multiply filter blur-3xl animate-blob" />
      <div className="absolute top-0 -right-20 w-72 h-72 bg-fuchsia-500/20 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000" />
      <div className="absolute -bottom-20 left-40 w-72 h-72 bg-cyan-500/20 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000" />

      <div className="relative z-10 max-w-3xl mx-auto">
        {/* Header */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-4 sm:p-6 mb-6 shadow-2xl flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-xl hover:bg-white/10 transition text-white/80 hover:text-white"
          >
            <span className="text-lg">←</span>
          </button>
          <h1 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-violet-300 to-fuchsia-300">
            📄 Doubt Details
          </h1>
          <div className="w-10" /> {/* spacer */}
        </div>

        {/* Main Card */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-5 sm:p-6 shadow-2xl mb-6">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 mb-4">
            <h2 className="text-xl font-bold text-white flex-1">
              {doubt.title}
            </h2>
            <span
              className={`self-start inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold border ${statusStyle.bg} ${statusStyle.color}`}
            >
              {statusStyle.emoji} {statusStyle.text}
            </span>
          </div>

          <p className="text-white/70 mb-4">{doubt.description}</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
            <div>
              <span className="text-white/50">📂 Category:</span>{" "}
              <span className="font-medium text-white">{doubt.category}</span>
            </div>
            <div>
              <span className="text-white/50">🎯 Mode:</span>{" "}
              <span className="font-medium text-white capitalize">{doubt.mode}</span>
            </div>
            <div>
              <span className="text-white/50">💬 Explanation:</span>{" "}
              <span className="font-medium text-white">{doubt.preferred_explanation}</span>
            </div>
            <div>
              <span className="text-white/50">💰 Price:</span>{" "}
              <span className="font-bold text-emerald-300">
                {doubt.price ? `₹${doubt.price}` : "Free"}
              </span>
            </div>
            <div className="sm:col-span-2">
              <span className="text-white/50">📅 Created:</span>{" "}
              <span className="text-white">{formatDate(doubt.created_at)}</span>
            </div>
            {doubt.tutor && (
              <div className="sm:col-span-2">
                <span className="text-white/50">👨‍🏫 Tutor:</span>{" "}
                <span className="font-medium text-white">{doubt.tutor.name}</span>
              </div>
            )}
            {doubt.keywords && (
              <div className="sm:col-span-2">
                <span className="text-white/50">🔑 Keywords:</span>{" "}
                <span className="text-white">{doubt.keywords}</span>
              </div>
            )}
          </div>
        </div>

        {/* STATUS ACTION CARDS */}

        {/* Open pool – waiting */}
        {doubt.status === "open" && doubt.mode === "pool" && (
          <div className="mb-6 rounded-3xl border border-amber-400/30 bg-amber-400/10 backdrop-blur-md p-6 text-center shadow-xl">
            <div className="text-5xl">⏳</div>
            <h3 className="mt-3 text-xl font-bold text-amber-300">Waiting For Tutor</h3>
            <p className="mt-2 text-sm text-amber-200/80">
              Your doubt is visible to online tutors.
            </p>
            <button
              onClick={fetchDetails}
              className="mt-4 rounded-xl bg-amber-500/20 border border-amber-400/40 px-5 py-3 font-semibold text-amber-300 hover:bg-amber-500/30 transition"
            >
              🔄 Refresh Status
            </button>
          </div>
        )}

        {/* Tutor accepted / session ready */}
        {hasSession && doubt.status === "assigned" && (
          <div className="mb-6 rounded-3xl border border-emerald-400/30 bg-emerald-400/10 backdrop-blur-md p-6 shadow-xl">
            <h3 className="text-xl font-bold text-emerald-300">🎉 Tutor Accepted</h3>
            <p className="mt-2 text-emerald-200/80">Your session is ready.</p>
            <button
              onClick={joinSession}
              className="mt-5 w-full rounded-xl bg-gradient-to-r from-emerald-500 to-green-500 py-4 text-lg font-bold text-white shadow-lg shadow-emerald-500/25 hover:from-emerald-600 hover:to-green-600 transition"
            >
              🚀 Join Session
            </button>
          </div>
        )}

        {/* Specific Mode: Tutor Proposal */}
        {hasDirectRequest && (
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-5 shadow-2xl mb-6">
            <h3 className="text-lg font-bold text-white mb-4">
              📨 Tutor Proposal
            </h3>
            <div className="flex justify-between mb-3">
              <span className="text-white/60">👨‍🏫 Tutor:</span>
              <span className="font-medium text-white">
                {doubt.direct_request?.tutor_name}
              </span>
            </div>
            <div className="flex justify-between mb-6">
              <span className="text-white/60">💰 Proposed Price:</span>
              <span className="font-bold text-violet-300 text-lg">
                ₹{doubt.direct_request?.price}
              </span>
            </div>
            <div className="flex gap-3">
              {/* Action buttons if needed */}
            </div>
          </div>
        )}

        {/* Completed – no review */}
        {doubt.status === "completed" && !hasReview && (
          <div className="mb-6 rounded-3xl border border-violet-400/30 bg-violet-400/10 backdrop-blur-md p-6 shadow-xl">
            <h3 className="text-xl font-bold text-violet-300">⭐ Session Completed</h3>
            <p className="mt-2 text-violet-200/80">Share your feedback.</p>
            <button
              onClick={() => router.push(`/student/submit-review/${doubt.session?.id}`)}
              className="mt-4 w-full rounded-xl bg-gradient-to-r from-violet-500 to-fuchsia-500 py-3 font-bold text-white shadow-lg shadow-violet-500/25 hover:from-violet-600 hover:to-fuchsia-600 transition"
            >
              ⭐ Submit Review
            </button>
          </div>
        )}

        {/* Completed – review done */}
        {doubt.status === "completed" && hasReview && (
          <div className="mb-6 rounded-3xl border border-white/10 bg-white/5 backdrop-blur-md p-6 shadow-xl">
            <h3 className="text-xl font-bold text-white">✅ Session Completed</h3>
            <p className="mt-2 text-white/70">Review already submitted.</p>
            <div className="mt-4 text-amber-300 text-xl">
              {"⭐".repeat(doubt.review?.rating || 0)}
            </div>
          </div>
        )}

        {/* Assigned but no session yet */}
        {doubt.status === "assigned" && !hasSession && (
          <div className="mb-6 rounded-3xl border border-sky-400/30 bg-sky-400/10 backdrop-blur-md p-6 text-center shadow-xl">
            <span className="text-4xl block mb-3">🔵</span>
            <p className="text-lg font-semibold text-sky-300">
              Assigned to a tutor. Session will start soon.
            </p>
          </div>
        )}

        {/* Pool Mode: Waiting (fallback) */}
        {doubt.mode === "pool" && doubt.status === "open" && !hasSession && (
          <div className="border border-amber-400/30 bg-amber-400/10 backdrop-blur-md rounded-3xl p-6 text-center mb-6 shadow-xl">
            <span className="text-4xl block mb-3">⏳</span>
            <p className="text-lg font-semibold text-amber-300">
              Waiting for a tutor to accept your doubt...
            </p>
            <p className="text-sm text-amber-200/80 mt-2">
              You will be notified when a tutor responds.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}