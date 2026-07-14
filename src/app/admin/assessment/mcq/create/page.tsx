"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import AdminLayout from "@/app/admin/AdminLayout";
import toast from "react-hot-toast";
import {
  createSample,
  CreateSamplePayload,
  getAssignments,
  Assignment,
} from "@/services/assessmentService";

export default function CreateMCQPage() {
  const router = useRouter();

  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [optionsText, setOptionsText] = useState('["Option A", "Option B", "Option C"]');
  const [formData, setFormData] = useState<CreateSamplePayload>({
    question: "",
    options: [],
    correct_answer: "",
    list: "Technical",
    subtype: "",
    Assignment: undefined,
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const loadAssignments = async () => {
      try {
        const data = await getAssignments();
        setAssignments(data || []);
      } catch {
        toast.error("Failed to load assignments");
      }
    };
    loadAssignments();
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    if (name === "options") {
      setOptionsText(value);
    } else if (name === "Assignment") {
      setFormData((prev) => ({
        ...prev,
        Assignment: value ? Number(value) : undefined,
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Parse options JSON
    let parsedOptions: string[] = [];
    try {
      parsedOptions = JSON.parse(optionsText);
      if (!Array.isArray(parsedOptions) || parsedOptions.length < 2) {
        toast.error("Options must be a JSON array with at least 2 items.");
        return;
      }
    } catch {
      toast.error("Invalid JSON for options. Example: [\"A\", \"B\", \"C\"]");
      return;
    }

    if (!formData.question.trim()) {
      toast.error("Question is required");
      return;
    }
    if (!formData.correct_answer.trim()) {
      toast.error("Correct answer is required");
      return;
    }
    if (!parsedOptions.includes(formData.correct_answer)) {
      toast.error("Correct answer must be one of the options.");
      return;
    }

    setSubmitting(true);
    try {
      await createSample({
        ...formData,
        options: parsedOptions,
      });
      toast.success("MCQ created!");
      router.push("/admin/assessment/mcq");
    } catch (err: any) {
      toast.error(err?.message || "Creation failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AdminLayout>
      <div className="min-h-screen bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e] relative overflow-hidden">
        {/* Background blobs */}
        <div className="absolute top-0 -left-20 w-72 h-72 bg-purple-500/20 rounded-full mix-blend-multiply filter blur-3xl animate-blob" />
        <div className="absolute top-0 -right-20 w-72 h-72 bg-fuchsia-500/20 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000" />
        <div className="absolute -bottom-20 left-40 w-72 h-72 bg-cyan-500/20 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000" />

        <div className="relative z-10 p-4 sm:p-6 lg:p-8 max-w-2xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <button
              onClick={() => router.push("/admin/assessment/mcq")}
              className="mb-4 flex items-center gap-1 text-sm font-semibold text-violet-300 hover:text-violet-200"
            >
              ← Back to MCQs
            </button>
            <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-violet-300 via-fuchsia-300 to-cyan-300 mb-2">
              ➕ Create MCQ
            </h1>
            <p className="text-white/70 mb-8">Add a new multiple‑choice question.</p>
          </motion.div>

          <motion.form
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            onSubmit={handleSubmit}
            className="space-y-6 bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10 shadow-2xl"
          >
            {/* Assignment */}
            <div>
              <label className="block text-sm font-medium text-white/80 mb-1">
                Assignment
              </label>
              <select
                name="Assignment"
                value={formData.Assignment ?? ""}
                onChange={handleChange}
                className="w-full rounded-xl bg-white/10 border border-white/20 px-4 py-3 text-white outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-500/50 transition"
              >
                <option value="">None (standalone)</option>
                {assignments.map((a) => (
                  <option key={a.id} value={a.id}>
                    Assignment #{a.id} (Batch {a.batch})
                  </option>
                ))}
              </select>
            </div>

            {/* Category (list) */}
            <div>
              <label className="block text-sm font-medium text-white/80 mb-1">
                Category <span className="text-red-400">*</span>
              </label>
              <select
                name="list"
                value={formData.list}
                onChange={handleChange}
                required
                className="w-full rounded-xl bg-white/10 border border-white/20 px-4 py-3 text-white outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-500/50 transition"
              >
                <option value="Technical">Technical</option>
                <option value="SoftSkill">SoftSkill</option>
                <option value="Aptitude">Aptitude</option>
              </select>
            </div>

            {/* Subtype */}
            <div>
              <label className="block text-sm font-medium text-white/80 mb-1">
                Subtype
              </label>
              <input
                type="text"
                name="subtype"
                value={formData.subtype ?? ""}
                onChange={handleChange}
                className="w-full rounded-xl bg-white/10 border border-white/20 px-4 py-3 text-white placeholder-white/40 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-500/50 transition"
                placeholder="e.g., JavaScript, Python"
              />
            </div>

            {/* Question */}
            <div>
              <label className="block text-sm font-medium text-white/80 mb-1">
                Question <span className="text-red-400">*</span>
              </label>
              <textarea
                name="question"
                value={formData.question}
                onChange={handleChange}
                rows={3}
                required
                className="w-full rounded-xl bg-white/10 border border-white/20 px-4 py-3 text-white placeholder-white/40 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-500/50 transition resize-none"
                placeholder="What is the capital of France?"
              />
            </div>

            {/* Options (JSON) */}
            <div>
              <label className="block text-sm font-medium text-white/80 mb-1">
                Options (JSON array) <span className="text-red-400">*</span>
              </label>
              <textarea
                name="options"
                value={optionsText}
                onChange={handleChange}
                rows={4}
                className="w-full rounded-xl bg-white/10 border border-white/20 px-4 py-3 text-white font-mono text-sm placeholder-white/40 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-500/50 transition resize-none"
                placeholder='["Paris", "London", "Berlin", "Madrid"]'
              />
              <p className="text-xs text-white/40 mt-1">
                Enter a valid JSON array of strings (e.g. ["A", "B", "C"]).
              </p>
            </div>

            {/* Correct Answer */}
            <div>
              <label className="block text-sm font-medium text-white/80 mb-1">
                Correct Answer <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                name="correct_answer"
                value={formData.correct_answer}
                onChange={handleChange}
                required
                className="w-full rounded-xl bg-white/10 border border-white/20 px-4 py-3 text-white placeholder-white/40 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-500/50 transition"
                placeholder="Must match exactly one of the options above"
              />
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-bold rounded-xl shadow-lg shadow-violet-500/25 hover:from-violet-700 hover:to-fuchsia-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Creating...
                </>
              ) : (
                "Create MCQ"
              )}
            </button>
          </motion.form>
        </div>
      </div>
    </AdminLayout>
  );
}