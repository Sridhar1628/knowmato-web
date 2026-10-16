"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";

export type CompanyNavItem = {
  name: string;
  href: string;
  icon: string;
  /** Optional: only show to certain roles */
  roles?: string[];
};

export const COMPANY_NAV_ITEMS: CompanyNavItem[] = [
  { name: "Dashboard", href: "/company/dashboard", icon: "📊" },
  { name: "Jobs", href: "/company/jobs", icon: "💼" },
  { name: "Internships", href: "/company/internships", icon: "🎓" },
  { name: "Applications", href: "/company/applications", icon: "📨" },
  { name: "Company Profile", href: "/company/profile", icon: "🏢" },
  { name: "Settings", href: "/company/settings", icon: "⚙️" },
];

interface Props {
  open: boolean;
  onClose: () => void;
  onLogout: () => void;
}

function getInitials(name?: string, email?: string) {
  const source = name || email || "?";
  const parts = source.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

export default function CompanySidebar({ open, onClose, onLogout }: Props) {
  const pathname = usePathname();
  const user = useSelector((state: RootState) => state.auth.user);

  const displayName = user?.display_name || user?.email || "User";
  const companyName = (user as any)?.company_name || "Company";
  const initials = getInitials(user?.display_name, user?.email);

  return (
    <>
      {/* Mobile backdrop */}
      <div
        onClick={onClose}
        className={`fixed inset-0 z-30 bg-black/50 backdrop-blur-sm transition-opacity md:hidden ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />

      {/* Sidebar */}
      <div
        role="complementary"
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-white/10 bg-[#0b0920]/90 backdrop-blur-2xl transition-transform duration-300 ease-out md:static md:z-auto md:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Ambient glow */}
        <div className="pointer-events-none absolute -left-16 top-20 h-56 w-56 rounded-full bg-violet-500/10 blur-3xl" />
        <div className="pointer-events-none absolute -left-10 bottom-10 h-56 w-56 rounded-full bg-cyan-500/10 blur-3xl" />

        {/* Brand */}
        <div className="relative flex items-center justify-between px-6 pt-6">
          <Link
            href="/company/dashboard"
            onClick={onClose}
            className="flex items-center gap-2.5"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 via-fuchsia-500 to-cyan-500 text-lg shadow-lg shadow-violet-500/20">
              🏢
            </span>
            <span className="bg-gradient-to-r from-violet-200 via-fuchsia-200 to-cyan-200 bg-clip-text text-lg font-extrabold text-transparent">
              {companyName}
            </span>
          </Link>

          {/* Mobile close */}
          <button
            onClick={onClose}
            aria-label="Close sidebar"
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-white/60 transition hover:bg-white/10 hover:text-white md:hidden"
          >
            ✕
          </button>
        </div>

        {/* Nav */}
        <nav className="relative mt-8 flex-1 space-y-1.5 overflow-y-auto px-4">
          {COMPANY_NAV_ITEMS.map((item) => {
            const isActive =
              pathname === item.href ||
              pathname.startsWith(item.href + "/");

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={`group flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? "border border-violet-400/20 bg-gradient-to-r from-violet-500/20 via-fuchsia-500/10 to-transparent text-violet-100 shadow-lg shadow-violet-500/5"
                    : "text-white/60 hover:bg-white/5 hover:text-white"
                }`}
              >
                <span
                  className={`flex h-7 w-7 items-center justify-center rounded-lg text-base transition ${
                    isActive
                      ? "bg-violet-500/20"
                      : "bg-white/5 group-hover:bg-white/10"
                  }`}
                >
                  {item.icon}
                </span>
                <span className="truncate">{item.name}</span>

                {isActive && (
                  <span className="ml-auto h-1.5 w-1.5 rounded-full bg-violet-300 shadow-[0_0_8px_rgba(196,181,253,0.8)]" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* User footer */}
        <div className="relative border-t border-white/10 p-4">
          <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-3 backdrop-blur-xl">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 via-fuchsia-500 to-cyan-500 text-xs font-bold text-white">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-white">
                {displayName}
              </p>
              <p className="truncate text-xs text-white/50">
                {user?.email || "Signed in"}
              </p>
            </div>
          </div>

          <button
            onClick={onLogout}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-red-400/20 bg-red-500/10 px-3 py-2.5 text-sm font-semibold text-red-300 transition hover:bg-red-500/20 hover:text-red-200"
          >
            <span>↩</span>
            Logout
          </button>
        </div>
      </div>
    </>
  );
}