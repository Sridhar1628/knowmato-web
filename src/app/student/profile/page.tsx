// app/student/profile/page.tsx
"use client";
import { API_HOST } from "@/config/env";
import { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import AlertService from "@/services/alertService";
import { useTranslation } from "react-i18next";

import {
  getStudentProfile,
  buildStudentProfileFormData,
  updateStudentProfile,
  StudentProfile,
} from "@/services/v1Service";

import { apiDelete } from "@/services/apiService";

// ⬇️ Import the profile API from userService that returns display_name
import { getProfile } from "@/services/userService";

// ========== Suggestion Options ==========
const LANGUAGE_OPTIONS = [
  "English",
  "Hindi",
  "Bengali",
  "Telugu",
  "Marathi",
  "Tamil",
  "Urdu",
  "Gujarati",
  "Malayalam",
  "Kannada",
  "Odia",
  "Punjabi",
  "Assamese",
  "Maithili",
  "Sanskrit",
  "French",
  "German",
  "Spanish",
];

const SUBJECT_OPTIONS = [
  "Mathematics",
  "Physics",
  "Chemistry",
  "Biology",
  "Computer Science",
  "English Literature",
  "History",
  "Geography",
  "Economics",
  "Political Science",
  "Sociology",
  "Psychology",
  "Philosophy",
  "Business Studies",
  "Accounting",
  "Statistics",
  "Programming",
  "Data Science",
  "Machine Learning",
  "Finance",
  "Marketing",
  "Law",
  "Medicine",
  "Engineering",
  "Art",
  "Music",
  "Physical Education",
];

const LEARNING_GOAL_OPTIONS = [
  "Exam Preparation (JEE/NEET/UPSC)",
  "Board Exam Preparation",
  "University Semesters",
  "Competitive Programming",
  "Skill Development",
  "Career Transition",
  "Interview Preparation",
  "Language Fluency",
  "Hobby & Personal Interest",
  "Entrepreneurship",
  "Research Paper Writing",
  "School Homework Help",
];

const SESSION_TYPE_OPTIONS = [
  "One-on-One Live Video",
  "Group Live Session",
  "Text Chat",
  "Audio Call",
  "Whiteboard Collaboration",
  "Code Pairing",
  "Document Review",
  "Doubt Clearing",
];

const PREFERRED_TIME_OPTIONS = [
  "Morning (6 AM - 12 PM)",
  "Afternoon (12 PM - 4 PM)",
  "Evening (4 PM - 8 PM)",
  "Night (8 PM - 12 AM)",
  "Weekends Only",
  "Flexible / Anytime",
];

// Public profile base URL
const PROFILE_PUBLIC_BASE = "https://www.knowmato.in/profile";

// ========== Autocomplete Chip Input Component ==========
const AutocompleteChipInput = ({
  items,
  onChange,
  placeholder,
  suggestions = [],
  label,
  addLabel,
  error,
  fieldKey,
  disabled = false,
}: {
  items: string[];
  onChange: (items: string[]) => void;
  placeholder: string;
  suggestions?: string[];
  label: string;
  addLabel?: string;
  error?: string;
  fieldKey?: string;
  disabled?: boolean;
}) => {
  const [input, setInput] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const availableSuggestions = suggestions.filter(
    (s) => !items.includes(s)
  );

  const filtered = input.trim()
    ? availableSuggestions.filter((s) =>
        s.toLowerCase().includes(input.toLowerCase())
      )
    : availableSuggestions;

  const showCustomAdd =
    input.trim().length > 0 &&
    !filtered.some(
      (item) => item.toLowerCase() === input.trim().toLowerCase()
    );

  const addItem = (value: string) => {
    if (disabled) return;

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
    if (disabled) return;

    onChange(items.filter((i) => i !== item));
  };

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (disabled) return;

    if (e.key === "Enter") {
      e.preventDefault();

      if (activeIndex >= 0 && activeIndex < filtered.length) {
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
        const maxIndex = showCustomAdd
          ? filtered.length
          : filtered.length - 1;

        setActiveIndex((prev) =>
          prev < maxIndex ? prev + 1 : 0
        );
      }
    } else if (e.key === "ArrowUp") {
      e.preventDefault();

      if (!isOpen) {
        setIsOpen(true);
        setActiveIndex(
          showCustomAdd
            ? filtered.length
            : filtered.length - 1
        );
      } else {
        const maxIndex = showCustomAdd
          ? filtered.length
          : filtered.length - 1;

        setActiveIndex((prev) =>
          prev > 0 ? prev - 1 : maxIndex
        );
      }
    } else if (e.key === "Escape") {
      setIsOpen(false);
      setActiveIndex(-1);
    } else if (
      e.key === "Backspace" &&
      !input &&
      items.length > 0
    ) {
      removeItem(items[items.length - 1]);
    }
  };

  const handleFocus = () => {
    if (disabled) return;

    setIsOpen(true);
    setActiveIndex(-1);
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
        setActiveIndex(-1);
      }
    };

    document.addEventListener(
      "mousedown",
      handleClickOutside
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleClickOutside
      );
    };
  }, []);

  useEffect(() => {
    if (disabled) {
      setIsOpen(false);
      setActiveIndex(-1);
      setInput("");
    }
  }, [disabled]);

  return (
    <div
      className="w-full"
      data-validation-field={fieldKey}
    >
      {label && (
        <p className="mb-2 text-sm font-medium text-white/80">
          {label}
          <span className="ml-1 text-rose-300">*</span>
        </p>
      )}

      <div
        ref={dropdownRef}
        className="relative"
      >
        <div
          className={`flex flex-wrap items-center gap-2 rounded-xl border-2 px-3 py-2 bg-gray-900/60 transition ${
            disabled
              ? "border-white/10 opacity-70 cursor-not-allowed"
              : "focus-within:ring-4"
          } ${
            !disabled && error
              ? "border-rose-400/70 focus-within:border-rose-400 focus-within:ring-rose-500/20"
              : ""
          } ${
            !disabled && !error
              ? "border-white/20 focus-within:border-violet-400 focus-within:ring-violet-500/50"
              : ""
          }`}
        >
          {items.map((item, idx) => (
            <span
              key={`${item}-${idx}`}
              className="inline-flex items-center gap-1 bg-violet-400/20 text-violet-300 border border-violet-400/40 px-2.5 py-0.5 rounded-full text-sm font-medium"
            >
              {item}

              {!disabled && (
                <button
                  type="button"
                  onClick={() => removeItem(item)}
                  className="hover:text-rose-400 ml-1"
                  aria-label={`Remove ${item}`}
                >
                  ×
                </button>
              )}
            </span>
          ))}

          {disabled ? (
            items.length === 0 ? (
              <span className="text-sm text-white/35">
                {placeholder}
              </span>
            ) : null
          ) : (
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
          )}
        </div>

        {!disabled &&
          isOpen &&
          (filtered.length > 0 || showCustomAdd) && (
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
                  onMouseEnter={() =>
                    setActiveIndex(filtered.length)
                  }
                  className={`px-4 py-2 text-sm cursor-pointer transition ${
                    activeIndex === filtered.length
                      ? "bg-violet-500/30 text-white"
                      : "text-violet-300 hover:bg-white/10"
                  } flex items-center gap-2`}
                >
                  <span>✨</span>
                  {addLabel || "Add"} "{input.trim()}"
                </div>
              )}
            </div>
          )}
      </div>

      {error && (
        <p className="mt-1.5 text-xs font-medium text-rose-300">
          {error}
        </p>
      )}
    </div>
  );
};

// ---------- Skeleton Loader ----------
const ProfileSkeleton = () => (
  <div className="space-y-6 animate-pulse">
    <div className="h-8 w-1/3 bg-white/10 rounded" />
    <div className="h-40 bg-white/10 rounded-2xl" />

    {[...Array(6)].map((_, i) => (
      <div
        key={i}
        className="h-40 bg-white/10 rounded-2xl"
      />
    ))}
  </div>
);

export default function StudentProfilePage() {
  const { t } = useTranslation();

  const [profile, setProfile] =
    useState<StudentProfile | null>(null);

  const getProfilePhotoUrl = (photo?: string | null) => {
    if (!photo) return null;

    if (photo.startsWith("http://") || photo.startsWith("https://")) {
      return photo;
    }

    return `${API_HOST}${photo.startsWith("/") ? photo : `/${photo}`}`;
  };

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  /*
   * ============================================================
   * EDIT MODE
   * ============================================================
   */
  const [isEditing, setIsEditing] = useState(false);
  const [originalProfile, setOriginalProfile] =
    useState<StudentProfile | null>(null);

  // Validation errors for every required field.
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string>
  >({});

  // Account deletion state.
  const [deletingAccount, setDeletingAccount] =
    useState(false);

  const [profilePhoto, setProfilePhoto] =
    useState<File | null>(null);

  const photoInputRef =
    useRef<HTMLInputElement>(null);

  // ============================================================
  // SHARE PROFILE STATE
  // ============================================================

  // display_name is loaded from accounts/profile/ (userService.getProfile)
  const [displayName, setDisplayName] = useState<string>("");

  // Whether we already copied the link (to show "Copied!" state)
  const [copied, setCopied] = useState(false);

  // Copy timer to reset "Copied!" state
  const copyResetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Build the shareable link from displayName
  const shareProfileUrl = displayName
    ? `${PROFILE_PUBLIC_BASE}/${encodeURIComponent(displayName)}`
    : "";

  // ============================================================
  // LOAD PROFILE
  // ============================================================

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await getStudentProfile();

        const response = res as any;

        const data =
          response?.data?.data ??
          response?.data ??
          res;

        if (data) {
          setProfile({
            ...data,

            preferred_languages:
              Array.isArray(data.preferred_languages)
                ? data.preferred_languages
                : [],

            subjects:
              Array.isArray(data.subjects)
                ? data.subjects
                : [],

            learning_goals:
              Array.isArray(data.learning_goals)
                ? data.learning_goals
                : [],

            session_types:
              Array.isArray(data.session_types)
                ? data.session_types
                : [],

            preferred_time:
              Array.isArray(data.preferred_time)
                ? data.preferred_time
                : [],

            full_name: data.full_name ?? "",
            email: data.email ?? "",
            mobile_number:
              data.mobile_number ?? "",

            education_level:
              data.education_level ?? "",

            grade_year:
              data.grade_year ?? "",

            stream_category:
              data.stream_category ?? "",

            stream: data.stream ?? "",

            skill_level:
              data.skill_level ?? "",

            about_learning:
              data.about_learning ?? "",
          });
        }
      } catch (err: any) {
        AlertService.error(
          t("studentProfile.loadErrorTitle", {
            defaultValue: "Unable to Load Profile",
          }),
          t("studentProfile.loadError", {
            defaultValue:
              "Failed to load your profile. Please try again.",
          })
        );
      } finally {
        setLoading(false);
      }
    };

    fetch();
  }, [t]);

  // ============================================================
  // LOAD DISPLAY NAME (for share link)
  // ============================================================

  useEffect(() => {
    const fetchDisplayName = async () => {
      try {
        const res = await getProfile();

        const response = res as any;

        /*
         * Backend returns:
         * {
         *   success: true,
         *   status: 200,
         *   message: "...",
         *   data: {
         *     user: { id, display_name, ... }
         *   }
         * }
         *
         * But we defensively handle other nesting shapes too.
         */
        const user =
          response?.data?.data?.user ??
          response?.data?.user ??
          response?.user ??
          null;

        const name: string =
          user?.display_name ??
          response?.data?.data?.display_name ??
          response?.data?.display_name ??
          "";

        if (typeof name === "string" && name.trim().length > 0) {
          setDisplayName(name.trim());
        }
      } catch (err) {
        // Silent failure — share block will simply hide.
        console.warn("Failed to load display_name for share link:", err);
      }
    };

    fetchDisplayName();
  }, []);

  // Cleanup copy reset timer on unmount
  useEffect(() => {
    return () => {
      if (copyResetTimer.current) {
        clearTimeout(copyResetTimer.current);
      }
    };
  }, []);

  // ============================================================
  // COPY PROFILE LINK
  // ============================================================

  const handleCopyLink = async () => {
    if (!shareProfileUrl) {
      AlertService.warning(
        "Link Unavailable",
        "We could not generate your profile link right now. Please try again later.",
        []
      );
      return;
    }

    const markCopied = () => {
      setCopied(true);
      if (copyResetTimer.current) {
        clearTimeout(copyResetTimer.current);
      }
      copyResetTimer.current = setTimeout(() => {
        setCopied(false);
      }, 2000);
    };

    try {
      // Preferred modern API — requires secure context (HTTPS/localhost).
      if (
        typeof navigator !== "undefined" &&
        navigator.clipboard &&
        window.isSecureContext
      ) {
        await navigator.clipboard.writeText(shareProfileUrl);
        markCopied();
        AlertService.success(
          "Link Copied",
          "Your public profile link has been copied to the clipboard."
        );
        return;
      }

      // Fallback for older browsers / non-secure contexts.
      const textarea = document.createElement("textarea");
      textarea.value = shareProfileUrl;
      textarea.setAttribute("readonly", "");
      textarea.style.position = "fixed";
      textarea.style.top = "-1000px";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      textarea.setSelectionRange(0, textarea.value.length);

      const ok = document.execCommand("copy");
      document.body.removeChild(textarea);

      if (ok) {
        markCopied();
        AlertService.success(
          "Link Copied",
          "Your public profile link has been copied to the clipboard."
        );
      } else {
        throw new Error("Copy command failed");
      }
    } catch (err) {
      console.error("Copy failed:", err);

      AlertService.error(
        "Copy Failed",
        "We could not copy the link automatically. Please copy it manually from the field above."
      );
    }
  };

  // ============================================================
  // NATIVE SHARE (mobile-friendly)
  // ============================================================

  const handleShare = async () => {
    if (!shareProfileUrl) {
      AlertService.warning(
        "Link Unavailable",
        "We could not generate your profile link right now. Please try again later.",
        []
      );
      return;
    }

    const sharePayload = {
      title: "My KnowMato Profile",
      text: "Check out my KnowMato profile!",
      url: shareProfileUrl,
    };

    try {
      if (
        typeof navigator !== "undefined" &&
        typeof (navigator as any).share === "function"
      ) {
        await (navigator as any).share(sharePayload);
        return;
      }

      // If Web Share API not supported, just copy instead.
      await handleCopyLink();
    } catch (err: any) {
      /*
       * AbortError means the user cancelled the native share sheet —
       * no need to show an error.
       */
      if (err?.name === "AbortError") return;

      console.warn("Share failed:", err);
      // Fallback to copy on other errors.
      await handleCopyLink();
    }
  };

  // ============================================================
  // EDIT MODE HANDLERS
  // ============================================================

  const handleStartEditing = () => {
    if (!profile || saving || deletingAccount) return;

    setOriginalProfile(profile);
    setValidationErrors({});
    setProfilePhoto(null);

    if (photoInputRef.current) {
      photoInputRef.current.value = "";
    }

    setIsEditing(true);

    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }, 50);
  };

  const handleCancelEditing = () => {
    if (saving || deletingAccount) return;

    if (originalProfile) {
      setProfile(originalProfile);
    }

    setProfilePhoto(null);
    setValidationErrors({});
    setOriginalProfile(null);
    setIsEditing(false);

    if (photoInputRef.current) {
      photoInputRef.current.value = "";
    }
  };

  // ============================================================
  // SAVE PROFILE
  // ============================================================

  const handleSubmit = async (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    if (
      !profile ||
      saving ||
      deletingAccount ||
      !isEditing
    ) {
      return;
    }

    const errors: Record<string, string> = {};

    const fullName = profile.full_name?.trim() || "";
    const email = profile.email?.trim() || "";
    const mobile = profile.mobile_number?.trim() || "";
    const educationLevel =
      profile.education_level?.trim() || "";
    const gradeYear = profile.grade_year?.trim() || "";
    const streamCategory =
      profile.stream_category?.trim() || "";
    const stream = profile.stream?.trim() || "";
    const skillLevel =
      profile.skill_level?.trim() || "";
    const aboutLearning =
      profile.about_learning?.trim() || "";

    const languages = Array.isArray(
      profile.preferred_languages
    )
      ? profile.preferred_languages.filter(
          (item) => item?.trim()
        )
      : [];

    const subjects = Array.isArray(
      profile.subjects
    )
      ? profile.subjects.filter(
          (item) => item?.trim()
        )
      : [];

    const learningGoals = Array.isArray(
      profile.learning_goals
    )
      ? profile.learning_goals.filter(
          (item) => item?.trim()
        )
      : [];

    const sessionTypes = Array.isArray(
      profile.session_types
    )
      ? profile.session_types.filter(
          (item) => item?.trim()
        )
      : [];

    const preferredTime = Array.isArray(
      profile.preferred_time
    )
      ? profile.preferred_time.filter(
          (item) => item?.trim()
        )
      : [];

    // ---------------- PERSONAL INFORMATION ----------------

    if (!fullName) {
      errors.full_name = "Full name is required.";
    } else if (fullName.length < 2) {
      errors.full_name =
        "Full name must contain at least 2 characters.";
    } else if (fullName.length > 100) {
      errors.full_name =
        "Full name must not exceed 100 characters.";
    } else if (
      !/^[A-Za-zÀ-ÖØ-öø-ÿ]+(?:[ '\u2019-][A-Za-zÀ-ÖØ-öø-ÿ]+)*$/.test(
        fullName
      )
    ) {
      errors.full_name =
        "Enter a valid name using letters, spaces, apostrophes or hyphens only.";
    }

    if (!email) {
      errors.email = "Email address is required.";
    } else if (email.length > 254) {
      errors.email =
        "Email address is too long.";
    } else if (
      !/^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?(?:\.[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?)+$/.test(
        email
      )
    ) {
      errors.email =
        "Enter a valid email address, for example name@example.com.";
    }

    if (!mobile) {
      errors.mobile_number =
        "Mobile number is required.";
    } else if (!/^\d{10}$/.test(mobile)) {
      errors.mobile_number =
        "Mobile number must contain exactly 10 digits.";
    } else if (!/^[6-9]\d{9}$/.test(mobile)) {
      errors.mobile_number =
        "Enter a valid 10-digit Indian mobile number starting with 6, 7, 8 or 9.";
    }

    // ---------------- EDUCATION ----------------

    if (!educationLevel) {
      errors.education_level =
        "Education level is required.";
    } else if (educationLevel.length > 100) {
      errors.education_level =
        "Education level must not exceed 100 characters.";
    }

    if (!gradeYear) {
      errors.grade_year =
        "Grade / year is required.";
    } else if (gradeYear.length > 100) {
      errors.grade_year =
        "Grade / year must not exceed 100 characters.";
    }

    if (!streamCategory) {
      errors.stream_category =
        "Stream category is required.";
    } else if (streamCategory.length > 100) {
      errors.stream_category =
        "Stream category must not exceed 100 characters.";
    }

    if (!stream) {
      errors.stream = "Stream is required.";
    } else if (stream.length > 100) {
      errors.stream =
        "Stream must not exceed 100 characters.";
    }

    // ---------------- LEARNING PREFERENCES ----------------

    if (!skillLevel) {
      errors.skill_level =
        "Skill level is required.";
    } else if (skillLevel.length > 100) {
      errors.skill_level =
        "Skill level must not exceed 100 characters.";
    }

    if (languages.length === 0) {
      errors.preferred_languages =
        "Select or add at least one preferred language.";
    }

    if (subjects.length === 0) {
      errors.subjects =
        "Select or add at least one subject.";
    }

    if (learningGoals.length === 0) {
      errors.learning_goals =
        "Select or add at least one learning goal.";
    }

    if (sessionTypes.length === 0) {
      errors.session_types =
        "Select or add at least one preferred session type.";
    }

    if (preferredTime.length === 0) {
      errors.preferred_time =
        "Select or add at least one preferred time.";
    }

    // ---------------- ABOUT LEARNING ----------------

    if (!aboutLearning) {
      errors.about_learning =
        "Please tell us about your learning.";
    } else if (aboutLearning.length < 10) {
      errors.about_learning =
        "Please enter at least 10 characters.";
    } else if (aboutLearning.length > 2000) {
      errors.about_learning =
        "About learning must not exceed 2000 characters.";
    }

    // ---------------- PROFILE PHOTO ----------------

    const hasExistingPhoto =
      typeof profile.profile_photo === "string" &&
      profile.profile_photo.trim().length > 0;

    if (!hasExistingPhoto && !profilePhoto) {
      errors.profile_photo =
        "Profile photo is required.";
    }

    if (profilePhoto) {
      if (!profilePhoto.type.startsWith("image/")) {
        errors.profile_photo =
          "Please select a valid image file.";
      } else if (profilePhoto.size > 5 * 1024 * 1024) {
        errors.profile_photo =
          "Profile photo must be 5 MB or smaller.";
      }
    }

    setValidationErrors(errors);

    if (Object.keys(errors).length > 0) {
      const firstInvalidField =
        Object.keys(errors)[0];

      console.warn(
        "Profile validation failed:",
        errors
      );

      AlertService.warning(
        "Complete All Required Fields",
        errors[firstInvalidField] ||
          "Please fill in every required field correctly.",
        []
      );

      setTimeout(() => {
        const element =
          document.querySelector(
            `[data-validation-field="${firstInvalidField}"]`
          );

        element?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }, 50);

      return;
    }

    setSaving(true);

    try {
      const formData =
        buildStudentProfileFormData(
          {
            full_name: fullName,
            email,
            mobile_number: mobile,
            education_level: educationLevel,
            grade_year: gradeYear,
            stream_category: streamCategory,
            stream,
            preferred_languages: languages,
            subjects,
            learning_goals: learningGoals,
            session_types: sessionTypes,
            preferred_time: preferredTime,
            skill_level: skillLevel,
            about_learning: aboutLearning,
          },
          profilePhoto
        );

      console.log(
        "Profile validation passed. Submitting profile..."
      );

      await updateStudentProfile(formData);

      setValidationErrors({});

      AlertService.success(
        t("studentProfile.updateSuccessTitle", {
          defaultValue: "Profile Updated",
        }),
        t("studentProfile.updated", {
          defaultValue:
            "Your profile has been updated successfully.",
        })
      );

      setProfile((current) =>
        current
          ? {
              ...current,
              full_name: fullName,
              email,
              mobile_number: mobile,
              education_level: educationLevel,
              grade_year: gradeYear,
              stream_category: streamCategory,
              stream,
              preferred_languages: languages,
              subjects,
              learning_goals: learningGoals,
              session_types: sessionTypes,
              preferred_time: preferredTime,
              skill_level: skillLevel,
              about_learning: aboutLearning,
              profile_completed: true,
            }
          : current
      );

      setProfilePhoto(null);

      if (photoInputRef.current) {
        photoInputRef.current.value = "";
      }

      setOriginalProfile(null);
      setIsEditing(false);
    } catch (err: any) {
      console.error(
        "Profile update failed:",
        err
      );

      const responseData =
        err?.response?.data;

      const backendMessage =
        responseData?.message ||
        responseData?.error ||
        responseData?.detail;

      AlertService.error(
        t("studentProfile.updateFailedTitle", {
          defaultValue: "Update Failed",
        }),
        backendMessage ||
          t("studentProfile.updateFailed", {
            defaultValue:
              "Failed to update your profile. Please try again.",
          })
      );
    } finally {
      setSaving(false);
    }
  };

  // ============================================================
  // DELETE ACCOUNT
  // ============================================================

  const handleDeleteAccount = async () => {
    if (deletingAccount) return;

    const firstConfirmation = window.confirm(
      "Are you sure you want to permanently delete your KnowMato account?\n\n" +
        "This action cannot be undone."
    );

    if (!firstConfirmation) {
      return;
    }

    const secondConfirmation = window.confirm(
      "FINAL CONFIRMATION\n\n" +
        "Your KnowMato account and associated data will be permanently deleted.\n\n" +
        "Do you really want to continue?"
    );

    if (!secondConfirmation) {
      return;
    }

    setDeletingAccount(true);

    try {
      await apiDelete(
        "accounts/delete-account/",
        {
          confirm: true,
        }
      );

      AlertService.success(
        "Account Deleted",
        "Your KnowMato account has been permanently deleted."
      );

      setTimeout(() => {
        window.location.href = "/login";
      }, 1200);
    } catch (err: any) {
      console.error(
        "Account deletion failed:",
        err
      );

      const responseData =
        err?.response?.data;

      const errorMessage =
        responseData?.message ||
        responseData?.error ||
        responseData?.detail ||
        "We could not delete your account. Please try again.";

      AlertService.error(
        "Account Deletion Failed",
        errorMessage
      );
    } finally {
      setDeletingAccount(false);
    }
  };

  // ============================================================
  // LOADING
  // ============================================================

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

  // ============================================================
  // PROFILE NOT FOUND
  // ============================================================

  if (!profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e] flex items-center justify-center">
        <p className="text-white/70">
          {t("studentProfile.notFound")}
        </p>
      </div>
    );
  }

  // ============================================================
  // PAGE
  // ============================================================

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e] relative overflow-hidden p-4 sm:p-6 lg:p-8">
      {/* Animated background blobs */}
      <div className="absolute top-0 -left-20 w-72 h-72 bg-purple-500/20 rounded-full mix-blend-multiply filter blur-3xl animate-blob" />

      <div className="absolute top-0 -right-20 w-72 h-72 bg-fuchsia-500/20 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000" />

      <div className="absolute -bottom-20 left-40 w-72 h-72 bg-cyan-500/20 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000" />

      <div className="max-w-4xl mx-auto relative z-10">
        <motion.form
          onSubmit={handleSubmit}
          noValidate
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-6"
        >
          {/* ==================================================
              HEADER
          ================================================== */}

          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl flex flex-col sm:flex-row items-center gap-4">
            <div className="relative">
              {profile.profile_photo ? (
                <img
                  src={getProfilePhotoUrl(profile.profile_photo) ?? ""}
                  alt="Profile"
                  className="w-20 h-20 rounded-full object-cover border-2 border-violet-400/50 shadow-lg"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-2xl font-bold text-white shadow-lg">
                  {profile.full_name
                    ?.charAt(0)
                    .toUpperCase() || "S"}
                </div>
              )}
            </div>

            <div className="text-center sm:text-left">
              <h1 className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-violet-300 to-fuchsia-300">
                {profile.full_name}
              </h1>

              <p className="text-white/70">
                {profile.email}
              </p>

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

                {isEditing && (
                  <span className="px-2 py-0.5 rounded-full text-xs font-semibold border bg-violet-400/20 text-violet-200 border-violet-400/40">
                    {t("studentProfile.editing", {
                      defaultValue: "Editing",
                    })}
                  </span>
                )}
              </div>
            </div>

            {/* ---- EDIT BUTTON (top-right) ---- */}
            <div className="sm:ml-auto">
              {!isEditing ? (
                <motion.button
                  type="button"
                  onClick={handleStartEditing}
                  disabled={saving || deletingAccount}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="px-5 py-2.5 rounded-xl border border-violet-400/40 bg-violet-500/10 hover:bg-violet-500/20 text-violet-200 hover:text-white font-bold transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    className="w-4 h-4"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M16.862 4.487a2.06 2.06 0 1 1 2.914 2.914L7.5 19.677 3 21l1.323-4.5L16.862 4.487Z"
                    />
                  </svg>
                  {t("studentProfile.editProfile", {
                    defaultValue: "Edit Profile",
                  })}
                </motion.button>
              ) : (
                <span className="inline-flex items-center gap-2 rounded-xl border border-amber-400/40 bg-amber-400/10 px-4 py-2 text-xs font-semibold text-amber-200">
                  {t("studentProfile.editModeNotice", {
                    defaultValue:
                      "You are editing your profile",
                  })}
                </span>
              )}
            </div>
          </div>

          {/* ==================================================
              SHARE MY PROFILE LINK
          ================================================== */}

          <section className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl">
            <div className="flex flex-col gap-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 shrink-0 rounded-xl bg-violet-500/15 border border-violet-500/20 flex items-center justify-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    className="w-5 h-5 text-violet-300"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M10.81 15.312a4.5 4.5 0 0 1-1.242-7.244l4.5-4.5a4.5 4.5 0 0 1 6.364 6.364l-1.757 1.757"
                    />
                  </svg>
                </div>

                <div>
                  <h2 className="text-lg font-bold text-white">
                    {t("studentProfile.shareProfileTitle", {
                      defaultValue: "Share My Profile",
                    })}
                  </h2>
                  <p className="mt-1 text-sm leading-6 text-white/60 max-w-2xl">
                    {t("studentProfile.shareProfileDescription", {
                      defaultValue:
                        "Anyone with this link can view your public KnowMato profile.",
                    })}
                  </p>
                </div>
              </div>

              {/* Link preview + actions */}
              <div className="flex flex-col gap-3">
                <div className="flex flex-col sm:flex-row items-stretch gap-2">
                  <div className="flex-1 min-w-0">
                    <div
                      className={`flex items-center gap-2 rounded-xl border-2 px-3 py-2.5 bg-gray-900/60 transition ${
                        shareProfileUrl
                          ? "border-white/20"
                          : "border-white/10 opacity-70"
                      }`}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        className="w-4 h-4 shrink-0 text-white/50"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M10.81 15.312a4.5 4.5 0 0 1-1.242-7.244l4.5-4.5a4.5 4.5 0 0 1 6.364 6.364l-1.757 1.757"
                        />
                      </svg>

                      <input
                        type="text"
                        readOnly
                        value={
                          shareProfileUrl ||
                          t("studentProfile.shareProfileLoading", {
                            defaultValue:
                              "Preparing your profile link...",
                          })
                        }
                        onFocus={(e) => e.currentTarget.select()}
                        className="flex-1 min-w-0 bg-transparent text-sm text-white/90 placeholder-white/40 outline-none truncate"
                      />
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <motion.button
                      type="button"
                      onClick={handleCopyLink}
                      disabled={!shareProfileUrl}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-violet-400/40 bg-violet-500/10 hover:bg-violet-500/20 text-violet-200 hover:text-white font-bold transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {copied ? (
                        <>
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            className="w-4 h-4"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M4.5 12.75l6 6 9-13.5"
                            />
                          </svg>
                          {t("studentProfile.copied", {
                            defaultValue: "Copied!",
                          })}
                        </>
                      ) : (
                        <>
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.8"
                            className="w-4 h-4"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 0 1-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 0 1 1.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 0 0-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 0 1-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 0 0-3.375-3.375h-1.5a1.125 1.125 0 0 1-1.125-1.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H9.75"
                            />
                          </svg>
                          {t("studentProfile.copyLink", {
                            defaultValue: "Copy Link",
                          })}
                        </>
                      )}
                    </motion.button>

                    <motion.button
                      type="button"
                      onClick={handleShare}
                      disabled={!shareProfileUrl}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-white/20 bg-white/5 hover:bg-white/10 text-white/80 hover:text-white font-bold transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        className="w-4 h-4"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M7.217 10.907a2.25 2.25 0 1 0 0 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186 9.566-5.314m-9.566 7.5 9.566 5.314m0 0a2.25 2.25 0 1 0 3.935 2.186 2.25 2.25 0 0 0-3.935-2.186Zm0-12.814a2.25 2.25 0 1 0 3.935-2.186 2.25 2.25 0 0 0-3.935 2.186Z"
                        />
                      </svg>
                      {t("studentProfile.share", {
                        defaultValue: "Share",
                      })}
                    </motion.button>
                  </div>
                </div>

                {!shareProfileUrl && (
                  <p className="text-xs text-white/45">
                    {t("studentProfile.shareProfileUnavailable", {
                      defaultValue:
                        "Your public profile link is not available yet. It will appear once your display name is set.",
                    })}
                  </p>
                )}
              </div>
            </div>
          </section>

          {/* ==================================================
              READ-ONLY NOTICE
          ================================================== */}

          {!isEditing && (
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-4 text-sm text-white/60 flex items-start gap-3">
              <span className="text-base leading-5">🔒</span>
              <p className="leading-6">
                {t("studentProfile.readOnlyNotice", {
                  defaultValue:
                    "Your profile is currently read-only. Click “Edit Profile” to enable the fields and make changes.",
                })}
              </p>
            </div>
          )}

          {/* ==================================================
              PROFILE PHOTO REQUIREMENT
          ================================================== */}

          <Section
            title={t("studentProfile.profilePhoto", {
              defaultValue: "Profile Photo",
            })}
          >
            <div
              data-validation-field="profile_photo"
              className="space-y-3"
            >
              <p className="text-sm font-medium text-white/80">
                Profile photo
                <span className="ml-1 text-rose-300">*</span>
              </p>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full border border-violet-400/30 bg-white/5">
                  {profilePhoto ? (
                    <img
                      src={URL.createObjectURL(profilePhoto)}
                      alt="Selected profile preview"
                      className="h-full w-full object-cover"
                    />
                  ) : profile.profile_photo ? (
                    <img
                      src={getProfilePhotoUrl(profile.profile_photo) ?? ""}
                      alt="Current profile"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="text-2xl text-white/40">
                      👤
                    </span>
                  )}
                </div>

                <div className="flex-1">
                  {isEditing ? (
                    <label className="inline-flex cursor-pointer items-center rounded-xl border border-violet-400/30 bg-violet-500/10 px-4 py-2.5 text-sm font-semibold text-violet-200 transition hover:bg-violet-500/20">
                      Choose Profile Photo
                      <input
                        ref={photoInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/jpg"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0] || null;

                          if (!file) {
                            return;
                          }

                          if (!file.type.startsWith("image/")) {
                            setValidationErrors((prev) => ({
                              ...prev,
                              profile_photo:
                                "Please select a valid image file.",
                            }));
                            return;
                          }

                          if (file.size > 5 * 1024 * 1024) {
                            setValidationErrors((prev) => ({
                              ...prev,
                              profile_photo:
                                "Profile photo must be 5 MB or smaller.",
                            }));
                            return;
                          }

                          setProfilePhoto(file);

                          setValidationErrors((prev) => {
                            const next = { ...prev };
                            delete next.profile_photo;
                            return next;
                          });
                        }}
                      />
                    </label>
                  ) : (
                    <p className="inline-flex items-center rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-white/45">
                      {t("studentProfile.photoLocked", {
                        defaultValue:
                          "Click Edit Profile to change your photo",
                      })}
                    </p>
                  )}

                  <p className="mt-2 text-xs text-white/45">
                    JPG, PNG or WEBP · Maximum 5 MB · Required
                  </p>
                </div>
              </div>

              {validationErrors.profile_photo && (
                <p className="text-xs font-medium text-rose-300">
                  {validationErrors.profile_photo}
                </p>
              )}
            </div>
          </Section>

          {/* ==================================================
              PERSONAL INFORMATION
          ================================================== */}

          <Section
            title={t(
              "studentProfile.personalInfo"
            )}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field
                label={t(
                  "studentProfile.fullName"
                )}
                value={profile.full_name}
                disabled={!isEditing}
                onChange={(v) =>
                  setProfile({
                    ...profile,
                    full_name: v,
                  })
                }
                error={validationErrors.full_name}
                fieldKey="full_name"
              />

              <Field
                label={t(
                  "studentProfile.email"
                )}
                value={profile.email}
                disabled={!isEditing}
                onChange={(v) =>
                  setProfile({
                    ...profile,
                    email: v,
                  })
                }
                type="email"
                error={validationErrors.email}
                fieldKey="email"
              />

              <Field
                label={t(
                  "studentProfile.mobileNumber"
                )}
                value={profile.mobile_number}
                disabled={!isEditing}
                onChange={(v) =>
                  setProfile({
                    ...profile,
                    mobile_number: v
                      .replace(/\D/g, "")
                      .slice(0, 10),
                  })
                }
                type="tel"
                inputMode="numeric"
                maxLength={10}
                error={validationErrors.mobile_number}
                fieldKey="mobile_number"
              />
            </div>
          </Section>

          {/* ==================================================
              EDUCATION
          ================================================== */}

          <Section
            title={t(
              "studentProfile.education"
            )}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field
                label={t(
                  "studentProfile.educationLevel"
                )}
                value={profile.education_level}
                disabled={!isEditing}
                onChange={(v) =>
                  setProfile({
                    ...profile,
                    education_level: v,
                  })
                }
                error={validationErrors.education_level}
                fieldKey="education_level"
              />

              <Field
                label={t(
                  "studentProfile.gradeYear"
                )}
                value={profile.grade_year}
                disabled={!isEditing}
                onChange={(v) =>
                  setProfile({
                    ...profile,
                    grade_year: v,
                  })
                }
                error={validationErrors.grade_year}
                fieldKey="grade_year"
              />

              <Field
                label={t(
                  "studentProfile.streamCategory"
                )}
                value={profile.stream_category}
                disabled={!isEditing}
                onChange={(v) =>
                  setProfile({
                    ...profile,
                    stream_category: v,
                  })
                }
                error={validationErrors.stream_category}
                fieldKey="stream_category"
              />

              <Field
                label={t(
                  "studentProfile.stream"
                )}
                value={profile.stream}
                disabled={!isEditing}
                onChange={(v) =>
                  setProfile({
                    ...profile,
                    stream: v,
                  })
                }
                error={validationErrors.stream}
                fieldKey="stream"
              />
            </div>
          </Section>

          {/* ==================================================
              LEARNING PREFERENCES
          ================================================== */}

          <Section
            title={t(
              "studentProfile.learningPreferences"
            )}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field
                label={t(
                  "studentProfile.skillLevel"
                )}
                value={profile.skill_level}
                disabled={!isEditing}
                onChange={(v) =>
                  setProfile({
                    ...profile,
                    skill_level: v,
                  })
                }
                error={validationErrors.skill_level}
                fieldKey="skill_level"
              />
            </div>

            <div className="mt-6 space-y-6">
              <AutocompleteChipInput
                label={t(
                  "studentProfile.languagesLabel"
                )}
                items={
                  profile.preferred_languages ||
                  []
                }
                disabled={!isEditing}
                onChange={(items) =>
                  setProfile({
                    ...profile,
                    preferred_languages:
                      items,
                  })
                }
                error={validationErrors.preferred_languages}
                fieldKey="preferred_languages"
                suggestions={
                  LANGUAGE_OPTIONS
                }
                placeholder={t(
                  "studentProfile.languagesPlaceholder"
                )}
                addLabel={t(
                  "studentProfile.add"
                )}
              />

              <AutocompleteChipInput
                label={t(
                  "studentProfile.subjectsLabel"
                )}
                items={
                  profile.subjects || []
                }
                disabled={!isEditing}
                onChange={(items) =>
                  setProfile({
                    ...profile,
                    subjects: items,
                  })
                }
                error={validationErrors.subjects}
                fieldKey="subjects"
                suggestions={
                  SUBJECT_OPTIONS
                }
                placeholder={t(
                  "studentProfile.subjectsPlaceholder"
                )}
                addLabel={t(
                  "studentProfile.add"
                )}
              />

              <AutocompleteChipInput
                label={t(
                  "studentProfile.goalsLabel"
                )}
                items={
                  profile.learning_goals ||
                  []
                }
                disabled={!isEditing}
                onChange={(items) =>
                  setProfile({
                    ...profile,
                    learning_goals:
                      items,
                  })
                }
                error={validationErrors.learning_goals}
                fieldKey="learning_goals"
                suggestions={
                  LEARNING_GOAL_OPTIONS
                }
                placeholder={t(
                  "studentProfile.goalsPlaceholder"
                )}
                addLabel={t(
                  "studentProfile.add"
                )}
              />

              <AutocompleteChipInput
                label={t(
                  "studentProfile.sessionTypesLabel"
                )}
                items={
                  profile.session_types ||
                  []
                }
                disabled={!isEditing}
                onChange={(items) =>
                  setProfile({
                    ...profile,
                    session_types:
                      items,
                  })
                }
                error={validationErrors.session_types}
                fieldKey="session_types"
                suggestions={
                  SESSION_TYPE_OPTIONS
                }
                placeholder={t(
                  "studentProfile.sessionTypesPlaceholder"
                )}
                addLabel={t(
                  "studentProfile.add"
                )}
              />

              <AutocompleteChipInput
                label={t(
                  "studentProfile.preferredTimeLabel"
                )}
                items={
                  profile.preferred_time ||
                  []
                }
                disabled={!isEditing}
                onChange={(items) =>
                  setProfile({
                    ...profile,
                    preferred_time:
                      items,
                  })
                }
                error={validationErrors.preferred_time}
                fieldKey="preferred_time"
                suggestions={
                  PREFERRED_TIME_OPTIONS
                }
                placeholder={t(
                  "studentProfile.preferredTimePlaceholder"
                )}
                addLabel={t(
                  "studentProfile.add"
                )}
              />
            </div>
          </Section>

          {/* ==================================================
              ABOUT LEARNING
          ================================================== */}

          <Section
            title={t(
              "studentProfile.aboutLearning"
            )}
          >
            <textarea
              data-validation-field="about_learning"
              aria-invalid={Boolean(validationErrors.about_learning)}
              disabled={!isEditing}
              className={`w-full border-2 border-white/20 rounded-xl p-3 min-h-[120px] bg-gray-900/60 text-white placeholder-white/40 outline-none transition ${
                isEditing
                  ? "focus:ring-4 focus:ring-violet-500/50 focus:border-violet-400"
                  : "opacity-70 cursor-not-allowed border-white/10"
              }`}
              placeholder={t(
                "studentProfile.aboutLearningPlaceholder"
              )}
              value={
                profile.about_learning
              }
              onChange={(e) =>
                setProfile({
                  ...profile,
                  about_learning:
                    e.target.value,
                })
              }
            />
            {validationErrors.about_learning && (
              <p className="mt-2 text-xs font-medium text-rose-300">
                {validationErrors.about_learning}
              </p>
            )}
          </Section>

          {/* ==================================================
              ACTION BAR (EDIT / CANCEL / SAVE)
          ================================================== */}

          <div className="sticky bottom-4 flex flex-wrap justify-end gap-3">
            {isEditing ? (
              <>
                <motion.button
                  type="button"
                  onClick={handleCancelEditing}
                  disabled={saving || deletingAccount}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="px-6 py-3 rounded-xl border border-white/20 bg-white/5 hover:bg-white/10 text-white/80 hover:text-white font-bold transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {t("studentProfile.cancel", {
                    defaultValue: "Cancel",
                  })}
                </motion.button>

                <motion.button
                  type="submit"
                  disabled={saving || deletingAccount}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="px-8 py-3 bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:from-violet-600 hover:to-fuchsia-600 text-white font-bold rounded-xl shadow-lg shadow-violet-500/25 transition disabled:opacity-60 flex items-center gap-2"
                >
                  {saving
                    ? t("studentProfile.saving")
                    : t("studentProfile.saveProfile")}
                </motion.button>
              </>
            ) : (
              <motion.button
                type="button"
                onClick={handleStartEditing}
                disabled={saving || deletingAccount}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="px-8 py-3 bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:from-violet-600 hover:to-fuchsia-600 text-white font-bold rounded-xl shadow-lg shadow-violet-500/25 transition disabled:opacity-60 flex items-center gap-2"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  className="w-5 h-5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M16.862 4.487a2.06 2.06 0 1 1 2.914 2.914L7.5 19.677 3 21l1.323-4.5L16.862 4.487Z"
                  />
                </svg>
                {t("studentProfile.editProfile", {
                  defaultValue: "Edit Profile",
                })}
              </motion.button>
            )}
          </div>

          {/* ==================================================
              DANGER ZONE / DELETE ACCOUNT
          ================================================== */}

          <section className="bg-rose-500/5 backdrop-blur-xl border border-rose-500/20 rounded-2xl p-6 shadow-2xl">
            <div className="flex flex-col gap-5">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-xl bg-rose-500/15 border border-rose-500/20 flex items-center justify-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      className="w-5 h-5 text-rose-400"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M3 6h18"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M8 6V4.8A1.8 1.8 0 0 1 9.8 3h4.4A1.8 1.8 0 0 1 16 4.8V6"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M19 6l-.8 13.2a1.8 1.8 0 0 1-1.8 1.7H7.6a1.8 1.8 0 0 1-1.8-1.7L5 6"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M10 10v7"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M14 10v7"
                      />
                    </svg>
                  </div>

                  <h2 className="text-lg font-bold text-rose-300">
                    Delete Account
                  </h2>
                </div>

                <p className="text-sm leading-6 text-white/65 max-w-2xl">
                  Permanently delete your
                  KnowMato account and
                  associated account data.
                  This action cannot be
                  undone.
                </p>
              </div>

              <div className="rounded-xl border border-rose-500/15 bg-black/10 p-4">
                <p className="text-sm text-white/70 leading-6">
                  <span className="font-semibold text-rose-300">
                    Warning:
                  </span>{" "}
                  Account deletion is
                  permanent. Once your
                  account is deleted, you
                  will no longer be able to
                  access it.
                </p>
              </div>

              <div className="flex justify-start">
                <motion.button
                  type="button"
                  onClick={
                    handleDeleteAccount
                  }
                  disabled={
                    deletingAccount ||
                    saving
                  }
                  whileHover={{
                    scale: 1.02,
                  }}
                  whileTap={{
                    scale: 0.98,
                  }}
                  className="px-6 py-3 rounded-xl border border-rose-500/40 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 hover:text-rose-200 font-bold transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {deletingAccount ? (
                    <>
                      <svg
                        className="animate-spin w-5 h-5"
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

                      Deleting Account...
                    </>
                  ) : (
                    <>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        className="w-5 h-5"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M3 6h18"
                        />

                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M8 6V4.8A1.8 1.8 0 0 1 9.8 3h4.4A1.8 1.8 0 0 1 16 4.8V6"
                        />

                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M19 6l-.8 13.2a1.8 1.8 0 0 1-1.8 1.7H7.6a1.8 1.8 0 0 1-1.8-1.7L5 6"
                        />

                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M10 10v7"
                        />

                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M14 10v7"
                        />
                      </svg>

                      Delete My Account
                    </>
                  )}
                </motion.button>
              </div>
            </div>
          </section>
        </motion.form>
      </div>
    </div>
  );
}

// ============================================================
// REUSABLE UI COMPONENTS
// ============================================================

const Section = ({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) => (
  <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl">
    <h2 className="text-lg font-bold text-white mb-4">
      {title}
    </h2>

    {children}
  </div>
);

const Field = ({
  label,
  value,
  onChange,
  type = "text",
  error,
  inputMode,
  maxLength,
  fieldKey,
  disabled = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  error?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  maxLength?: number;
  fieldKey?: string;
  disabled?: boolean;
}) => (
  <div data-validation-field={fieldKey}>
    <label className="mb-1 block text-sm font-medium text-white/70">
      <span>{label}</span>
      <span className="ml-1 text-rose-300">*</span>
    </label>

    <input
      type={type}
      value={value}
      required
      disabled={disabled}
      inputMode={inputMode}
      maxLength={maxLength}
      aria-invalid={Boolean(error)}
      onChange={(e) => onChange(e.target.value)}
      className={`w-full rounded-xl border-2 px-4 py-2.5 bg-gray-900/60 text-white placeholder-white/40 outline-none transition ${
        disabled
          ? "border-white/10 opacity-70 cursor-not-allowed"
          : error
          ? "border-rose-400/70 focus:border-rose-400 focus:ring-4 focus:ring-rose-500/20"
          : "border-white/20 focus:border-violet-400 focus:ring-4 focus:ring-violet-500/50"
      }`}
    />

    {error && (
      <p className="mt-1.5 text-xs font-medium text-rose-300">
        {error}
      </p>
    )}
  </div>
);