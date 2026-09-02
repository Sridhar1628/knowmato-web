// app/student/profile/page.tsx
"use client";

import { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import AlertService from "@/services/alertService";
import { useTranslation } from "react-i18next"; // ✅ added
import {
  getStudentProfile,
  buildStudentProfileFormData,
  updateStudentProfile,
  StudentProfile,
} from "@/services/v1Service";

// ========== Suggestion Options (not translated – they are proper names) ==========
const LANGUAGE_OPTIONS = [
  "English", "Hindi", "Bengali", "Telugu", "Marathi", "Tamil",
  "Urdu", "Gujarati", "Malayalam", "Kannada", "Odia", "Punjabi",
  "Assamese", "Maithili", "Sanskrit", "French", "German", "Spanish",
];

const SUBJECT_OPTIONS = [
  "Mathematics", "Physics", "Chemistry", "Biology", "Computer Science",
  "English Literature", "History", "Geography", "Economics", "Political Science",
  "Sociology", "Psychology", "Philosophy", "Business Studies", "Accounting",
  "Statistics", "Programming", "Data Science", "Machine Learning", "Finance",
  "Marketing", "Law", "Medicine", "Engineering", "Art", "Music", "Physical Education",
];

const LEARNING_GOAL_OPTIONS = [
  "Exam Preparation (JEE/NEET/UPSC)", "Board Exam Preparation", "University Semesters",
  "Competitive Programming", "Skill Development", "Career Transition",
  "Interview Preparation", "Language Fluency", "Hobby & Personal Interest",
  "Entrepreneurship", "Research Paper Writing", "School Homework Help",
];

const SESSION_TYPE_OPTIONS = [
  "One-on-One Live Video", "Group Live Session", "Text Chat", "Audio Call",
  "Whiteboard Collaboration", "Code Pairing", "Document Review", "Doubt Clearing",
];

const PREFERRED_TIME_OPTIONS = [
  "Morning (6 AM - 12 PM)", "Afternoon (12 PM - 4 PM)", "Evening (4 PM - 8 PM)",
  "Night (8 PM - 12 AM)", "Weekends Only", "Flexible / Anytime",
];

// ========== Autocomplete Chip Input Component ==========
const AutocompleteChipInput = ({
  items,
  onChange,
  placeholder,
  suggestions = [],
  label,
  addLabel, // ✅ new prop for translation
}: {
  items: string[];
  onChange: (items: string[]) => void;
  placeholder: string;
  suggestions?: string[];
  label: string;
  addLabel?: string; // ✅
}) => {
  const [input, setInput] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Filter suggestions based on input, excluding already selected items
  const availableSuggestions = suggestions.filter(
    (s) => !items.includes(s)
  );
  const filtered = input.trim()
    ? availableSuggestions.filter((s) =>
        s.toLowerCase().includes(input.toLowerCase())
      )
    : availableSuggestions;

  const showCustomAdd = input.trim().length > 0 && !filtered.includes(input.trim());

  const addItem = (value: string) => {
    const trimmed = value.trim();
    if (trimmed && !items.includes(trimmed)) {
      onChange([...items, trimmed]);
    }
    setInput("");
    setIsOpen(false);
    setActiveIndex(-1);
    inputRef.current?.focus();
  };

  const removeItem = (item: string) => {
    onChange(items.filter((i) => i !== item));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (activeIndex >= 0 && filtered.length > 0) {
        addItem(filtered[activeIndex]);
      } else if (showCustomAdd) {
        addItem(input);
      } else if (input.trim()) {
        addItem(input);
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (!isOpen) {
        setIsOpen(true);
        setActiveIndex(0);
      } else {
        setActiveIndex((prev) =>
          prev < (showCustomAdd ? filtered.length : filtered.length - 1) ? prev + 1 : 0
        );
      }
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (!isOpen) {
        setIsOpen(true);
        setActiveIndex(filtered.length - 1);
      } else {
        setActiveIndex((prev) =>
          prev > 0 ? prev - 1 : (showCustomAdd ? filtered.length : filtered.length - 1)
        );
      }
    } else if (e.key === "Escape") {
      setIsOpen(false);
      setActiveIndex(-1);
    } else if (e.key === "Backspace" && !input && items.length > 0) {
      removeItem(items[items.length - 1]);
    }
  };

  const handleFocus = () => {
    setIsOpen(true);
    setActiveIndex(-1);
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setActiveIndex(-1);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="w-full">
      {label && (
        <p className="text-sm font-medium text-white/80 mb-2">{label}</p>
      )}
      <div ref={dropdownRef} className="relative">
        <div className="flex flex-wrap items-center gap-2 border-2 border-white/20 rounded-xl px-3 py-2 bg-gray-900/60 focus-within:ring-4 focus-within:ring-violet-500/50 focus-within:border-violet-400 transition">
          {items.map((item, idx) => (
            <span
              key={idx}
              className="inline-flex items-center gap-1 bg-violet-400/20 text-violet-300 border border-violet-400/40 px-2.5 py-0.5 rounded-full text-sm font-medium"
            >
              {item}
              <button
                type="button"
                onClick={() => removeItem(item)}
                className="hover:text-rose-400 ml-1"
              >
                ×
              </button>
            </span>
          ))}
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={handleFocus}
            placeholder={items.length === 0 ? placeholder : ""}
            className="flex-1 min-w-[120px] outline-none text-sm bg-transparent text-white placeholder-white/40"
          />
        </div>

        {/* Dropdown Suggestions */}
        {isOpen && (filtered.length > 0 || showCustomAdd) && (
          <div className="absolute z-20 mt-1 w-full max-h-48 overflow-y-auto rounded-xl bg-gray-900/90 backdrop-blur-lg border border-white/20 shadow-2xl">
            {filtered.map((suggestion, idx) => (
              <div
                key={suggestion}
                onMouseDown={(e) => {
                  e.preventDefault();
                  addItem(suggestion);
                }}
                onMouseEnter={() => setActiveIndex(idx)}
                className={`px-4 py-2 text-sm cursor-pointer transition ${
                  idx === activeIndex
                    ? "bg-violet-500/30 text-white"
                    : "text-white/70 hover:bg-white/10"
                }`}
              >
                {suggestion}
              </div>
            ))}
            {showCustomAdd && (
              <div
                onMouseDown={(e) => {
                  e.preventDefault();
                  addItem(input);
                }}
                onMouseEnter={() => setActiveIndex(filtered.length)}
                className={`px-4 py-2 text-sm cursor-pointer transition ${
                  activeIndex === filtered.length
                    ? "bg-violet-500/30 text-white"
                    : "text-violet-300 hover:bg-white/10"
                } flex items-center gap-2`}
              >
                <span>✨</span> {addLabel || "Add"} "{input.trim()}"
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// ---------- Skeleton Loader ----------
const ProfileSkeleton = () => (
  <div className="space-y-6 animate-pulse">
    <div className="h-8 w-1/3 bg-white/10 rounded" />
    <div className="h-40 bg-white/10 rounded-2xl" />
    {[...Array(6)].map((_, i) => (
      <div key={i} className="h-40 bg-white/10 rounded-2xl" />
    ))}
  </div>
);

export default function StudentProfilePage() {
  const { t } = useTranslation(); // ✅

  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profilePhoto, setProfilePhoto] = useState<File | null>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await getStudentProfile();
        const response = res as any;
        const data = response?.data?.data ?? response?.data ?? res;

        if (data) {
          setProfile({
            ...data,
            preferred_languages: Array.isArray(data.preferred_languages)
              ? data.preferred_languages
              : [],
            subjects: Array.isArray(data.subjects) ? data.subjects : [],
            learning_goals: Array.isArray(data.learning_goals)
              ? data.learning_goals
              : [],
            session_types: Array.isArray(data.session_types)
              ? data.session_types
              : [],
            preferred_time: Array.isArray(data.preferred_time)
              ? data.preferred_time
              : [],
            full_name: data.full_name ?? "",
            email: data.email ?? "",
            mobile_number: data.mobile_number ?? "",
            education_level: data.education_level ?? "",
            grade_year: data.grade_year ?? "",
            stream_category: data.stream_category ?? "",
            stream: data.stream ?? "",
            skill_level: data.skill_level ?? "",
            about_learning: data.about_learning ?? "",
          });
        }
      } catch (err: any) {
        AlertService.error(
          t("studentProfile.loadErrorTitle", {
            defaultValue: "Unable to Load Profile",
          }),
          t("studentProfile.loadError", {
            defaultValue: "Failed to load your profile. Please try again.",
          }),
        );
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [t]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setSaving(true);
    try {
      const formData = buildStudentProfileFormData(
        {
          full_name: profile.full_name.trim(),
          email: profile.email.trim(),
          mobile_number: profile.mobile_number.trim(),
          education_level: profile.education_level.trim(),
          grade_year: profile.grade_year.trim(),
          stream_category: profile.stream_category.trim(),
          stream: profile.stream.trim(),
          preferred_languages: profile.preferred_languages,
          subjects: profile.subjects,
          learning_goals: profile.learning_goals,
          session_types: profile.session_types,
          preferred_time: profile.preferred_time,
          skill_level: profile.skill_level.trim(),
          about_learning: profile.about_learning.trim(),
        },
        profilePhoto
      );
      await updateStudentProfile(formData);
      AlertService.success(
        t("studentProfile.updateSuccessTitle", {
          defaultValue: "Profile Updated",
        }),
        t("studentProfile.updated", {
          defaultValue: "Your profile has been updated successfully.",
        }),
      );
    } catch (err: any) {
      AlertService.error(
        t("studentProfile.updateFailedTitle", {
          defaultValue: "Update Failed",
        }),
        err?.response?.data?.error ||
          t("studentProfile.updateFailed", {
            defaultValue: "Failed to update your profile. Please try again.",
          }),
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e] relative overflow-hidden p-6">
        <div className="absolute top-0 -left-20 w-72 h-72 bg-purple-500/20 rounded-full mix-blend-multiply filter blur-3xl animate-blob" />
        <div className="absolute top-0 -right-20 w-72 h-72 bg-fuchsia-500/20 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000" />
        <div className="absolute -bottom-20 left-40 w-72 h-72 bg-cyan-500/20 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000" />
        <div className="max-w-4xl mx-auto relative z-10">
          <ProfileSkeleton />
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e] flex items-center justify-center">
        <p className="text-white/70">{t("studentProfile.notFound")}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e] relative overflow-hidden p-4 sm:p-6 lg:p-8">
      {/* Animated background blobs */}
      <div className="absolute top-0 -left-20 w-72 h-72 bg-purple-500/20 rounded-full mix-blend-multiply filter blur-3xl animate-blob" />
      <div className="absolute top-0 -right-20 w-72 h-72 bg-fuchsia-500/20 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000" />
      <div className="absolute -bottom-20 left-40 w-72 h-72 bg-cyan-500/20 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000" />

      <div className="max-w-4xl mx-auto relative z-10">
        <motion.form
          onSubmit={handleSubmit}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-6"
        >
          {/* Header */}
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl flex flex-col sm:flex-row items-center gap-4">
            <div className="relative">
              {profile.profile_photo ? (
                <img
                  src={profile.profile_photo}
                  alt="Profile"
                  className="w-20 h-20 rounded-full object-cover border-2 border-violet-400/50 shadow-lg"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-2xl font-bold text-white shadow-lg">
                  {profile.full_name?.charAt(0).toUpperCase() || "S"}
                </div>
              )}
            </div>
            <div className="text-center sm:text-left">
              <h1 className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-violet-300 to-fuchsia-300">
                {profile.full_name}
              </h1>
              <p className="text-white/70">{profile.email}</p>
              <div className="flex gap-2 mt-2 justify-center sm:justify-start">
                <span
                  className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${
                    profile.profile_completed
                      ? "bg-emerald-400/20 text-emerald-300 border-emerald-400/40"
                      : "bg-amber-400/20 text-amber-300 border-amber-400/40"
                  }`}
                >
                  {profile.profile_completed
                    ? t("studentProfile.complete")
                    : t("studentProfile.incomplete")}
                </span>
              </div>
            </div>
          </div>

          {/* Personal Information */}
          <Section title={t("studentProfile.personalInfo")}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field
                label={t("studentProfile.fullName")}
                value={profile.full_name}
                onChange={(v) => setProfile({ ...profile, full_name: v })}
              />
              <Field
                label={t("studentProfile.email")}
                value={profile.email}
                onChange={(v) => setProfile({ ...profile, email: v })}
                type="email"
              />
              <Field
                label={t("studentProfile.mobileNumber")}
                value={profile.mobile_number}
                onChange={(v) => setProfile({ ...profile, mobile_number: v })}
                type="tel"
              />
            </div>
          </Section>

          {/* Education */}
          <Section title={t("studentProfile.education")}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field
                label={t("studentProfile.educationLevel")}
                value={profile.education_level}
                onChange={(v) => setProfile({ ...profile, education_level: v })}
              />
              <Field
                label={t("studentProfile.gradeYear")}
                value={profile.grade_year}
                onChange={(v) => setProfile({ ...profile, grade_year: v })}
              />
              <Field
                label={t("studentProfile.streamCategory")}
                value={profile.stream_category}
                onChange={(v) => setProfile({ ...profile, stream_category: v })}
              />
              <Field
                label={t("studentProfile.stream")}
                value={profile.stream}
                onChange={(v) => setProfile({ ...profile, stream: v })}
              />
            </div>
          </Section>

          {/* Learning Preferences */}
          <Section title={t("studentProfile.learningPreferences")}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field
                label={t("studentProfile.skillLevel")}
                value={profile.skill_level}
                onChange={(v) => setProfile({ ...profile, skill_level: v })}
              />
            </div>

            <div className="mt-6 space-y-6">
              <AutocompleteChipInput
                label={t("studentProfile.languagesLabel")}
                items={profile.preferred_languages || []}
                onChange={(items) => setProfile({ ...profile, preferred_languages: items })}
                suggestions={LANGUAGE_OPTIONS}
                placeholder={t("studentProfile.languagesPlaceholder")}
                addLabel={t("studentProfile.add")}
              />
              <AutocompleteChipInput
                label={t("studentProfile.subjectsLabel")}
                items={profile.subjects || []}
                onChange={(items) => setProfile({ ...profile, subjects: items })}
                suggestions={SUBJECT_OPTIONS}
                placeholder={t("studentProfile.subjectsPlaceholder")}
                addLabel={t("studentProfile.add")}
              />
              <AutocompleteChipInput
                label={t("studentProfile.goalsLabel")}
                items={profile.learning_goals || []}
                onChange={(items) => setProfile({ ...profile, learning_goals: items })}
                suggestions={LEARNING_GOAL_OPTIONS}
                placeholder={t("studentProfile.goalsPlaceholder")}
                addLabel={t("studentProfile.add")}
              />
              <AutocompleteChipInput
                label={t("studentProfile.sessionTypesLabel")}
                items={profile.session_types || []}
                onChange={(items) => setProfile({ ...profile, session_types: items })}
                suggestions={SESSION_TYPE_OPTIONS}
                placeholder={t("studentProfile.sessionTypesPlaceholder")}
                addLabel={t("studentProfile.add")}
              />
              <AutocompleteChipInput
                label={t("studentProfile.preferredTimeLabel")}
                items={profile.preferred_time || []}
                onChange={(items) => setProfile({ ...profile, preferred_time: items })}
                suggestions={PREFERRED_TIME_OPTIONS}
                placeholder={t("studentProfile.preferredTimePlaceholder")}
                addLabel={t("studentProfile.add")}
              />
            </div>
          </Section>

          {/* About Learning */}
          <Section title={t("studentProfile.aboutLearning")}>
            <textarea
              className="w-full border-2 border-white/20 rounded-xl p-3 min-h-[120px] bg-gray-900/60 text-white placeholder-white/40 focus:ring-4 focus:ring-violet-500/50 focus:border-violet-400 outline-none transition"
              placeholder={t("studentProfile.aboutLearningPlaceholder")}
              value={profile.about_learning}
              onChange={(e) => setProfile({ ...profile, about_learning: e.target.value })}
            />
          </Section>

          {/* Save Button */}
          <div className="sticky bottom-4 flex justify-end">
            <motion.button
              type="submit"
              disabled={saving}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="px-8 py-3 bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:from-violet-600 hover:to-fuchsia-600 text-white font-bold rounded-xl shadow-lg shadow-violet-500/25 transition disabled:opacity-60 flex items-center gap-2"
            >
              {saving ? t("studentProfile.saving") : t("studentProfile.saveProfile")}
            </motion.button>
          </div>
        </motion.form>
      </div>
    </div>
  );
}

// ---------- Reusable UI Components ----------
const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl">
    <h2 className="text-lg font-bold text-white mb-4">{title}</h2>
    {children}
  </div>
);

const Field = ({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
}) => (
  <div>
    <label className="block text-sm font-medium text-white/70 mb-1">{label}</label>
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full border-2 border-white/20 rounded-xl px-4 py-2.5 bg-gray-900/60 text-white placeholder-white/40 focus:ring-4 focus:ring-violet-500/50 focus:border-violet-400 outline-none transition"
    />
  </div>
);