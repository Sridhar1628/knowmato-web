"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { getQuiz, createQuiz, updateQuiz, Quiz } from "@/services/v2Service";
import AdminLayout from "@/app/admin/AdminLayout";
import AlertService from "@/services/alertService";

const empty: Partial<Quiz> = {
  course: 0, section: null, title: "", description: "", instructions: "",
  passing_percentage: 50, duration_minutes: 10, max_attempts: 1, total_marks: 10,
  shuffle_questions: false, shuffle_options: false, show_result_immediately: true,
  show_correct_answers: true, is_required: false, is_active: true, status: "draft",
};

export default function QuizFormPage() {
  const router = useRouter();
  const { id } = useParams();
  const isNew = id === "new";
  const [form, setForm] = useState<Partial<Quiz>>(empty);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isNew) {
      setLoading(true);
      getQuiz(Number(id)).then(setForm).catch(() => AlertService.error("Load Failed", "Failed to load quiz")).finally(() => setLoading(false));
    }
  }, [id, isNew]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const val = type === "number" ? Number(value) : value;
    setForm((p) => ({ ...p, [name]: val }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (isNew) await createQuiz(form);
      else await updateQuiz(Number(id), form);
      AlertService.success(isNew ? "Quiz Created" : "Quiz Updated", isNew ? "Quiz created successfully" : "Quiz updated successfully");
      router.push("/admin/quizzes");
    } catch {
      AlertService.error("Save Failed", "Failed to save quiz");
    } finally {
      setSaving(false);
    }
  };

  if (loading && !isNew) return <AdminLayout><div className="min-h-screen flex items-center justify-center text-white/60">Loading...</div></AdminLayout>;

  return (
    <AdminLayout>
      <div className="min-h-screen bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e] p-4 sm:p-8">
        <div className="max-w-2xl mx-auto relative z-10">
          <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-violet-300 to-fuchsia-300 mb-8">
            {isNew ? "Create Quiz" : "Edit Quiz"}
          </h1>
          <form onSubmit={handleSubmit} className="space-y-4">
            <input name="title" value={form.title} onChange={handleChange} placeholder="Title" required className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white" />
            <textarea name="description" value={form.description} onChange={handleChange} placeholder="Description" className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white" />
            <textarea name="instructions" value={form.instructions || ""} onChange={handleChange} placeholder="Instructions" className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white" />
            <div className="grid grid-cols-2 gap-4">
              <input type="number" name="course" value={form.course} onChange={handleChange} placeholder="Course ID" className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white" />
              <input type="number" name="section" value={form.section ?? ""} onChange={handleChange} placeholder="Section ID (optional)" className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white" />
              <input type="number" name="passing_percentage" value={form.passing_percentage} onChange={handleChange} placeholder="Pass %" className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white" />
              <input type="number" name="duration_minutes" value={form.duration_minutes} onChange={handleChange} placeholder="Duration (min)" className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white" />
              <input type="number" name="max_attempts" value={form.max_attempts} onChange={handleChange} placeholder="Max attempts" className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white" />
              <input type="number" name="total_marks" value={form.total_marks} onChange={handleChange} placeholder="Total marks" className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white" />
            </div>
            <div className="flex flex-wrap gap-4">
              {["shuffle_questions","shuffle_options","show_result_immediately","show_correct_answers","is_required","is_active"].map((key) => (
                <label key={key} className="flex items-center gap-2 text-white/70">
                  <input type="checkbox" checked={(form as any)[key] || false} onChange={(e) => setForm((p) => ({ ...p, [key]: e.target.checked }))} />
                  {key.replace(/_/g, " ")}
                </label>
              ))}
            </div>
            <select name="status" value={form.status} onChange={handleChange} className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white">
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="archived">Archived</option>
            </select>
            <div className="flex gap-4">
              <button type="submit" disabled={saving} className="flex-1 bg-violet-600 hover:bg-violet-700 text-white font-semibold py-3 rounded-xl disabled:opacity-50">{saving ? "Saving..." : "Save"}</button>
              <button type="button" onClick={() => router.back()} className="px-6 py-3 bg-white/10 rounded-xl text-white">Cancel</button>
            </div>
          </form>
        </div>
      </div>
    </AdminLayout>
  );
}