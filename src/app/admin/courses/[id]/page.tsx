"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { motion } from "framer-motion";
import { getCourse, createCourse, updateCourse, Course } from "@/services/v2Service";
import AdminLayout from "@/app/admin/AdminLayout";
import toast from "react-hot-toast";

const emptyCourse: Partial<Course> = {
  title: "",
  subtitle: "",
  description: "",
  thumbnail: "",
  language: "",
  difficulty: "beginner",
  course_type: "free",
  price: 0,
  discounted_price: 0,
  duration_hours: 0,
  prerequisites: "",
  learning_outcomes: "",
  target_audience: "",
  category: 0,
  instructor: 0,
};

export default function CourseFormPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const isNew = id === "new";

  const [form, setForm] = useState<Partial<Course>>(emptyCourse);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isNew) {
      const fetchCourse = async () => {
        setLoading(true);
        try {
          const course = await getCourse(Number(id));
          setForm(course);
        } catch (err) {
          toast.error("Failed to load course");
          router.push("/admin/courses");
        } finally {
          setLoading(false);
        }
      };
      fetchCourse();
    }
  }, [id, isNew, router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const val = type === "number" ? Number(value) : value;
    setForm((prev) => ({ ...prev, [name]: val }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (isNew) {
        await createCourse(form);
        toast.success("Course created");
      } else {
        await updateCourse(Number(id), form);
        toast.success("Course updated");
      }
      router.push("/admin/courses");
    } catch (err) {
      toast.error("Failed to save course");
    } finally {
      setSaving(false);
    }
  };

  if (loading && !isNew) {
    return (
      <AdminLayout>
        <div className="min-h-screen bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e] flex items-center justify-center">
          <p className="text-white/60">Loading...</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="min-h-screen bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e] relative overflow-hidden">
        <div className="absolute top-0 -left-20 w-72 h-72 bg-purple-500/20 rounded-full mix-blend-multiply filter blur-3xl animate-blob" />
        <div className="absolute top-0 -right-20 w-72 h-72 bg-fuchsia-500/20 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000" />

        <div className="relative z-10 p-4 sm:p-6 lg:p-8 max-w-3xl mx-auto">
          <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-violet-300 to-fuchsia-300 mb-8">
            {isNew ? "Create Course" : "Edit Course"}
          </h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-white/70 mb-1">Title *</label>
                <input name="title" value={form.title || ""} onChange={handleChange} required className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white" />
              </div>
              <div>
                <label className="block text-sm text-white/70 mb-1">Subtitle</label>
                <input name="subtitle" value={form.subtitle || ""} onChange={handleChange} className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white" />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm text-white/70 mb-1">Description</label>
                <textarea name="description" value={form.description || ""} onChange={handleChange} rows={4} className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white" />
              </div>
              <div>
                <label className="block text-sm text-white/70 mb-1">Thumbnail URL</label>
                <input name="thumbnail" value={form.thumbnail || ""} onChange={handleChange} className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white" />
              </div>
              <div>
                <label className="block text-sm text-white/70 mb-1">Language</label>
                <input name="language" value={form.language || ""} onChange={handleChange} className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white" />
              </div>
              <div>
                <label className="block text-sm text-white/70 mb-1">Difficulty</label>
                <select name="difficulty" value={form.difficulty} onChange={handleChange} className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white">
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-white/70 mb-1">Course Type</label>
                <select name="course_type" value={form.course_type} onChange={handleChange} className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white">
                  <option value="free">Free</option>
                  <option value="paid">Paid</option>
                  <option value="premium">Premium</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-white/70 mb-1">Price</label>
                <input type="number" name="price" value={form.price || 0} onChange={handleChange} className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white" />
              </div>
              <div>
                <label className="block text-sm text-white/70 mb-1">Discounted Price</label>
                <input type="number" name="discounted_price" value={form.discounted_price || 0} onChange={handleChange} className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white" />
              </div>
              <div>
                <label className="block text-sm text-white/70 mb-1">Duration (hours)</label>
                <input type="number" name="duration_hours" value={form.duration_hours || 0} onChange={handleChange} className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white" />
              </div>
              <div>
                <label className="block text-sm text-white/70 mb-1">Category ID</label>
                <input type="number" name="category" value={form.category || 0} onChange={handleChange} className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white" />
              </div>
              <div>
                <label className="block text-sm text-white/70 mb-1">Instructor ID</label>
                <input type="number" name="instructor" value={form.instructor || 0} onChange={handleChange} className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white" />
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <button
                type="submit"
                disabled={saving}
                className="flex-1 px-6 py-3 bg-violet-600 hover:bg-violet-700 text-white font-semibold rounded-xl transition disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save"}
              </button>
              <button
                type="button"
                onClick={() => router.back()}
                className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl transition"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </AdminLayout>
  );
}