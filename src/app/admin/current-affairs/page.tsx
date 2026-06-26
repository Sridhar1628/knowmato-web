"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  getAdminCurrentAffairs,
  createCurrentAffair,
  updateCurrentAffair,
  deleteCurrentAffair,
  CurrentAffair,
  CreateCurrentAffairPayload,
  UpdateCurrentAffairPayload,
} from "@/services/v1Service";
import AdminLayout from "@/app/admin/AdminLayout";
import toast from "react-hot-toast";

const CATEGORIES = [
  "technology",
  "science",
  "business",
  "education",
  "ai",
  "programming",
  "general",
] as const;

const initialForm = {
  title: "",
  description: "",
  category: "general" as CreateCurrentAffairPayload["category"],
  is_published: true,
  image: null as File | null,
};

export default function AdminCurrentAffairsPage() {
  const [affairs, setAffairs] = useState<CurrentAffair[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ---------- fetch list ----------
  const fetchAffairs = useCallback(async () => {
    try {
      const res = await getAdminCurrentAffairs();
      setAffairs(res.data || res?.data || []);
    } catch (error) {
      toast.error("Failed to load current affairs.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAffairs();
  }, [fetchAffairs]);

  // ---------- open create modal ----------
  const openCreateModal = () => {
    setEditingId(null);
    setForm(initialForm);
    setModalOpen(true);
  };

  // ---------- open edit modal ----------
  const openEditModal = (affair: CurrentAffair) => {
    setEditingId(affair.id);
    setForm({
      title: affair.title,
      description: affair.description,
      category: affair.category,
      is_published: affair.is_published,
      image: null,
    });
    setModalOpen(true);
  };

  // ---------- close modal ----------
  const closeModal = () => {
    setModalOpen(false);
    setEditingId(null);
  };

  // ---------- handle form submit ----------
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editingId !== null) {
        // Update
        const payload: UpdateCurrentAffairPayload = {
          title: form.title,
          description: form.description,
          category: form.category,
          is_published: form.is_published,
          ...(form.image ? { image: form.image } : {}),
        };
        await updateCurrentAffair(editingId, payload);
        toast.success("Current affair updated.");
      } else {
        // Create
        const payload: CreateCurrentAffairPayload = {
          title: form.title,
          description: form.description,
          category: form.category,
          is_published: form.is_published,
          ...(form.image ? { image: form.image } : {}),
        };
        await createCurrentAffair(payload);
        toast.success("Current affair created.");
      }
      closeModal();
      fetchAffairs();
    } catch (error: any) {
      const msg = error?.response?.data?.error || "Operation failed.";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  // ---------- delete ----------
  const handleDelete = async (id: number, title: string) => {
    if (!window.confirm(`Delete "${title}"?`)) return;
    try {
      await deleteCurrentAffair(id);
      toast.success("Deleted successfully.");
      fetchAffairs();
    } catch (error) {
      toast.error("Deletion failed.");
    }
  };

  // ---------- image preview ----------
  const imagePreviewUrl = form.image ? URL.createObjectURL(form.image) : null;

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });

  // ---------- loading state ----------
  if (loading) {
    return (
      <AdminLayout>
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="text-center">
            <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-violet-500 border-t-transparent" />
            <p className="mt-4 text-white/60">Loading current affairs…</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="min-h-screen bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e] relative overflow-hidden p-4 sm:p-6 lg:p-8">
        {/* Animated background blobs */}
        <div className="absolute top-0 -left-20 w-72 h-72 bg-purple-500/20 rounded-full mix-blend-multiply filter blur-3xl animate-blob" />
        <div className="absolute top-0 -right-20 w-72 h-72 bg-fuchsia-500/20 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000" />
        <div className="absolute -bottom-20 left-40 w-72 h-72 bg-cyan-500/20 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000" />

        <div className="relative z-10 max-w-7xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8"
          >
            <div>
              <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-violet-300 via-fuchsia-300 to-cyan-300">
                📰 Current Affairs (Admin)
              </h1>
              <p className="mt-1 text-sm text-white/70">
                Manage news and updates shown to users.
              </p>
            </div>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={openCreateModal}
              className="mt-4 sm:mt-0 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-violet-500/25 transition hover:from-violet-600 hover:to-fuchsia-600"
            >
              + Create New
            </motion.button>
          </motion.div>

          {/* Grid */}
          {affairs.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="py-20 text-center bg-white/5 backdrop-blur-md rounded-3xl border border-white/10"
            >
              <span className="text-6xl">📭</span>
              <p className="mt-4 text-lg font-medium text-white">
                No current affairs yet.
              </p>
              <p className="text-sm text-white/70">
                Click “Create New” to add one.
              </p>
            </motion.div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {affairs.map((affair) => (
                <motion.div
                  key={affair.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  whileHover={{ y: -3 }}
                  className="group overflow-hidden rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-xl transition"
                >
                  {affair.image_url ? (
                    <div className="aspect-[16/9] overflow-hidden">
                      <img
                        src={affair.image_url}
                        alt={affair.title}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                        loading="lazy"
                      />
                    </div>
                  ) : (
                    <div className="flex aspect-[16/9] items-center justify-center bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20">
                      <span className="text-4xl">📰</span>
                    </div>
                  )}

                  <div className="p-5">
                    <div className="mb-2 flex items-center justify-between">
                      <span className="rounded-full bg-violet-500/20 px-3 py-0.5 text-xs font-semibold capitalize text-violet-300 border border-violet-400/30">
                        {affair.category}
                      </span>
                      <span className="text-xs text-white/50">
                        {formatDate(affair.created_at)}
                      </span>
                    </div>

                    <h3 className="mb-2 text-lg font-bold text-white line-clamp-2">
                      {affair.title}
                    </h3>
                    <p className="text-sm text-white/70 line-clamp-3">
                      {affair.description}
                    </p>

                    {/* Actions */}
                    <div className="mt-4 flex gap-3">
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => openEditModal(affair)}
                        className="flex-1 rounded-lg border border-white/20 bg-white/10 py-2.5 text-sm font-semibold text-white hover:bg-white/20 transition"
                      >
                        ✏️ Edit
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleDelete(affair.id, affair.title)}
                        className="flex-1 rounded-lg border border-rose-400/30 bg-rose-500/10 py-2.5 text-sm font-semibold text-rose-300 hover:bg-rose-500/20 transition"
                      >
                        🗑️ Delete
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Create / Edit Modal – dark glassmorphism */}
        <AnimatePresence>
          {modalOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
              onClick={closeModal}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                transition={{ duration: 0.2 }}
                onClick={(e) => e.stopPropagation()}
                className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-gradient-to-b from-[#1e1b4b] to-[#312e81] backdrop-blur-xl border border-white/20 p-6 shadow-2xl"
              >
                <h2 className="mb-6 text-2xl font-bold text-white">
                  {editingId ? "✏️ Edit Current Affair" : "➕ Create Current Affair"}
                </h2>

                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Title */}
                  <label className="block">
                    <span className="text-sm font-medium text-white/80">Title</span>
                    <input
                      type="text"
                      required
                      value={form.title}
                      onChange={(e) => setForm({ ...form, title: e.target.value })}
                      className="mt-1 w-full rounded-xl bg-gray-900/60 border-2 border-white/20 px-4 py-3 text-sm text-white placeholder-white/40 focus:outline-none focus:ring-4 focus:ring-violet-500/50 focus:border-violet-400 transition"
                    />
                  </label>

                  {/* Description */}
                  <label className="block">
                    <span className="text-sm font-medium text-white/80">
                      Description
                    </span>
                    <textarea
                      required
                      rows={3}
                      value={form.description}
                      onChange={(e) => setForm({ ...form, description: e.target.value })}
                      className="mt-1 w-full rounded-xl bg-gray-900/60 border-2 border-white/20 px-4 py-3 text-sm text-white placeholder-white/40 focus:outline-none focus:ring-4 focus:ring-violet-500/50 focus:border-violet-400 transition resize-y"
                    />
                  </label>

                  {/* Category */}
                  <label className="block">
                    <span className="text-sm font-medium text-white/80">
                      Category
                    </span>
                    <select
                      value={form.category}
                      onChange={(e) =>
                        setForm({ ...form, category: e.target.value as any })
                      }
                      className="mt-1 w-full rounded-xl bg-gray-900/60 border-2 border-white/20 px-4 py-3 text-sm text-white focus:outline-none focus:ring-4 focus:ring-violet-500/50 focus:border-violet-400 transition"
                    >
                      {CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat.charAt(0).toUpperCase() + cat.slice(1)}
                        </option>
                      ))}
                    </select>
                  </label>

                  {/* Published toggle */}
                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={form.is_published}
                      onChange={(e) =>
                        setForm({ ...form, is_published: e.target.checked })
                      }
                      className="h-5 w-5 rounded border-white/20 bg-white/10 text-violet-500 focus:ring-violet-500/50"
                    />
                    <span className="text-sm font-medium text-white/80">
                      Published
                    </span>
                  </label>

                  {/* Image */}
                  <div>
                    <span className="text-sm font-medium text-white/80">Image</span>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0] || null;
                        setForm({ ...form, image: file });
                      }}
                      className="mt-1 block w-full text-sm text-white/70 file:mr-4 file:rounded-full file:border-0 file:bg-violet-500/20 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-violet-300 hover:file:bg-violet-500/30"
                    />
                    {imagePreviewUrl && (
                      <div className="mt-2 overflow-hidden rounded-lg">
                        <img
                          src={imagePreviewUrl}
                          alt="Preview"
                          className="h-32 w-full object-cover"
                        />
                      </div>
                    )}
                    {!form.image && editingId && affairs.find(a => a.id === editingId)?.image_url && (
                      <p className="text-xs text-white/50 mt-2">
                        Existing image will be kept unless a new one is selected.
                      </p>
                    )}
                  </div>

                  {/* Buttons */}
                  <div className="flex gap-3 pt-4">
                    <motion.button
                      type="button"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={closeModal}
                      disabled={submitting}
                      className="flex-1 rounded-xl border border-white/20 bg-white/10 py-3 text-sm font-semibold text-white hover:bg-white/20 disabled:opacity-50 transition"
                    >
                      Cancel
                    </motion.button>
                    <motion.button
                      type="submit"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      disabled={submitting}
                      className="flex-1 rounded-xl bg-gradient-to-r from-violet-500 to-fuchsia-500 py-3 text-sm font-bold text-white hover:from-violet-600 hover:to-fuchsia-600 disabled:opacity-50 shadow-lg shadow-violet-500/25 transition"
                    >
                      {submitting
                        ? editingId
                          ? "Updating..."
                          : "Creating..."
                        : editingId
                        ? "Update"
                        : "Create"}
                    </motion.button>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </AdminLayout>
  );
}