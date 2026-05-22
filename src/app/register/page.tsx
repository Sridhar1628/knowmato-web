"use client";

import { useState, useRef, useEffect, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Formik, Field, Form, ErrorMessage } from "formik";
import * as Yup from "yup";
import { registerUser, RegisterData } from "@/services/authService";
import toast, { Toaster } from "react-hot-toast";
import styles from "./RegisterScreen.module.css";

// Validation Schema (no username)
const RegisterSchema = Yup.object().shape({
  email: Yup.string()
    .email("📧 Please enter a valid email")
    .required("📧 Email is required"),
  phone: Yup.string()
    .matches(/^[6-9]\d{9}$/, "📱 Please enter a valid 10-digit mobile number")
    .required("📱 Phone number is required"),
  password: Yup.string()
    .min(6, "🔒 Password must be at least 6 characters")
    .required("🔒 Password is required"),
  role: Yup.string().oneOf(["student", "tutor"]).required(),
});

const showError = (message: string) => {
  // Optional haptic (vibrate on mobile)
  if (window.navigator?.vibrate) {
    window.navigator.vibrate(50);
  }
  toast.error(message, {
    duration: 4000,
    position: "bottom-center",
    style: { background: "#FEE2E2", color: "#991B1B" },
  });
};

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  const handleRegister = async (
    values: RegisterData,
    { setSubmitting }: { setSubmitting: (is: boolean) => void }
  ) => {
    try {
      await registerUser(values);
      toast.success("Account created! Please verify your email.", {
        duration: 3000,
      });
      router.push(`/verify-register?identifier=${values.email}`);
    } catch (error: any) {
      let errorMessage = "Registration failed. Please try again.";
      if (error?.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error?.message) {
        errorMessage = error.message;
      }
      showError(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Toaster />
      {/* Animated background and floating particles */}
      <div className={styles.animatedBg} />
      <div className={styles.particles}>
        {Array.from({ length: 8 }).map((_, i) => (
          <span
            key={i}
            className={styles.particle}
            style={{
              left: `${(i * 50) % 100}%`,
              animationDelay: `${i * 0.5}s`,
              fontSize: `${20 + (i % 3) * 6}px`,
            }}
          >
            {i % 2 === 0 ? "✨" : "⭐"}
          </span>
        ))}
      </div>

      <div className={styles.container}>
        <div className={styles.card}>
          {/* Header */}
          <div className={styles.header}>
            <span className={styles.headerEmoji}>🚀</span>
            <h1 className={styles.title}>Join Jeblio</h1>
            <p className={styles.subtitle}>Start your learning journey today</p>
          </div>

          <Formik
            initialValues={{
              email: "",
              phone: "",
              password: "",
              role: "student" as "student" | "tutor",
            }}
            validationSchema={RegisterSchema}
            validateOnChange={false}
            validateOnBlur={true}
            onSubmit={handleRegister}
          >
            {({ isSubmitting, values, setFieldValue, errors, touched }) => (
              <Form className={styles.form}>
                {/* Email */}
                <div className={styles.fieldGroup}>
                  <label className={styles.inputWrapper}>
                    <span className={styles.inputEmoji}>📧</span>
                    <div
                      className={`${styles.inputContainer} ${
                        errors.email && touched.email
                          ? styles.inputContainerError
                          : ""
                      }`}
                    >
                      <Field
                        name="email"
                        type="email"
                        placeholder="Email address"
                        className={styles.input}
                        disabled={isSubmitting}
                      />
                    </div>
                  </label>
                  <ErrorMessage
                    name="email"
                    component="div"
                    className={styles.errorText}
                  />
                </div>

                {/* Phone */}
                <div className={styles.fieldGroup}>
                  <label className={styles.inputWrapper}>
                    <span className={styles.inputEmoji}>📱</span>
                    <div
                      className={`${styles.inputContainer} ${
                        errors.phone && touched.phone
                          ? styles.inputContainerError
                          : ""
                      }`}
                    >
                      <span className={styles.countryCode}>🇮🇳 +91</span>
                      <Field
                        name="phone"
                        type="tel"
                        placeholder="Mobile number"
                        className={`${styles.input} ${styles.inputWithPrefix}`}
                        disabled={isSubmitting}
                      />
                    </div>
                  </label>
                  <ErrorMessage
                    name="phone"
                    component="div"
                    className={styles.errorText}
                  />
                </div>

                {/* Password */}
                <div className={styles.fieldGroup}>
                  <label className={styles.inputWrapper}>
                    <span className={styles.inputEmoji}>🔐</span>
                    <div
                      className={`${styles.inputContainer} ${
                        errors.password && touched.password
                          ? styles.inputContainerError
                          : ""
                      }`}
                    >
                      <Field
                        name="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Password"
                        className={styles.input}
                        disabled={isSubmitting}
                      />
                      <button
                        type="button"
                        className={styles.eyeIcon}
                        onClick={() => setShowPassword(!showPassword)}
                        tabIndex={-1}
                      >
                        {showPassword ? "🙈" : "👁️"}
                      </button>
                    </div>
                  </label>
                  <ErrorMessage
                    name="password"
                    component="div"
                    className={styles.errorText}
                  />
                </div>

                {/* Role Toggle */}
                <div className={styles.toggleWrapper}>
                  <p className={styles.roleLabel}>I am a:</p>
                  <div className={styles.toggleContainer}>
                    <div
                      className={`${styles.toggleIndicator} ${
                        values.role === "tutor" ? styles.toggleRight : ""
                      }`}
                    />
                    <button
                      type="button"
                      className={styles.toggleOption}
                      onClick={() => setFieldValue("role", "student")}
                      disabled={isSubmitting}
                    >
                      <span
                        className={`${styles.toggleEmoji} ${
                          values.role === "student" ? styles.activeEmoji : ""
                        }`}
                      >
                        🧑‍🎓
                      </span>
                      <span
                        className={`${styles.toggleText} ${
                          values.role === "student"
                            ? styles.toggleTextActive
                            : ""
                        }`}
                      >
                        Student
                      </span>
                    </button>
                    <button
                      type="button"
                      className={styles.toggleOption}
                      onClick={() => setFieldValue("role", "tutor")}
                      disabled={isSubmitting}
                    >
                      <span
                        className={`${styles.toggleEmoji} ${
                          values.role === "tutor" ? styles.activeEmoji : ""
                        }`}
                      >
                        👨‍🏫
                      </span>
                      <span
                        className={`${styles.toggleText} ${
                          values.role === "tutor" ? styles.toggleTextActive : ""
                        }`}
                      >
                        Tutor
                      </span>
                    </button>
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`${styles.submitButton} ${
                    isSubmitting ? styles.loading : ""
                  }`}
                >
                  {isSubmitting ? (
                    <span className={styles.spinner} />
                  ) : (
                    "Create Account ✨"
                  )}
                </button>

                {/* Footer link */}
                <div className={styles.footer}>
                  <a
                    href="/login"
                    onClick={(e) => {
                      e.preventDefault();
                      router.push("/login");
                    }}
                  >
                    🔙 Already have an account?{" "}
                    <span className={styles.linkBold}>Sign In</span>
                  </a>
                </div>
              </Form>
            )}
          </Formik>
        </div>
      </div>
    </>
  );
}