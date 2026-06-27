"use client";

import { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import toast from "react-hot-toast";

import { submitReview } from "@/services/reviewService";

export default function SubmitReviewPage() {
  const router = useRouter();
  const params = useParams();

  // ------------------------------------
  // Session Id
  // ------------------------------------
  const sessionId = useMemo(() => {
    const value = params?.sessionId;
    if (Array.isArray(value)) return Number(value[0]);
    return Number(value);
  }, [params]);

  // ------------------------------------
  // State
  // ------------------------------------
  const [rating, setRating] = useState(5);
  const [feedback, setFeedback] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // ------------------------------------
  // Submit
  // ------------------------------------
  const handleSubmit = async () => {
    if (submitting) return;
    if (!sessionId || Number.isNaN(sessionId)) {
      toast.error("Invalid session.");
      return;
    }

    setSubmitting(true);
    try {
      await submitReview(sessionId, {
        rating,
        feedback: feedback.trim(),
      });
      toast.success("Review submitted successfully!");
      router.replace("/student/reviews");
    } catch (error: any) {
      console.error(error);
      toast.error(
        error?.response?.data?.error ||
          error?.response?.data?.message ||
          "Failed to submit review."
      );
    } finally {
      setSubmitting(false);
    }
  };

  // ------------------------------------
  // UI
  // ------------------------------------
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e] p-4">
      {/* Animated blobs */}
      <div className="absolute top-0 -left-20 w-72 h-72 bg-purple-500/20 rounded-full mix-blend-multiply filter blur-3xl animate-blob" />
      <div className="absolute top-0 -right-20 w-72 h-72 bg-fuchsia-500/20 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000" />
      <div className="absolute -bottom-20 left-40 w-72 h-72 bg-cyan-500/20 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000" />

      <div className="relative z-10 w-full max-w-md rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-8 shadow-2xl">
        {/* Header */}
        <div className="mb-6 text-center">
          <div className="mb-3 text-5xl">⭐</div>
          <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-violet-300 to-fuchsia-300">
            Rate Your Tutor
          </h1>
          <p className="mt-2 text-sm text-white/60">
            Your feedback helps improve the learning experience.
          </p>
        </div>

        {/* Warning */}
        <div className="mb-6 rounded-2xl border border-amber-400/30 bg-amber-400/10 backdrop-blur-md p-4">
          <p className="text-center text-xs font-medium leading-5 text-amber-300/90">
            ⚠️ Your review affects tutor ratings, reputation, and payment.
            Please provide honest feedback.
          </p>
        </div>

        {/* Stars */}
        <div className="mb-8">
          <div className="mb-3 text-center text-sm font-semibold text-white/80">
            Your Rating
          </div>
          <div className="flex justify-center gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                className={`
                  text-5xl transition-all duration-200 hover:scale-110
                  ${
                    rating >= star
                      ? "text-amber-300 drop-shadow-[0_0_8px_rgba(251,191,36,0.6)]"
                      : "text-white/30"
                  }
                `}
              >
                ★
              </button>
            ))}
          </div>
        </div>

        {/* Feedback */}
        <div className="mb-8">
          <label className="mb-2 block text-sm font-semibold text-white/80">
            Feedback (Optional)
          </label>
          <textarea
            rows={5}
            placeholder="Share your experience with this tutor..."
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            className="
              w-full resize-none rounded-2xl border-2 border-white/20 bg-gray-900/60
              p-4 text-sm text-white placeholder-white/40
              outline-none backdrop-blur-sm transition-all
              focus:border-violet-400 focus:ring-4 focus:ring-violet-500/50
            "
          />
        </div>

        {/* Submit */}
        <button
          type="button"
          onClick={handleSubmit}
          disabled={submitting}
          className="
            flex w-full items-center justify-center rounded-2xl
            bg-gradient-to-r from-violet-500 to-fuchsia-500
            py-3.5 text-sm font-bold text-white
            shadow-lg shadow-violet-500/25 transition-all duration-300
            hover:-translate-y-0.5 hover:shadow-xl hover:from-violet-600 hover:to-fuchsia-600
            disabled:cursor-not-allowed disabled:opacity-70
          "
        >
          {submitting ? (
            <div className="flex items-center gap-2">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
              <span>Submitting...</span>
            </div>
          ) : (
            "Submit Review"
          )}
        </button>
      </div>
    </div>
  );
}