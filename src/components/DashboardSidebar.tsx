'use client';

import { useRouter } from 'next/navigation';

// Helper component for Sidebar Items
function NavItem({ icon, label, active = false, onClick }: { icon: string; label: string; active?: boolean; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
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

export default function DashboardSidebar() {
  const router = useRouter();

  return (
    <aside className="flex w-64 flex-col bg-[#0f0f23] text-white hidden md:flex">
      {/* Brand / Logo */}
      <div className="flex h-16 items-center justify-center border-b border-gray-700/50">
        <div className="flex items-center gap-2">
          <div className="rounded-lg bg-indigo-600 p-1">
            <span className="text-lg">⚡</span>
          </div>
          <span className="text-xl font-bold tracking-tight">Instant Skill</span>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 space-y-1 p-4 overflow-y-auto">
        <NavItem icon="🏠" label="Home" active onClick={() => router.push('/student/dashboard')} />
        <NavItem icon="❓" label="Ask Doubt" onClick={() => router.push('/student/post-doubt')} />
        <NavItem icon="📋" label="My Doubts" onClick={() => router.push('/student/my-doubts')} />
        <NavItem icon="💬" label="Chat" onClick={() => router.push('/student/chat')} />
        <NavItem icon="📰" label="Current Affairs" /> 
        <NavItem icon="📚" label="My Bookmarks" /> 
        <NavItem icon="💰" label="My Wallet" onClick={() => router.push('/student/wallet')} />
        <NavItem icon="🏆" label="Leaderboard" /> 
        <NavItem icon="🤝" label="Refer & Earn" /> 
        <NavItem icon="⚙️" label="Settings" /> 
      </nav>

      {/* Upgrade to Pro Block */}
      <div className="p-4 border-t border-gray-700/50">
        <div className="rounded-xl bg-gradient-to-br from-indigo-900 to-purple-900 p-4 text-center">
          <div className="mb-2 text-2xl">👑</div>
          <h4 className="font-semibold">Upgrade to Pro</h4>
          <p className="mt-1 text-[10px] text-gray-300">Get priority support, <br/> unlimited chats & more.</p>
          <button className="mt-3 w-full rounded-lg bg-indigo-600 py-1.5 text-xs font-bold hover:bg-indigo-500">Upgrade Now</button>
        </div>
      </div>
    </aside>
  );
}