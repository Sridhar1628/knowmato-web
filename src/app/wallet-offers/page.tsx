"use client";

import React, { useEffect, useState } from "react";
import { getAvailableWalletOffers, AvailableOffer } from "@/services/v1Service"; // adapt import path
import styles from "./StudentOffersScreen.module.css";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const EMPTY_MESSAGE = "No offers available at the moment.";
const ERROR_MESSAGE = "Something went wrong while loading offers.";

// ---------------------------------------------------------------------------
// StudentOffersScreen
// ---------------------------------------------------------------------------
const StudentOffersScreen: React.FC = () => {
  const [offers, setOffers] = useState<AvailableOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchOffers();
  }, []);

  const fetchOffers = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getAvailableWalletOffers();
      // Assuming API returns { data: AvailableOffer[] } or directly the array
      const data = Array.isArray(response) ? response : response.data;
      setOffers(data ?? []);
    } catch (err) {
      console.error("Failed to fetch offers:", err);
      setError(ERROR_MESSAGE);
    } finally {
      setLoading(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------
  const formatCurrency = (value: number | string) => {
    const num = typeof value === "string" ? parseFloat(value) : value;
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
    }).format(num);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const isOfferActive = (offer: AvailableOffer) => {
    if (!offer.is_active) return false;
    const now = new Date();
    const start = new Date(offer.start_date);
    const end = new Date(offer.end_date);
    return now >= start && now <= end;
  };

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  if (loading) {
    return (
      <div className={styles.statusContainer}>
        <div className={styles.spinner} />
        <p>Loading offers…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.statusContainer}>
        <p className={styles.errorText}>{error}</p>
        <button className={styles.retryBtn} onClick={fetchOffers}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <h1 className={styles.heading}>Top‑Up Offers</h1>

      {offers.length === 0 ? (
        <div className={styles.emptyState}>
          <p>{EMPTY_MESSAGE}</p>
        </div>
      ) : (
        <div className={styles.grid}>
          {offers.map((offer) => {
            const active = isOfferActive(offer);
            return (
              <div
                key={offer.id}
                className={`${styles.card} ${active ? styles.cardActive : styles.cardInactive}`}
              >
                <div className={styles.cardHeader}>
                  <h2 className={styles.offerName}>{offer.title}</h2>
                  {active && <span className={styles.badge}>Active</span>}
                </div>

                <div className={styles.bonusRow}>
                  <span className={styles.bonusLabel}>Bonus</span>
                  <span className={styles.bonusValue}>{offer.bonus_percentage}%</span>
                </div>

                <div className={styles.detailRow}>
                  <span>Min. Top‑Up</span>
                  <strong>{formatCurrency(offer.min_amount)}</strong>
                </div>

                <div className={styles.detailRow}>
                  <span>Max Bonus</span>
                  <strong>{formatCurrency(offer.max_bonus)}</strong>
                </div>

                <div className={styles.detailRow}>
                  <span>Valid</span>
                  <span className={styles.dateRange}>
                    {formatDate(offer.start_date)} – {formatDate(offer.end_date)}
                  </span>
                </div>

                {offer.description && (
                  <p className={styles.description}>{offer.description}</p>
                )}

                {!active && (
                  <div className={styles.expiredTag}>
                    Expired / Inactive
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default StudentOffersScreen;