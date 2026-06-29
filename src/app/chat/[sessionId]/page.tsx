"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { getMessages, markMessagesRead } from "@/services/chatService";
import {
  connectChatSocket,
  disconnectChatSocket,
  sendChatMessage,
  sendTypingStatus,
  sendReadReceipt,
} from "@/services/chatSocket";
import { getTokens } from "@/services/storageService";
import { endSession } from "@/services/sessionService";
import axiosInstance from "@/api/axiosInstance";
import { createReport } from "@/services/v1Service";

/* ----- Types ----- */
interface Message {
  id: number | string;
  text: string;
  sender_id: number;
  sender_name?: string;
  timestamp?: string;
  is_delivered?: boolean;
  is_seen?: boolean;
  type?: string;
}

interface SessionDetails {
  student_id: number;
  tutor_id: number;
  student: string;
  tutor: string;
}

const ChatScreen = () => {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.sessionId as string;

  // State
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [currentUserName, setCurrentUserName] = useState("");
  const [otherUserId, setOtherUserId] = useState<number | null>(null);
  const [otherUserName, setOtherUserName] = useState("");
  const [onlineStatus, setOnlineStatus] = useState("connecting");
  const [typingUser, setTypingUser] = useState("");
  const [sessionDetails, setSessionDetails] = useState<SessionDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [statusVersion, setStatusVersion] = useState(0);
  const [ending, setEnding] = useState(false);
  const [requestSent, setRequestSent] = useState(false);
  const [alertData, setAlertData] = useState<{
    title: string;
    message: string;
    onAccept?: () => void;
    onReject?: () => void;
  } | null>(null);

  const [showMenu, setShowMenu] = useState(false);
  const isStudent =
    currentUserId !== null &&
    sessionDetails !== null &&
    currentUserId === Number(sessionDetails.student_id);

  const socketInitialized = useRef(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [reportDescription, setReportDescription] = useState("");
  const [reportLoading, setReportLoading] = useState(false);

  // Format time
  const formatTime = (timestamp?: string) => {
    if (!timestamp) return "";
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  // Normalize message
  const normalizeMessage = useCallback((msg: any): Message => {
    let text = msg.text;
    if (typeof text === "object") text = text?.text || "";
    if (typeof text !== "string") text = String(text || "");

    const senderId = typeof msg.sender_id === "number" ? msg.sender_id : Number(msg.sender_id);

    return {
      ...msg,
      text,
      sender_id: senderId,
      sender_name: msg.sender_name || msg.sender,
      timestamp: msg.created_at || msg.timestamp,
    };
  }, []);

  // Navigate after session ends
  const navigateAfterEnd = async () => {
    try {
      const res = await axiosInstance.get(`/v1/session/${sessionId}/`);
      if (currentUserId === Number(res.data.student_id)) {
        router.replace(`/student/submit-review/${sessionId}`);
      } else {
        router.replace("/tutor/dashboard");
      }
    } catch {
      router.back();
    }
  };

  // Main socket event handler
  const handleSocketEvent = useCallback(
    (data: any) => {
      console.log("💬 WS EVENT:", data);

      // USER STATUS
      if (data?.type === "USER_STATUS") {
        if (Number(data.user_id) === Number(otherUserId)) {
          setOnlineStatus(data.status);
          setStatusVersion((prev) => prev + 1);
        }
        return;
      }

      // TYPING
      if (data?.type === "TYPING") {
        if (Number(data.user_id) !== Number(currentUserId)) {
          setTypingUser(data.user_name);
          if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
          typingTimeoutRef.current = setTimeout(() => setTypingUser(""), 2000);
        }
        return;
      }

      // MESSAGE
      if (data?.id) {
        const cleaned = normalizeMessage(data);
        setMessages((prev) => {
          if (prev.some((m) => Number(m.id) === Number(cleaned.id))) return prev;
          return [...prev, cleaned];
        });
        if (cleaned.sender_id !== currentUserId) {
          sendReadReceipt([Number(cleaned.id)]);
        }
        return;
      }

      // DELIVERED
      if (data?.type === "DELIVERED") {
        setMessages((prev) =>
          prev.map((m) =>
            Number(m.id) === Number(data.message_id)
              ? { ...m, is_delivered: true }
              : m
          )
        );
        return;
      }

      // END SESSION REQUEST (received)
      if (data?.type === "END_SESSION_REQUEST") {
        if (Number(data.user_id) === Number(currentUserId)) return;
        setAlertData({
          title: "End Session Request",
          message: `${data.user_name || "User"} wants to end the session.`,
          onAccept: async () => {
            try {
              setEnding(true);
              await endSession(Number(sessionId));
              sendChatMessage({
                type: "END_SESSION_ACCEPTED",
                session_id: sessionId,
              });
              navigateAfterEnd();
            } catch (err: any) {
              const msg = err?.response?.data?.error || "Unable to end session.";
              window.alert("End Session Failed: " + msg);
              setRequestSent(false);
            } finally {
              setEnding(false);
              setAlertData(null);
            }
          },
          onReject: () => {
            sendChatMessage({
              type: "END_SESSION_REJECTED",
              session_id: sessionId,
            });
            setAlertData(null);
          },
        });
        return;
      }

      // END SESSION ACCEPTED (remote accepted)
      if (data?.type === "END_SESSION_ACCEPTED") {
        if (!ending) navigateAfterEnd();
        return;
      }

      // END SESSION REJECTED
      if (data?.type === "END_SESSION_REJECTED") {
        window.alert("Request Rejected: User declined.");
        setRequestSent(false);
        return;
      }

      // SEEN
      if (data?.type === "SEEN") {
        setMessages((prev) =>
          prev.map((m) =>
            Number(m.id) === Number(data.message_id)
              ? { ...m, is_seen: true }
              : m
          )
        );
      }
    },
    [currentUserId, otherUserId, sessionId]
  );

  // ----- Lifecycle: Load user and session -----
  useEffect(() => {
    const loadUserAndSession = async () => {
      try {
        const tokens = await getTokens();
        if (!tokens?.access) return;

        const payload = JSON.parse(atob(tokens.access.split(".")[1]));
        const userId = Number(payload.user_id);
        setCurrentUserId(userId);
        setCurrentUserName(payload.display_name || "");

        const res = await axiosInstance.get(`/v1/session/${sessionId}/`);
        const data: SessionDetails = res.data;
        setSessionDetails(data);

        const studentId = Number(data.student_id);
        const tutorId = Number(data.tutor_id);

        if (userId === studentId) {
          setOtherUserName(data.tutor);
          setOtherUserId(Number(data.tutor_id));
        } else if (userId === tutorId) {
          setOtherUserName(data.student);
          setOtherUserId(Number(data.student_id));
        } else {
          console.warn("User does not belong to this session");
        }
      } catch (err) {
        console.error("Failed to load session/user:", err);
      } finally {
        setIsLoading(false);
      }
    };
    loadUserAndSession();
  }, [sessionId]);

  // ----- Fetch messages -----
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const res = await getMessages(Number(sessionId));
        const cleaned = res.map(normalizeMessage);
        setMessages(cleaned);
      } catch (err) {
        console.error("Fetch messages error:", err);
      }
    };
    fetchMessages();
  }, [sessionId, normalizeMessage]);

  // ----- Socket connection (reconnect on foreground) -----
  useEffect(() => {
    if (!currentUserId || !otherUserId) return;

    let mounted = true;

    const initSocket = async () => {
      try {
        const tokens = await getTokens();
        if (!tokens?.access) return;

        connectChatSocket(Number(sessionId), tokens.access, handleSocketEvent);
        socketInitialized.current = true;
      } catch (err) {
        console.error("Socket init error:", err);
      }
    };

    initSocket();

    return () => {
      mounted = false;
      disconnectChatSocket();
      socketInitialized.current = false;
    };
  }, [currentUserId, otherUserId, sessionId, handleSocketEvent]);

  // ----- App visibility handling (background/foreground) -----
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        disconnectChatSocket();
        socketInitialized.current = false;
      } else {
        if (!currentUserId || !otherUserId) return;
        (async () => {
          const tokens = await getTokens();
          if (!tokens?.access) return;
          connectChatSocket(Number(sessionId), tokens.access, handleSocketEvent);
          socketInitialized.current = true;
        })();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [currentUserId, otherUserId, sessionId, handleSocketEvent]);

  // ----- Scroll to bottom when messages change -----
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ----- Send message -----
  const handleSend = () => {
    if (!input.trim()) return;
    sendChatMessage({ type: "text", text: input.trim() });
    setInput("");
    sendTypingStatus(false);
  };

  // ----- Typing handler -----
  const handleTyping = (text: string) => {
    setInput(text);
    sendTypingStatus(true);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => sendTypingStatus(false), 1500);
  };

  // ----- End session request -----
  const handleEndSession = () => {
    if (requestSent || ending) return;
    if (!window.confirm("Do you want to request to end the session?")) return;

    try {
      setRequestSent(true);
      sendChatMessage({
        type: "END_SESSION_REQUEST",
        session_id: sessionId,
      });
      window.alert("Request Sent: Waiting for other user...");
    } catch {
      setRequestSent(false);
      window.alert("Failed to send request. Please try again.");
    }
  };

  // ----- Render loading state -----
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e] flex items-center justify-center">
        <div className="w-10 h-10 animate-spin rounded-full border-4 border-violet-400 border-t-transparent" />
      </div>
    );
  }

  const handleSubmitReport = async () => {
    if (!reportReason) {
      window.alert("Please select a reason.");
      return;
    }
    if (!reportDescription.trim()) {
      window.alert("Please enter a description.");
      return;
    }
    if (reportDescription.trim().length < 10) {
      window.alert("Please provide a little more detail.");
      return;
    }

    try {
      setReportLoading(true);
      await createReport({
        session_id: Number(sessionId),
        reason: reportReason as any,
        description: reportDescription.trim(),
      });
      window.alert("✅ Your report has been submitted successfully.");
      setShowReportModal(false);
      setReportReason("");
      setReportDescription("");
    } catch (error: any) {
      console.log("REPORT ERROR", error.response);
      window.alert(JSON.stringify(error.response?.data, null, 2));
    } finally {
      setReportLoading(false);
    }
  };

  const WARNING_MESSAGE =
    "⚠️ Please communicate respectfully. Abuse, harassment, offensive language, sharing personal contact information, or inappropriate behaviour may result in account suspension.";

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e] relative overflow-hidden flex flex-col">
      {/* Animated background blobs */}
      <div className="absolute top-0 -left-20 w-72 h-72 bg-purple-500/20 rounded-full mix-blend-multiply filter blur-3xl animate-blob" />
      <div className="absolute top-0 -right-20 w-72 h-72 bg-fuchsia-500/20 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000" />
      <div className="absolute -bottom-20 left-40 w-72 h-72 bg-cyan-500/20 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000" />

      {/* ---- Header ---- */}
      <header className="relative z-10 flex items-center justify-between px-4 py-3 bg-white/5 backdrop-blur-xl border-b border-white/10 shadow-2xl">
        <button
          onClick={() => router.back()}
          className="p-2 text-white/80 hover:text-white transition"
          aria-label="Go back"
        >
          ←
        </button>

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-white font-bold shadow-lg">
            {otherUserName?.charAt(0) || "?"}
          </div>
          <div>
            <p className="text-white font-semibold">{otherUserName || "Chat"}</p>
            <p className="text-xs text-white/60">
              {typingUser
                ? "✍️ typing..."
                : onlineStatus === "online"
                ? "🟢 Online"
                : onlineStatus === "connecting"
                ? "🟡 Connecting..."
                : "⚫ Offline"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isStudent && (
            <div className="relative">
              <button
                onClick={() => setShowMenu((v) => !v)}
                className="text-white/70 hover:text-white text-2xl px-2 py-1 transition"
              >
                ⋮
              </button>
              {showMenu && (
                <div className="absolute right-0 mt-2 w-44 bg-gray-900/90 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl overflow-hidden z-20">
                  <button
                    onClick={() => {
                      setShowMenu(false);
                      setShowReportModal(true);
                    }}
                    className="w-full text-left px-4 py-3 text-sm text-white hover:bg-white/10 transition"
                  >
                    🚨 Report Tutor
                  </button>
                </div>
              )}
            </div>
          )}

          <button
            onClick={handleEndSession}
            disabled={ending || requestSent}
            className="px-4 py-2 bg-rose-500/20 border border-rose-400/30 text-rose-300 rounded-xl font-semibold hover:bg-rose-500/30 disabled:opacity-50 transition"
          >
            End
          </button>
        </div>
      </header>

      {/* ---- Scrolling Warning Bar ---- */}
      <div className="relative z-10 overflow-hidden bg-amber-400/10 border-y border-amber-400/20 h-8">
        <style jsx>{`
          @keyframes scrollWarning {
            0% { transform: translateX(0); }
            100% { transform: translateX(-50%); }
          }
          .warning-track {
            display: flex;
            width: max-content;
            animation: scrollWarning 30s linear infinite;
          }
        `}</style>
        <div className="warning-track whitespace-nowrap py-1.5">
          <span className="text-amber-300 text-xs font-medium px-4 inline-block">
            {WARNING_MESSAGE}
          </span>
          <span className="text-amber-300 text-xs font-medium px-4 inline-block">
            {WARNING_MESSAGE}
          </span>
        </div>
      </div>

      {/* ---- Messages ---- */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 relative z-10">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-white/50">
            <span className="text-4xl mb-3">💬</span>
            <h3 className="text-lg font-semibold text-white/80">Start your conversation</h3>
            <p className="text-sm text-white/50">Messages will appear here</p>
          </div>
        ) : (
          messages.map((item, index) => {
            const isOwn = String(item.sender_id) === String(currentUserId);
            return (
              <div
                key={item.id?.toString() || index.toString()}
                className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-3 shadow-lg ${
                    isOwn
                      ? "bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white"
                      : "bg-white/10 backdrop-blur-md border border-white/10 text-white"
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{item.text}</p>
                  <div className="flex items-center justify-end gap-2 mt-2">
                    <span className="text-[10px] opacity-70">
                      {formatTime(item.timestamp)}
                    </span>
                    {isOwn && (
                      <span
                        className="text-xs"
                        style={{
                          color: item.is_seen ? "#38BDF8" : item.is_delivered ? "#CBD5F5" : "#64748B",
                        }}
                      >
                        {item.is_seen || item.is_delivered ? "✓✓" : "✓"}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* ---- Input area ---- */}
      <div className="relative z-10 border-t border-white/10 bg-white/5 backdrop-blur-xl px-4 py-3 flex items-center gap-3">
        <input
          className="flex-1 bg-gray-900/60 border-2 border-white/20 rounded-2xl px-5 py-3 text-white placeholder-white/40 focus:outline-none focus:ring-4 focus:ring-violet-500/50 focus:border-violet-400 transition"
          value={input}
          onChange={(e) => handleTyping(e.target.value)}
          placeholder="Type a message..."
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
        />
        <button
          onClick={handleSend}
          className="w-10 h-10 rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white flex items-center justify-center shadow-lg hover:scale-105 transition"
        >
          ➤
        </button>
      </div>

      {/* ---- Report Modal ---- */}
      {showReportModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-gray-900/90 backdrop-blur-xl border border-white/10 rounded-3xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-1">🚨 Report Tutor</h3>
            <p className="text-sm text-white/60 mb-4">
              Your report will be reviewed by our moderation team.
            </p>

            <label className="block text-sm font-medium text-white/80 mb-1">Reason</label>
            <select
              className="w-full bg-gray-800 border border-white/20 rounded-xl px-4 py-3 text-white mb-4 focus:ring-4 focus:ring-violet-500/50 outline-none"
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
            >
              <option value="">Select a reason</option>
              <option value="rude">Rude Behaviour</option>
              <option value="late">Tutor Was Late</option>
              <option value="poor_explanation">Poor Explanation</option>
              <option value="wrong_information">Wrong Information</option>
              <option value="harassment">Harassment</option>
              <option value="spam">Spam</option>
              <option value="other">Other</option>
            </select>

            <label className="block text-sm font-medium text-white/80 mb-1">Description</label>
            <textarea
              className="w-full bg-gray-800 border border-white/20 rounded-xl px-4 py-3 text-white h-28 focus:ring-4 focus:ring-violet-500/50 outline-none resize-none"
              value={reportDescription}
              onChange={(e) => setReportDescription(e.target.value)}
              placeholder="Describe what happened..."
            />

            <div className="flex justify-end gap-3 mt-6">
              <button
                disabled={reportLoading}
                onClick={() => {
                  setShowReportModal(false);
                  setReportReason("");
                  setReportDescription("");
                }}
                className="px-5 py-2.5 bg-white/10 border border-white/20 text-white rounded-xl font-semibold hover:bg-white/20 transition"
              >
                Cancel
              </button>
              <button
                disabled={reportLoading}
                onClick={handleSubmitReport}
                className="px-5 py-2.5 bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white rounded-xl font-bold shadow-lg hover:shadow-xl disabled:opacity-50 transition"
              >
                {reportLoading ? "Submitting..." : "Submit Report"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---- End Session Alert Modal ---- */}
      {alertData && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-gray-900/90 backdrop-blur-xl border border-white/10 rounded-3xl p-6 w-full max-w-sm shadow-2xl text-center">
            <h4 className="text-xl font-bold text-white mb-2">{alertData.title}</h4>
            <p className="text-white/70 mb-6">{alertData.message}</p>
            <div className="flex justify-center gap-4">
              {alertData.onReject && (
                <button
                  onClick={alertData.onReject}
                  className="px-5 py-2.5 bg-rose-500/20 border border-rose-400/30 text-rose-300 rounded-xl font-semibold hover:bg-rose-500/30 transition"
                >
                  Reject
                </button>
              )}
              {alertData.onAccept && (
                <button
                  onClick={alertData.onAccept}
                  className="px-5 py-2.5 bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 rounded-xl font-semibold hover:bg-emerald-500/30 transition"
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

export default ChatScreen;