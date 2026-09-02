"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import AdminLayout from "@/app/admin/AdminLayout";
import {
  getAdminUsers,
  adminToggleUserActive,
  adminDeleteUser,
} from "@/services/v1Service";
import AlertService from "@/services/alertService";
import EditUserModal from "./EditUserModal"; // we'll build next

// ---------- Types (same as before) ----------
interface User {
  id: number;
  email: string;
  display_name: string;
  role: string;
  is_active: boolean;
  date_joined: string;
}

export default function AdminUsersPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<User[]>([]);
  const [filterRole, setFilterRole] = useState<string>("");
  const [searchText, setSearchText] = useState("");
  const [editUser, setEditUser] = useState<User | null>(null);

  const fetchUsers = useCallback(async () => {
    try {
      const res = await getAdminUsers(filterRole || undefined);
      const data = Array.isArray(res) ? res : res.data || [];
      setUsers(data);
    } catch (error) {
      console.error(error);
      AlertService.error("Load Failed", "Failed to load users.");
    } finally {
      setLoading(false);
    }
  }, [filterRole]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Client-side search filter
  const filteredUsers = users.filter(
    (u) =>
      u.display_name?.toLowerCase().includes(searchText.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchText.toLowerCase())
  );

  // Suspend / Activate toggle
  const handleToggleActive = async (user: User) => {
    try {
      await adminToggleUserActive(user.id);
      AlertService.success(
        "User Status Updated",
        `User ${user.is_active ? "suspended" : "activated"}.`
      );
      fetchUsers();
    } catch (error) {
      console.error(error);
      AlertService.error(
        "Update Failed",
        "Failed to update user status."
      );
    }
  };

  // Delete user
  const handleDeleteUser = async (user: User) => {
    AlertService.confirm(
      "Delete User",
      `Permanently delete ${user.display_name}?`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await adminDeleteUser(user.id);
              AlertService.success("User Deleted", "User deleted.");
              fetchUsers();
            } catch (error) {
              console.error(error);
              AlertService.error(
                "Delete Failed",
                "Failed to delete user."
              );
            }
          },
        },
      ]
    );
  };

  // Refresh after edit modal closes
  const handleEditClose = () => {
    setEditUser(null);
    fetchUsers();
  };

  return (
    <AdminLayout>
      <div className="min-h-screen bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e] relative overflow-hidden">
        {/* Animated blobs */}
        <div className="absolute top-0 -left-20 w-72 h-72 bg-purple-500/20 rounded-full mix-blend-multiply filter blur-3xl animate-blob" />
        <div className="absolute top-0 -right-20 w-72 h-72 bg-fuchsia-500/20 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000" />
        <div className="absolute -bottom-20 left-40 w-72 h-72 bg-cyan-500/20 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000" />

        <div className="relative z-10 p-4 sm:p-6 lg:p-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col sm:flex-row sm:items-center justify-between mb-8"
          >
            <div>
              <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-violet-300 via-fuchsia-300 to-cyan-300">
                👥 Manage Users
              </h1>
              <p className="text-white/70 mt-1">
                View, edit, suspend, or delete user accounts.
              </p>
            </div>
            <button
              onClick={fetchUsers}
              disabled={loading}
              className="mt-4 sm:mt-0 flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md rounded-xl border border-white/20 text-violet-300 font-medium hover:bg-white/20 hover:text-white transition disabled:opacity-50"
            >
              <svg
                className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              Refresh
            </button>
          </motion.div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="flex-1 rounded-xl border-2 border-white/20 bg-gray-900/60 px-4 py-3 text-white placeholder-white/40 focus:border-violet-400 focus:ring-4 focus:ring-violet-500/50 outline-none transition"
            />
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="rounded-xl border-2 border-white/20 bg-gray-900/60 px-4 py-3 text-white placeholder-white/40 focus:border-violet-400 focus:ring-4 focus:ring-violet-500/50 outline-none transition appearance-none"
            >
              <option value="" className="bg-gray-800">
                All Roles
              </option>
              <option value="student" className="bg-gray-800">
                Student
              </option>
              <option value="tutor" className="bg-gray-800">
                Tutor
              </option>
              <option value="company" className="bg-gray-800">
                Company
              </option>
              <option value="admin" className="bg-gray-800">
                Admin
              </option>
            </select>
          </div>

          {/* Loading */}
          {loading && (
            <div className="flex justify-center py-20">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-violet-500 border-t-transparent" />
            </div>
          )}

          {/* Empty State */}
          {!loading && filteredUsers.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-20"
            >
              <p className="text-white/60 text-lg">No users found.</p>
            </motion.div>
          )}

          {/* Users Table */}
          {!loading && filteredUsers.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="overflow-x-auto rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl"
            >
              <table className="w-full text-left text-sm text-white/80">
                <thead className="bg-white/10">
                  <tr>
                    <th className="px-6 py-4 font-semibold">Name</th>
                    <th className="px-6 py-4 font-semibold hidden sm:table-cell">
                      Email
                    </th>
                    <th className="px-6 py-4 font-semibold">Role</th>
                    <th className="px-6 py-4 font-semibold hidden md:table-cell">
                      Status
                    </th>
                    <th className="px-6 py-4 font-semibold hidden lg:table-cell">
                      Joined
                    </th>
                    <th className="px-6 py-4 font-semibold text-right">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {filteredUsers.map((user) => (
                    <tr
                      key={user.id}
                      className="hover:bg-white/5 transition"
                    >
                      <td className="px-6 py-4 font-medium text-white">
                        {user.display_name || "—"}
                      </td>
                      <td className="px-6 py-4 hidden sm:table-cell text-white/70">
                        {user.email}
                      </td>
                      <td className="px-6 py-4">
                        <span className="rounded-full bg-violet-500/20 text-violet-300 border border-violet-400/30 px-3 py-0.5 text-xs font-semibold capitalize">
                          {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 hidden md:table-cell">
                        <span
                          className={`rounded-full px-3 py-0.5 text-xs font-semibold border ${
                            user.is_active
                              ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/50"
                              : "bg-red-500/20 text-red-300 border-red-500/50"
                          }`}
                        >
                          {user.is_active ? "Active" : "Suspended"}
                        </span>
                      </td>
                      <td className="px-6 py-4 hidden lg:table-cell text-white/50">
                        {new Date(user.date_joined).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() =>
                              router.push(`/admin/users/${user.id}`)
                            }
                            className="text-violet-400 hover:text-violet-300 font-medium text-xs uppercase tracking-wide"
                          >
                            View
                          </button>
                          <button
                            onClick={() => setEditUser(user)}
                            className="text-cyan-400 hover:text-cyan-300 font-medium text-xs uppercase tracking-wide"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleToggleActive(user)}
                            className={`font-medium text-xs uppercase tracking-wide ${
                              user.is_active
                                ? "text-yellow-400 hover:text-yellow-300"
                                : "text-emerald-400 hover:text-emerald-300"
                            }`}
                          >
                            {user.is_active ? "Suspend" : "Activate"}
                          </button>
                          <button
                            onClick={() => handleDeleteUser(user)}
                            className="text-red-400 hover:text-red-300 font-medium text-xs uppercase tracking-wide"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </motion.div>
          )}

          {/* Edit User Modal */}
          {editUser && (
            <EditUserModal
              user={editUser}
              onClose={handleEditClose}
            />
          )}
        </div>
      </div>
    </AdminLayout>
  );
}