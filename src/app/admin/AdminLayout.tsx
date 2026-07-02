'use client';

import ProtectedRoute from '@/components/auth/ProtectedRoute';
import AdminLayoutContent from '@/components/layouts/AdminLayoutContent';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute role="admin">
      <AdminLayoutContent>
        {children}
      </AdminLayoutContent>
    </ProtectedRoute>
  );
}