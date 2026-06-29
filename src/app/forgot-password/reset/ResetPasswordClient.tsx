'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import toast, { Toaster } from 'react-hot-toast';
import { resetPassword } from '@/services/v1Service';

// ============================================
// FLOATING EMOJI
// ============================================
const FloatingEmoji = ({
  emoji,
  delay,
  duration,
  top,
  left,
  right,
  bottom,
  opacity = 0.3,
}: any) => (
  <motion.div
    className="absolute pointer-events-none select-none text-5xl"
    style={{ top, left, right, bottom }}
    initial={{ opacity: 0 }}
    animate={{ y: [0, -20, 0], opacity }}
    transition={{ duration, delay, repeat: Infinity, ease: 'easeInOut' }}
  >
    {emoji}
  </motion.div>
);

// ============================================
// VALIDATION
// ============================================
const ResetSchema = Yup.object().shape({
  password: Yup.string()
    .min(6, 'Password must be at least 6 characters')
    .required('Password is required'),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('password')], 'Passwords must match')
    .required('Confirm password is required'),
});

// ============================================
// COMPONENT
// ============================================
export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get('email') || '';
  const otp = searchParams.get('otp') || '';

  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleResetPassword = async (values: {
    password: string;
    confirmPassword: string;
  }) => {
    try {
      setIsLoading(true);
      await resetPassword({
        email,
        otp,
        new_password: values.password,
      });
      toast.success('Password reset successful 🎉');
      setTimeout(() => {
        router.push('/login');
      }, 1500);
    } catch (error: any) {
      console.error(error);
      toast.error(error?.response?.data?.error || 'Password reset failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e]">
      {/* Animated background blobs */}
      <div className="absolute top-0 -left-20 w-72 h-72 bg-purple-500/20 rounded-full mix-blend-multiply filter blur-3xl animate-blob" />
      <div className="absolute top-0 -right-20 w-72 h-72 bg-fuchsia-500/20 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000" />
      <div className="absolute -bottom-20 left-40 w-72 h-72 bg-cyan-500/20 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000" />

      <Toaster position="bottom-center" />

      <FloatingEmoji emoji="🔐" top="10%" left="5%" duration={4} delay={0} />
      <FloatingEmoji emoji="🚀" bottom="15%" right="5%" duration={5} delay={1} />
      <FloatingEmoji emoji="✨" top="20%" right="12%" duration={3.5} delay={0.5} />

      <div className="flex min-h-screen items-center justify-center px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-md"
        >
          <div className="rounded-3xl bg-white/5 backdrop-blur-xl border border-white/10 p-8 shadow-2xl">
            {/* HEADER */}
            <div className="mb-8 text-center">
              <motion.div
                animate={{ rotate: [0, 10, 0] }}
                transition={{ duration: 1, repeat: Infinity, repeatDelay: 2 }}
                className="mb-3 text-6xl"
              >
                🔑
              </motion.div>
              <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-violet-300 via-fuchsia-300 to-cyan-300">
                Create New Password
              </h1>
              <p className="mt-2 text-white/60">
                Your identity has been verified. Create a strong new password.
              </p>
            </div>

            {/* FORM */}
            <Formik
              initialValues={{ password: '', confirmPassword: '' }}
              validationSchema={ResetSchema}
              onSubmit={handleResetPassword}
            >
              {({ errors, touched }) => (
                <Form className="space-y-5">
                  {/* PASSWORD */}
                  <div>
                    <div className="relative">
                      <Field
                        name="password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="New Password"
                        className={`block w-full rounded-xl border-2 bg-gray-900/60 backdrop-blur-sm py-3 px-4 pr-12 text-white placeholder-white/40 outline-none transition-all ${
                          errors.password && touched.password
                            ? 'border-rose-400/60 focus:ring-4 focus:ring-rose-500/30'
                            : 'border-white/20 hover:border-white/30 focus:border-violet-400 focus:ring-4 focus:ring-violet-500/30'
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white/80"
                      >
                        {showPassword ? '🙈' : '👁️'}
                      </button>
                    </div>
                    <ErrorMessage
                      name="password"
                      component="div"
                      className="mt-1 text-xs text-rose-400"
                    />
                  </div>

                  {/* CONFIRM PASSWORD */}
                  <div>
                    <div className="relative">
                      <Field
                        name="confirmPassword"
                        type={showConfirmPassword ? 'text' : 'password'}
                        placeholder="Confirm Password"
                        className={`block w-full rounded-xl border-2 bg-gray-900/60 backdrop-blur-sm py-3 px-4 pr-12 text-white placeholder-white/40 outline-none transition-all ${
                          errors.confirmPassword && touched.confirmPassword
                            ? 'border-rose-400/60 focus:ring-4 focus:ring-rose-500/30'
                            : 'border-white/20 hover:border-white/30 focus:border-violet-400 focus:ring-4 focus:ring-violet-500/30'
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white/80"
                      >
                        {showConfirmPassword ? '🙈' : '👁️'}
                      </button>
                    </div>
                    <ErrorMessage
                      name="confirmPassword"
                      component="div"
                      className="mt-1 text-xs text-rose-400"
                    />
                  </div>

                  {/* BUTTON */}
                  <motion.button
                    type="submit"
                    disabled={isLoading}
                    whileTap={{ scale: 0.97 }}
                    className="w-full rounded-xl bg-gradient-to-r from-violet-500 to-fuchsia-500 py-3 font-semibold text-white shadow-lg shadow-violet-500/25 hover:from-violet-600 hover:to-fuchsia-600 transition-all"
                  >
                    {isLoading ? 'Updating Password...' : 'Reset Password 🔑'}
                  </motion.button>

                  <div className="text-center">
                    <button
                      type="button"
                      onClick={() => router.push('/login')}
                      className="text-sm text-white/50 hover:text-violet-300 transition"
                    >
                      ← Back to Login
                    </button>
                  </div>
                </Form>
              )}
            </Formik>
          </div>
        </motion.div>
      </div>
    </div>
  );
}