'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Formik, Field, Form, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { motion } from 'framer-motion';

import {
  registerUser,
  RegisterData,
} from '@/services/authService';

import AlertService from '@/services/alertService';

// ============================================
// VALIDATION
// ============================================

const RegisterSchema = Yup.object().shape({
  email: Yup.string()
    .email('Please enter a valid email')
    .required('Email is required'),

  phone: Yup.string()
    .matches(
      /^[6-9]\d{9}$/,
      'Please enter a valid 10-digit mobile number',
    )
    .required('Phone number is required'),

  password: Yup.string()
    .min(
      6,
      'Password must be at least 6 characters',
    )
    .required('Password is required'),
});

// ============================================
// FLOATING EMOJI COMPONENT
// ============================================

const FloatingEmoji = ({
  emoji,
  top,
  left,
  right,
  bottom,
  duration,
  delay,
}: {
  emoji: string;
  top?: string;
  left?: string;
  right?: string;
  bottom?: string;
  duration: number;
  delay: number;
}) => (
  <motion.div
    className="absolute text-5xl pointer-events-none select-none opacity-30"
    style={{
      top,
      left,
      right,
      bottom,
    }}
    initial={{
      opacity: 0,
    }}
    animate={{
      y: [0, -20, 0],
      opacity: [0.2, 0.4, 0.2],
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
// REGISTER PAGE COMPONENT
// ============================================

export default function RegisterPage() {
  const router = useRouter();

  const [showPassword, setShowPassword] =
    useState(false);

  const [acceptedTerms, setAcceptedTerms] =
    useState(false);

  // ==========================================
  // REGISTER
  // ==========================================

  const handleRegister = async (
    values: RegisterData,
    {
      setSubmitting,
    }: {
      setSubmitting: (
        isSubmitting: boolean,
      ) => void;
    },
  ) => {
    try {
      // ========================================
      // REGISTER API
      // ========================================

      await registerUser({
        ...values,
        role: 'student',
      });

      // ========================================
      // SUCCESS ALERT
      // ========================================

      AlertService.success(
        'Account Created',
        'Your account has been created successfully. Please verify your email to continue.',
      );

      // ========================================
      // GO TO VERIFICATION
      // ========================================

      router.push(
        `/verify-register?identifier=${encodeURIComponent(
          values.email,
        )}`,
      );
    } catch (error: unknown) {
      console.error(
        'Register error:',
        error,
      );

      // ========================================
      // EXTRACT ERROR MESSAGE SAFELY
      // ========================================

      let errorMessage =
        'Registration failed. Please try again.';

      if (
        typeof error === 'object' &&
        error !== null
      ) {
        const possibleError =
          error as {
            response?: {
              data?: {
                error?: string;
                detail?: string;
                message?: string;
              };
            };
            message?: string;
          };

        errorMessage =
          possibleError.response?.data?.error ||
          possibleError.response?.data?.detail ||
          possibleError.response?.data?.message ||
          possibleError.message ||
          errorMessage;
      }

      // ========================================
      // OPTIONAL DEVICE FEEDBACK
      // ========================================

      if (
        typeof window !== 'undefined' &&
        'navigator' in window &&
        typeof window.navigator
          .vibrate === 'function'
      ) {
        window.navigator.vibrate(50);
      }

      // ========================================
      // CUSTOM ERROR ALERT
      // ========================================

      AlertService.error(
        'Registration Failed',
        errorMessage,
      );
    } finally {
      setSubmitting(false);
    }
  };

  // ============================================
  // RENDER
  // ============================================

  return (
    <>
      {/* ======================================
          ANIMATED BACKGROUND
          ====================================== */}

      <div className="fixed inset-0 -z-10 bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e]">

        <div className="absolute top-0 -left-20 w-72 h-72 bg-purple-500/20 rounded-full mix-blend-multiply filter blur-3xl animate-blob" />

        <div className="absolute top-0 -right-20 w-72 h-72 bg-fuchsia-500/20 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000" />

        <div className="absolute -bottom-20 left-40 w-72 h-72 bg-cyan-500/20 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000" />

      </div>

      {/* ======================================
          FLOATING EMOJIS
          ====================================== */}

      <FloatingEmoji
        emoji="🚀"
        top="10%"
        left="8%"
        duration={5}
        delay={0}
      />

      <FloatingEmoji
        emoji="⚡"
        top="20%"
        right="10%"
        duration={4}
        delay={1}
      />

      <FloatingEmoji
        emoji="✨"
        bottom="15%"
        left="12%"
        duration={6}
        delay={0.5}
      />

      <FloatingEmoji
        emoji="🎓"
        bottom="12%"
        right="8%"
        duration={5}
        delay={1.2}
      />

      {/* ======================================
          PAGE CONTAINER
          ====================================== */}

      <div className="flex min-h-screen items-center justify-center px-4 py-10">

        <motion.div
          initial={{
            opacity: 0,
            y: 40,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          transition={{
            duration: 0.6,
          }}
          className="w-full max-w-md"
        >

          {/* ==================================
              GLASS CARD
              ================================== */}

          <div className="rounded-[32px] border border-white/10 bg-white/5 backdrop-blur-2xl p-8 shadow-2xl">

            {/* ==================================
                HEADER
                ================================== */}

            <div className="mb-8 text-center">

              <motion.div
                animate={{
                  rotate: [0, 10, 0],
                }}
                transition={{
                  duration: 1,
                  repeat: Infinity,
                  repeatDelay: 2,
                }}
                className="mb-4 text-6xl"
              >
                🚀
              </motion.div>

              <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-violet-300 to-fuchsia-300">
                Join KnowMato
              </h1>

              <p className="mt-3 text-sm text-white/80">
                ⚡ Learn smarter with instant doubt
                solving
              </p>

            </div>

            {/* ==================================
                REGISTRATION FORM
                ================================== */}

            <Formik
              initialValues={{
                email: '',
                phone: '',
                password: '',
                role: 'student',
              }}
              validationSchema={
                RegisterSchema
              }
              validateOnChange={false}
              validateOnBlur={true}
              onSubmit={handleRegister}
            >
              {({
                isSubmitting,
                errors,
                touched,
              }) => (
                <Form className="space-y-5">

                  {/* =================================
                      EMAIL
                      ================================= */}

                  <div>

                    <div className="relative">

                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl">
                        📧
                      </span>

                      <Field
                        name="email"
                        type="email"
                        placeholder="Email address"
                        className={`w-full rounded-2xl border-2 bg-white/10 py-4 pl-12 pr-4 text-white placeholder-white/50 outline-none backdrop-blur-xl transition-all ${
                          errors.email &&
                          touched.email
                            ? 'border-rose-400 focus:ring-rose-500/30'
                            : 'border-white/10 focus:border-violet-400 focus:ring-2 focus:ring-violet-500/30'
                        }`}
                        disabled={isSubmitting}
                      />

                    </div>

                    <ErrorMessage
                      name="email"
                      component="div"
                      className="mt-1 text-xs text-rose-300 pl-2"
                    />

                  </div>

                  {/* =================================
                      PHONE
                      ================================= */}

                  <div>

                    <div className="relative">

                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl">
                        📱
                      </span>

                      <span className="absolute left-12 top-1/2 -translate-y-1/2 text-sm text-white/60">
                        🇮🇳 +91
                      </span>

                      <Field
                        name="phone"
                        type="tel"
                        placeholder="Mobile number"
                        className={`w-full rounded-2xl border-2 bg-white/10 py-4 pl-28 pr-4 text-white placeholder-white/50 outline-none backdrop-blur-xl transition-all ${
                          errors.phone &&
                          touched.phone
                            ? 'border-rose-400 focus:ring-rose-500/30'
                            : 'border-white/10 focus:border-violet-400 focus:ring-2 focus:ring-violet-500/30'
                        }`}
                        disabled={isSubmitting}
                      />

                    </div>

                    <ErrorMessage
                      name="phone"
                      component="div"
                      className="mt-1 text-xs text-rose-300 pl-2"
                    />

                  </div>

                  {/* =================================
                      PASSWORD
                      ================================= */}

                  <div>

                    <div className="relative">

                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl">
                        🔒
                      </span>

                      <Field
                        name="password"
                        type={
                          showPassword
                            ? 'text'
                            : 'password'
                        }
                        placeholder="Password"
                        className={`w-full rounded-2xl border-2 bg-white/10 py-4 pl-12 pr-12 text-white placeholder-white/50 outline-none backdrop-blur-xl transition-all ${
                          errors.password &&
                          touched.password
                            ? 'border-rose-400 focus:ring-rose-500/30'
                            : 'border-white/10 focus:border-violet-400 focus:ring-2 focus:ring-violet-500/30'
                        }`}
                        disabled={isSubmitting}
                      />

                      <button
                        type="button"
                        onClick={() =>
                          setShowPassword(
                            !showPassword,
                          )
                        }
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-xl transition-transform hover:scale-110"
                        aria-label={
                          showPassword
                            ? 'Hide password'
                            : 'Show password'
                        }
                      >
                        {showPassword
                          ? '🙈'
                          : '👁️'}
                      </button>

                    </div>

                    <ErrorMessage
                      name="password"
                      component="div"
                      className="mt-1 text-xs text-rose-300 pl-2"
                    />

                  </div>

                  {/* =================================
                      TERMS & CONDITIONS
                      ================================= */}

                  <div className="flex items-start gap-3 pt-2">

                    <input
                      id="terms"
                      type="checkbox"
                      checked={
                        acceptedTerms
                      }
                      onChange={(event) =>
                        setAcceptedTerms(
                          event.target.checked,
                        )
                      }
                      disabled={isSubmitting}
                      className="mt-1 h-4 w-4 cursor-pointer rounded border-white/20 bg-white/10 text-violet-500 accent-violet-500"
                    />

                    <label
                      htmlFor="terms"
                      className="text-sm leading-6 text-white/70"
                    >
                      I agree to the{' '}

                      <button
                        type="button"
                        onClick={() =>
                          router.push(
                            '/legal',
                          )
                        }
                        className="font-semibold text-violet-300 hover:text-violet-200 transition-colors"
                      >
                        Terms & Conditions
                      </button>{' '}

                      and{' '}

                      <button
                        type="button"
                        onClick={() =>
                          router.push(
                            '/legal',
                          )
                        }
                        className="font-semibold text-violet-300 hover:text-violet-200 transition-colors"
                      >
                        Privacy Policy
                      </button>
                      .
                    </label>

                  </div>

                  {/* =================================
                      SUBMIT BUTTON
                      ================================= */}

                  <motion.button
                    whileTap={{
                      scale: 0.98,
                    }}
                    type="submit"
                    disabled={
                      isSubmitting ||
                      !acceptedTerms
                    }
                    className={`w-full rounded-2xl py-4 font-bold text-white shadow-lg transition-all ${
                      acceptedTerms &&
                      !isSubmitting
                        ? 'bg-gradient-to-r from-violet-500 to-fuchsia-500 shadow-violet-500/25 hover:scale-[1.01] hover:shadow-xl'
                        : 'bg-white/10 cursor-not-allowed opacity-50'
                    }`}
                  >
                    {isSubmitting
                      ? 'Creating Account...'
                      : 'Create Account ✨'}
                  </motion.button>

                  {/* =================================
                      LOGIN LINK
                      ================================= */}

                  <div className="pt-2 text-center text-sm text-white/70">

                    Already have an account?{' '}

                    <button
                      type="button"
                      onClick={() =>
                        router.push(
                          '/login',
                        )
                      }
                      className="font-semibold text-violet-300 hover:text-violet-200 transition-colors"
                    >
                      Sign In
                    </button>

                  </div>

                </Form>
              )}
            </Formik>

          </div>

        </motion.div>

      </div>
    </>
  );
}