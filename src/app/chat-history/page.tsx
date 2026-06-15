"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { apiGet } from "@/services/apiService";
import { useAuth } from "@/hooks/useAuth"; // adapt to your auth context/store
import styles from "./ChatHistory.module.css";

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
  const { user: currentUser } = useAuth(); // expects { id, ... }

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
    const isOwn = Number(item.sender_id) === Number(currentUser?.id);

    return (
      <div
        key={item.id}
        className={`${styles.messageRow} ${isOwn ? styles.ownRow : styles.otherRow}`}
      >
        {/* Avatar for other user (only on left side) */}
        {!isOwn && item.sender_name && (
          <div className={styles.avatar}>
            <span className={styles.avatarText}>
              {item.sender_name.charAt(0).toUpperCase()}
            </span>
          </div>
        )}

        <div
          className={`${styles.bubble} ${isOwn ? styles.ownBubble : styles.otherBubble}`}
        >
          {/* Sender name (only for other user) */}
          {!isOwn && <span className={styles.senderName}>{item.sender_name}</span>}

          {/* Text message */}
          {item.message_type === "text" && item.text && (
            <p className={`${styles.messageText} ${isOwn ? styles.ownMessageText : ""}`}>
              {item.text}
            </p>
          )}

          {/* Audio */}
          {item.message_type === "audio" && (
            <button
              className={styles.mediaCard}
              onClick={() => window.open(item.file || item.link, "_blank")}
            >
              <span className={styles.mediaEmoji}>🎧</span>
              <span className={styles.mediaText}>Play Audio</span>
            </button>
          )}

          {/* Video */}
          {item.message_type === "video" && (
            <button
              className={styles.mediaCard}
              onClick={() => window.open(item.file || item.link, "_blank")}
            >
              <span className={styles.mediaEmoji}>🎥</span>
              <span className={styles.mediaText}>Watch Video</span>
            </button>
          )}

          {/* Time */}
          <span className={`${styles.time} ${isOwn ? styles.ownTime : ""}`}>
            {formatTime(item.created_at)}
          </span>
        </div>

        {/* Optional: own avatar on the right (if you want) – skip for simplicity */}
      </div>
    );
  };

  // ---------------------------------------------------------------------------
  // Loading state
  // ---------------------------------------------------------------------------
  if (loading) {
    return (
      <div className={styles.loader}>
        <div className={styles.spinner} />
        <p>Loading chat…</p>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Error state
  // ---------------------------------------------------------------------------
  if (error) {
    return (
      <div className={styles.statusContainer}>
        <p className={styles.errorText}>{error}</p>
        <button className={styles.retryBtn} onClick={fetchMessages}>
          Retry
        </button>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Main UI
  // ---------------------------------------------------------------------------
  return (
    <div className={styles.container}>
      {/* Header */}
      <header className={styles.header}>
        <button className={styles.backBtn} onClick={() => router.back()}>
          ←
        </button>
        <div className={styles.headerCenter}>
          <div className={styles.headerAvatar}>
            <span className={styles.headerAvatarText}>
              {tutorName.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <h2 className={styles.headerName}>{tutorName}</h2>
            <p className={styles.headerStatus}>Chat History</p>
          </div>
        </div>
      </header>

      {/* Ask Again button */}
      <button
        className={styles.askAgainBtn}
        onClick={() =>
          router.push(
            `/student/post-doubt?mode=specific&tutorId=${tutorId}&tutorName=${tutorName}`
          )
        }
      >
        🚀 Ask Again with {tutorName}
      </button>

      {/* Messages container - scrollable area */}
      <div className={styles.messagesContainer}>
        {messages.length === 0 ? (
          <div className={styles.emptyBox}>
            <span className={styles.emptyEmoji}>💬</span>
            <h3 className={styles.emptyTitle}>No messages found</h3>
            <p className={styles.emptySub}>Chat history will appear here</p>
          </div>
        ) : (
          messages.map(renderMessage)
        )}
      </div>
    </div>
  );
};

export default StudentChatHistoryScreen;