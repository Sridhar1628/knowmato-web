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
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
          <p className="mt-4 text-gray-700 font-medium">Loading reviews...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-800 flex items-center gap-2">
              <span className="text-4xl">📝</span> My Reviews
            </h1>
            <p className="text-gray-500 mt-1">Manage your tutor reviews & feedback</p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-5 py-2.5 bg-white rounded-full shadow-sm border border-gray-200 text-indigo-600 font-semibold hover:bg-indigo-50 transition-all disabled:opacity-50 mt-4 sm:mt-0"
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
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 rounded-2xl p-4 flex items-center justify-between">
            <span>⚠️ {error}</span>
            <button
              onClick={() => fetchReviews()}
              className="px-4 py-1.5 bg-red-100 hover:bg-red-200 rounded-xl font-medium text-sm transition"
            >
              Retry
            </button>
          </div>
        )}

        {/* Empty state */}
        {!error && reviews.length === 0 && !loading && (
          <div className="text-center py-20 bg-white/50 backdrop-blur-sm rounded-2xl border border-white/60 shadow-sm">
            <div className="text-6xl mb-4">📝</div>
            <h2 className="text-2xl font-bold text-gray-700">No reviews yet</h2>
            <p className="text-gray-500 mt-2">
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
                className="group bg-white rounded-2xl p-6 shadow-md hover:shadow-xl hover:shadow-indigo-100/50 border border-gray-100 hover:border-indigo-200 transition-all duration-300 hover:-translate-y-1 flex flex-col"
              >
                {/* Tutor name & rating */}
                <div className="flex justify-between items-start mb-3">
                  <h2 className="text-lg font-bold text-gray-800 group-hover:text-indigo-700 transition-colors">
                    👨‍🏫 {review.tutor_name ?? "Unknown Tutor"}
                  </h2>
                  <div className="flex items-center gap-1 bg-yellow-50 px-3 py-1 rounded-full border border-yellow-200">
                    <span className="text-yellow-600 font-bold text-sm">
                      ⭐ {review.rating}.0
                    </span>
                  </div>
                </div>

                {/* Feedback */}
                <p className="text-gray-600 text-sm leading-relaxed flex-1">
                  {review.feedback?.trim() || "No feedback provided."}
                </p>

                {/* Date & Edit */}
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                  <span className="text-xs text-gray-400">
                    {new Date(review.created_at).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                  <button
                    onClick={() => handleEdit(review)}
                    className="inline-flex items-center gap-1 px-4 py-1.5 bg-indigo-50 text-indigo-700 font-medium rounded-full text-sm hover:bg-indigo-100 active:bg-indigo-200 transition-colors"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-md rounded-2xl p-6 shadow-2xl">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Edit Review</h2>

            <label className="block text-sm font-medium text-gray-700 mb-2">Rating (1-5)</label>
            <div className="flex gap-2 mb-5">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setEditRating(star)}
                  className={`text-3xl transition-transform hover:scale-110 ${
                    editRating >= star ? "text-yellow-500" : "text-gray-300"
                  }`}
                >
                  ★
                </button>
              ))}
            </div>

            <label className="block text-sm font-medium text-gray-700 mb-2">Feedback</label>
            <textarea
              className="w-full border border-gray-200 rounded-xl p-3 text-sm min-h-[100px] focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-gray-50 text-gray-800"
              placeholder="Write your feedback..."
              value={editFeedback}
              onChange={(e) => setEditFeedback(e.target.value)}
            />

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setEditingReview(null)}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-2.5 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={updating}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-semibold py-2.5 rounded-xl disabled:opacity-70 transition-colors"
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