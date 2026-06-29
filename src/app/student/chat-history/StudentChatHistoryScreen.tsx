"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { apiGet } from "@/services/apiService";
import { useAuth } from "@/hooks/useAuth";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
type Message = {
  id: number | string;
  sender_id: number;
  sender_name?: string;
  message_type: "text" | "audio" | "video";
  text?: string;
  file?: string;   // URL for audio/video
  link?: string;
  created_at: string;
};

// ---------------------------------------------------------------------------
// StudentChatHistoryScreen
// ---------------------------------------------------------------------------
const StudentChatHistoryScreen = () => {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Route params
  const sessionId = searchParams.get("sessionId") || "";
  const tutorId = searchParams.get("tutorId") || "";
  const tutorName = searchParams.get("tutorName") || "Tutor";

  // Current user (adjust to your auth mechanism)
  const { loading: authLoading } = useAuth();
  const currentUser = useSelector((state: RootState) => state.auth.user);

  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ---------------------------------------------------------------------------
  // Fetch Messages
  // ---------------------------------------------------------------------------
  const fetchMessages = useCallback(async () => {
    if (!sessionId) return;
    try {
      setLoading(true);
      setError(null);
      const res = await apiGet(`chat/messages/${sessionId}/`);
      setMessages(Array.isArray(res) ? res : []);
    } catch (err) {
      console.error("Chat history error:", err);
      setError("Failed to load chat history.");
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------
  const formatTime = (date: string) => {
    return new Date(date).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // ---------------------------------------------------------------------------
  // Render a single message (left for others, right for own)
  // ---------------------------------------------------------------------------
  const renderMessage = (item: Message) => {
    const isOwn = currentUser && Number(item.sender_id) === Number(currentUser.id);

    return (
      <div
        key={item.id}
        className={`flex items-start gap-2 mb-4 ${isOwn ? "flex-row-reverse" : "flex-row"}`}
      >
        {/* Avatar for other user (only on left side) */}
        {!isOwn && item.sender_name && (
          <div className="flex-shrink-0 w-9 h-9 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-sm font-bold text-white shadow-md">
            {item.sender_name.charAt(0).toUpperCase()}
          </div>
        )}

        <div
          className={`max-w-[75%] rounded-2xl p-3 ${
            isOwn
              ? "bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white shadow-lg shadow-violet-500/25"
              : "bg-white/5 backdrop-blur-md border border-white/10 text-white shadow-md"
          }`}
        >
          {/* Sender name (only for other user) */}
          {!isOwn && (
            <span className="text-xs font-semibold text-violet-300 block mb-1">
              {item.sender_name}
            </span>
          )}

          {/* Text message */}
          {item.message_type === "text" && item.text && (
            <p className="text-sm whitespace-pre-wrap break-words">{item.text}</p>
          )}

          {/* Audio */}
          {item.message_type === "audio" && (
            <button
              onClick={() => window.open(item.file || item.link, "_blank")}
              className="flex items-center gap-2 text-sm bg-white/10 hover:bg-white/20 px-3 py-2 rounded-lg transition"
            >
              <span>🎧</span> Play Audio
            </button>
          )}

          {/* Video */}
          {item.message_type === "video" && (
            <button
              onClick={() => window.open(item.file || item.link, "_blank")}
              className="flex items-center gap-2 text-sm bg-white/10 hover:bg-white/20 px-3 py-2 rounded-lg transition"
            >
              <span>🎥</span> Watch Video
            </button>
          )}

          {/* Time */}
          <span
            className={`text-xs mt-1 block ${
              isOwn ? "text-white/80" : "text-white/50"
            }`}
          >
            {formatTime(item.created_at)}
          </span>
        </div>
      </div>
    );
  };

  // ---------------------------------------------------------------------------
  // Loading state
  // ---------------------------------------------------------------------------
  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e] flex items-center justify-center">
        <div className="text-center text-white">
          <div className="w-10 h-10 animate-spin rounded-full border-4 border-violet-400 border-t-transparent mx-auto" />
          <p className="mt-3 text-sm text-white/70">Loading chat…</p>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Error state
  // ---------------------------------------------------------------------------
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e] flex items-center justify-center">
        <div className="text-center">
          <p className="text-rose-300 mb-4">{error}</p>
          <button
            onClick={fetchMessages}
            className="px-5 py-2.5 bg-rose-500/20 border border-rose-400/40 text-rose-300 rounded-xl hover:bg-rose-500/30 transition"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Main UI
  // ---------------------------------------------------------------------------
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e] relative overflow-hidden">
      {/* Animated background blobs */}
      <div className="absolute top-0 -left-20 w-72 h-72 bg-purple-500/20 rounded-full mix-blend-multiply filter blur-3xl animate-blob" />
      <div className="absolute top-0 -right-20 w-72 h-72 bg-fuchsia-500/20 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000" />
      <div className="absolute -bottom-20 left-40 w-72 h-72 bg-cyan-500/20 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000" />

      <div className="relative z-10 max-w-3xl mx-auto p-4 sm:p-6">
        {/* Header */}
        <header className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-4 flex items-center gap-3 mb-6 shadow-2xl">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-xl hover:bg-white/10 transition text-white/80 hover:text-white"
          >
            ←
          </button>
          <div className="flex items-center gap-3 flex-1">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-lg font-bold text-white shadow-md">
              {tutorName.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">{tutorName}</h2>
              <p className="text-xs text-white/50">Chat History</p>
            </div>
          </div>
        </header>

        {/* Ask Again button */}
        <button
          onClick={() =>
            router.push(
              `/student/post-doubt?mode=specific&tutorId=${tutorId}&tutorName=${tutorName}`
            )
          }
          className="w-full mb-6 py-3 rounded-2xl bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white font-bold shadow-lg shadow-violet-500/25 hover:from-violet-600 hover:to-fuchsia-600 transition"
        >
          🚀 Ask Again with {tutorName}
        </button>

        {/* Messages container */}
        <div className="space-y-2 max-h-[70vh] overflow-y-auto pr-2 scrollbar-hide">
          {messages.length === 0 ? (
            <div className="text-center py-16 text-white/50">
              <span className="text-5xl block mb-4">💬</span>
              <h3 className="text-xl font-bold">No messages found</h3>
              <p className="text-sm mt-1">Chat history will appear here</p>
            </div>
          ) : (
            messages.map(renderMessage)
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentChatHistoryScreen;