'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Lottie from 'lottie-react';
import { submitReview } from '@/services/reviewService';
import { getSessionDetails } from '@/services/sessionService';

// ============================================
// Types
// ============================================
interface SessionDetails {
  session_id: number;
  session_type: string;
  doubt: {
    id: number;
    title: string;
    description: string;
    preferred_type: string;
  };
  student: {
    id: number;
    name: string;
  };
  tutor: {
    id: number;
    name: string;
  };
  status: string;
  price: number;
  is_paid: boolean;
  scheduled_at: string;
  started_at: string | null;
  ended_at: string | null;
  student_joined: boolean;
  tutor_joined: boolean;
  your_role: string;
}

// ============================================
// Helper Functions
// ============================================
const formatDate = (dateString: string | null) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

// Simple checkmark animation (fallback if Lottie fails)
const SuccessCheckmark = () => (
  <svg className="w-24 h-24 mx-auto" viewBox="0 0 52 52">
    <circle className="stroke-green-500 stroke-2 fill-none" cx="26" cy="26" r="25" strokeDasharray="166" strokeDashoffset="166">
      <animate attributeName="stroke-dashoffset" from="166" to="0" dur="0.8s" fill="freeze" />
    </circle>
    <path className="stroke-green-500 stroke-2 fill-none" d="M14.1 27.2l7.1 7.2 16.7-16.8" strokeDasharray="50" strokeDashoffset="50">
      <animate attributeName="stroke-dashoffset" from="50" to="0" dur="0.5s" begin="0.8s" fill="freeze" />
    </path>
  </svg>
);

// ============================================
// Star Rating Component
// ============================================
const StarRating = ({ rating, onRatingChange }: { rating: number; onRatingChange: (val: number) => void }) => {
  const [hover, setHover] = useState(0);
  const starRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const handleClick = (val: number) => {
    onRatingChange(val);
    // Simple scale animation via CSS class
    const btn = starRefs.current[val - 1];
    if (btn) {
      btn.classList.add('scale-150');
      setTimeout(() => btn.classList.remove('scale-150'), 150);
    }
  };

  return (
    <div className="flex justify-center gap-2 my-2">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          ref={(el) => { starRefs.current[star - 1] = el; }}
          onClick={() => handleClick(star)}
          onMouseEnter={() => setHover(star)}
          onMouseLeave={() => setHover(0)}
          className="text-6xl transition-transform duration-100 focus:outline-none"
        >
          <span className={star <= (hover || rating) ? 'text-amber-400 drop-shadow-md' : 'text-gray-300'}>
            ★
          </span>
        </button>
      ))}
    </div>
  );
};

// ============================================
// Main Component
// ============================================
export default function SubmitReviewPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('sessionId');

  const [sessionDetails, setSessionDetails] = useState<SessionDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Fetch session details
  useEffect(() => {
    if (!sessionId) {
      alert('No session ID provided');
      router.back();
      return;
    }
    fetchSessionDetails();
  }, [sessionId]);

  const fetchSessionDetails = async () => {
    try {
      const response = await getSessionDetails(Number(sessionId));
      // Handle both wrapped and direct responses
      const sessionData = response?.data?.data || response?.data || response;
      setSessionDetails(sessionData);
    } catch (error: any) {
      console.error('Error fetching session details:', error);
      alert(error?.response?.data?.message || 'Could not load session details.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!rating) {
      alert('Please select a rating before submitting.');
      return;
    }
    setSubmitting(true);
    try {
      await submitReview(Number(sessionId), { rating, feedback: feedback.trim() });
      setShowSuccess(true);
      setTimeout(() => {
        router.push('/student/my-doubts');
      }, 2000);
    } catch (error: any) {
      const msg = error?.response?.data?.error || 'Failed to submit review. Please try again.';
      alert(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const ratingText = () => {
    if (rating === 1) return '😞 Poor';
    if (rating === 2) return '🙁 Fair';
    if (rating === 3) return '😐 Good';
    if (rating === 4) return '😊 Very Good';
    if (rating === 5) return '🤩 Excellent!';
    return '';
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
          <p className="mt-3 text-gray-600">Loading session details...</p>
        </div>
      </div>
    );
  }

  if (!sessionDetails) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-4">
        <div className="text-6xl mb-3">😞</div>
        <p className="text-gray-600 mb-4">Could not load session info.</p>
        <button
          onClick={fetchSessionDetails}
          className="rounded-full bg-indigo-600 px-5 py-2 text-white font-semibold hover:bg-indigo-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-gray-50 overflow-hidden">
      {/* Animated Gradient Background */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 opacity-90" />
      
      <div className="flex min-h-screen items-center justify-center px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-lg rounded-3xl bg-white shadow-2xl overflow-hidden"
        >
          <div className="p-6 sm:p-8">
            {/* Header */}
            <div className="text-center mb-6">
              <div className="text-5xl mb-2">⭐</div>
              <h1 className="text-3xl font-extrabold text-gray-800">Rate Your Session</h1>
              <p className="text-gray-500 mt-1">Your feedback helps us improve</p>
            </div>

            {/* Session Info Card */}
            <div className="bg-gray-50 rounded-2xl p-4 mb-6 border border-gray-200">
              <div className="flex flex-col gap-2 text-sm">
                <div className="flex">
                  <span className="w-24 font-semibold text-gray-600">📘 Doubt:</span>
                  <span className="flex-1 text-gray-800 font-medium line-clamp-2">{sessionDetails.doubt?.title || 'Unknown'}</span>
                </div>
                <div className="flex">
                  <span className="w-24 font-semibold text-gray-600">👨‍🏫 Tutor:</span>
                  <span className="flex-1 text-gray-800">{sessionDetails.tutor?.name || 'N/A'}</span>
                </div>
                <div className="flex">
                  <span className="w-24 font-semibold text-gray-600">💰 Price:</span>
                  <span className="flex-1 text-gray-800">₹{sessionDetails.price}</span>
                </div>
                <div className="flex">
                  <span className="w-24 font-semibold text-gray-600">📅 Completed:</span>
                  <span className="flex-1 text-gray-800">{formatDate(sessionDetails.ended_at)}</span>
                </div>
              </div>
            </div>

            {/* Star Rating */}
            <div className="mb-6 text-center">
              <label className="block font-semibold text-gray-700 mb-2 text-left">Your Rating</label>
              <StarRating rating={rating} onRatingChange={setRating} />
              {rating > 0 && (
                <p className="text-indigo-600 font-semibold mt-2">{ratingText()}</p>
              )}
            </div>

            {/* Feedback Textarea */}
            <div className="mb-8">
              <label className="block font-semibold text-gray-700 mb-2">Write Feedback (Optional)</label>
              <textarea
                rows={4}
                placeholder="Share your experience... What did you like? Any suggestions?"
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                className="w-full rounded-2xl border border-gray-300 px-4 py-3 text-gray-800 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none"
              />
            </div>

            {/* Submit Button */}
            <button
              onClick={handleSubmit}
              disabled={!rating || submitting}
              className={`w-full rounded-full py-3 font-bold text-white transition ${
                !rating || submitting
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-green-600 hover:bg-green-700 shadow-md'
              }`}
            >
              {submitting ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Submitting...
                </div>
              ) : (
                'Submit Review'
              )}
            </button>
          </div>
        </motion.div>
      </div>

      {/* Success Overlay */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="bg-white rounded-3xl p-8 text-center max-w-sm mx-4 shadow-2xl"
            >
              <div className="w-28 h-28 mx-auto">
                <SuccessCheckmark />
              </div>
              <h2 className="text-2xl font-bold text-green-600 mt-4">Thank You!</h2>
              <p className="text-gray-600 mt-2">Your review has been submitted.</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}