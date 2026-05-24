"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { submitReview } from "@/services/reviewService";
import toast from "react-hot-toast";

export default function SubmitReviewPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionIdParam = searchParams.get("sessionId");
  const sessionId = sessionIdParam ? Number(sessionIdParam) : 0;

  const [rating, setRating] = useState(5);
  const [feedback, setFeedback] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await submitReview(sessionId, { rating, feedback });
      toast.success("Review submitted!");
      // Redirect to review list; we can just navigate back or to the list
      router.push("/student/reviews");
    } catch (error: any) {
      toast.error(error?.response?.data?.error || "Submission failed.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-md">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Rate Your Tutor</h1>
        <p className="text-xs text-amber-800 bg-amber-50 p-2 rounded-lg mb-6 text-center">
          ⚠️ Your rating directly affects tutor payment and their reputation.
        </p>

        <div className="flex gap-2 justify-center mb-6">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              onClick={() => setRating(star)}
              className={`text-4xl transition ${rating >= star ? "text-yellow-500" : "text-gray-300"}`}
            >
              ★
            </button>
          ))}
        </div>

        <textarea
          className="w-full border border-gray-200 rounded-xl p-3 text-sm min-h-[120px] mb-6"
          placeholder="Share your experience (optional)"
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
        />

        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3 rounded-full disabled:opacity-70 transition"
        >
          {submitting ? "Submitting..." : "Submit Review"}
        </button>
      </div>
    </div>
  );
}