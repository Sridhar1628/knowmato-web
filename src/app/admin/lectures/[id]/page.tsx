"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { getLecture, createLecture, updateLecture, Lecture } from "@/services/v2Service";
import AdminLayout from "@/app/admin/AdminLayout";
import AlertService from "@/services/alertService";

const emptyLecture: Partial<Lecture> = {
  title: "",
  description: "",
  order: 0,
  content_type: "video",
  video_url: "",
  video_duration: 0,
  pdf_url: "",
  article_content: "",
  resource_url: "",
  resource_name: "",
  section: 0,
  is_preview: false,
  is_downloadable: false,
  is_active: true,
};

export default function LectureFormPage() {
  const router = useRouter();
  const { id } = useParams();
  const isNew = id === "new";
  const [form, setForm] = useState<Partial<Lecture>>(emptyLecture);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isNew) {
      setLoading(true);
      getLecture(Number(id))
        .then(setForm)
        .catch(() => AlertService.error("Load Failed", "Failed to load lecture"))
        .finally(() => setLoading(false));
    }
  }, [id, isNew]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const val = type === "number" ? Number(value) : value;
    setForm((prev) => ({ ...prev, [name]: val }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (isNew) await createLecture(form);
      else await updateLecture(Number(id), form);
      AlertService.success(
        isNew ? "Lecture Created" : "Lecture Updated",
        isNew ? "Lecture created successfully" : "Lecture updated successfully",
      );
      router.push("/admin/lectures");
    } catch {
      AlertService.error("Save Failed", "Failed to save lecture");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="min-h-screen flex items-center justify-center text-white/60">Loading...</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="min-h-screen bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e] relative overflow-hidden p-4 sm:p-8">
        <div className="max-w-2xl mx-auto relative z-10">
          <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-violet-300 to-fuchsia-300 mb-8">
            {isNew ? "New Lecture" : "Edit Lecture"}
          </h1>
          <form onSubmit={handleSubmit} className="space-y-4">
            <input name="title" placeholder="Title" value={form.title || ""} onChange={handleChange} required className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white" />
            <textarea name="description" placeholder="Description" value={form.description || ""} onChange={handleChange} className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white" />
            <div className="flex gap-4">
              <input name="order" type="number" placeholder="Order" value={form.order || 0} onChange={handleChange} className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white" />
              <input name="section" type="number" placeholder="Section ID" value={form.section || 0} onChange={handleChange} className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white" />
            </div>
            <select name="content_type" value={form.content_type} onChange={handleChange} className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white">
              <option value="video">Video</option>
              <option value="pdf">PDF</option>
              <option value="article">Article</option>
              <option value="assignment">Assignment</option>
              <option value="resource">Resource</option>
            </select>
            {/* conditional fields based on content_type can be added */}
            <div className="flex gap-4">
              <input name="video_url" placeholder="Video URL" value={form.video_url || ""} onChange={handleChange} className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white" />
              <input name="video_duration" type="number" placeholder="Duration (s)" value={form.video_duration || 0} onChange={handleChange} className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white" />
            </div>
            <div className="flex gap-4 items-center">
              <label className="flex items-center gap-2 text-white/70">
                <input type="checkbox" name="is_preview" checked={form.is_preview || false} onChange={(e) => setForm((p) => ({ ...p, is_preview: e.target.checked }))} /> Preview
              </label>
              <label className="flex items-center gap-2 text-white/70">
                <input type="checkbox" name="is_downloadable" checked={form.is_downloadable || false} onChange={(e) => setForm((p) => ({ ...p, is_downloadable: e.target.checked }))} /> Downloadable
              </label>
              <label className="flex items-center gap-2 text-white/70">
                <input type="checkbox" name="is_active" checked={form.is_active || false} onChange={(e) => setForm((p) => ({ ...p, is_active: e.target.checked }))} /> Active
              </label>
            </div>
            <div className="flex gap-4">
              <button type="submit" disabled={saving} className="flex-1 bg-violet-600 hover:bg-violet-700 text-white font-semibold py-3 rounded-xl disabled:opacity-50">
                {saving ? "Saving..." : "Save"}
              </button>
              <button type="button" onClick={() => router.back()} className="px-6 py-3 bg-white/10 hover:bg-white/20 rounded-xl text-white">Cancel</button>
            </div>
          </form>
        </div>
      </div>
    </AdminLayout>
  );
}