
"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import { toggleSidebar } from "@/redux/slices/uiSlice";
import { logout } from "@/redux/slices/authSlice";
import { clearTokens } from "@/services/storageService";
import AlertService from "@/services/alertService";

interface TutorSidebarProps {
  open: boolean;
  onClose: () => void;
}

const menuItems = [
  { label: "Dashboard", href: "/tutor/dashboard", icon: "📚" },
  { label: "My Requests", href: "/tutor/requests", icon: "📩" },
  { label: "Available Pool Doubts", href: "/tutor/doubts", icon: "📬" },
  { label: "Wallet", href: "/tutor/wallet", icon: "💰" },
  { label: "My Earnings", href: "/tutor/earnings", icon: "💎" },
  { label: "Profile", href: "/tutor/profile", icon: "👤" },
  { label: "Settings", href: "/tutor/settings", icon: "⚙️" },
];

export default function TutorSidebar({
  open,
  onClose,
}: TutorSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const dispatch = useDispatch();

  const collapsed = useSelector(
    (state: any) => Boolean(state.ui?.sidebarCollapsed)
  );

  const handleLogout = () => {
    AlertService.confirm(
      "Confirm Logout",
      "Are you sure you want to logout?",
      async () => {
        try {
          await clearTokens();
          dispatch(logout());

          AlertService.success(
            "Success",
            "Logged out successfully"
          );

          router.push("/entry");
        } catch (error) {
          console.error("Logout failed:", error);

          AlertService.error(
            "Logout Failed",
            "Unable to logout. Please try again."
          );
        } finally {
          onClose();
        }
      },
      "Logout",
      "Cancel"
    );
  };

  return (
    <>
      {/* Mobile / tablet overlay */}
      {open && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-50
          flex flex-col
          border-r border-white/10
          bg-gradient-to-b from-[#1a1535] via-[#221d4a] to-[#0f0c29]
          text-white shadow-2xl backdrop-blur-xl
          transition-all duration-300 ease-in-out
          w-72
          ${collapsed ? "lg:w-16" : "lg:w-72"}
          ${open ? "translate-x-0" : "-translate-x-full"}
          lg:translate-x-0
        `}
      >
        {/* Brand */}
        <div
          className={`relative flex h-16 shrink-0 items-center border-b border-white/10 ${
            collapsed
              ? "justify-center px-2 lg:px-1"
              : "justify-between px-5"
          }`}
        >
          <Link
            href="/tutor/dashboard"
            onClick={onClose}
            className="flex min-w-0 items-center gap-3 overflow-hidden"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 shadow-lg shadow-violet-500/25">
              <span className="text-lg text-white">⚡</span>
            </div>

            <div
              className={`min-w-0 transition-all duration-200 ${
                collapsed
                  ? "lg:w-0 lg:opacity-0"
                  : "opacity-100"
              }`}
            >
              <h1 className="whitespace-nowrap bg-gradient-to-r from-violet-300 to-fuchsia-300 bg-clip-text text-lg font-bold text-transparent">
                Instant Skill
              </h1>

              <p className="whitespace-nowrap text-xs text-white/50">
                Tutor Dashboard
              </p>
            </div>
          </Link>

          {/* Desktop collapse toggle */}
          <button
            type="button"
            onClick={() => dispatch(toggleSidebar())}
            className="hidden h-7 w-7 shrink-0 items-center justify-center rounded-lg text-lg text-white/60 transition hover:bg-white/10 hover:text-white lg:flex"
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? "»" : "«"}
          </button>

          {/* Mobile close */}
          <button
            type="button"
            onClick={onClose}
            className="ml-2 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-white/60 transition hover:bg-white/10 hover:text-white lg:hidden"
            aria-label="Close sidebar"
          >
            ✕
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-2 overflow-y-auto px-3 py-6">
          {menuItems.map((item) => {
            const active =
              pathname === item.href ||
              pathname.startsWith(item.href + "/");

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                title={collapsed ? item.label : undefined}
                className={`
                  group flex w-full items-center gap-3
                  rounded-xl px-3 py-3
                  text-sm font-semibold
                  transition-all duration-200
                  ${
                    active
                      ? "border border-violet-400/30 bg-gradient-to-r from-violet-500/20 to-fuchsia-500/20 text-white shadow-lg shadow-violet-500/10"
                      : "text-white/70 hover:bg-white/10 hover:text-white"
                  }
                  ${collapsed ? "lg:justify-center lg:px-2" : ""}
                `}
              >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center text-lg">
                  {item.icon}
                </span>

                <span
                  className={`min-w-0 flex-1 truncate transition-all duration-200 ${
                    collapsed
                      ? "lg:hidden"
                      : ""
                  }`}
                >
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="shrink-0 space-y-4 border-t border-white/10 p-3">
          {!collapsed && (
            <div className="rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-md lg:block">
              <p className="text-sm font-semibold text-violet-300">
                🚀 Ready to teach?
              </p>

              <p className="mt-1 text-xs text-white/60">
                Stay online to receive realtime doubt requests instantly.
              </p>
            </div>
          )}

          <button
            type="button"
            onClick={handleLogout}
            title={collapsed ? "Sign Out" : undefined}
            className={`flex w-full items-center justify-center gap-2 rounded-xl border border-rose-400/30 bg-rose-500/10 px-3 py-3.5 font-bold text-rose-300 transition hover:border-rose-400/50 hover:bg-rose-500/20 ${
              collapsed ? "lg:px-2" : ""
            }`}
          >
            <span className="shrink-0">🚪</span>
            <span className={collapsed ? "lg:hidden" : ""}>
              Sign Out
            </span>
          </button>
        </div>
      </aside>
    </>
  );
}
