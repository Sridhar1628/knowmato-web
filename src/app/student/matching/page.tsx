"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { getTokens } from "@/services/storageService";
import { connectSocket, disconnectSocket } from "@/services/versionSocketService";
import { getOnlineTutors } from "@/services/v1Service";

type Tutor = {
  id: string;
  display_name: string;
  is_verified: boolean;
  is_top_tutor: boolean;
  skills: string;
  average_rating: number;
};

export default function MatchingScreen() {
  const router = useRouter();
  const [doubtId, setDoubtId] = useState("");
  const [acceptedTutor, setAcceptedTutor] = useState<any>(null);
  const [connectionStage, setConnectionStage] = useState<'matching' | 'accepted' | 'connecting'>('matching');
  const [isConnecting, setIsConnecting] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tutors, setTutors] = useState<Tutor[]>([]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      setDoubtId(params.get("doubtId") || "");
    }
  }, []);

  useEffect(() => {
    const loadTutors = async () => {
      try {
        const res = await getOnlineTutors();
        console.log("✅ ONLINE TUTORS:", res);
        setTutors(res.data || []);
      } catch (err) {
        console.log("❌ LOAD TUTORS ERROR:", err);
      }
    };
    loadTutors();
  }, []);

  useEffect(() => {
    let isMounted = true;
    let socketConnected = false;

    const initSocket = async () => {
      try {
        const tokens = await getTokens();
        if (!tokens?.access) {
          throw new Error("Authentication token missing");
        }

        connectSocket(tokens.access, (event, data) => {
          if (!isMounted) return;
          console.log(`🔍 Matching event [${doubtId}]:`, event, data);

          const currentDoubtId = Number(doubtId);
          if (data?.doubt_id && Number(data.doubt_id) !== currentDoubtId) {
            console.log("Ignoring event for different doubt");
            return;
          }

          switch (event) {
            case "TUTOR_ACCEPTED":
            case "POOL_DOUBT_ACCEPTED":
            case "SESSION_STARTED":
            case "DIRECT_ACCEPTED": {
              const sessionId = data?.session_id;
              if (!sessionId) return;
              setAcceptedTutor(data);
              setConnectionStage("accepted");
              setTimeout(() => setConnectionStage("connecting"), 2500);
              setTimeout(() => {
                const sessionType = (data?.session_type || "").toLowerCase();
                if (sessionType === "live_video") {
                  router.replace(`/videocall/${sessionId}`);
                } else {
                  router.replace(`/chat/${sessionId}`);
                }
              }, 5000);
              break;
            }
            case "DIRECT_REJECTED":
              alert("The selected tutor is not available. Finding another tutor...");
              break;
            case "MATCHING_TIMEOUT":
              setError("No tutors found at the moment. Please try again later.");
              break;
            default:
              break;
          }
        });

        socketConnected = true;
        setIsConnecting(false);
      } catch (err: any) {
        console.error("Socket init error:", err);
        if (isMounted) {
          setError(err.message || "Failed to connect to matching service");
          setIsConnecting(false);
        }
      }
    };

    initSocket();

    return () => {
      isMounted = false;
      if (socketConnected) disconnectSocket();
    };
  }, [doubtId, router]);

  useEffect(() => {
    if (error) {
      alert(error);
      router.back();
    }
  }, [error, router]);

  const handleCancel = () => {
    const confirmed = window.confirm("Are you sure you want to stop searching for a tutor?");
    if (confirmed) {
      disconnectSocket();
      router.back();
    }
  };

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e] flex items-center justify-center p-4">
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 text-center max-w-md w-full shadow-2xl">
          <div className="text-5xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-white mb-2">Matching Failed</h2>
          <p className="text-white/70 mb-6">{error}</p>
          <button onClick={() => router.back()} className="px-6 py-3 bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white font-bold rounded-xl hover:shadow-lg">
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (connectionStage === "accepted") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e] flex items-center justify-center p-4">
        <div className="text-center">
          <div className="text-7xl mb-6">✅</div>
          <h1 className="text-3xl font-bold text-white mb-3">Tutor Accepted!</h1>
          <p className="text-lg text-white/80">
            {acceptedTutor?.display_name || "A tutor"} accepted your request
          </p>
        </div>
      </div>
    );
  }

  if (connectionStage === "connecting") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e] flex items-center justify-center p-4">
        <div className="text-center">
          <div className="text-7xl mb-6 animate-bounce">🤝</div>
          <h1 className="text-3xl font-bold text-white mb-3">Connecting...</h1>
          <p className="text-lg text-white/70">Preparing your session</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e] p-4 sm:p-6 lg:p-8 relative overflow-hidden flex flex-col items-center">
      {/* Animated blobs */}
      <div className="absolute top-0 -left-20 w-72 h-72 bg-purple-500/20 rounded-full mix-blend-multiply filter blur-3xl animate-blob" />
      <div className="absolute top-0 -right-20 w-72 h-72 bg-fuchsia-500/20 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000" />
      <div className="absolute -bottom-20 left-40 w-72 h-72 bg-cyan-500/20 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000" />

      {/* Header */}
      <div className="text-center mb-10 z-10">
        <h1 className="text-2xl sm:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-violet-300 via-fuchsia-300 to-cyan-300">
          Finding Best Tutors For You...
        </h1>
        <p className="mt-2 text-white/70 text-sm">Please wait while we find available experts.</p>
      </div>

      {/* Radar Animation */}
      <div className="relative w-64 h-64 mb-10 z-10">
        {/* Outer circle */}
        <div className="absolute inset-0 rounded-full border-4 border-violet-400/20 animate-ping opacity-20" />
        {/* Middle circle */}
        <div className="absolute inset-2 rounded-full border-2 border-fuchsia-400/30" />
        {/* Inner circle */}
        <div className="absolute inset-6 rounded-full border border-cyan-400/40" />
        {/* Rotating radar line */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-violet-400 to-transparent transform rotate-0 animate-[spin_4s_linear_infinite] origin-center" />
        </div>
        {/* Center dot */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-6 h-6 bg-violet-500 rounded-full animate-pulse shadow-lg shadow-violet-500/50" />
          <span className="absolute text-white font-bold text-lg">👤</span>
        </div>
      </div>

      {/* Tutor list */}
      <div className="w-full max-w-2xl bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-5 mb-6 shadow-2xl z-10">
        <h3 className="text-lg font-bold text-white mb-4">Top Matching Tutors</h3>
        <div className="space-y-3">
          {tutors.map((tutor) => (
            <div key={tutor.id} className="flex items-center gap-4 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors border border-white/5">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-white font-bold text-lg shadow-md">
                {tutor.display_name?.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-white truncate">{tutor.display_name}</p>
                <div className="flex items-center gap-2 mt-1">
                  {tutor.is_verified && <span className="text-[10px] bg-emerald-400/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-400/30">✔ Verified</span>}
                  {tutor.is_top_tutor && <span className="text-[10px] bg-amber-400/20 text-amber-300 px-2 py-0.5 rounded-full border border-amber-400/30">TOP</span>}
                </div>
                <p className="text-xs text-white/50 mt-1 truncate">{tutor.skills}</p>
              </div>
              <div className="flex flex-col items-end text-sm">
                <span className="text-white/70">⭐ {tutor.average_rating || 0}</span>
                <span className="text-emerald-300 font-medium">Online</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Status */}
      <div className="flex items-center gap-3 bg-white/10 backdrop-blur-lg border border-white/10 rounded-full px-5 py-3 mb-4 z-10">
        <div className="w-4 h-4 border-2 border-violet-400 border-t-transparent rounded-full animate-spin" />
        <span className="text-white/80 text-sm font-medium">Matching you with tutors...</span>
      </div>

      {/* Current Affairs button */}
      <button
        className="mb-4 px-5 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white/70 hover:bg-white/10 transition-colors z-10"
        onClick={() =>
          alert(
            "India launched a new AI education initiative for students in 2026.\n\nPython and AI remain top in-demand skills globally."
          )
        }
      >
        📰 Know Current Affairs While Waiting
      </button>

      {/* Cancel */}
      <button
        onClick={handleCancel}
        className="px-6 py-2.5 bg-rose-500/20 border border-rose-400/30 text-rose-300 rounded-xl font-medium hover:bg-rose-500/30 transition-colors z-10"
      >
        Cancel Search
      </button>
    </div>
  );
}