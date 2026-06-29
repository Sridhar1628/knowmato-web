"use client";

import { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { getTutorProfile, updateTutorProfile } from "@/services/v1Service";

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
    const token = JSON.parse(localStorage.getItem("access_token") || "null") as string;
    if (!token) return "Tutor";
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.display_name || payload.email || "Tutor";
  } catch {
    return "Tutor";
  }
}

// ---------- Chip Input Component (dark themed) ----------
const ChipInput = ({
  items,
  onChange,
  placeholder,
}: {
  items: string[];
  onChange: (items: string[]) => void;
  placeholder: string;
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

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addItem();
    } else if (e.key === "Backspace" && !input && items.length > 0) {
      removeItem(items[items.length - 1]);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2 border-2 border-white/20 rounded-xl px-3 py-2 bg-gray-900/60 focus-within:ring-4 focus-within:ring-violet-500/50 focus-within:border-violet-400 transition">
      {items.map((item, idx) => (
        <span
          key={idx}
          className="inline-flex items-center gap-1 bg-violet-500/20 text-violet-300 px-2.5 py-0.5 rounded-full text-sm border border-violet-400/30"
        >
          {item}
          <button
            type="button"
            onClick={() => removeItem(item)}
            className="hover:text-rose-400 transition"
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
        onBlur={addItem}
        placeholder={items.length === 0 ? placeholder : ""}
        className="flex-1 min-w-[120px] outline-none text-sm bg-transparent text-white placeholder-white/40"
      />
    </div>
  );
};

// ---------- Skeleton Loader (dark) ----------
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
  const [profile, setProfile] = useState<TutorProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const resumeInputRef = useRef<HTMLInputElement>(null);

  const displayName = getUserNameFromToken();

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await getTutorProfile();
        setProfile(res.data);
      } catch (err: any) {
        toast.error("Failed to load profile");
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setSaving(true);
    const formData = new FormData();
    formData.append("bio", profile.bio || "");
    formData.append("skills", profile.skills || "");
    formData.append("experience", String(profile.experience || 0));
    formData.append("phone_number", profile.phone_number || "");
    formData.append("city_state", profile.city_state || "");
    formData.append("linkedin_profile", profile.linkedin_profile || "");
    formData.append("highest_qualification", profile.highest_qualification || "");
    formData.append("degree", profile.degree || "");
    formData.append("college_name", profile.college_name || "");
    formData.append("year_of_completion", String(profile.year_of_completion || ""));
    formData.append("expertise_level", profile.expertise_level || "");
    formData.append("current_status", profile.current_status || "");
    formData.append("organization", profile.organization || "");
    formData.append("professional_summary", profile.professional_summary || "");
    formData.append("mentor_subjects", JSON.stringify(profile.mentor_subjects || []));
    formData.append("mentor_languages", JSON.stringify(profile.mentor_languages || []));
    if (resumeFile) formData.append("resume", resumeFile);

    try {
      await updateTutorProfile(formData);
      toast.success("Profile updated successfully");
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "Update failed");
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
      <div className="min-h-screen bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e] flex items-center justify-center text-white/70">
        Profile not found.
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
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-2xl">
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-2xl font-bold text-white shadow-lg">
                {displayName.charAt(0).toUpperCase()}
              </div>
              <div className="text-center sm:text-left">
                <h1 className="text-2xl font-extrabold text-white">
                  {displayName}
                </h1>
                <p className="text-white/50">Tutor ID: {profile.id}</p>
                <div className="flex gap-2 mt-2 justify-center sm:justify-start flex-wrap">
                  {profile.is_verified && (
                    <span className="px-2 py-0.5 bg-emerald-400/20 text-emerald-300 rounded-full text-xs font-semibold border border-emerald-400/30">
                      ✅ Verified
                    </span>
                  )}
                  <span className="px-2 py-0.5 bg-amber-400/20 text-amber-300 rounded-full text-xs font-semibold border border-amber-400/30">
                    ⭐ {profile.average_rating.toFixed(1)}
                  </span>
                  <span className="px-2 py-0.5 bg-sky-400/20 text-sky-300 rounded-full text-xs font-semibold border border-sky-400/30">
                    📝 {profile.total_reviews} reviews
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card label="Average Rating" value={`⭐ ${profile.average_rating.toFixed(1)}`} />
            <Card label="Total Reviews" value={`📝 ${profile.total_reviews}`} />
            <Card label="Verified" value={profile.is_verified ? "✅ Yes" : "❌ No"} />
            <Card label="Online" value={profile.is_online ? "🟢 Online" : "⚫ Offline"} />
          </div>

          {/* Personal Information */}
          <Section title="Personal Information">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field
                label="Phone Number"
                value={profile.phone_number}
                onChange={(v) => setProfile({ ...profile, phone_number: v })}
              />
              <Field
                label="City / State"
                value={profile.city_state}
                onChange={(v) => setProfile({ ...profile, city_state: v })}
              />
              <Field
                label="LinkedIn Profile"
                value={profile.linkedin_profile}
                onChange={(v) => setProfile({ ...profile, linkedin_profile: v })}
              />
            </div>
          </Section>

          {/* About Me */}
          <Section title="About Me">
            <textarea
              className="w-full border-2 border-white/20 rounded-xl p-3 min-h-[100px] bg-gray-900/60 text-white placeholder-white/40 focus:ring-4 focus:ring-violet-500/50 focus:border-violet-400 outline-none transition"
              placeholder="Write a short bio..."
              value={profile.bio}
              onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
            />
            <textarea
              className="w-full border-2 border-white/20 rounded-xl p-3 min-h-[100px] mt-3 bg-gray-900/60 text-white placeholder-white/40 focus:ring-4 focus:ring-violet-500/50 focus:border-violet-400 outline-none transition"
              placeholder="Professional summary..."
              value={profile.professional_summary}
              onChange={(e) => setProfile({ ...profile, professional_summary: e.target.value })}
            />
          </Section>

          {/* Education */}
          <Section title="Education">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field
                label="Highest Qualification"
                value={profile.highest_qualification}
                onChange={(v) => setProfile({ ...profile, highest_qualification: v })}
              />
              <Field
                label="Degree"
                value={profile.degree}
                onChange={(v) => setProfile({ ...profile, degree: v })}
              />
              <Field
                label="College Name"
                value={profile.college_name}
                onChange={(v) => setProfile({ ...profile, college_name: v })}
              />
              <Field
                label="Year of Completion"
                value={profile.year_of_completion ? String(profile.year_of_completion) : ""}
                onChange={(v) =>
                  setProfile({ ...profile, year_of_completion: v ? parseInt(v) : null })
                }
                type="number"
              />
            </div>
          </Section>

          {/* Professional */}
          <Section title="Professional Information">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field
                label="Skills"
                value={profile.skills}
                onChange={(v) => setProfile({ ...profile, skills: v })}
              />
              <Field
                label="Experience (years)"
                value={String(profile.experience)}
                onChange={(v) => setProfile({ ...profile, experience: parseInt(v) || 0 })}
                type="number"
              />
              <Field
                label="Expertise Level"
                value={profile.expertise_level}
                onChange={(v) => setProfile({ ...profile, expertise_level: v })}
              />
              <Field
                label="Current Status"
                value={profile.current_status}
                onChange={(v) => setProfile({ ...profile, current_status: v })}
              />
              <Field
                label="Organization"
                value={profile.organization}
                onChange={(v) => setProfile({ ...profile, organization: v })}
              />
            </div>
          </Section>

          {/* Mentor Subjects */}
          <Section title="Mentor Subjects">
            <ChipInput
              items={profile.mentor_subjects}
              onChange={(items) => setProfile({ ...profile, mentor_subjects: items })}
              placeholder="Add subject..."
            />
          </Section>

          {/* Languages */}
          <Section title="Languages">
            <ChipInput
              items={profile.mentor_languages}
              onChange={(items) => setProfile({ ...profile, mentor_languages: items })}
              placeholder="Add language..."
            />
          </Section>

          {/* Resume */}
          <Section title="Resume">
            <div className="space-y-2">
              {profile.resume && (
                <a
                  href={profile.resume}
                  target="_blank"
                  rel="noreferrer"
                  className="text-violet-300 underline text-sm hover:text-violet-200"
                >
                  View Current Resume
                </a>
              )}
              <input
                type="file"
                accept=".pdf,.doc,.docx"
                ref={resumeInputRef}
                onChange={(e) => setResumeFile(e.target.files?.[0] || null)}
                className="block w-full text-sm text-white file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:bg-violet-500/20 file:text-violet-300 file:font-semibold hover:file:bg-violet-500/30 file:transition"
              />
              {resumeFile && (
                <p className="text-xs text-white/50">New file: {resumeFile.name}</p>
              )}
            </div>
          </Section>

          {/* Save Button */}
          <div className="sticky bottom-4 flex justify-end">
            <motion.button
              type="submit"
              disabled={saving}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="px-8 py-3 bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white font-bold rounded-xl shadow-lg shadow-violet-500/25 hover:shadow-xl transition disabled:opacity-60 flex items-center gap-2"
            >
              {saving ? "Saving..." : "Save Profile"}
            </motion.button>
          </div>
        </motion.form>
      </div>
    </div>
  );
}

// ---------- Reusable Components (dark themed) ----------
const Card = ({ label, value }: { label: string; value: string }) => (
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
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
}) => (
  <div>
    <label className="block text-sm font-semibold text-white/70 mb-1">{label}</label>
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full border-2 border-white/20 rounded-xl px-4 py-2.5 bg-gray-900/60 text-white placeholder-white/40 focus:ring-4 focus:ring-violet-500/50 focus:border-violet-400 outline-none transition"
    />
  </div>
);