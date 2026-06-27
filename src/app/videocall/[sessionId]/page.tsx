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
import styles from "./VideoCall.module.css";

import { useCall } from '@/contexts/CallContext';

// ----- Agora SDK (client-only import to avoid SSR issues) -----

const APP_ID = "19789ef2ac6e48e89404f52c1c3231a5";
let AgoraRTC: any = null;

// ----- Types -----
interface Message {
  id: number | string;
  text: string;
  sender_id: number;
  timestamp?: string;
}

const VideoCallScreen: React.FC = () => {
  const router = useRouter();
  const params = useParams();

  const sessionIdParam =
    Array.isArray(params.sessionId)
      ? params.sessionId[0]
      : params.sessionId;

  const sessionId =
    sessionIdParam
      ? Number(sessionIdParam)
      : null;

  console.log(
    "🔥 SESSION ID:",
    sessionId
  );

  const {
    startCall,
    minimizeCall,
    leaveAgoraCall,

    clientRef,
    micTrackRef,
    cameraTrackRef,
    screenTrackRef,

    joinAgoraCall,

    remoteUid,
    setRemoteUid,
  } = useCall();

  // ----- User -----
  const [userRole, setUserRole] = useState<"student" | "tutor">("student");
  const [userId, setUserId] = useState<number | null>(null);
  const [userName, setUserName] = useState("");

  // ----- Agora Engine & Tracks -----

  const callInitializedRef =
  useRef(false);
  const localVideoRef =
  useRef<HTMLDivElement>(null);
  const [micTrack, setMicTrack] = useState<any>(null);
  const [screenTrack, setScreenTrack] = useState<any>(null); // screen share track
  const [remoteUsers, setRemoteUsers] = useState<any[]>([]);
  const [remoteVideoMuted, setRemoteVideoMuted] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [connectionState, setConnectionState] = useState<"disconnected" | "connecting" | "connected">("disconnected");
  const {
    joined,
    setJoined,
  } = useCall();
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
    if (
      sessionId === null ||
      Number.isNaN(sessionId)
    ) {
      console.log(
        "❌ INVALID SESSION ID"
      );
      return;
    }

    const initCall = async () => {


      if (
        clientRef.current &&
        joined
      ) {

        console.log(
          'Reusing active call'
        );

        setIsLoading(false);

        return;
      }

      if (
        callInitializedRef.current
      ) {

        console.log(
          "⚠️ Call already initialized"
        );

        return;
      }

      if (
        clientRef.current
      ) {

        console.log(
          "⚠️ Agora client already exists"
        );

        return;
      }

      callInitializedRef.current =
        true;
      const AgoraModule = await import(
        "agora-rtc-sdk-ng"
      );

      AgoraRTC = AgoraModule.default;

      console.log("✅ Agora SDK Loaded");
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
        if (
          clientRef.current
        ) {

          console.log(
            "⚠️ Reusing existing Agora client"
          );

          return;
        }

        // Safety: if a client somehow already exists,
        // remove old listeners before replacing it.
        (clientRef.current as any)?.removeAllListeners?.();

        const client =
          AgoraRTC.createClient({
            mode: "rtc",
            codec: "vp8",
          });

        clientRef.current =
          client;

        console.log("🎥 Agora client created");

        // ---- Remote user unpublished ----
        client.on(
          "user-published",
          async (
            user: any,
            mediaType: "video" | "audio"
          ) => {

            console.log(
              "🔥 USER PUBLISHED:",
              user.uid,
              mediaType
            );

            await client.subscribe(user, mediaType);

            console.log(
              "✅ SUBSCRIBED TO:",
              mediaType
            );

            setRemoteUid(Number(user.uid));

            setShowJoinToast(true);

            setToastMessage("User joined");

            if (
              mediaType === "video" &&
              user.videoTrack
            ) {

              console.log(
                "📺 PLAYING REMOTE VIDEO"
              );

              user.videoTrack.play(
                "remote-video-container"
              );
            }

            if (
              mediaType === "audio" &&
              user.audioTrack
            ) {

              console.log(
                "🔊 PLAYING REMOTE AUDIO"
              );

              user.audioTrack.play();
            }
          }
        );

        // ---- User left ----
        client.on(
          "user-left",
          (user: any) => {
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
        console.log("🎤 REQUESTING CAMERA/MIC");

        let microphoneTrack;
        let cameraTrack;

        try {

          const tracks =
            await AgoraRTC.createMicrophoneAndCameraTracks();

          microphoneTrack = tracks[0];
          cameraTrack = tracks[1];

          console.log("✅ CAMERA/MIC CREATED");
          console.log("🚀 JOINING CHANNEL:", channel_name);
          console.log("🚀 UID:", uid);

        } catch (err) {

          callInitializedRef.current =
            false;

          console.error(
            "❌ TRACK CREATION FAILED:",
            err
          );

          return;
        }

        setMicTrack(
          microphoneTrack
        );

        joinAgoraCall(
          client,
          microphoneTrack,
          cameraTrack
        );

        console.log("🚀 Joining Agora", {
          sessionId,
          channel: channel_name,
          uid,
        });

        await client.join(
          APP_ID,
          channel_name,
          token,
          uid
        );

        console.log("✅ Agora join completed");

        setTimeout(() => {

          cameraTrack.play(
            "local-video-container"
          );

        }, 500);

        console.log("📷 LOCAL CAMERA STARTED");

        console.log("📡 PUBLISHING TRACKS");

        await client.publish([
          microphoneTrack,
          cameraTrack,
        ]);


        console.log("📡 TRACKS PUBLISHED");

        console.log("✅ Audio + Video published");

        console.log("Published tracks"); // only audio published
        setJoined(true);
        startCall(sessionId);
        setConnectionState("connected");

        // 7. Start timer
        timerRef.current = setInterval(() => {
          setSeconds((prev) => prev + 1);
        }, 1000);
      } catch (err) {
        console.error("Init error:", err);
        callInitializedRef.current = false;

        clientRef.current = null; 
        window.alert("Failed to start video call.");
      } finally {
        setIsLoading(false);
      }
    };

    initCall();

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }

      console.log(
        "VideoCallScreen unmounted - keeping Agora alive"
      );
    };
  }, [sessionId]);

  // ----- Screen Share Toggle -----
  const toggleScreenShare = async () => {
    const client = clientRef.current;
    if (!client) return;

    try {
      if (!isScreenSharing) {
        // Start screen share
        const screenTrack = await AgoraRTC.createScreenVideoTrack({}, "disable"); // disable camera mirroring
        setScreenTrack(screenTrack);
        screenTrackRef.current =
          Array.isArray(screenTrack)
            ? screenTrack[0]
            : screenTrack;
        await client.unpublish(micTrack);
        if (Array.isArray(screenTrack)) {
          await client.publish([micTrack, ...screenTrack]);
        } else {
          await client.publish([micTrack, screenTrack]);
        }
        screenTrack.play("local-screen-container");
        setIsScreenSharing(true);
      } else {
        // Stop screen share
        await client.unpublish(screenTrack);
        if (Array.isArray(screenTrack)) {
          screenTrack.forEach(
          (track: any) => track.close()
        );
        } else {
          screenTrack?.close();
        }
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
  const handleLeaveCall = async (
    forceEnd = false
  ) => {

    if (ending) {
      console.log(
        "⚠️ Leave already in progress"
      );
      return;
    }

    setEnding(true);

    try {

      if (timerRef.current) {
        clearInterval(
          timerRef.current
        );
      }

      callInitializedRef.current =
        false;


      if (
        forceEnd &&
        sessionId
      ) {

        try {

          await axios.post(
            `sessions/${sessionId}/end-video/`
          );

        } catch (err) {

          console.error(
            "Failed to end session:",
            err
          );

        }

      }

      await leaveAgoraCall();

      disconnectChatSocket();

      exitCallScreen(
        forceEnd
      );

    } catch (err) {

      console.error(
        "Leave call error:",
        err
      );

      exitCallScreen(
        false
      );

    } finally {

      setEnding(false);

    }
  };

  const exitCallScreen = (completed: boolean) => {
    if (userRole === "tutor") {
      router.replace("/tutor/sessions");
    } else {
      if (completed) {
        router.replace(`/student/submit-review/${sessionId}`);
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

  const showCallNotification =
    (sessionId: number) => {

      if (
        typeof window === 'undefined' ||
        !('Notification' in window) ||
        Notification.permission !== 'granted'
      ) {
        return;
      } {
        return;
      }

      const notification =
        new Notification(
          'Knowmato Call',
          {
            body:
              'Click to return to your active session',
            icon:
              '/logo.png',
            tag:
              `call-${sessionId}`,
          }
        );

      notification.onclick =
        () => {

          window.focus();

          window.focus();

          window.open(
            `/videocall/${sessionId}`,
            "_self"
          );
        };
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
  }, [sessionId]);

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

      {/* Local Video Preview */}
      <div className={styles.localPreviewWrapper}>
        <div
          ref={localVideoRef}
          id="local-video-container"
          className={styles.localPreviewVideo}
        />
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

        <button
          onClick={() => {

            minimizeCall();

            showCallNotification(
              sessionId!
            );

            router.replace(
              userRole === 'tutor'
                ? '/tutor/dashboard'
                : '/student/dashboard'
            );

          }}
        >
          _
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
        <button className={styles.endCallButton} onClick={() => {
                                                    setAlertData({
                                                      title: "End Session",
                                                      message: "Are you sure you want to end this session?",
                                                      onAccept: async () => {
                                                        await handleLeaveCall(true);
                                                        setAlertData(null);
                                                      },
                                                      onReject: () => setAlertData(null),
                                                    });
                                                  }}>
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