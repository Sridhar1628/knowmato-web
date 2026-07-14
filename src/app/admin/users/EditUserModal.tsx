"use client";

import { useState } from "react";
import { adminUpdateUser, UpdateUserPayload } from "@/services/v1Service";
import toast from "react-hot-toast";
import { motion } from "framer-motion";

interface EditUserModalProps {
  user: {
    id: number;
    email: string;
    display_name: string;
    role: string;
    phone?: string;
  };
  onClose: () => void;
}

export default function EditUserModal({ user, onClose }: EditUserModalProps) {
  const [form, setForm] = useState({
    email: user.email,
    display_name: user.display_name || "",
    role: user.role,
    phone: user.phone || "",
  });
  const [saving, setSaving] = useState(false);

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      const payload: UpdateUserPayload = {};
      if (form.email !== user.email) payload.email = form.email;
      if (form.display_name !== user.display_name) payload.display_name = form.display_name;
      if (form.role !== user.role) payload.role = form.role;
      if (form.phone !== (user.phone || "")) payload.phone = form.phone;

      if (Object.keys(payload).length === 0) {
        toast("No changes detected.");
        setSaving(false);
        return;
      }

      await adminUpdateUser(user.id, payload);
      toast.success("User updated.");
      onClose();
    } catch (error) {
      console.error(error);
      toast.error("Failed to update user.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md mx-4 rounded-2xl bg-gray-900 border border-white/10 p-6 shadow-2xl"
      >
        <h2 className="text-xl font-bold text-white mb-4">Edit User</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Display Name"
            value={form.display_name}
            onChange={(v) => handleChange("display_name", v)}
          />
          <Input
            label="Email"
            type="email"
            value={form.email}
            onChange={(v) => handleChange("email", v)}
          />
          <Input
            label="Phone"
            value={form.phone}
            onChange={(v) => handleChange("phone", v)}
          />
          <div>
            <label className="block text-sm font-medium text-white/70 mb-1">Role</label>
            <select
              value={form.role}
              onChange={(e) => handleChange("role", e.target.value)}
              className="w-full rounded-xl border-2 border-white/20 bg-gray-900/60 px-4 py-3 text-white focus:border-violet-400 focus:ring-4 focus:ring-violet-500/50 outline-none transition appearance-none"
            >
              <option value="student" className="bg-gray-800">Student</option>
              <option value="tutor" className="bg-gray-800">Tutor</option>
              <option value="company" className="bg-gray-800">Company</option>
              <option value="admin" className="bg-gray-800">Admin</option>
            </select>
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl bg-white/10 text-white hover:bg-white/20 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white font-semibold hover:from-violet-600 hover:to-fuchsia-600 transition disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

function Input({
  label,
  type = "text",
  value,
  onChange,
}: {
  label: string;
  type?: string;
  value: string;
  onChange: (val: string) => void;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-white/70 mb-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border-2 border-white/20 bg-gray-900/60 px-4 py-3 text-white placeholder-white/40 focus:border-violet-400 focus:ring-4 focus:ring-violet-500/50 outline-none transition"
      />
    </div>
  );
}