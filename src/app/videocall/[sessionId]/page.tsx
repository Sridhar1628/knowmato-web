"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { getTokens } from "@/services/storageService";
import {
  connectChatSocket,
  sendChatMessage,
  disconnectChatSocket,
} from "@/services/chatSocket";
import axios from "@/api/axiosInstance";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import { useCall } from "@/contexts/CallContext";

// ----- Agora App ID -----
const APP_ID = "19789ef2ac6e48e89404f52c1c3231a5";

// ----- Types -----
interface Message {
  id: number | string;
  text: string;
  sender_id: number;
  timestamp?: string;
}

// ----- Inline Profile Card (dark glass) -----
const ProfileCard: React.FC = () => (
  <div className="flex flex-col items-center justify-center h-full text-white/50">
    <div className="w-24 h-24 rounded-full bg-white/10 flex items-center justify-center text-4xl mb-4">
      👤
    </div>
    <p className="text-lg font-semibold text-white/80">Remote Participant</p>
    <p className="text-sm text-white/50 mt-1">Waiting for video...</p>
  </div>
);

const VideoCallScreen: React.FC = () => {
  const router = useRouter();
  const params = useParams();

  const sessionIdParam = Array.isArray(params.sessionId)
    ? params.sessionId[0]
    : params.sessionId;
  const sessionId = sessionIdParam ? Number(sessionIdParam) : null;

  const {
    startCall,
    minimizeCall,
    leaveAgoraCall,
    remoteUid,
    joined,
    isMuted,
    toggleMute,
    isScreenSharing,
    toggleScreenShare,
    connectionState,
    initializeAgora,
    isRemoteScreenSharing,
  } = useCall();

  // User info
  const user = useSelector((state: RootState) => state.auth.user);
  const [userRole, setUserRole] = useState<string | null>(user?.role || null);
  const [userId, setUserId] = useState<number | null>(null);
  const [userName, setUserName] = useState("");

  // Agora UI
  const [showJoinToast, setShowJoinToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const localScreenShareContainerRef = useRef<HTMLDivElement>(null);

  // Timer
  const [seconds, setSeconds] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const formatTime = (totalSeconds: number) => {
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  // Session state
  const [isLoading, setIsLoading] = useState(true);
  const [ending, setEnding] = useState(false);
  const [requestSent, setRequestSent] = useState(false);
  const [userLeftTimeoutReached, setUserLeftTimeoutReached] = useState(false);
  const [isSessionCompleted, setIsSessionCompleted] = useState(false);
  const [reviewSubmitted, setReviewSubmitted] = useState(false);

  // Chat
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [showChatModal, setShowChatModal] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Alert/Confirm modal
  const [alertData, setAlertData] = useState<{
    title: string;
    message: string;
    onAccept?: () => void;
    onReject?: () => void;
  } | null>(null);

  // ========== Initialisation ==========
  useEffect(() => {
    if (sessionId === null || Number.isNaN(sessionId)) return;

    const initCall = async () => {
      try {
        setIsLoading(true);

        const tokens = await getTokens();
        const payload = JSON.parse(atob(tokens.access.split(".")[1]));
        const currentUserId = Number(payload.user_id);

        const sessionRes = await axios.get(`/v1/session/${sessionId}/`);
        if (currentUserId === Number(sessionRes.data.student_id)) {
          setUserRole("student");
        } else {
          setUserRole("tutor");
        }

        if (!tokens?.access) throw new Error("No token");

        const res = await axios.post(`sessions/${sessionId}/start-video/`);
        const { channel_name, token, uid } = res.data;

        await initializeAgora({
          appId: APP_ID,
          channel: channel_name,
          token,
          uid,
        });

        startCall(sessionId);

        timerRef.current = setInterval(() => {
          setSeconds((prev) => prev + 1);
        }, 1000);
      } catch (err) {
        console.error("Init error:", err);
        window.alert("Failed to start video call.");
      } finally {
        setIsLoading(false);
      }
    };

    initCall();

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [sessionId]);

  // ----- Leave Call -----
  const handleLeaveCall = async (forceEnd = false) => {
    if (ending) return;
    setEnding(true);
    try {
      if (timerRef.current) clearInterval(timerRef.current);

      if (forceEnd && sessionId) {
        try {
          await axios.post(`sessions/${sessionId}/end-video/`);
        } catch (err) {
          console.error("Failed to end session:", err);
        }
      }

      await leaveAgoraCall();
      disconnectChatSocket();
      exitCallScreen(forceEnd);
    } catch (err) {
      console.error("Leave call error:", err);
      exitCallScreen(false);
    } finally {
      setEnding(false);
    }
  };

  const exitCallScreen = (completed: boolean) => {
    if (userRole === "tutor") {
      router.replace("/tutor/dashboard");
    } else {
      if (completed) {
        router.replace(`/student/submit-review/${sessionId}`);
      } else {
        router.replace("/student/dashboard");
      }
    }
  };

  // ----- End Request via Chat Socket -----
  const handleEndRequest = () => {
    if (requestSent || ending) return;
    setAlertData({
      title: "End Call",
      message: "Do you want to request to end the call?",
      onAccept: () => {
        setRequestSent(true);
        sendChatMessage({ type: "END_SESSION_REQUEST", session_id: sessionId });
        window.alert("Request Sent: Waiting for other user...");
        setAlertData(null);
      },
      onReject: () => setAlertData(null),
    });
  };

  const showCallNotification = (sessionId: number) => {
    if (typeof window === "undefined" || !("Notification" in window) || Notification.permission !== "granted") return;
    const notification = new Notification("Knowmato Call", {
      body: "Click to return to your active session",
      icon: "/logo.png",
      tag: `call-${sessionId}`,
    });
    notification.onclick = () => {
      window.focus();
      window.open(`/videocall/${sessionId}`, "_self");
    };
  };

  // ----- Chat Socket -----
  useEffect(() => {
    if (!sessionId) return;
    let mounted = true;

    const initChatSocket = async () => {
      try {
        const tokens = getTokens();
        const token = tokens?.access;
        if (!token) return;

        connectChatSocket(sessionId, token, (data: any) => {
          if (!mounted) return;

          // END_SESSION_REQUEST
          if (data?.type === "END_SESSION_REQUEST") {
            setAlertData({
              title: "End Call Request",
              message: `${data.user_name || "User"} wants to end the call.`,
              onAccept: async () => {
                try {
                  sendChatMessage({ type: "END_SESSION_ACCEPTED", session_id: sessionId });
                  await handleLeaveCall(true);
                } finally {
                  setAlertData(null);
                }
              },
              onReject: () => {
                sendChatMessage({ type: "END_SESSION_REJECTED", session_id: sessionId });
                setAlertData(null);
              },
            });
            return;
          }

          // END_SESSION_ACCEPTED
          if (data?.type === "END_SESSION_ACCEPTED") {
            if (!ending) handleLeaveCall(true);
            return;
          }

          // END_SESSION_REJECTED
          if (data?.type === "END_SESSION_REJECTED") {
            window.alert("Request Rejected: User declined to end the call.");
            setRequestSent(false);
            return;
          }

          // Ignore system events
          if (data?.type === "typing" || data?.type === "USER_STATUS") return;
          if (!data?.id) return;

          const text = typeof data.text === "string" ? data.text : data.text?.text || "";
          if (!text) return;

          const newMsg: Message = {
            id: data.id,
            text,
            sender_id: data.sender_id || data.sender,
            timestamp: data.timestamp,
          };

          setMessages((prev) => [...prev, newMsg]);
          if (!showChatModal) setUnreadCount((prev) => prev + 1);
        });
      } catch (err) {
        console.error("Chat socket init failed:", err);
      }
    };

    initChatSocket();

    return () => {
      mounted = false;
      console.log("VideoCallScreen unmounted - keeping chat socket alive");
      // Do NOT disconnect here. Only inside handleLeaveCall().
    };
  }, [sessionId]);

  const handleSendMessage = () => {
    if (!inputText.trim()) return;
    sendChatMessage({ type: "text", text: inputText.trim() });
    setInputText("");
  };

  // ----- Timeout if no remote user -----
  useEffect(() => {
    if (joined && !remoteUid && !isLoading && !userLeftTimeoutReached) {
      const timeout = setTimeout(() => {
        setUserLeftTimeoutReached(true);
        window.alert("No Answer: The other user did not join.");
        handleLeaveCall(true);
      }, 60000);
      return () => clearTimeout(timeout);
    }
  }, [joined, remoteUid, isLoading, userLeftTimeoutReached]);

  // ----- Beforeunload -----
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, []);

  // ----- UI Helpers -----
  const connectionStatusText = isLoading
    ? "Connecting..."
    : remoteUid
    ? "Connected"
    : joined
    ? "Waiting..."
    : "Connecting...";

  const dotColor =
    connectionState === "connected"
      ? "#4caf50"
      : connectionState === "connecting"
      ? "#ff9800"
      : "#f44336";

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e] flex items-center justify-center">
        <div className="text-center text-white">
          <div className="w-12 h-12 animate-spin rounded-full border-4 border-violet-400 border-t-transparent mx-auto" />
          <p className="mt-4 text-lg">Establishing connection...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden select-none">
      {/* Top overlay: Timer & Status */}
      <div className="absolute top-0 left-0 right-0 z-20 flex justify-between items-center p-4">
        <div className="bg-white/10 backdrop-blur-md rounded-full px-4 py-1.5 text-white font-mono text-sm shadow-lg">
          {formatTime(seconds)}
        </div>
        <div className="bg-white/10 backdrop-blur-md rounded-full px-4 py-1.5 flex items-center gap-2 shadow-lg">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: dotColor }} />
          <span className="text-white text-xs font-medium">{connectionStatusText}</span>
        </div>
      </div>

      {/* Session info + Live badge */}
      <div className="absolute top-16 left-4 z-20 flex flex-col gap-2">
        <div className="bg-white/10 backdrop-blur-md rounded-xl px-4 py-2 shadow-lg">
          <p className="text-white/60 text-xs">Session with</p>
          <p className="text-white font-bold text-sm">
            {userRole === "student" ? "Tutor" : "Student"}
          </p>
        </div>
        <div className="bg-red-500/90 backdrop-blur-md rounded-full px-3 py-1 flex items-center gap-1.5 w-fit shadow-lg">
          <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
          <span className="text-white text-xs font-bold uppercase">Live</span>
        </div>
      </div>

      {/* Remote Video Area */}
      <div className="absolute inset-0 z-0 bg-black">
        {/* Screen share view */}
        <div
          id="remote-video-container"
          className="w-full h-full"
          style={{ display: isRemoteScreenSharing ? "block" : "none" }}
        />
        {!isRemoteScreenSharing && (
          <div className="w-full h-full flex items-center justify-center">
            <ProfileCard />
          </div>
        )}
      </div>

      {/* Local Screen Share Preview (floating) */}
      {isScreenSharing && (
        <div className="absolute bottom-28 right-6 z-20 w-40 h-28 rounded-xl overflow-hidden border-2 border-violet-400/50 shadow-2xl">
          <div id="local-screen-container" className="w-full h-full" />
        </div>
      )}

      {/* Local camera off indicator */}
      <div className="absolute bottom-28 left-6 z-20 flex items-center gap-2 bg-white/10 backdrop-blur-md rounded-full px-3 py-2 shadow-lg">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-white font-bold">
          👤
        </div>
        <span className="text-white text-sm font-medium">{userName || "Participant"}</span>
      </div>

      {/* Join/Leave toast */}
      {showJoinToast && (
        <div className="absolute top-24 left-1/2 -translate-x-1/2 z-30 bg-white/10 backdrop-blur-xl rounded-full px-5 py-2 text-white text-sm shadow-lg">
          👤 {toastMessage}
        </div>
      )}

      {/* Control Bar */}
      <div className="absolute bottom-0 left-0 right-0 z-30 p-4 pb-6 sm:pb-8">
        <div className="flex items-center justify-center gap-2 sm:gap-4 max-w-md mx-auto">
          {/* Mic */}
          <button
            onClick={toggleMute}
            className={`w-14 h-14 rounded-full flex items-center justify-center text-xl transition ${
              isMuted
                ? "bg-red-500/80 text-white backdrop-blur-md"
                : "bg-white/10 text-white backdrop-blur-md hover:bg-white/20"
            }`}
          >
            {isMuted ? "🔇" : "🎤"}
          </button>

          {/* Minimize */}
          <button
            onClick={() => {
              minimizeCall();
              showCallNotification(sessionId!);
              router.replace(userRole === "tutor" ? "/tutor/dashboard" : "/student/dashboard");
            }}
            className="w-14 h-14 rounded-full bg-white/10 text-white flex items-center justify-center text-sm backdrop-blur-md hover:bg-white/20 transition"
          >
            _
          </button>

          {/* Screen Share */}
          <button
            onClick={toggleScreenShare}
            className={`w-14 h-14 rounded-full flex items-center justify-center text-xl transition ${
              isScreenSharing
                ? "bg-violet-500/80 text-white backdrop-blur-md"
                : "bg-white/10 text-white backdrop-blur-md hover:bg-white/20"
            }`}
          >
            🖥️
          </button>

          {/* Chat */}
          <button
            onClick={() => {
              setShowChatModal(true);
              setUnreadCount(0);
            }}
            className="w-14 h-14 rounded-full bg-white/10 text-white flex items-center justify-center text-xl relative backdrop-blur-md hover:bg-white/20 transition"
          >
            💬
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>

          {/* End Call */}
          <button
            onClick={handleEndRequest}
            className="w-16 h-16 rounded-full bg-red-500 text-white flex items-center justify-center text-2xl shadow-lg shadow-red-500/30 hover:scale-105 transition"
          >
            📞
          </button>
        </div>
      </div>

      {/* Chat Modal */}
      {showChatModal && (
        <div
          className="absolute inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center"
          onClick={() => setShowChatModal(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full sm:max-w-md h-[80vh] sm:h-[70vh] bg-gradient-to-br from-[#1a1742] to-[#24243e] rounded-t-3xl sm:rounded-3xl flex flex-col overflow-hidden shadow-2xl border border-white/10"
          >
            <div className="flex justify-between items-center p-4 border-b border-white/10">
              <h3 className="text-white font-bold text-lg">Live Chat</h3>
              <button onClick={() => setShowChatModal(false)} className="text-white/60 hover:text-white text-xl">
                ✕
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.length === 0 ? (
                <p className="text-white/40 text-center mt-8">No messages yet</p>
              ) : (
                messages.map((msg, idx) => {
                  const isOwn = Number(msg.sender_id) === Number(userId);
                  return (
                    <div
                      key={idx}
                      className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[75%] px-4 py-2 rounded-2xl text-sm ${
                          isOwn
                            ? "bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white"
                            : "bg-white/10 text-white"
                        }`}
                      >
                        {msg.text}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
            <div className="p-3 border-t border-white/10 flex gap-2">
              <input
                className="flex-1 bg-white/10 border border-white/20 rounded-full px-4 py-2 text-white placeholder-white/40 outline-none focus:border-violet-400"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Type message..."
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSendMessage();
                }}
              />
              <button
                onClick={handleSendMessage}
                className="w-10 h-10 rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white flex items-center justify-center"
              >
                ➤
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Alert Modal */}
      {alertData && (
        <div className="absolute inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center">
          <div className="bg-gradient-to-br from-[#1a1742] to-[#24243e] rounded-3xl p-6 max-w-xs w-full shadow-2xl border border-white/10">
            <h4 className="text-white font-bold text-lg mb-2">{alertData.title}</h4>
            <p className="text-white/80 text-sm mb-6">{alertData.message}</p>
            <div className="flex gap-3 justify-end">
              {alertData.onReject && (
                <button
                  onClick={alertData.onReject}
                  className="px-4 py-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition"
                >
                  Reject
                </button>
              )}
              {alertData.onAccept && (
                <button
                  onClick={alertData.onAccept}
                  className="px-5 py-2 rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white font-semibold hover:shadow-lg transition"
                >
                  Accept
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoCallScreen;