"use client";

import { useState } from "react";

import { useRouter } from "next/navigation";

import {
  Formik,
  Field,
  Form,
  ErrorMessage,
} from "formik";

import * as Yup from "yup";

import {
  motion,
} from "framer-motion";

import toast, {
  Toaster,
} from "react-hot-toast";

import {
  registerUser,
  RegisterData,
} from "@/services/authService";

// ============================================
// VALIDATION
// ============================================

const RegisterSchema =
  Yup.object().shape({

    email:
      Yup.string()
        .email(
          " Please enter a valid email"
        )
        .required(
          " Email is required"
        ),

    phone:
      Yup.string()
        .matches(
          /^[6-9]\d{9}$/,
          " Please enter a valid 10-digit mobile number"
        )
        .required(
          " Phone number is required"
        ),

    password:
      Yup.string()
        .min(
          6,
          " Password must be at least 6 characters"
        )
        .required(
          " Password is required"
        ),
  });

// ============================================
// ERROR TOAST
// ============================================

const showError = (
  message: string
) => {

  if (
    window.navigator?.vibrate
  ) {

    window.navigator.vibrate(50);
  }

  toast.error(message, {

    duration: 4000,

    position:
      "bottom-center",

    style: {

      background:
        "#FEE2E2",

      color:
        "#991B1B",
    },
  });
};

// ============================================
// FLOATING EMOJI
// ============================================

const FloatingEmoji = ({
  emoji,
  top,
  left,
  right,
  bottom,
  duration,
  delay,
}: any) => (

  <motion.div
    className="
      absolute
      text-5xl
      pointer-events-none
      select-none
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
      opacity: [0.2, 0.4, 0.2],
    }}
    transition={{
      duration,
      delay,
      repeat: Infinity,
      ease: "easeInOut",
    }}
  >

    {emoji}

  </motion.div>
);

// ============================================
// COMPONENT
// ============================================

export default function RegisterPage() {

  const router = useRouter();

  const [showPassword, setShowPassword] =
    useState(false);

  // ============================================
  // REGISTER
  // ============================================

  const handleRegister =
    async (
      values: RegisterData,
      {
        setSubmitting,
      }: {
        setSubmitting:
          (is: boolean) => void;
      }
    ) => {

      try {

        await registerUser({

          ...values,

          // ✅ ALWAYS STUDENT
          role: "student",
        });

        toast.success(
          "Account created successfully 🎉",
          {
            duration: 3000,
          }
        );

        router.push(
          `/verify-register?identifier=${values.email}`
        );

      } catch (error: any) {

        console.error(
          "Register error:",
          error
        );

        let errorMessage =
          "Registration failed";

        if (
          error?.response
            ?.data?.error
        ) {

          errorMessage =
            error.response
              .data.error;

        } else if (
          error?.message
        ) {

          errorMessage =
            error.message;
        }

        showError(errorMessage);

      } finally {

        setSubmitting(false);
      }
    };

  return (

    <>

      <Toaster />

      {/* ====================================== */}
      {/* PREMIUM BACKGROUND */}
      {/* ====================================== */}

      <div
        className="
          fixed
          inset-0
          -z-10
          bg-[radial-gradient(circle_at_top_left,_#6366F1,_transparent_35%),radial-gradient(circle_at_bottom_right,_#8B5CF6,_transparent_35%),linear-gradient(to_bottom_right,_#0F172A,_#111827,_#1E293B)]
        "
      />

      {/* FLOATING EMOJIS */}

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

      {/* ====================================== */}
      {/* MAIN */}
      {/* ====================================== */}

      <div
        className="
          flex
          min-h-screen
          items-center
          justify-center
          px-4
          py-10
        "
      >

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

          className="
            w-full
            max-w-md
          "
        >

          {/* CARD */}

          <div
            className="
              rounded-[32px]
              border
              border-white/10
              bg-white/10
              p-8
              shadow-2xl
              backdrop-blur-2xl
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
                  mb-4
                  text-6xl
                "
              >

                🚀

              </motion.div>

              <h1
                className="
                  text-5xl
                  font-black
                  tracking-tight
                  text-white
                "
              >

                Join Knowmato

              </h1>

              <p
                className="
                  mt-3
                  text-sm
                  text-indigo-100
                "
              >

                ⚡ Learn smarter with instant doubt solving

              </p>

            </div>

            {/* FORM */}

            <Formik

              initialValues={{

                email: "",

                phone: "",

                password: "",

                role:"student",
              }}

              validationSchema={
                RegisterSchema
              }

              validateOnChange={false}

              validateOnBlur={true}

              onSubmit={
                handleRegister
              }
            >

              {({
                isSubmitting,
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

                      <span
                        className="
                          absolute
                          left-4
                          top-1/2
                          -translate-y-1/2
                          text-xl
                        "
                      >


                      </span>

                      <Field
                        name="email"
                        type="email"
                        placeholder="Email address"
                        className={`
                          w-full
                          rounded-2xl
                          border
                          ${
                            errors.email &&
                            touched.email

                              ? 'border-red-400'

                              : 'border-white/10'
                          }
                          bg-white/10
                          py-4
                          pl-12
                          pr-4
                          text-white
                          placeholder:text-gray-300
                          outline-none
                          backdrop-blur-xl
                          transition
                          focus:border-indigo-400
                          focus:ring-2
                          focus:ring-indigo-500/30
                        `}
                        disabled={
                          isSubmitting
                        }
                      />

                    </div>

                    <ErrorMessage
                      name="email"
                      component="div"
                      className="
                        mt-1
                        text-xs
                        text-red-300
                      "
                    />

                  </div>

                  {/* PHONE */}

                  <div>

                    <div
                      className="
                        relative
                      "
                    >

                      <span
                        className="
                          absolute
                          left-4
                          top-1/2
                          -translate-y-1/2
                          text-xl
                        "
                      >

                      </span>

                      <span
                        className="
                          absolute
                          left-12
                          top-1/2
                          -translate-y-1/2
                          text-sm
                          text-gray-300
                        "
                      >

                        🇮🇳 +91

                      </span>

                      <Field
                        name="phone"
                        type="tel"
                        placeholder="Mobile number"
                        className={`
                          w-full
                          rounded-2xl
                          border
                          ${
                            errors.phone &&
                            touched.phone

                              ? 'border-red-400'

                              : 'border-white/10'
                          }
                          bg-white/10
                          py-4
                          pl-28
                          pr-4
                          text-white
                          placeholder:text-gray-300
                          outline-none
                          backdrop-blur-xl
                          transition
                          focus:border-indigo-400
                          focus:ring-2
                          focus:ring-indigo-500/30
                        `}
                        disabled={
                          isSubmitting
                        }
                      />

                    </div>

                    <ErrorMessage
                      name="phone"
                      component="div"
                      className="
                        mt-1
                        text-xs
                        text-red-300
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

                      <span
                        className="
                          absolute
                          left-4
                          top-1/2
                          -translate-y-1/2
                          text-xl
                        "
                      >


                      </span>

                      <Field
                        name="password"
                        type={
                          showPassword
                            ? 'text'
                            : 'password'
                        }
                        placeholder="Password"
                        className={`
                          w-full
                          rounded-2xl
                          border
                          ${
                            errors.password &&
                            touched.password

                              ? 'border-red-400'

                              : 'border-white/10'
                          }
                          bg-white/10
                          py-4
                          pl-12
                          pr-12
                          text-white
                          placeholder:text-gray-300
                          outline-none
                          backdrop-blur-xl
                          transition
                          focus:border-indigo-400
                          focus:ring-2
                          focus:ring-indigo-500/30
                        `}
                        disabled={
                          isSubmitting
                        }
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
                          right-4
                          top-1/2
                          -translate-y-1/2
                          text-xl
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
                        text-red-300
                      "
                    />

                  </div>

                  {/* BUTTON */}

                  <motion.button

                    whileTap={{
                      scale: 0.98,
                    }}

                    type="submit"

                    disabled={
                      isSubmitting
                    }

                    className="
                      w-full
                      rounded-2xl
                      bg-gradient-to-r
                      from-indigo-500
                      via-purple-500
                      to-pink-500
                      py-4
                      font-bold
                      text-white
                      shadow-lg
                      transition
                      hover:scale-[1.01]
                      hover:shadow-purple-500/30
                      disabled:opacity-70
                    "
                  >

                    {isSubmitting

                      ? 'Creating Account...'

                      : 'Create Account ✨'}

                  </motion.button>

                  {/* FOOTER */}

                  <div
                    className="
                      pt-2
                      text-center
                      text-sm
                      text-gray-300
                    "
                  >

                    Already have an account?{" "}

                    <button
                      type="button"
                      onClick={() =>
                        router.push(
                          "/login"
                        )
                      }
                      className="
                        font-semibold
                        text-indigo-300
                        hover:text-indigo-200
                      "
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
