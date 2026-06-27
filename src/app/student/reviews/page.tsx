"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { getMyReviews, updateReview, StudentReview } from "@/services/reviewService";
import { getTokens } from "@/services/storageService";
import { WS_BASE_URL } from "@/config/env";
import toast from "react-hot-toast";

export default function StudentReviewsPage() {
  const [reviews, setReviews] = useState<StudentReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const [editingReview, setEditingReview] = useState<StudentReview | null>(null);
  const [editRating, setEditRating] = useState(5);
  const [editFeedback, setEditFeedback] = useState("");
  const [updating, setUpdating] = useState(false);

  const wsRef = useRef<WebSocket | null>(null);

  const fetchReviews = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true);
    setError(null);
    try {
      const data = await getMyReviews();
      setReviews(Array.isArray(data) ? data : []);
    } catch (err: any) {
      const msg = err?.response?.data?.error || err?.message || "Failed to load reviews.";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Real-time WebSocket
  useEffect(() => {
    let socket: WebSocket | null = null;
    const connect = async () => {
      try {
        const tokens = await getTokens();
        if (!tokens?.access) return;
        const payload = JSON.parse(atob(tokens.access.split(".")[1]));
        const userId = payload.user_id;
        socket = new WebSocket(`${WS_BASE_URL}/ws/user/${userId}/?token=${tokens.access}`);
        wsRef.current = socket;

        socket.onopen = () => console.log("🔥 REVIEW WS CONNECTED");
        socket.onmessage = (event) => {
          const msg = JSON.parse(event.data);
          if (!msg?.event) return;
          if (msg.event === "REVIEW_ADDED") {
            setReviews((prev) => {
              if (prev.find((r) => r.review_id === msg.data.review_id)) return prev;
              return [msg.data, ...prev];
            });
          }
          if (msg.event === "REVIEW_UPDATED") {
            setReviews((prev) =>
              prev.map((r) => (r.review_id === msg.data.review_id ? msg.data : r))
            );
          }
        };
        socket.onerror = () => console.error("WS ERROR");
        socket.onclose = () => console.log("WS CLOSED");
      } catch (err) {
        console.error("WS setup failed", err);
      }
    };
    connect();
    return () => {
      socket?.close();
    };
  }, []);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchReviews(false);
  };

  const handleEdit = (review: StudentReview) => {
    setEditingReview(review);
    setEditRating(review.rating);
    setEditFeedback(review.feedback || "");
  };

  const handleSave = async () => {
    if (!editingReview) return;
    setUpdating(true);
    try {
      await updateReview(editingReview.review_id, {
        rating: editRating,
        feedback: editFeedback,
      });
      setReviews((prev) =>
        prev.map((r) =>
          r.review_id === editingReview.review_id
            ? { ...r, rating: editRating, feedback: editFeedback }
            : r
        )
      );
      toast.success("Review updated!");
      setEditingReview(null);
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "Update failed");
    } finally {
      setUpdating(false);
    }
  };

  // Loading state
  if (loading && !refreshing) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e] relative overflow-hidden flex items-center justify-center">
        <div className="absolute top-0 -left-20 w-72 h-72 bg-purple-500/20 rounded-full mix-blend-multiply filter blur-3xl animate-blob" />
        <div className="absolute top-0 -right-20 w-72 h-72 bg-fuchsia-500/20 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000" />
        <div className="absolute -bottom-20 left-40 w-72 h-72 bg-cyan-500/20 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000" />
        <div className="relative z-10 text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-violet-400 border-t-transparent" />
          <p className="mt-4 text-white/80 font-medium">Loading reviews...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e] relative overflow-hidden p-4 sm:p-6 lg:p-8">
      {/* Animated background blobs */}
      <div className="absolute top-0 -left-20 w-72 h-72 bg-purple-500/20 rounded-full mix-blend-multiply filter blur-3xl animate-blob" />
      <div className="absolute top-0 -right-20 w-72 h-72 bg-fuchsia-500/20 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000" />
      <div className="absolute -bottom-20 left-40 w-72 h-72 bg-cyan-500/20 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000" />

      <div className="relative z-10 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-violet-300 via-fuchsia-300 to-cyan-300 flex items-center gap-2">
              <span className="text-4xl">📝</span> My Reviews
            </h1>
            <p className="text-white/60 mt-1">Manage your tutor reviews & feedback</p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-5 py-2.5 bg-white/10 backdrop-blur-md border border-white/20 rounded-full text-violet-300 font-semibold hover:bg-white/20 hover:text-white transition-all disabled:opacity-50 mt-4 sm:mt-0"
          >
            <svg
              className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
              fill="none" stroke="currentColor" viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            {refreshing ? "Refreshing..." : "Refresh"}
          </button>
        </div>

        {/* Error state */}
        {error && (
          <div className="mb-6 bg-rose-400/10 backdrop-blur-md border border-rose-400/40 text-rose-300 rounded-2xl p-4 flex items-center justify-between">
            <span className="font-medium">⚠️ {error}</span>
            <button
              onClick={() => fetchReviews()}
              className="px-4 py-1.5 bg-rose-400/20 hover:bg-rose-400/30 rounded-xl font-medium text-sm text-rose-200 transition"
            >
              Retry
            </button>
          </div>
        )}

        {/* Empty state */}
        {!error && reviews.length === 0 && !loading && (
          <div className="text-center py-20 bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 shadow-2xl">
            <div className="text-6xl mb-4">📝</div>
            <h2 className="text-2xl font-bold text-white">No reviews yet</h2>
            <p className="text-white/50 mt-2">
              Once you complete a session, you can review your tutor here.
            </p>
          </div>
        )}

        {/* Reviews Grid */}
        {reviews.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {reviews.map((review) => (
              <div
                key={review.review_id}
                className="group bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-xl hover:shadow-2xl hover:border-violet-400/40 transition-all duration-300 hover:-translate-y-1 flex flex-col"
              >
                {/* Tutor name & rating */}
                <div className="flex justify-between items-start mb-3">
                  <h2 className="text-lg font-bold text-white group-hover:text-violet-300 transition-colors">
                    👨‍🏫 {review.tutor_name ?? "Unknown Tutor"}
                  </h2>
                  <div className="flex items-center gap-1 bg-amber-400/20 backdrop-blur-md px-3 py-1 rounded-full border border-amber-400/40">
                    <span className="text-amber-300 font-bold text-sm">
                      ⭐ {review.rating}.0
                    </span>
                  </div>
                </div>

                {/* Feedback */}
                <p className="text-white/70 text-sm leading-relaxed flex-1">
                  {review.feedback?.trim() || "No feedback provided."}
                </p>

                {/* Date & Edit */}
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/10">
                  <span className="text-xs text-white/40">
                    {new Date(review.created_at).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                  <button
                    onClick={() => handleEdit(review)}
                    className="inline-flex items-center gap-1 px-4 py-1.5 bg-violet-500/20 text-violet-300 font-medium rounded-full text-sm border border-violet-400/30 hover:bg-violet-500/30 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                      />
                    </svg>
                    Edit
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {editingReview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-2xl">
            <h2 className="text-xl font-bold text-white mb-4">Edit Review</h2>

            <label className="block text-sm font-medium text-white/70 mb-2">Rating (1-5)</label>
            <div className="flex gap-2 mb-5">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setEditRating(star)}
                  className={`text-3xl transition-transform hover:scale-110 ${
                    editRating >= star ? "text-amber-300" : "text-white/20"
                  }`}
                >
                  ★
                </button>
              ))}
            </div>

            <label className="block text-sm font-medium text-white/70 mb-2">Feedback</label>
            <textarea
              className="w-full bg-gray-900/60 border-2 border-white/20 rounded-xl p-3 text-sm min-h-[100px] text-white placeholder-white/40 focus:outline-none focus:ring-4 focus:ring-violet-500/50 focus:border-violet-400"
              placeholder="Write your feedback..."
              value={editFeedback}
              onChange={(e) => setEditFeedback(e.target.value)}
            />

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setEditingReview(null)}
                className="flex-1 bg-white/10 hover:bg-white/20 text-white font-semibold py-2.5 rounded-xl transition-colors border border-white/20"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={updating}
                className="flex-1 bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:from-violet-600 hover:to-fuchsia-600 text-white font-bold py-2.5 rounded-xl disabled:opacity-60 shadow-lg shadow-violet-500/25 transition-all"
              >
                {updating ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}