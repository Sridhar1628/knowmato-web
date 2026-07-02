'use client';

import ProtectedRoute from '@/components/auth/ProtectedRoute';
import TutorLayoutContent from '@/components/layouts/TutorLayoutContent';

export default function TutorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute role="tutor">
      <TutorLayoutContent>
        {children}
      </TutorLayoutContent>
    </ProtectedRoute>
  );
}