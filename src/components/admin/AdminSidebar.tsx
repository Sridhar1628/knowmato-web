
"use client";

import { usePathname, useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import { motion, AnimatePresence } from "framer-motion";
import { RootState } from "@/redux/store";
import { toggleSidebar } from "@/redux/slices/uiSlice";
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

export default function AdminSidebar({
  open,
  onClose,
}: AdminSidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const dispatch = useDispatch();

  const user = useSelector(
    (state: RootState) => state.auth.user
  );

  const collapsed = useSelector(
    (state: any) => Boolean(state.ui?.sidebarCollapsed)
  );

  const displayName =
    user?.display_name ||
    user?.email?.split("@")[0] ||
    "Admin";

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

          AlertService.error(
            "Logout Failed",
            "Unable to logout. Please try again."
          );
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
    pathname === path ||
    pathname.startsWith(path + "/");

  return (
    <>
      {/* Mobile / tablet overlay */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="admin-sidebar-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
            onClick={onClose}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-50
          flex flex-col
          transition-all duration-300 ease-in-out
          w-72
          ${collapsed ? "lg:w-16" : "lg:w-72"}
          ${open ? "translate-x-0" : "-translate-x-full"}
          lg:translate-x-0
        `}
        style={{
          background:
            "linear-gradient(180deg, rgba(15,12,41,0.98) 0%, rgba(48,43,99,0.98) 50%, rgba(36,36,62,0.98) 100%)",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          borderRight: "1px solid rgba(255,255,255,0.1)",
          boxShadow: "8px 0 32px rgba(0,0,0,0.3)",
        }}
      >
        {/* Mobile close */}
        <div className="flex shrink-0 justify-end p-3 lg:hidden">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-white/10 p-2 text-white/70 transition hover:bg-white/20 hover:text-white"
            aria-label="Close menu"
          >
            ✕
          </button>
        </div>

        {/* Brand / Admin profile */}
        <div
          className={`border-b border-white/10 py-5 ${
            collapsed
              ? "px-2 lg:px-1"
              : "px-5"
          }`}
        >
          <div
            className={`flex items-center gap-3 ${
              collapsed ? "lg:justify-center" : ""
            }`}
          >
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 text-2xl shadow-lg shadow-violet-500/25">
              👑
            </div>

            <div
              className={`min-w-0 overflow-hidden ${
                collapsed ? "lg:hidden" : ""
              }`}
            >
              <p className="truncate font-bold text-white">
                {displayName}
              </p>

              <p className="truncate text-xs text-violet-200/60">
                {displayEmail}
              </p>

              <span className="mt-1 inline-block rounded-full border border-violet-400/30 bg-violet-500/20 px-2 py-0.5 text-xs font-bold text-violet-300">
                Admin
              </span>
            </div>
          </div>

          {/* Collapse toggle */}
          <div
            className={`mt-4 hidden lg:flex ${
              collapsed ? "justify-center" : "justify-end"
            }`}
          >
            <button
              type="button"
              onClick={() => dispatch(toggleSidebar())}
              className="flex h-7 w-7 items-center justify-center rounded-lg text-lg text-white/60 transition hover:bg-white/10 hover:text-white"
              title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {collapsed ? "»" : "«"}
            </button>
          </div>
        </div>

        {/* Navigation */}
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
                title={collapsed ? item.label : undefined}
                className={`
                  flex w-full items-center gap-3
                  rounded-xl border px-3 py-3.5
                  text-left font-medium transition-colors
                  ${
                    active
                      ? "border-violet-400/40 bg-violet-500/20 text-white shadow-lg shadow-violet-500/10"
                      : "border-transparent text-white/70 hover:text-white"
                  }
                  ${collapsed ? "lg:justify-center lg:px-2" : ""}
                `}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.05 * index }}
              >
                <span className="shrink-0 text-xl">
                  {item.icon}
                </span>

                <span
                  className={`min-w-0 flex-1 truncate ${
                    collapsed ? "lg:hidden" : ""
                  }`}
                >
                  {item.label}
                </span>

                {active && !collapsed && (
                  <span className="ml-auto h-5 w-1.5 shrink-0 rounded-full bg-violet-400 lg:hidden" />
                )}

                {active && collapsed && (
                  <span className="ml-auto hidden h-1.5 w-1.5 rounded-full bg-violet-400 lg:block" />
                )}
              </motion.button>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="shrink-0 border-t border-white/10 p-3">
          <motion.button
            type="button"
            whileHover={{
              scale: 1.02,
              backgroundColor: "rgba(239,68,68,0.2)",
            }}
            whileTap={{ scale: 0.98 }}
            onClick={handleLogout}
            title={collapsed ? "Sign Out" : undefined}
            className={`flex w-full items-center justify-center gap-2 rounded-xl border border-rose-400/30 bg-rose-500/10 px-3 py-3.5 font-bold text-rose-300 transition hover:border-rose-400/50 ${
              collapsed ? "lg:px-2" : ""
            }`}
          >
            <span className="shrink-0">🚪</span>
            <span className={collapsed ? "lg:hidden" : ""}>
              Sign Out
            </span>
          </motion.button>
        </div>
      </aside>
    </>
  );
}
