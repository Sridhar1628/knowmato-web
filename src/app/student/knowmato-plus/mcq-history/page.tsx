"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getMCQMarks, MCQMark } from "@/services/assessmentService";
import { useTranslation } from "react-i18next";
import AlertService from "@/services/alertService";

export default function MCQHistoryPage() {
  const router = useRouter();
  const { t } = useTranslation();

  // ─── State ──────────────────────────────────────────────
  const [marks, setMarks] = useState<MCQMark[]>([]);
  const [loading, setLoading] = useState(true);

  // ─── Fetch history ──────────────────────────────────────
  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setLoading(true);

        const data = await getMCQMarks();

        const sorted = (data || []).sort(
          (a, b) =>
            new Date(b.created_at).getTime() -
            new Date(a.created_at).getTime(),
        );

        setMarks(sorted);
      } catch (error: any) {
        console.error("MCQ HISTORY ERROR:", error);

        const errorMessage =
          error?.response?.data?.detail ||
          error?.response?.data?.message ||
          error?.response?.data?.error ||
          error?.message ||
          t("mcqHistory.error");

        AlertService.error(
          "Unable to Load MCQ History",
          errorMessage,
        );
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [t]);

  // ─── Loading state ──────────────────────────────────────
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e]">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-violet-400 border-t-transparent" />

          <p className="mt-2 text-sm text-white/70">
            {t("mcqHistory.loading")}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e]">
      {/* Background blobs */}
      <div className="absolute -left-20 top-0 h-72 w-72 animate-blob rounded-full bg-purple-500/20 blur-3xl filter mix-blend-multiply" />

      <div className="animation-delay-2000 absolute -right-20 top-0 h-72 w-72 animate-blob rounded-full bg-fuchsia-500/20 blur-3xl filter mix-blend-multiply" />

      <div className="animation-delay-4000 absolute -bottom-20 left-40 h-72 w-72 animate-blob rounded-full bg-cyan-500/20 blur-3xl filter mix-blend-multiply" />

      {/* Subtle grid overlay */}
      <div className="pointer-events-none absolute inset-0 opacity-[0.03] [background-image:linear-gradient(#ffffff_1px,transparent_1px),linear-gradient(to_right,#ffffff_1px,transparent_1px)] [background-size:45px_45px]" />

      <div className="relative z-10 p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() =>
              router.push("/student/knowmato-plus/assessments")
            }
            className="mb-4 flex items-center gap-1 text-sm font-semibold text-fuchsia-300 transition-colors hover:text-fuchsia-200"
          >
            ← {t("mcqHistory.backToDashboard")}
          </button>

          <h1 className="bg-gradient-to-r from-violet-300 via-fuchsia-300 to-cyan-300 bg-clip-text text-2xl font-bold leading-tight text-transparent md:text-3xl">
            📝 {t("mcqHistory.title")}
          </h1>

          <p className="mt-2 text-sm text-white/50">
            {t("mcqHistory.subtitle")}
          </p>
        </div>

        {/* List of MCQ results */}
        {marks.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/20 bg-white/5 p-12 text-center backdrop-blur-xl">
            <div className="mb-4 text-4xl">📭</div>

            <p className="text-sm text-white/50">
              {t("mcqHistory.noAttempts")}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {marks.map((mark) => (
              <div
                key={mark.id}
                className="flex flex-col justify-between rounded-2xl border border-white/10 bg-white/5 p-5 shadow-lg backdrop-blur-xl transition hover:border-fuchsia-400/40 sm:flex-row sm:items-center"
              >
                {/* Left information */}
                <div className="mb-3 sm:mb-0">
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Type */}
                    <span className="rounded-full border border-fuchsia-400/30 bg-fuchsia-400/20 px-3 py-1 text-[10px] font-bold uppercase text-fuchsia-300">
                      {mark.type}
                    </span>

                    {/* Subtype */}
                    {mark.subtype && (
                      <span className="text-xs text-white/70">
                        {mark.subtype}
                      </span>
                    )}

                    {/* Status */}
                    <span className="rounded-full border border-emerald-400/30 bg-emerald-400/20 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
                      {mark.status}
                    </span>
                  </div>

                  {/* Date and time */}
                  <p className="mt-1 text-xs text-white/50">
                    {new Date(mark.created_at).toLocaleDateString(
                      undefined,
                      {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      },
                    )}

                    {" • "}

                    {new Date(mark.created_at).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>

                {/* Score */}
                <div className="text-right">
                  <p className="text-xl font-bold text-white">
                    {mark.marks}{" "}
                    {t("mcqHistory.points")}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Blob animation */}
      <style jsx>{`
        @keyframes blob {
          0% {
            transform: translate(0px, 0px) scale(1);
          }

          33% {
            transform: translate(30px, -50px) scale(1.1);
          }

          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }

          100% {
            transform: translate(0px, 0px) scale(1);
          }
        }

        .animate-blob {
          animation: blob 7s infinite;
        }

        .animation-delay-2000 {
          animation-delay: 2s;
        }

        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
}