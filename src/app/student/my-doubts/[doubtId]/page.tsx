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
  const doubtId = Number(params.doubtId); // assumes dynamic route [doubtId]
  const router = useRouter();

  const [doubt, setDoubt] = useState<DoubtDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  const hasReview = doubt?.review != null;


  // ================== FETCH DETAILS ==================
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

  // ================== SOCKET REAL‑TIME UPDATES ==================
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

  // ================== ACTIONS ==================
  const joinSession = () => {
    if (!doubt?.session?.id) return;
    const sessionType = doubt.session.session_type;
    if (sessionType === "live_video") {
      router.push(`/videocall/${doubt.session.id}`);
    } else {
      router.push(`/chat/${doubt.session.id}`);
    }
  };

  // ================== HELPERS ==================
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
          color: "text-emerald-700",
          bg: "bg-emerald-100",
          text: "Open",
        };
      case "assigned":
        return {
          emoji: "🔵",
          color: "text-blue-700",
          bg: "bg-blue-100",
          text: "Assigned",
        };
      case "completed":
        return {
          emoji: "✅",
          color: "text-gray-700",
          bg: "bg-gray-100",
          text: "Completed",
        };
      default:
        return {
          emoji: "⚪",
          color: "text-gray-700",
          bg: "bg-gray-100",
          text: status,
        };
    }
  };

  // ================== LOADING STATE ==================
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
          <p className="mt-4 text-gray-600">Loading doubt details...</p>
        </div>
      </div>
    );
  }

  // ================== NOT FOUND ==================
  if (!doubt) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-xl text-red-500">Doubt not found</p>
        </div>
      </div>
    );
  }

  const statusStyle = getStatusStyle(doubt.status);
  const hasSession = doubt.session && doubt.session.id;
  const hasDirectRequest = doubt.direct_request && doubt.status === "open";

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-indigo-800 text-white px-4 py-5 flex items-center justify-between shadow-md">
        <button
          onClick={() => router.back()}
          className="p-1 rounded hover:bg-white/20"
        >
          <span className="text-lg">←</span>
        </button>
        <h1 className="text-lg font-bold">📄 Doubt Details</h1>
        <div className="w-8" /> {/* spacer */}
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6">
        {/* Main Card */}
        <div className="bg-white rounded-2xl p-5 shadow-sm mb-6">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 mb-4">
            <h2 className="text-xl font-bold text-gray-800 flex-1">
              {doubt.title}
            </h2>
            <span
              className={`self-start inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${statusStyle.bg} ${statusStyle.color}`}
            >
              {statusStyle.emoji} {statusStyle.text}
            </span>
          </div>

          <p className="text-gray-600 mb-4">{doubt.description}</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
            <div>
              <span className="text-gray-500">📂 Category:</span>{" "}
              <span className="font-medium">{doubt.category}</span>
            </div>
            <div>
              <span className="text-gray-500">🎯 Mode:</span>{" "}
              <span className="font-medium capitalize">{doubt.mode}</span>
            </div>
            <div>
              <span className="text-gray-500">💬 Explanation:</span>{" "}
              <span className="font-medium">{doubt.preferred_explanation}</span>
            </div>
            <div>
              <span className="font-semibold text-emerald-600">
                {doubt.price ? `₹${doubt.price}` : "Free"}
              </span>
            </div>
            <div className="sm:col-span-2">
              <span className="text-gray-500">📅 Created:</span>{" "}
              <span>{formatDate(doubt.created_at)}</span>
            </div>
            {doubt.tutor && (
              <div className="sm:col-span-2">
                <span className="text-gray-500">👨‍🏫 Tutor:</span>{" "}
                <span className="font-medium">{doubt.tutor.name}</span>
              </div>
            )}
            {doubt.keywords && (
              <div className="sm:col-span-2">
                <span className="text-gray-500">🔑 Keywords:</span>{" "}
                <span>{doubt.keywords}</span>
              </div>
            )}
          </div>
        </div>

        {/* STATUS ACTION CARD */}

        {doubt.status === 'open' &&
          doubt.mode === 'pool' && (

            <div
              className="
                mb-6
                rounded-2xl
                border
                border-amber-200
                bg-amber-50
                p-6
                text-center
              "
            >
              <div className="text-5xl">
                ⏳
              </div>

              <h3
                className="
                  mt-3
                  text-xl
                  font-bold
                  text-amber-900
                "
              >
                Waiting For Tutor
              </h3>

              <p
                className="
                  mt-2
                  text-sm
                  text-amber-700
                "
              >
                Your doubt is visible
                to online tutors.
              </p>

              <button
                onClick={fetchDetails}
                className="
                  mt-4
                  rounded-xl
                  bg-amber-600
                  px-5
                  py-3
                  font-semibold
                  text-white
                "
              >
                🔄 Refresh Status
              </button>
            </div>

          )}

        {hasSession &&
          doubt.status === 'assigned' && (

            <div
              className="
                mb-6
                rounded-2xl
                border
                border-green-200
                bg-green-50
                p-6
              "
            >
              <h3
                className="
                  text-xl
                  font-bold
                  text-green-800
                "
              >
                🎉 Tutor Accepted
              </h3>

              <p
                className="
                  mt-2
                  text-green-700
                "
              >
                Your session is ready.
              </p>

              <button
                onClick={joinSession}
                className="
                  mt-5
                  w-full
                  rounded-xl
                  bg-green-600
                  py-4
                  text-lg
                  font-bold
                  text-white
                  shadow-lg
                  hover:bg-green-700
                "
              >
                🚀 Join Session
              </button>
            </div>

          )}

        {/* Specific Mode: Tutor Proposal */}
        {hasDirectRequest && (
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-200 mb-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">
              📨 Tutor Proposal
            </h3>
            <div className="flex justify-between mb-3">
              <span className="text-gray-600">👨‍🏫 Tutor:</span>
              <span className="font-medium">
                {doubt.direct_request?.tutor_name}
              </span>
            </div>
            <div className="flex justify-between mb-6">
              <span className="text-gray-600">💰 Proposed Price:</span>
              <span className="font-bold text-indigo-600 text-lg">
                ₹{doubt.direct_request?.price}
              </span>
            </div>

            <div className="flex gap-3">
            </div>
          </div>
        )}

        {doubt.status === 'completed' &&
        !hasReview && (

          <div
            className="
              mb-6
              rounded-2xl
              border
              border-indigo-200
              bg-indigo-50
              p-6
            "
          >
            <h3
              className="
                text-xl
                font-bold
                text-indigo-800
              "
            >
              ⭐ Session Completed
            </h3>

            <p
              className="
                mt-2
                text-indigo-700
              "
            >
              Share your feedback.
            </p>

            <button
              onClick={() =>
                router.push(
                  `/student/submit-review/${doubt.session?.id}`
                )
              }
              className="
                mt-4
                w-full
                rounded-xl
                bg-indigo-600
                py-3
                font-bold
                text-white
              "
            >
              ⭐ Submit Review
            </button>
          </div>

        )}

        {doubt.status === 'completed' &&
          hasReview && (

            <div
              className="
                mb-6
                rounded-2xl
                border
                border-gray-200
                bg-white
                p-6
              "
            >
              <h3
                className="
                  text-xl
                  font-bold
                  text-gray-800
                "
              >
                ✅ Session Completed
              </h3>

              <p
                className="
                  mt-2
                  text-gray-600
                "
              >
                Review already submitted.
              </p>

              <div className="mt-4">
                {'⭐'.repeat(
                  doubt.review?.rating || 0
                )}
              </div>
            </div>

          )}

        {/* Pool Mode: Waiting */}
        {doubt.mode === "pool" && doubt.status === "open" && !hasSession && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 text-center mb-6">
            <span className="text-4xl block mb-3">⏳</span>
            <p className="text-lg font-semibold text-amber-800">
              Waiting for a tutor to accept your doubt...
            </p>
            <p className="text-sm text-amber-700 mt-2">
              You will be notified when a tutor responds.
            </p>
          </div>
        )}

        {/* Assigned but no session */}
        {doubt.status === "assigned" && !hasSession && (
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6 text-center mb-6">
            <span className="text-4xl block mb-3">🔵</span>
            <p className="text-lg font-semibold text-blue-800">
              Assigned to a tutor. Session will start soon.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}