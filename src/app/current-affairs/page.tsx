"use client";

import React, { useEffect, useState, useCallback } from "react";
import { getCurrentAffairs, CurrentAffair } from "@/services/v1Service"; // adjust import
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

  const fetchAffairs = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getCurrentAffairs();
      setAffairs(response.data ?? []);
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

  const truncateText = (text: string, maxLength = 120) => {
    return text.length > maxLength ? text.slice(0, maxLength) + "…" : text;
  };

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

  // ---------------------------------------------------------------------------
  // Main UI
  // ---------------------------------------------------------------------------
  return (
    <div className={styles.page}>
      <h1 className={styles.heading}>Current Affairs</h1>

      {affairs.length === 0 ? (
        <div className={styles.emptyState}>
          <span className={styles.emptyEmoji}>📰</span>
          <p>{EMPTY_MESSAGE}</p>
        </div>
      ) : (
        <div className={styles.grid}>
          {affairs.map((affair) => (
            <article key={affair.id} className={styles.card}>
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
                <h2 className={styles.cardTitle}>{affair.title}</h2>

                {/* Description */}
                <p className={styles.description}>
                  {truncateText(affair.description)}
                </p>

                {/* Footer */}
                <div className={styles.cardFooter}>
                  <time className={styles.date}>
                    {formatDate(affair.created_at)}
                  </time>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
};

export default StudentCurrentAffairs;