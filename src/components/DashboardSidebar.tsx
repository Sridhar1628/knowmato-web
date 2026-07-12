'use client';

import { useRouter } from 'next/navigation';
import { useDispatch } from 'react-redux';
import { logout } from '@/redux/slices/authSlice';
import { clearTokens } from '@/services/storageService';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

interface NavItemProps {
  icon: string;
  label: string;
  href: string;
  active?: boolean;
  isNew?: boolean;
  onClick?: () => void;
}

function NavItem({ icon, label, href, active, isNew, onClick }: NavItemProps) {
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
      {isNew && (
        <span className="ml-auto rounded-full bg-gradient-to-r from-rose-500 to-pink-500 px-2 py-0.5 text-[10px] font-bold text-white shadow">
          NEW
        </span>
      )}
    </button>
  );
}

interface DashboardSidebarProps {
  open: boolean;
  onClose: () => void;
  pathname: string; // required to detect Knowmato+ routes
}

interface SidebarRoute {
  icon: string;
  label: string;
  href: string;
  isNew?: boolean;
}

export default function DashboardSidebar({ open, onClose, pathname }: DashboardSidebarProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const dispatch = useDispatch();

  // Detect if we're in Knowmato+ section
  const isKnowmatoPlus = pathname?.startsWith('/student/knowmato-plus');

  // ---- Student routes ----
  const studentRoutes: SidebarRoute[] = [
    { icon: '🏠', label: t('sidebar.home') || 'Home', href: '/student/dashboard' },
    { icon: '🏠', label: t('sidebar.credits') || 'Credits', href: '/student/credits' },
    { icon: '❓', label: t('sidebar.askDoubt') || 'Ask Doubt', href: '/student/post-doubt' },
    { icon: '📋', label: t('sidebar.myDoubts') || 'My Doubts', href: '/student/my-doubts' },
    { icon: '📰', label: t('currentAffairs.title') || 'Current Affairs', href: '/student/current-affairs' },
    { icon: '💰', label: t('sidebar.wallet') || 'My Wallet', href: '/student/wallet' },
    { icon: '🏆', label: t('leaderboard.title') || 'Leaderboard', href: '/student/leaderboard' },
    { icon: '🧑‍🎓', label: t('studentProfile.myProfile') || 'My Profile', href: '/student/profile' },
    {
      icon: '✨',
      label: t('knowmatoPlus.knowmatoPlus') || 'Knowmato+',
      href: '/student/knowmato-plus',
      isNew: true, // 🆕 NEW badge
    },
  ];

  // ---- Knowmato+ routes ----
  const knowmatoPlusRoutes: SidebarRoute[] = [
    {
      icon: '📚',
      label: t('knowmatoPlus.knowmato') || 'Knowmato',
      href: '/student/dashboard', // go back to student mode
    },
    { icon: '📚', label: t('knowmatoPlus.courses') || 'Courses', href: '/student/knowmato-plus' },
    { icon: '📖', label: t('knowmatoPlus.myCourses') || 'My Courses', href: '/student/knowmato-plus/my-courses' },
    { icon: '🧪', label: t('knowmatoPlus.tests') || 'Tests', href: '/student/knowmato-plus/tests' },
    { icon: '💼', label: t('knowmatoPlus.internships') || 'Internships', href: '/student/knowmato-plus/internships' },
    { icon: '💻', label: t('knowmatoPlus.jobOpenings') || 'Job Openings', href: '/student/knowmato-plus/jobs' },
    { icon: '🏆', label: t('leaderboard.title') || 'Leaderboard', href: '/student/leaderboard' },
    { icon: '⚙️', label: t('settings.title') || 'Settings', href: '/student/settings' },
  ];

  const routes = isKnowmatoPlus ? knowmatoPlusRoutes : studentRoutes;

  const handleLogout = async () => {
    const confirmed = window.confirm(t('settings.logoutConfirm') || "Are you sure you want to logout?");
    if (!confirmed) return;

    try {
      await clearTokens();
      dispatch(logout());
      toast.success(t('common.logoutSuccess') || "Logged out successfully");
      router.push("/entry");
    } catch {
      toast.error(t('common.error') || "Logout failed");
    }
    onClose();
  };

  return (
    <>
      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
          onClick={onClose}
        />
      )}

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
        {/* Brand */}
        <div className="flex h-16 items-center justify-between border-b border-white/10 px-4">
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-violet-300 to-fuchsia-300">
              {isKnowmatoPlus
                ? t('knowmatoPlus.knowmatoPlus') || 'Knowmato+'
                : t('common.appName') || 'Knowmato'}
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
              isNew={route.isNew || false}
              onClick={onClose}
            />
          ))}
        </nav>

        <div className="border-t border-white/10 p-4">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl bg-rose-500/10 text-rose-300 font-bold border border-rose-400/30 hover:border-rose-400/50 transition"
          >
            🚪 {t('sidebar.logout') || 'Sign Out'}
          </button>
        </div>

        {/* Upgrade banner (only in student mode) */}
        {!isKnowmatoPlus && (
          <div className="border-t border-white/10 p-4">
            <div className="rounded-xl bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 p-4 text-center border border-white/10 backdrop-blur-md">
              <div className="mb-2 text-2xl">👑</div>
              <h4 className="font-semibold text-white">{t('knowmatoPlus.enableKnowmatoPlus') || '✨ Knowmato+'}</h4>
              <p className="mt-1 text-[10px] text-white/70">
                {t('knowmatoPlus.enableDescription') || 'Unlock industry-oriented features'}
              </p>
              <button
                onClick={() => router.push('/student/knowmato-plus')}
                className="mt-3 w-full rounded-lg bg-gradient-to-r from-violet-500 to-fuchsia-500 py-1.5 text-xs font-bold text-white hover:shadow-lg"
              >
                {t('knowmatoPlus.enableNow') || 'Enable Now'}
              </button>
            </div>
          </div>
        )}
      </aside>
    </>
  );
}