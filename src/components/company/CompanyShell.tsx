
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import { useAuth } from "@/hooks/useAuth";
import AlertService from "@/services/alertService";
import CompanySidebar from "./CompanySidebar";
import NotificationBell from "@/components/notifications/NotificationBell";

interface Props {
  children: React.ReactNode;
}

export default function CompanyShell({ children }: Props) {
  const user = useSelector((state: RootState) => state.auth.user);
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const { loading } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [loading, user, router]);

  const handleLogout = async () => {
    AlertService.confirm(
      "Log Out?",
      "You will be signed out of your company account.",
      () => {
        localStorage.removeItem("tokens");
        localStorage.removeItem("token");
        localStorage.removeItem("refreshToken");

        AlertService.success("Signed Out", "You have been logged out.");

        setTimeout(() => router.replace("/login"), 400);
      },
      "Cancel"
    );
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e] text-white">
        <div className="text-sm text-white/70">
          Loading company account...
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e] text-white">
      <div className="flex min-h-screen">
        <CompanySidebar
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          onLogout={handleLogout}
        />

        <div className="flex min-w-0 flex-1 flex-col">
          {/* Mobile header */}
          <header className="sticky top-0 z-20 flex items-center justify-between gap-3 border-b border-white/10 bg-[#0b0920]/70 px-4 py-3 backdrop-blur-xl md:hidden">
            <div className="flex min-w-0 items-center gap-3">
              <button
                type="button"
                onClick={() => setSidebarOpen(true)}
                aria-label="Open sidebar"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white/80 transition hover:bg-white/10"
              >
                ☰
              </button>

              <span className="truncate text-sm font-semibold text-white/80">
                Company Panel
              </span>
            </div>

            <NotificationBell />
          </header>

          {/* Desktop header */}
          <header className="sticky top-0 z-20 hidden items-center justify-end border-b border-white/10 bg-[#0b0920]/70 px-6 py-3 backdrop-blur-xl md:flex lg:px-8">
            <NotificationBell />
          </header>

          <main className="relative flex-1 overflow-x-hidden p-4 sm:p-6 lg:p-8">
            <div className="pointer-events-none absolute -left-32 top-0 h-72 w-72 rounded-full bg-purple-500/10 blur-3xl" />
            <div className="pointer-events-none absolute -right-32 top-20 h-72 w-72 rounded-full bg-fuchsia-500/10 blur-3xl" />
            <div className="pointer-events-none absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-cyan-500/10 blur-3xl" />

            <div className="relative z-10 mx-auto max-w-7xl">
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
