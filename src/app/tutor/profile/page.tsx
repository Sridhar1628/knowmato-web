"use client";

import { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import AlertService from "@/services/alertService";
import { getTutorProfile, updateTutorProfile } from "@/services/v1Service";
import { useTranslation } from "react-i18next";

// ---------- Types (matching real API) ----------
interface TutorProfileData {
  id: number;
  user?: number;
  bio: string;
  skills: string;
  experience: number;
  is_verified: boolean;
  average_rating: number;
  total_reviews: number;
  is_top_tutor: boolean;
  is_online: boolean;
  last_seen: string | null;
  phone_number: string;
  city_state: string;
  linkedin_profile: string;
  highest_qualification: string;
  degree: string;
  college_name: string;
  year_of_completion: number | null;
  expertise_level: string;
  current_status: string;
  organization: string;
  professional_summary: string;
  mentor_subjects: string[];
  mentor_languages: string[];
  resume: string | null;
  application_submitted: boolean;
  application_submitted_at: string | null;
}

// ---------- Helper: get user name from JWT ----------
function getUserNameFromToken(): string {
  try {
    const token = JSON.parse(
      localStorage.getItem("access_token") || "null"
    ) as string;

    if (!token) return "Tutor";

    const payload = JSON.parse(atob(token.split(".")[1]));

    return payload.display_name || payload.email || "Tutor";
  } catch {
    return "Tutor";
  }
}

// ---------- Chip Input Component ----------
const ChipInput = ({
  items,
  onChange,
  placeholder,
  error,
  fieldKey,
}: {
  items: string[];
  onChange: (items: string[]) => void;
  placeholder: string;
  error?: string;
  fieldKey?: string;
}) => {
  const [input, setInput] = useState("");

  const addItem = () => {
    const trimmed = input.trim();

    if (trimmed && !items.includes(trimmed)) {
      onChange([...items, trimmed]);
    }

    setInput("");
  };

  const removeItem = (item: string) => {
    onChange(items.filter((i) => i !== item));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addItem();
    } else if (e.key === "Backspace" && !input && items.length > 0) {
      removeItem(items[items.length - 1]);
    }
  };

  return (
    <div data-validation-field={fieldKey}>
      <div
        className={`flex flex-wrap items-center gap-2 rounded-xl px-3 py-2 bg-gray-900/60 transition border-2 focus-within:ring-4 ${
          error
            ? "border-rose-400/70 focus-within:border-rose-400 focus-within:ring-rose-500/20"
            : "border-white/20 focus-within:ring-violet-500/50 focus-within:border-violet-400"
        }`}
      >
        {items.map((item, idx) => (
          <span
            key={`${item}-${idx}`}
            className="inline-flex items-center gap-1 bg-violet-500/20 text-violet-300 px-2.5 py-0.5 rounded-full text-sm border border-violet-400/30"
          >
            {item}

            <button
              type="button"
              onClick={() => removeItem(item)}
              className="hover:text-rose-400 transition"
              aria-label={`Remove ${item}`}
            >
              ×
            </button>
          </span>
        ))}

        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={() => {
            if (input.trim()) addItem();
          }}
          placeholder={items.length === 0 ? placeholder : ""}
          aria-invalid={Boolean(error)}
          className="flex-1 min-w-[120px] outline-none text-sm bg-transparent text-white placeholder-white/40"
        />
      </div>

      {error && (
        <p className="mt-1.5 text-xs text-rose-300">
          {error}
        </p>
      )}
    </div>
  );
};

// ---------- Skeleton Loader ----------
const ProfileSkeleton = () => (
  <div className="space-y-6 animate-pulse p-2">
    <div className="h-10 w-2/3 bg-white/10 rounded-xl" />

    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="h-24 bg-white/10 rounded-2xl" />
      ))}
    </div>

    {[...Array(5)].map((_, i) => (
      <div key={i} className="h-40 bg-white/10 rounded-2xl" />
    ))}
  </div>
);

export default function TutorProfilePage() {
  const { t } = useTranslation();

  const [profile, setProfile] = useState<TutorProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [resumeFile, setResumeFile] = useState<File | null>(null);

  const resumeInputRef = useRef<HTMLInputElement>(null);

  const displayName = getUserNameFromToken();

  // ---------- Fetch Profile ----------
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await getTutorProfile();
        setProfile(res.data);
      } catch (error) {
        console.error("Failed to load tutor profile:", error);

        AlertService.error(
          t("common.error"),
          t("tutorProfile.loadError")
        );
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [t]);

// ---------- Validate Profile ----------
const validateProfile = (): Record<string, string> => {
  if (!profile) {
    return { profile: "Profile data is not available." };
  }

  const errors: Record<string, string> = {};
  const currentYear = new Date().getFullYear();

  const bio = (profile.bio || "").trim();
  const skills = (profile.skills || "").trim();
  const phone = (profile.phone_number || "").replace(/\D/g, "");
  const cityState = (profile.city_state || "").trim();
  const linkedin = (profile.linkedin_profile || "").trim();
  const highestQualification = (profile.highest_qualification || "").trim();
  const degree = (profile.degree || "").trim();
  const collegeName = (profile.college_name || "").trim();
  const expertiseLevel = (profile.expertise_level || "").trim();
  const currentStatus = (profile.current_status || "").trim();
  const organization = (profile.organization || "").trim();
  const professionalSummary = (profile.professional_summary || "").trim();
  const mentorSubjects = Array.isArray(profile.mentor_subjects)
    ? profile.mentor_subjects.filter((item) => item?.trim())
    : [];
  const mentorLanguages = Array.isArray(profile.mentor_languages)
    ? profile.mentor_languages.filter((item) => item?.trim())
    : [];

  if (!bio) {
    errors.bio = "Bio is required.";
  } else if (bio.length < 20) {
    errors.bio = "Bio must contain at least 20 characters.";
  } else if (bio.length > 2000) {
    errors.bio = "Bio must not exceed 2000 characters.";
  }

  if (!skills) {
    errors.skills = "Skills are required.";
  } else if (skills.length < 2) {
    errors.skills = "Please enter valid skills.";
  } else if (skills.length > 1000) {
    errors.skills = "Skills must not exceed 1000 characters.";
  }

  if (!phone) {
    errors.phone_number = "Mobile number is required.";
  } else if (!/^\d{10}$/.test(phone)) {
    errors.phone_number = "Mobile number must contain exactly 10 digits.";
  } else if (!/^[6-9]/.test(phone)) {
    errors.phone_number = "Please enter a valid Indian mobile number starting with 6, 7, 8, or 9.";
  }

  if (!cityState) {
    errors.city_state = "City / State is required.";
  } else if (cityState.length < 2) {
    errors.city_state = "Please enter a valid city / state.";
  } else if (cityState.length > 150) {
    errors.city_state = "City / State must not exceed 150 characters.";
  }

  if (!linkedin) {
    errors.linkedin_profile = "LinkedIn profile URL is required.";
  } else {
    try {
      const url = new URL(linkedin);
      if (url.protocol !== "https:" && url.protocol !== "http:") {
        errors.linkedin_profile = "Please enter a valid LinkedIn URL.";
      } else if (!/^(www\.)?linkedin\.com$/i.test(url.hostname)) {
        errors.linkedin_profile = "Please enter a valid LinkedIn profile URL.";
      }
    } catch {
      errors.linkedin_profile = "Please enter a valid LinkedIn profile URL.";
    }
  }

  if (!highestQualification) {
    errors.highest_qualification = "Highest qualification is required.";
  }

  if (!degree) {
    errors.degree = "Degree is required.";
  }

  if (!collegeName) {
    errors.college_name = "College / university name is required.";
  } else if (collegeName.length < 2) {
    errors.college_name = "Please enter a valid college / university name.";
  }

  if (
    profile.year_of_completion === null ||
    profile.year_of_completion === undefined ||
    !Number.isInteger(Number(profile.year_of_completion))
  ) {
    errors.year_of_completion = "Year of completion is required.";
  } else if (
    Number(profile.year_of_completion) < 1950 ||
    Number(profile.year_of_completion) > currentYear + 1
  ) {
    errors.year_of_completion = `Year of completion must be between 1950 and ${currentYear + 1}.`;
  }

  if (!expertiseLevel) {
    errors.expertise_level = "Expertise level is required.";
  }

  if (!currentStatus) {
    errors.current_status = "Current status is required.";
  }

  if (!organization) {
    errors.organization = "Organization is required.";
  }

  if (!professionalSummary) {
    errors.professional_summary = "Professional summary is required.";
  } else if (professionalSummary.length < 20) {
    errors.professional_summary =
      "Professional summary must contain at least 20 characters.";
  } else if (professionalSummary.length > 3000) {
    errors.professional_summary =
      "Professional summary must not exceed 3000 characters.";
  }

  if (mentorSubjects.length === 0) {
    errors.mentor_subjects = "Please add at least one subject.";
  }

  if (mentorLanguages.length === 0) {
    errors.mentor_languages = "Please add at least one language.";
  }

  // Resume is required only when there is no resume already stored.
  if (!profile.resume && !resumeFile) {
    errors.resume = "Please upload your resume.";
  }

  if (resumeFile) {
    const allowedTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    const extension = resumeFile.name.split(".").pop()?.toLowerCase();

    if (
      !allowedTypes.includes(resumeFile.type) &&
      !["pdf", "doc", "docx"].includes(extension || "")
    ) {
      errors.resume = "Resume must be a PDF, DOC, or DOCX file.";
    } else if (resumeFile.size > 5 * 1024 * 1024) {
      errors.resume = "Resume size must not exceed 5 MB.";
    }
  }

  return errors;
};

// ---------- Update Profile ----------
const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
  e.preventDefault();

  if (!profile || saving) return;

  const errors = validateProfile();
  setValidationErrors(errors);

  if (Object.keys(errors).length > 0) {
    const firstInvalidField = Object.keys(errors)[0];

    AlertService.error(
      "Complete Required Fields",
      errors[firstInvalidField] ||
        "Please fill in all required fields correctly."
    );

    setTimeout(() => {
      const element = document.querySelector(
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
    const formData = new FormData();

    formData.append("bio", profile.bio.trim());
    formData.append("skills", profile.skills.trim());
    formData.append("experience", String(profile.experience ?? 0));
    formData.append(
      "phone_number",
      profile.phone_number.replace(/\D/g, "")
    );
    formData.append("city_state", profile.city_state.trim());
    formData.append("linkedin_profile", profile.linkedin_profile.trim());
    formData.append(
      "highest_qualification",
      profile.highest_qualification.trim()
    );
    formData.append("degree", profile.degree.trim());
    formData.append("college_name", profile.college_name.trim());
    formData.append(
      "year_of_completion",
      String(profile.year_of_completion)
    );
    formData.append("expertise_level", profile.expertise_level.trim());
    formData.append("current_status", profile.current_status.trim());
    formData.append("organization", profile.organization.trim());
    formData.append(
      "professional_summary",
      profile.professional_summary.trim()
    );
    formData.append(
      "mentor_subjects",
      JSON.stringify(
        profile.mentor_subjects
          .map((item) => item.trim())
          .filter(Boolean)
      )
    );
    formData.append(
      "mentor_languages",
      JSON.stringify(
        profile.mentor_languages
          .map((item) => item.trim())
          .filter(Boolean)
      )
    );

    if (resumeFile) {
      formData.append("resume", resumeFile);
    }

    await updateTutorProfile(formData);

    setValidationErrors({});

    AlertService.success(
      t("common.success"),
      t("tutorProfile.updateSuccess")
    );

    setResumeFile(null);

    if (resumeInputRef.current) {
      resumeInputRef.current.value = "";
    }
  } catch (error: any) {
    console.error("Failed to update tutor profile:", error);

    const message =
      error?.response?.data?.error ||
      error?.response?.data?.message ||
      error?.message ||
      t("tutorProfile.updateFailed");

    AlertService.error(
      t("common.error"),
      message
    );
  } finally {
    setSaving(false);
  }
};

  // ---------- Loading ----------
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

  // ---------- Profile Not Found ----------
  if (!profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e] flex items-center justify-center text-white/70">
        {t("tutorProfile.notFound")}
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
          noValidate
          onSubmit={handleSubmit}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-6"
        >
          {/* Header */}
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-2xl">
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-2xl font-bold text-white shadow-lg">
                {displayName.charAt(0).toUpperCase()}
              </div>

              <div className="text-center sm:text-left">
                <h1 className="text-2xl font-extrabold text-white">
                  {displayName}
                </h1>

                <p className="text-white/50">
                  {t("tutorProfile.tutorId", {
                    id: profile.id,
                  })}
                </p>

                <div className="flex gap-2 mt-2 justify-center sm:justify-start flex-wrap">
                  {profile.is_verified && (
                    <span className="px-2 py-0.5 bg-emerald-400/20 text-emerald-300 rounded-full text-xs font-semibold border border-emerald-400/30">
                      {t("studentHome.verified")}
                    </span>
                  )}

                  <span className="px-2 py-0.5 bg-amber-400/20 text-amber-300 rounded-full text-xs font-semibold border border-amber-400/30">
                    {t("tutorProfile.ratingBadge", {
                      rating: profile.average_rating.toFixed(1),
                    })}
                  </span>

                  <span className="px-2 py-0.5 bg-sky-400/20 text-sky-300 rounded-full text-xs font-semibold border border-sky-400/30">
                    {t("tutorProfile.reviewsBadge", {
                      reviews: profile.total_reviews,
                    })}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card
              label={t("tutorProfile.label.averageRating")}
              value={`⭐ ${profile.average_rating.toFixed(1)}`}
            />

            <Card
              label={t("tutorProfile.label.totalReviews")}
              value={`📝 ${profile.total_reviews}`}
            />

            <Card
              label={t("tutorProfile.label.verified")}
              value={
                profile.is_verified
                  ? t("tutorProfile.verifiedYes")
                  : t("tutorProfile.verifiedNo")
              }
            />

            <Card
              label={t("tutorProfile.label.online")}
              value={
                profile.is_online
                  ? t("tutorProfile.onlineStatus")
                  : t("tutorProfile.offlineStatus")
              }
            />
          </div>

          {/* Personal Information */}
          <Section title={t("tutorProfile.section.personalInfo")}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field
                label={t("tutorProfile.field.phoneNumber")}
                error={validationErrors.phone_number}
                fieldKey="phone_number"
                value={profile.phone_number || ""}
                onChange={(v) =>
                  setProfile({
                    ...profile,
                    phone_number: v,
                  })
                }
              />

              <Field
                label={t("tutorProfile.field.cityState")}
                error={validationErrors.city_state}
                fieldKey="city_state"
                value={profile.city_state || ""}
                onChange={(v) =>
                  setProfile({
                    ...profile,
                    city_state: v,
                  })
                }
              />

              <Field
                label={t("tutorProfile.field.linkedin")}
                error={validationErrors.linkedin_profile}
                fieldKey="linkedin_profile"
                value={profile.linkedin_profile || ""}
                onChange={(v) =>
                  setProfile({
                    ...profile,
                    linkedin_profile: v,
                  })
                }
              />
            </div>
          </Section>

          {/* About Me */}
          <Section title={t("tutorProfile.section.aboutMe")}>
            <div data-validation-field="bio">
              <label className="block text-sm font-semibold text-white/70 mb-1">
                {t("tutorProfile.section.aboutMe")}
                <span className="text-rose-400 ml-1">*</span>
              </label>
              <textarea
              aria-invalid={Boolean(validationErrors.bio)}
              className={`w-full border-2 rounded-xl p-3 min-h-[100px] bg-gray-900/60 text-white placeholder-white/40 focus:ring-4 outline-none transition ${
                validationErrors.bio
                  ? "border-rose-400/70 focus:ring-rose-500/20 focus:border-rose-400"
                  : "border-white/20 focus:ring-violet-500/50 focus:border-violet-400"
              }`}
              placeholder={t("tutorProfile.placeholder.bio")}
              value={profile.bio || ""}
              onChange={(e) =>
                setProfile({
                  ...profile,
                  bio: e.target.value,
                })
              }
            />
              {validationErrors.bio && (
                <p className="mt-1.5 text-xs text-rose-300">
                  {validationErrors.bio}
                </p>
              )}
            </div>

            <div data-validation-field="professional_summary">
              <label className="block text-sm font-semibold text-white/70 mb-1">
                {t("tutorProfile.placeholder.professionalSummary")}
                <span className="text-rose-400 ml-1">*</span>
              </label>

              <textarea
              aria-invalid={Boolean(validationErrors.professional_summary)}
              className={`w-full border-2 rounded-xl p-3 min-h-[100px] mt-3 bg-gray-900/60 text-white placeholder-white/40 focus:ring-4 outline-none transition ${
                validationErrors.professional_summary
                  ? "border-rose-400/70 focus:ring-rose-500/20 focus:border-rose-400"
                  : "border-white/20 focus:ring-violet-500/50 focus:border-violet-400"
              }`}
              placeholder={t(
                "tutorProfile.placeholder.professionalSummary"
              )}
              value={profile.professional_summary || ""}
              onChange={(e) =>
                setProfile({
                  ...profile,
                  professional_summary: e.target.value,
                })
              }
              />
              {validationErrors.professional_summary && (
                <p className="mt-1.5 text-xs text-rose-300">
                  {validationErrors.professional_summary}
                </p>
              )}
            </div>
          </Section>

          {/* Education */}
          <Section title={t("tutorProfile.section.education")}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field
                label={t(
                  "tutorProfile.field.highestQualification"
                )}
                value={profile.highest_qualification || ""}
                onChange={(v) =>
                  setProfile({
                    ...profile,
                    highest_qualification: v,
                  })
                }
              
                error={validationErrors.highest_qualification}
                fieldKey="highest_qualification"
              />

              <Field
                label={t("tutorProfile.field.degree")}
                error={validationErrors.degree}
                fieldKey="degree"
                value={profile.degree || ""}
                onChange={(v) =>
                  setProfile({
                    ...profile,
                    degree: v,
                  })
                }
              />

              <Field
                label={t("tutorProfile.field.collegeName")}
                error={validationErrors.college_name}
                fieldKey="college_name"
                value={profile.college_name || ""}
                onChange={(v) =>
                  setProfile({
                    ...profile,
                    college_name: v,
                  })
                }
              />

              <Field
                label={t(
                  "tutorProfile.field.yearOfCompletion"
                )}
                value={
                  profile.year_of_completion
                    ? String(profile.year_of_completion)
                    : ""
                }
                onChange={(v) =>
                  setProfile({
                    ...profile,
                    year_of_completion: v
                      ? parseInt(v, 10)
                      : null,
                  })
                }
                type="number"
              
                error={validationErrors.year_of_completion}
                fieldKey="year_of_completion"
              />
            </div>
          </Section>

          {/* Professional Information */}
          <Section
            title={t(
              "tutorProfile.section.professionalInfo"
            )}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field
                label={t("tutorProfile.field.skills")}
                error={validationErrors.skills}
                fieldKey="skills"
                value={profile.skills || ""}
                onChange={(v) =>
                  setProfile({
                    ...profile,
                    skills: v,
                  })
                }
              />

              <Field
                label={t(
                  "tutorProfile.field.experienceYears"
                )}
                value={String(profile.experience ?? 0)}
                onChange={(v) =>
                  setProfile({
                    ...profile,
                    experience: v === "" ? 0 : Math.max(0, Math.min(60, parseInt(v, 10) || 0)),
                  })
                }
                min={0}
                max={60}
                type="number"
              
                error={validationErrors.experience}
                fieldKey="experience"
              />

              <Field
                label={t(
                  "tutorProfile.field.expertiseLevel"
                )}
                value={profile.expertise_level || ""}
                onChange={(v) =>
                  setProfile({
                    ...profile,
                    expertise_level: v,
                  })
                }
              
                error={validationErrors.expertise_level}
                fieldKey="expertise_level"
              />

              <Field
                label={t(
                  "tutorProfile.field.currentStatus"
                )}
                value={profile.current_status || ""}
                onChange={(v) =>
                  setProfile({
                    ...profile,
                    current_status: v,
                  })
                }
              
                error={validationErrors.current_status}
                fieldKey="current_status"
              />

              <Field
                label={t(
                  "tutorProfile.field.organization"
                )}
                value={profile.organization || ""}
                onChange={(v) =>
                  setProfile({
                    ...profile,
                    organization: v,
                  })
                }
              
                error={validationErrors.organization}
                fieldKey="organization"
              />
            </div>
          </Section>

          {/* Mentor Subjects */}
          <Section
            title={`${t("tutorProfile.section.mentorSubjects")} *`}
          >
            <ChipInput
              error={validationErrors.mentor_subjects}
              fieldKey="mentor_subjects"
              items={profile.mentor_subjects || []}
              onChange={(items) =>
                setProfile({
                  ...profile,
                  mentor_subjects: items,
                })
              }
              placeholder={t(
                "tutorProfile.placeholder.addSubject"
              )}
            />
          </Section>

          {/* Languages */}
          <Section title={`${t("tutorProfile.section.languages")} *`}>
            <ChipInput
              error={validationErrors.mentor_languages}
              fieldKey="mentor_languages"
              items={profile.mentor_languages || []}
              onChange={(items) =>
                setProfile({
                  ...profile,
                  mentor_languages: items,
                })
              }
              placeholder={t(
                "tutorProfile.placeholder.addLanguage"
              )}
            />
          </Section>

          {/* Resume */}
          <Section title={`${t("tutorProfile.section.resume")} *`}>
            <div className="space-y-2" data-validation-field="resume">
              {profile.resume && (
                <a
                  href={profile.resume}
                  target="_blank"
                  rel="noreferrer"
                  className="text-violet-300 underline text-sm hover:text-violet-200"
                >
                  {t("tutorProfile.viewResume")}
                </a>
              )}

              <input
                type="file"
                accept=".pdf,.doc,.docx"
                ref={resumeInputRef}
                onChange={(e) =>
                  setResumeFile(
                    e.target.files?.[0] || null
                  )
                }
                aria-invalid={Boolean(validationErrors.resume)}
                 className={`block w-full text-sm text-white file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:bg-violet-500/20 file:text-violet-300 file:font-semibold hover:file:bg-violet-500/30 file:transition ${
                   validationErrors.resume
                     ? " ring-2 ring-rose-400/40"
                     : ""
                 }`}
              />

              {resumeFile && (
                <p className="text-xs text-white/50">
                  {t("tutorProfile.newFile", {
                    name: resumeFile.name,
                  })}
                </p>
              )}

              {validationErrors.resume && (
                <p className="text-xs text-rose-300">
                  {validationErrors.resume}
                </p>
              )}
            </div>
          </Section>

          {/* Save Button */}
          <div className="sticky bottom-4 flex justify-end">
            <motion.button
              type="submit"
              disabled={saving}
              whileHover={
                saving ? undefined : { scale: 1.02 }
              }
              whileTap={
                saving ? undefined : { scale: 0.98 }
              }
              className="px-8 py-3 bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white font-bold rounded-xl shadow-lg shadow-violet-500/25 hover:shadow-xl transition disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {saving
                ? t("tutorProfile.saving")
                : t("tutorProfile.saveProfile")}
            </motion.button>
          </div>
        </motion.form>
      </div>
    </div>
  );
}

// ---------- Reusable Components ----------
const Card = ({
  label,
  value,
}: {
  label: string;
  value: string;
}) => (
  <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4 shadow-lg text-center">
    <p className="text-sm text-white/50">{label}</p>
    <p className="text-lg font-bold text-white">{value}</p>
  </div>
);

const Section = ({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) => (
  <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-xl">
    <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
      <span className="w-1.5 h-6 bg-gradient-to-b from-violet-400 to-fuchsia-400 rounded-full" />
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
  fieldKey,
  inputMode,
  maxLength,
  min,
  max,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: React.HTMLInputTypeAttribute;
  error?: string;
  fieldKey?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  maxLength?: number;
  min?: number | string;
  max?: number | string;
}) => (
  <div data-validation-field={fieldKey}>
    <label className="block text-sm font-semibold text-white/70 mb-1">
      {label}
      <span className="text-rose-400 ml-1">*</span>
    </label>

    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      inputMode={inputMode}
      maxLength={maxLength}
      min={min}
      max={max}
      required
      aria-invalid={Boolean(error)}
      className={`w-full rounded-xl px-4 py-2.5 bg-gray-900/60 text-white placeholder-white/40 outline-none transition border-2 focus:ring-4 ${
        error
          ? "border-rose-400/70 focus:border-rose-400 focus:ring-rose-500/20"
          : "border-white/20 focus:ring-violet-500/50 focus:border-violet-400"
      }`}
    />

    {error && (
      <p className="mt-1.5 text-xs text-rose-300">
        {error}
      </p>
    )}
  </div>
);

