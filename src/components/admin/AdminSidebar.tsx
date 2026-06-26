"use client";

import { useRouter, usePathname } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import { motion, AnimatePresence } from "framer-motion";
import { RootState } from "@/redux/store";
import { logout } from "@/redux/slices/authSlice";
import { clearTokens } from "@/services/storageService";
import toast from "react-hot-toast";

interface AdminSidebarProps {
  open: boolean;
  onClose: () => void;
}

const menuItems = [
  { label: "Dashboard", icon: "📊", path: "/admin/dashboard" },
  { label: "Doubts", icon: "📋", path: "/admin/doubts" },
  { label: "Sessions", icon: "📅", path: "/admin/sessions" },
  { label: "Reports", icon: "📈", path: "/admin/reports" },
  { label: "Pricing", icon: "💲", path: "/admin/pricing" },
  { label: "Tutor Earnings", icon: "💰", path: "/admin/tutor-earnings" },
  { label: "Manage Users", icon: "👥", path: "/admin/users" },
  { label: "Current Affairs", icon: "📰", path: "/admin/current-affairs" },
  { label: "Tutor Applications", icon: "📝", path: "/admin/tutor-applications" },
];

export default function AdminSidebar({ open, onClose }: AdminSidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const dispatch = useDispatch();
  const user = useSelector((state: RootState) => state.auth.user);

  const displayName = user?.display_name || user?.email?.split("@")[0] || "Admin";
  const displayEmail = user?.email || "";

  const handleLogout = async () => {
    try {
      await clearTokens();
      dispatch(logout());
      router.push("/entry");
    } catch {
      toast.error("Logout failed");
    }
    onClose();
  };

  const handleNavigate = (path: string) => {
    router.push(path);
    onClose();
  };

  // Helper: check if current path matches item path (exact or sub‑route)
  const isActive = (path: string) => {
    if (path === "/admin") return pathname === "/admin";
    return pathname.startsWith(path);
  };

  return (
    <>
      {/* Mobile overlay */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
            onClick={onClose}
          />
        )}
      </AnimatePresence>

      {/* Sidebar panel */}
      <aside
        className={`fixed top-0 left-0 z-50 h-full w-72 lg:w-80 flex flex-col transition-transform duration-300 ease-out lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
        style={{
          background: "linear-gradient(180deg, rgba(15,12,41,0.98) 0%, rgba(48,43,99,0.98) 50%, rgba(36,36,62,0.98) 100%)",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          borderRight: "1px solid rgba(255,255,255,0.1)",
          boxShadow: "8px 0 32px rgba(0,0,0,0.3)",
        }}
      >
        {/* Mobile close button */}
        <div className="flex justify-end p-3 lg:hidden">
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/10 text-white/70 hover:bg-white/20 hover:text-white transition"
            aria-label="Close menu"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>

        {/* Header */}
        <div className="px-5 pb-5 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-2xl shadow-lg shadow-violet-500/25">
              👑
            </div>
            <div className="overflow-hidden">
              <p className="font-bold text-white truncate">{displayName}</p>
              <p className="text-xs text-violet-200/60 truncate">{displayEmail}</p>
              <span className="inline-block mt-1 text-xs font-bold bg-violet-500/20 text-violet-300 px-2 py-0.5 rounded-full border border-violet-400/30">
                Admin
              </span>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1.5 custom-scrollbar">
          {menuItems.map((item, index) => {
            const active = isActive(item.path);
            return (
              <motion.button
                key={item.path}
                whileHover={{ scale: 1.02, backgroundColor: "rgba(255,255,255,0.08)" }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleNavigate(item.path)}
                className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl font-medium text-left transition-colors ${
                  active
                    ? "bg-violet-500/20 text-white border border-violet-400/40 shadow-lg shadow-violet-500/10"
                    : "text-white/70 hover:text-white border border-transparent"
                }`}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.05 * index }}
              >
                <span className="text-xl">{item.icon}</span>
                <span className="truncate">{item.label}</span>
                {active && (
                  <span className="ml-auto w-1.5 h-5 bg-violet-400 rounded-full" />
                )}
              </motion.button>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-white/10">
          <motion.button
            whileHover={{ scale: 1.02, backgroundColor: "rgba(239,68,68,0.2)" }}
            whileTap={{ scale: 0.98 }}
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl bg-rose-500/10 text-rose-300 font-bold border border-rose-400/30 hover:border-rose-400/50 transition"
          >
            🚪 Sign Out
          </motion.button>
        </div>
      </aside>
    </>
  );
}