"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { getTokens } from "@/services/storageService";
import {
  connectChatSocket,
  sendChatMessage,
  disconnectChatSocket,
} from "@/services/chatSocket";
import axios from "@/api/axiosInstance";
import styles from "./VideoCall.module.css";

// ----- Agora SDK (client-only import to avoid SSR issues) -----
const AgoraRTC = dynamic(() => import("agora-rtc-sdk-ng"), { ssr: false });

const APP_ID = "19789ef2ac6e48e89404f52c1c3231a5";

// ----- Types -----
interface Message {
  id: number | string;
  text: string;
  sender_id: number;
  timestamp?: string;
}

const VideoCallScreen: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionIdParam = searchParams.get("sessionId") || "";
  const sessionId = Number(sessionIdParam);

  // ----- User -----
  const [userRole, setUserRole] = useState<"student" | "tutor">("student");
  const [userId, setUserId] = useState<number | null>(null);
  const [userName, setUserName] = useState("");

  // ----- Agora Engine & Tracks -----
  const clientRef = useRef<any>(null);
  const [micTrack, setMicTrack] = useState<any>(null);
  const [screenTrack, setScreenTrack] = useState<any>(null); // screen share track
  const [remoteUsers, setRemoteUsers] = useState<any[]>([]);
  const [remoteVideoMuted, setRemoteVideoMuted] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [connectionState, setConnectionState] = useState<"disconnected" | "connecting" | "connected">("disconnected");
  const [joined, setJoined] = useState(false);
  const [remoteUid, setRemoteUid] = useState<number | null>(null);
  const [showJoinToast, setShowJoinToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const localScreenShareContainerRef = useRef<HTMLDivElement>(null);

  // ----- Timer -----
  const [seconds, setSeconds] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const formatTime = (totalSeconds: number) => {
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  // ----- Session & UI -----
  const [isLoading, setIsLoading] = useState(true);
  const [ending, setEnding] = useState(false);
  const [requestSent, setRequestSent] = useState(false);
  const [userLeftTimeoutReached, setUserLeftTimeoutReached] = useState(false);
  const [isSessionCompleted, setIsSessionCompleted] = useState(false);
  const [reviewSubmitted, setReviewSubmitted] = useState(false);

  // ----- Chat -----
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [showChatModal, setShowChatModal] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // ----- Alert/Confirm modal -----
  const [alertData, setAlertData] = useState<{
    title: string;
    message: string;
    onAccept?: () => void;
    onReject?: () => void;
  } | null>(null);

  // ---------------------------------------------------------------------------
  // Initialisation: load user, start call
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (!sessionId) return;

    const initCall = async () => {
      try {
        setIsLoading(true);

        // 1. Get user info from token
        const tokens = await getTokens();
        if (!tokens?.access) throw new Error("No token");
        const payload = JSON.parse(atob(tokens.access.split(".")[1]));
        setUserId(Number(payload.user_id));
        setUserName(payload.display_name || "");
        // role could be derived from token or stored separately, assume 'student' as fallback
        const role = payload.role || "student";
        setUserRole(role);

        // 2. Request permissions (web mic) – done later via Agora

        // 3. Fetch video session details
        const res = await axios.post(`sessions/${sessionId}/start-video/`);
        const { channel_name, token, uid } = res.data;

        // 4. Initialise Agora
        const { default: AgoraRTC } = await import("agora-rtc-sdk-ng");
        const client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
        clientRef.current = client;

        // ---- Remote user joined ----
        client.on("user-published", async (user: any, mediaType: string) => {
          await client.subscribe(user, mediaType);
          setRemoteUid(Number(user.uid));
          setShowJoinToast(true);
          setToastMessage("User joined");
          setTimeout(() => setShowJoinToast(false), 2000);

          if (mediaType === "video") {
            const remoteVideoTrack = user.videoTrack;
            remoteVideoTrack.play("remote-video-container");
            setRemoteVideoMuted(false);
          }
        });

        // ---- Remote user unpublished ----
        client.on("user-unpublished", (user: any, mediaType: string) => {
          if (mediaType === "video") {
            setRemoteVideoMuted(true);
          }
        });

        // ---- User left ----
        client.on("user-left", () => {
          setRemoteUid(null);
          setShowJoinToast(true);
          setToastMessage("User left");
          setTimeout(() => setShowJoinToast(false), 2000);
        });

        // ---- Connection state ----
        client.on("connection-state-change", (curState: string) => {
          switch (curState) {
            case "CONNECTED":
              setConnectionState("connected");
              break;
            case "CONNECTING":
              setConnectionState("connecting");
              break;
            default:
              setConnectionState("disconnected");
          }
        });

        // 5. Create microphone track only (camera OFF)
        const micAudioTrack = await AgoraRTC.createMicrophoneAudioTrack();
        setMicTrack(micAudioTrack);

        // 6. Join channel
        await client.join(APP_ID, channel_name, token, uid);
        await client.publish([micAudioTrack]); // only audio published
        setJoined(true);
        setConnectionState("connected");

        // 7. Start timer
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
      // Cleanup
      if (timerRef.current) clearInterval(timerRef.current);
      if (clientRef.current) {
        clientRef.current.leave();
        clientRef.current.removeAllListeners();
      }
    };
  }, [sessionId]);

  // ----- Screen Share Toggle -----
  const toggleScreenShare = async () => {
    const client = clientRef.current;
    if (!client) return;

    try {
      if (!isScreenSharing) {
        // Start screen share
        const { default: AgoraRTC } = await import("agora-rtc-sdk-ng");
        const screenTrack = await AgoraRTC.createScreenVideoTrack({}, "disable"); // disable camera mirroring
        setScreenTrack(screenTrack);
        await client.unpublish(micTrack);
        await client.publish([micTrack, screenTrack]); // publish mic + screen
        screenTrack.play("local-screen-container");
        setIsScreenSharing(true);
      } else {
        // Stop screen share
        await client.unpublish(screenTrack);
        screenTrack.close();
        setScreenTrack(null);
        setIsScreenSharing(false);
      }
    } catch (err) {
      console.error("Screen share error:", err);
      window.alert("Failed to toggle screen share.");
    }
  };

  // ----- Mic toggle -----
  const toggleMute = () => {
    if (!micTrack) return;
    const newMuted = !isMuted;
    if (newMuted) {
      micTrack.setEnabled(false);
    } else {
      micTrack.setEnabled(true);
    }
    setIsMuted(newMuted);
  };

  // ----- Leave Call -----
  const handleLeaveCall = async (forceEnd = false) => {
    if (ending) return;
    setEnding(true);

    try {
      if (timerRef.current) clearInterval(timerRef.current);
      const client = clientRef.current;
      if (client) {
        client.removeAllListeners();
        client.leave();
      }
      micTrack?.close();
      screenTrack?.close();

      if (forceEnd && sessionId) {
        const res = await axios.post(`sessions/${sessionId}/end-video/`);
        const completed = res.data?.session_completed;
        exitCallScreen(completed);
      } else {
        exitCallScreen(false);
      }
    } catch (err: any) {
      console.error("End error:", err);
      window.alert("Failed to end call.");
      exitCallScreen(false);
    } finally {
      setEnding(false);
    }
  };

  const exitCallScreen = (completed: boolean) => {
    if (userRole === "tutor") {
      router.replace("/tutor/sessions");
    } else {
      if (completed) {
        router.replace(`/submit-review/${sessionId}`);
      } else {
        router.replace("/student/sessions");
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
        sendChatMessage({
          type: "END_SESSION_REQUEST",
          session_id: sessionId,
        });
        window.alert("Request Sent: Waiting for other user...");
        setAlertData(null);
      },
      onReject: () => setAlertData(null),
    });
  };

  // ----- Chat Socket -----
  useEffect(() => {
    if (!sessionId) return;

    let mounted = true;
    disconnectChatSocket();

    const initChatSocket = async () => {
      const tokens = await getTokens();
      const token = tokens?.access;
      if (!token || !sessionId) return;

      connectChatSocket(sessionId, token, (data: any) => {
        if (!mounted) return;

        // End session request (incoming)
        if (data?.type === "END_SESSION_REQUEST") {
          setAlertData({
            title: "End Call Request",
            message: `${data.user_name || "User"} wants to end the call.`,
            onAccept: async () => {
              try {
                sendChatMessage({
                  type: "END_SESSION_ACCEPTED",
                  session_id: sessionId,
                });
                await handleLeaveCall(true);
              } catch {
                // ignore
              } finally {
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

        if (data?.type === "END_SESSION_ACCEPTED") {
          if (!ending) handleLeaveCall(true);
          return;
        }

        if (data?.type === "END_SESSION_REJECTED") {
          window.alert("Request Rejected: User declined to end the call.");
          setRequestSent(false);
          return;
        }

        // Chat messages
        if (data?.type === "typing" || data?.type === "USER_STATUS") return;
        if (!data?.id) return;

        const text =
          typeof data.text === "string"
            ? data.text
            : data.text?.text || "";
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
    };

    initChatSocket();

    return () => {
      mounted = false;
      disconnectChatSocket();
    };
  }, [sessionId, showChatModal]);

  // ----- Send chat message -----
  const handleSendMessage = () => {
    if (!inputText.trim()) return;
    sendChatMessage({
      type: "text",
      text: inputText.trim(),
    });
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

  // ----- Session completed & review status (student) -----
  useEffect(() => {
    const checkReview = async () => {
      try {
        const res = await axios.get(`reviews/check/${sessionId}/`);
        setReviewSubmitted(res.data.review_submitted);
      } catch {}
    };
    if (isSessionCompleted && userRole === "student") {
      checkReview();
    }
  }, [isSessionCompleted, userRole]);

  // ----- Prevent accidental page leave -----
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

  // ----- Render -----
  if (isLoading) {
    return (
      <div className={styles.loadingOverlay}>
        <div className={styles.spinner}></div>
        <p className={styles.loadingText}>Establishing connection...</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Header / Timer + Status */}
      <div className={styles.topBar}>
        <span className={styles.timer}>{formatTime(seconds)}</span>
        <div className={styles.connectionBadge}>
          <span className={styles.connectionDot} style={{ backgroundColor: dotColor }}></span>
          <span className={styles.connectionText}>{connectionStatusText}</span>
        </div>
      </div>

      {/* Session info & Live badge */}
      <div className={styles.topOverlay}>
        <div className={styles.sessionInfo}>
          <span className={styles.sessionLabel}>Session with</span>
          <span className={styles.sessionName}>
            {userRole === "student" ? "Tutor" : "Student"}
          </span>
        </div>
        <div className={styles.liveBadge}>
          <span className={styles.liveDot}></span>
          <span className={styles.liveText}>Live</span>
        </div>
      </div>

      {/* Remote Video Area */}
      <div className={styles.remoteContainer}>
        {remoteUid ? (
          <div id="remote-video-container" className={styles.remoteVideo}></div>
        ) : remoteVideoMuted ? (
          <div className={styles.placeholder}>
            <span className={styles.placeholderIcon}>📵</span>
            <p>Camera is off</p>
          </div>
        ) : (
          <div className={styles.placeholder}>
            <div className={styles.spinner}></div>
            <p>Waiting for other user...</p>
          </div>
        )}
      </div>

      {/* Local Screen Share Preview (if sharing) */}
      {isScreenSharing && (
        <div className={styles.localScreenContainer}>
          <div id="local-screen-container" className={styles.localScreenVideo}></div>
        </div>
      )}

      {/* No local camera (camera always off per requirement) */}
      <div className={styles.localCameraOff}>
        <span className={styles.localInitial}>{userName.charAt(0)?.toUpperCase() || "?"}</span>
      </div>

      {/* User joined/left toast */}
      {showJoinToast && (
        <div className={styles.toast}>
          <span>👤 {toastMessage}</span>
        </div>
      )}

      {/* Control Bar */}
      <div className={styles.controlBar}>
        {/* Mic */}
        <button
          className={`${styles.controlButton} ${isMuted ? styles.controlButtonActive : ""}`}
          onClick={toggleMute}
        >
          {isMuted ? "🔇" : "🎤"}
        </button>

        {/* Screen Share (camera removed) */}
        <button
          className={`${styles.controlButton} ${isScreenSharing ? styles.controlButtonActive : ""}`}
          onClick={toggleScreenShare}
        >
          🖥️
        </button>

        {/* Chat */}
        <button
          className={styles.controlButton}
          onClick={() => {
            setShowChatModal(true);
            setUnreadCount(0);
          }}
        >
          💬
          {unreadCount > 0 && <span className={styles.badge}>{unreadCount}</span>}
        </button>

        {/* End Call */}
        <button className={styles.endCallButton} onClick={handleEndRequest}>
          📞
        </button>
      </div>

      {/* Chat Modal */}
      {showChatModal && (
        <div className={styles.chatModalOverlay} onClick={() => setShowChatModal(false)}>
          <div className={styles.chatModal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.chatHeader}>
              <h3>Live Chat</h3>
              <button className={styles.chatClose} onClick={() => setShowChatModal(false)}>
                ✕
              </button>
            </div>
            <div className={styles.chatMessagesContainer}>
              {messages.length === 0 ? (
                <p className={styles.emptyChat}>No messages yet</p>
              ) : (
                messages.map((msg, idx) => {
                  const isOwn = Number(msg.sender_id) === Number(userId);
                  return (
                    <div
                      key={idx}
                      className={`${styles.messageBubble} ${
                        isOwn ? styles.ownBubble : styles.otherBubble
                      }`}
                    >
                      <p style={{ color: isOwn ? "#fff" : "#fff" }}>{msg.text}</p>
                    </div>
                  );
                })
              )}
            </div>
            <div className={styles.chatInputWrapper}>
              <input
                className={styles.chatInput}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Type message..."
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSendMessage();
                }}
              />
              <button className={styles.sendButton} onClick={handleSendMessage}>
                ➤
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Confirm Modal (for End Request) */}
      {alertData && (
        <div className={styles.confirmOverlay}>
          <div className={styles.confirmBox}>
            <h4>{alertData.title}</h4>
            <p>{alertData.message}</p>
            <div className={styles.confirmActions}>
              {alertData.onReject && (
                <button className={styles.confirmReject} onClick={alertData.onReject}>
                  Reject
                </button>
              )}
              {alertData.onAccept && (
                <button className={styles.confirmAccept} onClick={alertData.onAccept}>
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