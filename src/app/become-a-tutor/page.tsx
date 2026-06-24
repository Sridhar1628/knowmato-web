"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { submitTutorApplication } from "@/services/v1Service";

const SUBJECT_OPTIONS = [
  "Programming",
  "Python",
  "Java",
  "Web Development",
  "AI / ML",
  "Data Science",
  "Mathematics",
  "Science",
  "English",
  "Current Affairs",
];

const LANGUAGE_OPTIONS = [
  "English",
  "Tamil",
  "Hindi",
  "Telugu",
  "Malayalam",
  "Kannada",
];

export default function BecomeTutorPage() {
  const [loading, setLoading] = useState(false);
  const [resume, setResume] = useState<File | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [applicationId, setApplicationId] = useState<number | null>(null);

  const [form, setForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    city_state: "",
    linkedin_profile: "",
    highest_qualification: "",
    degree: "",
    college_name: "",
    year_of_completion: "",
    skills: "",
    experience: "",
    expertise_level: "",
    current_status: "",
    organization: "",
    professional_summary: "",
    mentor_subjects: [] as string[],
    mentor_languages: [] as string[],
  });

  const updateField = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const toggleSubject = (subject: string) =>
    setForm((prev) => ({
      ...prev,
      mentor_subjects: prev.mentor_subjects.includes(subject)
        ? prev.mentor_subjects.filter((s) => s !== subject)
        : [...prev.mentor_subjects, subject],
    }));

  const toggleLanguage = (language: string) =>
    setForm((prev) => ({
      ...prev,
      mentor_languages: prev.mentor_languages.includes(language)
        ? prev.mentor_languages.filter((l) => l !== language)
        : [...prev.mentor_languages, language],
    }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      const formData = new FormData();
      Object.entries(form).forEach(([key, value]) => {
        if (Array.isArray(value)) {
          formData.append(key, JSON.stringify(value));
        } else {
          formData.append(key, String(value));
        }
      });
      if (resume) formData.append("resume", resume);

      const response = await submitTutorApplication(formData);
      setApplicationId(response.application_id);
      setSubmitted(true);
      toast.success("Application submitted successfully!");
    } catch (error) {
      console.error(error);
      toast.error("Failed to submit application. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ---------- Success screen ----------
  if (submitted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-indigo-900 via-purple-900 to-slate-900 p-4">
        <div className="w-full max-w-2xl rounded-3xl bg-white/10 p-8 text-center shadow-2xl backdrop-blur-md sm:p-12">
          <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-indigo-500/30 text-5xl backdrop-blur-sm">
            🎉
          </div>
          <h1 className="text-3xl font-bold text-white">Application Submitted!</h1>
          <p className="mt-4 text-lg text-indigo-200">
            Thank you for applying to become a Knowmato Tutor.
          </p>
          <div className="mt-8 rounded-2xl bg-white/10 p-6 backdrop-blur-sm">
            <p className="text-sm text-indigo-200">Application ID</p>
            <p className="mt-2 text-3xl font-bold text-white">#{applicationId}</p>
          </div>
          <div className="mt-8 space-y-3 text-left text-white">
            <div className="flex items-center gap-3">
              <span className="text-green-400">✅</span>
              <span>Your application has been received.</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-green-400">✅</span>
              <span>Our team will review your profile.</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-green-400">✅</span>
              <span>Approved tutors will receive login credentials via email.</span>
            </div>
          </div>
          <button
            onClick={() => (window.location.href = "/")}
            className="mt-8 w-full rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-500 px-8 py-4 font-bold text-white shadow-lg transition hover:from-indigo-600 hover:to-purple-600 focus:ring-4 focus:ring-indigo-300"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  // ---------- Application form ----------
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-slate-900">
      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        {/* Hero */}
        <div className="mb-10 overflow-hidden rounded-3xl bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 p-8 text-center shadow-2xl sm:p-10">
          <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            Become a Knowmato Tutor
          </h1>
          <p className="mt-3 text-lg text-white/80">
            Share your knowledge, earn money, and inspire students worldwide.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Personal Information */}
          <SectionCard icon="👤" title="Personal Information">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <InputField
                label="Full Name *"
                value={form.full_name}
                onChange={(v) => updateField("full_name", v)}
              />
              <InputField
                label="Email *"
                type="email"
                value={form.email}
                onChange={(v) => updateField("email", v)}
              />
              <InputField
                label="Phone Number *"
                type="tel"
                value={form.phone}
                onChange={(v) => updateField("phone", v)}
              />
              <InputField
                label="City & State *"
                value={form.city_state}
                onChange={(v) => updateField("city_state", v)}
              />
            </div>
            <div className="mt-6">
              <InputField
                label="LinkedIn Profile"
                type="url"
                value={form.linkedin_profile}
                onChange={(v) => updateField("linkedin_profile", v)}
                placeholder="https://linkedin.com/in/..."
              />
            </div>
          </SectionCard>

          {/* Education */}
          <SectionCard icon="🎓" title="Educational Background">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <InputField
                label="Highest Qualification"
                value={form.highest_qualification}
                onChange={(v) => updateField("highest_qualification", v)}
              />
              <InputField
                label="Degree"
                value={form.degree}
                onChange={(v) => updateField("degree", v)}
              />
              <InputField
                label="College Name"
                value={form.college_name}
                onChange={(v) => updateField("college_name", v)}
              />
              <InputField
                label="Year of Completion"
                type="number"
                value={form.year_of_completion}
                onChange={(v) => updateField("year_of_completion", v)}
              />
            </div>
          </SectionCard>

          {/* Professional Experience */}
          <SectionCard icon="💼" title="Professional Experience">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <InputField
                label="Skills *"
                value={form.skills}
                onChange={(v) => updateField("skills", v)}
                placeholder="e.g., Python, React, AI..."
              />
              <InputField
                label="Experience (Years)"
                type="number"
                value={form.experience}
                onChange={(v) => updateField("experience", v)}
              />
              <SelectField
                label="Expertise Level"
                value={form.expertise_level}
                onChange={(v) => updateField("expertise_level", v)}
                options={[
                  "",
                  "Beginner",
                  "Intermediate",
                  "Advanced",
                  "Expert",
                ]}
              />
              <SelectField
                label="Current Status"
                value={form.current_status}
                onChange={(v) => updateField("current_status", v)}
                options={[
                  "",
                  "Student",
                  "Working Professional",
                  "Freelancer",
                  "Teacher",
                ]}
              />
            </div>
            <div className="mt-6">
              <InputField
                label="Organization"
                value={form.organization}
                onChange={(v) => updateField("organization", v)}
              />
            </div>
            <div className="mt-6">
              <label className="mb-1 block text-sm font-medium text-white/90">
                Professional Summary
              </label>
              <textarea
                rows={5}
                value={form.professional_summary}
                onChange={(e) => updateField("professional_summary", e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-white shadow-sm backdrop-blur-sm transition placeholder:text-white/50 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/30"
                placeholder="Tell us about your expertise and teaching philosophy..."
              />
            </div>
          </SectionCard>

          {/* Subjects */}
          <SectionCard icon="📘" title="Subjects You Can Teach">
            <ChipSelector
              options={SUBJECT_OPTIONS}
              selected={form.mentor_subjects}
              onToggle={toggleSubject}
              activeClass="bg-indigo-500 text-white shadow-indigo-500/25"
              inactiveClass="bg-white/10 text-white/70 hover:bg-white/20"
            />
          </SectionCard>

          {/* Languages */}
          <SectionCard icon="🌐" title="Languages">
            <ChipSelector
              options={LANGUAGE_OPTIONS}
              selected={form.mentor_languages}
              onToggle={toggleLanguage}
              activeClass="bg-green-500 text-white shadow-green-500/25"
              inactiveClass="bg-white/10 text-white/70 hover:bg-white/20"
            />
          </SectionCard>

          {/* Resume Upload */}
          <SectionCard icon="📄" title="Resume Upload">
            <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-white/20 bg-white/5 p-8 backdrop-blur-sm transition hover:bg-white/10">
              <span className="text-4xl text-white/60">📁</span>
              <p className="mt-2 text-sm font-medium text-white/80">
                {resume ? resume.name : "Drag & drop your resume or click to browse"}
              </p>
              <input
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={(e) => setResume(e.target.files?.[0] || null)}
                className="hidden"
              />
            </label>
            {resume && (
              <p className="mt-3 text-sm text-green-400">✓ File selected: {resume.name}</p>
            )}
          </SectionCard>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-2xl bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 py-4 text-lg font-bold text-white shadow-xl transition-all hover:from-pink-600 hover:via-purple-600 hover:to-indigo-600 focus:outline-none focus:ring-4 focus:ring-indigo-300 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Submitting...
              </span>
            ) : (
              "Submit Application"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

// ---------- Reusable components ----------
function SectionCard({
  icon,
  title,
  children,
}: {
  icon: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-3xl bg-white/10 p-6 backdrop-blur-md shadow-2xl ring-1 ring-white/10 sm:p-8">
      <h2 className="mb-6 flex items-center gap-2 text-2xl font-bold text-white">
        <span className="text-3xl">{icon}</span> {title}
      </h2>
      {children}
    </div>
  );
}

function InputField({
  label,
  type = "text",
  value,
  onChange,
  placeholder = "",
}: {
  label: string;
  type?: string;
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-white/90">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-white shadow-sm backdrop-blur-sm transition placeholder:text-white/50 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/30"
      />
    </div>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (val: string) => void;
  options: string[];
}) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-white/90">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-white shadow-sm backdrop-blur-sm transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/30"
      >
        {options.map((opt) => (
          <option key={opt} value={opt} className="bg-slate-800 text-white">
            {opt || "Select"}
          </option>
        ))}
      </select>
    </div>
  );
}

function ChipSelector({
  options,
  selected,
  onToggle,
  activeClass,
  inactiveClass,
}: {
  options: string[];
  selected: string[];
  onToggle: (val: string) => void;
  activeClass: string;
  inactiveClass: string;
}) {
  return (
    <div className="flex flex-wrap gap-3">
      {options.map((item) => (
        <button
          type="button"
          key={item}
          onClick={() => onToggle(item)}
          className={`rounded-full px-5 py-2.5 text-sm font-semibold transition ${
            selected.includes(item) ? activeClass : inactiveClass
          }`}
        >
          {selected.includes(item) ? "✓ " : ""}
          {item}
        </button>
      ))}
    </div>
  );
}