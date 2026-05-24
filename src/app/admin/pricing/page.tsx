"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  getPricingSlots,
  createPricingSlot,
  updatePricingSlot,
  deletePricingSlot,
} from "@/services/v1Service";
import toast from "react-hot-toast";

// ---------- Types ----------
interface PricingSlot {
  id: number;
  date: string;        // YYYY-MM-DD
  start_time: string;  // HH:MM (24h)
  end_time: string;    // HH:MM
  price: number;
}

// Helper: 24h to 12h
const formatTo12Hour = (time24: string) => {
  if (!time24) return "";
  const [h, m] = time24.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 || 12;
  return `${hour12}:${String(m).padStart(2, "0")} ${ampm}`;
};

export default function AdminPricingScreen() {
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
          // For load more, the API usually returns an absolute URL in "next"
          // We'll use the fetch directly with the URL
          const res = await fetch(pageUrl, {
            headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
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
        const results = data.results || data; // adjust based on actual API shape
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

  // Initial load and on filter change
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
      // Refresh list
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
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
          <p className="mt-4 text-gray-600">Loading pricing slots...</p>
        </div>
      </div>
    );
  }

  // ---------- Render ----------
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-indigo-800 text-white py-4 shadow-md">
        <div className="max-w-5xl mx-auto px-4 flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-full hover:bg-white/20 transition"
          >
            <span className="text-xl">←</span>
          </button>
          <h1 className="text-lg font-bold">💰 Pricing Slots</h1>
          <div className="w-10" />
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
        {/* Filter Bar */}
        <div className="flex flex-wrap gap-2 mb-4">
          <label className="flex items-center gap-2 bg-white px-3 py-2 rounded-full border border-gray-200 text-sm cursor-pointer">
            <span>📅 From:</span>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="outline-none text-sm"
            />
          </label>

          <label className="flex items-center gap-2 bg-white px-3 py-2 rounded-full border border-gray-200 text-sm cursor-pointer">
            <span>📅 To:</span>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="outline-none text-sm"
            />
          </label>

          <label className="flex items-center gap-2 bg-white px-3 py-2 rounded-full border border-gray-200 text-sm cursor-pointer">
            <span>🕒 Start ≥</span>
            <input
              type="time"
              value={minStartTime}
              onChange={(e) => setMinStartTime(e.target.value)}
              className="outline-none text-sm"
            />
          </label>

          <button
            onClick={() =>
              setSortOrder((prev) => (prev === "latest" ? "oldest" : "latest"))
            }
            className="bg-white px-3 py-2 rounded-full border border-gray-200 text-sm"
          >
            {sortOrder === "latest" ? "📅 Latest First" : "📅 Oldest First"}
          </button>

          {(fromDate || toDate || minStartTime) && (
            <button
              onClick={resetFilters}
              className="bg-red-50 text-red-600 px-3 py-2 rounded-full border border-red-200 text-sm font-semibold"
            >
              Reset
            </button>
          )}
        </div>

        {/* Refresh & Add */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow hover:bg-gray-100 disabled:opacity-50"
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
          </button>

          <button
            onClick={openCreateModal}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-6 rounded-full transition"
          >
            + Create New Slot
          </button>
        </div>

        {/* Slots List */}
        {displayedSlots.length === 0 ? (
          <div className="text-center py-20 text-gray-400">📭 No pricing slots found</div>
        ) : (
          <div className="space-y-4">
            {displayedSlots.map((slot) => (
              <div
                key={slot.id}
                className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100"
              >
                <div className="flex justify-between items-start mb-2">
                  <span className="text-lg font-semibold text-gray-800">
                    📅 {slot.date}
                  </span>
                  <span className="bg-indigo-50 text-indigo-700 font-bold px-3 py-1 rounded-full text-sm">
                    ₹{slot.price}
                  </span>
                </div>
                <p className="text-gray-500 mb-4">
                  ⏰ {formatTo12Hour(slot.start_time)} – {formatTo12Hour(slot.end_time)}
                </p>
                <div className="flex gap-3 justify-end">
                  <button
                    onClick={() => openEditModal(slot)}
                    className="bg-emerald-500 hover:bg-emerald-600 text-white font-semibold px-4 py-1.5 rounded-lg text-sm"
                  >
                    ✏️ Edit
                  </button>
                  <button
                    onClick={() => handleDelete(slot)}
                    className="bg-red-500 hover:bg-red-600 text-white font-semibold px-4 py-1.5 rounded-lg text-sm"
                  >
                    🗑️ Delete
                  </button>
                </div>
              </div>
            ))}

            {/* Load More */}
            {nextPageUrl && (
              <button
                onClick={loadMore}
                disabled={loadingMore}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-xl mt-4 disabled:opacity-50"
              >
                {loadingMore
                  ? "Loading..."
                  : `Load More (${displayedSlots.length}/${totalCount})`}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white w-full max-w-md mx-4 rounded-2xl p-6">
            <h2 className="text-xl font-bold mb-4">
              {editingSlot ? "✏️ Edit Slot" : "➕ Create Slot"}
            </h2>

            <div className="space-y-3">
              <label className="block">
                <span className="text-sm font-medium">📅 Date</span>
                <input
                  type="date"
                  value={formDate}
                  onChange={(e) => setFormDate(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-gray-200 p-2.5 text-sm"
                />
              </label>

              <label className="block">
                <span className="text-sm font-medium">🕒 Start Time</span>
                <input
                  type="time"
                  value={formStartTime}
                  onChange={(e) => setFormStartTime(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-gray-200 p-2.5 text-sm"
                />
              </label>

              <label className="block">
                <span className="text-sm font-medium">🕒 End Time</span>
                <input
                  type="time"
                  value={formEndTime}
                  onChange={(e) => setFormEndTime(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-gray-200 p-2.5 text-sm"
                />
              </label>

              <label className="block">
                <span className="text-sm font-medium">💰 Price (₹)</span>
                <input
                  type="number"
                  value={formPrice}
                  onChange={(e) => setFormPrice(e.target.value)}
                  placeholder="e.g., 50"
                  className="mt-1 w-full rounded-xl border border-gray-200 p-2.5 text-sm"
                />
              </label>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setModalOpen(false)}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-2 rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 rounded-xl"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}