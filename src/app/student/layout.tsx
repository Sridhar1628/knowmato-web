'use client';

import ProtectedRoute from '@/components/auth/ProtectedRoute';
import StudentLayoutContent from '@/components/layouts/StudentLayoutContent';

export default function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute role="student">
      <StudentLayoutContent>
        {children}
      </StudentLayoutContent>
    </ProtectedRoute>
  );
}