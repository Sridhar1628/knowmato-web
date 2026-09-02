"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import AdminLayout from "@/app/admin/AdminLayout";
import AlertService from "@/services/alertService";

import {
  getAdminAssignmentDetail,
  updateAdminAssignment,
  AdminAssignmentDetail,
} from "@/services/assessmentService";

export default function EditAssignmentPage() {
  const router = useRouter();
  const params = useParams();

  const assignmentId = Number(params.id);

  const [assignment, setAssignment] =
    useState<AdminAssignmentDetail | null>(null);

  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
    batch: "",
    total_marks: "",
    date_of_expiry: "",
    time: "",
    status: "",
  });

  const [submitting, setSubmitting] = useState(false);

  // ==========================================================
  // FETCH ASSIGNMENT
  // ==========================================================

  useEffect(() => {
    if (!assignmentId || !Number.isFinite(assignmentId)) {
      AlertService.error(
        "Invalid Assignment",
        "The assignment ID is invalid."
      );

      router.push("/admin/assessment/assignments");
      return;
    }

    const fetchAssignment = async () => {
      try {
        setLoading(true);

        const response =
          await getAdminAssignmentDetail(assignmentId);

        if (!response?.data?.id) {
          AlertService.error(
            "Assignment Not Found",
            "The requested assignment could not be found."
          );

          router.push("/admin/assessment/assignments");
          return;
        }

        const data = response.data;

        setAssignment(data);

        setFormData({
          batch:
            data.batch !== null &&
            data.batch !== undefined
              ? String(data.batch)
              : "",

          total_marks:
            data.total_marks !== null &&
            data.total_marks !== undefined
              ? String(data.total_marks)
              : "",

          date_of_expiry:
            data.date_of_expiry ?? "",

          time:
            data.time ?? "",

          status:
            data.status ?? "",
        });
      } catch (error) {
        console.error(
          "❌ Failed to load assignment:",
          error
        );

        AlertService.error(
          "Loading Failed",
          "Failed to load assignment."
        );

        router.push(
          "/admin/assessment/assignments"
        );
      } finally {
        setLoading(false);
      }
    };

    void fetchAssignment();
  }, [assignmentId, router]);

  // ==========================================================
  // FORM CHANGE
  // ==========================================================

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  // ==========================================================
  // SUBMIT
  // ==========================================================

  const handleSubmit = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    // --------------------------------------------------------
    // Validate assignment ID
    // --------------------------------------------------------

    if (
      !Number.isFinite(assignmentId) ||
      assignmentId <= 0
    ) {
      AlertService.error(
        "Invalid Assignment",
        "The assignment ID is invalid."
      );

      return;
    }

    // --------------------------------------------------------
    // Validate expiry date
    // --------------------------------------------------------

    if (!formData.date_of_expiry.trim()) {
      AlertService.error(
        "Missing Expiry Date",
        "Expiry date is required."
      );

      return;
    }

    // --------------------------------------------------------
    // Validate batch if provided
    // --------------------------------------------------------

    if (formData.batch.trim()) {
      const batchNumber = Number(
        formData.batch
      );

      if (
        !Number.isFinite(batchNumber) ||
        batchNumber <= 0
      ) {
        AlertService.error(
          "Invalid Batch",
          "Please enter a valid batch ID."
        );

        return;
      }
    }

    // --------------------------------------------------------
    // Validate total marks if provided
    // --------------------------------------------------------

    if (formData.total_marks.trim()) {
      const totalMarks = Number(
        formData.total_marks
      );

      if (
        !Number.isFinite(totalMarks) ||
        totalMarks <= 0
      ) {
        AlertService.error(
          "Invalid Total Score",
          "Please enter a valid total score."
        );

        return;
      }
    }

    setSubmitting(true);

    try {
      await updateAdminAssignment(
        assignmentId,
        {
          batch: formData.batch.trim()
            ? Number(formData.batch)
            : undefined,

          total_marks:
            formData.total_marks.trim()
              ? formData.total_marks.trim()
              : undefined,

          date_of_expiry:
            formData.date_of_expiry,

          time:
            formData.time,

          status:
            formData.status,
        }
      );

      AlertService.success(
        "Success",
        "Assignment updated successfully."
      );

      router.push(
        "/admin/assessment/assignments"
      );
    } catch (error: any) {
      console.error(
        "❌ Update assignment error:",
        error
      );

      const message =
        error?.message ||
        error?.response?.data?.message ||
        error?.response?.data?.detail ||
        "Failed to update assignment.";

      AlertService.error(
        "Update Failed",
        message
      );
    } finally {
      setSubmitting(false);
    }
  };

  // ==========================================================
  // LOADING
  // ==========================================================

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="text-center">
            <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-violet-500 border-t-transparent" />

            <p className="mt-4 text-white/60">
              Loading assignment...
            </p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  // ==========================================================
  // SAFETY
  // ==========================================================

  if (!assignment) {
    return (
      <AdminLayout>
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-2xl">
              ⚠️
            </div>

            <h2 className="text-lg font-bold text-white">
              Assignment not found
            </h2>

            <button
              type="button"
              onClick={() =>
                router.push(
                  "/admin/assessment/assignments"
                )
              }
              className="mt-5 rounded-xl bg-violet-500/20 px-5 py-2.5 text-sm font-semibold text-violet-300 border border-violet-400/20 hover:bg-violet-500/30 transition"
            >
              Back to Assignments
            </button>
          </div>
        </div>
      </AdminLayout>
    );
  }

  // ==========================================================
  // MAIN
  // ==========================================================

  return (
    <AdminLayout>
      <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e]">
        {/* ================================================== */}
        {/* BACKGROUND BLOBS */}
        {/* ================================================== */}

        <div className="pointer-events-none absolute top-0 -left-20 h-72 w-72 rounded-full bg-purple-500/20 mix-blend-multiply blur-3xl animate-blob" />

        <div className="pointer-events-none absolute top-0 -right-20 h-72 w-72 rounded-full bg-fuchsia-500/20 mix-blend-multiply blur-3xl animate-blob animation-delay-2000" />

        <div className="pointer-events-none absolute -bottom-20 left-40 h-72 w-72 rounded-full bg-cyan-500/20 mix-blend-multiply blur-3xl animate-blob animation-delay-4000" />

        {/* ================================================== */}
        {/* CONTENT */}
        {/* ================================================== */}

        <div className="relative z-10 mx-auto max-w-2xl p-4 sm:p-6 lg:p-8">
          {/* ================================================= */}
          {/* HEADER */}
          {/* ================================================= */}

          <motion.div
            initial={{
              opacity: 0,
              y: -10,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
          >
            <button
              type="button"
              onClick={() =>
                router.push(
                  "/admin/assessment/assignments"
                )
              }
              className="mb-4 flex items-center gap-1 text-sm font-semibold text-violet-300 hover:text-violet-200 transition"
            >
              ← Back to Assignments
            </button>

            <h1 className="mb-2 bg-gradient-to-r from-violet-300 via-fuchsia-300 to-cyan-300 bg-clip-text text-3xl font-extrabold text-transparent">
              ✏️ Edit Assignment #{assignment.id}
            </h1>

            <p className="mb-8 text-white/70">
              Update batch, score, expiry date,
              time, or status.
            </p>
          </motion.div>

          {/* ================================================= */}
          {/* FORM */}
          {/* ================================================= */}

          <motion.form
            initial={{
              opacity: 0,
              y: 20,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            transition={{
              delay: 0.1,
            }}
            onSubmit={handleSubmit}
            className="space-y-6 rounded-2xl border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur-xl"
          >
            {/* ================================================= */}
            {/* BATCH */}
            {/* ================================================= */}

            <div>
              <label
                htmlFor="batch"
                className="mb-1 block text-sm font-medium text-white/80"
              >
                Batch ID
              </label>

              <input
                id="batch"
                type="number"
                name="batch"
                value={formData.batch}
                onChange={handleChange}
                min="1"
                placeholder="e.g. 1"
                disabled={submitting}
                className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-white outline-none transition placeholder:text-white/30 focus:border-violet-400 focus:ring-2 focus:ring-violet-500/50 disabled:cursor-not-allowed disabled:opacity-60"
              />
            </div>

            {/* ================================================= */}
            {/* TOTAL SCORE */}
            {/* ================================================= */}

            <div>
              <label
                htmlFor="total_marks"
                className="mb-1 block text-sm font-medium text-white/80"
              >
                Total Score
              </label>

              <input
                id="total_marks"
                type="number"
                name="total_marks"
                value={formData.total_marks}
                onChange={handleChange}
                min="1"
                step="any"
                placeholder="e.g. 100"
                disabled={submitting}
                className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-white outline-none transition placeholder:text-white/30 focus:border-violet-400 focus:ring-2 focus:ring-violet-500/50 disabled:cursor-not-allowed disabled:opacity-60"
              />
            </div>

            {/* ================================================= */}
            {/* EXPIRY DATE */}
            {/* ================================================= */}

            <div>
              <label
                htmlFor="date_of_expiry"
                className="mb-1 block text-sm font-medium text-white/80"
              >
                Date of Expiry{" "}
                <span className="text-red-400">
                  *
                </span>
              </label>

              <input
                id="date_of_expiry"
                type="date"
                name="date_of_expiry"
                value={
                  formData.date_of_expiry
                }
                onChange={handleChange}
                required
                disabled={submitting}
                className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-white outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-500/50 disabled:cursor-not-allowed disabled:opacity-60"
              />
            </div>

            {/* ================================================= */}
            {/* TIME */}
            {/* ================================================= */}

            <div>
              <label
                htmlFor="time"
                className="mb-1 block text-sm font-medium text-white/80"
              >
                Time
              </label>

              <input
                id="time"
                type="time"
                name="time"
                value={formData.time}
                onChange={handleChange}
                disabled={submitting}
                className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-white outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-500/50 disabled:cursor-not-allowed disabled:opacity-60"
              />
            </div>

            {/* ================================================= */}
            {/* STATUS */}
            {/* ================================================= */}

            <div>
              <label
                htmlFor="status"
                className="mb-1 block text-sm font-medium text-white/80"
              >
                Status
              </label>

              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleChange}
                disabled={submitting}
                className="w-full rounded-xl border border-white/20 bg-[#211d4a] px-4 py-3 text-white outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-500/50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <option value="">
                  Select status
                </option>

                <option value="Active">
                  Active
                </option>

                <option value="Expired">
                  Expired
                </option>
              </select>
            </div>

            {/* ================================================= */}
            {/* SUBMIT */}
            {/* ================================================= */}

            <button
              type="submit"
              disabled={submitting}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 py-3 font-bold text-white shadow-lg shadow-violet-500/25 transition hover:from-violet-700 hover:to-fuchsia-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />

                  Updating...
                </>
              ) : (
                "Update Assignment"
              )}
            </button>
          </motion.form>
        </div>
      </div>
    </AdminLayout>
  );
}