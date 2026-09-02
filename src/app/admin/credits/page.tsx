"use client";

import React, { useEffect, useState, useCallback, memo } from "react";
import { motion } from "framer-motion";
import {
  adminGetCategories,
  adminCreateCategory,
  adminUpdateCategory,
  adminDeleteCategory,
  adminGetPlans,
  adminCreatePlan,
  adminUpdatePlan,
  adminDeletePlan,
  adminGetCosts,
  adminUpdateCost,
  adminAdjustCredits,
  CreditCategory,
  CreditPlan,
  CreditCost,
} from "@/services/v1Service";
import AdminLayout from "@/app/admin/AdminLayout";
import AlertService from "@/services/alertService";

type Tab = "categories" | "plans" | "costs" | "adjust";

// ---------- Tab Button (memoized) ----------
const TabButton = memo(({ tab, active, onClick }: { tab: Tab; active: boolean; onClick: () => void }) => (
  <button
    onClick={onClick}
    className={`px-4 py-2 text-sm font-medium rounded-lg transition ${
      active ? "bg-violet-600 text-white" : "bg-white/5 text-white/60 hover:bg-white/10 hover:text-white"
    }`}
  >
    {tab.charAt(0).toUpperCase() + tab.slice(1)}
  </button>
));
TabButton.displayName = "TabButton";

// ---------- Category Modal (memoized) ----------
const CategoryModal = memo(
  ({
    isOpen,
    onClose,
    onSave,
    editingCat,
    form,
    setForm,
  }: {
    isOpen: boolean;
    onClose: () => void;
    onSave: () => void;
    editingCat: CreditCategory | null;
    form: { name: string; description: string; is_active: boolean };
    setForm: React.Dispatch<React.SetStateAction<{ name: string; description: string; is_active: boolean }>>;
  }) => {
    if (!isOpen) return null;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
        <div className="bg-[#1f1b3a] rounded-2xl p-6 max-w-md w-full mx-4 border border-white/10">
          <h2 className="text-xl font-bold text-white mb-4">{editingCat ? "Edit Category" : "Add Category"}</h2>
          <input
            type="text"
            placeholder="Name"
            value={form.name}
            onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/40 mb-3 focus:outline-none focus:ring-2 focus:ring-violet-500"
          />
          <input
            type="text"
            placeholder="Description"
            value={form.description}
            onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/40 mb-3 focus:outline-none focus:ring-2 focus:ring-violet-500"
          />
          <div className="flex items-center gap-2 mb-4">
            <label className="text-white/70">Active</label>
            <button
              onClick={() => setForm((prev) => ({ ...prev, is_active: !prev.is_active }))}
              className="text-2xl"
            >
              {form.is_active ? "✅" : "❌"}
            </button>
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-white font-medium transition"
            >
              Cancel
            </button>
            <button
              onClick={onSave}
              className="flex-1 py-2 bg-violet-600 hover:bg-violet-700 rounded-xl text-white font-semibold transition"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    );
  }
);
CategoryModal.displayName = "CategoryModal";

// ---------- Plan Modal (memoized) ----------
const PlanModal = memo(
  ({
    isOpen,
    onClose,
    onSave,
    editingPlan,
    form,
    setForm,
    allCategories,
  }: {
    isOpen: boolean;
    onClose: () => void;
    onSave: () => void;
    editingPlan: CreditPlan | null;
    form: {
      name: string;
      description: string;
      price: string;
      is_active: boolean;
      items: { category: number; quantity: number }[];
    };
    setForm: React.Dispatch<
      React.SetStateAction<{
        name: string;
        description: string;
        price: string;
        is_active: boolean;
        items: { category: number; quantity: number }[];
      }>
    >;
    allCategories: CreditCategory[];
  }) => {
    if (!isOpen) return null;

    const addItem = () => {
      setForm((prev) => ({
        ...prev,
        items: [...prev.items, { category: allCategories[0]?.id || 0, quantity: 1 }],
      }));
    };

    const removeItem = (index: number) => {
      setForm((prev) => ({
        ...prev,
        items: prev.items.filter((_, i) => i !== index),
      }));
    };

    const updateItem = (index: number, field: "category" | "quantity", value: number) => {
      setForm((prev) => {
        const newItems = [...prev.items];
        newItems[index][field] = value;
        return { ...prev, items: newItems };
      });
    };

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
        <div className="bg-[#1f1b3a] rounded-2xl p-6 max-w-lg w-full mx-4 border border-white/10 max-h-[90vh] overflow-y-auto">
          <h2 className="text-xl font-bold text-white mb-4">{editingPlan ? "Edit Plan" : "Add Plan"}</h2>
          <input
            type="text"
            placeholder="Plan Name"
            value={form.name}
            onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/40 mb-3 focus:outline-none focus:ring-2 focus:ring-violet-500"
          />
          <input
            type="text"
            placeholder="Description"
            value={form.description}
            onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/40 mb-3 focus:outline-none focus:ring-2 focus:ring-violet-500"
          />
          <input
            type="text"
            placeholder="Price"
            value={form.price}
            onChange={(e) => setForm((prev) => ({ ...prev, price: e.target.value }))}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/40 mb-3 focus:outline-none focus:ring-2 focus:ring-violet-500"
          />
          <div className="flex items-center gap-2 mb-4">
            <label className="text-white/70">Active</label>
            <button
              onClick={() => setForm((prev) => ({ ...prev, is_active: !prev.is_active }))}
              className="text-2xl"
            >
              {form.is_active ? "✅" : "❌"}
            </button>
          </div>

          <div className="mb-3">
            <p className="text-white/70 mb-2">Plan Items</p>
            {form.items.map((item, index) => (
              <div key={index} className="flex items-center gap-2 mb-2">
                <input
                  type="number"
                  placeholder="Category ID"
                  value={item.category}
                  onChange={(e) => updateItem(index, "category", parseInt(e.target.value, 10) || 0)}
                  className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
                <input
                  type="number"
                  placeholder="Qty"
                  value={item.quantity}
                  onChange={(e) => updateItem(index, "quantity", parseInt(e.target.value, 10) || 0)}
                  className="w-20 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
                <button onClick={() => removeItem(index)} className="text-rose-400 hover:text-rose-300">
                  ✖
                </button>
              </div>
            ))}
            <button onClick={addItem} className="text-sm text-violet-400 hover:text-violet-300">
              + Add Item
            </button>
          </div>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-white font-medium transition"
            >
              Cancel
            </button>
            <button
              onClick={onSave}
              className="flex-1 py-2 bg-violet-600 hover:bg-violet-700 rounded-xl text-white font-semibold transition"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    );
  }
);
PlanModal.displayName = "PlanModal";

// ---------- Main Component ----------
export default function AdminCreditsPage() {
  const [activeTab, setActiveTab] = useState<Tab>("categories");
  const [loading, setLoading] = useState(true);

  // ---------- Categories ----------
  const [categories, setCategories] = useState<CreditCategory[]>([]);
  const [catModalOpen, setCatModalOpen] = useState(false);
  const [editingCat, setEditingCat] = useState<CreditCategory | null>(null);
  const [catForm, setCatForm] = useState({ name: "", description: "", is_active: true });

  // ---------- Plans ----------
  const [plans, setPlans] = useState<CreditPlan[]>([]);
  const [planModalOpen, setPlanModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<CreditPlan | null>(null);
  const [planForm, setPlanForm] = useState({
    name: "",
    description: "",
    price: "",
    is_active: true,
    items: [] as { category: number; quantity: number }[],
  });
  const [allCategories, setAllCategories] = useState<CreditCategory[]>([]);

  // ---------- Costs ----------
  const [costs, setCosts] = useState<CreditCost[]>([]);
  const [editingCostId, setEditingCostId] = useState<number | null>(null);
  const [costInput, setCostInput] = useState("");

  // ---------- Adjust ----------
  const [adjustForm, setAdjustForm] = useState({
    user_id: "",
    category: "",
    amount: "",
    description: "",
  });

  // ---------- Data Fetching (memoized) ----------
  const fetchCategories = useCallback(async () => {
    try {
      const data = await adminGetCategories();
      setCategories(data);
      setAllCategories(data);
    } catch {
      AlertService.error("Load Failed", "Failed to load categories");
    }
  }, []);

  const fetchPlans = useCallback(async () => {
    try {
      const data = await adminGetPlans();
      setPlans(data);
    } catch {
      AlertService.error("Load Failed", "Failed to load plans");
    }
  }, []);

  const fetchCosts = useCallback(async () => {
    try {
      const data = await adminGetCosts();
      setCosts(data);
    } catch {
      AlertService.error("Load Failed", "Failed to load costs");
    }
  }, []);

  const refreshAll = useCallback(async () => {
    setLoading(true);
    await Promise.all([fetchCategories(), fetchPlans(), fetchCosts()]);
    setLoading(false);
  }, [fetchCategories, fetchPlans, fetchCosts]);

  useEffect(() => {
    refreshAll();
  }, [refreshAll]);

  // ---------- Category CRUD (memoized) ----------
  const handleSaveCategory = useCallback(async () => {
    try {
      if (editingCat) {
        await adminUpdateCategory(editingCat.id, catForm);
        AlertService.success("Category Updated", "Category updated successfully");
      } else {
        await adminCreateCategory(catForm);
        AlertService.success("Category Created", "Category created successfully");
      }
      setCatModalOpen(false);
      setEditingCat(null);
      setCatForm({ name: "", description: "", is_active: true });
      await fetchCategories();
    } catch {
      AlertService.error("Save Failed", "Failed to save category");
    }
  }, [editingCat, catForm, fetchCategories]);

  const handleDeleteCategory = useCallback(
    async (id: number) => {
      AlertService.confirm(
        "Delete Category",
        "Delete this category?",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Delete",
            style: "destructive",
            onPress: async () => {
              try {
                await adminDeleteCategory(id);
                AlertService.success("Category Deleted", "Category deleted successfully");
                await fetchCategories();
              } catch {
                AlertService.error("Delete Failed", "Delete failed");
              }
            },
          },
        ],
      );
    },
    [fetchCategories]
  );

  // ---------- Plan CRUD (memoized) ----------
  const handleSavePlan = useCallback(async () => {
    try {
      const payload = {
        ...planForm,
        price: parseFloat(planForm.price) || 0,
        items: planForm.items.filter((i) => i.category && i.quantity > 0),
      };
      if (editingPlan) {
        await adminUpdatePlan(editingPlan.id, payload);
        AlertService.success("Plan Updated", "Plan updated successfully");
      } else {
        await adminCreatePlan(payload);
        AlertService.success("Plan Created", "Plan created successfully");
      }
      setPlanModalOpen(false);
      setEditingPlan(null);
      setPlanForm({ name: "", description: "", price: "", is_active: true, items: [] });
      await fetchPlans();
    } catch {
      AlertService.error("Save Failed", "Failed to save plan");
    }
  }, [editingPlan, planForm, fetchPlans]);

  const handleDeletePlan = useCallback(
    async (id: number) => {
      AlertService.confirm(
        "Delete Plan",
        "Delete this plan?",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Delete",
            style: "destructive",
            onPress: async () => {
              try {
                await adminDeletePlan(id);
                AlertService.success("Plan Deleted", "Plan deleted successfully");
                await fetchPlans();
              } catch {
                AlertService.error("Delete Failed", "Delete failed");
              }
            },
          },
        ],
      );
    },
    [fetchPlans]
  );

  // ---------- Cost Update (memoized) ----------
  const handleUpdateCost = useCallback(
    async (id: number) => {
      try {
        await adminUpdateCost(id, { cost: parseInt(costInput, 10) });
        AlertService.success("Cost Updated", "Cost updated successfully");
        setEditingCostId(null);
        await fetchCosts();
      } catch {
        AlertService.error("Update Failed", "Update failed");
      }
    },
    [costInput, fetchCosts]
  );

  // ---------- Adjust Credits (memoized) ----------
  const handleAdjustCredits = useCallback(async () => {
    const { user_id, category, amount, description } = adjustForm;
    if (!user_id || !category || !amount) {
      AlertService.error("Required Fields", "Please fill all required fields");
      return;
    }
    try {
      await adminAdjustCredits({
        user_id: parseInt(user_id, 10),
        category,
        amount: parseInt(amount, 10),
        description,
      });
      AlertService.success("Credits Adjusted", "Credits adjusted successfully");
      setAdjustForm({ user_id: "", category: "", amount: "", description: "" });
    } catch {
      AlertService.error("Adjustment Failed", "Adjustment failed");
    }
  }, [adjustForm]);

  // ---------- Render Tab Content (memoized per tab) ----------
  const renderCategories = useCallback(
    () => (
      <div className="space-y-4">
        <button
          onClick={() => {
            setEditingCat(null);
            setCatForm({ name: "", description: "", is_active: true });
            setCatModalOpen(true);
          }}
          className="px-4 py-2 bg-violet-600 hover:bg-violet-700 rounded-lg text-white font-semibold transition"
        >
          + Add Category
        </button>
        <div className="grid gap-3">
          {categories.map((cat) => (
            <div
              key={cat.id}
              className="flex items-center justify-between bg-white/5 backdrop-blur-md rounded-xl p-4 border border-white/10"
            >
              <div>
                <p className="font-semibold text-white">{cat.name}</p>
                <p className="text-sm text-white/60">{cat.description}</p>
                <span
                  className={`text-xs font-medium ${cat.is_active ? "text-emerald-400" : "text-rose-400"}`}
                >
                  {cat.is_active ? "Active" : "Inactive"}
                </span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setEditingCat(cat);
                    setCatForm({ name: cat.name, description: cat.description, is_active: cat.is_active });
                    setCatModalOpen(true);
                  }}
                  className="p-2 hover:bg-white/10 rounded-lg text-white/70 hover:text-white"
                >
                  ✏️
                </button>
                <button
                  onClick={() => handleDeleteCategory(cat.id)}
                  className="p-2 hover:bg-white/10 rounded-lg text-white/70 hover:text-rose-400"
                >
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    ),
    [categories, handleDeleteCategory]
  );

  const renderPlans = useCallback(
    () => (
      <div className="space-y-4">
        <button
          onClick={() => {
            setEditingPlan(null);
            setPlanForm({ name: "", description: "", price: "", is_active: true, items: [] });
            setPlanModalOpen(true);
          }}
          className="px-4 py-2 bg-violet-600 hover:bg-violet-700 rounded-lg text-white font-semibold transition"
        >
          + Add Plan
        </button>
        <div className="grid gap-4">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className="bg-white/5 backdrop-blur-md rounded-xl p-4 border border-white/10"
            >
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-semibold text-white">{plan.name}</p>
                  <p className="text-sm text-white/60">{plan.description}</p>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {plan.items.map((item) => (
                      <span
                        key={item.id}
                        className="text-xs bg-white/10 px-2 py-1 rounded-full text-white/80"
                      >
                        {item.category_name}: {item.quantity}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-lg font-bold text-violet-400">₹{plan.price}</span>
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={() => {
                        setEditingPlan(plan);
                        setPlanForm({
                          name: plan.name,
                          description: plan.description,
                          price: plan.price,
                          is_active: plan.is_active,
                          items: plan.items.map((i) => ({ category: i.category, quantity: i.quantity })),
                        });
                        setPlanModalOpen(true);
                      }}
                      className="p-1 hover:bg-white/10 rounded-lg text-white/70 hover:text-white"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => handleDeletePlan(plan.id)}
                      className="p-1 hover:bg-white/10 rounded-lg text-white/70 hover:text-rose-400"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    ),
    [plans, handleDeletePlan]
  );

  const renderCosts = useCallback(
    () => (
      <div className="space-y-3">
        {costs.map((cost) => (
          <div
            key={cost.id}
            className="flex items-center justify-between bg-white/5 backdrop-blur-md rounded-xl p-4 border border-white/10"
          >
            <div>
              <p className="font-semibold text-white">{cost.category_name}</p>
              {editingCostId === cost.id ? (
                <div className="flex items-center gap-2 mt-1">
                  <input
                    type="number"
                    value={costInput}
                    onChange={(e) => setCostInput(e.target.value)}
                    className="bg-white/10 border border-white/20 rounded px-2 py-1 text-white w-24"
                  />
                  <button onClick={() => handleUpdateCost(cost.id)} className="text-emerald-400 hover:text-emerald-300">
                    💾
                  </button>
                  <button onClick={() => setEditingCostId(null)} className="text-rose-400 hover:text-rose-300">
                    ❌
                  </button>
                </div>
              ) : (
                <p className="text-sm text-white/60">Cost: {cost.cost} credits</p>
              )}
            </div>
            {editingCostId !== cost.id && (
              <button
                onClick={() => {
                  setEditingCostId(cost.id);
                  setCostInput(String(cost.cost));
                }}
                className="p-2 hover:bg-white/10 rounded-lg text-white/70 hover:text-white"
              >
                ✏️
              </button>
            )}
          </div>
        ))}
      </div>
    ),
    [costs, editingCostId, costInput, handleUpdateCost]
  );

  const renderAdjust = useCallback(
    () => (
      <div className="max-w-md space-y-4">
        <input
          type="number"
          placeholder="User ID"
          value={adjustForm.user_id}
          onChange={(e) => setAdjustForm((prev) => ({ ...prev, user_id: e.target.value }))}
          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-violet-500"
        />
        <input
          type="text"
          placeholder="Category (e.g., pool_doubt)"
          value={adjustForm.category}
          onChange={(e) => setAdjustForm((prev) => ({ ...prev, category: e.target.value }))}
          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-violet-500"
        />
        <input
          type="number"
          placeholder="Amount (positive add, negative deduct)"
          value={adjustForm.amount}
          onChange={(e) => setAdjustForm((prev) => ({ ...prev, amount: e.target.value }))}
          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-violet-500"
        />
        <input
          type="text"
          placeholder="Description (optional)"
          value={adjustForm.description}
          onChange={(e) => setAdjustForm((prev) => ({ ...prev, description: e.target.value }))}
          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-violet-500"
        />
        <button
          onClick={handleAdjustCredits}
          className="w-full py-3 bg-violet-600 hover:bg-violet-700 rounded-xl text-white font-semibold transition"
        >
          Adjust Credits
        </button>
      </div>
    ),
    [adjustForm, handleAdjustCredits]
  );

  // ---------- Main Render ----------
  if (loading) {
    return (
      <AdminLayout>
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="text-center">
            <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-violet-500 border-t-transparent" />
            <p className="mt-4 text-white/60">Loading credit management...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="min-h-screen bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e] relative overflow-hidden">
        <div className="absolute top-0 -left-20 w-72 h-72 bg-purple-500/20 rounded-full mix-blend-multiply filter blur-3xl animate-blob" />
        <div className="absolute top-0 -right-20 w-72 h-72 bg-fuchsia-500/20 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000" />
        <div className="absolute -bottom-20 left-40 w-72 h-72 bg-cyan-500/20 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000" />

        <div className="relative z-10 p-4 sm:p-6 lg:p-8">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col sm:flex-row sm:items-center justify-between mb-8"
          >
            <div>
              <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-violet-300 to-fuchsia-300">
                💳 Credit Management
              </h1>
              <p className="text-white/70 mt-1">Manage categories, plans, costs, and adjust user credits.</p>
            </div>
            <button
              onClick={refreshAll}
              className="flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md rounded-xl border border-white/20 text-violet-300 font-medium hover:bg-white/20 hover:text-white transition mt-4 sm:mt-0"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              Refresh
            </button>
          </motion.div>

          {/* Tabs */}
          <div className="flex flex-wrap gap-2 mb-8 border-b border-white/10 pb-4">
            {(["categories", "plans", "costs", "adjust"] as Tab[]).map((tab) => (
              <TabButton
                key={tab}
                tab={tab}
                active={activeTab === tab}
                onClick={() => setActiveTab(tab)}
              />
            ))}
          </div>

          {/* Tab Content */}
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === "categories" && renderCategories()}
            {activeTab === "plans" && renderPlans()}
            {activeTab === "costs" && renderCosts()}
            {activeTab === "adjust" && renderAdjust()}
          </motion.div>
        </div>
      </div>

      {/* Modals */}
      <CategoryModal
        isOpen={catModalOpen}
        onClose={() => setCatModalOpen(false)}
        onSave={handleSaveCategory}
        editingCat={editingCat}
        form={catForm}
        setForm={setCatForm}
      />
      <PlanModal
        isOpen={planModalOpen}
        onClose={() => setPlanModalOpen(false)}
        onSave={handleSavePlan}
        editingPlan={editingPlan}
        form={planForm}
        setForm={setPlanForm}
        allCategories={allCategories}
      />
    </AdminLayout>
  );
}