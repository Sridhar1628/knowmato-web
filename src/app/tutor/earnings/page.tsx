// app/tutor/earnings/page.tsx
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import AlertService from "@/services/alertService";
import {
  getMyTutorEarnings,
  MyTutorEarning,
} from "@/services/v1Service";
import { useTranslation } from "react-i18next";

// ============================================================
// TYPES
// ============================================================

interface EarningsSummary {
  total_earnings: number;
  paid_earnings: number;
  pending_earnings: number;
  total_sessions: number;
}

interface EarningsResponse {
  summary?: Partial<EarningsSummary> | null;
  data?: MyTutorEarning[];
  results?: MyTutorEarning[];
  earnings?: MyTutorEarning[];
}

// ============================================================
// HELPERS
// ============================================================

const toNumber = (value: unknown, fallback = 0): number => {
  const numberValue = Number(value);

  return Number.isFinite(numberValue) ? numberValue : fallback;
};

const formatCurrency = (value: unknown): string => {
  return `₹${toNumber(value).toFixed(2)}`;
};

const formatDate = (
  value: unknown,
  locale: string = "en-IN"
): string => {
  if (!value) {
    return "—";
  }

  const date = new Date(String(value));

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleDateString(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

// ============================================================
// RESPONSE NORMALIZER
// ============================================================

function normalizeEarningsResponse(
  response: unknown
): {
  summary: EarningsSummary | null;
  earnings: MyTutorEarning[];
} {
  const root = response as any;

  const data = root?.data ?? root ?? {};

  // Handle direct array response.
  if (Array.isArray(data)) {
    return {
      summary: null,
      earnings: data as MyTutorEarning[],
    };
  }

  const summarySource =
    data?.summary ??
    root?.summary ??
    null;

  const earningsSource =
    data?.data ??
    data?.results ??
    data?.earnings ??
    root?.earnings ??
    root?.results ??
    [];

  const summary: EarningsSummary | null =
    summarySource &&
    typeof summarySource === "object"
      ? {
          total_earnings: toNumber(
            summarySource.total_earnings
          ),
          paid_earnings: toNumber(
            summarySource.paid_earnings
          ),
          pending_earnings: toNumber(
            summarySource.pending_earnings
          ),
          total_sessions: toNumber(
            summarySource.total_sessions
          ),
        }
      : null;

  return {
    summary,
    earnings: Array.isArray(earningsSource)
      ? (earningsSource as MyTutorEarning[])
      : [],
  };
}

// ============================================================
// SKELETON COMPONENTS
// ============================================================

function CardSkeleton() {
  return (
    <div
      className="
        flex flex-col gap-3 rounded-2xl
        border border-white/10
        bg-white/5
        p-6
        backdrop-blur-md
        animate-pulse
      "
      aria-hidden="true"
    >
      <div className="h-4 w-1/2 rounded bg-white/10" />
      <div className="h-7 w-3/4 rounded bg-white/10" />
    </div>
  );
}

function EarningRowSkeleton() {
  return (
    <div
      className="
        flex items-center justify-between
        gap-4
        border-b border-white/10
        p-4
        last:border-b-0
        animate-pulse
      "
      aria-hidden="true"
    >
      <div className="min-w-0 flex-1 space-y-2">
        <div className="h-4 w-1/3 rounded bg-white/10" />
        <div className="h-3 w-1/4 rounded bg-white/10" />
      </div>

      <div className="h-6 w-16 rounded-full bg-white/10" />

      <div className="h-5 w-20 rounded bg-white/10" />
    </div>
  );
}

// ============================================================
// SUMMARY CARD
// ============================================================

function SummaryCard({
  label,
  value,
  valueClassName,
  icon,
}: {
  label: string;
  value: string;
  valueClassName: string;
  icon: string;
}) {
  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{
        duration: 0.2,
      }}
      className="
        group
        rounded-2xl
        border border-white/10
        bg-white/5
        p-5
        shadow-xl
        backdrop-blur-xl
        transition-colors
        hover:border-white/20
      "
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-white/60">
          {label}
        </p>

        <span
          className="
            flex h-9 w-9 shrink-0
            items-center justify-center
            rounded-xl
            bg-white/5
            text-lg
            transition-transform
            group-hover:scale-110
          "
        >
          {icon}
        </span>
      </div>

      <p
        className={`
          mt-2
          text-2xl
          font-bold
          ${valueClassName}
        `}
      >
        {value}
      </p>
    </motion.div>
  );
}

// ============================================================
// PAGE
// ============================================================

export default function TutorEarningsPage() {
  const { t, i18n } = useTranslation();

  const [summary, setSummary] =
    useState<EarningsSummary | null>(null);

  const [earnings, setEarnings] =
    useState<MyTutorEarning[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  // ==========================================================
  // FETCH EARNINGS
  // ==========================================================

  const fetchEarnings = useCallback(
    async (showLoader = true) => {
      if (showLoader) {
        setLoading(true);
      }

      setError(null);

      try {
        const response =
          await getMyTutorEarnings();

        console.log(
          "💰 Tutor earnings response:",
          response
        );

        const normalized =
          normalizeEarningsResponse(response);

        setSummary(normalized.summary);
        setEarnings(normalized.earnings);
      } catch (err: any) {
        console.error(
          "❌ Failed to load tutor earnings:",
          err
        );

        const message =
          err?.response?.data?.error ||
          err?.response?.data?.message ||
          err?.message ||
          t("tutorEarnings.loadError");

        setError(message);
        setSummary(null);
        setEarnings([]);

        AlertService.error("Load Failed", message);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [t]
  );

  // ==========================================================
  // INITIAL LOAD
  // ==========================================================

  useEffect(() => {
    void fetchEarnings(true);
  }, [fetchEarnings]);

  // ==========================================================
  // REFRESH
  // ==========================================================

  const handleRefresh = async () => {
    if (refreshing) {
      return;
    }

    setRefreshing(true);

    await fetchEarnings(false);
  };

  // ==========================================================
  // SAFE SUMMARY
  // ==========================================================

  const safeSummary = useMemo<EarningsSummary>(
    () => ({
      total_earnings: toNumber(
        summary?.total_earnings
      ),

      paid_earnings: toNumber(
        summary?.paid_earnings
      ),

      pending_earnings: toNumber(
        summary?.pending_earnings
      ),

      total_sessions: toNumber(
        summary?.total_sessions
      ),
    }),
    [summary]
  );

  // ==========================================================
  // LOADING
  // ==========================================================

  if (loading) {
    return (
      <div
        className="
          relative min-h-screen
          overflow-hidden
          bg-gradient-to-br
          from-[#0f0c29]
          via-[#302b63]
          to-[#24243e]
          p-4
          sm:p-6
          lg:p-8
        "
      >
        {/* Background blobs */}
        <div
          className="
            pointer-events-none
            absolute
            -left-20
            top-0
            h-72
            w-72
            rounded-full
            bg-purple-500/20
            blur-3xl
          "
        />

        <div
          className="
            pointer-events-none
            absolute
            -right-20
            top-0
            h-72
            w-72
            rounded-full
            bg-fuchsia-500/20
            blur-3xl
          "
        />

        <div
          className="
            pointer-events-none
            absolute
            -bottom-20
            left-40
            h-72
            w-72
            rounded-full
            bg-cyan-500/20
            blur-3xl
          "
        />

        <div className="relative z-10 mx-auto max-w-4xl">
          {/* Header skeleton */}
          <div className="mb-8 space-y-3">
            <div className="h-10 w-64 animate-pulse rounded-xl bg-white/10" />
            <div className="h-5 w-80 animate-pulse rounded bg-white/10" />
          </div>

          {/* Summary skeleton */}
          <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
            {[0, 1, 2, 3].map((item) => (
              <CardSkeleton key={item} />
            ))}
          </div>

          {/* Earnings skeleton */}
          <div
            className="
              rounded-2xl
              border border-white/10
              bg-white/5
              p-4
              backdrop-blur-xl
            "
          >
            {[0, 1, 2, 3, 4].map((item) => (
              <EarningRowSkeleton key={item} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ==========================================================
  // MAIN
  // ==========================================================

  return (
    <div
      className="
        relative
        min-h-screen
        overflow-hidden
        bg-gradient-to-br
        from-[#0f0c29]
        via-[#302b63]
        to-[#24243e]
        p-4
        sm:p-6
        lg:p-8
      "
    >
      {/* ======================================================
          BACKGROUND BLOBS
      ======================================================= */}

      <div
        className="
          pointer-events-none
          absolute
          left-[-80px]
          top-0
          h-72
          w-72
          rounded-full
          bg-purple-500/20
          blur-3xl
          animate-blob
        "
      />

      <div
        className="
          pointer-events-none
          absolute
          right-[-80px]
          top-0
          h-72
          w-72
          rounded-full
          bg-fuchsia-500/20
          blur-3xl
          animate-blob
          animation-delay-2000
        "
      />

      <div
        className="
          pointer-events-none
          absolute
          bottom-[-80px]
          left-40
          h-72
          w-72
          rounded-full
          bg-cyan-500/20
          blur-3xl
          animate-blob
          animation-delay-4000
        "
      />

      {/* ======================================================
          CONTENT
      ======================================================= */}

      <div
        className="
          relative
          z-10
          mx-auto
          max-w-4xl
        "
      >
        {/* ====================================================
            HEADER
        ===================================================== */}

        <div
          className="
            mb-8
            flex
            flex-col
            gap-4
            sm:flex-row
            sm:items-start
            sm:justify-between
          "
        >
          <div>
            <h1
              className="
                flex
                items-center
                gap-2
                text-3xl
                font-extrabold
                text-transparent
                bg-clip-text
                bg-gradient-to-r
                from-violet-300
                to-fuchsia-300
              "
            >
              <span
                className="
                  text-4xl
                  drop-shadow-lg
                "
              >
                💰
              </span>

              <span>
                {t("tutorEarnings.title")}
              </span>
            </h1>

            <p className="mt-2 text-white/70">
              {t("tutorEarnings.subtitle")}
            </p>
          </div>

          {/* Refresh */}
          <button
            type="button"
            onClick={handleRefresh}
            disabled={refreshing}
            aria-label={t(
              "common.refresh",
              "Refresh"
            )}
            className="
              flex
              h-11
              w-11
              shrink-0
              items-center
              justify-center
              self-start
              rounded-xl
              border
              border-white/10
              bg-white/[0.06]
              text-white/70
              shadow-lg
              backdrop-blur-md
              transition
              hover:bg-white/[0.12]
              hover:text-white
              disabled:cursor-not-allowed
              disabled:opacity-50
              sm:self-auto
            "
          >
            <svg
              className={`h-5 w-5 ${
                refreshing
                  ? "animate-spin"
                  : ""
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="
                  M4 4v5h5
                  M20 20v-5h-5
                  M5.07 9A7.999 7.999 0 0119 7.5
                  M18.93 15A7.999 7.999 0 015 16.5
                "
              />
            </svg>
          </button>
        </div>

        {/* ====================================================
            ERROR
        ===================================================== */}

        {error ? (
          <motion.div
            initial={{
              opacity: 0,
              y: 10,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            className="
              rounded-2xl
              border
              border-rose-400/30
              bg-rose-500/10
              p-6
              text-center
              backdrop-blur-xl
              shadow-xl
            "
          >
            <div className="mb-3 text-4xl">
              ⚠️
            </div>

            <p className="mb-4 text-lg font-bold text-rose-300">
              {error}
            </p>

            <button
              type="button"
              onClick={() =>
                void fetchEarnings(true)
              }
              className="
                rounded-xl
                border
                border-rose-400/30
                bg-rose-400/20
                px-5
                py-2.5
                font-semibold
                text-rose-200
                transition
                hover:bg-rose-400/30
              "
            >
              {t("common.retry")}
            </button>
          </motion.div>
        ) : (
          <motion.div
            initial={{
              opacity: 0,
              y: 20,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            transition={{
              duration: 0.3,
            }}
            className="space-y-6"
          >
            {/* ==================================================
                SUMMARY CARDS
            =================================================== */}

            <div
              className="
                grid
                grid-cols-2
                gap-4
                md:grid-cols-4
              "
            >
              <SummaryCard
                icon="💰"
                label={t(
                  "tutorEarnings.totalEarnings"
                )}
                value={formatCurrency(
                  safeSummary.total_earnings
                )}
                valueClassName="
                  bg-gradient-to-r
                  from-amber-300
                  to-orange-300
                  bg-clip-text
                  text-transparent
                "
              />

              <SummaryCard
                icon="✓"
                label={t(
                  "tutorEarnings.paid"
                )}
                value={formatCurrency(
                  safeSummary.paid_earnings
                )}
                valueClassName="
                  text-emerald-400
                "
              />

              <SummaryCard
                icon="⏳"
                label={t(
                  "tutorEarnings.pending"
                )}
                value={formatCurrency(
                  safeSummary.pending_earnings
                )}
                valueClassName="
                  text-amber-400
                "
              />

              <SummaryCard
                icon="📚"
                label={t(
                  "tutorEarnings.sessions"
                )}
                value={String(
                  safeSummary.total_sessions
                )}
                valueClassName="
                  text-violet-400
                "
              />
            </div>

            {/* ==================================================
                EARNINGS LIST
            =================================================== */}

            <div
              className="
                rounded-2xl
                border
                border-white/10
                bg-white/5
                p-4
                shadow-xl
                backdrop-blur-xl
                sm:p-6
              "
            >
              <div
                className="
                  mb-5
                  flex
                  flex-col
                  gap-2
                  sm:flex-row
                  sm:items-center
                  sm:justify-between
                "
              >
                <div>
                  <h2
                    className="
                      text-xl
                      font-bold
                      text-transparent
                      bg-clip-text
                      bg-gradient-to-r
                      from-violet-300
                      to-fuchsia-300
                    "
                  >
                    📋{" "}
                    {t(
                      "tutorEarnings.earningDetails"
                    )}
                  </h2>

                  <p className="mt-1 text-xs text-white/40">
                    {earnings.length}{" "}
                    {earnings.length === 1
                      ? t(
                          "tutorEarnings.session",
                          "session"
                        )
                      : t(
                          "tutorEarnings.sessions",
                          "sessions"
                        )}
                  </p>
                </div>
              </div>

              {/* ==================================================
                  EMPTY STATE
              =================================================== */}

              {earnings.length === 0 ? (
                <div
                  className="
                    rounded-2xl
                    border
                    border-dashed
                    border-white/10
                    py-14
                    text-center
                  "
                >
                  <span className="mb-3 block text-5xl">
                    💰
                  </span>

                  <p className="text-white/50">
                    {t(
                      "tutorEarnings.noEarnings"
                    )}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {earnings.map(
                    (earning, index) => {
                      const earningId =
                        earning.earning_id ??
                        `${earning.session_id}-${index}`;

                      const amount =
                        toNumber(
                          earning.amount
                        );

                      const paid =
                        Boolean(
                          earning.is_paid
                        );

                      return (
                        <motion.div
                          key={earningId}
                          initial={{
                            opacity: 0,
                            y: 8,
                          }}
                          animate={{
                            opacity: 1,
                            y: 0,
                          }}
                          transition={{
                            duration: 0.2,
                            delay:
                              Math.min(
                                index * 0.03,
                                0.3
                              ),
                          }}
                          className="
                            rounded-xl
                            border
                            border-white/10
                            bg-white/5
                            p-4
                            backdrop-blur-md
                            transition-all
                            hover:border-violet-400/30
                            hover:bg-white/10
                          "
                        >
                          <div
                            className="
                              flex
                              flex-col
                              gap-4
                              sm:flex-row
                              sm:items-center
                              sm:justify-between
                            "
                          >
                            {/* Session information */}
                            <div className="min-w-0">
                              <p
                                className="
                                  truncate
                                  font-semibold
                                  text-white
                                "
                              >
                                {t(
                                  "tutorEarnings.sessionId",
                                  {
                                    id: earning.session_id,
                                  }
                                )}
                              </p>

                              <p
                                className="
                                  mt-1
                                  text-xs
                                  text-white/50
                                "
                              >
                                {formatDate(
                                  earning.created_at,
                                  i18n.language ||
                                    "en-IN"
                                )}
                              </p>
                            </div>

                            {/* Amount/status */}
                            <div
                              className="
                                flex
                                items-center
                                justify-between
                                gap-4
                                sm:justify-end
                              "
                            >
                              <span
                                className={`
                                  inline-flex
                                  items-center
                                  gap-1.5
                                  rounded-full
                                  border
                                  px-2.5
                                  py-1
                                  text-xs
                                  font-semibold
                                  ${
                                    paid
                                      ? `
                                        border-emerald-400/40
                                        bg-emerald-400/20
                                        text-emerald-300
                                      `
                                      : `
                                        border-amber-400/40
                                        bg-amber-400/20
                                        text-amber-300
                                      `
                                  }
                                `}
                              >
                                <span
                                  className={`
                                    h-1.5
                                    w-1.5
                                    rounded-full
                                    ${
                                      paid
                                        ? "bg-emerald-300"
                                        : "bg-amber-300"
                                    }
                                  `}
                                />

                                {paid
                                  ? t(
                                      "tutorEarnings.paidStatusLabel"
                                    )
                                  : t(
                                      "tutorEarnings.pendingStatusLabel"
                                    )}
                              </span>

                              <p
                                className="
                                  w-24
                                  text-right
                                  font-bold
                                  text-white
                                "
                              >
                                {formatCurrency(
                                  amount
                                )}
                              </p>
                            </div>
                          </div>
                        </motion.div>
                      );
                    }
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}