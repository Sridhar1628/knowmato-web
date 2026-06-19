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
        onClick?.(); // close mobile sidebar
      }}
      className={`group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
        active
          ? 'bg-indigo-600 text-white'
          : 'text-gray-300 hover:bg-white/5 hover:text-white'
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
    { icon: '🏆', label: 'Leaderboard', href: '#' },
    { icon: '⚙️', label: 'Settings', href: '#' },
  ];

  return (
    <>
      {/* Backdrop for mobile – closes when clicked */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar panel */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-50
          flex w-72 flex-col
          bg-[#0f0f23] text-white
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
        <div className="flex h-16 items-center justify-between border-b border-gray-700/50 px-4">
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-indigo-600 p-1">
              <span className="text-lg">⚡</span>
            </div>
            <span className="text-xl font-bold tracking-tight">Instant Skill</span>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white md:hidden">
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
              onClick={onClose} // close on mobile after navigating
            />
          ))}
        </nav>

        {/* Upgrade to Pro 
        <div className="border-t border-gray-700/50 p-4">
          <div className="rounded-xl bg-gradient-to-br from-indigo-900 to-purple-900 p-4 text-center">
            <div className="mb-2 text-2xl">👑</div>
            <h4 className="font-semibold">Upgrade to Pro</h4>
            <p className="mt-1 text-[10px] text-gray-300">
              Get priority support, <br /> unlimited chats & more.
            </p>
            <button className="mt-3 w-full rounded-lg bg-indigo-600 py-1.5 text-xs font-bold hover:bg-indigo-500">
              Upgrade Now
            </button>
          </div>
        </div>
        */}
      </aside>
    </>
  );
}