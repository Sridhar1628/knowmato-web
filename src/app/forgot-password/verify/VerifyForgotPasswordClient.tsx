'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import toast, { Toaster } from 'react-hot-toast';
import { verifyForgotPasswordOTP } from '@/services/v1Service';

// ============================================
// VALIDATION SCHEMA
// ============================================
const VerifySchema = Yup.object().shape({
  otp: Yup.string()
    .length(6, 'OTP must be 6 digits')
    .required('OTP is required'),
});

// ============================================
// COMPONENT
// ============================================
export default function VerifyForgotPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get('email') || '';
  const [isLoading, setIsLoading] = useState(false);

  const handleVerifyOTP = async (values: { otp: string }) => {
    try {
      setIsLoading(true);
      await verifyForgotPasswordOTP({ email, otp: values.otp });
      toast.success('OTP verified successfully ✅');
      setTimeout(() => {
        router.push(
          `/forgot-password/reset?email=${encodeURIComponent(email)}&otp=${values.otp}`
        );
      }, 1000);
    } catch (error: any) {
      console.error(error);
      toast.error(error?.response?.data?.error || 'Invalid OTP');
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
                    d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
                  />
                </svg>
              </motion.div>

              <h1 className="text-4xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-violet-300 via-fuchsia-300 to-cyan-300">
                Verify OTP
              </h1>
              <p className="mt-2 text-white/70">
                Enter the 6-digit OTP sent to
              </p>
              <p className="mt-1 font-semibold text-violet-300">
                {email}
              </p>
            </div>

            {/* Form */}
            <Formik
              initialValues={{ otp: '' }}
              validationSchema={VerifySchema}
              onSubmit={handleVerifyOTP}
            >
              {({ errors, touched }) => (
                <Form className="space-y-5">
                  {/* OTP field */}
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
                        name="otp"
                        type="text"
                        maxLength={6}
                        placeholder="Enter 6-digit OTP"
                        className={`block w-full rounded-xl border-2 py-3 pl-10 pr-3 text-center text-xl tracking-[8px] outline-none transition bg-gray-900/60 backdrop-blur-md text-white placeholder-white/40 focus:border-violet-400 focus:ring-4 focus:ring-violet-500/50 ${
                          errors.otp && touched.otp
                            ? 'border-rose-400/60 bg-rose-500/10 placeholder-rose-300/50 focus:border-rose-400 focus:ring-rose-400/30'
                            : 'border-white/20'
                        }`}
                      />
                    </div>
                    <ErrorMessage name="otp" component="div" className="mt-1 text-xs text-rose-400" />
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
                        <span>Verifying OTP...</span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center gap-2">
                        <motion.div
                          animate={{ x: ['-120%', '220%'] }}
                          transition={{ duration: 2.5, repeat: Infinity, ease: 'linear' }}
                          className="absolute inset-y-0 w-20 bg-white/30 skew-x-12 blur-md"
                        />
                        <span>Verify OTP</span>
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
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      </div>
                    )}
                  </motion.button>

                  {/* Footer link */}
                  <div className="mt-6 text-center">
                    <button
                      type="button"
                      onClick={() => router.push('/forgot-password')}
                      className="text-sm text-white/50 transition hover:text-violet-300"
                    >
                      ← Back
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