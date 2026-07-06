"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import { getInternship, createInternship, updateInternship, Internship } from "@/services/v2Service";
import CompanyLayout from "@/app/company/layout";
import toast from "react-hot-toast";

export default function CompanyInternshipFormPage() {
  const router = useRouter();
  const { id } = useParams();
  const isNew = id === "new";
  const user = useSelector((state: RootState) => state.auth.user);
  const companyId = user?.company;

  const [form, setForm] = useState<Partial<Internship>>({
    title: "",
    company: companyId || 0,
    description: "",
    responsibilities: "",
    requirements: "",
    skills: [],
    location: "",
    internship_type: "full_time",
    duration_months: 3,
    stipend: 0,
    vacancies: 1,
    ppo_available: false,
    certificate_provided: true,
    application_deadline: "",
    status: "draft",
    is_active: true,
  });

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isNew) {
      setLoading(true);
      getInternship(Number(id))
        .then(setForm)
        .catch(() => toast.error("Load failed"))
        .finally(() => setLoading(false));
    }
  }, [id, isNew]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    const val = type === "number" ? Number(value) : value;
    setForm((prev) => ({ ...prev, [name]: val }));
  };

  const handleSkills = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({
      ...prev,
      skills: e.target.value.split(",").map((s) => s.trim()),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyId) {
      toast.error("No company associated");
      return;
    }
    setSaving(true);
    try {
      const data = { ...form, company: companyId }; // force company
      if (isNew) await createInternship(data);
      else await updateInternship(Number(id), data);
      toast.success(isNew ? "Internship created" : "Internship updated");
      router.push("/company/internships");
    } catch {
      toast.error("Save failed");
    } finally {
      setSaving(false);
    }
  };

  if (loading && !isNew) {
    return (
      <CompanyLayout>
        <div className="min-h-screen flex items-center justify-center text-white/60">Loading...</div>
      </CompanyLayout>
    );
  }

  return (
    <CompanyLayout>
      <div className="relative z-10 max-w-3xl mx-auto">
        <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-violet-300 to-fuchsia-300 mb-8">
          {isNew ? "Post an Internship" : "Edit Internship"}
        </h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            name="title"
            value={form.title}
            onChange={handleChange}
            placeholder="Internship Title *"
            required
            className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white"
          />
          <textarea
            name="description"
            value={form.description || ""}
            onChange={handleChange}
            placeholder="Description"
            className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white"
          />
          <textarea
            name="responsibilities"
            value={form.responsibilities || ""}
            onChange={handleChange}
            placeholder="Responsibilities"
            className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white"
          />
          <textarea
            name="requirements"
            value={form.requirements || ""}
            onChange={handleChange}
            placeholder="Requirements"
            className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white"
          />
          <input
            name="skills"
            value={(form.skills || []).join(", ")}
            onChange={handleSkills}
            placeholder="Skills (comma separated)"
            className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white"
          />

          <div className="grid grid-cols-2 gap-4">
            <input
              name="location"
              value={form.location || ""}
              onChange={handleChange}
              placeholder="Location"
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white"
            />
            <select
              name="internship_type"
              value={form.internship_type}
              onChange={handleChange}
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white"
            >
              <option value="full_time">Full Time</option>
              <option value="part_time">Part Time</option>
              <option value="remote">Remote</option>
              <option value="hybrid">Hybrid</option>
            </select>
            <input
              name="duration_months"
              type="number"
              value={form.duration_months || 0}
              onChange={handleChange}
              placeholder="Duration (months)"
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white"
            />
            <input
              name="stipend"
              type="number"
              value={form.stipend || 0}
              onChange={handleChange}
              placeholder="Stipend"
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white"
            />
            <input
              name="vacancies"
              type="number"
              value={form.vacancies || 1}
              onChange={handleChange}
              placeholder="Vacancies"
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white"
            />
            <input
              name="application_deadline"
              type="datetime-local"
              value={form.application_deadline || ""}
              onChange={handleChange}
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white"
            />
          </div>

          <div className="flex gap-4 items-center flex-wrap">
            <label className="flex items-center gap-2 text-white/70">
              <input
                type="checkbox"
                checked={form.ppo_available || false}
                onChange={(e) => setForm((p) => ({ ...p, ppo_available: e.target.checked }))}
              />
              PPO Available
            </label>
            <label className="flex items-center gap-2 text-white/70">
              <input
                type="checkbox"
                checked={form.certificate_provided || false}
                onChange={(e) => setForm((p) => ({ ...p, certificate_provided: e.target.checked }))}
              />
              Certificate Provided
            </label>
            <label className="flex items-center gap-2 text-white/70">
              <input
                type="checkbox"
                checked={form.is_active || false}
                onChange={(e) => setForm((p) => ({ ...p, is_active: e.target.checked }))}
              />
              Active
            </label>
          </div>

          <select
            name="status"
            value={form.status}
            onChange={handleChange}
            className="px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white"
          >
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="closed">Closed</option>
          </select>

          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 bg-violet-600 hover:bg-violet-700 text-white font-semibold py-3 rounded-xl disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save"}
            </button>
            <button
              type="button"
              onClick={() => router.back()}
              className="px-6 py-3 bg-white/10 rounded-xl text-white"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </CompanyLayout>
  );
}