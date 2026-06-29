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
      saveTokens(res.access, res.refresh);

      const profileRes = await getProfile();
      const profile = profileRes.data;

      dispatch(
        loginSuccess({
          access: res.access,
          refresh: res.refresh,
          user: profile,
        })
      );

      connectSocket(profile.id, res.access);
      showSuccess('Login successful!');
      router.push('/');
    } catch (error: any) {
      const errorMsg = error?.response?.data?.error || error?.message || 'Invalid OTP. Please try again.';
      showError(errorMsg);
      triggerShake();
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
    <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e] px-4">
      <Toaster
        position="bottom-center"
        toastOptions={{
          style: {
            background: '#1e1b4b',
            color: '#fff',
            border: '1px solid rgba(255,255,255,0.1)',
            backdropFilter: 'blur(8px)',
          },
        }}
      />

      {/* Animated background blobs */}
      <div className="absolute top-0 -left-20 w-72 h-72 bg-purple-500/20 rounded-full mix-blend-multiply filter blur-3xl animate-blob" />
      <div className="absolute top-0 -right-20 w-72 h-72 bg-fuchsia-500/20 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000" />
      <div className="absolute -bottom-20 left-40 w-72 h-72 bg-cyan-500/20 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000" />

      {/* Floating Emojis with Animation */}
      <motion.div
        className="absolute left-[10%] top-[15%] text-4xl opacity-30"
        animate={{ y: [0, -15, 0] }}
        transition={{ repeat: Infinity, duration: 15, ease: "easeInOut" }}
      >
        📨
      </motion.div>
      <motion.div
        className="absolute right-[10%] bottom-[15%] text-4xl opacity-30"
        animate={{ y: [0, -15, 0] }}
        transition={{ repeat: Infinity, duration: 12, ease: "easeInOut", delay: 2 }}
      >
        🔐
      </motion.div>

      {/* Main Card */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={shake ? { x: [0, -5, 5, -5, 5, 0] } : { opacity: 1, y: 0 }}
        transition={shake ? { duration: 0.3 } : { duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-md rounded-3xl bg-white/5 backdrop-blur-xl border border-white/10 p-8 shadow-2xl relative z-10"
      >
        {/* Animated Emoji */}
        <motion.div
          className="mb-6 text-center text-5xl"
          animate={{ rotate: [0, 10, 0, -10, 0] }}
          transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
        >
          ⚡
        </motion.div>

        <h1 className="mb-2 text-center text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-violet-300 via-fuchsia-300 to-cyan-300">
          Verification Code
        </h1>
        <p className="mb-8 text-center text-white/70">
          We've sent a 6-digit code to<br />
          <span className="font-bold text-violet-300">{identifier || 'your device'}</span>
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
                className={`h-14 w-14 rounded-xl border-2 text-center text-2xl font-bold text-white transition-all focus:outline-none ${
                  focusedIndex === idx
                    ? 'border-violet-400 bg-white/10 shadow-lg shadow-violet-500/20'
                    : otp[idx]
                    ? 'border-violet-400/40 bg-violet-400/10'
                    : 'border-white/20 bg-white/5'
                }`}
              />
            ))}
        </div>

        {/* Timer Progress Bar */}
        {timer > 0 && (
          <div className="relative mb-4 h-1 w-full overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-gradient-to-r from-violet-400 to-fuchsia-400 transition-all duration-1000 ease-linear"
              style={{ width: `${(timer / 30) * 100}%` }}
            />
            <div className="mt-1 text-right text-xs text-white/50">⏳ {timer}s</div>
          </div>
        )}

        {/* Verify Button */}
        <button
          onClick={() => handleVerifyOtp(otp.join(''))}
          disabled={loading || otp.join('').length !== OTP_LENGTH}
          className={`relative mb-5 w-full overflow-hidden rounded-xl bg-gradient-to-r from-violet-500 to-fuchsia-500 py-4 font-bold text-white shadow-lg shadow-violet-500/25 transition-all ${
            loading || otp.join('').length !== OTP_LENGTH
              ? 'opacity-60 cursor-not-allowed'
              : 'hover:scale-[1.02] hover:shadow-xl'
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
          <span className="text-white/50">Didn't receive code? </span>
          <button
            onClick={handleResend}
            disabled={timer > 0}
            className={`font-semibold ${
              timer > 0 ? 'cursor-not-allowed text-white/30' : 'text-violet-300 hover:underline'
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
            className="text-white/50 hover:text-white transition"
          >
            ← Back to Login
          </button>
        </div>
      </motion.div>
    </div>
  );
}

export default function OTPPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e] flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    }>
      <OTPContent />
    </Suspense>
  );
}