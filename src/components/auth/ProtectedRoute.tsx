'use client';

import { ReactNode, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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

  const {
    user,
    loading,
    authenticated,
  } = useAuthContext();

  useEffect(() => {
    if (loading) return;

    // Not authenticated
    if (!authenticated || !user) {
      router.replace('/login');
      return;
    }

    // Wrong role
    if (user.role !== role) {
      router.replace('/login');
    }
  }, [loading, authenticated, user, role, router]);

  // Still checking session
  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e]">
        <div className="flex flex-col items-center">
          <div className="h-14 w-14 animate-spin rounded-full border-4 border-violet-500 border-t-transparent" />

          <h2 className="mt-6 text-2xl font-bold text-white">
            Verifying your session...
          </h2>

          <p className="mt-2 text-gray-300">
            Please wait...
          </p>
        </div>
      </div>
    );
  }

  // Authentication failed
  if (!authenticated || !user) {
    return null;
  }

  // Wrong role
  if (user.role !== role) {
    return null;
  }

  // Everything is OK
  return <>{children}</>;
}