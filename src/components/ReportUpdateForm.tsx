// components/ReportUpdateForm.tsx
"use client";

import { useState } from "react";
import { updateAdminReport } from "@/services/v1Service";
import toast from "react-hot-toast";

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
    setSaving(true);
    try {
      await updateAdminReport(reportId, {
        status: status as any,
        admin_notes: notes,
      });
      toast.success("Report updated!");
      onSuccess?.();
    } catch (err: any) {
      toast.error(err?.message || "Update failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
      <h2 className="text-lg font-bold text-gray-800 mb-4">Update Report</h2>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-400 outline-none"
          >
            <option value="pending">Pending</option>
            <option value="under_review">Under Review</option>
            <option value="resolved">Resolved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Admin Notes</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full border border-gray-200 rounded-xl p-3 text-sm min-h-[100px] focus:ring-2 focus:ring-indigo-400 outline-none"
            placeholder="Add internal notes..."
          />
        </div>
        <button
          onClick={handleSubmit}
          disabled={saving}
          className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl disabled:opacity-70 transition"
        >
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </div>
  );
}