 'use client';

import { ReactNode, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthContext } from '@/contexts/AuthContext';

interface ProtectedRouteProps {
  children: ReactNode;
  role: 'student' | 'tutor' | 'admin';
}

export default function ProtectedRoute({
  children,
  role,
}: ProtectedRouteProps) {
  const router = useRouter();
  const pathname = usePathname();

  const { user, loading, authenticated } = useAuthContext();

  useEffect(() => {
    console.log('[GUARD DEBUG]', {
      pathname,
      loading,
      authenticated,
      userId: user?.id,
      userRole: user?.role,
      requiredRole: role,
    });

    if (loading) return;

    if (!authenticated || !user) {
      console.error('[GUARD DEBUG] Redirecting: account unavailable', {
        pathname,
      });
      router.replace('/login');
      return;
    }

    if (user.role !== role) {
      console.error('[GUARD DEBUG] Redirecting: role mismatch', {
        pathname,
        actualRole: user.role,
        requiredRole: role,
      });
      router.replace('/login');
    }
  }, [loading, authenticated, user, role, pathname, router]);

  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e]">
        <div className="flex flex-col items-center">
          <div className="h-14 w-14 animate-spin rounded-full border-4 border-violet-500 border-t-transparent" />
          <h2 className="mt-6 text-2xl font-bold text-white">
            Verifying your session...
          </h2>
          <p className="mt-2 text-gray-300">Please wait...</p>
        </div>
      </div>
    );
  }

  if (!authenticated || !user || user.role !== role) {
    return null;
  }

  return <>{children}</>;
}