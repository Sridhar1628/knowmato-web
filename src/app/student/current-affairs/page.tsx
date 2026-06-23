"use client";

import React, { useEffect, useState, useCallback } from "react";
import { getCurrentAffairs, CurrentAffair } from "@/services/v1Service";
import styles from "./CurrentAffairs.module.css";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const LOADING_MESSAGE = "Loading latest affairs…";
const ERROR_MESSAGE = "Could not load current affairs.";
const EMPTY_MESSAGE = "No current affairs at the moment.";

// Category colours for the badge (tailwind‑like palette)
const categoryColors: Record<string, string> = {
  technology: "#3B82F6",
  science: "#10B981",
  business: "#F59E0B",
  education: "#8B5CF6",
  ai: "#EC4899",
  programming: "#6366F1",
  general: "#6B7280",
};

// ---------------------------------------------------------------------------
// StudentCurrentAffairs
// ---------------------------------------------------------------------------
const StudentCurrentAffairs: React.FC = () => {
  const [affairs, setAffairs] = useState<CurrentAffair[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAffair, setSelectedAffair] = useState<CurrentAffair | null>(
    null
  );

  const [activeTab, setActiveTab] =
    useState<'current' | 'past'>(
      'current'
    );

  const fetchAffairs = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getCurrentAffairs();
      const sortedAffairs =
        [...(response.data ?? [])]
          .sort(
            (a, b) =>
              new Date(
                b.created_at
              ).getTime() -
              new Date(
                a.created_at
              ).getTime()
          );

      setAffairs(
        sortedAffairs
      );
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

  useEffect(() => {

    const handleVisibility =
      () => {

        if (
          document.visibilityState ===
          'visible'
        ) {

          fetchAffairs();

        }

      };

    document.addEventListener(
      'visibilitychange',
      handleVisibility
    );

    return () => {

      document.removeEventListener(
        'visibilitychange',
        handleVisibility
      );

    };

  }, [fetchAffairs]);

  useEffect(() => {

    const handleFocus =
      () => {

        fetchAffairs();

      };

    window.addEventListener(
      'focus',
      handleFocus
    );

    return () => {

      window.removeEventListener(
        'focus',
        handleFocus
      );

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

  const getTimeAgo = (
    dateString: string
  ) => {

    const created =
      new Date(dateString);

    const now =
      new Date();

    const diffMinutes =
      Math.floor(
        (now.getTime() -
          created.getTime()) /
        60000
      );

    if (diffMinutes < 60)
      return `${diffMinutes} min ago`;

    const diffHours =
      Math.floor(
        diffMinutes / 60
      );

    if (diffHours < 24)
      return `${diffHours} hr ago`;

    return `${Math.floor(
      diffHours / 24
    )} day ago`;

  };

  const truncateText = (text: string, maxLength = 120) => {
    return text.length > maxLength ? text.slice(0, maxLength) + "…" : text;
  };

  // ---------------------------------------------------------------------------
  // Modal handlers
  // ---------------------------------------------------------------------------
  const openModal = (affair: CurrentAffair) => setSelectedAffair(affair);
  const closeModal = () => setSelectedAffair(null);

  // Prevent background scroll when modal is open
  useEffect(() => {
    if (selectedAffair) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [selectedAffair]);

  // Close modal on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeModal();
    };
    if (selectedAffair) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedAffair]);

  // ---------------------------------------------------------------------------
  // Loading state
  // ---------------------------------------------------------------------------
  if (loading) {
    return (
      <div className={styles.statusContainer}>
        <div className={styles.spinner} />
        <p>{LOADING_MESSAGE}</p>
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
        <button className={styles.retryBtn} onClick={fetchAffairs}>
          Try Again
        </button>
      </div>
    );
  }

  const currentAffairs =
    affairs.filter(
      (item) => {

        const createdAt =
          new Date(
            item.created_at
          );

        const now =
          new Date();

        const diffHours =
          (now.getTime() -
            createdAt.getTime()) /
          (1000 * 60 * 60);

        return diffHours <= 24;

      }
    );

  const pastAffairs =
    affairs.filter(
      (item) => {

        const createdAt =
          new Date(
            item.created_at
          );

        const now =
          new Date();

        const diffHours =
          (now.getTime() -
            createdAt.getTime()) /
          (1000 * 60 * 60);

        return diffHours > 24;

      }
    );

  const displayAffairs =
    activeTab === 'current'
      ? currentAffairs
      : pastAffairs;

  // ---------------------------------------------------------------------------
  // Main UI
  // ---------------------------------------------------------------------------
  return (
    <div className={styles.page}>
      <h1 className={styles.heading}>Current Affairs</h1>
      <div
        style={{
          display: 'flex',
          gap: '10px',
          marginBottom: '24px',
        }}
      >
        <button
          onClick={() =>
            setActiveTab(
              'current'
            )
          }
          className={
            activeTab === 'current'
              ? styles.activeTab
              : styles.tab
          }
        >
          🔥 Current Affairs
        </button>

        <button
          onClick={() =>
            setActiveTab('past')
          }
          className={
            activeTab === 'past'
              ? styles.activeTab
              : styles.tab
          }
        >
          📚 Past Affairs
        </button>
      </div>

      {displayAffairs.length === 0 ? (
        <div className={styles.emptyState}>
          <span className={styles.emptyEmoji}>📰</span>
          <p>{EMPTY_MESSAGE}</p>
        </div>
      ) : (
        <div className={styles.grid}>
          {displayAffairs.map(
          (affair, index) => (
            <article
              key={affair.id}
              className={styles.card}
              onClick={() => openModal(affair)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") openModal(affair);
              }}
            >
              {/* Image */}
              {affair.image_url && (
                <div className={styles.imageWrapper}>
                  <img
                    src={affair.image_url}
                    alt={affair.title}
                    className={styles.image}
                    loading="lazy"
                  />
                </div>
              )}

              <div className={styles.cardBody}>
                {/* Category badge */}
                <span
                  className={styles.badge}
                  style={{
                    backgroundColor:
                      categoryColors[affair.category] ?? categoryColors.general,
                  }}
                >
                  {affair.category}
                </span>

                {/* Title */}
                <div
                  className="
                    flex
                    items-start
                    justify-between
                    gap-2
                  "
                >
                  <h2
                    className={styles.cardTitle}
                  >
                    {affair.title}
                  </h2>

                  {index === 0 && (
                    <span
                      className="
                        rounded-full
                        bg-red-500
                        px-2
                        py-1
                        text-[10px]
                        font-bold
                        text-white
                      "
                    >
                      LATEST
                    </span>
                  )}
                </div>
                {/* Description */}
                <p className={styles.description}>
                  {truncateText(affair.description)}
                </p>

                {/* Footer */}
                <div className={styles.cardFooter}>
                  <div className={styles.date}>
                  🕒 {getTimeAgo(
                    affair.created_at
                  )}
                </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* Modal for detail view */}
      {selectedAffair && (
        <div
          className={styles.modalBackdrop}
          onClick={closeModal}
          role="dialog"
          aria-modal="true"
        >
          <div
            className={styles.modalContent}
            onClick={(e) => e.stopPropagation()}
          >
            <button className={styles.modalClose} onClick={closeModal}>
              ✕
            </button>

            {selectedAffair.image_url && (
              <div className={styles.modalImageWrapper}>
                <img
                  src={selectedAffair.image_url}
                  alt={selectedAffair.title}
                  className={styles.modalImage}
                />
              </div>
            )}

            <div className={styles.modalBody}>
              <span
                className={styles.badge}
                style={{
                  backgroundColor:
                    categoryColors[selectedAffair.category] ??
                    categoryColors.general,
                }}
              >
                {selectedAffair.category}
              </span>
              <h2 className={styles.modalTitle}>{selectedAffair.title}</h2>
              <p className={styles.modalDescription}>
                {selectedAffair.description}
              </p>
              <time className={styles.date}>
                {formatDate(selectedAffair.created_at)}
              </time>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentCurrentAffairs;