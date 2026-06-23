"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import {
  getAdminCurrentAffairs,
  createCurrentAffair,
  updateCurrentAffair,
  deleteCurrentAffair,
  CurrentAffair,
  CreateCurrentAffairPayload,
  UpdateCurrentAffairPayload,
} from "@/services/v1Service";
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
  const imagePreviewUrl =
    form.image ? URL.createObjectURL(form.image) : null;

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });

  // ---------- loading state ----------
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
          <p className="mt-4 text-gray-600">Loading current affairs…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-800">
              📰 Current Affairs (Admin)
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Manage news and updates shown to users.
            </p>
          </div>
          <button
            onClick={openCreateModal}
            className="mt-4 sm:mt-0 inline-flex items-center gap-2 rounded-full bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-indigo-700"
          >
            + Create New
          </button>
        </div>

        {/* Grid */}
        {affairs.length === 0 ? (
          <div className="py-20 text-center text-gray-400">
            <span className="text-6xl">📭</span>
            <p className="mt-4 text-lg font-medium">No current affairs yet.</p>
            <p className="text-sm">Click “Create New” to add one.</p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {affairs.map((affair) => (
              <div
                key={affair.id}
                className="group overflow-hidden rounded-2xl bg-white shadow-sm transition hover:shadow-lg"
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
                  <div className="flex aspect-[16/9] items-center justify-center bg-gradient-to-br from-indigo-100 to-purple-100">
                    <span className="text-4xl">📰</span>
                  </div>
                )}

                <div className="p-5">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="rounded-full bg-indigo-50 px-3 py-0.5 text-xs font-semibold capitalize text-indigo-700">
                      {affair.category}
                    </span>
                    <span className="text-xs text-gray-400">
                      {formatDate(affair.created_at)}
                    </span>
                  </div>

                  <h3 className="mb-2 text-lg font-bold text-gray-800 line-clamp-2">
                    {affair.title}
                  </h3>
                  <p className="text-sm text-gray-600 line-clamp-3">
                    {affair.description}
                  </p>

                  {/* Actions */}
                  <div className="mt-4 flex gap-3">
                    <button
                      onClick={() => openEditModal(affair)}
                      className="flex-1 rounded-lg border border-gray-300 bg-white py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
                    >
                      ✏️ Edit
                    </button>
                    <button
                      onClick={() => handleDelete(affair.id, affair.title)}
                      className="flex-1 rounded-lg border border-red-200 bg-white py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50"
                    >
                      🗑️ Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create / Edit Modal */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={closeModal}
        >
          <div
            className="mx-4 max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="mb-6 text-xl font-bold text-gray-800">
              {editingId ? "✏️ Edit Current Affair" : "➕ Create Current Affair"}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Title */}
              <label className="block">
                <span className="text-sm font-medium text-gray-700">Title</span>
                <input
                  type="text"
                  required
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-gray-200 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </label>

              {/* Description */}
              <label className="block">
                <span className="text-sm font-medium text-gray-700">
                  Description
                </span>
                <textarea
                  required
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-gray-200 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </label>

              {/* Category */}
              <label className="block">
                <span className="text-sm font-medium text-gray-700">
                  Category
                </span>
                <select
                  value={form.category}
                  onChange={(e) =>
                    setForm({ ...form, category: e.target.value as any })
                  }
                  className="mt-1 w-full rounded-xl border border-gray-200 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
                  className="h-5 w-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-sm font-medium text-gray-700">
                  Published
                </span>
              </label>

              {/* Image */}
              <div>
                <span className="text-sm font-medium text-gray-700">Image</span>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0] || null;
                    setForm({ ...form, image: file });
                  }}
                  className="mt-1 block w-full text-sm text-gray-700 file:mr-4 file:rounded-full file:border-0 file:bg-indigo-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-indigo-700 hover:file:bg-indigo-100"
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
                  <p className="text-xs text-gray-500 mt-2">
                    Existing image will be kept unless a new one is selected.
                  </p>
                )}
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={submitting}
                  className="flex-1 rounded-xl border border-gray-300 bg-white py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 rounded-xl bg-indigo-600 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
                >
                  {submitting
                    ? editingId
                      ? "Updating..."
                      : "Creating..."
                    : editingId
                    ? "Update"
                    : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}