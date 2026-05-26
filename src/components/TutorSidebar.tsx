'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface TutorSidebarProps {
  open: boolean;
  onClose: () => void;
}

const menuItems = [
  {
    label: 'Dashboard',
    href: '/tutor/dashboard',
    icon: '📚',
  },
  {
    label: 'Requests',
    href: '/tutor/requests',
    icon: '📩',
  },
  {
    label: 'Available Pool Doubts',
    href: '/tutor/doubts',
    icon: '📬',
  },
  {
    label: 'Sessions',
    href: '/tutor/sessions',
    icon: '🎥',
  },
  {
    label: 'Wallet',
    href: '/tutor/wallet',
    icon: '💰',
  },
  {
    label: 'Profile',
    href: '/profile',
    icon: '👤',
  },
];

export default function TutorSidebar({
  open,
  onClose,
}: TutorSidebarProps) {

  const pathname = usePathname();

  return (
    <>
      {/* MOBILE OVERLAY */}
      <div
        onClick={onClose}
        className={`fixed inset-0 z-40 bg-black/40 transition-opacity duration-300 md:hidden ${
          open
            ? 'opacity-100 visible'
            : 'opacity-0 invisible'
        }`}
      />

      {/* SIDEBAR */}
      <aside
        className={`fixed left-0 top-0 z-50 flex h-screen w-72 flex-col border-r border-gray-200 bg-white shadow-xl transition-transform duration-300 md:translate-x-0 md:shadow-none ${
          open
            ? 'translate-x-0'
            : '-translate-x-full'
        }`}
      >
        {/* LOGO */}
        <div className="flex h-16 items-center border-b border-gray-200 px-6">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-indigo-600 p-2">
              <span className="text-lg text-white">
                ⚡
              </span>
            </div>

            <div>
              <h1 className="text-lg font-bold text-gray-900">
                Instant Skill
              </h1>

              <p className="text-xs text-gray-500">
                Tutor Dashboard
              </p>
            </div>
          </div>
        </div>

        {/* NAVIGATION */}
        <nav className="flex-1 overflow-y-auto px-4 py-6">
          <div className="space-y-2">

            {menuItems.map(item => {

              const active =
                pathname === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onClose}
                  className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition-all duration-200 ${
                    active
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <span className="text-lg">
                    {item.icon}
                  </span>

                  <span>
                    {item.label}
                  </span>
                </Link>
              );
            })}

          </div>
        </nav>

        {/* FOOTER */}
        <div className="border-t border-gray-200 p-4">
          <div className="rounded-2xl bg-indigo-50 p-4">

            <p className="text-sm font-semibold text-indigo-900">
              🚀 Ready to teach?
            </p>

            <p className="mt-1 text-xs text-indigo-700">
              Stay online to receive realtime doubt requests instantly.
            </p>

          </div>
        </div>
      </aside>
    </>
  );
}