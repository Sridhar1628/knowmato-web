'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import toast, { Toaster } from 'react-hot-toast';
import { verifyForgotPasswordOTP } from '@/services/v1Service';

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

  // ============================================
  // VERIFY OTP
  // ============================================
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

  // ============================================
  // UI
  // ============================================
  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e]">
      <Toaster position="bottom-center" />

      {/* Animated background blobs */}
      <div className="absolute top-0 -left-20 w-72 h-72 bg-purple-500/20 rounded-full mix-blend-multiply filter blur-3xl animate-blob" />
      <div className="absolute top-0 -right-20 w-72 h-72 bg-fuchsia-500/20 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000" />
      <div className="absolute -bottom-20 left-40 w-72 h-72 bg-cyan-500/20 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000" />

      {/* FLOATING EMOJIS */}
      <FloatingEmoji emoji="🔐" top="10%" left="5%" duration={4} delay={0} opacity={0.4} />
      <FloatingEmoji emoji="📧" bottom="15%" right="5%" duration={5} delay={1} opacity={0.4} />
      <FloatingEmoji emoji="⚡" top="20%" right="12%" duration={3.5} delay={0.5} opacity={0.4} />

      {/* CONTENT */}
      <div className="flex min-h-screen items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-md relative z-10"
        >
          <div className="rounded-3xl bg-white/5 backdrop-blur-xl border border-white/10 p-8 shadow-2xl">
            {/* HEADER */}
            <div className="mb-8 text-center">
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
                className="mb-3 text-6xl"
              >
                🔢
              </motion.div>

              <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-violet-300 to-fuchsia-300">
                Verify OTP
              </h1>

              <p className="mt-2 text-white/70">
                Enter the 6-digit OTP sent to
              </p>

              <p className="mt-1 font-semibold text-violet-300">
                {email}
              </p>
            </div>

            {/* FORM */}
            <Formik
              initialValues={{ otp: '' }}
              validationSchema={VerifySchema}
              onSubmit={handleVerifyOTP}
            >
              {({ errors, touched }) => (
                <Form className="space-y-5">
                  <div>
                    <Field
                      name="otp"
                      type="text"
                      maxLength={6}
                      placeholder="Enter 6-digit OTP"
                      className={`block w-full rounded-2xl border-2 bg-gray-900/60 py-3 px-4 text-center text-xl tracking-[8px] outline-none transition backdrop-blur-sm
                        ${
                          errors.otp && touched.otp
                            ? 'border-rose-400 focus:ring-rose-500 text-rose-300'
                            : 'border-white/20 text-white placeholder-white/40 focus:border-violet-400 focus:ring-2 focus:ring-violet-500/50'
                        }`}
                    />
                    <ErrorMessage name="otp" component="div" className="mt-1 text-xs text-rose-400" />
                  </div>

                  {/* BUTTON */}
                  <motion.button
                    type="submit"
                    disabled={isLoading}
                    whileTap={{ scale: 0.97 }}
                    className="w-full rounded-xl bg-gradient-to-r from-violet-500 to-fuchsia-500 py-3 font-semibold text-white shadow-lg shadow-violet-500/25 hover:from-violet-600 hover:to-fuchsia-600 transition disabled:opacity-60"
                  >
                    {isLoading ? 'Verifying OTP...' : 'Verify OTP ✅'}
                  </motion.button>

                  {/* FOOTER */}
                  <div className="text-center">
                    <button
                      type="button"
                      onClick={() => router.push('/forgot-password')}
                      className="text-sm text-white/50 hover:text-violet-300 transition"
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