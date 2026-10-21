"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import AlertService from "@/services/alertService";
import { getTutorProfile, updateTutorProfile } from "@/services/v1Service";
import { getProfile } from "@/services/userService";

interface TutorProfileData {
  id: number; user?: number; bio: string; skills: string; experience: number;
  is_verified: boolean; average_rating: number; total_reviews: number;
  is_top_tutor: boolean; is_online: boolean; last_seen: string | null;
  phone_number: string; city_state: string; linkedin_profile: string;
  highest_qualification: string; degree: string; college_name: string;
  year_of_completion: number | null; expertise_level: string; current_status: string;
  organization: string; professional_summary: string; mentor_subjects: string[];
  mentor_languages: string[]; resume: string | null; application_submitted: boolean;
  application_submitted_at: string | null;
}

const PUBLIC_PROFILE_BASE = "https://www.knowmato.in/profile";
const LIST_FIELDS = ["mentor_subjects", "mentor_languages"] as const;
type ListField = (typeof LIST_FIELDS)[number];
type FieldName = Exclude<keyof TutorProfileData, "id" | "user" | "is_verified" | "average_rating" | "total_reviews" | "is_top_tutor" | "is_online" | "last_seen" | "mentor_subjects" | "mentor_languages" | "resume" | "application_submitted" | "application_submitted_at">;

const defaults: TutorProfileData = {
  id: 0, bio: "", skills: "", experience: 0, is_verified: false, average_rating: 0,
  total_reviews: 0, is_top_tutor: false, is_online: false, last_seen: null,
  phone_number: "", city_state: "", linkedin_profile: "", highest_qualification: "",
  degree: "", college_name: "", year_of_completion: null, expertise_level: "",
  current_status: "", organization: "", professional_summary: "", mentor_subjects: [],
  mentor_languages: [], resume: null, application_submitted: false, application_submitted_at: null,
};

const groups: { title: string; fields: { key: FieldName; label: string; type?: string; multiline?: boolean }[] }[] = [
  { title: "Personal information", fields: [
    { key: "phone_number", label: "Mobile number", type: "tel" },
    { key: "city_state", label: "City / State" },
    { key: "linkedin_profile", label: "LinkedIn profile URL", type: "url" },
  ] },
  { title: "About me", fields: [
    { key: "bio", label: "Bio", multiline: true },
    { key: "professional_summary", label: "Professional summary", multiline: true },
    { key: "skills", label: "Skills (comma-separated)", multiline: true },
  ] },
  { title: "Education", fields: [
    { key: "highest_qualification", label: "Highest qualification" },
    { key: "degree", label: "Degree" },
    { key: "college_name", label: "College / university" },
    { key: "year_of_completion", label: "Year of completion", type: "number" },
  ] },
  { title: "Professional information", fields: [
    { key: "experience", label: "Experience (years)", type: "number" },
    { key: "expertise_level", label: "Expertise level" },
    { key: "current_status", label: "Current status" },
    { key: "organization", label: "Organization" },
  ] },
];

const inputClass = "w-full rounded-xl border border-white/15 bg-slate-950/50 px-4 py-3 text-white outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-500/20 disabled:cursor-default disabled:opacity-80";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return <section className="rounded-2xl border border-white/10 bg-white/5 p-5 sm:p-6 shadow-xl"><h2 className="mb-4 font-bold text-white">{title}</h2>{children}</section>;
}

function ChipEditor({ label, items, editable, onChange }: { label: string; items: string[]; editable: boolean; onChange: (items: string[]) => void }) {
  const [draft, setDraft] = useState("");
  const add = () => { const value = draft.trim(); if (value && !items.some(x => x.toLowerCase() === value.toLowerCase())) onChange([...items, value]); setDraft(""); };
  return <div><p className="mb-2 text-sm font-medium text-white/70">{label}</p><div className="flex min-h-12 flex-wrap gap-2 rounded-xl border border-white/10 bg-slate-950/30 p-3">
    {items.map(item => <span key={item} className="rounded-full border border-violet-400/30 bg-violet-500/15 px-3 py-1 text-sm text-violet-200">{item}{editable && <button type="button" onClick={() => onChange(items.filter(x => x !== item))} className="ml-2" aria-label={`Remove ${item}`}>×</button>}</span>)}
    {editable && <form className="flex gap-2" onSubmit={e => { e.preventDefault(); add(); }}><input value={draft} onChange={e => setDraft(e.target.value)} className="min-w-24 flex-1 bg-transparent text-sm text-white outline-none" placeholder={`Add ${label.toLowerCase()}`} /><button type="submit" className="text-sm font-semibold text-violet-300">Add</button></form>}
    {!items.length && !editable && <span className="text-sm text-white/40">Not added</span>}
  </div></div>;
}

export default function TutorProfilePage() {
  const { t } = useTranslation();
  const [profile, setProfile] = useState<TutorProfileData | null>(null);
  const [original, setOriginal] = useState<TutorProfileData | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const resumeRef = useRef<HTMLInputElement>(null);
  const copyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const shareUrl = displayName ? `${PUBLIC_PROFILE_BASE}/${encodeURIComponent(displayName)}` : "";

  const loadProfile = useCallback(async () => {
    try {
      const result: any = await getTutorProfile();
      const data = result?.data?.data ?? result?.data ?? result;
      setProfile({ ...defaults, ...data,
        mentor_subjects: Array.isArray(data?.mentor_subjects) ? data.mentor_subjects : [],
        mentor_languages: Array.isArray(data?.mentor_languages) ? data.mentor_languages : [],
      });
    } catch (error) {
      console.error("Failed to load tutor profile:", error);
      AlertService.error(t("common.error", { defaultValue: "Error" }), t("tutorProfile.loadError", { defaultValue: "Unable to load your tutor profile." }));
    } finally { setLoading(false); }
  }, [t]);

  useEffect(() => { void loadProfile(); }, [loadProfile]);
  useEffect(() => {
    let active = true;
    getProfile().then((result: any) => {
      const user = result?.data?.data?.user ?? result?.data?.user ?? result?.user ?? result?.data?.data ?? result?.data;
      const name = user?.display_name ?? user?.username ?? "";
      if (active && typeof name === "string") setDisplayName(name.trim());
    }).catch(error => console.warn("Could not load public profile name", error));
    return () => { active = false; if (copyTimer.current) clearTimeout(copyTimer.current); };
  }, []);

  const copyLink = async () => {
    if (!shareUrl) return AlertService.warning("Link unavailable", "We could not generate your profile link. Please try again later.", []);
    try {
      if (navigator.clipboard && window.isSecureContext) await navigator.clipboard.writeText(shareUrl);
      else {
        const el = document.createElement("textarea"); el.value = shareUrl; el.style.position = "fixed"; el.style.opacity = "0"; document.body.appendChild(el); el.select();
        const success = document.execCommand("copy"); el.remove(); if (!success) throw new Error("Copy failed");
      }
      setCopied(true); if (copyTimer.current) clearTimeout(copyTimer.current); copyTimer.current = setTimeout(() => setCopied(false), 2000);
      AlertService.success("Link copied", "Your public KnowMato profile link has been copied.");
    } catch (error) { console.error(error); AlertService.error("Copy failed", "Please copy the profile link manually."); }
  };

  const shareProfile = async () => {
    if (!shareUrl) return AlertService.warning("Link unavailable", "We could not generate your profile link. Please try again later.", []);
    try {
      if (navigator.share) await navigator.share({ title: `${displayName}'s KnowMato Profile`, text: "Check out my KnowMato tutor profile!", url: shareUrl });
      else await copyLink();
    } catch (error: any) { if (error?.name !== "AbortError") await copyLink(); }
  };

  const startEditing = () => { if (!profile || saving) return; setOriginal({ ...profile, mentor_subjects: [...profile.mentor_subjects], mentor_languages: [...profile.mentor_languages] }); setErrors({}); setResumeFile(null); if (resumeRef.current) resumeRef.current.value = ""; setEditing(true); window.scrollTo({ top: 0, behavior: "smooth" }); };
  const cancelEditing = () => { if (saving) return; if (original) setProfile(original); setEditing(false); setOriginal(null); setErrors({}); setResumeFile(null); if (resumeRef.current) resumeRef.current.value = ""; };
  const change = (key: FieldName, value: string) => setProfile(current => current ? ({ ...current, [key]: key === "experience" || key === "year_of_completion" ? (value === "" ? (key === "year_of_completion" ? null : 0) : Number(value)) : value }) : current);

  const validate = () => {
    if (!profile) return { profile: "Profile data is unavailable." };
    const e: Record<string, string> = {}, p = profile, year = new Date().getFullYear();
    if ((p.bio || "").trim().length < 20 || p.bio.length > 2000) e.bio = "Bio must contain 20–2000 characters.";
    if ((p.skills || "").trim().length < 2 || p.skills.length > 1000) e.skills = "Enter valid skills (maximum 1000 characters).";
    const phone = (p.phone_number || "").replace(/\D/g, "");
    if (!/^[6-9]\d{9}$/.test(phone)) e.phone_number = "Enter a valid 10-digit Indian mobile number.";
    if ((p.city_state || "").trim().length < 2 || p.city_state.length > 150) e.city_state = "Enter a valid city / state.";
    try { const u = new URL(p.linkedin_profile); if (!/^https?:$/.test(u.protocol) || !/(^|\.)linkedin\.com$/i.test(u.hostname)) e.linkedin_profile = "Enter a valid LinkedIn profile URL."; } catch { e.linkedin_profile = "Enter a valid LinkedIn profile URL."; }
    if (!p.highest_qualification.trim()) e.highest_qualification = "Highest qualification is required.";
    if (!p.degree.trim()) e.degree = "Degree is required.";
    if (p.college_name.trim().length < 2) e.college_name = "College / university name is required.";
    if (!Number.isInteger(Number(p.year_of_completion)) || Number(p.year_of_completion) < 1950 || Number(p.year_of_completion) > year + 1) e.year_of_completion = `Enter a year between 1950 and ${year + 1}.`;
    if (!p.expertise_level.trim()) e.expertise_level = "Expertise level is required.";
    if (!p.current_status.trim()) e.current_status = "Current status is required.";
    if (!p.organization.trim()) e.organization = "Organization is required.";
    if (p.professional_summary.trim().length < 20 || p.professional_summary.length > 3000) e.professional_summary = "Professional summary must contain 20–3000 characters.";
    if (!p.mentor_subjects.length) e.mentor_subjects = "Add at least one subject.";
    if (!p.mentor_languages.length) e.mentor_languages = "Add at least one language.";
    if (!p.resume && !resumeFile) e.resume = "Please upload your resume.";
    if (resumeFile) {
      const ext = resumeFile.name.split(".").pop()?.toLowerCase();
      if (!(["pdf", "doc", "docx"].includes(ext || ""))) e.resume = "Resume must be a PDF, DOC, or DOCX file.";
      else if (resumeFile.size > 5 * 1024 * 1024) e.resume = "Resume must not exceed 5 MB.";
    }
    return e;
  };

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault(); if (!profile || saving || !editing) return;
    const validation = validate(); setErrors(validation);
    if (Object.keys(validation).length) {
      const first = Object.keys(validation)[0]; AlertService.error("Complete required fields", validation[first]);
      document.querySelector(`[data-validation-field="${first}"]`)?.scrollIntoView({ behavior: "smooth", block: "center" }); return;
    }
    setSaving(true);
    try {
      const form = new FormData();
      ( ["bio", "skills", "phone_number", "city_state", "linkedin_profile", "highest_qualification", "degree", "college_name", "expertise_level", "current_status", "organization", "professional_summary"] as const ).forEach(key => form.append(key, String(profile[key] ?? "").trim()));
      form.append("experience", String(profile.experience ?? 0)); form.append("year_of_completion", String(profile.year_of_completion));
      LIST_FIELDS.forEach(key => form.append(key, JSON.stringify(profile[key].map(value => value.trim()).filter(Boolean))));
      if (resumeFile) form.append("resume", resumeFile);
      await updateTutorProfile(form);
      setErrors({}); setResumeFile(null); setEditing(false); setOriginal(null); if (resumeRef.current) resumeRef.current.value = "";
      await loadProfile(); AlertService.success(t("common.success", { defaultValue: "Success" }), t("tutorProfile.updateSuccess", { defaultValue: "Tutor profile updated successfully." }));
    } catch (error: any) {
      console.error("Failed to update tutor profile:", error);
      AlertService.error(t("common.error", { defaultValue: "Error" }), error?.response?.data?.error || error?.response?.data?.message || error?.message || t("tutorProfile.updateFailed", { defaultValue: "Unable to update profile." }));
    } finally { setSaving(false); }
  };

  if (loading) return <main className="min-h-screen bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e] p-6 text-white"><div className="mx-auto max-w-4xl animate-pulse space-y-5"><div className="h-28 rounded-2xl bg-white/10" />{[1, 2, 3, 4].map(n => <div key={n} className="h-40 rounded-2xl bg-white/10" />)}</div></main>;
  if (!profile) return <main className="flex min-h-screen items-center justify-center bg-[#17152f] p-6 text-white">{t("tutorProfile.notFound", { defaultValue: "Tutor profile not found." })}</main>;

  return <main className="relative min-h-screen overflow-hidden bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e] p-4 text-white sm:p-6 lg:p-8">
    <div className="pointer-events-none absolute -left-20 top-0 h-72 w-72 rounded-full bg-purple-500/20 blur-3xl" /><div className="pointer-events-none absolute -right-20 top-0 h-72 w-72 rounded-full bg-fuchsia-500/20 blur-3xl" />
    <div className="relative mx-auto max-w-4xl"><motion.form onSubmit={submit} noValidate initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
      <header className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-2xl backdrop-blur-xl sm:p-6">
        <div className="flex flex-col items-center gap-4 sm:flex-row"><div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 text-3xl font-bold">{(displayName || "T").charAt(0).toUpperCase()}</div>
          <div className="min-w-0 flex-1 text-center sm:text-left"><h1 className="break-words text-2xl font-extrabold">{displayName || "Tutor"}</h1><p className="text-sm text-white/50">Tutor ID: {profile.id}</p><div className="mt-2 flex flex-wrap justify-center gap-2 sm:justify-start">{profile.is_verified && <span className="rounded-full border border-emerald-400/30 bg-emerald-400/15 px-3 py-1 text-xs text-emerald-200">Verified</span>}{profile.is_top_tutor && <span className="rounded-full bg-amber-400/15 px-3 py-1 text-xs text-amber-200">Top tutor</span>}<span className="rounded-full bg-amber-400/15 px-3 py-1 text-xs text-amber-200">⭐ {Number(profile.average_rating || 0).toFixed(1)} · {profile.total_reviews} reviews</span><span className="rounded-full bg-sky-400/15 px-3 py-1 text-xs text-sky-200">{profile.is_online ? "Online" : "Offline"}</span></div></div>
        </div>
        <div className="mt-5 flex flex-wrap justify-center gap-2 sm:justify-end">{shareUrl && <input aria-label="Public profile link" readOnly value={shareUrl} className="min-w-0 flex-1 rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-white/70 sm:max-w-sm" />}<button type="button" onClick={() => void copyLink()} className="rounded-xl border border-violet-300/30 bg-violet-500/15 px-4 py-2 text-sm font-semibold text-violet-100 hover:bg-violet-500/25">{copied ? "Copied!" : "Copy profile link"}</button><button type="button" onClick={() => void shareProfile()} className="rounded-xl bg-gradient-to-r from-violet-500 to-fuchsia-500 px-4 py-2 text-sm font-semibold hover:opacity-90">Share profile</button></div>
        {!editing ? <div className="mt-4 flex justify-end"><button type="button" onClick={startEditing} className="rounded-xl border border-white/15 px-5 py-2.5 font-semibold hover:bg-white/10">Edit profile</button></div> : <div className="mt-4 flex flex-wrap justify-end gap-2"><button type="button" onClick={cancelEditing} disabled={saving} className="rounded-xl border border-white/15 px-5 py-2.5 font-semibold hover:bg-white/10 disabled:opacity-50">Cancel</button><button type="submit" disabled={saving} className="rounded-xl bg-gradient-to-r from-violet-500 to-fuchsia-500 px-5 py-2.5 font-bold disabled:opacity-60">{saving ? "Saving…" : "Save changes"}</button></div>}
      </header>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">{[{ label: "Average rating", value: `⭐ ${Number(profile.average_rating || 0).toFixed(1)}` }, { label: "Total reviews", value: String(profile.total_reviews) }, { label: "Verification", value: profile.is_verified ? "Verified" : "Not verified" }, { label: "Availability", value: profile.is_online ? "Online" : "Offline" }].map(item => <div key={item.label} className="rounded-2xl border border-white/10 bg-white/5 p-4 text-center"><p className="text-xs text-white/50">{item.label}</p><p className="mt-1 font-bold">{item.value}</p></div>)}</div>
      {groups.map(group => <Section key={group.title} title={group.title}><div className="grid grid-cols-1 gap-4 sm:grid-cols-2">{group.fields.map(field => { const value = profile[field.key]; const val = value == null ? "" : String(value); const error = errors[field.key]; return <div key={field.key} data-validation-field={field.key} className={field.multiline ? "sm:col-span-2" : ""}><label className="mb-1 block text-sm font-medium text-white/70">{field.label}{editing && <span className="ml-1 text-rose-300">*</span>}</label>{field.multiline ? <textarea rows={3} disabled={!editing} value={val} onChange={e => change(field.key, e.target.value)} className={inputClass} /> : <input type={field.type || "text"} min={field.key === "experience" ? 0 : field.key === "year_of_completion" ? 1950 : undefined} max={field.key === "year_of_completion" ? new Date().getFullYear() + 1 : undefined} disabled={!editing} value={val} onChange={e => change(field.key, e.target.value)} className={inputClass} />}{editing && error && <p className="mt-1 text-xs text-rose-300">{error}</p>}</div>; })}</div></Section>)}
      <Section title="Mentoring subjects and languages"><div className="grid gap-5 sm:grid-cols-2"><div data-validation-field="mentor_subjects"><ChipEditor label="Subjects" items={profile.mentor_subjects} editable={editing} onChange={items => setProfile(p => p ? { ...p, mentor_subjects: items } : p)} />{editing && errors.mentor_subjects && <p className="mt-1 text-xs text-rose-300">{errors.mentor_subjects}</p>}</div><div data-validation-field="mentor_languages"><ChipEditor label="Languages" items={profile.mentor_languages} editable={editing} onChange={items => setProfile(p => p ? { ...p, mentor_languages: items } : p)} />{editing && errors.mentor_languages && <p className="mt-1 text-xs text-rose-300">{errors.mentor_languages}</p>}</div></div></Section>
      <Section title="Resume"><div data-validation-field="resume" className="space-y-3">{profile.resume && <a href={profile.resume} target="_blank" rel="noreferrer" className="inline-block text-sm text-violet-300 underline hover:text-violet-200">View current resume</a>}{editing && <><input ref={resumeRef} type="file" accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document" onChange={e => setResumeFile(e.target.files?.[0] || null)} className="block w-full text-sm text-white file:mr-3 file:rounded-lg file:border-0 file:bg-violet-500/20 file:px-4 file:py-2 file:font-semibold file:text-violet-200" />{resumeFile && <p className="text-xs text-white/60">Selected: {resumeFile.name}</p>}{errors.resume && <p className="text-xs text-rose-300">{errors.resume}</p>}<p className="text-xs text-white/40">PDF, DOC, or DOCX; maximum 5 MB.</p></>}</div></Section>
      {editing && <div className="sticky bottom-3 flex justify-end gap-2"><button type="button" onClick={cancelEditing} disabled={saving} className="rounded-xl border border-white/20 bg-slate-950/90 px-5 py-3 font-semibold">Cancel</button><button type="submit" disabled={saving} className="rounded-xl bg-gradient-to-r from-violet-500 to-fuchsia-500 px-6 py-3 font-bold shadow-lg disabled:opacity-60">{saving ? "Saving…" : "Save changes"}</button></div>}
    </motion.form></div>
  </main>;
}
