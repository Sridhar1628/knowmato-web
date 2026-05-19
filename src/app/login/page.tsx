'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { loginWithOtp } from '@/services/authService';
import toast, { Toaster } from 'react-hot-toast';

// ============================================
// 1. Floating Emoji Component
// ============================================
const FloatingEmoji = ({ emoji, delay, duration, top, left, right, bottom, opacity = 0.3 }: any) => (
  <motion.div
      className="absolute text-5xl pointer-events-none select-none"
      style={{ top, left, right, bottom }}
      initial={{ opacity: 0 }}
      animate={{
        y: [0, -20, 0],
        opacity,
      }}
      transition={{
        duration,
        delay,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
    >
    {emoji}
  </motion.div>
);

// ============================================
// 2. Main Login Component
// ============================================
const LoginSchema = (isPhoneLogin: boolean) =>
  Yup.object().shape({
    identifier: isPhoneLogin
      ? Yup.string()
          .matches(/^[6-9]\d{9}$/, '📱 Enter a valid 10-digit mobile number')
          .required('📱 Phone number is required')
      : Yup.string()
          .email('📧 Enter a valid email address')
          .required('📧 Email is required'),
    password: !isPhoneLogin
      ? Yup.string()
          .min(6, '🔒 Password must be at least 6 characters')
          .required('🔒 Password is required')
      : Yup.string().notRequired(),
  });

export default function LoginPage() {
  const router = useRouter();
  const [isPhoneLogin, setIsPhoneLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // For toggle animation
  const toggleRef = useRef<HTMLDivElement>(null);
  const [indicatorWidth, setIndicatorWidth] = useState(0);
  const [indicatorLeft, setIndicatorLeft] = useState(0);

  useEffect(() => {
    if (toggleRef.current) {
      const buttons = toggleRef.current.children;
      if (buttons.length === 2) {
        const activeIndex = isPhoneLogin ? 0 : 1;
        const activeButton = buttons[activeIndex] as HTMLElement;
        setIndicatorWidth(activeButton.offsetWidth);
        setIndicatorLeft(activeButton.offsetLeft);
      }
    }
  }, [isPhoneLogin]);

  const handleSendOtp = async (values: { identifier: string; password?: string }) => {
    setIsLoading(true);

    try {
      const payload = isPhoneLogin
        ? { identifier: values.identifier }
        : {
            identifier: values.identifier,
            password: values.password,
          };

      const res = await loginWithOtp(payload);

      // ============================================
      // 📱 PHONE LOGIN → OTP SCREEN
      // ============================================
      if (isPhoneLogin && res?.message === 'OTP sent') {
        router.push(`/otp?identifier=${encodeURIComponent(values.identifier)}`);
        return;
      }

      // ============================================
      // 📧 EMAIL LOGIN → DIRECT LOGIN
      // ============================================
      if (!isPhoneLogin && res?.access) {

        // ✅ Store tokens
        localStorage.setItem('access', res.access);
        localStorage.setItem('refresh', res.refresh);

        // ✅ Store user info (optional)
        localStorage.setItem('user_id', res.user_id);
        localStorage.setItem('role', res.role);
        localStorage.setItem('display_name', res.display_name);

        toast.success('Login successful 🎉');

        // ✅ Redirect
        router.push('/student/dashboard');

        return;
      }

      throw new Error('Unexpected response');

    } catch (error: any) {

      console.error('Login error:', error);

      const errorMsg =
        error?.response?.data?.error ||
        error?.message ||
        'Login failed';

      toast.error(errorMsg);

    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-gradient-to-br from-[#F9F7FE] via-white to-[#F0F4FF]">
      <Toaster position="bottom-center" toastOptions={{ duration: 4000 }} />

      {/* Floating Emojis */}
      <FloatingEmoji emoji="💡" top="10%" left="5%" duration={4} delay={0} />
      <FloatingEmoji emoji="🎓" bottom="15%" right="5%" duration={5} delay={1} />
      <FloatingEmoji emoji="⚡" top="20%" right="12%" duration={3.5} delay={0.5} />
      <FloatingEmoji emoji="🚀" bottom="25%" left="8%" duration={6} delay={0.8} />

      {/* Main Content */}
      <div className="flex min-h-screen items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="w-full max-w-md"
        >
          <div className="rounded-2xl bg-white/80 p-8 shadow-xl backdrop-blur-sm">
            {/* Header */}
            <div className="mb-8 text-center">
              <motion.div
                animate={{ rotate: [0, 10, 0] }}
                transition={{ duration: 1, repeat: Infinity, repeatDelay: 2 }}
                className="mb-3 text-6xl"
              >
                ⚡
              </motion.div>
              <h1 className="text-4xl font-extrabold tracking-tight text-gray-800">Jeblio</h1>
              <p className="mt-2 text-gray-500">🚀 Instant doubt solving, anytime</p>
            </div>

            {/* Toggle Switch */}
            <div className="mb-8 flex justify-center">
              <div
                ref={toggleRef}
                className="relative flex w-64 rounded-full bg-gray-100 p-1 shadow-inner"
              >
                <div
                  className="absolute top-1 bottom-1 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-300 ease-out"
                  style={{
                    width: indicatorWidth,
                    transform: `translateX(${indicatorLeft}px)`,
                  }}
                />
                <button
                  type="button"
                  onClick={() => setIsPhoneLogin(true)}
                  className={`relative z-10 flex w-1/2 items-center justify-center gap-2 rounded-full py-2 text-sm font-medium transition-colors ${
                    isPhoneLogin ? 'text-white' : 'text-gray-600'
                  }`}
                >
                  <span>📱</span> Phone
                </button>
                <button
                  type="button"
                  onClick={() => setIsPhoneLogin(false)}
                  className={`relative z-10 flex w-1/2 items-center justify-center gap-2 rounded-full py-2 text-sm font-medium transition-colors ${
                    !isPhoneLogin ? 'text-white' : 'text-gray-600'
                  }`}
                >
                  <span>✉️</span> Email
                </button>
              </div>
            </div>

            {/* Form */}
            <Formik
              initialValues={{ identifier: '', password: '' }}
              validationSchema={LoginSchema(isPhoneLogin)}
              onSubmit={handleSendOtp}
            >
              {({ errors, touched, isSubmitting }) => (
                <Form className="space-y-5">
                  {/* Identifier Field */}
                  <div>
                    <div className="relative">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-xl">
                        {isPhoneLogin ? '📞' : '📧'}
                      </div>
                      <Field
                        name="identifier"
                        type={isPhoneLogin ? 'tel' : 'email'}
                        placeholder={isPhoneLogin ? 'Mobile number' : 'Email address'}
                        className={`block w-full rounded-xl border ${
                          errors.identifier && touched.identifier
                            ? 'border-red-400 bg-red-50'
                            : 'border-gray-200 bg-white'
                        } py-3 pl-10 pr-3 text-gray-800 placeholder-gray-400 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100`}
                      />
                      {isPhoneLogin && (
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-sm text-gray-400">
                          +91
                        </div>
                      )}
                    </div>
                    <ErrorMessage name="identifier" component="div" className="mt-1 text-xs text-red-500" />
                  </div>

                  {/* Password Field (only for email) */}
                  {!isPhoneLogin && (
                    <div>
                      <div className="relative">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-xl">
                          🔐
                        </div>
                        <Field
                          name="password"
                          type={showPassword ? 'text' : 'password'}
                          placeholder="Password"
                          className={`block w-full rounded-xl border ${
                            errors.password && touched.password
                              ? 'border-red-400 bg-red-50'
                              : 'border-gray-200 bg-white'
                          } py-3 pl-10 pr-10 text-gray-800 placeholder-gray-400 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
                        >
                          {showPassword ? '🙈' : '👁️'}
                        </button>
                      </div>
                      <ErrorMessage name="password" component="div" className="mt-1 text-xs text-red-500" />
                    </div>
                  )}

                  {/* Submit Button */}
                  <motion.button
                    type="submit"
                    disabled={isLoading}
                    whileTap={{ scale: 0.97 }}
                    className="relative w-full overflow-hidden rounded-xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 py-3 font-semibold text-white shadow-md transition hover:shadow-lg disabled:opacity-70"
                  >
                    {isLoading ? (
                      <div className="flex items-center justify-center gap-2">
                        <svg className="h-5 w-5 animate-spin text-white" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        <span>
                          {isPhoneLogin ? 'Sending OTP...' : 'Logging in...'}
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center gap-2">
                        <span>
                          {isPhoneLogin ? 'Send OTP' : 'Login'}
                        </span>

                        <span>
                          {isPhoneLogin ? '📨' : '🚀'}
                        </span>
                      </div>
                    )}
                  </motion.button>

                  {/* Footer Links */}
                  <div className="mt-6 flex flex-col items-center justify-between gap-2 text-sm sm:flex-row">
                    <button
                      type="button"
                      onClick={() => router.push('/register')}
                      className="text-gray-500 transition hover:text-indigo-600"
                    >
                      🆕 New to Jeblio? <span className="font-semibold text-indigo-600">Sign Up</span>
                    </button>
                    {!isPhoneLogin && (
                      <button
                        type="button"
                        onClick={() => router.push('/forgot-password')}
                        className="text-gray-500 transition hover:text-indigo-600"
                      >
                        🤔 Forgot Password?
                      </button>
                    )}
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