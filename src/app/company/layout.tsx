"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";

export default function CompanyLayout({ children }: { children: React.ReactNode }) {
  const user = useSelector((state: RootState) => state.auth.user);
  const router = useRouter();
  const pathname = usePathname();

  // If user isn't logged in or has no company, redirect
  useEffect(() => {
    if (!user) router.push("/login");
  }, [user, router]);

  const navItems = [
    { name: "Dashboard", href: "/company/dashboard", icon: "📊" },
    { name: "Jobs", href: "/company/jobs", icon: "💼" },
    { name: "Internships", href: "/company/internships", icon: "🎓" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e]">
      <div className="flex h-screen">
        {/* Sidebar */}
        <aside className="w-64 bg-black/20 backdrop-blur-xl border-r border-white/10 p-6 flex flex-col">
          <div className="flex items-center gap-2 mb-10">
            <span className="text-2xl">🏢</span>
            <span className="text-xl font-bold text-white/90">Company</span>
          </div>
          <nav className="space-y-2 flex-1">
            {navItems.map(item => (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition ${
                  pathname.startsWith(item.href)
                    ? "bg-violet-600/30 text-violet-200 border border-violet-400/20"
                    : "text-white/60 hover:bg-white/5 hover:text-white"
                }`}
              >
                <span>{item.icon}</span>
                {item.name}
              </Link>
            ))}
          </nav>
          <div className="text-xs text-white/40">
            Logged in as {user?.display_name || user?.email}
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>
    </div>
  );
}