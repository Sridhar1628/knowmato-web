
"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { useSelector } from "react-redux";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AlertService from "@/services/alertService";

export default function AdminLayoutContent({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const [sidebarOpen, setSidebarOpen] = useState(false);

  const sidebarCollapsed = useSelector(
    (state: any) => Boolean(state.ui?.sidebarCollapsed)
  );

  const contentOffset = sidebarCollapsed
    ? "lg:ml-16"
    : "lg:ml-72";

  // Close the mobile drawer when the route changes.
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  const handleNotifications = () => {
    AlertService.info("🔔", "No new notifications");
  };

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e]">
      {/* Background texture */}
      <div className="pointer-events-none absolute inset-0 bg-[url('/noise.png')] opacity-[0.02]" />

      {/* Sidebar */}
      <AdminSidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main content */}
      <div
        className={`relative z-10 flex min-h-screen min-w-0 flex-col transition-[margin] duration-300 ease-in-out ${contentOffset}`}
      >
        {/* Mobile / tablet header */}
        <header className="sticky top-0 z-30 border-b border-white/10 bg-white/5 shadow-lg backdrop-blur-xl lg:hidden">
          <div className="flex items-center justify-between px-4 py-3">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="rounded-xl bg-white/10 p-2 text-white/80 transition hover:bg-white/20 hover:text-white active:scale-95"
              aria-label="Open menu"
            >
              <svg
                className="h-6 w-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>

            <h1 className="text-lg font-bold text-transparent bg-gradient-to-r from-violet-300 to-fuchsia-300 bg-clip-text">
              KnowMato Admin
            </h1>

            <button
              type="button"
              onClick={handleNotifications}
              className="rounded-xl bg-white/10 p-2 text-white/80 transition hover:bg-white/20 hover:text-white active:scale-95"
              aria-label="Notifications"
            >
              🔔
            </button>
          </div>
        </header>

        {/* Desktop header */}
        <header className="sticky top-0 z-30 hidden h-16 items-center justify-end border-b border-white/10 bg-white/5 px-6 shadow-lg backdrop-blur-xl lg:flex">
          <button
            type="button"
            onClick={handleNotifications}
            className="rounded-xl bg-white/10 p-2 text-white/80 transition hover:bg-white/20 hover:text-white"
            aria-label="Notifications"
          >
            🔔
          </button>
        </header>

        {/* Page content */}
        <main className="min-w-0 flex-1 overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}
