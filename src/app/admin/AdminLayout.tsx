"use client";

import { useState, useEffect } from "react";
import AdminSidebar from "@/components/admin/AdminSidebar";
import toast from "react-hot-toast";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Close sidebar on route change (optional, but keeps mobile UX clean)
  useEffect(() => {
    setSidebarOpen(false);
  }, [children]);

  return (
    <div className="min-h-screen relative bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e]">
      {/* Subtle background texture (optional, invisible but adds depth) */}
      <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.02] pointer-events-none" />

      {/* Sidebar */}
      <AdminSidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main content area */}
      <div className="lg:ml-80 transition-all duration-300 ease-in-out min-h-screen flex flex-col">
        {/* Mobile top bar – glass effect */}
        <header className="sticky top-0 z-30 lg:hidden backdrop-blur-xl bg-white/5 border-b border-white/10 shadow-lg">
          <div className="flex items-center justify-between px-4 py-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 rounded-xl bg-white/10 text-white/80 hover:bg-white/20 hover:text-white transition active:scale-95"
              aria-label="Open menu"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            <h1 className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-violet-300 to-fuchsia-300">
              KnowMato Admin
            </h1>

            <button
              onClick={() => toast("No new notifications", { icon: "🔔" })}
              className="p-2 rounded-xl bg-white/10 text-white/80 hover:bg-white/20 hover:text-white transition active:scale-95"
              aria-label="Notifications"
            >
              🔔
            </button>
          </div>
        </header>

        {/* Page content – each page provides its own styling */}
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}