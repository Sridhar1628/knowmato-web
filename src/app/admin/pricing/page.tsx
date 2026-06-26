"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  getPricingSlots,
  createPricingSlot,
  updatePricingSlot,
  deletePricingSlot,
} from "@/services/v1Service";
import AdminLayout from "@/app/admin/AdminLayout";
import toast from "react-hot-toast";

// ---------- Types ----------
interface PricingSlot {
  id: number;
  date: string;        // YYYY-MM-DD
  start_time: string;  // HH:MM (24h)
  end_time: string;    // HH:MM
  price: number;
}

// Helper: 24h → 12h
const formatTo12Hour = (time24: string) => {
  if (!time24) return "";
  const [h, m] = time24.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 || 12;
  return `${hour12}:${String(m).padStart(2, "0")} ${ampm}`;
};

export default function AdminPricingPage() {
  const router = useRouter();

  // ---------- State ----------
  const [allSlots, setAllSlots] = useState<PricingSlot[]>([]);
  const [displayedSlots, setDisplayedSlots] = useState<PricingSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [nextPageUrl, setNextPageUrl] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);

  // Filters
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [minStartTime, setMinStartTime] = useState("");
  const [sortOrder, setSortOrder] = useState<"latest" | "oldest">("latest");

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSlot, setEditingSlot] = useState<PricingSlot | null>(null);
  const [formDate, setFormDate] = useState("");
  const [formStartTime, setFormStartTime] = useState("");
  const [formEndTime, setFormEndTime] = useState("");
  const [formPrice, setFormPrice] = useState("");

  // ---------- Fetch Slots ----------
  const fetchSlots = useCallback(
    async (loadMore = false, pageUrl?: string | null) => {
      if (!loadMore) setLoading(true);
      else setLoadingMore(true);

      try {
        let response;
        if (pageUrl) {
          // For paginated "next" URL (if returned as absolute)
          const res = await fetch(pageUrl, {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
              "Content-Type": "application/json",
            },
          });
          if (!res.ok) throw new Error("Failed to fetch next page");
          response = await res.json();
        } else {
          const params: any = { page: 1 };
          if (fromDate) params.from_date = fromDate;
          if (toDate) params.to_date = toDate;
          if (minStartTime) params.start_time = minStartTime;
          response = await getPricingSlots(params);
        }

        const data = response?.data || response;
        const results = data.results || data;
        const newSlots = Array.isArray(results) ? results : results?.data || [];
        const nextUrl = data.next || results?.next || null;
        const count = data.count || results?.count || newSlots.length;

        setAllSlots((prev) => (loadMore ? [...prev, ...newSlots] : newSlots));
        setNextPageUrl(nextUrl);
        setTotalCount(count);
      } catch (error: any) {
        console.error("Fetch pricing slots error:", error);
        toast.error("Failed to load pricing slots.");
      } finally {
        setLoading(false);
        setRefreshing(false);
        setLoadingMore(false);
      }
    },
    [fromDate, toDate, minStartTime]
  );

  // Sorting
  const applySorting = useCallback(
    (slots: PricingSlot[]) => {
      const sorted = [...slots];
      sorted.sort((a, b) => {
        const dateTimeA = new Date(`${a.date}T${a.start_time}`).getTime();
        const dateTimeB = new Date(`${b.date}T${b.start_time}`).getTime();
        return sortOrder === "latest"
          ? dateTimeB - dateTimeA
          : dateTimeA - dateTimeB;
      });
      setDisplayedSlots(sorted);
    },
    [sortOrder]
  );

  useEffect(() => {
    applySorting(allSlots);
  }, [allSlots, applySorting]);

  // Initial load & on filter change
  useEffect(() => {
    setAllSlots([]);
    setNextPageUrl(null);
    fetchSlots(false);
  }, [fromDate, toDate, minStartTime]);

  const handleRefresh = () => {
    setRefreshing(true);
    setAllSlots([]);
    setNextPageUrl(null);
    fetchSlots(false);
  };

  const loadMore = () => {
    if (nextPageUrl && !loadingMore) {
      fetchSlots(true, nextPageUrl);
    }
  };

  const resetFilters = () => {
    setFromDate("");
    setToDate("");
    setMinStartTime("");
    setSortOrder("latest");
  };

  // ---------- Modal Handlers ----------
  const openCreateModal = () => {
    setEditingSlot(null);
    setFormDate("");
    setFormStartTime("");
    setFormEndTime("");
    setFormPrice("");
    setModalOpen(true);
  };

  const openEditModal = (slot: PricingSlot) => {
    setEditingSlot(slot);
    setFormDate(slot.date);
    setFormStartTime(slot.start_time);
    setFormEndTime(slot.end_time);
    setFormPrice(slot.price.toString());
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!formDate || !formStartTime || !formEndTime || !formPrice) {
      toast.error("Please fill all fields");
      return;
    }
    const priceNum = parseFloat(formPrice);
    if (isNaN(priceNum) || priceNum <= 0) {
      toast.error("Price must be a positive number");
      return;
    }

    try {
      if (editingSlot) {
        await updatePricingSlot(editingSlot.id, {
          date: formDate,
          start_time: formStartTime,
          end_time: formEndTime,
          price: priceNum,
        });
        toast.success("Slot updated");
      } else {
        await createPricingSlot({
          date: formDate,
          start_time: formStartTime,
          end_time: formEndTime,
          price: priceNum,
        });
        toast.success("Slot created");
      }
      setModalOpen(false);
      setAllSlots([]);
      setNextPageUrl(null);
      fetchSlots(false);
    } catch (error: any) {
      console.error("Save error:", error);
      const msg = error?.response?.data?.error || "Operation failed";
      toast.error(msg);
    }
  };

  const handleDelete = async (slot: PricingSlot) => {
    const confirmed = window.confirm(
      `Remove slot on ${slot.date} ${formatTo12Hour(slot.start_time)}-${formatTo12Hour(slot.end_time)}?`
    );
    if (!confirmed) return;
    try {
      await deletePricingSlot(slot.id);
      toast.success("Slot deleted");
      handleRefresh();
    } catch {
      toast.error("Failed to delete");
    }
  };

  // ---------- Loading State ----------
  if (loading && !refreshing) {
    return (
      <AdminLayout>
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="text-center">
            <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-violet-500 border-t-transparent" />
            <p className="mt-4 text-white/60">Loading pricing slots...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  // ---------- Render ----------
  return (
    <AdminLayout>
      <div className="min-h-screen bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e] relative overflow-hidden p-4 sm:p-6 lg:p-8">
        {/* Animated blobs */}
        <div className="absolute top-0 -left-20 w-72 h-72 bg-purple-500/20 rounded-full mix-blend-multiply filter blur-3xl animate-blob" />
        <div className="absolute top-0 -right-20 w-72 h-72 bg-fuchsia-500/20 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000" />
        <div className="absolute -bottom-20 left-40 w-72 h-72 bg-cyan-500/20 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000" />

        <div className="relative z-10 max-w-5xl mx-auto">
          {/* Page Header */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-violet-300 via-fuchsia-300 to-cyan-300">
              💰 Pricing Slots
            </h1>
            <p className="text-white/70 mt-1">Manage your availability & pricing</p>
          </motion.div>

          {/* Filter Bar – wraps perfectly on mobile */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-wrap gap-3 mb-6"
          >
            {/* From Date */}
            <label className="flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl px-4 py-2.5 text-sm text-white cursor-pointer hover:bg-white/20 transition">
              <span>📅 From</span>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="bg-transparent outline-none text-white [color-scheme:dark]"
              />
            </label>

            {/* To Date */}
            <label className="flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl px-4 py-2.5 text-sm text-white cursor-pointer hover:bg-white/20 transition">
              <span>📅 To</span>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="bg-transparent outline-none text-white [color-scheme:dark]"
              />
            </label>

            {/* Min Start Time */}
            <label className="flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl px-4 py-2.5 text-sm text-white cursor-pointer hover:bg-white/20 transition">
              <span>🕒 Start ≥</span>
              <input
                type="time"
                value={minStartTime}
                onChange={(e) => setMinStartTime(e.target.value)}
                className="bg-transparent outline-none text-white [color-scheme:dark]"
              />
            </label>

            {/* Sort Order Toggle */}
            <button
              onClick={() =>
                setSortOrder((prev) => (prev === "latest" ? "oldest" : "latest"))
              }
              className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl px-4 py-2.5 text-sm text-white font-medium hover:bg-white/20 transition"
            >
              {sortOrder === "latest" ? "📅 Latest First" : "📅 Oldest First"}
            </button>

            {/* Reset filters */}
            {(fromDate || toDate || minStartTime) && (
              <button
                onClick={resetFilters}
                className="bg-rose-500/20 backdrop-blur-md border border-rose-400/40 rounded-xl px-4 py-2.5 text-sm text-rose-300 font-semibold hover:bg-rose-500/30 transition"
              >
                Reset
              </button>
            )}
          </motion.div>

          {/* Refresh & Add */}
          <div className="flex items-center justify-between mb-6">
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center gap-2 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 px-5 py-2.5 text-sm font-medium text-white hover:bg-white/20 disabled:opacity-50 transition"
            >
              <svg
                className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
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
              {refreshing ? "Refreshing..." : "Refresh"}
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={openCreateModal}
              className="bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white font-bold py-2.5 px-6 rounded-xl shadow-lg shadow-violet-500/25 hover:from-violet-600 hover:to-fuchsia-600 transition"
            >
              + Create New Slot
            </motion.button>
          </div>

          {/* Slots List */}
          {displayedSlots.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-20 bg-white/5 backdrop-blur-md rounded-3xl border border-white/10"
            >
              <div className="text-5xl mb-4">📭</div>
              <h2 className="text-2xl font-bold text-white">No pricing slots found</h2>
              <p className="text-white/70 mt-2">
                Try adjusting your filters or create a new slot.
              </p>
            </motion.div>
          ) : (
            <div className="space-y-4">
              {displayedSlots.map((slot) => (
                <motion.div
                  key={slot.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className="bg-white/5 backdrop-blur-xl rounded-2xl p-5 border border-white/10 shadow-xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
                >
                  <div className="flex-1">
                    <span className="text-lg font-bold text-white block">
                      📅 {slot.date}
                    </span>
                    <span className="text-white/70 text-sm">
                      ⏰ {formatTo12Hour(slot.start_time)} – {formatTo12Hour(slot.end_time)}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="bg-violet-500/20 text-violet-300 font-bold px-4 py-1.5 rounded-full text-sm border border-violet-400/30">
                      ₹{slot.price}
                    </span>
                    <div className="flex gap-2">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => openEditModal(slot)}
                        className="bg-emerald-500/20 text-emerald-300 font-semibold px-4 py-2 rounded-xl border border-emerald-400/30 hover:bg-emerald-500/30 transition"
                      >
                        ✏️
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleDelete(slot)}
                        className="bg-rose-500/20 text-rose-300 font-semibold px-4 py-2 rounded-xl border border-rose-400/30 hover:bg-rose-500/30 transition"
                      >
                        🗑️
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              ))}

              {/* Load More */}
              {nextPageUrl && (
                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={loadMore}
                  disabled={loadingMore}
                  className="w-full bg-gradient-to-r from-violet-500/20 to-fuchsia-500/20 backdrop-blur-md border border-white/10 text-white font-bold py-3 rounded-xl mt-4 disabled:opacity-50 hover:from-violet-500/30 hover:to-fuchsia-500/30 transition"
                >
                  {loadingMore
                    ? "Loading..."
                    : `Load More (${displayedSlots.length}/${totalCount})`}
                </motion.button>
              )}
            </div>
          )}
        </div>

        {/* Create/Edit Modal – dark glassmorphism */}
        <AnimatePresence>
          {modalOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
              onClick={() => setModalOpen(false)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                transition={{ duration: 0.2 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-gradient-to-b from-[#1e1b4b] to-[#312e81] backdrop-blur-xl border border-white/20 rounded-3xl p-6 w-full max-w-md shadow-2xl"
              >
                <h2 className="text-2xl font-bold text-white mb-6">
                  {editingSlot ? "✏️ Edit Slot" : "➕ Create Slot"}
                </h2>

                <div className="space-y-4">
                  <label className="block">
                    <span className="text-sm font-medium text-white/80">📅 Date</span>
                    <input
                      type="date"
                      value={formDate}
                      onChange={(e) => setFormDate(e.target.value)}
                      className="mt-1 w-full rounded-xl bg-gray-900/60 border-2 border-white/20 p-3 text-sm text-white [color-scheme:dark] focus:ring-4 focus:ring-violet-500/50 focus:border-violet-400 outline-none transition"
                    />
                  </label>

                  <label className="block">
                    <span className="text-sm font-medium text-white/80">🕒 Start Time</span>
                    <input
                      type="time"
                      value={formStartTime}
                      onChange={(e) => setFormStartTime(e.target.value)}
                      className="mt-1 w-full rounded-xl bg-gray-900/60 border-2 border-white/20 p-3 text-sm text-white [color-scheme:dark] focus:ring-4 focus:ring-violet-500/50 focus:border-violet-400 outline-none transition"
                    />
                  </label>

                  <label className="block">
                    <span className="text-sm font-medium text-white/80">🕒 End Time</span>
                    <input
                      type="time"
                      value={formEndTime}
                      onChange={(e) => setFormEndTime(e.target.value)}
                      className="mt-1 w-full rounded-xl bg-gray-900/60 border-2 border-white/20 p-3 text-sm text-white [color-scheme:dark] focus:ring-4 focus:ring-violet-500/50 focus:border-violet-400 outline-none transition"
                    />
                  </label>

                  <label className="block">
                    <span className="text-sm font-medium text-white/80">💰 Price (₹)</span>
                    <input
                      type="number"
                      value={formPrice}
                      onChange={(e) => setFormPrice(e.target.value)}
                      placeholder="e.g., 50"
                      className="mt-1 w-full rounded-xl bg-gray-900/60 border-2 border-white/20 p-3 text-sm text-white placeholder-white/40 focus:ring-4 focus:ring-violet-500/50 focus:border-violet-400 outline-none transition"
                    />
                  </label>
                </div>

                <div className="flex gap-3 mt-8">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setModalOpen(false)}
                    className="flex-1 bg-white/10 hover:bg-white/20 text-white font-semibold py-3 rounded-xl border border-white/20 transition"
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleSave}
                    className="flex-1 bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white font-bold py-3 rounded-xl shadow-lg shadow-violet-500/25 hover:from-violet-600 hover:to-fuchsia-600 transition"
                  >
                    Save
                  </motion.button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </AdminLayout>
  );
}