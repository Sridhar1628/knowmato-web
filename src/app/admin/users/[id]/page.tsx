// app/admin/users/[id]/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import AdminLayout from "@/app/admin/AdminLayout";
import { getAdminUserDetail } from "@/services/v1Service";
import AlertService from "@/services/alertService";

// ---------- Types ----------
interface UserDetail {
  id: number;
  email: string;
  display_name: string;
  role: string;
  phone?: string;
  is_active: boolean;
  date_joined: string;
  // additional fields can be added here
}

type AdminUserDetailResponse = UserDetail | { data: UserDetail };

export default function AdminUserDetailPage() {
  const params = useParams();
  const router = useRouter();
  const userId = Number(params.id);

  const [user, setUser] = useState<UserDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    const fetchUser = async () => {
      try {
        const res = await getAdminUserDetail(userId) as AdminUserDetailResponse;
        // Handle response shape (may be { data: {...} } or the object directly)
        setUser("data" in res ? res.data : res);
      } catch (error) {
        console.error(error);
        AlertService.error("Load Failed", "Failed to load user details.");
        router.push("/admin/users");
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [userId, router]);

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e]">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-violet-500 border-t-transparent" />
        </div>
      </AdminLayout>
    );
  }

  if (!user) return null; // will redirect on error

  return (
    <AdminLayout>
      <div className="min-h-screen bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e] relative overflow-hidden">
        {/* Animated blobs */}
        <div className="absolute top-0 -left-20 w-72 h-72 bg-purple-500/20 rounded-full mix-blend-multiply filter blur-3xl animate-blob" />
        <div className="absolute top-0 -right-20 w-72 h-72 bg-fuchsia-500/20 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000" />
        <div className="absolute -bottom-20 left-40 w-72 h-72 bg-cyan-500/20 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000" />

        <div className="relative z-10 p-4 sm:p-6 lg:p-8 max-w-3xl mx-auto">
          {/* Back button */}
          <button
            onClick={() => router.push("/admin/users")}
            className="mb-6 flex items-center gap-2 text-white/60 hover:text-white transition"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to users
          </button>

          {/* User Info Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 p-6 sm:p-8 shadow-2xl mb-6"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-violet-300 via-fuchsia-300 to-cyan-300">
                  {user.display_name || "User Details"}
                </h1>
                <p className="text-white/60 mt-1">User ID: #{user.id}</p>
              </div>
              <span
                className={`self-start rounded-full px-4 py-1 text-sm font-semibold border ${
                  user.is_active
                    ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/50"
                    : "bg-red-500/20 text-red-300 border-red-500/50"
                }`}
              >
                {user.is_active ? "Active" : "Inactive"}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <InfoField label="Full Name" value={user.display_name || "—"} />
              <InfoField label="Email" value={user.email} />
              <InfoField label="Phone" value={user.phone || "—"} />
              <InfoField label="Role" value={user.role} className="capitalize" />
              <InfoField
                label="Joined"
                value={new Date(user.date_joined).toLocaleDateString("en-IN", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              />
              <InfoField label="Status" value={user.is_active ? "Active" : "Inactive"} />
            </div>

            {/* Placeholder for future actions */}
            <div className="mt-8 pt-6 border-t border-white/10">
              <p className="text-white/50 text-sm italic">
                Additional actions (e.g., edit, suspend) can be added here when backend support is ready.
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </AdminLayout>
  );
}

// ---------- Reusable Info Field ----------
function InfoField({
  label,
  value,
  className,
}: {
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-white/50 mb-1">{label}</label>
      <p className={`text-white/90 font-medium ${className || ""}`}>{value}</p>
    </div>
  );
}