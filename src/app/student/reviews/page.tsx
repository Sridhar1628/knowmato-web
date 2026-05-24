"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { getMyReviews, updateReview, StudentReview } from "@/services/reviewService";
import { getTokens } from "@/services/storageService";
import { WS_BASE_URL } from "@/config/env";
import toast from "react-hot-toast";

export default function StudentReviewsPage() {
  const router = useRouter();
  const [reviews, setReviews] = useState<StudentReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Edit modal state
  const [editingReview, setEditingReview] = useState<StudentReview | null>(null);
  const [editRating, setEditRating] = useState(5);
  const [editFeedback, setEditFeedback] = useState("");
  const [updating, setUpdating] = useState(false);

  // WebSocket ref
  const wsRef = useRef<WebSocket | null>(null);

  // Fetch reviews
  const fetchReviews = useCallback(async () => {
    try {
      const data = await getMyReviews();
      setReviews(data);
    } catch (error: any) {
      toast.error(error?.message || "Failed to load reviews.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Real-time WebSocket connection
  useEffect(() => {
    const connectWs = async () => {
      const tokens = await getTokens();
      if (!tokens?.access) return;

      const payload = JSON.parse(atob(tokens.access.split(".")[1]));
      const userId = payload.user_id;

      const ws = new WebSocket(
        `${WS_BASE_URL}/ws/user/${userId}/?token=${tokens.access}`
      );
      wsRef.current = ws;

      ws.onopen = () => console.log("🔥 REVIEW WS CONNECTED");

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        console.log("📩 REVIEW WS:", data);

        if (!data?.event) return;

        if (data.event === "REVIEW_ADDED") {
          setReviews((prev) => {
            const exists = prev.find((r) => r.review_id === data.data.review_id);
            return exists ? prev : [data.data, ...prev];
          });
        }

        if (data.event === "REVIEW_UPDATED") {
          setReviews((prev) =>
            prev.map((r) =>
              r.review_id === data.data.review_id ? data.data : r
            )
          );
        }
      };

      ws.onclose = () => console.log("REVIEW WS CLOSED");
    };

    connectWs();

    return () => {
      wsRef.current?.close();
    };
  }, []);

  // Initial load + focus effect (refetch on mount)
  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  // Refresh pull-down
  const handleRefresh = () => {
    setRefreshing(true);
    fetchReviews();
  };

  // Open edit modal
  const handleUpdateReview = (review: StudentReview) => {
    setEditingReview(review);
    setEditRating(review.rating);
    setEditFeedback(review.feedback);
  };

  // Submit update
  const submitUpdate = async () => {
    if (!editingReview) return;
    setUpdating(true);
    try {
      await updateReview(editingReview.review_id, {
        rating: editRating,
        feedback: editFeedback,
      });

      // Instant UI update
      setReviews((prev) =>
        prev.map((r) =>
          r.review_id === editingReview.review_id
            ? { ...r, rating: editRating, feedback: editFeedback }
            : r
        )
      );

      toast.success("Review updated successfully.");
      setEditingReview(null);
    } catch (error: any) {
      toast.error(error?.response?.data?.error || "Update failed.");
    } finally {
      setUpdating(false);
    }
  };

  if (loading && !refreshing) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
          <p className="mt-4 text-gray-600">Loading reviews...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4 sm:p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">📝 My Reviews</h1>

        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-2 mb-4 text-sm text-indigo-600 hover:text-indigo-800 disabled:opacity-50"
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

        {reviews.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">📝</div>
            <h2 className="text-lg font-bold text-gray-700">No reviews yet</h2>
            <p className="text-gray-500">After completing a session, you can review your tutor.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {reviews.map((review) => (
              <div
                key={review.review_id}
                className="bg-white rounded-2xl p-5 shadow-sm border border-gray-200"
              >
                <div className="flex justify-between items-start mb-2">
                  <span className="text-lg font-semibold text-gray-800">
                    👨‍🏫 {review.tutor_name}
                  </span>
                  <span className="text-yellow-600 font-bold">⭐ {review.rating}.0</span>
                </div>
                <p className="text-gray-600 mb-2">{review.feedback || "No feedback provided."}</p>
                <p className="text-xs text-gray-400 mb-3">
                  {new Date(review.created_at).toLocaleDateString()}
                </p>
                <button
                  onClick={() => handleUpdateReview(review)}
                  className="bg-indigo-50 text-indigo-700 font-semibold px-4 py-1.5 rounded-full text-sm hover:bg-indigo-100 transition"
                >
                  Edit Review
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Edit Review Modal */}
        {editingReview && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white w-full max-w-md mx-4 rounded-2xl p-6">
              <h2 className="text-xl font-bold mb-4">Edit Review</h2>

              <label className="block mb-2 text-sm font-medium">Rating (1-5)</label>
              <div className="flex gap-2 mb-4">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setEditRating(star)}
                    className={`text-3xl ${editRating >= star ? "text-yellow-500" : "text-gray-300"}`}
                  >
                    ★
                  </button>
                ))}
              </div>

              <label className="block mb-2 text-sm font-medium">Feedback</label>
              <textarea
                className="w-full border border-gray-200 rounded-xl p-3 text-sm min-h-[100px]"
                placeholder="Write your feedback..."
                value={editFeedback}
                onChange={(e) => setEditFeedback(e.target.value)}
              />

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setEditingReview(null)}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-2 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  onClick={submitUpdate}
                  disabled={updating}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 rounded-xl disabled:opacity-70"
                >
                  {updating ? "Saving..." : "Save"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}