// app/tutor/verification/page.tsx
"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";

import {
  getTutorBankVerification,
  submitTutorBankVerification,
  updateTutorBankVerification,
} from "@/services/v1Service";

// ---------- Validation Patterns ----------
const IFSC_REGEX = /^[A-Z]{4}0[A-Z0-9]{6}$/;
const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
const MOBILE_REGEX = /^[6-9]\d{9}$/;
const AADHAAR_REGEX = /^\d{12}$/;
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_FILE_TYPES = ["image/jpeg", "image/png", "image/webp"];

// ---------- Types ----------
interface VerificationData {
  account_holder_name: string;
  account_number: string;
  ifsc_code: string;
  bank_name: string;
  branch_name: string;
  account_type: "savings" | "current";
  pan_number: string;
  aadhaar_number?: string;
  mobile_number: string;
  bank_proof_url?: string;
  pan_card_url?: string;
  status: string;
  rejection_reason?: string;
}

interface VerificationResponse {
  submitted: boolean;
  verified?: boolean;
  data?: VerificationData;
}

// ---------- Masking Helpers ----------
const maskAccount = (num: string) =>
  num.length > 4 ? `******${num.slice(-4)}` : num;

const maskPAN = (pan: string) =>
  pan.length >= 5 ? `${pan.slice(0, 2)}XXXX${pan.slice(-2)}` : pan;

const maskAadhaar = (aadhaar: string) =>
  aadhaar.length > 4 ? `********${aadhaar.slice(-4)}` : aadhaar;

// ---------- Status Helpers ----------
const statusBadge = (status: string) => {
  const map: Record<string, string> = {
    pending: "bg-amber-100 text-amber-800 border-amber-200",
    under_review: "bg-blue-100 text-blue-800 border-blue-200",
    approved: "bg-emerald-100 text-emerald-800 border-emerald-200",
    rejected: "bg-red-100 text-red-800 border-red-200",
  };
  return map[status] || "bg-gray-100 text-gray-800 border-gray-200";
};

const statusIcons: Record<string, string> = {
  pending: "⏳",
  under_review: "🔍",
  approved: "✅",
  rejected: "❌",
};

const statusMessages: Record<string, { title: string; description: string }> = {
  pending: { title: "Pending Review", description: "Your verification is in the queue." },
  under_review: { title: "Under Review", description: "We are checking your documents." },
  approved: { title: "Verified", description: "Your bank account is verified." },
  rejected: { title: "Rejected", description: "Please review the reason and resubmit." },
};

export default function TutorVerificationPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitted, setSubmitted] = useState(false);
  const [status, setStatus] = useState<string>("pending");
  const [rejectionReason, setRejectionReason] = useState("");

  // Form state
  const [form, setForm] = useState({
    account_holder_name: "",
    account_number: "",
    confirm_account_number: "",
    ifsc_code: "",
    bank_name: "",
    branch_name: "",
    account_type: "savings" as "savings" | "current",
    pan_number: "",
    aadhaar_number: "",
    mobile_number: "",
    agreed: false,
  });

  // Files
  const [bankProof, setBankProof] = useState<File | null>(null);
  const [panCard, setPanCard] = useState<File | null>(null);
  const [bankProofPreview, setBankProofPreview] = useState<string>("");
  const [panCardPreview, setPanCardPreview] = useState<string>("");

  // Editing mode
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  // Image modal
  const [imageModal, setImageModal] = useState<string | null>(null);

  // Form ref
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                setImageModal(null);
            }
        };

        window.addEventListener("keydown", handleEscape);

        return () =>
            window.removeEventListener(
                "keydown",
                handleEscape
            );
    }, []);

  // ---------- Revoke Object URLs (Memory leak fix) ----------
  useEffect(() => {
    return () => {
      if (bankProofPreview.startsWith("blob:")) URL.revokeObjectURL(bankProofPreview);
      if (panCardPreview.startsWith("blob:")) URL.revokeObjectURL(panCardPreview);
    };
  }, [bankProofPreview, panCardPreview]);

  // ---------- Fetch existing verification ----------
  const fetchVerification = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getTutorBankVerification();
      const data: VerificationResponse = res.data || res;
      setSubmitted(data.submitted);
      if (data.submitted && data.data) {
        const v = data.data;
        setStatus(v.status);
        setRejectionReason(v.rejection_reason || "");
        setForm({
          account_holder_name: v.account_holder_name,
          account_number: v.account_number,
          confirm_account_number: v.account_number,
          ifsc_code: v.ifsc_code,
          bank_name: v.bank_name,
          branch_name: v.branch_name,
          account_type: v.account_type,
          pan_number: v.pan_number,
          aadhaar_number: v.aadhaar_number || "",
          mobile_number: v.mobile_number,
          agreed: false,
        });
        if (v.bank_proof_url) setBankProofPreview(v.bank_proof_url);
        if (v.pan_card_url) setPanCardPreview(v.pan_card_url);
        if (v.status === "approved") setEditing(false);
      } else {
        setEditing(true);
      }
    } catch {
      toast.error("Failed to load verification details");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchVerification();
  }, [fetchVerification]);

  // ---------- File Handlers with Validation ----------
  const validateFile = (file: File): string | null => {
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      return "Only JPG, PNG, and WEBP images are allowed.";
    }
    if (file.size > MAX_FILE_SIZE) {
      return "File size must be under 5MB.";
    }
    return null;
  };

  const onBankProofChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (file) {
      const error = validateFile(file);
      if (error) {
        toast.error(error);
        return;
      }
      if (bankProofPreview.startsWith("blob:")) URL.revokeObjectURL(bankProofPreview);
      const url = URL.createObjectURL(file);
      setBankProof(file);
      setBankProofPreview(url);
    }
  };

  const onPanCardChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (file) {
      const error = validateFile(file);
      if (error) {
        toast.error(error);
        return;
      }
      if (panCardPreview.startsWith("blob:")) URL.revokeObjectURL(panCardPreview);
      const url = URL.createObjectURL(file);
      setPanCard(file);
      setPanCardPreview(url);
    }
  };

  // ---------- Form Validation ----------
  const validateForm = (): boolean => {
    if (!form.account_holder_name.trim()) {
      toast.error("Account holder name is required.");
      return false;
    }
    if (!form.account_number.trim()) {
      toast.error("Account number is required.");
      return false;
    }
    if (form.account_number !== form.confirm_account_number) {
      toast.error("Account numbers do not match.");
      return false;
    }
    if (!IFSC_REGEX.test(form.ifsc_code.toUpperCase())) {
      toast.error("Invalid IFSC code (e.g., HDFC0001234).");
      return false;
    }
    if (!form.bank_name.trim()) {
      toast.error("Bank name is required.");
      return false;
    }
    if (!form.branch_name.trim()) {
      toast.error("Branch name is required.");
      return false;
    }
    if (!PAN_REGEX.test(form.pan_number.toUpperCase())) {
      toast.error("Invalid PAN number (e.g., ABCDE1234F).");
      return false;
    }
    if (form.aadhaar_number && !AADHAAR_REGEX.test(form.aadhaar_number)) {
      toast.error("Aadhaar must be exactly 12 digits.");
      return false;
    }
    if (!MOBILE_REGEX.test(form.mobile_number)) {
      toast.error("Invalid 10‑digit mobile number.");
      return false;
    }
    if (!submitted) {
      if (!bankProof) {
        toast.error("Bank proof document is required.");
        return false;
      }
      if (!panCard) {
        toast.error("PAN card document is required.");
        return false;
      }
    } else {
      if (!bankProof && !bankProofPreview) {
        toast.error("Bank proof document is required.");
        return false;
      }
      if (!panCard && !panCardPreview) {
        toast.error("PAN card document is required.");
        return false;
      }
    }
    if (!form.agreed) {
      toast.error("Please confirm all details are correct.");
      return false;
    }
    return true;
  };

  // ---------- Submit / Update ----------
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    console.log("Submit clicked");


    const isValid = validateForm();

    console.log("Validation:", isValid);

    if (!isValid) {
    console.log("Stopped because validation failed");
    return;
    }

    console.log("Validation passed");

    
    setSaving(true);
    const formData = new FormData();
    formData.append("account_holder_name", form.account_holder_name.trim());
    formData.append("account_number", form.account_number.trim());
    formData.append("ifsc_code", form.ifsc_code.toUpperCase().trim());
    formData.append("bank_name", form.bank_name.trim());
    formData.append("branch_name", form.branch_name.trim());
    formData.append("account_type", form.account_type);
    formData.append("pan_number", form.pan_number.toUpperCase().trim());
    if (form.aadhaar_number.trim()) {
      formData.append("aadhaar_number", form.aadhaar_number.trim());
    }
    formData.append("mobile_number", form.mobile_number.trim());
    if (bankProof) formData.append("bank_proof", bankProof);
    if (panCard) formData.append("pan_card", panCard);

    try {
      if (!submitted) {
        await submitTutorBankVerification(formData);
        toast.success("Verification submitted successfully!");
      } else {
        await updateTutorBankVerification(formData);
        toast.success("Verification updated successfully!");
      }
      // Wait a bit, then refetch and redirect
      setTimeout(async () => {
        await fetchVerification();
        router.replace("/tutor/wallet");
      }, 2000);
    } catch (err: any) {
      const msg = err?.response?.data?.error || err?.message || "Something went wrong";
      toast.error(msg);
      setSaving(false);
    }
  };

  // ---------- Cancel button handler ----------
  const handleCancelEdit = () => {
    setEditing(false);
    setBankProof(null);
    setPanCard(null);
    // Keep previews from server, but if they were replaced by local blobs, we need to revoke them.
    // fetchVerification will reset them to server URLs.
    fetchVerification();
  };

  // ---------- Loading ----------
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-violet-50 via-purple-50 to-indigo-50 flex items-center justify-center p-4">
        <div className="animate-pulse w-full max-w-2xl space-y-4">
          <div className="h-8 w-1/2 bg-gray-200 rounded" />
          <div className="h-40 bg-gray-200 rounded-2xl" />
          <div className="h-60 bg-gray-200 rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-purple-50 to-indigo-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-3xl mx-auto">
        {/* Back navigation */}
        <button
          onClick={() => router.push("/tutor/wallet")}
          className="mb-6 flex items-center gap-2 text-indigo-600 hover:text-indigo-800 font-medium transition"
        >
          ← Back to Wallet
        </button>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <h1 className="text-3xl font-extrabold text-gray-900 mb-2 flex items-center gap-2">
            🏦 Bank Verification
          </h1>
          <p className="text-gray-600 mb-6">
            Verify your bank account to enable withdrawals
          </p>

          {/* Status Card (if submitted) */}
          {submitted && (
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              className={`mb-6 p-5 rounded-2xl border shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 ${statusBadge(
                status
              )}`}
            >
              <div className="flex items-center gap-3">
                <span className="text-3xl">{statusIcons[status]}</span>
                <div>
                  <p className="font-bold text-lg">
                    {statusMessages[status]?.title || status.replace("_", " ")}
                  </p>
                  <p className="text-sm">{statusMessages[status]?.description}</p>
                  {rejectionReason && status === "rejected" && (
                    <p className="text-sm text-red-700 mt-1">Reason: {rejectionReason}</p>
                  )}
                </div>
              </div>
              {status !== "approved" && (
                <button
                  onClick={() => setEditing(true)}
                  className="px-5 py-2 bg-white rounded-xl shadow-sm font-semibold text-indigo-700 hover:bg-indigo-50 transition"
                >
                  {status === "rejected" ? "Edit & Resubmit" : "View / Edit Details"}
                </button>
              )}
            </motion.div>
          )}

          {/* Approved Read‑only View (with masked sensitive info) */}
          {submitted && status === "approved" && !editing && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-white rounded-2xl p-6 shadow-md border border-gray-100 mb-6"
            >
              <h2 className="text-lg font-bold text-gray-800 mb-4">Verified Details</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Account Holder</span>
                  <p className="font-medium text-gray-800">{form.account_holder_name}</p>
                </div>
                <div>
                  <span className="text-gray-500">Account Number</span>
                  <p className="font-medium text-gray-800">{maskAccount(form.account_number)}</p>
                </div>
                <div>
                  <span className="text-gray-500">Bank</span>
                  <p className="font-medium text-gray-800">{form.bank_name}</p>
                </div>
                <div>
                  <span className="text-gray-500">Branch</span>
                  <p className="font-medium text-gray-800">{form.branch_name}</p>
                </div>
                <div>
                  <span className="text-gray-500">IFSC</span>
                  <p className="font-medium text-gray-800">{form.ifsc_code}</p>
                </div>
                <div>
                  <span className="text-gray-500">PAN</span>
                  <p className="font-medium text-gray-800">{maskPAN(form.pan_number)}</p>
                </div>
                <div>
                  <span className="text-gray-500">Mobile</span>
                  <p className="font-medium text-gray-800">{form.mobile_number}</p>
                </div>
                {form.aadhaar_number && (
                  <div>
                    <span className="text-gray-500">Aadhaar</span>
                    <p className="font-medium text-gray-800">{maskAadhaar(form.aadhaar_number)}</p>
                  </div>
                )}
              </div>
              <p className="mt-4 text-gray-600 text-sm">
                ✅ Your bank verification is complete. You can now withdraw funds.
              </p>
            </motion.div>
          )}

          {/* Form (if not submitted or editing) */}
          {(!submitted || editing) && (
            <motion.form
              ref={formRef}
              onSubmit={handleSubmit}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-white rounded-2xl p-6 shadow-md border border-gray-100"
            >
              <h2 className="text-xl font-bold text-gray-800 mb-4">
                {submitted ? "Update Verification" : "Submit Verification"}
              </h2>

              {/* Section 1: Personal Details */}
              <h3 className="text-base font-semibold text-gray-800 mt-2 mb-3">
                👤 Personal Details
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Account Holder Name *
                  </label>
                  <input
                    type="text"
                    value={form.account_holder_name}
                    onChange={(e) =>
                      setForm({ ...form, account_holder_name: e.target.value })
                    }
                    required
                    disabled={saving}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-400 outline-none disabled:bg-gray-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mobile Number *
                  </label>
                  <input
                    type="tel"
                    value={form.mobile_number}
                    onChange={(e) =>
                      setForm({ ...form, mobile_number: e.target.value.replace(/\D/g, "") })
                    }
                    required
                    disabled={saving}
                    maxLength={10}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-400 outline-none disabled:bg-gray-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    PAN Number *
                  </label>
                  <input
                    type="text"
                    value={form.pan_number}
                    onChange={(e) =>
                      setForm({ ...form, pan_number: e.target.value.toUpperCase() })
                    }
                    required
                    disabled={saving}
                    maxLength={10}
                    style={{ textTransform: "uppercase" }}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-400 outline-none disabled:bg-gray-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Aadhaar Number
                  </label>
                  <input
                    type="text"
                    value={form.aadhaar_number}
                    onChange={(e) =>
                      setForm({ ...form, aadhaar_number: e.target.value.replace(/\D/g, "") })
                    }
                    disabled={saving}
                    maxLength={12}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-400 outline-none disabled:bg-gray-100"
                  />
                </div>
              </div>

              {/* Section 2: Bank Details */}
              <h3 className="text-base font-semibold text-gray-800 mt-6 mb-3">
                🏦 Bank Details
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Account Number *
                  </label>
                  <input
                    type="text"
                    value={form.account_number}
                    onChange={(e) =>
                      setForm({ ...form, account_number: e.target.value.replace(/\D/g, "") })
                    }
                    required
                    disabled={saving}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-400 outline-none disabled:bg-gray-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Confirm Account Number *
                  </label>
                  <input
                    type="text"
                    value={form.confirm_account_number}
                    onChange={(e) =>
                      setForm({ ...form, confirm_account_number: e.target.value.replace(/\D/g, "") })
                    }
                    required
                    disabled={saving}
                    className={`w-full border rounded-xl px-4 py-2.5 focus:ring-2 outline-none disabled:bg-gray-100 ${
                      form.account_number &&
                      form.confirm_account_number &&
                      form.account_number !== form.confirm_account_number
                        ? "border-red-400 focus:ring-red-400"
                        : "border-gray-200 focus:ring-indigo-400"
                    }`}
                  />
                  {form.account_number &&
                    form.confirm_account_number &&
                    form.account_number !== form.confirm_account_number && (
                      <p className="text-xs text-red-500 mt-1">Account numbers do not match</p>
                    )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    IFSC Code *
                  </label>
                  <input
                    type="text"
                    value={form.ifsc_code}
                    onChange={(e) =>
                      setForm({ ...form, ifsc_code: e.target.value.toUpperCase() })
                    }
                    required
                    disabled={saving}
                    maxLength={11}
                    style={{ textTransform: "uppercase" }}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-400 outline-none disabled:bg-gray-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Bank Name *
                  </label>
                  <input
                    type="text"
                    value={form.bank_name}
                    onChange={(e) => setForm({ ...form, bank_name: e.target.value })}
                    required
                    disabled={saving}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-400 outline-none disabled:bg-gray-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Branch Name *
                  </label>
                  <input
                    type="text"
                    value={form.branch_name}
                    onChange={(e) => setForm({ ...form, branch_name: e.target.value })}
                    required
                    disabled={saving}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-400 outline-none disabled:bg-gray-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Account Type *
                  </label>
                  <select
                    value={form.account_type}
                    onChange={(e) =>
                      setForm({ ...form, account_type: e.target.value as any })
                    }
                    disabled={saving}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-400 outline-none disabled:bg-gray-100"
                  >
                    <option value="savings">Savings</option>
                    <option value="current">Current</option>
                  </select>
                </div>
              </div>

              {/* Section 3: Documents */}
              <h3 className="text-base font-semibold text-gray-800 mt-6 mb-3">
                📄 Documents
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Bank Proof (Passbook / Statement) *
                  </label>
                  <p className="text-xs text-gray-500 mb-1">JPG, PNG, WEBP – Max 5MB</p>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={onBankProofChange}
                    disabled={saving}
                    className="block w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 disabled:opacity-50"
                  />
                  {bankProofPreview && (
                    <img
                      src={bankProofPreview}
                      alt="Bank proof"
                      onClick={() => setImageModal(bankProofPreview)}
                      className="mt-2 max-h-32 rounded-xl object-cover border cursor-pointer hover:opacity-90"
                    />
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    PAN Card *
                  </label>
                  <p className="text-xs text-gray-500 mb-1">JPG, PNG, WEBP – Max 5MB</p>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={onPanCardChange}
                    disabled={saving}
                    className="block w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 disabled:opacity-50"
                  />
                  {panCardPreview && (
                    <img
                      src={panCardPreview}
                      alt="PAN card"
                      onClick={() => setImageModal(panCardPreview)}
                      className="mt-2 max-h-32 rounded-xl object-cover border cursor-pointer hover:opacity-90"
                    />
                  )}
                </div>
              </div>

              {/* Confirmation Checkbox */}
              <div className="mt-6 flex items-start gap-2">
                <input
                  type="checkbox"
                  id="agreed"
                  checked={form.agreed}
                  onChange={(e) => setForm({ ...form, agreed: e.target.checked })}
                  disabled={saving}
                  className="mt-0.5 h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                />
                <label htmlFor="agreed" className="text-sm text-gray-700">
                  I confirm that all provided details and documents are correct and I agree to the verification process.
                </label>
              </div>

              {/* Buttons */}
              <div className="flex justify-end gap-3 mt-8">
                {submitted && (
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    disabled={saving}
                    className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl transition disabled:opacity-50"
                  >
                    Cancel
                  </button>
                )}
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl transition disabled:opacity-70 flex items-center gap-2"
                >
                  {saving ? "Saving..." : submitted ? "Update" : "Submit"}
                </button>
              </div>
            </motion.form>
          )}

          {/* Security Note */}
          <p className="text-center text-xs text-gray-500 mt-6">
            🔒 Your bank details are securely stored and used only for processing withdrawals.
          </p>
        </motion.div>
      </div>

      {/* Image Preview Modal */}
      <AnimatePresence>
        {imageModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
            onClick={() => setImageModal(null)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="relative max-w-3xl max-h-[90vh] bg-white rounded-2xl overflow-hidden shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={imageModal}
                alt="Document preview"
                className="w-full h-auto max-h-[80vh] object-contain"
              />
              <button
                onClick={() => setImageModal(null)}
                className="absolute top-3 right-3 bg-black/50 text-white rounded-full p-1 hover:bg-black/70 transition"
              >
                ✕
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}