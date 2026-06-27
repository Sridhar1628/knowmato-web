'use client';

import { useRouter, usePathname } from 'next/navigation';

interface NavItemProps {
  icon: string;
  label: string;
  href: string;
  active?: boolean;
  onClick?: () => void;
}

function NavItem({ icon, label, href, active, onClick }: NavItemProps) {
  const router = useRouter();
  return (
    <button
      onClick={() => {
        router.push(href);
        onClick?.();
      }}
      className={`group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all duration-300 ${
        active
          ? 'bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white shadow-lg shadow-violet-500/25'
          : 'text-white/70 hover:bg-white/10 hover:text-white hover:shadow-md'
      }`}
    >
      <span className="text-lg">{icon}</span>
      {label}
    </button>
  );
}

interface DashboardSidebarProps {
  open: boolean;
  onClose: () => void;
}

export default function DashboardSidebar({ open, onClose }: DashboardSidebarProps) {
  const pathname = usePathname();
  const routes = [
    { icon: '🏠', label: 'Home', href: '/student/dashboard' },
    { icon: '❓', label: 'Ask Doubt', href: '/student/post-doubt' },
    { icon: '📋', label: 'My Doubts', href: '/student/my-doubts' },
    { icon: '📰', label: 'Current Affairs', href: '/student/current-affairs' },
    { icon: '💰', label: 'My Wallet', href: '/student/wallet' },
    { icon: '🏆', label: 'Leaderboard', href: '/student/leaderboard' },
    { icon: '⚙️', label: 'Settings', href: '#' },
  ];

  return (
    <>
      {/* Backdrop for mobile – closes when clicked */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar panel */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-50
          flex w-72 flex-col
          bg-[#0f0c29]/90 backdrop-blur-xl
          border-r border-white/10
          text-white
          transition-transform duration-300 ease-in-out

          ${open ? 'translate-x-0' : '-translate-x-full'}

          md:relative
          md:translate-x-0
          md:shrink-0
          md:min-h-screen
          lg:fixed
          lg:left-0
          lg:top-0
          lg:h-screen
        `}
      >
        {/* Brand & close button (mobile) */}
        <div className="flex h-16 items-center justify-between border-b border-white/10 px-4">
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-violet-300 to-fuchsia-300">
              Instant Skill
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-white/50 hover:text-white md:hidden transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 overflow-y-auto p-4">
          {routes.map((route) => (
            <NavItem
              key={route.label}
              icon={route.icon}
              label={route.label}
              href={route.href}
              active={pathname === route.href}
              onClick={onClose}
            />
          ))}
        </nav>

        {/* Upgrade to Pro – you can uncomment and style later */}
        {/*
        <div className="border-t border-white/10 p-4">
          <div className="rounded-xl bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 p-4 text-center border border-white/10 backdrop-blur-md">
            <div className="mb-2 text-2xl">👑</div>
            <h4 className="font-semibold text-white">Upgrade to Pro</h4>
            <p className="mt-1 text-[10px] text-white/70">
              Get priority support, <br /> unlimited chats & more.
            </p>
            <button className="mt-3 w-full rounded-lg bg-gradient-to-r from-violet-500 to-fuchsia-500 py-1.5 text-xs font-bold text-white hover:shadow-lg">
              Upgrade Now
            </button>
          </div>
        </div>
        */}
      </aside>
    </>
  );
}