'use client';

import { useState } from 'react';

import { useRouter } from 'next/navigation';

import { motion } from 'framer-motion';

import {
  Formik,
  Form,
  Field,
  ErrorMessage,
} from 'formik';

import * as Yup from 'yup';

import toast, {
  Toaster,
} from 'react-hot-toast';

import {
  loginWithOtp,
} from '@/services/authService';

import {
  saveTokens,
} from '@/services/storageService';

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
    className="
      absolute
      pointer-events-none
      select-none
      text-5xl
    "
    style={{
      top,
      left,
      right,
      bottom,
    }}
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
// VALIDATION
// ============================================

const LoginSchema =
  Yup.object().shape({

    identifier:
      Yup.string()
        .email(
          ' Enter a valid email address'
        )
        .required(
          ' Email is required'
        ),

    password:
      Yup.string()
        .min(
          6,
          ' Password must be at least 6 characters'
        )
        .required(
          ' Password is required'
        ),
  });

// ============================================
// COMPONENT
// ============================================

export default function LoginPage() {

  const router = useRouter();

  const [isLoading, setIsLoading] =
    useState(false);

  const [showPassword, setShowPassword] =
    useState(false);

  // ============================================
  // LOGIN
  // ============================================

  const handleLogin = async (
    values: {
      identifier: string;
      password: string;
    }
  ) => {

    setIsLoading(true);

    try {

      const payload = {

        identifier:
          values.identifier,

        password:
          values.password,
      };

      const res =
        await loginWithOtp(payload);

      // ========================================
      // SUCCESS
      // ========================================

      if (res?.access) {

        // SAVE TOKENS

        saveTokens(
          res.access,
          res.refresh
        );

        // SAVE USER INFO

        localStorage.setItem(
          'user_id',
          res.user_id
        );

        localStorage.setItem(
          'role',
          res.role
        );

        localStorage.setItem(
          'display_name',
          res.display_name
        );

        toast.success(
          'Login successful 🎉'
        );

        // ROLE REDIRECT

        if (
          res.role === 'student'
        ) {

          router.push(
            '/student/dashboard'
          );

        } else if (
          res.role === 'tutor'
        ) {

          router.push(
            '/tutor/dashboard'
          );

        } else if (
          res.role === 'admin'
        ) {

          router.push(
            '/admin/dashboard'
          );

        } else {

          router.push('/');
        }

        return;
      }

      throw new Error(
        'Unexpected response'
      );

    } catch (error: any) {

      console.error(
        'Login error:',
        error
      );

      const errorMsg =

        error?.response
          ?.data?.error ||

        error?.message ||

        'Login failed';

      toast.error(errorMsg);

    } finally {

      setIsLoading(false);
    }
  };

  // ============================================
  // UI
  // ============================================

  return (

    <div
      className="
        relative
        min-h-screen
        w-full
        overflow-hidden
        bg-gradient-to-br
        from-[#F9F7FE]
        via-white
        to-[#F0F4FF]
      "
    >

      <Toaster
        position="bottom-center"
        toastOptions={{
          duration: 4000,
        }}
      />

      {/* FLOATING EMOJIS */}

      <FloatingEmoji
        emoji="💡"
        top="10%"
        left="5%"
        duration={4}
        delay={0}
      />

      <FloatingEmoji
        emoji="🎓"
        bottom="15%"
        right="5%"
        duration={5}
        delay={1}
      />

      <FloatingEmoji
        emoji="⚡"
        top="20%"
        right="12%"
        duration={3.5}
        delay={0.5}
      />

      <FloatingEmoji
        emoji="🚀"
        bottom="25%"
        left="8%"
        duration={6}
        delay={0.8}
      />

      {/* CONTENT */}

      <div
        className="
          flex
          min-h-screen
          items-center
          justify-center
          px-4
          py-12
          sm:px-6
          lg:px-8
        "
      >

        <motion.div
          initial={{
            opacity: 0,
            y: 30,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          transition={{
            duration: 0.6,
            ease: 'easeOut',
          }}
          className="
            w-full
            max-w-md
          "
        >

          <div
            className="
              rounded-2xl
              bg-white/80
              p-8
              shadow-xl
              backdrop-blur-sm
            "
          >

            {/* HEADER */}

            <div
              className="
                mb-8
                text-center
              "
            >

              <motion.div
                animate={{
                  rotate: [0, 10, 0],
                }}
                transition={{
                  duration: 1,
                  repeat: Infinity,
                  repeatDelay: 2,
                }}
                className="
                  mb-3
                  text-6xl
                "
              >

                ⚡

              </motion.div>

              <h1
                className="
                  text-4xl
                  font-extrabold
                  tracking-tight
                  text-gray-800
                "
              >

                Jeblio

              </h1>

              <p
                className="
                  mt-2
                  text-gray-500
                "
              >

                🚀 Instant doubt solving,
                anytime

              </p>

            </div>

            {/* FORM */}

            <Formik
              initialValues={{
                identifier: '',
                password: '',
              }}
              validationSchema={
                LoginSchema
              }
              onSubmit={handleLogin}
            >

              {({
                errors,
                touched,
              }) => (

                <Form
                  className="
                    space-y-5
                  "
                >

                  {/* EMAIL */}

                  <div>

                    <div
                      className="
                        relative
                      "
                    >

                      <div
                        className="
                          pointer-events-none
                          absolute
                          inset-y-0
                          left-0
                          flex
                          items-center
                          pl-3
                          text-xl
                        "
                      >
                      </div>

                      <Field
                        name="identifier"
                        type="email"
                        placeholder="Email address"
                        className={`
                          block
                          w-full
                          rounded-xl
                          border
                          ${
                            errors.identifier &&
                            touched.identifier

                              ? 'border-red-400 bg-red-50'

                              : 'border-gray-200 bg-white'
                          }
                          py-3
                          pl-10
                          pr-3
                          text-gray-800
                          placeholder-gray-400
                          outline-none
                          transition
                          focus:border-indigo-400
                          focus:ring-2
                          focus:ring-indigo-100
                        `}
                      />

                    </div>

                    <ErrorMessage
                      name="identifier"
                      component="div"
                      className="
                        mt-1
                        text-xs
                        text-red-500
                      "
                    />

                  </div>

                  {/* PASSWORD */}

                  <div>

                    <div
                      className="
                        relative
                      "
                    >

                      <div
                        className="
                          pointer-events-none
                          absolute
                          inset-y-0
                          left-0
                          flex
                          items-center
                          pl-3
                          text-xl
                        "
                      >

                      </div>

                      <Field
                        name="password"
                        type={
                          showPassword
                            ? 'text'
                            : 'password'
                        }
                        placeholder="Password"
                        className={`
                          block
                          w-full
                          rounded-xl
                          border
                          ${
                            errors.password &&
                            touched.password

                              ? 'border-red-400 bg-red-50'

                              : 'border-gray-200 bg-white'
                          }
                          py-3
                          pl-10
                          pr-10
                          text-gray-800
                          placeholder-gray-400
                          outline-none
                          transition
                          focus:border-indigo-400
                          focus:ring-2
                          focus:ring-indigo-100
                        `}
                      />

                      <button
                        type="button"
                        onClick={() =>
                          setShowPassword(
                            !showPassword
                          )
                        }
                        className="
                          absolute
                          inset-y-0
                          right-0
                          flex
                          items-center
                          pr-3
                          text-gray-400
                          hover:text-gray-600
                        "
                      >

                        {showPassword
                          ? '🙈'
                          : '👁️'}

                      </button>

                    </div>

                    <ErrorMessage
                      name="password"
                      component="div"
                      className="
                        mt-1
                        text-xs
                        text-red-500
                      "
                    />

                  </div>

                  {/* BUTTON */}

                  <motion.button
                    type="submit"
                    disabled={isLoading}
                    whileTap={{
                      scale: 0.97,
                    }}
                    className="
                      relative
                      w-full
                      overflow-hidden
                      rounded-xl
                      bg-gradient-to-r
                      from-indigo-500
                      via-purple-500
                      to-pink-500
                      py-3
                      font-semibold
                      text-white
                      shadow-md
                      transition
                      hover:shadow-lg
                      disabled:opacity-70
                    "
                  >

                    {isLoading ? (

                      <div
                        className="
                          flex
                          items-center
                          justify-center
                          gap-2
                        "
                      >

                        <span>
                          Logging in...
                        </span>

                      </div>

                    ) : (

                      <div
                        className="
                          flex
                          items-center
                          justify-center
                          gap-2
                        "
                      >

                        <span>
                          Login
                        </span>

                        <span>
                          🚀
                        </span>

                      </div>
                    )}

                  </motion.button>

                  {/* FOOTER */}

                  <div
                    className="
                      mt-6
                      flex
                      flex-col
                      items-center
                      justify-between
                      gap-2
                      text-sm
                      sm:flex-row
                    "
                  >

                    <button
                      type="button"
                      onClick={() =>
                        router.push(
                          '/register'
                        )
                      }
                      className="
                        text-gray-500
                        transition
                        hover:text-indigo-600
                      "
                    >

                      🆕 New to Jeblio?

                      <span
                        className="
                          font-semibold
                          text-indigo-600
                        "
                      >

                        {' '}
                        Sign Up

                      </span>

                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        router.push(
                          '/forgot-password'
                        )
                      }
                      className="
                        text-gray-500
                        transition
                        hover:text-indigo-600
                      "
                    >

                      🤔 Forgot Password?

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
