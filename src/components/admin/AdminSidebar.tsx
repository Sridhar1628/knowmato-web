"use client";

import { usePathname, useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import { motion, AnimatePresence } from "framer-motion";
import { RootState } from "@/redux/store";
import { logout } from "@/redux/slices/authSlice";
import { clearTokens } from "@/services/storageService";
import AlertService from "@/services/alertService";

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

  const displayName =
    user?.display_name || user?.email?.split("@")[0] || "Admin";
  const displayEmail = user?.email || "";

  const handleLogout = () => {
    AlertService.confirm(
      "Confirm Logout",
      "Are you sure you want to logout?",
      async () => {
        try {
          await clearTokens();
          dispatch(logout());
          onClose();
          router.push("/entry");
        } catch (error) {
          console.error("Logout error:", error);
          AlertService.error("Logout Failed", "Unable to logout. Please try again.");
        }
      },
      "Logout",
      "Cancel"
    );
  };

  const handleNavigate = (path: string) => {
    router.push(path);
    onClose();
  };

  const isActive = (path: string) =>
    path === "/admin" ? pathname === "/admin" : pathname.startsWith(path);

  return (
    <>
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

      <aside
        className={`fixed top-0 left-0 z-50 flex h-full w-72 flex-col transition-transform duration-300 ease-out lg:w-80 lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
        style={{
          background:
            "linear-gradient(180deg, rgba(15,12,41,0.98) 0%, rgba(48,43,99,0.98) 50%, rgba(36,36,62,0.98) 100%)",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          borderRight: "1px solid rgba(255,255,255,0.1)",
          boxShadow: "8px 0 32px rgba(0,0,0,0.3)",
        }}
      >
        <div className="flex justify-end p-3 lg:hidden">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-white/10 p-2 text-white/70 transition hover:bg-white/20 hover:text-white"
            aria-label="Close menu"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>

        <div className="border-b border-white/10 px-5 pb-5">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 text-2xl shadow-lg shadow-violet-500/25">
              👑
            </div>
            <div className="overflow-hidden">
              <p className="truncate font-bold text-white">{displayName}</p>
              <p className="truncate text-xs text-violet-200/60">{displayEmail}</p>
              <span className="mt-1 inline-block rounded-full border border-violet-400/30 bg-violet-500/20 px-2 py-0.5 text-xs font-bold text-violet-300">
                Admin
              </span>
            </div>
          </div>
        </div>

        <nav className="custom-scrollbar flex-1 space-y-1.5 overflow-y-auto px-3 py-4">
          {menuItems.map((item, index) => {
            const active = isActive(item.path);

            return (
              <motion.button
                key={item.path}
                type="button"
                whileHover={{
                  scale: 1.02,
                  backgroundColor: "rgba(255,255,255,0.08)",
                }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleNavigate(item.path)}
                className={`w-full rounded-xl border px-4 py-3.5 text-left font-medium transition-colors ${
                  active
                    ? "border-violet-400/40 bg-violet-500/20 text-white shadow-lg shadow-violet-500/10"
                    : "border-transparent text-white/70 hover:text-white"
                } flex items-center gap-3`}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.05 * index }}
              >
                <span className="text-xl">{item.icon}</span>
                <span className="truncate">{item.label}</span>
                {active && (
                  <span className="ml-auto h-5 w-1.5 rounded-full bg-violet-400" />
                )}
              </motion.button>
            );
          })}
        </nav>

        <div className="border-t border-white/10 p-4">
          <motion.button
            type="button"
            whileHover={{
              scale: 1.02,
              backgroundColor: "rgba(239,68,68,0.2)",
            }}
            whileTap={{ scale: 0.98 }}
            onClick={handleLogout}
            className="w-full rounded-xl border border-rose-400/30 bg-rose-500/10 px-4 py-3.5 font-bold text-rose-300 transition hover:border-rose-400/50"
          >
            🚪 Sign Out
          </motion.button>
        </div>
      </aside>
    </>
  );
}
