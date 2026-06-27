"use client";

import React, { useEffect, useState, useCallback } from "react";
import { getCurrentAffairs, CurrentAffair } from "@/services/v1Service";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const LOADING_MESSAGE = "Loading latest affairs…";
const ERROR_MESSAGE = "Could not load current affairs.";
const EMPTY_MESSAGE = "No current affairs at the moment.";

// Category colours – neon / vibrant palette
const categoryColors: Record<string, string> = {
  technology: "#818CF8",   // indigo-400
  science: "#34D399",      // emerald-400
  business: "#FBBF24",     // amber-400
  education: "#A78BFA",    // violet-400
  ai: "#F472B6",           // pink-400
  programming: "#60A5FA",  // blue-400
  general: "#9CA3AF",      // gray-400
};

// ---------------------------------------------------------------------------
// StudentCurrentAffairs
// ---------------------------------------------------------------------------
const StudentCurrentAffairs: React.FC = () => {
  const [affairs, setAffairs] = useState<CurrentAffair[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAffair, setSelectedAffair] = useState<CurrentAffair | null>(null);
  const [activeTab, setActiveTab] = useState<"current" | "past">("current");

  const fetchAffairs = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getCurrentAffairs();
      const sortedAffairs = [...(response.data ?? [])].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      setAffairs(sortedAffairs);
    } catch (err) {
      console.error("Failed to fetch current affairs:", err);
      setError(ERROR_MESSAGE);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAffairs();
  }, [fetchAffairs]);

  // Refetch on tab visibility change & window focus
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === "visible") fetchAffairs();
    };
    const handleFocus = () => fetchAffairs();

    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("focus", handleFocus);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("focus", handleFocus);
    };
  }, [fetchAffairs]);

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const getTimeAgo = (dateString: string) => {
    const created = new Date(dateString);
    const now = new Date();
    const diffMinutes = Math.floor((now.getTime() - created.getTime()) / 60000);
    if (diffMinutes < 60) return `${diffMinutes} min ago`;
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours} hr ago`;
    return `${Math.floor(diffHours / 24)} day ago`;
  };

  const truncateText = (text: string, maxLength = 120) => {
    return text.length > maxLength ? text.slice(0, maxLength) + "…" : text;
  };

  // ---------------------------------------------------------------------------
  // Modal handlers
  // ---------------------------------------------------------------------------
  const openModal = (affair: CurrentAffair) => setSelectedAffair(affair);
  const closeModal = () => setSelectedAffair(null);

  useEffect(() => {
    if (selectedAffair) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [selectedAffair]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeModal();
    };
    if (selectedAffair) window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedAffair]);

  // ---------------------------------------------------------------------------
  // Filter affairs
  // ---------------------------------------------------------------------------
  const currentAffairs = affairs.filter((item) => {
    const createdAt = new Date(item.created_at);
    const now = new Date();
    const diffHours = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);
    return diffHours <= 24;
  });

  const pastAffairs = affairs.filter((item) => {
    const createdAt = new Date(item.created_at);
    const now = new Date();
    const diffHours = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);
    return diffHours > 24;
  });

  const displayAffairs = activeTab === "current" ? currentAffairs : pastAffairs;

  // ---------------------------------------------------------------------------
  // Loading state
  // ---------------------------------------------------------------------------
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-violet-400 border-t-transparent" />
        <p className="mt-4 text-white/70">{LOADING_MESSAGE}</p>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Error state
  // ---------------------------------------------------------------------------
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-rose-400 font-medium mb-4">{error}</p>
        <button
          onClick={fetchAffairs}
          className="rounded-xl bg-white/10 border border-white/20 px-6 py-2.5 text-sm font-semibold text-white hover:bg-white/20 transition-all"
        >
          Try Again
        </button>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Main UI
  // ---------------------------------------------------------------------------
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-violet-300 via-fuchsia-300 to-cyan-300">
        Current Affairs
      </h1>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab("current")}
          className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${
            activeTab === "current"
              ? "bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white shadow-lg shadow-violet-500/25"
              : "bg-white/10 border border-white/20 text-white/70 hover:bg-white/20"
          }`}
        >
           Current Affairs
        </button>
        <button
          onClick={() => setActiveTab("past")}
          className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${
            activeTab === "past"
              ? "bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white shadow-lg shadow-violet-500/25"
              : "bg-white/10 border border-white/20 text-white/70 hover:bg-white/20"
          }`}
        >
           Past Affairs
        </button>
      </div>

      {displayAffairs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-white/50">
          <span className="text-5xl mb-4">📰</span>
          <p className="text-lg">{EMPTY_MESSAGE}</p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {displayAffairs.map((affair, index) => (
            <article
              key={affair.id}
              onClick={() => openModal(affair)}
              className="group cursor-pointer rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl overflow-hidden transition-all hover:border-violet-400/40 hover:shadow-xl hover:-translate-y-1"
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") openModal(affair);
              }}
            >
              {affair.image_url && (
                <div className="h-44 w-full overflow-hidden">
                  <img
                    src={affair.image_url}
                    alt={affair.title}
                    className="h-full w-full object-cover transition-transform group-hover:scale-105"
                    loading="lazy"
                  />
                </div>
              )}

              <div className="p-4">
                <span
                  className="inline-block rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-white shadow-sm"
                  style={{ backgroundColor: categoryColors[affair.category] ?? categoryColors.general }}
                >
                  {affair.category}
                </span>

                <div className="flex items-start justify-between gap-2 mt-3">
                  <h2 className="text-base font-bold text-white line-clamp-2">
                    {affair.title}
                  </h2>
                  {index === 0 && activeTab === "current" && (
                    <span className="rounded-full bg-gradient-to-r from-rose-500 to-pink-500 px-2 py-1 text-[10px] font-bold text-white shadow">
                      LATEST
                    </span>
                  )}
                </div>

                <p className="mt-2 text-sm text-white/70 line-clamp-3">
                  {truncateText(affair.description)}
                </p>

                <div className="mt-4 flex items-center text-xs text-white/40">
                  🕒 {getTimeAgo(affair.created_at)}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* Modal for detail view */}
      {selectedAffair && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={closeModal}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-white/10 bg-[#0f0c29]/90 backdrop-blur-xl shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="absolute top-4 right-4 text-white/60 hover:text-white text-xl"
              onClick={closeModal}
            >
              ✕
            </button>

            {selectedAffair.image_url && (
              <div className="w-full h-64 overflow-hidden rounded-t-2xl">
                <img
                  src={selectedAffair.image_url}
                  alt={selectedAffair.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            <div className="p-6">
              <span
                className="inline-block rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-white"
                style={{ backgroundColor: categoryColors[selectedAffair.category] ?? categoryColors.general }}
              >
                {selectedAffair.category}
              </span>
              <h2 className="mt-4 text-2xl font-bold text-white">{selectedAffair.title}</h2>
              <p className="mt-4 text-white/80 leading-relaxed whitespace-pre-wrap">
                {selectedAffair.description}
              </p>
              <p className="mt-6 text-sm text-white/50">
                {formatDate(selectedAffair.created_at)}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentCurrentAffairs;