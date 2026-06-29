"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { submitTutorApplication } from "@/services/v1Service";

// Subject categories with sub-categories
const SUBJECT_CATEGORIES = {
  "Computer Science & Programming": [
    "Programming", "Python", "Java", "JavaScript", "TypeScript", "C", "C++", 
    "C#", "Go", "Rust", "PHP", "Ruby", "Swift", "Kotlin", "Dart", "SQL", 
    "Data Structures & Algorithms", "System Design", "Competitive Programming"
  ],
  "Web & Mobile Development": [
    "Web Development", "Frontend Development", "Backend Development", 
    "Full Stack Development", "React", "React Native", "Angular", "Vue.js", 
    "Node.js", "Express.js", "Django", "Flask", "Spring Boot", "Laravel", 
    "Flutter", "Android Development", "iOS Development"
  ],
  "AI & Data": [
    "Artificial Intelligence", "Machine Learning", "Deep Learning", 
    "Generative AI", "Prompt Engineering", "Natural Language Processing", 
    "Computer Vision", "Data Science", "Data Analytics", "Big Data", 
    "Data Engineering"
  ],
  "Cloud & DevOps": [
    "Cloud Computing", "AWS", "Microsoft Azure", "Google Cloud", "Docker", 
    "Kubernetes", "DevOps", "Linux", "Git & GitHub", "Cyber Security"
  ],
  "Engineering": [
    "Computer Science", "Information Technology", "Electronics", 
    "Electrical Engineering", "Mechanical Engineering", "Civil Engineering", 
    "Chemical Engineering"
  ],
  "School Subjects": [
    "Mathematics", "Physics", "Chemistry", "Biology", "Science", "English", 
    "Tamil", "Hindi", "Social Science", "History", "Geography", "Economics", 
    "Political Science"
  ],
  "Commerce": [
    "Accountancy", "Business Studies", "Commerce", "Finance", "Taxation", 
    "Statistics"
  ],
  "Competitive Exams": [
    "UPSC", "TNPSC", "SSC", "Banking Exams", "Railway Exams", "NEET", "JEE", 
    "GATE", "CAT", "GRE", "GMAT", "IELTS", "TOEFL"
  ],
  "College & Higher Education": [
    "MBA", "Law", "Medical", "Nursing", "Pharmacy", "Architecture"
  ],
  "Design & Creative": [
    "UI/UX Design", "Graphic Design", "Figma", "Adobe Photoshop", 
    "Adobe Illustrator", "Video Editing", "Animation", "3D Modeling"
  ],
  "Career Skills": [
    "Interview Preparation", "Resume Building", "Communication Skills", 
    "Public Speaking", "Leadership", "Project Management", "Digital Marketing", 
    "Content Writing", "Entrepreneurship", "Startup Mentoring"
  ],
  "Languages": [
    "English Speaking", "French", "German", "Japanese", "Spanish"
  ],
  "Miscellaneous": [
    "Current Affairs", "General Knowledge", "Research", "Others"
  ]
};

// Flatten subjects for backward compatibility
const SUBJECT_OPTIONS = Object.values(SUBJECT_CATEGORIES).flat();

const LANGUAGE_OPTIONS = [
  "English", "Hindi", "Tamil", "Telugu", "Malayalam", "Kannada", "Marathi", 
  "Gujarati", "Bengali", "Punjabi", "Odia", "Assamese", "Urdu", "Sanskrit", 
  "Konkani", "Manipuri (Meitei)", "Bodo", "Dogri", "Kashmiri", "Maithili", 
  "Nepali", "Santali", "Sindhi"
];

// Qualification options with radio buttons
const QUALIFICATION_OPTIONS = [
  "High School",
  "Diploma", 
  "UG (Undergraduate)",
  "PG (Postgraduate)",
  "MPhil",
  "PhD",
  "Post-Doctoral"
];

export default function BecomeTutorPage() {
  const [loading, setLoading] = useState(false);
  const [resume, setResume] = useState<File | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [applicationId, setApplicationId] = useState<number | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("");

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
    
    // Validation
    if (!form.full_name || !form.email || !form.phone || !form.city_state) {
      toast.error("Please fill in all required fields");
      return;
    }
    
    if (form.mentor_subjects.length === 0) {
      toast.error("Please select at least one subject you can teach");
      return;
    }

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
      <div className="min-h-screen bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e] flex items-center justify-center relative overflow-hidden p-4">
        {/* Animated background blobs */}
        <div className="absolute top-0 -left-20 w-72 h-72 bg-purple-500/20 rounded-full mix-blend-multiply filter blur-3xl animate-blob" />
        <div className="absolute top-0 -right-20 w-72 h-72 bg-fuchsia-500/20 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000" />
        <div className="absolute -bottom-20 left-40 w-72 h-72 bg-cyan-500/20 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000" />

        <div className="relative z-10 w-full max-w-2xl rounded-3xl bg-white/5 backdrop-blur-xl border border-white/10 p-8 text-center shadow-2xl sm:p-12">
          <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-violet-500/30 text-5xl backdrop-blur-sm">
            🎉
          </div>
          <h1 className="text-3xl font-bold text-white">Application Submitted!</h1>
          <p className="mt-4 text-lg text-violet-200">
            Thank you for applying to become a KnowMato Tutor.
          </p>
          <div className="mt-8 rounded-2xl bg-white/10 backdrop-blur-sm p-6">
            <p className="text-sm text-violet-200">Application ID</p>
            <p className="mt-2 text-3xl font-bold text-white">#{applicationId}</p>
          </div>
          <div className="mt-8 space-y-3 text-left text-white">
            <div className="flex items-center gap-3">
              <span className="text-emerald-400">✅</span>
              <span>Your application has been received.</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-emerald-400">✅</span>
              <span>Our team will review your profile.</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-emerald-400">✅</span>
              <span>Approved tutors will receive login credentials via email.</span>
            </div>
          </div>
          <button
            onClick={() => (window.location.href = "/")}
            className="mt-8 w-full rounded-2xl bg-gradient-to-r from-violet-500 to-fuchsia-500 px-8 py-4 font-bold text-white shadow-lg shadow-violet-500/25 hover:from-violet-600 hover:to-fuchsia-600 transition focus:outline-none focus:ring-4 focus:ring-violet-400"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  // ---------- Application form ----------
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e] relative overflow-hidden">
      {/* Animated background blobs */}
      <div className="absolute top-0 -left-20 w-72 h-72 bg-purple-500/20 rounded-full mix-blend-multiply filter blur-3xl animate-blob" />
      <div className="absolute top-0 -right-20 w-72 h-72 bg-fuchsia-500/20 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000" />
      <div className="absolute -bottom-20 left-40 w-72 h-72 bg-cyan-500/20 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000" />

      <div className="relative z-10 mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        {/* Hero */}
        <div className="mb-10 overflow-hidden rounded-3xl bg-gradient-to-r from-violet-500 to-fuchsia-500 p-8 text-center shadow-2xl sm:p-10">
          <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            Become a KnowMato Tutor
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
                placeholder="Enter your full name"
                value={form.full_name}
                onChange={(v) => updateField("full_name", v)}
              />
              <InputField
                label="Email *"
                type="email"
                placeholder="your.email@example.com"
                value={form.email}
                onChange={(v) => updateField("email", v)}
              />
              <InputField
                label="Phone Number *"
                type="tel"
                placeholder="+91 98765 43210"
                value={form.phone}
                onChange={(v) => updateField("phone", v)}
              />
              <InputField
                label="City & State *"
                placeholder="e.g., Chennai, Tamil Nadu"
                value={form.city_state}
                onChange={(v) => updateField("city_state", v)}
              />
            </div>
            <div className="mt-6">
              <InputField
                label="LinkedIn Profile"
                type="url"
                placeholder="https://linkedin.com/in/your-profile"
                value={form.linkedin_profile}
                onChange={(v) => updateField("linkedin_profile", v)}
              />
            </div>
          </SectionCard>

          {/* Education */}
          <SectionCard icon="🎓" title="Educational Background">
            {/* Highest Qualification - Radio Buttons */}
            <div className="mb-6">
              <label className="mb-2 block text-sm font-medium text-white/90">
                Highest Qualification *
              </label>
              <div className="flex flex-wrap gap-3">
                {QUALIFICATION_OPTIONS.map((qual) => (
                  <label
                    key={qual}
                    className={`cursor-pointer rounded-full px-5 py-2.5 text-sm font-semibold transition ${
                      form.highest_qualification === qual
                        ? "bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white shadow-lg shadow-violet-500/25"
                        : "bg-white/10 text-white/70 hover:bg-white/20"
                    }`}
                  >
                    <input
                      type="radio"
                      name="highest_qualification"
                      value={qual}
                      checked={form.highest_qualification === qual}
                      onChange={(e) => updateField("highest_qualification", e.target.value)}
                      className="hidden"
                    />
                    {form.highest_qualification === qual ? "✓ " : ""}
                    {qual}
                  </label>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <InputField
                label="Degree / Specialization"
                placeholder="e.g., B.Tech in Computer Science"
                value={form.degree}
                onChange={(v) => updateField("degree", v)}
              />
              <InputField
                label="College / University"
                placeholder="e.g., Anna University"
                value={form.college_name}
                onChange={(v) => updateField("college_name", v)}
              />
              <InputField
                label="Year of Completion"
                type="number"
                placeholder="e.g., 2023"
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
                placeholder="e.g., Python, React, AI, Machine Learning..."
                value={form.skills}
                onChange={(v) => updateField("skills", v)}
              />
              <InputField
                label="Experience (Years)"
                type="number"
                placeholder="e.g., 5"
                value={form.experience}
                onChange={(v) => updateField("experience", v)}
              />
              <SelectField
                label="Expertise Level"
                value={form.expertise_level}
                onChange={(v) => updateField("expertise_level", v)}
                options={["", "Beginner", "Intermediate", "Advanced", "Expert"]}
              />
              <SelectField
                label="Current Status"
                value={form.current_status}
                onChange={(v) => updateField("current_status", v)}
                options={["", "Student", "Working Professional", "Freelancer", "Teacher"]}
              />
            </div>
            <div className="mt-6">
              <InputField
                label="Organization/Company"
                placeholder="e.g., Google, Self-employed, XYZ Corp"
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
                className="w-full rounded-xl border-2 border-white/20 bg-gray-900/60 px-4 py-3 text-white shadow-sm backdrop-blur-sm transition placeholder:text-white/40 focus:border-violet-400 focus:ring-4 focus:ring-violet-500/50 outline-none"
                placeholder="Tell us about your expertise, teaching philosophy, and what makes you a great tutor..."
              />
            </div>
          </SectionCard>

          {/* Subjects - Categorized with Checkbox Selection */}
          <SectionCard icon="📘" title="Subjects You Can Teach">
            <div className="mb-4">
              <label className="mb-2 block text-sm font-medium text-white/90">
                Filter by Category
              </label>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedCategory("")}
                  className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                    selectedCategory === ""
                      ? "bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white shadow-lg shadow-violet-500/25"
                      : "bg-white/10 text-white/70 hover:bg-white/20"
                  }`}
                >
                  All Subjects
                </button>
                {Object.keys(SUBJECT_CATEGORIES).map((category) => (
                  <button
                    type="button"
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                      selectedCategory === category
                        ? "bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white shadow-lg shadow-violet-500/25"
                        : "bg-white/10 text-white/70 hover:bg-white/20"
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-4">
              {selectedCategory ? (
                <div>
                  <h3 className="mb-3 text-lg font-semibold text-white">
                    {selectedCategory}
                  </h3>
                  <CheckboxSelector
                    options={SUBJECT_CATEGORIES[selectedCategory as keyof typeof SUBJECT_CATEGORIES] || []}
                    selected={form.mentor_subjects}
                    onToggle={toggleSubject}
                  />
                </div>
              ) : (
                Object.entries(SUBJECT_CATEGORIES).map(([category, subjects]) => (
                  <div key={category} className="mb-6 last:mb-0">
                    <h3 className="mb-3 text-lg font-semibold text-white">
                      {category}
                    </h3>
                    <CheckboxSelector
                      options={subjects}
                      selected={form.mentor_subjects}
                      onToggle={toggleSubject}
                    />
                  </div>
                ))
              )}
            </div>

            {form.mentor_subjects.length > 0 && (
              <div className="mt-4 rounded-xl bg-violet-500/20 p-4 backdrop-blur-sm border border-violet-400/30">
                <div className="flex items-start gap-2">
                  <span className="text-violet-300 text-lg">📚</span>
                  <div>
                    <p className="text-sm font-medium text-white">
                      Selected Subjects ({form.mentor_subjects.length})
                    </p>
                    <p className="text-sm text-white/80 mt-1">
                      {form.mentor_subjects.join(", ")}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </SectionCard>

          {/* Languages - Checkbox Selection */}
          <SectionCard icon="🌐" title="Languages You Can Teach In">
            <CheckboxSelector
              options={LANGUAGE_OPTIONS}
              selected={form.mentor_languages}
              onToggle={toggleLanguage}
            />
            {form.mentor_languages.length > 0 && (
              <div className="mt-4 rounded-xl bg-emerald-500/20 p-4 backdrop-blur-sm border border-emerald-400/30">
                <div className="flex items-start gap-2">
                  <span className="text-emerald-300 text-lg">🗣️</span>
                  <div>
                    <p className="text-sm font-medium text-white">
                      Selected Languages ({form.mentor_languages.length})
                    </p>
                    <p className="text-sm text-white/80 mt-1">
                      {form.mentor_languages.join(", ")}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </SectionCard>

          {/* Resume Upload */}
          <SectionCard icon="📄" title="Resume Upload">
            <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-white/20 bg-white/5 p-8 backdrop-blur-sm transition hover:bg-white/10">
              <span className="text-4xl text-white/60">📁</span>
              <p className="mt-2 text-sm font-medium text-white/80">
                {resume ? resume.name : "Drag & drop your resume or click to browse"}
              </p>
              <p className="mt-1 text-xs text-white/50">
                Supported formats: PDF, DOC, DOCX
              </p>
              <input
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={(e) => setResume(e.target.files?.[0] || null)}
                className="hidden"
              />
            </label>
            {resume && (
              <p className="mt-3 text-sm text-emerald-400">✓ File selected: {resume.name}</p>
            )}
          </SectionCard>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-2xl bg-gradient-to-r from-violet-500 to-fuchsia-500 py-4 text-lg font-bold text-white shadow-xl shadow-violet-500/25 hover:from-violet-600 hover:to-fuchsia-600 transition focus:outline-none focus:ring-4 focus:ring-violet-400 disabled:cursor-not-allowed disabled:opacity-60"
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

// ---------- Reusable components (restyled) ----------
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
    <div className="rounded-3xl bg-white/5 backdrop-blur-xl border border-white/10 p-6 shadow-2xl sm:p-8">
      <h2 className="mb-6 flex items-center gap-2 text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-violet-300 to-fuchsia-300">
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
        className="w-full rounded-xl border-2 border-white/20 bg-gray-900/60 px-4 py-3 text-white shadow-sm backdrop-blur-sm transition placeholder:text-white/40 focus:border-violet-400 focus:ring-4 focus:ring-violet-500/50 outline-none"
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
        className="w-full rounded-xl border-2 border-white/20 bg-gray-900/60 px-4 py-3 text-white shadow-sm backdrop-blur-sm transition focus:border-violet-400 focus:ring-4 focus:ring-violet-500/50 outline-none appearance-none"
      >
        {options.map((opt) => (
          <option key={opt} value={opt} className="bg-gray-800 text-white">
            {opt || "Select an option"}
          </option>
        ))}
      </select>
    </div>
  );
}

// CheckboxSelector component (restyled)
function CheckboxSelector({
  options,
  selected,
  onToggle,
}: {
  options: string[];
  selected: string[];
  onToggle: (val: string) => void;
}) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
      {options.map((item) => (
        <label
          key={item}
          className={`flex items-center gap-2 cursor-pointer rounded-xl px-4 py-3 transition ${
            selected.includes(item)
              ? "bg-violet-500/30 text-white border-2 border-violet-400"
              : "bg-white/5 text-white/70 hover:bg-white/10 border-2 border-transparent"
          }`}
        >
          <input
            type="checkbox"
            checked={selected.includes(item)}
            onChange={() => onToggle(item)}
            className="hidden"
          />
          <div className={`w-5 h-5 rounded-md flex items-center justify-center transition ${
            selected.includes(item) 
              ? "bg-violet-500 text-white" 
              : "bg-white/20"
          }`}>
            {selected.includes(item) && (
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
              </svg>
            )}
          </div>
          <span className="text-sm font-medium">{item}</span>
        </label>
      ))}
    </div>
  );
}

// Keep ChipSelector for backward compatibility but it's not used
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