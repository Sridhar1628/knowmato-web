"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { getTokens } from "@/services/storageService";
import { connectSocket, disconnectSocket } from "@/services/versionSocketService";
import { getOnlineTutors } from "@/services/v1Service";
import styles from "./MatchingScreen.module.css";

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
  const [doubtId, setDoubtId] =
  useState("");

  const [

    acceptedTutor,

    setAcceptedTutor,

  ] = useState<any>(null);

  const [

    connectionStage,

    setConnectionStage,

  ] = useState<
    'matching' |
    'accepted' |
    'connecting'
  >('matching');

  const [isConnecting, setIsConnecting] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tutors, setTutors] = useState<Tutor[]>([]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(
        window.location.search
      );

      setDoubtId(
        params.get("doubtId") || ""
      );
    }
  }, []);

  // Fetch online tutors on mount
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

  // Socket connection & event handling
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

            // Ignore events for other doubts
            if (
                data?.doubt_id &&
                Number(data.doubt_id) !== currentDoubtId
            ) {
                console.log("Ignoring event for different doubt");
                return;
            }

            switch (event) {
                case "TUTOR_ACCEPTED":
                case "POOL_DOUBT_ACCEPTED":
                case "SESSION_STARTED":
                case "DIRECT_ACCEPTED": {

                  const sessionId =
                    data?.session_id;

                  if (!sessionId) {
                    return;
                  }

                  setAcceptedTutor(data);

                  setConnectionStage(
                    "accepted"
                  );

                  setTimeout(() => {

                    setConnectionStage(
                      "connecting"
                    );

                  }, 2500);

                  setTimeout(() => {

                    const sessionType = (
                      data?.session_type || ""
                    ).toLowerCase();

                    if (
                      sessionType ===
                      "live_video"
                    ) {

                      router.replace(
                        `/videocall/${sessionId}`
                      );

                    } else {

                      router.replace(
                        `/chat/${sessionId}`
                      );

                    }

                  }, 5000);

                  break;
                }

                case "DIRECT_REJECTED":
                alert(
                    "The selected tutor is not available. Finding another tutor..."
                );
                break;

                case "MATCHING_TIMEOUT":
                setError(
                    "No tutors found at the moment. Please try again later."
                );
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
      if (socketConnected) {
        disconnectSocket();
      }
    };
  }, [doubtId, router]);

  // Error alert
  useEffect(() => {
    if (error) {
      alert(error);
      router.back();
    }
  }, [error, router]);

  const handleCancel = () => {
    const confirmed = window.confirm(
      "Are you sure you want to stop searching for a tutor?"
    );
    if (confirmed) {
      disconnectSocket();
      router.back();
    }
  };

  // Error state
  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.errorEmoji}>⚠️</div>
        <h2 className={styles.errorTitle}>Matching Failed</h2>
        <p className={styles.errorMessage}>{error}</p>
        <button className={styles.backButton} onClick={() => router.back()}>
          Go Back
        </button>
      </div>
    );
  }

  if (
  connectionStage ===
  "accepted"
) {

  return (

      <div
        className={
          styles.container
        }
      >

        <div
          className={
            styles.successAnimation
          }
        >

          <div
            className={
              styles.bigCheck
            }
          >
            ✅
          </div>

          <h1>
            Tutor Accepted!
          </h1>

          <p>
            {
              acceptedTutor?.display_name ||
              "A tutor"
            }
            {" "}
            accepted your request
          </p>

        </div>

      </div>

    );
  }

  if (
  connectionStage ===
  "connecting"
) {

  return (

      <div
        className={
          styles.container
        }
      >

        <div
          className={
            styles.connectingAnimation
          }
        >

          <div
            className={
              styles.handshake
            }
          >
            🤝
          </div>

          <h1>
            Connecting...
          </h1>

          <p>
            Preparing your session
          </p>

        </div>

      </div>

    );
  }

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.topSection}>
        <h1 className={styles.title}>Finding Best Tutors For You...</h1>
        <p className={styles.subtitle}>
          Please wait while we find available experts.
        </p>
      </div>

      {/* Radar */}
      <div className={styles.radarContainer}>
        <div className={styles.outerCircle}></div>
        <div className={styles.middleCircle}></div>

        {/* Rotating radar line */}
        <div className={styles.radarLine}></div>

        {/* Pulsing center */}
        <div className={styles.centerCircle}>
          <span className={styles.centerIcon}>👤</span>
        </div>
      </div>

      {/* Tutor list */}
      <div className={styles.matchingCard}>
        <h3 className={styles.matchingTitle}>Top Matching Tutors</h3>

        {tutors.map((tutor) => (
          <div key={tutor.id} className={styles.tutorRow}>
            <div className={styles.avatar}>
              <span className={styles.avatarText}>
                {tutor.display_name?.charAt(0)}
              </span>
            </div>

            <div style={{ flex: 1 }}>
              <p className={styles.tutorName}>{tutor.display_name}</p>
              {tutor.is_verified && (
                <span className={styles.verifiedBadge}>✔ Verified</span>
              )}
              {tutor.is_top_tutor && (
                <span className={styles.topTutorBadge}>TOP</span>
              )}
              <p className={styles.tutorSubject}>{tutor.skills}</p>
            </div>

            <div className={styles.tutorMeta}>
              <span className={styles.rating}>
                ⭐ {tutor.average_rating || 0}
              </span>
              <span className={styles.online}>Online</span>
            </div>
          </div>
        ))}
      </div>

      {/* Status */}
      <div className={styles.bottomBox}>
        <div className={styles.spinner}></div>
        <span className={styles.statusText}>Matching you with tutors...</span>
      </div>

      {/* Current Affairs */}
      <button
        className={styles.affairsButton}
        onClick={() =>
          alert(
            "India launched a new AI education initiative for students in 2026.\n\nPython and AI remain top in-demand skills globally."
          )
        }
      >
        📰 Know Current Affairs While Waiting
      </button>

      {/* Cancel */}
      <button className={styles.cancelButton} onClick={handleCancel}>
        Cancel Search
      </button>
    </div>
  );
}