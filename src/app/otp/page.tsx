'use client';

import { useEffect, useState, useRef, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import toast, { Toaster } from 'react-hot-toast';
import { verifyOtpLogin, resendOtp } from '@/services/authService';
import { saveTokens } from '@/services/storageService';
import { useDispatch } from 'react-redux';
import { loginSuccess } from '@/redux/slices/authSlice';
import { getProfile } from '@/services/userService';
import { connectSocket } from '@/services/socketService';

const OTP_LENGTH = 6;

// Helper: show error/success toasts
const showError = (message: string) => toast.error(message);
const showSuccess = (message: string) => toast.success(message);

function OTPContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const dispatch = useDispatch();

  const identifier = searchParams.get('identifier') || '';

  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(30);
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Entrance animations (using framer-motion)


  // Timer countdown and progress
  useEffect(() => {
    if (timer > 0) {
      timerIntervalRef.current = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    } else if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
    }
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [timer]);

  // Auto-focus first input on mount
  useEffect(() => {
    setTimeout(() => {
      inputRefs.current[0]?.focus();
    }, 100);
  }, []);

  // Handle OTP change for individual box
  const handleOtpChange = (value: string, index: number) => {
    // If pasting multiple digits
    if (value.length > 1) {
      const digits = value.slice(0, OTP_LENGTH).split('');
      const newOtp = [...otp];
      for (let i = 0; i < OTP_LENGTH; i++) {
        newOtp[i] = digits[i] || '';
      }
      setOtp(newOtp);
      // Focus last filled or next empty
      const lastFilledIndex = newOtp.findIndex((v) => v === '');
      if (lastFilledIndex === -1) {
        inputRefs.current[OTP_LENGTH - 1]?.focus();
        handleVerifyOtp(newOtp.join(''));
      } else {
        inputRefs.current[lastFilledIndex]?.focus();
      }
      return;
    }

    // Single digit input
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit if all fields filled
    const otpValue = newOtp.join('');
    if (otpValue.length === OTP_LENGTH) {
      handleVerifyOtp(otpValue);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleFocus = (index: number) => setFocusedIndex(index);
  const handleBlur = () => setFocusedIndex(null);

  // Shake animation on error
  const [shake, setShake] = useState(false);
  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 300);
  };

  const handleVerifyOtp = async (otpValue: string) => {
    if (otpValue.length !== OTP_LENGTH) {
      showError('Please enter the complete 6-digit code.');
      triggerShake();
      return;
    }

    setLoading(true);
    try {
      const res = await verifyOtpLogin({ identifier, otp: otpValue });

      // Save tokens
      saveTokens(res.access, res.refresh);

      // Fetch user profile
      const profileRes = await getProfile();
      const profile = profileRes.data;

      // Update Redux store
      dispatch(
        loginSuccess({
          access: res.access,
          refresh: res.refresh,
          user: profile,
        })
      );

      // Connect WebSocket
      connectSocket(profile.id, res.access);

      showSuccess('Login successful!');
      router.push('/');
    } catch (error: any) {
      const errorMsg = error?.response?.data?.error || error?.message || 'Invalid OTP. Please try again.';
      showError(errorMsg);
      triggerShake();
      // Clear OTP fields
      setOtp(Array(OTP_LENGTH).fill(''));
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (timer > 0) return;
    try {
      await resendOtp({ identifier });
      setTimer(30);
      showSuccess('OTP resent successfully!');
      setOtp(Array(OTP_LENGTH).fill(''));
      inputRefs.current[0]?.focus();
    } catch (error: any) {
      showError(error?.response?.data?.error || 'Failed to resend OTP.');
    }
  };

  return (
    <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-gradient-to-br from-[#F9F7FE] via-white to-[#F0F4FF] px-4">
      <Toaster position="bottom-center" />

      {/* Floating Emojis with Animation */}
      <motion.div
        className="absolute left-[10%] top-[12%] text-4xl opacity-25"
        animate={{
          y: [0, -15, 0],
        }}
        transition={{
          repeat: Infinity,
          duration: 15,
          ease: "easeInOut",
        }}
      >
        📨
      </motion.div>
      <motion.div
        className="absolute left-[10%] top-[12%] text-4xl opacity-25"
        animate={{
          y: [0, -15, 0],
        }}
        transition={{
          repeat: Infinity,
          duration: 15,
          ease: "easeInOut",
        }}
      >
        🔐
      </motion.div>

      {/* Main Card */}
      <motion.div
        className="w-full max-w-md rounded-3xl bg-white p-8 shadow-xl shadow-indigo-100/50"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          duration: 0.5,
          ease: "easeOut",
        }}
        style={shake ? { animation: 'shake 0.3s ease-in-out 0s 1' } : {}}
      >
        {/* Animated Emoji */}
        <motion.div
          className="mb-4 text-center text-5xl"
          animate={{
            rotate: [0, 10, 0, -10, 0],
          }}
          transition={{
            repeat: Infinity,
            duration: 2,
            ease: "easeInOut",
          }}
        >
          ⚡
        </motion.div>

        <h1 className="mb-2 text-center text-3xl font-extrabold text-gray-800">
          Verification Code
        </h1>
        <p className="mb-8 text-center text-gray-500">
          We've sent a 6-digit code to<br />
          <span className="font-bold text-indigo-600">{identifier || 'your device'}</span>
        </p>

        {/* OTP Input Boxes */}
        <div className="mb-6 flex justify-between gap-2">
          {Array(OTP_LENGTH)
            .fill(0)
            .map((_, idx) => (
              <input
                key={idx}
                ref={(el) => {
                  inputRefs.current[idx] = el;
                }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={otp[idx]}
                onChange={(e) => handleOtpChange(e.target.value, idx)}
                onKeyDown={(e) => handleKeyDown(e, idx)}
                onFocus={() => handleFocus(idx)}
                onBlur={handleBlur}
                disabled={loading}
                className={`h-14 w-14 rounded-xl border-2 text-center text-2xl font-bold text-gray-800 transition-all focus:outline-none ${
                  focusedIndex === idx
                    ? 'border-indigo-500 bg-white shadow-md shadow-indigo-200'
                    : otp[idx]
                    ? 'border-indigo-300 bg-indigo-50'
                    : 'border-gray-200 bg-gray-50'
                }`}
              />
            ))}
        </div>

        {/* Timer Progress Bar */}
        {timer > 0 && (
          <div className="relative mb-4 h-1 w-full overflow-hidden rounded-full bg-gray-100">
            <div
              className="h-full rounded-full bg-indigo-500 transition-all duration-1000 ease-linear"
              style={{ width: `${(timer / 30) * 100}%` }}
            />
            <div className="mt-1 text-right text-xs text-gray-400">⏳ {timer}s</div>
          </div>
        )}

        {/* Verify Button */}
        <button
          onClick={() => handleVerifyOtp(otp.join(''))}
          disabled={loading || otp.join('').length !== OTP_LENGTH}
          className={`relative mb-5 w-full overflow-hidden rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 py-4 font-bold text-white shadow-lg transition-all hover:shadow-xl ${
            loading || otp.join('').length !== OTP_LENGTH ? 'opacity-60' : 'hover:scale-[1.02]'
          }`}
        >
          {loading ? (
            <div className="flex items-center justify-center gap-2">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
              <span>Verifying...</span>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-2">
              <span>Verify & Continue</span>
              <span>🚀</span>
            </div>
          )}
        </button>

        {/* Resend Section */}
        <div className="mb-4 text-center">
          <span className="text-gray-500">Didn't receive code? </span>
          <button
            onClick={handleResend}
            disabled={timer > 0}
            className={`font-semibold ${
              timer > 0 ? 'cursor-not-allowed text-gray-400' : 'text-indigo-600 hover:underline'
            }`}
          >
            {timer > 0 ? `Resend in ${timer}s` : 'Resend OTP'}
          </button>
        </div>

        {/* Back to Login */}
        <div className="text-center">
          <button
            onClick={() => router.back()}
            disabled={loading}
            className="text-gray-500 transition hover:text-gray-700"
          >
            ← Back to Login
          </button>
        </div>
      </motion.div>

      {/* Custom shake animation */}
      <style jsx>{`
        @keyframes shake {
          0% {
            transform: translateX(0);
          }
          25% {
            transform: translateX(-5px);
          }
          75% {
            transform: translateX(5px);
          }
          100% {
            transform: translateX(0);
          }
        }
      `}</style>
    </div>
  );
}

export default function OTPPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <OTPContent />
    </Suspense>
  );
}