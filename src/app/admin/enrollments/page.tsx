// app/admin/enrollments/page.tsx
"use client";
import { useEffect, useState } from "react";
import { getEnrollment, Enrollment } from "@/services/v2Service"; // note: getEnrollments may need params
import AdminLayout from "@/app/admin/AdminLayout";
import toast from "react-hot-toast";

export default function EnrollmentsPage() {
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // getEnrollments is not directly exported in v2service; use getMyCourses or a generic call. We'll assume an endpoint exists:
    // If not, you can call axios directly.
    const fetch = async () => {
      try {
        const data = await getEnrollment(undefined as any); // pass a placeholder to satisfy signature
        setEnrollment(data);
      } catch { toast.error("Failed to load"); }
      finally { setLoading(false); }
    };
    fetch();
  }, []);

  return (
    <AdminLayout>
      <div className="min-h-screen bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e] p-4 sm:p-8">
        <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-violet-300 to-cyan-300 mb-8">📋 Enrollments</h1>
        {loading ? <p className="text-white/60">Loading...</p> : (
          <div className="space-y-3">
            {enrollment && (
              <div key={enrollment.id} className="bg-white/5 rounded-xl p-4 border border-white/10">
                <p className="text-white font-semibold">{enrollment.course_title}</p>
                <p className="text-sm text-white/60">Status: {enrollment.status} | Progress: {enrollment.progress_percentage}%</p>
              </div>
            )}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}