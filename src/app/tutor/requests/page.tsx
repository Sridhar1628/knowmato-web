"use client";

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  getTutorRequests,
  handleDirectRequest,
} from "@/services/v1Service";
import { subscribeSocket } from "@/services/socketEventBus";
import { SocketEvents } from "@/services/versionSocketEvents";
import AlertService from "@/services/alertService";
import { useTranslation } from "react-i18next";

import {
  tutorRequestsCache,
  type TutorRequest,
} from "@/store/tutorRequestsCache";

import {
  subscribeTutorRequests,
  setTutorRequests,
  addTutorRequest,
  removeTutorRequest,
  updateTutorRequest,
} from "@/store/tutorRequestsRealtime";


const statusBadgeClass = (status: string) => {
  const map: Record<string, string> = {
    pending:
      "bg-amber-400/20 text-amber-300 border-amber-400/40",
    accepted:
      "bg-emerald-400/20 text-emerald-300 border-emerald-400/40",
    countered:
      "bg-purple-400/20 text-purple-300 border-purple-400/40",
    proposed:
      "bg-sky-400/20 text-sky-300 border-sky-400/40",
    completed:
      "bg-blue-400/20 text-blue-300 border-blue-400/40",
    rejected:
      "bg-rose-400/20 text-rose-300 border-rose-400/40",
    cancelled:
      "bg-rose-400/20 text-rose-300 border-rose-400/40",
  };

  return (
    map[status] ||
    "bg-gray-400/20 text-gray-300 border-gray-400/40"
  );
};

export default function TutorRequestsPage() {
  const { t } = useTranslation();
  const router = useRouter();

  const [, forceUpdate] = useState({});
  const socketUnsubRef = useRef<(() => void) | null>(null);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [processingId, setProcessingId] = useState<number | null>(null);

  const [searchStudent, setSearchStudent] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("All");
  const [sortBy, setSortBy] = useState("newest");

  const [requestFilter, setRequestFilter] = useState<
    "new" | "ongoing" | "completed"
  >("new");

  const [filterModalOpen, setFilterModalOpen] = useState(false);

  // ---------- Cache subscription ----------
  useEffect(() => {
    const unsubscribe = subscribeTutorRequests(() => {
      forceUpdate({});
    });

    return unsubscribe;
  }, []);

  // ---------- Helpers ----------
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);

    if (Number.isNaN(date.getTime())) {
      return "-";
    }

    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusLabel = (status: string) =>
    t(`tutorRequests.status.${status}`, {
      defaultValue: status,
    });

  const getExplanationLabel = (type: string) =>
    t(`tutorRequests.explanation.${type}`, {
      defaultValue: type,
    });

  const normalizeRequests = (value: unknown): TutorRequest[] => {
    if (!Array.isArray(value)) {
      return [];
    }

    return value.map((item) => {
      const request = item as Partial<TutorRequest>;

      return {
        ...request,
        session_id: request.session_id ?? null,
        session_type: request.session_type ?? null,
        session_status: request.session_status ?? null,
      } as TutorRequest;
    });
  };

  // ---------- Fetch ----------
  const fetchRequests = useCallback(
    async (showLoader = true) => {
      try {
        if (showLoader) {
          setLoading(true);
        }

        const res = await getTutorRequests();

        const data = normalizeRequests(
          res?.data?.data ?? res?.data ?? []
        );

        console.log("📦 TUTOR REQUESTS:", data);

        setTutorRequests(data);
        forceUpdate({});
      } catch (error) {
        console.error("❌ Fetch tutor requests error:", error);
        AlertService.error(t("common.error"), t("tutorRequests.loadError"));
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [t]
  );

  // ---------- Initial load ----------
  useEffect(() => {
    const load = async () => {
      if (tutorRequestsCache.loaded) {
        forceUpdate({});
        setLoading(false);

        // Revalidate cache with the latest API data.
        await fetchRequests(false);
        return;
      }

      await fetchRequests(true);
    };

    void load();
  }, [fetchRequests]);

  // ---------- Status options ----------
  const statusOptions = useMemo(() => {
    const statuses = tutorRequestsCache.requests
      .map((request) => request.status)
      .filter(Boolean);

    return ["All", ...Array.from(new Set(statuses))];
  }, [tutorRequestsCache.requests, forceUpdate]);

  // ---------- Filter + sort ----------
  const filteredRequests = useMemo(() => {
    const query = searchStudent.trim().toLowerCase();

    return [...tutorRequestsCache.requests]
      .filter((request) => {
        const studentName =
          request.student?.name?.toLowerCase() || "";

        if (query && !studentName.includes(query)) {
          return false;
        }

        if (
          selectedStatus !== "All" &&
          request.status !== selectedStatus
        ) {
          return false;
        }

        if (startDate) {
          const start = new Date(startDate);
          start.setHours(0, 0, 0, 0);

          if (new Date(request.created_at) < start) {
            return false;
          }
        }

        if (endDate) {
          const end = new Date(endDate);
          end.setHours(23, 59, 59, 999);

          if (new Date(request.created_at) > end) {
            return false;
          }
        }

        if (
          requestFilter === "new" &&
          request.status !== "pending"
        ) {
          return false;
        }

        if (
          requestFilter === "ongoing" &&
          request.status !== "accepted"
        ) {
          return false;
        }

        if (
          requestFilter === "completed" &&
          request.status !== "completed"
        ) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === "oldest") {
          return (
            new Date(a.created_at).getTime() -
            new Date(b.created_at).getTime()
          );
        }

        if (sortBy === "student_asc") {
          return (a.student?.name || "").localeCompare(
            b.student?.name || ""
          );
        }

        return (
          new Date(b.created_at).getTime() -
          new Date(a.created_at).getTime()
        );
      });
  }, [
    searchStudent,
    startDate,
    endDate,
    selectedStatus,
    sortBy,
    requestFilter,
    tutorRequestsCache.requests,
  ]);

  // ---------- Accept ----------
  const handleAccept = async (requestId: number) => {
    if (processingId !== null) return;

    if (!window.confirm(t("tutorRequests.acceptConfirm"))) {
      return;
    }

    setProcessingId(requestId);

    try {
      const res = await handleDirectRequest({
        request_id: requestId,
        action: "accept",
      });

      console.log("✅ ACCEPT RESPONSE:", res);

      const data =
        res?.data?.data ??
        res?.data ??
        res ??
        {};

      const sessionId = data?.session_id
        ? Number(data.session_id)
        : null;

      const validSessionId =
        typeof sessionId === "number" && Number.isFinite(sessionId) && sessionId > 0
          ? sessionId
          : null;

      const sessionType =
        data?.session_type ??
        data?.session?.type ??
        null;

      // IMPORTANT:
      // Keep accepted request in cache so it appears
      // inside the Ongoing tab.
      updateTutorRequest({
        request_id: requestId,
        status: "accepted",
        session_id: validSessionId,
        session_type: sessionType,
        session_status:
          data?.session_status ?? "scheduled",
      } as unknown as TutorRequest);

      AlertService.success(t("common.success"), t("tutorRequests.acceptSuccess"));

      setRequestFilter("ongoing");

      // If backend immediately gives us a session,
      // open it directly.
      if (validSessionId !== null) {
        const type = String(sessionType || "chat").toLowerCase();

        if (type === "chat" || type === "text") {
          router.push(`/chat/${validSessionId}`);
        } else {
          router.push(`/videocall/${validSessionId}`);
        }
      }
    } catch (error) {
      console.error("❌ Accept error:", error);
      AlertService.error(t("common.error"), t("tutorRequests.acceptError"));
    } finally {
      setProcessingId(null);
    }
  };

  // ---------- Reject ----------
  const handleReject = async (requestId: number) => {
    if (processingId !== null) return;

    if (!window.confirm(t("tutorRequests.rejectConfirm"))) {
      return;
    }

    setProcessingId(requestId);

    try {
      await handleDirectRequest({
        request_id: requestId,
        action: "reject",
      });

      removeTutorRequest(requestId);

      AlertService.success(t("common.success"), t("tutorRequests.rejectSuccess"));
    } catch (error) {
      console.error("❌ Reject error:", error);
      AlertService.error(t("common.error"), t("tutorRequests.rejectError"));
    } finally {
      setProcessingId(null);
    }
  };

  // ---------- Continue session ----------
  const handleContinueSession = (item: TutorRequest) => {
    if (!item.session_id) {
      AlertService.error(
        t("common.error"),
        t(
          "tutorRequests.sessionUnavailable",
          "Session is not available yet."
        )
      );
      return;
    }

    const sessionId = Number(item.session_id);

    if (!Number.isFinite(sessionId) || sessionId <= 0) {
      AlertService.error(
        t("common.error"),
        t("tutorRequests.invalidSession", "Invalid session.")
      );
      return;
    }

    const sessionType = String(
      item.session_type || "chat"
    ).toLowerCase();

    if (sessionType === "chat" || sessionType === "text") {
      router.push(`/chat/${sessionId}`);
      return;
    }

    if (
      sessionType === "audio" ||
      sessionType === "video_recorded" ||
      sessionType === "live_video"
    ) {
      router.push(`/videocall/${sessionId}`);
      return;
    }

    AlertService.error(
      t("common.error"),
      t(
        "tutorRequests.unsupportedSession",
        "Unsupported session type."
      )
    );
  };

  // ---------- Realtime socket ----------
  useEffect(() => {
    if (socketUnsubRef.current) {
      socketUnsubRef.current();
      socketUnsubRef.current = null;
    }

    const unsub = subscribeSocket((event, data) => {
      console.log("📡 REQUEST EVENT:", event, data);

      const requestId = Number(data?.request_id);

      // New direct request
      if (event === SocketEvents.NEW_DOUBT_REQUEST) {
        if (!data) return;

        addTutorRequest(data);
        forceUpdate({});
        return;
      }

      // Direct request rejected
      if (event === SocketEvents.DIRECT_REJECTED) {
        if (
          Number.isFinite(requestId) &&
          requestId > 0
        ) {
          removeTutorRequest(requestId);
          forceUpdate({});
        }

        return;
      }

      // Direct request cancelled
      if (event === "DIRECT_CANCELLED") {
        if (
          Number.isFinite(requestId) &&
          requestId > 0
        ) {
          removeTutorRequest(requestId);
          forceUpdate({});
        }

        return;
      }

      // Direct request updated
      if (event === "DIRECT_UPDATED") {
        if (
          Number.isFinite(requestId) &&
          requestId > 0
        ) {
          updateTutorRequest(data);
          forceUpdate({});
        }

        return;
      }

      // Direct request accepted
      if (event === SocketEvents.DIRECT_ACCEPTED) {
        if (
          !Number.isFinite(requestId) ||
          requestId <= 0
        ) {
          return;
        }

        const sessionId =
          data?.session_id !== undefined &&
          data?.session_id !== null
            ? Number(data.session_id)
            : null;

        const validSessionId =
          sessionId !== null &&
          Number.isFinite(sessionId) &&
          sessionId > 0
            ? sessionId
            : null;

        const sessionType =
          data?.session_type ??
          data?.session?.type ??
          null;

        updateTutorRequest({
          ...data,
          request_id: requestId,
          status: "accepted",
          session_id: validSessionId,
          session_type: sessionType,
          session_status:
            data?.session_status ?? "scheduled",
        });

        forceUpdate({});

        // The tutor who accepted should enter the session.
        if (validSessionId !== null) {
          const safeSessionId = validSessionId;
          const type = String(
            sessionType || "chat"
          ).toLowerCase();

          setTimeout(() => {
            if (type === "chat" || type === "text") {
              router.push(`/chat/${safeSessionId}`);
            } else {
              router.push(`/videocall/${safeSessionId}`);
            }
          }, 300);
        }
      }
    });

    socketUnsubRef.current = unsub;

    return () => {
      if (socketUnsubRef.current) {
        socketUnsubRef.current();
        socketUnsubRef.current = null;
      }
    };
  }, [router]);

  // ---------- Refresh ----------
  const handleRefresh = async () => {
    if (refreshing) return;

    setRefreshing(true);
    await fetchRequests(false);
  };

  // ---------- Reset filters ----------
  const resetFilters = () => {
    setSearchStudent("");
    setStartDate("");
    setEndDate("");
    setSelectedStatus("All");
    setSortBy("newest");
    setFilterModalOpen(false);
  };

  const statusIconMap: Record<string, string> = {
    pending: "⏳",
    accepted: "✅",
    countered: "🔄",
    proposed: "💡",
    completed: "✓",
    rejected: "✕",
    cancelled: "✕",
  };

  if (loading && !refreshing) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e]">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-violet-400 border-t-transparent" />
          <p className="mt-4 text-white/70">
            {t("tutorRequests.loading")}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e]">
      {/* Background */}
      <div className="absolute top-0 -left-20 h-72 w-72 rounded-full bg-purple-500/20 blur-3xl" />
      <div className="absolute top-0 -right-20 h-72 w-72 rounded-full bg-fuchsia-500/20 blur-3xl" />
      <div className="absolute -bottom-20 left-40 h-72 w-72 rounded-full bg-cyan-500/20 blur-3xl" />

      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 bg-white/5 px-4 py-4 backdrop-blur-xl">
          <h1 className="bg-gradient-to-r from-violet-300 to-fuchsia-300 bg-clip-text text-xl font-bold text-transparent">
            {t("tutorRequests.title")}
          </h1>

          <button
            type="button"
            onClick={() => setFilterModalOpen(true)}
            className="rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 px-4 py-2 text-sm font-semibold text-white shadow-lg transition hover:from-violet-600 hover:to-fuchsia-600"
          >
            {t("tutorRequests.filter")}
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 overflow-x-auto border-b border-white/10 bg-white/5 px-4 py-2 backdrop-blur-xl scrollbar-hide">
          {(
            [
              ["new", "newRequests"],
              ["ongoing", "ongoing"],
              ["completed", "completed"],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setRequestFilter(value)}
              className={`whitespace-nowrap rounded-full px-3 py-1 text-sm font-semibold transition ${
                requestFilter === value
                  ? "bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white"
                  : "bg-white/10 text-white/70 hover:bg-white/20"
              }`}
            >
              {t(`tutorRequests.${label}`)}
            </button>
          ))}

          <button
            type="button"
            onClick={() => setSortBy("oldest")}
            className={`whitespace-nowrap rounded-full px-3 py-1 text-sm font-semibold transition ${
              sortBy === "oldest"
                ? "bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white"
                : "bg-white/10 text-white/70 hover:bg-white/20"
            }`}
          >
            {t("tutorRequests.oldest")}
          </button>

          <button
            type="button"
            onClick={() => setSortBy("student_asc")}
            className={`whitespace-nowrap rounded-full px-3 py-1 text-sm font-semibold transition ${
              sortBy === "student_asc"
                ? "bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white"
                : "bg-white/10 text-white/70 hover:bg-white/20"
            }`}
          >
            {t("tutorRequests.studentAZ")}
          </button>
        </div>

        {/* Refresh */}
        <div className="flex justify-end px-4 py-3">
          <button
            type="button"
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 text-sm text-violet-300 transition hover:text-violet-200 disabled:opacity-50"
          >
            <svg
              className={`h-4 w-4 ${
                refreshing ? "animate-spin" : ""
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>

            {refreshing
              ? t("tutorRequests.refreshing")
              : t("tutorRequests.refresh")}
          </button>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 gap-5 px-4 pb-20 lg:grid-cols-3">
          {filteredRequests.length === 0 && (
            <div className="col-span-full py-16 text-center text-white/50">
              <span className="mb-4 block text-4xl">📭</span>
              <p className="text-lg font-semibold">
                {t(
                  "tutorRequests.noRequestsMatchFilters"
                )}
              </p>
            </div>
          )}

          <AnimatePresence>
            {filteredRequests.map((item) => {
              const isPending = item.status === "pending";
              const isOngoing = item.status === "accepted";
              const isCompleted =
                item.status === "completed";

              const badgeClass = statusBadgeClass(
                item.status
              );

              const statusLabel =
                getStatusLabel(item.status);

              const statusIcon =
                statusIconMap[item.status] || "📌";

              const processing =
                processingId === item.request_id;

              return (
                <motion.div
                  key={item.request_id}
                  initial={{
                    opacity: 0,
                    y: 20,
                  }}
                  animate={{
                    opacity: 1,
                    y: 0,
                  }}
                  exit={{
                    opacity: 0,
                    scale: 0.95,
                  }}
                  layout
                  className="group relative flex flex-col rounded-2xl border border-white/10 bg-white/5 p-5 shadow-xl backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-violet-400/40"
                >
                  <h2 className="line-clamp-2 text-lg font-bold text-white transition-colors group-hover:text-violet-300">
                    {item.title}
                  </h2>

                  <p className="mt-1 line-clamp-2 flex-1 text-sm text-white/60">
                    {item.description}
                  </p>

                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <span className="rounded-full border border-violet-400/30 bg-violet-500/20 px-2 py-1 text-xs font-semibold text-violet-300">
                      📂 {item.category}
                    </span>

                    <span className="flex items-center gap-1 text-sm text-white/70">
                      👤{" "}
                      {item.student?.name ||
                        t(
                          "tutorRequests.unknownStudent"
                        )}
                    </span>

                    <span className="flex items-center gap-1 text-sm text-white/70">
                      💬{" "}
                      {getExplanationLabel(
                        item.preferred_explanation
                      )}
                    </span>

                    {item.price !== null && (
                      <span className="flex items-center gap-1 text-sm text-white/70">
                        💰 ₹{item.price}
                      </span>
                    )}
                  </div>

                  <div className="mt-3 flex items-center justify-between gap-2">
                    <span className="text-xs text-white/50">
                      📅 {formatDate(item.created_at)}
                    </span>

                    <span
                      className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-xs font-semibold ${badgeClass}`}
                    >
                      {statusIcon} {statusLabel}
                    </span>
                  </div>

                  <div className="mt-4">
                    {isPending ? (
                      <div className="flex gap-3">
                        <button
                          type="button"
                          disabled={processing}
                          onClick={() =>
                            handleAccept(
                              item.request_id
                            )
                          }
                          className="flex-1 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 py-2.5 font-semibold text-white shadow-lg shadow-emerald-500/25 transition hover:from-emerald-600 hover:to-teal-600 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {processing
                            ? "..."
                            : `✓ ${t(
                                "tutorRequests.accept"
                              )}`}
                        </button>

                        <button
                          type="button"
                          disabled={processing}
                          onClick={() =>
                            handleReject(
                              item.request_id
                            )
                          }
                          className="flex-1 rounded-xl bg-gradient-to-r from-rose-500 to-pink-500 py-2.5 font-semibold text-white shadow-lg shadow-rose-500/25 transition hover:from-rose-600 hover:to-pink-600 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {processing
                            ? "..."
                            : `✗ ${t(
                                "tutorRequests.reject"
                              )}`}
                        </button>
                      </div>
                    ) : isOngoing ? (
                      <button
                        type="button"
                        onClick={() =>
                          handleContinueSession(item)
                        }
                        disabled={!item.session_id}
                        className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-500 to-fuchsia-500 py-3 font-semibold text-white shadow-lg shadow-violet-500/25 transition hover:from-violet-600 hover:to-fuchsia-600 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <span className="text-lg">
                          ▶
                        </span>
                        <span>
                          {item.session_id
                            ? t(
                                "tutorRequests.continueSession",
                                "Continue Your Session"
                              )
                            : t(
                                "tutorRequests.sessionPreparing",
                                "Session Preparing..."
                              )}
                        </span>
                      </button>
                    ) : isCompleted ? (
                      <div className="rounded-xl border border-white/10 bg-white/10 py-3 text-center text-sm font-medium text-white/60">
                        ✓{" "}
                        {t(
                          "tutorRequests.sessionCompleted",
                          "Session Completed"
                        )}
                      </div>
                    ) : (
                      <div className="rounded-xl border border-white/10 bg-white/10 py-3 text-center text-sm font-medium text-white/70">
                        {t(
                          "tutorRequests.statusPrefix",
                          {
                            status: statusLabel,
                          }
                        )}
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {/* Filter Modal */}
        <AnimatePresence>
          {filterModalOpen && (
            <div
              className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm sm:items-center"
              onClick={() =>
                setFilterModalOpen(false)
              }
            >
              <motion.div
                initial={{
                  opacity: 0,
                  y: 50,
                }}
                animate={{
                  opacity: 1,
                  y: 0,
                }}
                exit={{
                  opacity: 0,
                  y: 50,
                }}
                onClick={(e) =>
                  e.stopPropagation()
                }
                className="max-h-[80vh] w-full max-w-md overflow-y-auto rounded-t-3xl border border-white/10 bg-gradient-to-b from-[#1a1535] to-[#0f0c29] p-6 shadow-2xl sm:rounded-3xl"
              >
                <h2 className="mb-4 bg-gradient-to-r from-violet-300 to-fuchsia-300 bg-clip-text text-xl font-bold text-transparent">
                  {t("tutorRequests.filterTitle")}
                </h2>

                <label className="mb-1 block text-sm font-medium text-white/80">
                  {t(
                    "tutorRequests.filterStudentName"
                  )}
                </label>

                <input
                  type="text"
                  placeholder={t(
                    "tutorRequests.filterSearchPlaceholder"
                  )}
                  value={searchStudent}
                  onChange={(e) =>
                    setSearchStudent(e.target.value)
                  }
                  className="mb-4 w-full rounded-xl border border-white/20 bg-gray-900/60 px-4 py-2 text-sm text-white outline-none placeholder-white/40 focus:border-violet-400 focus:ring-4 focus:ring-violet-500/50"
                />

                <label className="mb-1 block text-sm font-medium text-white/80">
                  {t(
                    "tutorRequests.filterDateRange"
                  )}
                </label>

                <div className="mb-4 flex gap-2">
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) =>
                      setStartDate(e.target.value)
                    }
                    className="flex-1 rounded-xl border border-white/20 bg-gray-900/60 px-3 py-2 text-sm text-white"
                  />

                  <span className="self-center text-white/40">
                    –
                  </span>

                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) =>
                      setEndDate(e.target.value)
                    }
                    className="flex-1 rounded-xl border border-white/20 bg-gray-900/60 px-3 py-2 text-sm text-white"
                  />
                </div>

                <label className="mb-1 block text-sm font-medium text-white/80">
                  {t(
                    "tutorRequests.filterStatus"
                  )}
                </label>

                <div className="mb-4 flex flex-wrap gap-2">
                  {statusOptions.map((status) => (
                    <button
                      key={status}
                      type="button"
                      onClick={() =>
                        setSelectedStatus(status)
                      }
                      className={`rounded-full px-3 py-1 text-sm font-semibold transition ${
                        selectedStatus === status
                          ? "bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white"
                          : "bg-white/10 text-white/70 hover:bg-white/20"
                      }`}
                    >
                      {status === "All"
                        ? t("common.all")
                        : getStatusLabel(status)}
                    </button>
                  ))}
                </div>

                <div className="mt-4 flex gap-3">
                  <button
                    type="button"
                    onClick={resetFilters}
                    className="flex-1 rounded-xl border border-white/20 bg-white/10 py-2 font-semibold text-white/80 hover:bg-white/20"
                  >
                    {t(
                      "tutorRequests.filterReset"
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setFilterModalOpen(false)
                    }
                    className="flex-1 rounded-xl bg-gradient-to-r from-violet-500 to-fuchsia-500 py-2 font-semibold text-white shadow-lg hover:from-violet-600 hover:to-fuchsia-600"
                  >
                    {t(
                      "tutorRequests.filterApplyClose"
                    )}
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}