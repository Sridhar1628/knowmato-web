"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";

// ── Your existing v2 service imports ───────────────────────
import {
  getCourse,
  getLectures,
  createLecture,
  updateLecture,
  deleteLecture,
  getSections,
  createSection,
  updateSection,
  deleteSection,
  getCourseSections,
  Course,
  Section,
  Lecture,
} from "@/services/v2Service";

import AdminLayout from "@/app/admin/AdminLayout";
import ConfirmModal from "@/components/ConfirmModal";
import toast from "react-hot-toast";

// ────────────────────────────────────────────────────────────
//  MODALS
// ────────────────────────────────────────────────────────────

function SectionModal({
  open,
  onClose,
  onSave,
  initial,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (data: Partial<Section>) => void;
  initial?: Partial<Section>;
}) {
  const [form, setForm] = useState<Partial<Section>>({
    title: "",
    description: "",
    order: 0,
    is_active: true,
    is_preview: false,
    ...initial,
  });

  useEffect(() => {
    setForm({
      title: "",
      description: "",
      order: 0,
      is_active: true,
      is_preview: false,
      ...initial,
    });
  }, [initial]);

  if (!open) return null;

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    const val =
      type === "number"
        ? Number(value)
        : type === "checkbox"
        ? (e.target as HTMLInputElement).checked
        : value;
    setForm((prev) => ({ ...prev, [name]: val }));
  };

  const handleCheckbox = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.checked }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-[#1e1b2e] p-6 rounded-2xl w-full max-w-lg mx-4 border border-white/10 max-h-[90vh] overflow-auto">
        <h3 className="text-lg font-semibold text-white mb-4">
          {initial?.id ? "Edit Section" : "New Section"}
        </h3>
        <div className="space-y-3">
          <input
            name="title"
            value={form.title || ""}
            onChange={handleChange}
            placeholder="Section title *"
            required
            className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white"
          />
          <textarea
            name="description"
            value={form.description || ""}
            onChange={handleChange}
            placeholder="Description"
            className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white"
          />
          <div className="flex gap-4">
            <input
              name="order"
              type="number"
              value={form.order || 0}
              onChange={handleChange}
              placeholder="Order"
              className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white"
            />
            <input
              name="duration_minutes"
              type="number"
              value={form.duration_minutes || 0}
              onChange={handleChange}
              placeholder="Duration (min)"
              className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white"
            />
          </div>
          <div className="flex gap-4 items-center">
            <label className="flex items-center gap-2 text-white/70">
              <input
                type="checkbox"
                name="is_active"
                checked={form.is_active || false}
                onChange={handleCheckbox}
              />
              Active
            </label>
            <label className="flex items-center gap-2 text-white/70">
              <input
                type="checkbox"
                name="is_preview"
                checked={form.is_preview || false}
                onChange={handleCheckbox}
              />
              Preview
            </label>
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-white/10 rounded-xl text-white"
          >
            Cancel
          </button>
          <button
            onClick={() => onSave(form)}
            className="px-4 py-2 bg-violet-600 rounded-xl text-white"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

function LectureModal({
  open,
  onClose,
  onSave,
  initial,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (data: Partial<Lecture>) => void;
  initial?: Partial<Lecture>;
}) {
  const [form, setForm] = useState<Partial<Lecture>>({
    title: "",
    description: "",
    order: 0,
    content_type: "video",
    video_url: "",
    video_duration: 0,
    is_preview: false,
    is_downloadable: false,
    is_active: true,
    ...initial,
  });

  useEffect(() => {
    setForm({
      title: "",
      description: "",
      order: 0,
      content_type: "video",
      video_url: "",
      video_duration: 0,
      is_preview: false,
      is_downloadable: false,
      is_active: true,
      ...initial,
    });
  }, [initial]);

  if (!open) return null;

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    const val =
      type === "number"
        ? Number(value)
        : type === "checkbox"
        ? (e.target as HTMLInputElement).checked
        : value;
    setForm((prev) => ({ ...prev, [name]: val }));
  };

  const handleCheckbox = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.checked }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-[#1e1b2e] p-6 rounded-2xl w-full max-w-lg mx-4 border border-white/10 max-h-[90vh] overflow-auto">
        <h3 className="text-lg font-semibold text-white mb-4">
          {initial?.id ? "Edit Lecture" : "New Lecture"}
        </h3>
        <div className="space-y-3">
          <input
            name="title"
            value={form.title || ""}
            onChange={handleChange}
            placeholder="Title *"
            required
            className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white"
          />
          <textarea
            name="description"
            value={form.description || ""}
            onChange={handleChange}
            placeholder="Description"
            className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white"
          />
          <div className="flex gap-3">
            <input
              name="order"
              type="number"
              value={form.order || 0}
              onChange={handleChange}
              placeholder="Order"
              className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white"
            />
          </div>
          <select
            name="content_type"
            value={form.content_type}
            onChange={handleChange}
            className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white"
          >
            <option value="video">Video</option>
            <option value="pdf">PDF</option>
            <option value="article">Article</option>
            <option value="assignment">Assignment</option>
            <option value="resource">Resource</option>
          </select>
          {form.content_type === "video" && (
            <>
              <input
                name="video_url"
                value={form.video_url || ""}
                onChange={handleChange}
                placeholder="Video URL"
                className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white"
              />
              <input
                name="video_duration"
                type="number"
                value={form.video_duration || 0}
                onChange={handleChange}
                placeholder="Duration (seconds)"
                className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white"
              />
            </>
          )}
          <div className="flex gap-4 items-center flex-wrap">
            <label className="flex items-center gap-2 text-white/70">
              <input
                type="checkbox"
                name="is_preview"
                checked={form.is_preview || false}
                onChange={handleCheckbox}
              />
              Preview
            </label>
            <label className="flex items-center gap-2 text-white/70">
              <input
                type="checkbox"
                name="is_downloadable"
                checked={form.is_downloadable || false}
                onChange={handleCheckbox}
              />
              Downloadable
            </label>
            <label className="flex items-center gap-2 text-white/70">
              <input
                type="checkbox"
                name="is_active"
                checked={form.is_active || false}
                onChange={handleCheckbox}
              />
              Active
            </label>
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-white/10 rounded-xl text-white"
          >
            Cancel
          </button>
          <button
            onClick={() => onSave(form)}
            className="px-4 py-2 bg-violet-600 rounded-xl text-white"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────
//  MAIN PAGE COMPONENT
// ────────────────────────────────────────────────────────────

export default function CourseDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = Number(params.id);

  const [course, setCourse] = useState<Course | null>(null);
  const [sections, setSections] = useState<Section[]>([]);
  const [lecturesMap, setLecturesMap] = useState<Record<number, Lecture[]>>({});
  const [loading, setLoading] = useState(true);

  // Modal states
  const [sectionModal, setSectionModal] = useState<{
    open: boolean;
    initial?: Partial<Section>;
  }>({ open: false });

  const [lectureModal, setLectureModal] = useState<{
    open: boolean;
    sectionId?: number;
    initial?: Partial<Lecture>;
  }>({ open: false });

  // Delete confirmation
  const [deleteTarget, setDeleteTarget] = useState<{
    type: "section" | "lecture";
    id: number;
  } | null>(null);
  const [deleting, setDeleting] = useState(false);

  // ── Fetch course & sections ────────────────────────────
  const fetchAll = async () => {
    setLoading(true);
    try {
      const [courseData, sectionsData] = await Promise.all([
        getCourse(courseId),
        getCourseSections(courseId),
      ]);
      setCourse(courseData);
      setSections(sectionsData);

      // Fetch lectures for each section
      const map: Record<number, Lecture[]> = {};
      await Promise.all(
        sectionsData.map(async (sec) => {
          try {
            const lecs = await getLectures({ section: sec.id });
            map[sec.id] = lecs;
          } catch {
            map[sec.id] = [];
          }
        })
      );
      setLecturesMap(map);
    } catch (err) {
      toast.error("Failed to load course details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, [courseId]);

  // ── Section handlers ──────────────────────────────────
  const handleSaveSection = async (data: Partial<Section>) => {
    try {
      if (sectionModal.initial?.id) {
        // Edit existing section
        await updateSection(sectionModal.initial.id, data);
        toast.success("Section updated");
      } else {
        // Create new section
        await createSection({ ...data, course: courseId });
        toast.success("Section created");
      }
      setSectionModal({ open: false });
      fetchAll();
    } catch {
      toast.error("Failed to save section");
    }
  };

  const handleDeleteSection = (id: number) => {
    setDeleteTarget({ type: "section", id });
  };

  // ── Lecture handlers ─────────────────────────────────
  const handleOpenAddLecture = (sectionId: number) => {
    setLectureModal({ open: true, sectionId });
  };

  const handleOpenEditLecture = (lecture: Lecture) => {
    setLectureModal({ open: true, initial: lecture });
  };

  const handleSaveLecture = async (data: Partial<Lecture>) => {
    try {
      if (lectureModal.initial?.id) {
        // Edit lecture
        await updateLecture(lectureModal.initial.id, data);
        toast.success("Lecture updated");
      } else {
        // New lecture
        if (!lectureModal.sectionId) {
          toast.error("Section missing");
          return;
        }
        await createLecture({ ...data, section: lectureModal.sectionId });
        toast.success("Lecture created");
      }
      setLectureModal({ open: false });
      fetchAll();
    } catch {
      toast.error("Failed to save lecture");
    }
  };

  // ── Delete confirmation ──────────────────────────────
  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      if (deleteTarget.type === "section") {
        await deleteSection(deleteTarget.id);
        toast.success("Section deleted");
      } else {
        await deleteLecture(deleteTarget.id);
        toast.success("Lecture deleted");
      }
      fetchAll();
    } catch {
      toast.error("Delete failed");
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  };

  // ── Loading state ────────────────────────────────────
  if (loading) {
    return (
      <AdminLayout>
        <div className="min-h-screen flex items-center justify-center text-white/60">
          Loading...
        </div>
      </AdminLayout>
    );
  }

  // ── Render ───────────────────────────────────────────
  return (
    <AdminLayout>
      <div className="min-h-screen bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e] relative overflow-hidden">
        {/* Background blobs */}
        <div className="absolute top-0 -left-20 w-72 h-72 bg-purple-500/20 rounded-full mix-blend-multiply filter blur-3xl animate-blob" />
        <div className="absolute top-0 -right-20 w-72 h-72 bg-fuchsia-500/20 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000" />
        <div className="absolute -bottom-20 left-40 w-72 h-72 bg-cyan-500/20 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000" />

        <div className="relative z-10 p-4 sm:p-6 lg:p-8">
          {/* Back button */}
          <button
            onClick={() => router.back()}
            className="mb-4 flex items-center gap-2 text-white/70 hover:text-white transition"
          >
            ← Back to courses
          </button>

          {/* Course header */}
          {course && (
            <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 mb-8 border border-white/10">
              <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-violet-300 to-fuchsia-300">
                {course.title}
              </h1>
              <p className="text-white/70 mt-2">{course.subtitle}</p>
              <div className="flex flex-wrap gap-4 mt-4 text-sm text-white/60">
                <span>📚 {course.total_sections} sections</span>
                <span>🎥 {course.total_lectures} lectures</span>
                <span>👥 {course.total_students} students</span>
              </div>
            </div>
          )}

          {/* Sections header + Add button */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-white/80">Sections</h2>
            <button
              onClick={() => setSectionModal({ open: true })}
              className="px-4 py-2 bg-white/10 backdrop-blur-md rounded-xl border border-white/20 text-violet-300 font-medium hover:bg-white/20 transition"
            >
              + Add Section
            </button>
          </div>

          {sections.length === 0 ? (
            <div className="text-center text-white/60 py-10">
              No sections yet. Click “Add Section” to start.
            </div>
          ) : (
            <div className="space-y-6">
              {sections.map((section) => (
                <motion.div
                  key={section.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white/5 backdrop-blur-xl rounded-2xl p-5 border border-white/10"
                >
                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-white">
                        {section.title}
                      </h3>
                      <p className="text-sm text-white/50">
                        Order: {section.order}{" "}
                        {section.is_active ? "• Active" : "• Inactive"}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() =>
                          setSectionModal({
                            open: true,
                            initial: section,
                          })
                        }
                        className="text-sm px-2 py-1 bg-violet-600/60 text-white rounded-lg"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteSection(section.id)}
                        className="text-sm px-2 py-1 bg-red-600/20 text-red-300 rounded-lg"
                      >
                        Delete
                      </button>
                      <button
                        onClick={() => handleOpenAddLecture(section.id)}
                        className="text-sm px-2 py-1 bg-cyan-600/60 text-white rounded-lg"
                      >
                        + Lecture
                      </button>
                    </div>
                  </div>

                  {/* Lectures inside this section */}
                  {lecturesMap[section.id]?.length === 0 ? (
                    <p className="text-sm text-white/40 pl-4">
                      No lectures in this section.
                    </p>
                  ) : (
                    <div className="space-y-2 pl-4">
                      {lecturesMap[section.id]?.map((lecture) => (
                        <div
                          key={lecture.id}
                          className="flex justify-between items-center bg-white/5 rounded-xl p-3 border border-white/10"
                        >
                          <div>
                            <p className="text-white font-medium">
                              {lecture.title}
                            </p>
                            <p className="text-xs text-white/50">
                              {lecture.content_type} • order {lecture.order}
                              {lecture.is_preview && " • Preview"}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleOpenEditLecture(lecture)}
                              className="text-xs px-2 py-1 bg-violet-600/60 text-white rounded-lg"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() =>
                                setDeleteTarget({
                                  type: "lecture",
                                  id: lecture.id,
                                })
                              }
                              className="text-xs px-2 py-1 bg-red-600/20 text-red-300 rounded-lg"
                            >
                              Del
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          )}

          {/* Modals */}
          <SectionModal
            open={sectionModal.open}
            onClose={() => setSectionModal({ open: false })}
            onSave={handleSaveSection}
            initial={sectionModal.initial}
          />
          <LectureModal
            open={lectureModal.open}
            onClose={() => setLectureModal({ open: false })}
            onSave={handleSaveLecture}
            initial={lectureModal.initial}
          />
          <ConfirmModal
            open={!!deleteTarget}
            title="Confirm Delete"
            message="This action cannot be undone."
            onConfirm={confirmDelete}
            onCancel={() => setDeleteTarget(null)}
            loading={deleting}
          />
        </div>
      </div>
    </AdminLayout>
  );
}