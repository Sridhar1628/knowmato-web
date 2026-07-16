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
  const { t } = useTranslation();

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
          {t('common.newBadge')}
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
    { icon: '🏠', label: t('sidebar.home'), href: '/student/dashboard' },
    { icon: '💳', label: t('sidebar.credits'), href: '/student/credits' }, // added credits key
    { icon: '❓', label: t('sidebar.askDoubt'), href: '/student/post-doubt' },
    { icon: '📋', label: t('sidebar.myDoubts'), href: '/student/my-doubts' },
    { icon: '📰', label: t('currentAffairs.title'), href: '/student/current-affairs' },
    { icon: '💰', label: t('sidebar.wallet'), href: '/student/wallet' },
    { icon: '🏆', label: t('leaderboard.title'), href: '/student/leaderboard' },
    { icon: '🧑‍🎓', label: t('studentProfile.myProfile'), href: '/student/profile' },
    {
      icon: '✨',
      label: t('knowmatoPlus.knowmatoPlus'),
      href: '/student/knowmato-plus',
      isNew: true,
    },
  ];

  // ---- Knowmato+ routes ----
  const knowmatoPlusRoutes: SidebarRoute[] = [
    {
      icon: '📚',
      label: t('knowmatoPlus.knowmato'),
      href: '/student/dashboard',
    },
    { icon: '📚', label: t('knowmatoPlus.courses'), href: '/student/knowmato-plus' },
    { icon: '📖', label: t('knowmatoPlus.myCourses'), href: '/student/knowmato-plus/my-courses' },
    { icon: '📖', label: t('knowmatoPlus.assessments'), href: '/student/knowmato-plus/assessments' }, // added assessments key
    { icon: '🧪', label: t('knowmatoPlus.tests'), href: '/student/knowmato-plus/tests' },
    { icon: '💼', label: t('knowmatoPlus.internships'), href: '/student/knowmato-plus/internships' },
    { icon: '💻', label: t('knowmatoPlus.jobOpenings'), href: '/student/knowmato-plus/jobs' },
    { icon: '🏆', label: t('leaderboard.title'), href: '/student/knowmato-plus/leaderboard' },
    { icon: '⚙️', label: t('sidebar.settings'), href: '/student/knowmato-plus/settings' }, // corrected to sidebar.settings
  ];

  const routes = isKnowmatoPlus ? knowmatoPlusRoutes : studentRoutes;

  const handleLogout = async () => {
    const confirmed = window.confirm(t('settings.logoutConfirm'));
    if (!confirmed) return;

    try {
      await clearTokens();
      dispatch(logout());
      toast.success(t('common.logoutSuccess'));
      router.push("/entry");
    } catch {
      toast.error(t('common.error'));
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
                ? t('knowmatoPlus.knowmatoPlus')
                : t('common.appName')}
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
            🚪 {t('sidebar.logout')}
          </button>
        </div>

        {/* Upgrade banner (only in student mode) */}
        {!isKnowmatoPlus && (
          <div className="border-t border-white/10 p-4">
            <div className="rounded-xl bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 p-4 text-center border border-white/10 backdrop-blur-md">
              <div className="mb-2 text-2xl">👑</div>
              <h4 className="font-semibold text-white">{t('knowmatoPlus.enableKnowmatoPlus')}</h4>
              <p className="mt-1 text-[10px] text-white/70">
                {t('knowmatoPlus.enableDescription')}
              </p>
              <button
                onClick={() => router.push('/student/knowmato-plus')}
                className="mt-3 w-full rounded-lg bg-gradient-to-r from-violet-500 to-fuchsia-500 py-1.5 text-xs font-bold text-white hover:shadow-lg"
              >
                {t('knowmatoPlus.enableNow')}
              </button>
            </div>
          </div>
        )}
      </aside>
    </>
  );
}