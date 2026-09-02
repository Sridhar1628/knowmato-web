// app/student/settings/page.tsx
"use client";

import { useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useRouter } from "next/navigation";
import { RootState } from "@/redux/store";
import { setLanguage } from "@/redux/slices/authSlice";
import {
  saveLanguage,
  AppLanguage,
} from "@/services/languageService";
import { useTranslation } from "react-i18next";
import AlertService from "@/services/alertService";

export default function SettingsPage() {
  const { t, i18n } = useTranslation();
  const dispatch = useDispatch();
  const router = useRouter();

  const language = useSelector(
    (state: RootState) => state.auth.language || "en"
  );

  // UI toggles
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(true);
  const [autoStart, setAutoStart] = useState(false);

  const [showLegal, setShowLegal] = useState(false);

  // Legal page items
  const legalPages = [
    { icon: "ℹ️", key: "legal.about" },
    { icon: "📜", key: "legal.terms" },
    { icon: "🔒", key: "legal.privacy" },
    { icon: "🛡", key: "legal.communityGuidelines" },
    { icon: "💳", key: "legal.creditsPolicy" },
    { icon: "💰", key: "legal.refundPolicy" },
    { icon: "🤖", key: "legal.aiPolicy" },
    { icon: "👨‍🎓", key: "legal.studentGuidelines" },
    { icon: "👨‍🏫", key: "legal.mentorGuidelines" },
    { icon: "🏫", key: "legal.institutionPolicy" },
    { icon: "🏢", key: "legal.companyPolicy" },
    { icon: "❓", key: "legal.help" },
    { icon: "❔", key: "legal.faq" },
    { icon: "📄", key: "legal.licenses" },
  ];

  // =========================================================
  // LANGUAGE CHANGE
  // =========================================================

  const handleLanguageChange = async (lang: AppLanguage) => {
    if (lang === language) {
      return;
    }

    try {
      saveLanguage(lang);

      await i18n.changeLanguage(lang);

      dispatch(setLanguage(lang));

      AlertService.success(
        t(
          `settings.languageChangedTo${
            lang === "ta" ? "Tamil" : "English"
          }`
        ),
        lang === "ta"
          ? "தமிழ் மொழி வெற்றிகரமாக மாற்றப்பட்டது."
          : "Your language has been changed to English successfully."
      );
    } catch (error) {
      console.error("Language change error:", error);

      AlertService.error(
        t("settings.languageChangeFailed"),
        "Unable to change the language. Please try again."
      );
    }
  };

  // =========================================================
  // LOGOUT
  // =========================================================

  const handleLogout = () => {
    AlertService.confirm(
      t("settings.logout"),
      t("settings.logoutConfirm"),
      [
        {
          text: t("common.cancel") || "Cancel",
          style: "cancel",
        },
        {
          text: t("sidebar.logout") || "Logout",
          style: "destructive",
          onPress: () => {
            router.push("/login");
          },
        },
      ]
    );
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e]">
      {/* =====================================================
          ANIMATED BACKGROUND BLOBS
      ====================================================== */}

      <div className="absolute top-0 -left-20 h-72 w-72 animate-blob rounded-full bg-purple-500/20 mix-blend-multiply blur-3xl filter" />

      <div className="animation-delay-2000 absolute top-0 -right-20 h-72 w-72 animate-blob rounded-full bg-fuchsia-500/20 mix-blend-multiply blur-3xl filter" />

      <div className="animation-delay-4000 absolute -bottom-20 left-40 h-72 w-72 animate-blob rounded-full bg-cyan-500/20 mix-blend-multiply blur-3xl filter" />

      {/* =====================================================
          MAIN CONTENT
      ====================================================== */}

      <div className="relative z-10 mx-auto max-w-2xl px-4 py-10 sm:px-6 lg:px-8">
        {/* ===================================================
            HEADER
        ==================================================== */}

        <div className="mb-8 text-center sm:text-left">
          <h1 className="bg-gradient-to-r from-violet-300 via-fuchsia-300 to-cyan-300 bg-clip-text text-3xl font-extrabold text-transparent">
            ⚙️ {t("sidebar.settings")}
          </h1>

          <p className="mt-1 text-white/70">
            {t("settings.subtitle")}
          </p>
        </div>

        <div className="space-y-6">
          {/* =================================================
              LANGUAGE SECTION
          ================================================== */}

          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur-xl">
            <h2 className="mb-4 text-lg font-semibold text-white/90">
              🌐 {t("settings.language")}
            </h2>

            <div className="flex gap-3">
              {/* English */}

              <button
                type="button"
                disabled={language === "en"}
                onClick={() => handleLanguageChange("en")}
                className={`flex-1 rounded-xl py-3 text-sm font-semibold transition ${
                  language === "en"
                    ? "cursor-default border border-violet-400 bg-violet-500/30 text-white"
                    : "border border-white/10 bg-white/5 text-white/60 hover:bg-white/10"
                }`}
              >
                🇬🇧 English
              </button>

              {/* Tamil */}

              <button
                type="button"
                disabled={language === "ta"}
                onClick={() => handleLanguageChange("ta")}
                className={`flex-1 rounded-xl py-3 text-sm font-semibold transition ${
                  language === "ta"
                    ? "cursor-default border border-violet-400 bg-violet-500/30 text-white"
                    : "border border-white/10 bg-white/5 text-white/60 hover:bg-white/10"
                }`}
              >
                🇮🇳 தமிழ்
              </button>
            </div>
          </div>

          {/* =================================================
              PREFERENCES SECTION
          ================================================== */}

          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur-xl">
            <h2 className="mb-4 text-lg font-semibold text-white/90">
              🎛️ {t("settings.preferences")}
            </h2>

            <div className="space-y-4">
              <ToggleRow
                icon="🔔"
                label={t("settings.notifications")}
                value={notifications}
                onChange={setNotifications}
              />

              {/*
              <ToggleRow
                icon="🌙"
                label={t("settings.darkMode")}
                value={darkMode}
                onChange={setDarkMode}
              />

              <ToggleRow
                icon="🚀"
                label={t("settings.autoStart")}
                value={autoStart}
                onChange={setAutoStart}
              />
              */}
            </div>
          </div>

          {/* =================================================
              LEGAL & POLICIES
          ================================================== */}

          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur-xl">
            <button
              type="button"
              onClick={() => setShowLegal(!showLegal)}
              className="flex w-full items-center justify-between"
            >
              <h2 className="text-lg font-semibold text-white">
                📘 {t("settings.legalAndPolicies")}
              </h2>

              <span className="text-white/60">
                {showLegal ? "▲" : "▼"}
              </span>
            </button>

            {showLegal && (
              <div className="mt-5 space-y-2">
                {legalPages.map((item) => (
                  <AboutRow
                    key={item.key}
                    label={`${item.icon} ${t(item.key)}`}
                    isLink
                    onClick={() =>
                      router.push(
                        `/student/legal/${
                          item.key.split(".")[1]
                        }`
                      )
                    }
                  />
                ))}
              </div>
            )}
          </div>

          {/* =================================================
              LOGOUT
          ================================================== */}

          <button
            type="button"
            onClick={handleLogout}
            className="w-full rounded-2xl border border-red-400/30 bg-red-500/15 p-4 text-center font-semibold text-red-400 transition hover:bg-red-500/20"
          >
            {t("sidebar.logout")}
          </button>
        </div>
      </div>

      {/* =====================================================
          BLOB ANIMATION
      ====================================================== */}

      <style jsx>{`
        @keyframes blob {
          0% {
            transform: translate(0px, 0px) scale(1);
          }

          33% {
            transform: translate(30px, -50px) scale(1.1);
          }

          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }

          100% {
            transform: translate(0px, 0px) scale(1);
          }
        }

        .animate-blob {
          animation: blob 7s infinite;
        }

        .animation-delay-2000 {
          animation-delay: 2s;
        }

        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
}

// ============================================================
// TOGGLE ROW
// ============================================================

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

        <span className="font-medium text-white/80">
          {label}
        </span>
      </div>

      <button
        type="button"
        aria-pressed={value}
        onClick={() => onChange(!value)}
        className={`relative h-7 w-12 rounded-full transition-colors duration-200 ${
          value ? "bg-violet-500" : "bg-white/20"
        }`}
      >
        <span
          className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-transform duration-200 ${
            value ? "left-6" : "left-1"
          }`}
        />
      </button>
    </div>
  );
}

// ============================================================
// ABOUT / LEGAL ROW
// ============================================================

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
      <span className="font-medium text-white/80">
        {label}
      </span>

      {isLink ? (
        <button
          type="button"
          onClick={onClick}
          className="text-violet-400 transition hover:text-violet-300"
          aria-label={label}
        >
          <svg
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 5l7 7-7 7"
            />
          </svg>
        </button>
      ) : (
        <span className="text-sm text-white/40">
          {value}
        </span>
      )}
    </div>
  );
}