"use client";

import { useCallback, useEffect, useState } from "react";

import { useRouter, useParams } from "next/navigation";

import {

  getJob,

  createJob,

  updateJob,

  type Job,

  CompanyUser,

  getMyCompanyProfile,

} from "@/services/v2Service";

import AlertService from "@/services/alertService";

import { useSelector } from "react-redux";

import { RootState } from "@/redux/store";

/* -------------------------------------------------------------------------- */

/*  Helpers                                                                   */

/* -------------------------------------------------------------------------- */

type FormState = {

  title: string;

  description: string;

  responsibilities: string;

  requirements: string;

  skills: string; // comma-separated, converted to string[] on submit

  location: string;

  job_type: string;

  experience_level: string;

  salary_min: string;

  salary_max: string;

  vacancies: string;

  application_deadline: string; // datetime-local format

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

  job_type: "full_time",

  experience_level: "fresher",

  salary_min: "0",

  salary_max: "0",

  vacancies: "1",

  application_deadline: "",

  status: "draft",

  is_active: true,

};

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


function fromDatetimeLocal(value: string): string | null {
  if (!value) return null;

  // datetime-local gives a value such as "2026-10-15T10:30".
  // Django expects a date string in YYYY-MM-DD format.
  const datePart = value.split("T")[0];

  if (!datePart || !/^\d{4}-\d{2}-\d{2}$/.test(datePart)) {
    return null;
  }

  const [year, month, day] = datePart.split("-").map(Number);
  const date = new Date(year, month - 1, day);

  // Reject impossible dates, such as February 31.
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }

  return datePart;
}
  

function getLocalDateTimeInputValue(date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours()
  )}:${pad(date.getMinutes())}`;
}

function toInt(value: string, fallback = 0): number {

  const n = Number(value);

  return Number.isFinite(n) && n >= 0 ? Math.floor(n) : fallback;

}

function parseSkills(value: string): string[] {

  return value

    .split(",")

    .map((s) => s.trim())

    .filter(Boolean);

}

/* -------------------------------------------------------------------------- */

/*  Component                                                                 */

/* -------------------------------------------------------------------------- */

export default function CompanyJobFormPage() {

  const router = useRouter();

  const params = useParams();

  const rawId = params?.id;

  const routeId = Array.isArray(rawId) ? rawId[0] : rawId;

  const isNew = !routeId || routeId === "new";

  const numericId =

    routeId && /^\d+$/.test(String(routeId)) ? Number(routeId) : null;

  const user = useSelector((state: RootState) => state.auth.user);

  const fallbackCompanyId = (user as any)?.company as number | undefined;

  const [companyProfile, setCompanyProfile] = useState<CompanyUser | null>(null);

  const [form, setForm] = useState<FormState>(EMPTY_FORM);

  const [loading, setLoading] = useState(!isNew);

  const [saving, setSaving] = useState(false);

  const [error, setError] = useState<string | null>(null);

  const companyId = companyProfile?.company ?? fallbackCompanyId;

  /* ---------------------------- Load company ---------------------------- */

  useEffect(() => {

    let mounted = true;

    (async () => {

      try {

        const response = await getMyCompanyProfile();

        console.log(

          "[COMPANY DEBUG] Full response:",

          JSON.stringify(response, null, 2)

        );

        const profile = response;

        console.log("[COMPANY DEBUG] Parsed profile:", profile);

        if (mounted) {

          setCompanyProfile(profile);

        }

      } catch (err: any) {

        console.error(

          "[COMPANY DEBUG] Failed:",

          err?.response?.status,

          err?.response?.data ?? err

        );

      }

    })();

    return () => {

      mounted = false;

    };

  }, []);

  /* --------------------------- Load existing ---------------------------- */

  const loadJob = useCallback(async () => {

    if (isNew) return;

    if (!numericId) {

      const message = "Invalid job ID.";

      setError(message);

      setLoading(false);

      AlertService.error("Invalid Job", message);

      return;

    }

    setLoading(true);

    setError(null);

    try {

      const data = await getJob(numericId);

      if (!data) throw new Error("Empty response");

      setForm({

        title: data.title || "",

        description: data.description || "",

        responsibilities: data.responsibilities || "",

        requirements: data.requirements || "",

        skills: Array.isArray(data.skills) ? data.skills.join(", ") : "",

        location: data.location || "",

        job_type: data.job_type || "full_time",

        experience_level: data.experience_level || "fresher",

        salary_min:

          data.salary_min === null || data.salary_min === undefined

            ? "0"

            : String(data.salary_min),

        salary_max:

          data.salary_max === null || data.salary_max === undefined

            ? "0"

            : String(data.salary_max),

        vacancies: String(data.vacancies ?? 1),

        application_deadline: toDatetimeLocal(data.application_deadline),

        status: (data.status as FormState["status"]) || "draft",

        is_active: data.is_active ?? true,

      });

    } catch (err: any) {

      console.error("LOAD JOB ERROR:", err);

      const detail =

        err?.response?.data?.detail ||

        err?.response?.data?.message ||

        err?.response?.data?.error ||

        err?.message ||

        "Failed to load job";

      setError(detail);

      AlertService.error("Load Failed", detail);

    } finally {

      setLoading(false);

    }

  }, [numericId, isNew]);

  useEffect(() => {

    loadJob();

  }, [loadJob]);

  /* ------------------------------ Handlers ------------------------------ */

  const handleChange = (

    e: React.ChangeEvent<

      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement

    >

  ) => {

    const { name, value } = e.target;

    setForm((prev) => ({ ...prev, [name]: value } as FormState));

  };

  const handleCheckbox = (name: "is_active") => {

    setForm((prev) => ({ ...prev, [name]: !prev[name] }));

  };

  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Clear previous errors
    setError(null);

    // 1. Validate company association
    if (!companyId) {
      const message =
        "No company is associated with your account. Please contact your administrator.";

      setError(message);
      AlertService.error("Company Required", message);
      return;
    }

    // 2. Validate job title
    if (!form.title.trim()) {
      const message = "Please enter a job title.";

      setError(message);
      AlertService.error("Missing Title", message);
      return;
    }

    // 3. Validate application deadline
    if (!form.application_deadline.trim()) {
      const message = "Please select an application deadline.";

      setError(message);
      AlertService.error("Deadline Required", message);
      return;
    }

    // datetime-local returns a value such as:
    // "2026-10-15T10:30"
    //
    // Django expects a date in YYYY-MM-DD format.
    const deadline = fromDatetimeLocal(form.application_deadline);

    if (!deadline) {
      const message =
        "The application deadline is invalid. Please select a valid date and time.";

      setError(message);
      AlertService.error("Invalid Deadline", message);
      return;
    }

    // Compare the selected local date/time against the current time.
    const selectedDeadline = new Date(form.application_deadline);

    if (
      Number.isNaN(selectedDeadline.getTime()) ||
      selectedDeadline.getTime() <= Date.now()
    ) {
      const message =
        "The application deadline must be in the future.";

      setError(message);
      AlertService.error("Invalid Deadline", message);
      return;
    }

    // 4. Validate salary
    const minSal = toInt(form.salary_min, 0);
    const maxSal = toInt(form.salary_max, 0);

    if (minSal > 0 && maxSal > 0 && minSal > maxSal) {
      const message =
        "Minimum salary cannot be greater than maximum salary.";

      setError(message);
      AlertService.error("Invalid Salary Range", message);
      return;
    }

    // 5. Validate vacancies
    const vacancies = toInt(form.vacancies, 1);

    if (vacancies < 1) {
      const message = "At least one vacancy is required.";

      setError(message);
      AlertService.error("Invalid Vacancies", message);
      return;
    }

    // 6. Prevent duplicate submissions
    if (saving) return;

    // 7. Build the API payload
    const payload: Partial<Job> = {
      title: form.title.trim(),
      description: form.description.trim(),
      responsibilities: form.responsibilities.trim(),
      requirements: form.requirements.trim(),
      skills: parseSkills(form.skills),
      location: form.location.trim(),
      job_type: form.job_type,
      experience_level: form.experience_level,
      salary_min: minSal,
      salary_max: maxSal,
      vacancies,
      application_deadline: deadline, // YYYY-MM-DD
      status: form.status,
      is_active: form.is_active,
      company: companyId,
    };

    console.log("[JOB DEBUG] Application deadline:", deadline);
    console.log("[JOB DEBUG] Submission payload:", payload);

    setSaving(true);

    try {
      if (isNew) {
        await createJob(payload);

        AlertService.success(
          "Job Created",
          "Your job has been created successfully."
        );
      } else if (numericId) {
        await updateJob(numericId, payload);

        AlertService.success(
          "Job Updated",
          "Your changes have been saved."
        );
      } else {
        throw new Error(
          "Invalid job ID. Please return to the jobs page and try again."
        );
      }

      router.push("/company/jobs");
    } catch (err: any) {
      const data = err?.response?.data ?? err;

      console.error("[JOB ERROR] API response:", data);

      // Extract field-level validation errors.
      const fieldErrors =
        data?.errors ??
        err?.errors ??
        {};

      console.error(
        "[JOB ERROR] Field validation details:",
        JSON.stringify(fieldErrors, null, 2)
      );

      // Convert all field errors into readable text.
      const errorMessages = Object.entries(fieldErrors).flatMap(
        ([field, messages]) => {
          const values = Array.isArray(messages)
            ? messages
            : [messages];

          return values.map(
            (message) => `${field}: ${String(message)}`
          );
        }
      );

      const detail =
        errorMessages.length > 0
          ? errorMessages.join("\n")
          : data?.message ??
            data?.detail ??
            data?.error ??
            err?.message ??
            "Failed to save the job. Please try again.";

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

        <button

          type="button"

          onClick={() => router.push("/company/jobs")}

          className="mb-4 text-sm font-medium text-white/50 transition hover:text-white"

        >

          ← Back to Jobs

        </button>

        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-violet-400/20 bg-violet-500/10 px-3 py-1 text-xs font-medium text-violet-300 backdrop-blur-xl">

          <span className="h-1.5 w-1.5 rounded-full bg-violet-400" />

          {isNew ? "New Job" : "Edit Job"}

        </div>

        <h1 className="bg-gradient-to-r from-violet-300 via-fuchsia-300 to-cyan-300 bg-clip-text text-3xl font-extrabold text-transparent sm:text-4xl">

          {isNew ? "Post a Job" : "Edit Job"}

        </h1>

        <p className="mt-2 text-white/70">

          {isNew

            ? "Fill in the details below to publish a new job opening."

            : "Update the job details and save your changes."}

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

          <Field label="Job title" required>

            <input

              name="title"

              value={form.title}

              onChange={handleChange}

              placeholder="e.g. Senior Frontend Engineer"

              required

              className={inputClass}

            />

          </Field>

          <Field label="Description">

            <textarea

              name="description"

              value={form.description}

              onChange={handleChange}

              placeholder="Describe the role, team, and what the candidate will work on..."

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

          <Field

            label="Skills"

            hint="Comma-separated, e.g. React, TypeScript, Node.js"

          >

            <input

              name="skills"

              value={form.skills}

              onChange={handleChange}

              placeholder="React, TypeScript, Node.js"

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

            <Field label="Job type">

              <select

                name="job_type"

                value={form.job_type}

                onChange={handleChange}

                className={inputClass}

              >

                <option value="full_time" className="bg-[#1b1738]">

                  Full Time

                </option>

                <option value="part_time" className="bg-[#1b1738]">

                  Part Time

                </option>

                <option value="contract" className="bg-[#1b1738]">

                  Contract

                </option>

                <option value="remote" className="bg-[#1b1738]">

                  Remote

                </option>

              </select>

            </Field>

          </div>

          <Field label="Experience level">

            <select

              name="experience_level"

              value={form.experience_level}

              onChange={handleChange}

              className={inputClass}

            >

              <option value="fresher" className="bg-[#1b1738]">

                Fresher

              </option>

              <option value="0_1" className="bg-[#1b1738]">

                0–1 years

              </option>

              <option value="1_3" className="bg-[#1b1738]">

                1–3 years

              </option>

              <option value="3_plus" className="bg-[#1b1738]">

                3+ years

              </option>

            </select>

          </Field>

        </Section>

        {/* ---------------------- Compensation ---------------------- */}

        <Section title="Compensation & slots" icon="💰">

          <div className="grid gap-4 sm:grid-cols-3">

            <Field label="Min salary (₹ / year)">

              <input

                name="salary_min"

                type="number"

                min={0}

                value={form.salary_min}

                onChange={handleChange}

                placeholder="500000"

                className={inputClass}

              />

            </Field>

            <Field label="Max salary (₹ / year)">

              <input

                name="salary_max"

                type="number"

                min={0}

                value={form.salary_max}

                onChange={handleChange}

                placeholder="900000"

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
              min={getLocalDateTimeInputValue()}
              onChange={handleChange}
              required
              className={`${inputClass} [color-scheme:dark]`}

            />

          </Field>

        </Section>

        {/* ---------------------- Publishing ---------------------- */}

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

                ? form.status === "published"

                  ? "Publish Job"

                  : "Save Job"

                : "Save Changes"}

          </button>

          <button

            type="button"

            onClick={() => router.push("/company/jobs")}

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

        <div className="h-6 w-32 animate-pulse rounded-full bg-white/10" />

        <div className="h-10 w-56 animate-pulse rounded bg-white/10" />

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