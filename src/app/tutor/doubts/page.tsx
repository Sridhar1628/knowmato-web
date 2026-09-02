"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { getTutorPoolDoubts, AcceptPoolDoubt } from "@/services/v1Service";
import { subscribeSocket } from "@/services/socketEventBus";
import { SocketEvents } from "@/services/versionSocketEvents";
import { useTranslation } from "react-i18next";
import AlertService from "@/services/alertService";
import {
  tutorPoolCache,
  subscribeTutorPool,
  setTutorPool,
  addPoolDoubt,
  acceptPoolDoubt,
  removePoolDoubt,
  clearTutorPool,
} from "@/store/tutorPoolRealtime";

// ============================================================
// TYPES
// ============================================================

interface Doubt {
  doubt_id: number;
  title: string;
  description: string;
  category: string;
  preferred_explanation: "text" | "audio" | "video_recorded" | "live_video" | string;
  mode: string;
  status: "open" | "assigned" | "completed" | "cancelled" | "refunded" | string;
  created_at: string;
  session_id: number | null;
  session_type: "chat" | "audio" | "video_recorded" | "live_video" | null;
  session_status: "scheduled" | "active" | "completed" | "cancelled" | string | null;
  price: number;
  expires_in: number | null;
  student: {
    id: number;
    name: string;
  };
}

// ============================================================
// CATEGORY
// ============================================================

const CATEGORY_KEYS: Record<string, string> = {
  All: "common.all",
  Other: "common.other",
  Python: "Python",
  JavaScript: "JavaScript",
  Java: "Java",
  "C++": "C++",
  "Data Structures": "Data Structures",
  React: "React",
};

// ============================================================
// PAGE
// ============================================================

export default function TutorDoubtsPage() {
  const { t } = useTranslation();
  const router = useRouter();

  // ----------------------------------------------------------
  // LOCAL SOURCE OF TRUTH
  // ----------------------------------------------------------
  const [doubts, setDoubts] = useState<Doubt[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [activeTab, setActiveTab] = useState<"new" | "ongoing" | "completed">("new");
  const [acceptingId, setAcceptingId] = useState<number | null>(null);
  const [navigatingId, setNavigatingId] = useState<number | null>(null);
  const hasNavigated = useRef(false);

  // ==========================================================
  // NORMALIZE API RESPONSE
  // ==========================================================
  const extractDoubts = (res: any): Doubt[] => {
    // Handle cases where res is already an array
    if (Array.isArray(res)) return res;

    // Try different possible structures
    const data =
      res?.data?.data?.doubts ?? // { data: { data: { doubts: [...] } } }
      res?.data?.doubts ??       // { data: { doubts: [...] } }
      res?.data ??               // { data: [...] } (unlikely)
      res?.doubts ??             // { doubts: [...] }
      [];                        // fallback

    return Array.isArray(data) ? data : [];
  };

  // ==========================================================
  // FETCH
  // ==========================================================
  const fetchDoubts = useCallback(async (showLoader = true) => {
    try {
      if (showLoader) setLoading(true);
      setRefreshing(false);

      const res = await getTutorPoolDoubts();
      console.log("📦 TUTOR POOL API RESPONSE:", res);

      const apiDoubts = extractDoubts(res);
      console.log("📚 TUTOR POOL DOUBTS:", apiDoubts);

      // Update local state
      setDoubts(apiDoubts);

      // Update realtime cache (only open and assigned)
      const open = apiDoubts.filter((d) => d.status === "open");
      const assigned = apiDoubts.filter((d) => d.status === "assigned");
      setTutorPool(open, assigned);
    } catch (error) {
      console.error("❌ Fetch pool doubts error:", error);
      AlertService.error("Unable to Load Doubts", t("availableDoubts.loadError"));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [t]);

  // ==========================================================
  // INITIAL LOAD
  // ==========================================================
  useEffect(() => {
    void fetchDoubts(true);
  }, [fetchDoubts]);

  // ==========================================================
  // CACHE SUBSCRIPTION (we don't replace local data here)
  // ==========================================================
  useEffect(() => {
    const unsubscribe = subscribeTutorPool(() => {
      // The realtime cache is updated by socket events below.
    });

    return () => {
      if (typeof unsubscribe === "function") {
        unsubscribe();
      }
    };
  }, []);

  // ==========================================================
  // ACCEPT DOUBT
  // ==========================================================
  const handleAccept = async (doubtId: number, title: string) => {
    AlertService.confirm(
      "Accept Doubt",
      t("availableDoubts.acceptMessage", { title }),
      async () => {
        setAcceptingId(doubtId);
        try {
          const res = await AcceptPoolDoubt({ doubt_id: doubtId });
          console.log("✅ ACCEPT POOL RESPONSE:", res);

          // Support different wrappers
          const responseData = res?.data?.data ?? res?.data ?? res ?? {};
          const sessionId = responseData?.session_id ?? null;

          // Update local state
          setDoubts((prev) =>
            prev.map((item) =>
              item.doubt_id === doubtId
                ? { ...item, status: "assigned", session_id: sessionId ?? item.session_id }
                : item
            )
          );

          // Update cache
          acceptPoolDoubt(doubtId, sessionId);

          AlertService.success("Doubt Accepted", t("availableDoubts.acceptSuccess"));
          setActiveTab("ongoing");
        } catch (error) {
          console.error("❌ Accept error:", error);
          AlertService.error("Accept Failed", t("availableDoubts.acceptError"));
        } finally {
          setAcceptingId(null);
        }
      }
    );
  };

  // ==========================================================
  // SOCKET EVENTS
  // ==========================================================
  useEffect(() => {
    const unsubscribe = subscribeSocket(async (event, data) => {
      console.log("📡 POOL EVENT:", event, data);

      // ----- NEW POOL DOUBT -----
      if (event === SocketEvents.NEW_POOL_DOUBT) {
        console.log("🆕 NEW POOL DOUBT RECEIVED:", data);
        const doubtId = Number(data?.doubt_id);
        if (!Number.isFinite(doubtId) || doubtId <= 0) {
          console.error("❌ Invalid NEW_POOL_DOUBT payload:", data);
          return;
        }

        try {
          // Refresh entire pool to get complete data
          const res = await getTutorPoolDoubts();
          const latestDoubts = extractDoubts(res);
          setDoubts(latestDoubts);

          const open = latestDoubts.filter((d) => d.status === "open");
          const assigned = latestDoubts.filter((d) => d.status === "assigned");
          setTutorPool(open, assigned);
          setActiveTab("new");
        } catch (error) {
          console.error("❌ Failed to refresh after NEW_POOL_DOUBT:", error);
          // No fallback doubt is added — we avoid default placeholders.
          // The next manual refresh will pick up the new doubt.
        }
        return;
      }

      // ----- DOUBT ACCEPTED -----
      if (event === SocketEvents.POOL_DOUBT_ACCEPTED) {
        const doubtId = Number(data?.doubt_id);
        const sessionId = data?.session_id ? Number(data.session_id) : null;
        if (!doubtId) return;

        setDoubts((prev) =>
          prev.map((item) =>
            item.doubt_id === doubtId
              ? {
                  ...item,
                  status: "assigned",
                  session_id: sessionId ?? item.session_id,
                  session_type: data?.session_type ?? item.session_type,
                  session_status: data?.session_status ?? "scheduled",
                }
              : item
          )
        );

        if (sessionId !== null) acceptPoolDoubt(doubtId, sessionId);

        // Navigate if this tutor accepted and we haven't already
        if (!hasNavigated.current && sessionId) {
          hasNavigated.current = true;
          setTimeout(() => {
            const type = data?.session_type?.toLowerCase();
            if (type === "live_video") router.push(`/videocall/${sessionId}`);
            else router.push(`/chat/${sessionId}`);
          }, 500);
        }
        return;
      }

      // ----- SESSION STARTED -----
      if (event === SocketEvents.SESSION_STARTED) {
        const doubtId = Number(data?.doubt_id);
        if (!doubtId) return;
        setDoubts((prev) =>
          prev.map((item) =>
            item.doubt_id === doubtId
              ? {
                  ...item,
                  session_id: data?.session_id ?? item.session_id,
                  session_type: data?.session_type ?? item.session_type,
                  session_status: "active",
                }
              : item
          )
        );
        return;
      }

      // ----- SESSION UPDATED -----
      if (event === "SESSION_UPDATED") {
        const doubtId = Number(data?.doubt_id);
        if (!doubtId) return;
        setDoubts((prev) =>
          prev.map((item) =>
            item.doubt_id === doubtId
              ? {
                  ...item,
                  session_id: data?.session_id ?? item.session_id,
                  session_type: data?.session_type ?? item.session_type,
                  session_status: data?.session_status ?? item.session_status,
                }
              : item
          )
        );
        return;
      }

      // ----- DOUBT STATUS UPDATED -----
      if (event === "DOUBT_STATUS_UPDATED") {
        const doubtId = Number(data?.doubt_id);
        const newStatus = data?.status;
        if (!doubtId || !newStatus) return;

        // Cancelled/refunded: remove entirely
        if (newStatus === "cancelled" || newStatus === "refunded") {
          setDoubts((prev) => prev.filter((item) => item.doubt_id !== doubtId));
          removePoolDoubt(doubtId);
          return;
        }

        // Completed: keep but update
        if (newStatus === "completed") {
          setDoubts((prev) =>
            prev.map((item) =>
              item.doubt_id === doubtId
                ? {
                    ...item,
                    status: "completed",
                    session_status: data?.session_status ?? "completed",
                    session_id: data?.session_id ?? item.session_id,
                    session_type: data?.session_type ?? item.session_type,
                  }
                : item
            )
          );
          removePoolDoubt(doubtId);
          return;
        }

        // Other statuses
        setDoubts((prev) =>
          prev.map((item) =>
            item.doubt_id === doubtId
              ? {
                  ...item,
                  status: newStatus,
                  session_id: data?.session_id ?? item.session_id,
                  session_type: data?.session_type ?? item.session_type,
                  session_status: data?.session_status ?? item.session_status,
                }
              : item
          )
        );
        return;
      }
    });

    return unsubscribe;
  }, [router]);

  // ==========================================================
  // RESET NAVIGATION FLAG
  // ==========================================================
  useEffect(() => {
    const reset = () => { hasNavigated.current = false; };
    window.addEventListener("focus", reset);
    return () => window.removeEventListener("focus", reset);
  }, []);

  // ==========================================================
  // REFRESH
  // ==========================================================
  const onRefresh = async () => {
    setRefreshing(true);
    await fetchDoubts(false);
  };

  // ==========================================================
  // FORMAT TIME
  // ==========================================================
  const formatTimeAgo = (dateStr: string) => {
    const now = new Date();
    const created = new Date(dateStr);
    const diffMin = Math.floor((now.getTime() - created.getTime()) / 60000);
    if (diffMin < 1) return t("availableDoubts.justNow");
    if (diffMin < 60) return t("availableDoubts.minAgo", { count: diffMin });
    const hrs = Math.floor(diffMin / 60);
    return t("availableDoubts.hrAgo", { count: hrs });
  };

  // ==========================================================
  // CATEGORY LABEL
  // ==========================================================
  const getCategoryLabel = (category: string) => {
    return CATEGORY_KEYS[category] ? t(CATEGORY_KEYS[category]) : category;
  };

  // ==========================================================
  // SESSION INFO
  // ==========================================================
  const getSessionInfo = (item: Doubt) => {
    const type = (item.session_type || item.preferred_explanation || "text").toLowerCase();
    switch (type) {
      case "live_video":
        return { icon: "📹", label: "Live Video", color: "violet" };
      case "audio":
        return { icon: "🎧", label: "Audio", color: "cyan" };
      case "video_recorded":
        return { icon: "🎥", label: "Recorded Video", color: "orange" };
      case "chat":
      case "text":
      default:
        return { icon: "💬", label: "Text Chat", color: "emerald" };
    }
  };

  // ==========================================================
  // IS VIDEO
  // ==========================================================
  const isVideo = (item: Doubt) => {
    return item.session_type === "live_video" || item.preferred_explanation === "live_video";
  };

  // ==========================================================
  // FILTERED DATA
  // ==========================================================
  const filteredDoubts = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return doubts.filter((item) => {
      // Tab filter
      if (activeTab === "new" && item.status !== "open") return false;
      if (activeTab === "ongoing" && item.status !== "assigned") return false;
      if (activeTab === "completed" && item.status !== "completed") return false;

      // Search
      if (
        query &&
        !item.title.toLowerCase().includes(query) &&
        !item.description.toLowerCase().includes(query) &&
        !item.category.toLowerCase().includes(query) &&
        !item.student.name.toLowerCase().includes(query)
      ) {
        return false;
      }

      // Category filter
      if (selectedCategory !== "All" && item.category.toLowerCase() !== selectedCategory.toLowerCase()) {
        return false;
      }

      return true;
    });
  }, [doubts, activeTab, searchQuery, selectedCategory]);

  // ==========================================================
  // COUNTS
  // ==========================================================
  const newCount = useMemo(() => doubts.filter((item) => item.status === "open").length, [doubts]);
  const ongoingCount = useMemo(() => doubts.filter((item) => item.status === "assigned").length, [doubts]);
  const completedCount = useMemo(() => doubts.filter((item) => item.status === "completed").length, [doubts]);

  // ==========================================================
  // CONTINUE / JOIN
  // ==========================================================
  const handleSession = async (item: Doubt) => {
    if (item.status !== "assigned") {
      AlertService.warning("Session Unavailable", t("availableDoubts.sessionNoLongerOngoing", "This session is no longer ongoing."),[]);
      return;
    }
    if (!item.session_id) {
      AlertService.warning("Session Not Ready", t("availableDoubts.sessionNotReady", "This session is not ready yet. Please refresh shortly."),[]);
      return;
    }
    const sessionId = Number(item.session_id);
    if (!Number.isFinite(sessionId) || sessionId <= 0) {
      AlertService.error("Invalid Session", t("availableDoubts.invalidSession", "Invalid session."));
      return;
    }

    setNavigatingId(item.doubt_id);
    try {
      const type = (item.session_type || item.preferred_explanation || "chat").toLowerCase();
      if (type === "live_video" || type === "video_recorded" || type === "audio") {
        router.push(`/videocall/${sessionId}`);
      } else {
        router.push(`/chat/${sessionId}`);
      }
    } finally {
      setTimeout(() => setNavigatingId(null), 1000);
    }
  };

  // ==========================================================
  // RENDER CARD
  // ==========================================================
  const renderCard = (item: Doubt) => {
    const isNew = item.status === "open";
    const isOngoing = item.status === "assigned";
    const isCompleted = item.status === "completed";
    const sessionInfo = getSessionInfo(item);
    const sessionCompleted = isCompleted || item.session_status === "completed";
    const sessionReady = !!item.session_id;
    const canContinueSession = isOngoing && sessionReady && !sessionCompleted;

    return (
      <motion.div
        key={item.doubt_id}
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96 }}
        layout
        className="group bg-white/[0.055] backdrop-blur-xl rounded-2xl p-5 border border-white/10 shadow-xl hover:border-violet-400/40 hover:bg-white/[0.075] transition-all duration-300 w-full"
      >
        {/* Top: session type + time */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold border ${
            sessionInfo.color === "violet" ? "bg-violet-500/15 text-violet-300 border-violet-400/25" :
            sessionInfo.color === "cyan" ? "bg-cyan-500/15 text-cyan-300 border-cyan-400/25" :
            sessionInfo.color === "orange" ? "bg-orange-500/15 text-orange-300 border-orange-400/25" :
            "bg-emerald-500/15 text-emerald-300 border-emerald-400/25"
          }`}>
            <span>{sessionInfo.icon}</span>
            <span>{sessionInfo.label}</span>
          </div>
          <span className="text-xs text-white/45 whitespace-nowrap">{formatTimeAgo(item.created_at)}</span>
        </div>

        {/* Title & description */}
        <h3 className="text-lg font-bold text-white mb-1 line-clamp-2">{item.title}</h3>
        <p className="text-sm text-white/65 leading-6 line-clamp-2 mb-4">{item.description}</p>

        {/* Student info */}
        <div className="flex items-center gap-2 mb-4 text-sm text-white/65">
          <div className="w-8 h-8 rounded-full bg-violet-500/15 border border-violet-400/20 flex items-center justify-center">👤</div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-white/35 font-bold">Student</p>
            <p className="text-sm text-white/80 font-semibold">{item.student.name}</p>
          </div>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-2 mb-4">
          <span className="bg-white/[0.07] text-white/75 px-3 py-1.5 rounded-lg text-xs font-semibold border border-white/10">📂 {item.category}</span>
          <span className="bg-white/[0.07] text-white/75 px-3 py-1.5 rounded-lg text-xs font-semibold border border-white/10">🎯 {item.mode === "specific" ? "Specific" : "Pool"}</span>
        </div>

        {/* Price */}
        <div className="flex items-center justify-between rounded-xl bg-amber-500/[0.07] border border-amber-400/15 px-4 py-3 mb-4">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-white/35 font-bold">Tutor Earnings</p>
            <p className="text-xs text-white/55 mt-0.5">Per session</p>
          </div>
          <span className="text-xl font-extrabold text-amber-300">₹{item.price}</span>
        </div>

        {/* Session info for non-new doubts */}
        {!isNew && (
          <div className="rounded-2xl bg-white/[0.035] border border-white/10 p-4 mb-4">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[10px] uppercase tracking-[0.15em] text-white/35 font-bold">Session</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-base">{sessionInfo.icon}</span>
                  <p className="text-sm text-white/85 font-semibold truncate">{sessionInfo.label}</p>
                </div>
              </div>
              <div>
                {sessionCompleted ? (
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-white/[0.06] text-white/45 border border-white/10 whitespace-nowrap">
                    <span>✓</span>
                    <span>COMPLETED</span>
                  </div>
                ) : sessionReady ? (
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-300 border border-emerald-400/20 whitespace-nowrap">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    <span>READY</span>
                  </div>
                ) : (
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-300 border border-amber-400/20 whitespace-nowrap">
                    <span>⏳</span>
                    <span>PREPARING</span>
                  </div>
                )}
              </div>
            </div>
            {sessionReady && (
              <div className="mt-3 pt-3 border-t border-white/[0.06] flex items-center justify-between">
                <span className="text-[11px] text-white/30">Session</span>
                <span className="text-[11px] text-white/45 font-mono">#{item.session_id}</span>
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        {isNew ? (
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => AlertService.info("Reject Doubt", t("availableDoubts.rejectComingSoon"))}
              className="flex-1 min-h-[48px] bg-white/[0.07] border border-white/15 text-white/70 px-4 py-3 rounded-xl font-semibold hover:bg-white/[0.12] hover:text-white active:scale-[0.98] transition-all"
            >
              {t("availableDoubts.reject")}
            </button>
            <button
              type="button"
              disabled={acceptingId === item.doubt_id}
              onClick={() => handleAccept(item.doubt_id, item.title)}
              className="flex-1 min-h-[48px] px-4 py-3 rounded-xl font-bold text-white bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:from-violet-600 hover:to-fuchsia-600 active:scale-[0.98] shadow-lg shadow-violet-500/20 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              {acceptingId === item.doubt_id ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Accepting...
                </span>
              ) : (
                "Accept"
              )}
            </button>
          </div>
        ) : (
          <>
            {!sessionReady && !sessionCompleted && (
              <div className="w-full min-h-[48px] px-4 py-3 rounded-xl bg-amber-500/[0.08] border border-amber-400/15 text-amber-300/80 flex items-center justify-center gap-2 text-sm font-semibold">
                <span>⏳</span>
                <span>Session Preparing...</span>
              </div>
            )}
            {canContinueSession && (
              <button
                type="button"
                onClick={() => handleSession(item)}
                disabled={navigatingId === item.doubt_id}
                className="w-full min-h-[50px] px-5 py-3.5 rounded-xl font-bold text-white flex items-center justify-center gap-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 active:scale-[0.98] shadow-lg shadow-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {navigatingId === item.doubt_id ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Opening Session...</span>
                  </>
                ) : (
                  <>
                    <span className="text-base">▶</span>
                    <span>Continue Your Session</span>
                    <span className="text-lg opacity-80">→</span>
                  </>
                )}
              </button>
            )}
            {sessionCompleted && (
              <div className="w-full min-h-[48px] px-4 py-3 rounded-xl bg-white/[0.045] border border-white/10 text-white/45 flex items-center justify-center gap-2 text-sm font-semibold">
                <span className="w-5 h-5 rounded-full bg-emerald-500/15 text-emerald-300 flex items-center justify-center text-xs">✓</span>
                <span>Session Completed</span>
              </div>
            )}
          </>
        )}

        {isNew && (
          <div className="mt-3 flex items-center justify-center gap-2 text-xs text-emerald-300/80">
            <span>●</span>
            <span>Available until accepted</span>
          </div>
        )}
      </motion.div>
    );
  };

  // ==========================================================
  // LOADING
  // ==========================================================
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-violet-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white/70 text-sm">Loading available doubts...</p>
        </div>
      </div>
    );
  }

  // ==========================================================
  // MAIN
  // ==========================================================
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e] relative overflow-hidden">
      {/* Background blobs */}
      <div className="pointer-events-none absolute -top-32 -left-32 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl" />
      <div className="pointer-events-none absolute -top-32 -right-32 w-80 h-80 bg-fuchsia-500/20 rounded-full blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 left-1/3 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl" />

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Header */}
        <div className="flex items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center shadow-lg shadow-violet-500/25">💡</div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-violet-300 to-fuchsia-300">
                  {t("availableDoubts.title")}
                </h1>
                <p className="text-xs sm:text-sm text-white/45 mt-1">Find students who need your expertise</p>
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onRefresh}
            disabled={refreshing}
            aria-label="Refresh"
            className="w-11 h-11 rounded-xl bg-white/[0.06] border border-white/10 hover:bg-white/[0.12] transition flex items-center justify-center"
          >
            <svg
              className={`w-5 h-5 text-white/70 ${refreshing ? "animate-spin" : ""}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>

        {/* Search */}
        <div className="mb-5">
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/35">🔍</span>
            <input
              type="text"
              placeholder={t("availableDoubts.searchPlaceholder")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white/[0.055] backdrop-blur-md border border-white/10 rounded-2xl pl-11 pr-4 py-3.5 text-sm text-white placeholder-white/35 focus:ring-4 focus:ring-violet-500/20 focus:border-violet-400/40 outline-none transition"
            />
          </div>
        </div>

        {/* Categories */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-6 scrollbar-hide">
          {Object.keys(CATEGORY_KEYS).map((category) => (
            <button
              type="button"
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 rounded-full text-xs sm:text-sm font-semibold whitespace-nowrap transition border ${
                selectedCategory === category
                  ? "bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white border-transparent shadow-lg shadow-violet-500/20"
                  : "bg-white/[0.04] text-white/60 border-white/10 hover:bg-white/[0.08] hover:text-white"
              }`}
            >
              {getCategoryLabel(category)}
            </button>
          ))}
        </div>

        {/* Tabs */}
        <div className="bg-white/[0.045] backdrop-blur-md rounded-2xl p-1 mb-6 border border-white/10 grid grid-cols-3 gap-1">
          <button
            type="button"
            onClick={() => setActiveTab("new")}
            className={`py-3 rounded-xl text-xs sm:text-sm font-bold transition flex items-center justify-center gap-1.5 sm:gap-2 ${
              activeTab === "new"
                ? "bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white shadow-lg"
                : "text-white/50 hover:text-white"
            }`}
          >
            <span>🆕</span>
            <span>New</span>
            <span className="px-1.5 sm:px-2 py-0.5 rounded-full bg-black/15 text-[9px] sm:text-[10px]">{newCount}</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("ongoing")}
            className={`py-3 rounded-xl text-xs sm:text-sm font-bold transition flex items-center justify-center gap-1.5 sm:gap-2 ${
              activeTab === "ongoing"
                ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg"
                : "text-white/50 hover:text-white"
            }`}
          >
            <span>▶</span>
            <span>Ongoing</span>
            <span className="px-1.5 sm:px-2 py-0.5 rounded-full bg-black/15 text-[9px] sm:text-[10px]">{ongoingCount}</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("completed")}
            className={`py-3 rounded-xl text-xs sm:text-sm font-bold transition flex items-center justify-center gap-1.5 sm:gap-2 ${
              activeTab === "completed"
                ? "bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg"
                : "text-white/50 hover:text-white"
            }`}
          >
            <span>✓</span>
            <span>Completed</span>
            <span className="px-1.5 sm:px-2 py-0.5 rounded-full bg-black/15 text-[9px] sm:text-[10px]">{completedCount}</span>
          </button>
        </div>

        {/* Result summary */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-xs text-white/35 uppercase tracking-wider font-bold">
              {activeTab === "new" ? "Available now" : activeTab === "ongoing" ? "Your ongoing sessions" : "Your completed sessions"}
            </p>
            <p className="text-sm text-white/65 mt-1">
              {filteredDoubts.length} {filteredDoubts.length === 1 ? "doubt" : "doubts"}
            </p>
          </div>
        </div>

        {/* List */}
        <AnimatePresence mode="popLayout">
          {filteredDoubts.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl border border-white/10 bg-white/[0.04] py-16 px-6 text-center"
            >
              <div className="w-16 h-16 mx-auto rounded-2xl bg-white/[0.06] border border-white/10 flex items-center justify-center mb-4">
                <span className="text-2xl">
                  {activeTab === "new" ? "🔍" : activeTab === "ongoing" ? "🎓" : "🏆"}
                </span>
              </div>
              <h3 className="text-base font-bold text-white/80">
                {activeTab === "new" ? "No new doubts right now" : activeTab === "ongoing" ? "No ongoing sessions" : "No completed sessions yet"}
              </h3>
              <p className="text-sm text-white/40 mt-2 max-w-sm mx-auto">
                {activeTab === "new"
                  ? "New student doubts will appear here automatically."
                  : activeTab === "ongoing"
                  ? "Doubts you accept will appear here so you can continue their sessions."
                  : "Your completed tutoring sessions will appear here."}
              </p>
              {activeTab !== "new" && (activeTab === "ongoing" ? ongoingCount : completedCount) === 0 && (
                <button
                  onClick={onRefresh}
                  className="mt-5 px-5 py-2.5 rounded-xl bg-white/[0.07] border border-white/10 text-white/70 text-sm font-semibold hover:bg-white/[0.12] transition"
                >
                  ↻ Refresh
                </button>
              )}
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {filteredDoubts.map((item) => renderCard(item))}
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}