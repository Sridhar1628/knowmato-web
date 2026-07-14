"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import AdminLayout from "@/app/admin/AdminLayout";
import toast from "react-hot-toast";
import {
  getAssignments,
  Assignment,
  // You need to create these admin services:
  getAdminProgrammingMarks,
  getAdminMCQMarks,
} from "@/services/assessmentService";

// ---------- Types for admin results (extend your existing interfaces) ----------
interface AdminProgrammingMark {
  id: number;
  user: number;           // user ID
  user_name: string;       // display name or email
  question: number;
  question_text: string;   // optional: show question text
  marks: string;
  status: string;
  created_at: string;
  assignment_id?: number;
}

interface AdminMCQMark {
  id: number;
  user: number;
  user_name: string;
  type: string;
  subtype: string;
  marks: string;
  status: string;
  created_at: string;
  assignment_id?: number;
}

export default function AdminResultsPage() {
  const router = useRouter();

  // ─── Filter state ───────────────────────────────────
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [selectedAssignment, setSelectedAssignment] = useState<number | "">("");
  const [selectedUserSearch, setSelectedUserSearch] = useState("");
  const [activeTab, setActiveTab] = useState<"programming" | "mcq">("programming");

  // ─── Data state ─────────────────────────────────────
  const [programmingResults, setProgrammingResults] = useState<AdminProgrammingMark[]>([]);
  const [mcqResults, setMCQResults] = useState<AdminMCQMark[]>([]);
  const [loading, setLoading] = useState(true);

  // ─── Fetch assignments for filter dropdown ──────────
  useEffect(() => {
    const fetchAssignments = async () => {
      try {
        const data = await getAssignments();
        setAssignments(data || []);
      } catch {
        toast.error("Failed to load assignments");
      }
    };
    fetchAssignments();
  }, []);

  // ─── Fetch results when filters change ─────────────
  const fetchResults = useCallback(async () => {
    setLoading(true);
    try {
      const filters: any = {};
      if (selectedAssignment) filters.assignment_id = selectedAssignment;
      if (selectedUserSearch.trim()) filters.user_search = selectedUserSearch.trim();

      if (activeTab === "programming") {
        const data = await getAdminProgrammingMarks(filters);
        setProgrammingResults(data || []);
      } else {
        const data = await getAdminMCQMarks(filters);
        setMCQResults(data || []);
      }
    } catch (err) {
      toast.error(`Failed to load ${activeTab} results`);
    } finally {
      setLoading(false);
    }
  }, [activeTab, selectedAssignment, selectedUserSearch]);

  useEffect(() => {
    fetchResults();
  }, [fetchResults]);

  // ─── Helper to format date ──────────────────────────
  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  return (
    <AdminLayout>
      <div className="min-h-screen bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e] relative overflow-hidden">
        {/* Background blobs */}
        <div className="absolute top-0 -left-20 w-72 h-72 bg-purple-500/20 rounded-full mix-blend-multiply filter blur-3xl animate-blob" />
        <div className="absolute top-0 -right-20 w-72 h-72 bg-fuchsia-500/20 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000" />
        <div className="absolute -bottom-20 left-40 w-72 h-72 bg-cyan-500/20 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000" />

        <div className="relative z-10 p-4 sm:p-6 lg:p-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-violet-300 via-fuchsia-300 to-cyan-300">
              📊 Assessment Results
            </h1>
            <p className="text-white/70 mt-1">View student performance across programming challenges & MCQs.</p>
          </motion.div>

          {/* Filters + Tabs */}
          <div className="mb-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex flex-wrap gap-3">
              {/* Assignment filter */}
              <select
                value={selectedAssignment}
                onChange={(e) =>
                  setSelectedAssignment(e.target.value ? Number(e.target.value) : "")
                }
                className="rounded-xl bg-white/10 border border-white/20 px-4 py-2 text-white text-sm outline-none focus:border-violet-400"
              >
                <option value="">All Assignments</option>
                {assignments.map((a) => (
                  <option key={a.id} value={a.id}>
                    Assignment #{a.id} (Batch {a.batch})
                  </option>
                ))}
              </select>

              {/* User search */}
              <input
                type="text"
                placeholder="Search student..."
                value={selectedUserSearch}
                onChange={(e) => setSelectedUserSearch(e.target.value)}
                className="rounded-xl bg-white/10 border border-white/20 px-4 py-2 text-white text-sm placeholder-white/40 outline-none focus:border-violet-400 w-48"
              />
            </div>

            {/* Tabs */}
            <div className="flex gap-2">
              {(["programming", "mcq"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`rounded-full px-4 py-2 text-sm font-bold transition-all ${
                    activeTab === tab
                      ? "bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white shadow-lg shadow-violet-500/25"
                      : "border border-white/20 text-white/70 hover:bg-white/10"
                  }`}
                >
                  {tab === "programming" ? "💻 Programming" : "📝 MCQ"}
                </button>
              ))}
            </div>
          </div>

          {/* Results table */}
          {loading ? (
            <div className="flex justify-center py-20">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-violet-400 border-t-transparent" />
            </div>
          ) : activeTab === "programming" ? (
            programmingResults.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-white/20 bg-white/5 backdrop-blur-xl p-12 text-center">
                <p className="text-white/50">No programming results found.</p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-2xl">
                <table className="w-full text-sm text-left">
                  <thead className="bg-white/5 text-white/70">
                    <tr>
                      <th className="px-4 py-3 font-semibold">Student</th>
                      <th className="px-4 py-3 font-semibold">Question</th>
                      <th className="px-4 py-3 font-semibold">Score</th>
                      <th className="px-4 py-3 font-semibold">Status</th>
                      <th className="px-4 py-3 font-semibold">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10">
                    {programmingResults.map((item) => (
                      <tr key={item.id} className="hover:bg-white/5 transition">
                        <td className="px-4 py-3 font-medium text-white">
                          {item.user_name || `User #${item.user}`}
                        </td>
                        <td className="px-4 py-3 text-white/70">
                          Q #{item.question} {item.question_text ? `- ${item.question_text}` : ""}
                        </td>
                        <td className="px-4 py-3 text-cyan-300 font-bold">{item.marks}%</td>
                        <td className="px-4 py-3">
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                              item.status === "completed"
                                ? "bg-emerald-400/20 text-emerald-300 border border-emerald-400/30"
                                : "bg-amber-400/20 text-amber-300 border border-amber-400/30"
                            }`}
                          >
                            {item.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-white/50">
                          {formatDate(item.created_at)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          ) : mcqResults.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/20 bg-white/5 backdrop-blur-xl p-12 text-center">
              <p className="text-white/50">No MCQ results found.</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-2xl">
              <table className="w-full text-sm text-left">
                <thead className="bg-white/5 text-white/70">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Student</th>
                    <th className="px-4 py-3 font-semibold">Type</th>
                    <th className="px-4 py-3 font-semibold">Subtype</th>
                    <th className="px-4 py-3 font-semibold">Score</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                    <th className="px-4 py-3 font-semibold">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {mcqResults.map((item) => (
                    <tr key={item.id} className="hover:bg-white/5 transition">
                      <td className="px-4 py-3 font-medium text-white">
                        {item.user_name || `User #${item.user}`}
                      </td>
                      <td className="px-4 py-3 text-white/70">{item.type}</td>
                      <td className="px-4 py-3 text-white/70">{item.subtype || "—"}</td>
                      <td className="px-4 py-3 text-cyan-300 font-bold">{item.marks} pts</td>
                      <td className="px-4 py-3">
                        <span className="rounded-full bg-emerald-400/20 px-2 py-0.5 text-[10px] font-bold text-emerald-300 border border-emerald-400/30">
                          {item.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-white/50">
                        {formatDate(item.created_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}