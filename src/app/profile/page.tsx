"use client";

import { useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import { logout } from "@/redux/slices/authSlice";
import { clearTokens } from "@/services/storageService";
import { disconnectSocket } from "@/services/versionSocketService";

export default function ProfilePage() {
  const router = useRouter();
  const dispatch = useDispatch();
  const user = useSelector((state: RootState) => state.auth.user);

  const handleLogout = () => {
    const confirmed = window.confirm("Are you sure you want to logout?");
    if (!confirmed) return;

    try {
      disconnectSocket();
      clearTokens();
      dispatch(logout());
      // Optionally redirect to home/login, but clearing tokens + logout will trigger auth gate.
      router.push("/login");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const displayName = user?.display_name || "User";
  const email = user?.email || "No Email";
  const avatarInitial = displayName.charAt(0).toUpperCase();

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Header */}
      <div className="bg-indigo-600 rounded-b-3xl pt-12 pb-10 flex flex-col items-center text-white">
        <div className="w-20 h-20 rounded-full bg-white flex items-center justify-center mb-4 shadow-lg">
          <span className="text-4xl font-bold text-indigo-600">{avatarInitial}</span>
        </div>
        <h1 className="text-2xl font-bold">{displayName}</h1>
        <p className="text-indigo-200 text-sm mt-1">{email}</p>
      </div>

      {/* Menu */}
      <div className="px-4 mt-8 space-y-4 flex-1">
        {/* Wallet */}
        <button
          onClick={() => router.push("/student/wallet")}
          className="w-full bg-white rounded-2xl p-4 flex items-center shadow-sm hover:shadow-md transition"
        >
          <span className="text-2xl mr-4">💰</span>
          <div className="flex-1 text-left">
            <div className="font-semibold text-gray-800">Wallet</div>
            <div className="text-xs text-gray-500">View balance & transactions</div>
          </div>
          <span className="text-gray-400 text-xl">›</span>
        </button>

        {/* My Learning */}
        <button
          onClick={() => router.push("/student/learning")}
          className="w-full bg-white rounded-2xl p-4 flex items-center shadow-sm hover:shadow-md transition"
        >
          <span className="text-2xl mr-4">📚</span>
          <div className="flex-1 text-left">
            <div className="font-semibold text-gray-800">My Learning</div>
            <div className="text-xs text-gray-500">Sessions & learning history</div>
          </div>
          <span className="text-gray-400 text-xl">›</span>
        </button>

        {/* Settings */}
        <button
          onClick={() => router.push("/student/settings")}
          className="w-full bg-white rounded-2xl p-4 flex items-center shadow-sm hover:shadow-md transition"
        >
          <span className="text-2xl mr-4">⚙️</span>
          <div className="flex-1 text-left">
            <div className="font-semibold text-gray-800">Settings</div>
            <div className="text-xs text-gray-500">App preferences & privacy</div>
          </div>
          <span className="text-gray-400 text-xl">›</span>
        </button>
      </div>

      {/* Logout */}
      <div className="px-4 mt-auto pb-8">
        <button
          onClick={handleLogout}
          className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-4 rounded-xl transition"
        >
          🚪 Logout
        </button>
      </div>
    </div>
  );
}