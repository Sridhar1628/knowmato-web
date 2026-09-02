"use client";

import { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import { submitReview } from "@/services/reviewService";
import AlertService from "@/services/alertService";

export default function SubmitReviewPage() {
  const router = useRouter();
  const params = useParams();

  // ------------------------------------
  // Session Id
  // ------------------------------------
  const sessionId = useMemo(() => {
    const value = params?.sessionId;

    if (Array.isArray(value)) {
      return Number(value[0]);
    }

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

    // ------------------------------------
    // Validate session
    // ------------------------------------
    if (!sessionId || Number.isNaN(sessionId)) {
      AlertService.error(
        "Invalid Session",
        "The review session is invalid. Please try again.",
      );
      return;
    }

    // ------------------------------------
    // Validate rating
    // ------------------------------------
    if (rating < 1 || rating > 5) {
      AlertService.warning(
        "Rating Required",
        "Please select a rating between 1 and 5 stars.",
        [],
      );
      return;
    }

    setSubmitting(true);

    try {
      // ------------------------------------
      // Submit review
      // ------------------------------------
      await submitReview(sessionId, {
        rating,
        feedback: feedback.trim(),
      });

      // ------------------------------------
      // Success
      // ------------------------------------
      AlertService.success(
        "Review Submitted",
        "Your review has been submitted successfully!",
      );

      // Give the success alert a moment before navigating.
      setTimeout(() => {
        router.replace("/student/reviews");
      }, 1200);
    } catch (error: any) {
      console.error("Submit review error:", error);

      const errorMessage =
        error?.response?.data?.error ||
        error?.response?.data?.message ||
        error?.message ||
        "Failed to submit review. Please try again.";

      AlertService.error(
        "Review Submission Failed",
        errorMessage,
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
      <div className="absolute top-0 -left-20 h-72 w-72 rounded-full bg-purple-500/20 mix-blend-multiply blur-3xl filter animate-blob" />

      <div className="absolute top-0 -right-20 h-72 w-72 rounded-full bg-fuchsia-500/20 mix-blend-multiply blur-3xl filter animate-blob animation-delay-2000" />

      <div className="absolute -bottom-20 left-40 h-72 w-72 rounded-full bg-cyan-500/20 mix-blend-multiply blur-3xl filter animate-blob animation-delay-4000" />

      {/* Main card */}
      <div className="relative z-10 w-full max-w-md rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur-xl">
        {/* Header */}
        <div className="mb-6 text-center">
          <div className="mb-3 text-5xl">⭐</div>

          <h1 className="bg-gradient-to-r from-violet-300 to-fuchsia-300 bg-clip-text text-3xl font-bold text-transparent">
            Rate Your Tutor
          </h1>

          <p className="mt-2 text-sm text-white/60">
            Your feedback helps improve the learning experience.
          </p>
        </div>

        {/* Warning */}
        <div className="mb-6 rounded-2xl border border-amber-400/30 bg-amber-400/10 p-4 backdrop-blur-md">
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
                disabled={submitting}
                aria-label={`Rate ${star} out of 5`}
                aria-pressed={rating === star}
                className={`
                  text-5xl transition-all duration-200
                  hover:scale-110
                  disabled:cursor-not-allowed
                  disabled:opacity-70
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

          <p className="mt-3 text-center text-sm font-semibold text-amber-300">
            {rating} / 5
          </p>
        </div>

        {/* Feedback */}
        <div className="mb-8">
          <label
            htmlFor="feedback"
            className="mb-2 block text-sm font-semibold text-white/80"
          >
            Feedback (Optional)
          </label>

          <textarea
            id="feedback"
            rows={5}
            maxLength={1000}
            placeholder="Share your experience with this tutor..."
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            disabled={submitting}
            className="
              w-full resize-none rounded-2xl border-2 border-white/20
              bg-gray-900/60 p-4 text-sm text-white
              placeholder-white/40 outline-none backdrop-blur-sm
              transition-all
              focus:border-violet-400
              focus:ring-4
              focus:ring-violet-500/50
              disabled:cursor-not-allowed
              disabled:opacity-60
            "
          />

          <div className="mt-1 text-right text-xs text-white/40">
            {feedback.length}/1000
          </div>
        </div>

        {/* Submit */}
        <button
          type="button"
          onClick={handleSubmit}
          disabled={submitting}
          className="
            flex w-full items-center justify-center
            rounded-2xl
            bg-gradient-to-r from-violet-500 to-fuchsia-500
            py-3.5
            text-sm font-bold text-white
            shadow-lg shadow-violet-500/25
            transition-all duration-300
            hover:-translate-y-0.5
            hover:from-violet-600
            hover:to-fuchsia-600
            hover:shadow-xl
            active:scale-[0.98]
            disabled:cursor-not-allowed
            disabled:opacity-70
            disabled:hover:translate-y-0
            disabled:hover:from-violet-500
            disabled:hover:to-fuchsia-500
          "
        >
          {submitting ? (
            <div className="flex items-center gap-2">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
              <span>Submitting...</span>
            </div>
          ) : (
            <span>Submit Review</span>
          )}
        </button>
      </div>
    </div>
  );
}