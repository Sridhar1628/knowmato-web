'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import toast, { Toaster } from 'react-hot-toast';
import { loginWithOtp } from '@/services/authService';
import { saveTokens } from '@/services/storageService';

// ============================================
// VALIDATION SCHEMA
// ============================================
const LoginSchema = Yup.object().shape({
  identifier: Yup.string()
    .email('Enter a valid email address')
    .required('Email is required'),
  password: Yup.string()
    .min(6, 'Password must be at least 6 characters')
    .required('Password is required'),
});

// ============================================
// COMPONENT
// ============================================
export default function LoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async (values: { identifier: string; password: string }) => {
    setIsLoading(true);
    try {
      const payload = {
        identifier: values.identifier,
        password: values.password,
      };
      const res = await loginWithOtp(payload);

      if (res?.access) {
        saveTokens(res.access, res.refresh);
        localStorage.setItem('user_id', res.user_id);
        localStorage.setItem('role', res.role);
        localStorage.setItem('display_name', res.display_name);

        toast.success('Login successful 🎉');

        const roleRoutes: Record<string, string> = {
          student: '/student/dashboard',
          tutor: '/tutor/dashboard',
          admin: '/admin/dashboard',
        };
        router.push(roleRoutes[res.role] || '/');
        return;
      }
      throw new Error('Unexpected response');
    } catch (error: any) {
      console.error('Login error:', error);
      const errorMsg = error?.response?.data?.error || error?.message || 'Login failed';
      toast.error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e]">
      {/* Animated background blobs (consistent with other pages) */}
      <div className="absolute top-0 -left-20 w-72 h-72 bg-purple-500/20 rounded-full mix-blend-multiply filter blur-3xl animate-blob" />
      <div className="absolute top-0 -right-20 w-72 h-72 bg-fuchsia-500/20 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000" />
      <div className="absolute -bottom-20 left-40 w-72 h-72 bg-cyan-500/20 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000" />

      {/* Subtle grid overlay */}
      <div className="absolute inset-0 opacity-[0.04] [background-image:linear-gradient(#ffffff_1px,transparent_1px),linear-gradient(to_right,#ffffff_1px,transparent_1px)] [background-size:45px_45px]" />

      {/* Toast notifications */}
      <Toaster position="bottom-center" toastOptions={{ duration: 4000 }} />

      {/* Main content */}
      <div className="flex min-h-screen items-center justify-center px-4 py-12 sm:px-6 lg:px-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="w-full max-w-md"
        >
          <div className="rounded-3xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-2xl p-8">
            {/* Header */}
            <div className="mb-8 text-center">
              {/* Animated logo icon */}
              <motion.div
                animate={{ rotate: [0, 10, 0], scale: [1, 1.05, 1] }}
                transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 2, ease: 'easeInOut' }}
                className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 shadow-lg shadow-violet-500/25 mb-4"
              >
                <svg
                  className="w-10 h-10 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </motion.div>

              <h1 className="text-4xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-violet-300 via-fuchsia-300 to-cyan-300">
                KnowMato
              </h1>
              <p className="mt-2 text-white/70">Instant doubt solving, anytime</p>
            </div>

            {/* Form */}
            <Formik
              initialValues={{ identifier: '', password: '' }}
              validationSchema={LoginSchema}
              onSubmit={handleLogin}
            >
              {({ errors, touched }) => (
                <Form className="space-y-5">
                  {/* Email field */}
                  <div>
                    <div className="relative">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                        <svg
                          className="h-5 w-5 text-white/40"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                          />
                        </svg>
                      </div>
                      <Field
                        name="identifier"
                        type="email"
                        placeholder="Email address"
                        className={`block w-full rounded-xl border-2 py-3 pl-10 pr-3 outline-none transition bg-gray-900/60 backdrop-blur-md text-white placeholder-white/40 focus:border-violet-400 focus:ring-4 focus:ring-violet-500/50 ${
                          errors.identifier && touched.identifier
                            ? 'border-rose-400/60 bg-rose-500/10 placeholder-rose-300/50 focus:border-rose-400 focus:ring-rose-400/30'
                            : 'border-white/20'
                        }`}
                      />
                    </div>
                    <ErrorMessage name="identifier" component="div" className="mt-1 text-xs text-rose-400" />
                  </div>

                  {/* Password field */}
                  <div>
                    <div className="relative">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                        <svg
                          className="h-5 w-5 text-white/40"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                          />
                        </svg>
                      </div>
                      <Field
                        name="password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Password"
                        className={`block w-full rounded-xl border-2 py-3 pl-10 pr-12 outline-none transition bg-gray-900/60 backdrop-blur-md text-white placeholder-white/40 focus:border-violet-400 focus:ring-4 focus:ring-violet-500/50 ${
                          errors.password && touched.password
                            ? 'border-rose-400/60 bg-rose-500/10 placeholder-rose-300/50 focus:border-rose-400 focus:ring-rose-400/30'
                            : 'border-white/20'
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 flex items-center pr-3 text-white/40 hover:text-white/80 transition"
                        tabIndex={-1}
                      >
                        {showPassword ? (
                          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M13.875 18.825A10.05 10.05 0 0112 19c-5 0-9.27-3.11-11-7.5a10.05 10.05 0 013.875-4.375M6.375 6.375A9.96 9.96 0 0112 5c5 0 9.27 3.11 11 7.5a10.05 10.05 0 01-3.875 4.375M6.375 6.375L4 4m16.5 16.5L18 18"
                            />
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9.75 9.75a3 3 0 014.5 4.5"
                            />
                          </svg>
                        ) : (
                          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                            />
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                            />
                          </svg>
                        )}
                      </button>
                    </div>
                    <ErrorMessage name="password" component="div" className="mt-1 text-xs text-rose-400" />
                  </div>

                  {/* Submit button */}
                  <motion.button
                    type="submit"
                    disabled={isLoading}
                    whileTap={{ scale: 0.97 }}
                    className="relative w-full overflow-hidden rounded-xl bg-gradient-to-r from-violet-500 to-fuchsia-500 py-3 font-semibold text-white shadow-lg shadow-violet-500/25 transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_0_40px_rgba(167,139,250,.55)] disabled:opacity-70"
                  >
                    {isLoading ? (
                      <div className="flex items-center justify-center gap-2">
                        <svg
                          className="animate-spin h-5 w-5 text-white"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                          />
                        </svg>
                        <span>Logging in...</span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center gap-2">
                        {/* Shine effect */}
                        <motion.div
                          animate={{ x: ['-120%', '220%'] }}
                          transition={{ duration: 2.5, repeat: Infinity, ease: 'linear' }}
                          className="absolute inset-y-0 w-20 bg-white/30 skew-x-12 blur-md"
                        />
                        <span>Login</span>
                        <svg
                          className="h-5 w-5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M13 7l5 5m0 0l-5 5m5-5H6"
                          />
                        </svg>
                      </div>
                    )}
                  </motion.button>

                  {/* Footer links */}
                  <div className="mt-6 flex flex-col items-center justify-between gap-2 text-sm sm:flex-row">
                    <button
                      type="button"
                      onClick={() => router.push('/register')}
                      className="text-white/50 transition hover:text-violet-300"
                    >
                      New to KnowMato?
                      <span className="font-semibold text-violet-400"> Sign Up</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => router.push('/forgot-password')}
                      className="text-white/50 transition hover:text-violet-300"
                    >
                      Forgot Password?
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