// components/tutor/TutorSidebar.tsx
"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useDispatch } from "react-redux";
import { logout } from "@/redux/slices/authSlice";
import { clearTokens } from "@/services/storageService";
import AlertService from "@/services/alertService";

interface TutorSidebarProps {
  open: boolean;
  onClose: () => void;
}

const menuItems = [
  {
    label: "Dashboard",
    href: "/tutor/dashboard",
    icon: "📚",
  },
  {
    label: "My Requests",
    href: "/tutor/requests",
    icon: "📩",
  },
  {
    label: "Available Pool Doubts",
    href: "/tutor/doubts",
    icon: "📬",
  },
  {
    label: "Wallet",
    href: "/tutor/wallet",
    icon: "💰",
  },
  {
    label: "My Earnings",
    href: "/tutor/earnings",
    icon: "💎",
  },
  {
    label: "Profile",
    href: "/tutor/profile",
    icon: "👤",
  },
  {
    label: "Settings",
    href: "/tutor/settings",
    icon: "⚙️",
  },
];

export default function TutorSidebar({
  open,
  onClose,
}: TutorSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const dispatch = useDispatch();

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
      {/* MOBILE OVERLAY */}
      <div
        onClick={onClose}
        className={`fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity duration-300 md:hidden ${
          open
            ? "visible opacity-100"
            : "invisible opacity-0"
        }`}
      />

      {/* SIDEBAR */}
      <aside
        className={`fixed left-0 top-0 z-50 flex h-screen w-72 flex-col border-r border-white/10 bg-gradient-to-b from-[#1a1535] via-[#221d4a] to-[#0f0c29] shadow-2xl backdrop-blur-xl transition-transform duration-300 md:translate-x-0 ${
          open
            ? "translate-x-0"
            : "-translate-x-full"
        }`}
      >
        {/* LOGO / BRAND */}
        <div className="flex h-16 items-center border-b border-white/10 px-6">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 p-2 shadow-lg shadow-violet-500/25">
              <span className="text-lg text-white">
                ⚡
              </span>
            </div>

            <div>
              <h1 className="bg-gradient-to-r from-violet-300 to-fuchsia-300 bg-clip-text text-lg font-bold text-transparent">
                Instant Skill
              </h1>

              <p className="text-xs text-white/50">
                Tutor Dashboard
              </p>
            </div>
          </div>
        </div>

        {/* NAVIGATION */}
        <nav className="flex-1 overflow-y-auto px-4 py-6">
          <div className="space-y-2">
            {menuItems.map((item) => {
              const active = pathname === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onClose}
                  className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition-all duration-200 ${
                    active
                      ? "border border-violet-400/30 bg-gradient-to-r from-violet-500/20 to-fuchsia-500/20 text-white shadow-lg shadow-violet-500/10"
                      : "text-white/70 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <span className="text-lg">
                    {item.icon}
                  </span>

                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        </nav>

        {/* FOOTER */}
        <div className="space-y-4 border-t border-white/10 p-4">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-md">
            <p className="text-sm font-semibold text-violet-300">
              🚀 Ready to teach?
            </p>

            <p className="mt-1 text-xs text-white/60">
              Stay online to receive realtime doubt
              requests instantly.
            </p>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-rose-400/30 bg-rose-500/10 px-4 py-3.5 font-bold text-rose-300 transition hover:border-rose-400/50 hover:bg-rose-500/20"
          >
            🚪 Sign Out
          </button>
        </div>
      </aside>
    </>
  );
}