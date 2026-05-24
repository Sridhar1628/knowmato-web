import DashboardSidebar from '@/components/DashboardSidebar';

export default function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen bg-gray-50">
      {/* Persistent Left Sidebar */}
      <DashboardSidebar />

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto p-6">
        <div className="mx-auto max-w-6xl">
          {children}
        </div>
      </main>

      {/* 
         Optional: Right Sidebar 
         If you want the right sidebar (Live Tutors, Current Affairs) 
         to appear on EVERY page, you can include it here as well.
         Otherwise, define it inside the individual page component.
      */}
    </div>
  );
}