'use client';

import { useState } from 'react';

import {

  useRouter,

  useSearchParams,

} from 'next/navigation';

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

  verifyForgotPasswordOTP,

} from '@/services/v1Service';

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
    initial={{
      opacity: 0,
    }}
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

const VerifySchema =
  Yup.object().shape({

    otp:

      Yup.string()

        .length(
          6,
          'OTP must be 6 digits'
        )

        .required(
          'OTP is required'
        ),

  });

// ============================================
// COMPONENT
// ============================================

export default function VerifyForgotPasswordPage() {

  const router =
    useRouter();

  const searchParams =
    useSearchParams();

  const email =
    searchParams.get('email') || '';

  const [

    isLoading,

    setIsLoading,

  ] = useState(false);

  // ============================================
  // VERIFY OTP
  // ============================================

  const handleVerifyOTP =
    async (
      values: {
        otp: string;
      }
    ) => {

      try {

        setIsLoading(true);

        await verifyForgotPasswordOTP({

          email,

          otp:
            values.otp,

        });

        toast.success(
          'OTP verified successfully ✅'
        );

        setTimeout(() => {

          router.push(

            `/forgot-password/reset?email=${encodeURIComponent(
              email
            )}&otp=${values.otp}`

          );

        }, 1000);

      } catch (error: any) {

        console.error(error);

        toast.error(

          error?.response?.data?.error ||

          'Invalid OTP'

        );

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
        overflow-hidden
        bg-gradient-to-br
        from-[#F9F7FE]
        via-white
        to-[#F0F4FF]
      "
    >

      <Toaster
        position="bottom-center"
      />

      {/* FLOATING EMOJIS */}

      <FloatingEmoji
        emoji="🔐"
        top="10%"
        left="5%"
        duration={4}
        delay={0}
      />

      <FloatingEmoji
        emoji="📧"
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

      {/* CONTENT */}

      <div
        className="
          flex
          min-h-screen
          items-center
          justify-center
          px-4
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
                  scale: [1, 1.1, 1],
                }}

                transition={{
                  duration: 1,
                  repeat: Infinity,
                }}

                className="
                  mb-3
                  text-6xl
                "
              >

                🔢

              </motion.div>

              <h1
                className="
                  text-4xl
                  font-extrabold
                  text-gray-800
                "
              >

                Verify OTP

              </h1>

              <p
                className="
                  mt-2
                  text-gray-500
                "
              >

                Enter the 6-digit OTP sent to

              </p>

              <p
                className="
                  mt-1
                  font-semibold
                  text-indigo-600
                "
              >

                {email}

              </p>

            </div>

            {/* FORM */}

            <Formik

              initialValues={{
                otp: '',
              }}

              validationSchema={
                VerifySchema
              }

              onSubmit={
                handleVerifyOTP
              }

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

                  <div>

                    <Field

                      name="otp"

                      type="text"

                      maxLength={6}

                      placeholder="Enter 6-digit OTP"

                      className={`
                        block
                        w-full
                        rounded-xl
                        border

                        ${
                          errors.otp &&
                          touched.otp

                            ? 'border-red-400 bg-red-50'

                            : 'border-gray-200 bg-white'
                        }

                        py-3
                        px-4
                        text-center
                        text-xl
                        tracking-[8px]
                        text-gray-800
                        outline-none
                        transition
                        focus:border-indigo-400
                        focus:ring-2
                        focus:ring-indigo-100
                      `}
                    />

                    <ErrorMessage
                      name="otp"
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
                      w-full
                      rounded-xl
                      bg-gradient-to-r
                      from-indigo-500
                      via-purple-500
                      to-pink-500
                      py-3
                      font-semibold
                      text-white
                      shadow-md
                    "
                  >

                    {isLoading

                      ? 'Verifying OTP...'

                      : 'Verify OTP ✅'}

                  </motion.button>

                  {/* FOOTER */}

                  <div
                    className="
                      text-center
                    "
                  >

                    <button

                      type="button"

                      onClick={() =>
                        router.push(
                          '/forgot-password'
                        )
                      }

                      className="
                        text-sm
                        text-gray-500
                        hover:text-indigo-600
                      "
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