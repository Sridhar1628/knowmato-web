"use client";

export const dynamic = "force-dynamic";

import React, { useEffect, useState, useCallback, useRef } from "react";
import { useRouter} from "next/navigation";
import { getMyDoubts } from "@/services/v1Service";
import { apiGet } from "@/services/apiService";
import { connectSocket, disconnectSocket } from "@/services/versionSocketService";
import { getTokens } from "@/services/storageService";
import styles from "./MyDoubts.module.css";

/* ---------- TYPES ---------- */
interface Doubt {
  doubt_id: number;
  title: string;
  category: string;
  preferred_explanation: "text" | "live_video";
  status: "open" | "assigned" | "completed";
  price: number | null;
  mode: "pool" | "specific";
  created_at: string;
  tutor_id: number;
  tutor: string | null;
  session: {
    session_id: number;
    status: string;
    session_type: "text" | "chat" | "live_video";
  } | null;
  review: {
    review_id: number;
    rating: number;
    feedback: string;
    created_at: string;
  } | null;
}

interface FilterOptions {
  status: string;
  category: string;
  mode: string;
  search: string;
  from_date: string;
  to_date: string;
}

const MyDoubtsScreen = () => {
  const router = useRouter();
  const [sessionId, setSessionId] =
  useState("");

  // Data
  const [doubts, setDoubts] = useState<Doubt[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [nextPageUrl, setNextPageUrl] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [activeQuickFilter, setActiveQuickFilter] = useState("all");
  const [searchText, setSearchText] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Filters
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [filters, setFilters] = useState<FilterOptions>({
    status: "",
    category: "",
    mode: "",
    search: "",
    from_date: "",
    to_date: "",
  });
  const [tempFilters, setTempFilters] = useState<FilterOptions>(filters);

  // Pull-to-refresh
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [pullDistance, setPullDistance] = useState(0);
  const pullingRef = useRef(false);
  const startYRef = useRef(0);

  const quickFilters = ["all", "live", "live_video", "text", "completed"];
  const categoryOptions = ["", "Python", "JavaScript", "Java", "C++", "React", "Web Development", "Other"];
  const modeOptions = ["", "pool", "specific"];

  /* ---------- Fetch doubts ---------- */
  const fetchDoubts = async (loadMore = false) => {
    if (!loadMore) setLoading(true);
    else setLoadingMore(true);

    try {
      if (loadMore && nextPageUrl) {
        const res = await apiGet(nextPageUrl);
        const data = res?.data || res;
        const newDoubts = data.results?.data || [];
        setDoubts((prev) => [...prev, ...newDoubts]);
        setNextPageUrl(data.next || null);
        return;
      }

      const params: any = { page: 1 };

      if (activeQuickFilter === "completed") params.status = "completed";
      if (activeQuickFilter === "live") params.status = "assigned";
      if (activeQuickFilter === "live_video") params.preferred_explanation = "live_video";
      if (activeQuickFilter === "text") params.preferred_explanation = "text";

      if (filters.category) params.category = filters.category;
      if (filters.mode) params.mode = filters.mode;
      if (filters.search) params.search = filters.search;
      if (filters.from_date) params.from_date = filters.from_date;
      if (filters.to_date) params.to_date = filters.to_date;

      console.log("FILTER PARAMS:", params);

      const res = await getMyDoubts(params);
      const data = res?.data || res;
      const newDoubts = data.results?.data || [];

      setDoubts(newDoubts);
      setNextPageUrl(data.next || null);
      setTotalCount(data.count || 0);
    } catch (error) {
      console.error("Fetch doubts error:", error);
      window.alert("Failed to load doubts. Please try again.");
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  };

  // Pagination "See More"
  const loadMore = () => {
    if (nextPageUrl && !loadingMore) fetchDoubts(true);
  };

  // Refresh triggered by pull-to-refresh
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setDoubts([]);
    setNextPageUrl(null);
    fetchDoubts(false);
  }, [filters, activeQuickFilter]);

  // Apply filters from modal
  const applyFilters = () => {
    setFilters({ ...tempFilters });
    setDoubts([]);
    setNextPageUrl(null);
    setFilterModalVisible(false);
    setTimeout(() => fetchDoubts(false), 0);
  };

  // Reset filters
  const resetFilters = () => {
    const empty = { status: "", category: "", mode: "", search: "", from_date: "", to_date: "" };
    setTempFilters(empty);
    setFilters(empty);
    setDoubts([]);
    setNextPageUrl(null);
    setFilterModalVisible(false);
    setTimeout(() => fetchDoubts(false), 0);
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(
        window.location.search
      );

      setSessionId(
        params.get("sessionId") || ""
      );
    }
  }, []);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchText), 700);
    return () => clearTimeout(timer);
  }, [searchText]);

  useEffect(() => {
    setFilters((prev) => ({ ...prev, search: debouncedSearch }));
  }, [debouncedSearch]);

  // Re-fetch when filters change
  useEffect(() => {
    fetchDoubts(false);
  }, [activeQuickFilter, filters.category, filters.mode, filters.search, filters.from_date, filters.to_date]);

  // Socket for real-time updates
  useEffect(() => {
    let mounted = true;
    const initSocket = async () => {
      const tokens = await getTokens();
      if (!tokens?.access) return;
      connectSocket(tokens.access, (event, data) => {
        if (!mounted) return;
        console.log("📡 DOUBTS EVENT:", event, data);
        if (event === "DOUBT_CREATED" || event === "DOUBT_UPDATED") {
          fetchDoubts(false);
        }
      });
    };
    initSocket();
    return () => {
      mounted = false;
      disconnectSocket();
    };
  }, [onRefresh]);

  /* ---------- Pull-to-refresh logic ---------- */
  const handleTouchStart = (e: React.TouchEvent) => {
    if (scrollContainerRef.current && scrollContainerRef.current.scrollTop <= 0) {
      pullingRef.current = true;
      startYRef.current = e.touches[0].clientY;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!pullingRef.current) return;
    const currentY = e.touches[0].clientY;
    const delta = currentY - startYRef.current;
    if (delta > 0 && scrollContainerRef.current?.scrollTop === 0) {
      setPullDistance(Math.min(delta * 0.5, 80)); // dampened
      e.preventDefault();
    }
  };

  const handleTouchEnd = () => {
    if (!pullingRef.current) return;
    pullingRef.current = false;
    if (pullDistance > 60 && !refreshing) {
      onRefresh();
    }
    setPullDistance(0);
  };

  /* ---------- Helpers ---------- */
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "open":
        return { emoji: "🟢", color: "#10B981", bg: "#D1FAE5" };
      case "assigned":
        return { emoji: "🔵", color: "#3B82F6", bg: "#DBEAFE" };
      case "completed":
        return { emoji: "✅", color: "#6B7280", bg: "#F3F4F6" };
      default:
        return { emoji: "⚪", color: "#6B7280", bg: "#F3F4F6" };
    }
  };

  const renderStars = (rating: number) => "⭐".repeat(rating);

  const getExplanationStyle = (type: string) => {
    if (type === "live_video") {
      return { icon: "🎥", text: "Live Video Session", color: "#7C3AED", bg: "#F3E8FF" };
    }
    return { icon: "💬", text: "Text/Chat Session", color: "#059669", bg: "#D1FAE5" };
  };

  const handleDoubtPress = (item: Doubt) => {
    router.push(`/student/doubts/${item.doubt_id}`);
  };

  /* ---------- Render ---------- */
  if (loading && !refreshing) {
    return (
      <div className={styles.center}>
        <div className={styles.spinner}></div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <button onClick={() => router.back()} className={styles.backButton}>
          ←
        </button>
        <h1 className={styles.headerTitle}>📋 My Doubts</h1>
        <div style={{ width: 30 }} />
      </div>

      {/* Stats */}
      <div className={styles.statsBar}>
        <span className={styles.statsText}>Total: {totalCount} doubts</span>
      </div>

      {/* Ask New Doubt */}
      <div className={styles.askButtonContainer}>
        <button className={styles.askButton} onClick={() => router.push("/student/post-doubt")}>
          ✨ Ask New Doubt
        </button>
      </div>

      {/* Search */}
      <div className={styles.searchContainer}>
        <input
          type="text"
          placeholder="Search doubts..."
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          className={styles.searchInput}
        />
      </div>

      {/* Quick Filters */}
      <div className={styles.quickFilterWrapper}>
        <div className={styles.quickFilterRow}>
          {quickFilters.map((filter) => {
            const active = activeQuickFilter === filter;
            const labelMap: any = {
              all: "📱 All",
              live: "🟢 Live Doubts",
              live_video: "🎥 Live Video",
              text: "💬 Text/Chat",
              completed: "✅ Completed",
            };
            return (
              <button
                key={filter}
                className={`${styles.quickFilterChip} ${active ? styles.quickFilterChipActive : ""}`}
                onClick={() => {
                  setActiveQuickFilter(filter);
                  setDoubts([]);
                  setNextPageUrl(null);
                }}
              >
                <span className={`${styles.quickFilterText} ${active ? styles.quickFilterTextActive : ""}`}>
                  {labelMap[filter]}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Pull-to-refresh indicator */}
      <div style={{ height: pullDistance, overflow: "hidden", transition: "height 0.2s" }}>
        {pullDistance > 0 && (
          <div className={styles.pullIndicator}>
            {refreshing ? <div className={styles.smallSpinner}></div> : <span>↓ Pull to refresh</span>}
          </div>
        )}
      </div>

      {/* Doubts List */}
      <div
        ref={scrollContainerRef}
        className={styles.scrollContainer}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {doubts.length === 0 ? (
          <div className={styles.emptyState}>
            <span className={styles.emptyEmoji}>📭</span>
            <h3 className={styles.emptyTitle}>
              {activeQuickFilter === "live" ? "No Live Doubts" : "No Doubts Found"}
            </h3>
            <p className={styles.emptySubtitle}>
              {activeQuickFilter === "live"
                ? "New doubts will appear here instantly"
                : "Try changing filters or search"}
            </p>
          </div>
        ) : (
          <>
            {doubts.map((item) => {
              const statusStyle = getStatusStyle(item.status);
              const explanationStyle = getExplanationStyle(item.preferred_explanation);
              const hasReview = !!item.review;

              return (
                <div
                  key={item.doubt_id}
                  className={styles.premiumCard}
                  onClick={() => handleDoubtPress(item)}
                >
                  {/* Top Row */}
                  <div className={styles.topRow}>
                    <div className={styles.iconBox}>
                      <span className={styles.iconEmoji}>
                        {item.preferred_explanation === "live_video" ? "🎥" : "💬"}
                      </span>
                    </div>
                    <div style={{ flex: 1 }}>
                      <span className={styles.doubtId}>Doubt ID: {item.doubt_id}</span>
                      <h3 className={styles.premiumTitle}>{item.title}</h3>
                    </div>
                    <div
                      className={styles.completedBadge}
                      style={{ backgroundColor: statusStyle.bg }}
                    >
                      <span style={{ color: statusStyle.color }} className={styles.completedText}>
                        {item.status === "completed" ? "Completed ✅" : item.status}
                      </span>
                    </div>
                  </div>

                  {/* Category & Type */}
                  <div className={styles.metaRow}>
                    <span className={styles.categoryPill}>{item.category}</span>
                    <span className={styles.separator}>|</span>
                    <span
                      className={styles.sessionTypeBadge}
                      style={{ backgroundColor: explanationStyle.bg }}
                    >
                      <span style={{ color: explanationStyle.color, fontWeight: 600, fontSize: 12 }}>
                        {explanationStyle.icon} {explanationStyle.text}
                      </span>
                    </span>
                  </div>

                  {/* Tutor & Price */}
                  <div className={styles.infoRow}>
                    <span className={styles.tutorText}>
                      👨‍🏫 Tutor: {item.tutor || "Not Assigned"}
                    </span>
                    <span className={styles.priceBig}>₹{item.price || 0}</span>
                  </div>

                  {/* Date */}
                  <span className={styles.dateText}>📅 {formatDate(item.created_at)}</span>

                  {/* Review Section */}
                  {item.status === "completed" && (
                    <div className={styles.reviewCard}>
                      {hasReview ? (
                        <>
                          <div className={styles.reviewLeft}>
                            <div className={styles.ratingBox}>
                              <span className={styles.ratingNumber}>{item.review?.rating}.0</span>
                            </div>
                            <div style={{ marginLeft: 14 }}>
                              <h4 className={styles.reviewTitle}>Your Review</h4>
                              <div className={styles.stars}>{renderStars(item.review?.rating || 0)}</div>
                              <span className={styles.reviewDate}>
                                📅 {formatDate(item.review?.created_at || "")}
                              </span>
                            </div>
                          </div>
                          <span className={styles.arrow}>›</span>
                        </>
                      ) : (
                        <button
                          className={styles.addReviewButton}
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/submit-review/${item.session?.session_id}`);
                          }}
                        >
                          ⭐ Add Review
                        </button>
                      )}
                    </div>
                  )}

                  {/* Action Buttons */}
                  {item.session?.status === "completed" && (
                    <div className={styles.actionRow}>
                      {item.session.session_type === "live_video" ? (
                        <button
                          className={styles.actionButton}
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/recording/${item.session?.session_id}`);
                          }}
                        >
                          🎥 View Recording
                        </button>
                      ) : (
                        <button
                          className={styles.actionButton}
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(
                              `/chat-history?sessionId=${item.session?.session_id}&tutorId=${item.tutor_id}&tutorName=${item.tutor || "Tutor"}`
                            );
                          }}
                        >
                          💬 View Chat History
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}

            {/* "See More" Pagination */}
            {nextPageUrl && (
              <button className={styles.seeMoreButton} onClick={loadMore} disabled={loadingMore}>
                {loadingMore ? "Loading..." : `See More (${doubts.length}/${totalCount})`}
              </button>
            )}
            {loadingMore && <div className={styles.spinner} style={{ margin: "20px auto" }}></div>}
          </>
        )}
      </div>

      {/* Filter Modal */}
      {filterModalVisible && (
        <div className={styles.modalOverlay} onClick={() => setFilterModalVisible(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <h2 className={styles.modalTitle}>Filters</h2>

            <label className={styles.filterLabel}>Category</label>
            <div className={styles.chipRow}>
              {categoryOptions.map((cat) => (
                <button
                  key={cat}
                  className={`${styles.chip} ${tempFilters.category === cat ? styles.chipActive : ""}`}
                  onClick={() => setTempFilters((prev) => ({ ...prev, category: cat }))}
                >
                  {cat || "All"}
                </button>
              ))}
            </div>

            <label className={styles.filterLabel}>Mode</label>
            <div className={styles.chipRow}>
              {modeOptions.map((mode) => (
                <button
                  key={mode}
                  className={`${styles.chip} ${tempFilters.mode === mode ? styles.chipActive : ""}`}
                  onClick={() => setTempFilters((prev) => ({ ...prev, mode: mode }))}
                >
                  {mode || "All"}
                </button>
              ))}
            </div>

            <label className={styles.filterLabel}>Status</label>
            <select
              className={styles.select}
              value={tempFilters.status}
              onChange={(e) => setTempFilters((prev) => ({ ...prev, status: e.target.value }))}
            >
              <option value="">All</option>
              <option value="open">Open</option>
              <option value="assigned">Assigned</option>
              <option value="completed">Completed</option>
            </select>

            <label className={styles.filterLabel}>From Date</label>
            <input
              type="date"
              className={styles.dateInput}
              value={tempFilters.from_date}
              onChange={(e) => setTempFilters((prev) => ({ ...prev, from_date: e.target.value }))}
            />

            <label className={styles.filterLabel}>To Date</label>
            <input
              type="date"
              className={styles.dateInput}
              value={tempFilters.to_date}
              onChange={(e) => setTempFilters((prev) => ({ ...prev, to_date: e.target.value }))}
            />

            <div className={styles.modalActions}>
              <button className={styles.resetButton} onClick={resetFilters}>
                Reset
              </button>
              <button className={styles.applyButton} onClick={applyFilters}>
                Apply
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Filter Button */}
      <button className={styles.filterFab} onClick={() => setFilterModalVisible(true)}>
        🔍
      </button>
    </div>
  );
};

export default MyDoubtsScreen;