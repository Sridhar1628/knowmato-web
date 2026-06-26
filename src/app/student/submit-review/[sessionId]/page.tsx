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
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 via-white to-indigo-50 p-4">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-xl">

        {/* Header */}

        <div className="mb-6 text-center">

          <div className="mb-3 text-5xl">
            ⭐
          </div>

          <h1 className="text-3xl font-bold text-slate-800">
            Rate Your Tutor
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Your feedback helps improve the learning experience.
          </p>

        </div>

        {/* Warning */}

        <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 p-4">

          <p className="text-center text-xs font-medium leading-5 text-amber-800">
            ⚠️ Your review affects tutor ratings, reputation, and payment.
            Please provide honest feedback.
          </p>

        </div>

        {/* Stars */}

        <div className="mb-8">

          <div className="mb-3 text-center text-sm font-semibold text-slate-700">
            Your Rating
          </div>

          <div className="flex justify-center gap-2">

            {[1, 2, 3, 4, 5].map((star) => (

              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                className={`
                  text-5xl
                  transition-all
                  duration-200
                  hover:scale-110
                  ${
                    rating >= star
                      ? "text-yellow-400"
                      : "text-slate-300"
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

          <label className="mb-2 block text-sm font-semibold text-slate-700">
            Feedback (Optional)
          </label>

          <textarea
            rows={5}
            placeholder="Share your experience with this tutor..."
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            className="
              w-full
              resize-none
              rounded-2xl
              border
              border-slate-200
              bg-white
              p-4
              text-sm
              text-slate-700
              outline-none
              transition-all
              focus:border-indigo-500
              focus:ring-4
              focus:ring-indigo-100
            "
          />

        </div>

        {/* Submit */}

        <button
          type="button"
          onClick={handleSubmit}
          disabled={submitting}
          className="
            flex
            w-full
            items-center
            justify-center
            rounded-2xl
            bg-gradient-to-r
            from-emerald-500
            to-green-600
            py-3.5
            text-sm
            font-bold
            text-white
            shadow-lg
            transition-all
            duration-300
            hover:-translate-y-0.5
            hover:shadow-xl
            disabled:cursor-not-allowed
            disabled:opacity-70
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