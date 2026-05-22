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
import styles from "./ChatScreen.module.css";

/* ----- Constants ----- */
const PRIMARY = "#5B4CF0";
const OWN_BUBBLE = "#EEF2FF";
const OTHER_BUBBLE = "#F8FAFC";
const TEXT_DARK = "#111827";
const TEXT_MUTED = "#6B7280";
const BORDER = "#E5E7EB";

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

  const socketInitialized = useRef(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

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
        router.replace(`/submit-review/${sessionId}`);
      } else {
        router.replace("/tutor/sessions"); // adjust to your tutor sessions route
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
          sendReadReceipt([cleaned.id]);
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
              await endSession(sessionId);
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
        const res = await getMessages(sessionId);
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
        // Went to background
        disconnectChatSocket();
        socketInitialized.current = false;
      } else {
        // Came back to foreground
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
      <div className={styles.loader}>
        <div className={styles.spinner}></div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* ---- Header ---- */}
      <div className={styles.header}>
        <button
          className={styles.backButton}
          onClick={() => router.back()}
          aria-label="Go back"
        >
          ←
        </button>

        <div className={styles.profileAvatar}>
          <span className={styles.profileAvatarText}>
            {otherUserName?.charAt(0) || "?"}
          </span>
        </div>

        <div className={styles.headerInfo}>
          <span className={styles.headerName}>{otherUserName || "Chat"}</span>
          <span className={styles.headerStatus}>
            {typingUser
              ? "✍️ typing..."
              : onlineStatus === "online"
              ? "🟢 Online"
              : onlineStatus === "connecting"
              ? "🟡 Connecting..."
              : "⚫ Offline"}
          </span>
        </div>

        <button
          className={styles.endButton}
          onClick={handleEndSession}
          disabled={ending || requestSent}
        >
          End
        </button>
      </div>

      {/* ---- Messages ---- */}
      <div className={styles.messagesContainer}>
        {messages.length === 0 ? (
          <div className={styles.emptyBox}>
            <span className={styles.emptyEmoji}>💬</span>
            <h3 className={styles.emptyTitle}>Start your conversation</h3>
            <p className={styles.emptySub}>Messages will appear here</p>
          </div>
        ) : (
          messages.map((item, index) => {
            const isOwn = String(item.sender_id) === String(currentUserId);
            return (
              <div
                key={item.id?.toString() || index.toString()}
                className={`${styles.messageRow} ${
                  isOwn ? styles.rowRight : styles.rowLeft
                }`}
              >
                <div
                  className={`${styles.bubble} ${
                    isOwn ? styles.ownBubble : styles.otherBubble
                  }`}
                >
                  <p className={styles.messageText}>{item.text}</p>
                  <div className={styles.metaRow}>
                    <span className={styles.timeText}>
                      {formatTime(item.timestamp)}
                    </span>
                    {isOwn && (
                      <span
                        className={styles.readReceipt}
                        style={{
                          color: item.is_seen
                            ? "#38BDF8"
                            : item.is_delivered
                            ? "#CBD5F5"
                            : "#64748B",
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
      <div className={styles.inputContainer}>
        <input
          className={styles.input}
          value={input}
          onChange={(e) => handleTyping(e.target.value)}
          placeholder="Type a message..."
          placeholder="Type a message..."
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
        />
        <button className={styles.sendButton} onClick={handleSend}>
          ➤
        </button>
      </div>

      {/* ---- Custom Alert Modal for End Session Request ---- */}
      {alertData && (
        <div className={styles.alertOverlay}>
          <div className={styles.alertBox}>
            <h4 className={styles.alertTitle}>{alertData.title}</h4>
            <p className={styles.alertMessage}>{alertData.message}</p>
            <div className={styles.alertActions}>
              {alertData.onReject && (
                <button
                  className={styles.alertCancel}
                  onClick={alertData.onReject}
                >
                  Reject
                </button>
              )}
              {alertData.onAccept && (
                <button
                  className={styles.alertAccept}
                  onClick={alertData.onAccept}
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