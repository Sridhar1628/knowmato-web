"use client";

import { useState } from "react";
import AlertService from "@/services/alertService";
import { applyForCompany } from "@/services/v2Service";

// ----------------------------------------------------------
// Static data
// ----------------------------------------------------------

const INDUSTRY_OPTIONS = [
  "Software",
  "IT Services",
  "Finance",
  "Banking",
  "Education",
  "Healthcare",
  "Manufacturing",
  "E-Commerce",
  "Telecom",
  "Other",
];

export default function CompanyApplicationForm() {
  const [loading, setLoading] = useState(false);
  const [logo, setLogo] = useState<File | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [applicationId, setApplicationId] = useState<number | null>(null);

  const [form, setForm] = useState({
    company_name: "",
    industry: "",
    website: "",
    email: "",
    phone: "",
    hr_name: "",
    hr_email: "",
    hr_phone: "",
    address: "",
    city: "",
    state: "",
    country: "",
    postal_code: "",
    company_description: "",
    registration_number: "",
    gst_number: "",
    pan_number: "",
    linkedin_url: "",
    employee_count: "",
    founded_year: "",
  });

  const updateField = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // ---------- Basic validation ----------
    if (!form.company_name.trim()) {
      AlertService.warning(
        "Missing Company Name",
        "Please enter your company name before submitting the application.",[]
      );
      return;
    }

    if (!form.email.trim()) {
      AlertService.warning(
        "Missing Email",
        "Please enter your company email address before submitting the application.",[]
      );
      return;
    }

    if (!form.phone.trim()) {
      AlertService.warning(
        "Missing Phone Number",
        "Please enter your company phone number before submitting the application.",[]
      );
      return;
    }

    if (!form.address.trim()) {
      AlertService.warning(
        "Missing Address",
        "Please enter your company address before submitting the application.",[]
      );
      return;
    }
    try {
      setLoading(true);

      const formData = new FormData();
      // Append all form fields
      Object.entries(form).forEach(([key, value]) => {
        formData.append(key, value);
      });
      // Append logo file if selected
      if (logo) formData.append("logo", logo);

      const response = await applyForCompany(formData);
      setApplicationId(response.data.id); // from the response shape (ApplyCompanyResponse)
      setSubmitted(true);
      AlertService.success(
        "Application Submitted",
        response?.message ||
          "Your company application has been submitted successfully. Our team will review your details.",
      );
    } catch (error: any) {
      console.error(error);
      const message =
        error?.response?.data?.message || "Failed to submit application. Please try again.";
      AlertService.error(
        "Application Failed",
        message,
      );
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
            Thank you for applying as a company. Our team will review your details.
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
              <span>Our team will review your company profile.</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-emerald-400">✅</span>
              <span>Approved companies will receive login credentials via email.</span>
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
            Register Your Company
          </h1>
          <p className="mt-3 text-lg text-white/80">
            List your jobs and internships, and connect with top talent on KnowMato.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Company Information */}
          <SectionCard icon="🏢" title="Company Information">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <InputField
                label="Company Name *"
                placeholder="e.g., TechVista Solutions"
                value={form.company_name}
                onChange={(v) => updateField("company_name", v)}
              />
              <SelectField
                label="Industry"
                value={form.industry}
                onChange={(v) => updateField("industry", v)}
                options={["", ...INDUSTRY_OPTIONS]}
              />
              <InputField
                label="Website"
                type="url"
                placeholder="https://www.example.com"
                value={form.website}
                onChange={(v) => updateField("website", v)}
              />
              <InputField
                label="LinkedIn URL"
                type="url"
                placeholder="https://linkedin.com/company/..."
                value={form.linkedin_url}
                onChange={(v) => updateField("linkedin_url", v)}
              />
              <InputField
                label="Founded Year"
                type="number"
                placeholder="e.g., 2015"
                value={form.founded_year}
                onChange={(v) => updateField("founded_year", v)}
              />
              <InputField
                label="Employee Count"
                type="number"
                placeholder="e.g., 50"
                value={form.employee_count}
                onChange={(v) => updateField("employee_count", v)}
              />
            </div>
            <div className="mt-6">
              <label className="mb-1 block text-sm font-medium text-white/90">
                Company Description
              </label>
              <textarea
                rows={5}
                value={form.company_description}
                onChange={(e) => updateField("company_description", e.target.value)}
                className="w-full rounded-xl border-2 border-white/20 bg-gray-900/60 px-4 py-3 text-white shadow-sm backdrop-blur-sm transition placeholder:text-white/40 focus:border-violet-400 focus:ring-4 focus:ring-violet-500/50 outline-none"
                placeholder="Tell us about your company, mission, and values..."
              />
            </div>
          </SectionCard>

          {/* Contact Details */}
          <SectionCard icon="📞" title="Contact Details">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <InputField
                label="Email *"
                type="email"
                placeholder="company@example.com"
                value={form.email}
                onChange={(v) => updateField("email", v)}
              />
              <InputField
                label="Phone *"
                type="tel"
                placeholder="+91 98765 43210"
                value={form.phone}
                onChange={(v) => updateField("phone", v)}
              />
            </div>
          </SectionCard>

          {/* HR / Point of Contact */}
          <SectionCard icon="👤" title="HR / Point of Contact">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <InputField
                label="HR Name"
                placeholder="Full name"
                value={form.hr_name}
                onChange={(v) => updateField("hr_name", v)}
              />
              <InputField
                label="HR Email"
                type="email"
                placeholder="hr@example.com"
                value={form.hr_email}
                onChange={(v) => updateField("hr_email", v)}
              />
              <InputField
                label="HR Phone"
                type="tel"
                placeholder="+91 98765 43210"
                value={form.hr_phone}
                onChange={(v) => updateField("hr_phone", v)}
              />
            </div>
          </SectionCard>

          {/* Location */}
          <SectionCard icon="📍" title="Office Address">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <InputField
                  label="Address *"
                  placeholder="Street, building, etc."
                  value={form.address}
                  onChange={(v) => updateField("address", v)}
                />
              </div>
              <InputField
                label="City"
                placeholder="e.g., Chennai"
                value={form.city}
                onChange={(v) => updateField("city", v)}
              />
              <InputField
                label="State"
                placeholder="e.g., Tamil Nadu"
                value={form.state}
                onChange={(v) => updateField("state", v)}
              />
              <InputField
                label="Country"
                placeholder="e.g., India"
                value={form.country}
                onChange={(v) => updateField("country", v)}
              />
              <InputField
                label="Postal Code"
                placeholder="e.g., 600001"
                value={form.postal_code}
                onChange={(v) => updateField("postal_code", v)}
              />
            </div>
          </SectionCard>

          {/* Legal & Documents */}
          <SectionCard icon="📑" title="Legal & Documents">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
              <InputField
                label="Registration Number"
                placeholder="Company reg. number"
                value={form.registration_number}
                onChange={(v) => updateField("registration_number", v)}
              />
              <InputField
                label="GST Number"
                placeholder="e.g., 22ABCDE1234F1Z5"
                value={form.gst_number}
                onChange={(v) => updateField("gst_number", v)}
              />
              <InputField
                label="PAN Number"
                placeholder="e.g., ABCDE1234F"
                value={form.pan_number}
                onChange={(v) => updateField("pan_number", v)}
              />
            </div>

            {/* Logo Upload */}
            <div className="mt-8">
              <label className="mb-3 block text-sm font-medium text-white/90">
                Company Logo
              </label>
              <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-white/20 bg-white/5 p-8 backdrop-blur-sm transition hover:bg-white/10">
                <span className="text-4xl text-white/60">🖼️</span>
                <p className="mt-2 text-sm font-medium text-white/80">
                  {logo ? logo.name : "Drag & drop your logo or click to browse"}
                </p>
                <p className="mt-1 text-xs text-white/50">
                  Supported formats: JPG, PNG, SVG
                </p>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setLogo(e.target.files?.[0] || null)}
                  className="hidden"
                />
              </label>
              {logo && (
                <p className="mt-3 text-sm text-emerald-400">✓ File selected: {logo.name}</p>
              )}
            </div>
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
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
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

// ----------------------------------------------------------
// Reusable components (identical to your tutor form)
// ----------------------------------------------------------

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