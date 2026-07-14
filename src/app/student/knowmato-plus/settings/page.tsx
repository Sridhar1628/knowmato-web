// app/student/settings/page.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useRouter } from "next/navigation";
import { RootState } from "@/redux/store";
import { setLanguage } from "@/redux/slices/authSlice";
import { saveLanguage, AppLanguage } from "@/services/languageService";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";

// Optional: API call to save language preference (pseudo)
// import { updateLanguagePreference } from "@/services/v1Service";

export default function SettingsPage() {
  const { t, i18n } = useTranslation();
  const dispatch = useDispatch();
  const router = useRouter();
  const language = useSelector((state: RootState) => (state as RootState).auth.language || "en");

  // UI toggles (placeholder – you can integrate real functionality later)
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(true);
  const [autoStart, setAutoStart] = useState(false);

  const [showLegal, setShowLegal] =
  useState(false);

  const legalPages = [
    {
      icon: "ℹ️",
      title: "About KnowMato",
      route: "/student/legal/about",
    },

    {
      icon: "📜",
      title: "Terms & Conditions",
      route: "/student/legal/terms",
    },

    {
      icon: "🔒",
      title: "Privacy Policy",
      route: "/student/legal/privacy",
    },

    {
      icon: "🛡",
      title: "Community Guidelines",
      route: "/student/legal/community-guidelines",
    },

    {
      icon: "💳",
      title: "Credits Policy",
      route: "/student/legal/credits-policy",
    },

    {
      icon: "💰",
      title: "Refund & Cancellation Policy",
      route: "/student/legal/refund-policy",
    },

    {
      icon: "🤖",
      title: "AI Usage Policy",
      route: "/student/legal/ai-policy",
    },

    {
      icon: "👨‍🎓",
      title: "Student Guidelines",
      route: "/student/legal/student-guidelines",
    },

    {
      icon: "👨‍🏫",
      title: "Mentor Guidelines",
      route: "/student/legal/mentor-guidelines",
    },

    {
      icon: "🏫",
      title: "Institution Policy",
      route: "/student/legal/institution-policy",
    },

    {
      icon: "🏢",
      title: "Company / Recruiter Policy",
      route: "/student/legal/company-policy",
    },

    {
      icon: "❓",
      title: "Help & Support",
      route: "/student/legal/help",
    },

    {
      icon: "❔",
      title: "Frequently Asked Questions",
      route: "/student/legal/faq",
    },

    {
      icon: "📄",
      title: "Open Source Licenses",
      route: "/student/legal/licenses",
    },
  ];

  // Handle language change
  const handleLanguageChange = async (
    lang: AppLanguage
  ) => {
    try {
      // Save locally
      saveLanguage(lang);

      // Update i18next immediately
      await i18n.changeLanguage(lang);

      // Update Redux
      dispatch(setLanguage(lang));

      toast.success(
        lang === "ta"
          ? "மொழி தமிழுக்கு மாற்றப்பட்டது"
          : "Language changed to English",
        {
          icon: "🌐",
        }
      );
    } catch (error) {
      console.error(error);

      toast.error(
        "Failed to change language."
      );
    }
  };

  const handleLogout = () => {
    const confirmLogout = window.confirm(
      t("settings.logoutConfirm") || "Are you sure you want to logout?"
    );
    if (confirmLogout) {
      // Clear auth state (depends on your Redux setup)
      // dispatch(logoutAction());
      router.push("/login");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e] relative overflow-hidden">
      {/* Animated background blobs */}
      <div className="absolute top-0 -left-20 w-72 h-72 bg-purple-500/20 rounded-full mix-blend-multiply filter blur-3xl animate-blob" />
      <div className="absolute top-0 -right-20 w-72 h-72 bg-fuchsia-500/20 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000" />
      <div className="absolute -bottom-20 left-40 w-72 h-72 bg-cyan-500/20 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000" />

      <div className="relative z-10 max-w-2xl mx-auto px-4 py-10 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 text-center sm:text-left">
          <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-violet-300 via-fuchsia-300 to-cyan-300">
            ⚙️ {t("sidebar.settings", "Settings")}
          </h1>
          <p className="mt-1 text-white/70">{t("settings.subtitle", "Manage your preferences and account")}</p>
        </div>

        <div className="space-y-6">
          {/* Language Section */}
          <div className="rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 p-6 shadow-2xl">
            <h2 className="text-lg font-semibold text-white/90 mb-4">
              🌐 {t("settings.language", "Language")}
            </h2>
            <div className="flex gap-3">
              <button
                onClick={() => handleLanguageChange("en")}
                className={`flex-1 py-3 rounded-xl font-semibold text-sm transition ${
                  language === "en"
                    ? "bg-violet-500/30 border-violet-400 text-white border"
                    : "bg-white/5 border border-white/10 text-white/60 hover:bg-white/10"
                }`}
              >
                🇬🇧 English
              </button>
              <button
                onClick={() => handleLanguageChange("ta")}
                className={`flex-1 py-3 rounded-xl font-semibold text-sm transition ${
                  language === "ta"
                    ? "bg-violet-500/30 border-violet-400 text-white border"
                    : "bg-white/5 border border-white/10 text-white/60 hover:bg-white/10"
                }`}
              >
                🇮🇳 தமிழ்
              </button>
            </div>
          </div>

          {/* Preferences Section */}
          <div className="rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 p-6 shadow-2xl">
            <h2 className="text-lg font-semibold text-white/90 mb-4">
              🎛️ {t("settings.preferences", "Preferences")}
            </h2>
            <div className="space-y-4">
              <ToggleRow
                icon="🔔"
                label={t("settings.notifications", "Notifications")}
                value={notifications}
                onChange={setNotifications}
              />
              <ToggleRow
                icon="🌙"
                label={t("settings.darkMode", "Dark Mode")}
                value={darkMode}
                onChange={setDarkMode}
              />
              <ToggleRow
                icon="🚀"
                label={t("settings.autoStart", "Auto-start Learning")}
                value={autoStart}
                onChange={setAutoStart}
              />
            </div>
          </div>

          <div className="rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 p-6 shadow-2xl">

            <button
              onClick={() =>
                setShowLegal(!showLegal)
              }
              className="w-full flex items-center justify-between"
            >
              <h2 className="text-lg font-semibold text-white">

                📘 Legal & Policies

              </h2>

              <span className="text-white/60">

                {showLegal ? "▲" : "▼"}

              </span>
            </button>

            {showLegal && (

              <div className="mt-5 space-y-2">
                {legalPages.map((item) => (

                    <AboutRow

                      key={item.route}

                      label={`${item.icon} ${item.title}`}

                      isLink

                      onClick={() =>
                        router.push(item.route)
                      }

                    />

                  ))}

              </div>

            )}

          </div>
          {/* Logout */}
          <button
            onClick={handleLogout}
            className="w-full rounded-2xl bg-red-500/15 border border-red-400/30 p-4 text-center font-semibold text-red-400 hover:bg-red-500/20 transition"
          >
            {t("sidebar.logout", "Logout")}
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------- Reusable Components ----------

function ToggleRow({
  icon,
  label,
  value,
  onChange,
}: {
  icon: string;
  label: string;
  value: boolean;
  onChange: (val: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between py-2">
      <div className="flex items-center gap-3">
        <span className="text-xl">{icon}</span>
        <span className="text-white/80 font-medium">{label}</span>
      </div>
      <button
        onClick={() => onChange(!value)}
        className={`relative w-12 h-7 rounded-full transition-colors duration-200 ${
          value ? "bg-violet-500" : "bg-white/20"
        }`}
      >
        <span
          className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200 ${
            value ? "left-6" : "left-1"
          }`}
        />
      </button>
    </div>
  );
}

function AboutRow({
  label,
  value,
  isLink,
  onClick,
}: {
  label: string;
  value?: string;
  isLink?: boolean;
  onClick?: () => void;
}) {
  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-white/80 font-medium">{label}</span>
      {isLink ? (
        <button onClick={onClick} className="text-violet-400 hover:text-violet-300 transition">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      ) : (
        <span className="text-white/40 text-sm">{value}</span>
      )}
    </div>
  );
}