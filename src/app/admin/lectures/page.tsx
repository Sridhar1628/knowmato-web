"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { getLectures, deleteLecture, Lecture } from "@/services/v2Service";
import AdminLayout from "@/app/admin/AdminLayout";
import ConfirmModal from "@/components/ConfirmModal";
import toast from "react-hot-toast";

export default function LecturesPage() {
  const router = useRouter();
  const [lectures, setLectures] = useState<Lecture[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ section: "", content_type: "", search: "" });
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; id: number | null }>({ open: false, id: null });
  const [deleting, setDeleting] = useState(false);

  const fetchLectures = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (filters.section) params.section = Number(filters.section);
      if (filters.content_type) params.content_type = filters.content_type;
      if (filters.search) params.search = filters.search;
      const res = await getLectures(params);
      setLectures(Array.isArray(res) ? res : []);
    } catch (err) {
      toast.error("Failed to load lectures");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLectures();
  }, [filters]);

  const handleDelete = async () => {
    if (!deleteModal.id) return;
    setDeleting(true);
    try {
      await deleteLecture(deleteModal.id);
      toast.success("Lecture deleted");
      fetchLectures();
    } catch (err) {
      toast.error("Failed to delete");
    } finally {
      setDeleting(false);
      setDeleteModal({ open: false, id: null });
    }
  };

  return (
    <AdminLayout>
      <div className="min-h-screen bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e] relative overflow-hidden">
        <div className="absolute top-0 -left-20 w-72 h-72 bg-purple-500/20 rounded-full mix-blend-multiply filter blur-3xl animate-blob" />
        <div className="absolute top-0 -right-20 w-72 h-72 bg-fuchsia-500/20 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000" />

        <div className="relative z-10 p-4 sm:p-6 lg:p-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
            <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-violet-300 to-cyan-300">
              🎥 Lectures
            </h1>
            <button
              onClick={() => router.push("/admin/lectures/new")}
              className="mt-4 sm:mt-0 px-4 py-2 bg-white/10 rounded-xl border border-white/20 text-violet-300 hover:bg-white/20 transition"
            >
              + New Lecture
            </button>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-4 mb-6">
            <input
              placeholder="Search..."
              value={filters.search}
              onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
              className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/40"
            />
            <input
              placeholder="Section ID"
              value={filters.section}
              onChange={(e) => setFilters((f) => ({ ...f, section: e.target.value }))}
              className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white w-28"
            />
            <select
              value={filters.content_type}
              onChange={(e) => setFilters((f) => ({ ...f, content_type: e.target.value }))}
              className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white"
            >
              <option value="">All Types</option>
              <option value="video">Video</option>
              <option value="pdf">PDF</option>
              <option value="article">Article</option>
              <option value="assignment">Assignment</option>
              <option value="resource">Resource</option>
            </select>
          </div>

          {loading ? (
            <div className="text-center text-white/60 py-20">Loading...</div>
          ) : (
            <div className="space-y-4">
              {lectures.map((lec) => (
                <motion.div
                  key={lec.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="bg-white/5 backdrop-blur-xl rounded-2xl p-5 border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div>
                    <h3 className="text-lg font-semibold text-white">{lec.title}</h3>
                    <p className="text-sm text-white/60">
                      Order: {lec.order} | Type: {lec.content_type} | Section: {lec.section_title || lec.section}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => router.push(`/admin/lectures/${lec.id}`)}
                      className="px-3 py-2 bg-violet-600/80 hover:bg-violet-600 text-white rounded-xl text-sm"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => setDeleteModal({ open: true, id: lec.id })}
                      className="px-3 py-2 bg-red-600/20 text-red-300 border border-red-500/30 rounded-xl text-sm"
                    >
                      Delete
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          <ConfirmModal
            open={deleteModal.open}
            title="Delete Lecture"
            message="Are you sure?"
            onConfirm={handleDelete}
            onCancel={() => setDeleteModal({ open: false, id: null })}
            loading={deleting}
          />
        </div>
      </div>
    </AdminLayout>
  );
}