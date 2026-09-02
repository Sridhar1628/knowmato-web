// components/ReportUpdateForm.tsx
"use client";

import { useState } from "react";
import { updateAdminReport } from "@/services/v1Service";
import AlertService from "@/services/alertService";

interface ReportUpdateFormProps {
  reportId: number;
  initialStatus: string;
  initialNotes: string;
  onSuccess?: () => void;
}

export default function ReportUpdateForm({
  reportId,
  initialStatus,
  initialNotes,
  onSuccess,
}: ReportUpdateFormProps) {
  const [status, setStatus] = useState(initialStatus);
  const [notes, setNotes] = useState(initialNotes);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (saving) return;

    setSaving(true);

    try {
      await updateAdminReport(reportId, {
        status: status as any,
        admin_notes: notes,
      });

      await AlertService.success(
        "Success",
        "Report updated successfully!"
      );

      onSuccess?.();
    } catch (err: any) {
      console.error("Failed to update report:", err);

      const errorMessage =
        err?.response?.data?.detail ||
        err?.response?.data?.message ||
        err?.message ||
        "Unable to update the report. Please try again.";

      await AlertService.error(
        "Update Failed",
        errorMessage
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
      <h2 className="text-lg font-bold text-gray-800 mb-4">
        Update Report
      </h2>

      <div className="space-y-4">
        {/* Status */}
        <div>
          <label
            htmlFor="report-status"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Status
          </label>

          <select
            id="report-status"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            disabled={saving}
            className="w-full border border-gray-200 rounded-xl px-4 py-2 text-sm bg-white text-gray-800 focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 outline-none transition disabled:bg-gray-100 disabled:cursor-not-allowed"
          >
            <option value="pending">Pending</option>
            <option value="under_review">Under Review</option>
            <option value="resolved">Resolved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>

        {/* Admin Notes */}
        <div>
          <label
            htmlFor="admin-notes"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Admin Notes
          </label>

          <textarea
            id="admin-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            disabled={saving}
            className="w-full border border-gray-200 rounded-xl p-3 text-sm min-h-[100px] bg-white text-gray-800 placeholder:text-gray-400 focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 outline-none transition resize-y disabled:bg-gray-100 disabled:cursor-not-allowed"
            placeholder="Add internal notes..."
          />
        </div>

        {/* Save Button */}
        <button
          type="button"
          onClick={handleSubmit}
          disabled={saving}
          className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-medium rounded-xl disabled:opacity-70 disabled:cursor-not-allowed transition-all duration-200"
        >
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </div>
  );
}