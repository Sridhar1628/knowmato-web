"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import {
  getInternship,
  createInternship,
  updateInternship,
  type Internship,
} from "@/services/v2Service";
import AlertService from "@/services/alertService";

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                   */
/* -------------------------------------------------------------------------- */

type FormState = {
  title: string;
  description: string;
  responsibilities: string;
  requirements: string;
  skills: string; // comma-separated string, matches Internship.skills type
  location: string;
  internship_type: string;
  duration_months: string;
  stipend: string;
  vacancies: string;
  ppo_available: boolean;
  certificate_provided: boolean;
  application_deadline: string; // datetime-local format: YYYY-MM-DDTHH:mm
  status: "draft" | "published" | "closed";
  is_active: boolean;
};

const EMPTY_FORM: FormState = {
  title: "",
  description: "",
  responsibilities: "",
  requirements: "",
  skills: "",
  location: "",
  internship_type: "full_time",
  duration_months: "3",
  stipend: "0",
  vacancies: "1",
  ppo_available: false,
  certificate_provided: true,
  application_deadline: "",
  status: "draft",
  is_active: true,
};

/** Convert an ISO string into the format <input type="datetime-local"> expects. */
function toDatetimeLocal(value?: string | null): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
    `T${pad(date.getHours())}:${pad(date.getMinutes())}`
  );
}

/** Convert a datetime-local string back into an ISO string for the API. */
function fromDatetimeLocal(value: string): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
}

/** Safely coerce a value to a non-negative integer (empty → 0). */
function toInt(value: string, fallback = 0): number {
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? Math.floor(n) : fallback;
}

/* -------------------------------------------------------------------------- */
/*  Component                                                                 */
/* -------------------------------------------------------------------------- */

export default function CompanyInternshipFormPage() {
  const router = useRouter();
  const params = useParams();
  const rawId = params?.id;
  const id = Array.isArray(rawId) ? rawId[0] : rawId;
  const isNew = !id || id === "new";

  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /* --------------------------- Load existing ---------------------------- */
  const loadInternship = useCallback(async () => {
    if (isNew || !id) return;

    setLoading(true);
    setError(null);

    try {
      const data = await getInternship(Number(id));
      if (!data) throw new Error("Empty response");

      setForm({
        title: data.title || "",
        description: data.description || "",
        responsibilities: data.responsibilities || "",
        requirements: data.requirements || "",
        skills: data.skills || "",
        location: data.location || "",
        internship_type: data.internship_type || "full_time",
        duration_months: String(data.duration_months ?? 3),
        stipend:
          data.stipend === null || data.stipend === undefined
            ? "0"
            : String(data.stipend),
        vacancies: String(data.vacancies ?? 1),
        ppo_available: !!data.ppo_available,
        certificate_provided: !!data.certificate_provided,
        application_deadline: toDatetimeLocal(data.application_deadline),
        status: data.status || "draft",
        is_active: data.is_active ?? true,
      });
    } catch (err: any) {
      console.error("LOAD INTERNSHIP ERROR:", err);
      const detail =
        err?.response?.data?.detail ||
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        "Failed to load internship";
      setError(detail);
      AlertService.error("Load Failed", detail);
    } finally {
      setLoading(false);
    }
  }, [id, isNew]);

  useEffect(() => {
    loadInternship();
  }, [loadInternship]);

  /* ------------------------------ Handlers ------------------------------ */
  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value } as FormState));
  };

  const handleCheckbox = (
    name: "ppo_available" | "certificate_provided" | "is_active"
  ) => {
    setForm((prev) => ({ ...prev, [name]: !prev[name] }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.title.trim()) {
      AlertService.error("Missing Title", "Please enter an internship title.");
      return;
    }

    setSaving(true);
    setError(null);

    const payload: Partial<Internship> = {
      title: form.title.trim(),
      description: form.description.trim(),
      responsibilities: form.responsibilities.trim(),
      requirements: form.requirements.trim(),
      skills: form.skills.trim(),
      location: form.location.trim(),
      internship_type: form.internship_type,
      duration_months: toInt(form.duration_months, 3),
      stipend: toInt(form.stipend, 0),
      vacancies: toInt(form.vacancies, 1),
      ppo_available: form.ppo_available,
      certificate_provided: form.certificate_provided,
      application_deadline: fromDatetimeLocal(form.application_deadline),
      status: form.status,
      is_active: form.is_active,
    };

    try {
      if (isNew) {
        await createInternship(payload);
        AlertService.success("Internship Created", "Your internship has been posted.");
      } else {
        await updateInternship(Number(id), payload);
        AlertService.success("Internship Updated", "Your changes have been saved.");
      }
      router.push("/company/internships");
    } catch (err: any) {
      console.error("SAVE INTERNSHIP ERROR:", err);

      // Surface DRF field-level validation errors
      const data = err?.response?.data;
      let detail = "Failed to save internship";
      if (typeof data === "string") detail = data;
      else if (data?.detail) detail = data.detail;
      else if (data?.message) detail = data.message;
      else if (data?.error) detail = data.error;
      else if (data && typeof data === "object") {
        const firstKey = Object.keys(data)[0];
        const firstVal = data[firstKey];
        if (Array.isArray(firstVal)) detail = `${firstKey}: ${firstVal[0]}`;
        else if (typeof firstVal === "string") detail = `${firstKey}: ${firstVal}`;
      } else if (err?.message) {
        detail = err.message;
      }

      setError(detail);
      AlertService.error("Save Failed", detail);
    } finally {
      setSaving(false);
    }
  };

  /* ------------------------------ Render -------------------------------- */
  if (loading && !isNew) {
    return <LoadingSkeleton />;
  }

  return (
    <div className="relative z-10 mx-auto max-w-3xl">
      {/* Header */}
      <div className="mb-8">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-violet-400/20 bg-violet-500/10 px-3 py-1 text-xs font-medium text-violet-300 backdrop-blur-xl">
          <span className="h-1.5 w-1.5 rounded-full bg-violet-400" />
          {isNew ? "New Internship" : "Edit Internship"}
        </div>

        <h1 className="bg-gradient-to-r from-violet-300 via-fuchsia-300 to-cyan-300 bg-clip-text text-3xl font-extrabold text-transparent sm:text-4xl">
          {isNew ? "Post an Internship" : "Edit Internship"}
        </h1>

        <p className="mt-2 text-white/70">
          {isNew
            ? "Fill in the details below to publish a new internship opening."
            : "Update the internship details and save your changes."}
        </p>
      </div>

      {/* Error banner */}
      {error && (
        <div className="mb-6 rounded-2xl border border-red-400/20 bg-red-500/10 p-4 text-sm text-red-300 backdrop-blur-xl">
          ⚠️ {error}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="space-y-6 rounded-2xl border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur-xl sm:p-8"
      >
        {/* ---------------------- Basic details ---------------------- */}
        <Section title="Basic details" icon="📝">
          <Field label="Internship title" required>
            <input
              name="title"
              value={form.title}
              onChange={handleChange}
              placeholder="e.g. Frontend Developer Intern"
              required
              className={inputClass}
            />
          </Field>

          <Field label="Description">
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              placeholder="Describe the internship role and what the intern will do..."
              rows={4}
              className={`${inputClass} resize-none`}
            />
          </Field>
        </Section>

        {/* ---------------------- Responsibilities ---------------------- */}
        <Section title="Responsibilities & requirements" icon="🎯">
          <Field label="Responsibilities">
            <textarea
              name="responsibilities"
              value={form.responsibilities}
              onChange={handleChange}
              placeholder="List the key responsibilities (one per line or as prose)"
              rows={4}
              className={`${inputClass} resize-none`}
            />
          </Field>

          <Field label="Requirements">
            <textarea
              name="requirements"
              value={form.requirements}
              onChange={handleChange}
              placeholder="List the eligibility criteria, education, and experience required"
              rows={4}
              className={`${inputClass} resize-none`}
            />
          </Field>

          <Field label="Skills" hint="Comma-separated, e.g. React, TypeScript, Git">
            <input
              name="skills"
              value={form.skills}
              onChange={handleChange}
              placeholder="React, TypeScript, Git"
              className={inputClass}
            />
          </Field>
        </Section>

        {/* ---------------------- Location & type ---------------------- */}
        <Section title="Location & type" icon="📍">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Location">
              <input
                name="location"
                value={form.location}
                onChange={handleChange}
                placeholder="e.g. Bengaluru, India"
                className={inputClass}
              />
            </Field>

            <Field label="Internship type">
              <select
                name="internship_type"
                value={form.internship_type}
                onChange={handleChange}
                className={inputClass}
              >
                <option value="full_time" className="bg-[#1b1738]">
                  Full Time
                </option>
                <option value="part_time" className="bg-[#1b1738]">
                  Part Time
                </option>
                <option value="remote" className="bg-[#1b1738]">
                  Remote
                </option>
                <option value="hybrid" className="bg-[#1b1738]">
                  Hybrid
                </option>
              </select>
            </Field>
          </div>
        </Section>

        {/* ---------------------- Compensation & slots ---------------------- */}
        <Section title="Compensation & slots" icon="💰">
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Duration (months)">
              <input
                name="duration_months"
                type="number"
                min={1}
                value={form.duration_months}
                onChange={handleChange}
                placeholder="3"
                className={inputClass}
              />
            </Field>

            <Field label="Stipend (₹ / month)">
              <input
                name="stipend"
                type="number"
                min={0}
                value={form.stipend}
                onChange={handleChange}
                placeholder="15000"
                className={inputClass}
              />
            </Field>

            <Field label="Vacancies">
              <input
                name="vacancies"
                type="number"
                min={1}
                value={form.vacancies}
                onChange={handleChange}
                placeholder="1"
                className={inputClass}
              />
            </Field>
          </div>

          <Field label="Application deadline">
            <input
              name="application_deadline"
              type="datetime-local"
              value={form.application_deadline}
              onChange={handleChange}
              className={`${inputClass} [color-scheme:dark]`}
            />
          </Field>
        </Section>

        {/* ---------------------- Perks ---------------------- */}
        <Section title="Perks & options" icon="✨">
          <div className="flex flex-wrap gap-3">
            <Toggle
              checked={form.ppo_available}
              onChange={() => handleCheckbox("ppo_available")}
              label="PPO Available"
              icon="🚀"
            />
            <Toggle
              checked={form.certificate_provided}
              onChange={() => handleCheckbox("certificate_provided")}
              label="Certificate Provided"
              icon="🏅"
            />
          </div>
        </Section>

        {/* ---------------------- Status ---------------------- */}
        <Section title="Publishing" icon="📢">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Status">
              <select
                name="status"
                value={form.status}
                onChange={handleChange}
                className={inputClass}
              >
                <option value="draft" className="bg-[#1b1738]">
                  Draft
                </option>
                <option value="published" className="bg-[#1b1738]">
                  Published
                </option>
                <option value="closed" className="bg-[#1b1738]">
                  Closed
                </option>
              </select>
            </Field>

            <div className="flex items-end">
              <Toggle
                checked={form.is_active}
                onChange={() => handleCheckbox("is_active")}
                label="Active"
                icon="🟢"
                full
              />
            </div>
          </div>
        </Section>

        {/* ---------------------- Actions ---------------------- */}
        <div className="flex flex-col gap-3 border-t border-white/10 pt-6 sm:flex-row">
          <button
            type="submit"
            disabled={saving}
            className="flex-1 rounded-xl bg-gradient-to-r from-violet-500 via-fuchsia-500 to-cyan-500 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-violet-500/10 transition hover:opacity-90 hover:shadow-violet-500/20 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving
              ? "Saving..."
              : isNew
                ? "Publish Internship"
                : "Save Changes"}
          </button>

          <button
            type="button"
            onClick={() => router.push("/company/internships")}
            disabled={saving}
            className="rounded-xl border border-white/10 bg-white/5 px-6 py-3 text-sm font-semibold text-white/80 transition hover:bg-white/10 hover:text-white disabled:opacity-50"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Small building blocks                                                     */
/* -------------------------------------------------------------------------- */

const inputClass =
  "w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-white placeholder:text-white/30 transition focus:border-violet-400/50 focus:bg-white/10 focus:outline-none focus:ring-2 focus:ring-violet-500/20";

function Section({
  title,
  icon,
  children,
}: {
  title: string;
  icon: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2 border-b border-white/5 pb-2">
        <span className="text-base">{icon}</span>
        <h2 className="text-sm font-semibold uppercase tracking-wider text-white/60">
          {title}
        </h2>
      </div>
      {children}
    </section>
  );
}

function Field({
  label,
  hint,
  required,
  children,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-white/70">
        {label}
        {required && <span className="ml-1 text-red-400">*</span>}
      </label>
      {children}
      {hint && <p className="mt-1 text-xs text-white/40">{hint}</p>}
    </div>
  );
}

function Toggle({
  checked,
  onChange,
  label,
  icon,
  full,
}: {
  checked: boolean;
  onChange: () => void;
  label: string;
  icon?: string;
  full?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onChange}
      className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-sm font-medium transition ${
        checked
          ? "border-violet-400/30 bg-violet-500/10 text-violet-200"
          : "border-white/10 bg-white/5 text-white/60 hover:bg-white/10"
      } ${full ? "w-full" : ""}`}
    >
      {icon && <span className="text-base">{icon}</span>}
      <span className="flex-1 text-left">{label}</span>
      <span
        className={`relative h-5 w-9 shrink-0 rounded-full transition ${
          checked ? "bg-violet-500" : "bg-white/15"
        }`}
      >
        <span
          className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all ${
            checked ? "left-4" : "left-0.5"
          }`}
        />
      </span>
    </button>
  );
}

function LoadingSkeleton() {
  return (
    <div className="relative z-10 mx-auto max-w-3xl">
      <div className="mb-8 space-y-3">
        <div className="h-6 w-40 animate-pulse rounded-full bg-white/10" />
        <div className="h-10 w-72 animate-pulse rounded bg-white/10" />
        <div className="h-4 w-96 animate-pulse rounded bg-white/10" />
      </div>
      <div className="space-y-6 rounded-2xl border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur-xl sm:p-8">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="space-y-3">
            <div className="h-4 w-32 animate-pulse rounded bg-white/10" />
            <div className="h-11 w-full animate-pulse rounded-xl bg-white/10" />
          </div>
        ))}
      </div>
    </div>
  );
}