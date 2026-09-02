"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import AlertService from "@/services/alertService";
import { useTranslation } from "react-i18next"; // ✅

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
const MAX_FILE_SIZE = 5 * 1024 * 1024;
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

export default function TutorVerificationPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitted, setSubmitted] = useState(false);
  const [status, setStatus] = useState<string>("pending");
  const [rejectionReason, setRejectionReason] = useState("");

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

  const [bankProof, setBankProof] = useState<File | null>(null);
  const [panCard, setPanCard] = useState<File | null>(null);
  const [bankProofPreview, setBankProofPreview] = useState<string>("");
  const [panCardPreview, setPanCardPreview] = useState<string>("");

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const [imageModal, setImageModal] = useState<string | null>(null);

  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setImageModal(null);
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, []);

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
      AlertService.error("Error", t("bankVerification.loadError"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchVerification();
  }, [fetchVerification]);

  // ---------- File Handlers with Validation ----------
  const validateFile = (file: File): string | null => {
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      return t("bankVerification.fileTypeError");
    }
    if (file.size > MAX_FILE_SIZE) {
      return t("bankVerification.fileSizeError");
    }
    return null;
  };

  const onBankProofChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (file) {
      const error = validateFile(file);
      if (error) {
        AlertService.error("Invalid File", error);
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
        AlertService.error("Invalid File", error);
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
      AlertService.error("Validation Error", t("bankVerification.holderNameRequired"));
      return false;
    }
    if (!form.account_number.trim()) {
      AlertService.error("Validation Error", t("bankVerification.accountRequired"));
      return false;
    }
    if (form.account_number !== form.confirm_account_number) {
      AlertService.error("Validation Error", t("bankVerification.accountMismatch"));
      return false;
    }
    if (!IFSC_REGEX.test(form.ifsc_code.toUpperCase())) {
      AlertService.error("Validation Error", t("bankVerification.ifscInvalid"));
      return false;
    }
    if (!form.bank_name.trim()) {
      AlertService.error("Validation Error", t("bankVerification.bankRequired"));
      return false;
    }
    if (!form.branch_name.trim()) {
      AlertService.error("Validation Error", t("bankVerification.branchRequired"));
      return false;
    }
    if (!PAN_REGEX.test(form.pan_number.toUpperCase())) {
      AlertService.error("Validation Error", t("bankVerification.panInvalid"));
      return false;
    }
    if (form.aadhaar_number && !AADHAAR_REGEX.test(form.aadhaar_number)) {
      AlertService.error("Validation Error", t("bankVerification.aadhaarInvalid"));
      return false;
    }
    if (!MOBILE_REGEX.test(form.mobile_number)) {
      AlertService.error("Validation Error", t("bankVerification.mobileInvalid"));
      return false;
    }
    if (!submitted) {
      if (!bankProof) {
        AlertService.error("Documents Required", t("bankVerification.bankProofRequired"));
        return false;
      }
      if (!panCard) {
        AlertService.error("Documents Required", t("bankVerification.panCardRequired"));
        return false;
      }
    } else {
      if (!bankProof && !bankProofPreview) {
        AlertService.error("Documents Required", t("bankVerification.bankProofRequired"));
        return false;
      }
      if (!panCard && !panCardPreview) {
        AlertService.error("Documents Required", t("bankVerification.panCardRequired"));
        return false;
      }
    }
    if (!form.agreed) {
      AlertService.error("Agreement Required", t("bankVerification.agreementRequired"));
      return false;
    }
    return true;
  };

  // ---------- Submit / Update ----------
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

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
      const successMessage = !submitted
        ? t("bankVerification.submitted")
        : t("bankVerification.updated");

      if (!submitted) {
        await submitTutorBankVerification(formData);
      } else {
        await updateTutorBankVerification(formData);
      }

      setSaving(false);
      AlertService.confirm(
        "Success",
        successMessage,
        async () => {
          await fetchVerification();
          router.replace("/tutor/wallet");
        },
        "Continue",
        "Stay"
      );
    } catch (err: any) {
      const msg = err?.response?.data?.error || err?.message || t("bankVerification.error");
      AlertService.error("Error", msg);
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setEditing(false);
    setBankProof(null);
    setPanCard(null);
    fetchVerification();
  };

  // ---------- Status helpers ----------
  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      pending: "bg-amber-400/20 text-amber-300 border-amber-400/40",
      under_review: "bg-sky-400/20 text-sky-300 border-sky-400/40",
      approved: "bg-emerald-400/20 text-emerald-300 border-emerald-400/40",
      rejected: "bg-rose-400/20 text-rose-300 border-rose-400/40",
    };
    return map[status] || "bg-gray-400/20 text-gray-300 border-gray-400/40";
  };

  const statusIcons: Record<string, string> = {
    pending: "⏳",
    under_review: "🔍",
    approved: "✅",
    rejected: "❌",
  };

  const getStatusTitle = (s: string) => {
    const keys: Record<string, string> = {
      pending: "bankVerification.pendingTitle",
      under_review: "bankVerification.underReviewTitle",
      approved: "bankVerification.approvedTitle",
      rejected: "bankVerification.rejectedTitle",
    };
    return t(keys[s] || s);
  };

  const getStatusDesc = (s: string) => {
    const keys: Record<string, string> = {
      pending: "bankVerification.pendingDesc",
      under_review: "bankVerification.underReviewDesc",
      approved: "bankVerification.approvedDesc",
      rejected: "bankVerification.rejectedDesc",
    };
    return t(keys[s] || "");
  };

  // ---------- Loading ----------
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e] flex items-center justify-center p-4">
        <div className="animate-pulse w-full max-w-2xl space-y-4">
          <div className="h-8 w-1/2 bg-white/10 rounded" />
          <div className="h-40 bg-white/10 rounded-2xl" />
          <div className="h-60 bg-white/10 rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e] relative overflow-hidden p-4 sm:p-6 lg:p-8">
      {/* Animated blobs */}
      <div className="absolute top-0 -left-20 w-72 h-72 bg-purple-500/20 rounded-full mix-blend-multiply filter blur-3xl animate-blob" />
      <div className="absolute top-0 -right-20 w-72 h-72 bg-fuchsia-500/20 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000" />
      <div className="absolute -bottom-20 left-40 w-72 h-72 bg-cyan-500/20 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000" />

      <div className="max-w-3xl mx-auto relative z-10">
        {/* Back navigation */}
        <button
          onClick={() => router.push("/tutor/wallet")}
          className="mb-6 flex items-center gap-2 text-violet-300 hover:text-violet-200 font-medium transition"
        >
          ← {t("bankVerification.backToWallet")}
        </button>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-violet-300 to-fuchsia-300 mb-2 flex items-center gap-2">
            🏦 {t("bankVerification.title")}
          </h1>
          <p className="text-white/70 mb-6">{t("bankVerification.subtitle")}</p>

          {/* Status Card */}
          {submitted && (
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              className={`mb-6 p-5 rounded-2xl border backdrop-blur-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 ${statusBadge(status)}`}
            >
              <div className="flex items-center gap-3">
                <span className="text-3xl">{statusIcons[status]}</span>
                <div>
                  <p className="font-bold text-lg">{getStatusTitle(status)}</p>
                  <p className="text-sm opacity-80">{getStatusDesc(status)}</p>
                  {rejectionReason && status === "rejected" && (
                    <p className="text-sm text-rose-300 mt-1">
                      {t("bankVerification.reason")}: {rejectionReason}
                    </p>
                  )}
                </div>
              </div>
              {status !== "approved" && (
                <button
                  onClick={() => setEditing(true)}
                  className="px-5 py-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl shadow-lg font-semibold text-white hover:bg-white/20 transition"
                >
                  {status === "rejected"
                    ? t("bankVerification.editResubmit")
                    : t("bankVerification.viewEdit")}
                </button>
              )}
            </motion.div>
          )}

          {/* Approved Read‑only View */}
          {submitted && status === "approved" && !editing && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10 shadow-2xl mb-6"
            >
              <h2 className="text-lg font-bold text-white mb-4">
                {t("bankVerification.verifiedDetails")}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-white/50">{t("bankVerification.holderName")}</span>
                  <p className="font-medium text-white">{form.account_holder_name}</p>
                </div>
                <div>
                  <span className="text-white/50">{t("bankVerification.accountNumber")}</span>
                  <p className="font-medium text-white">{maskAccount(form.account_number)}</p>
                </div>
                <div>
                  <span className="text-white/50">{t("bankVerification.bank")}</span>
                  <p className="font-medium text-white">{form.bank_name}</p>
                </div>
                <div>
                  <span className="text-white/50">{t("bankVerification.branch")}</span>
                  <p className="font-medium text-white">{form.branch_name}</p>
                </div>
                <div>
                  <span className="text-white/50">{t("bankVerification.ifsc")}</span>
                  <p className="font-medium text-white">{form.ifsc_code}</p>
                </div>
                <div>
                  <span className="text-white/50">{t("bankVerification.pan")}</span>
                  <p className="font-medium text-white">{maskPAN(form.pan_number)}</p>
                </div>
                <div>
                  <span className="text-white/50">{t("bankVerification.mobile")}</span>
                  <p className="font-medium text-white">{form.mobile_number}</p>
                </div>
                {form.aadhaar_number && (
                  <div>
                    <span className="text-white/50">{t("bankVerification.aadhaar")}</span>
                    <p className="font-medium text-white">{maskAadhaar(form.aadhaar_number)}</p>
                  </div>
                )}
              </div>
              <p className="mt-4 text-white/60 text-sm">{t("bankVerification.verifiedMessage")}</p>
            </motion.div>
          )}

          {/* Form */}
          {(!submitted || editing) && (
            <motion.form
              ref={formRef}
              onSubmit={handleSubmit}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10 shadow-2xl"
            >
              <h2 className="text-xl font-bold text-white mb-4">
                {submitted
                  ? t("bankVerification.updateVerification")
                  : t("bankVerification.submitVerification")}
              </h2>

              {/* Personal Details */}
              <h3 className="text-base font-semibold text-violet-300 mt-2 mb-3">
                {t("bankVerification.personalDetails")}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-1">
                    {t("bankVerification.holderName")} *
                  </label>
                  <input
                    type="text"
                    value={form.account_holder_name}
                    onChange={(e) => setForm({ ...form, account_holder_name: e.target.value })}
                    required
                    disabled={saving}
                    className="w-full bg-gray-900/60 border border-white/20 rounded-xl px-4 py-2.5 text-white placeholder-white/40 focus:ring-4 focus:ring-violet-500/50 focus:border-violet-400 outline-none disabled:opacity-50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-1">
                    {t("bankVerification.mobile")} *
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
                    className="w-full bg-gray-900/60 border border-white/20 rounded-xl px-4 py-2.5 text-white placeholder-white/40 focus:ring-4 focus:ring-violet-500/50 focus:border-violet-400 outline-none disabled:opacity-50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-1">
                    {t("bankVerification.pan")} *
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
                    className="w-full bg-gray-900/60 border border-white/20 rounded-xl px-4 py-2.5 text-white placeholder-white/40 focus:ring-4 focus:ring-violet-500/50 focus:border-violet-400 outline-none disabled:opacity-50 uppercase"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-1">
                    {t("bankVerification.aadhaar")}
                  </label>
                  <input
                    type="text"
                    value={form.aadhaar_number}
                    onChange={(e) =>
                      setForm({ ...form, aadhaar_number: e.target.value.replace(/\D/g, "") })
                    }
                    disabled={saving}
                    maxLength={12}
                    className="w-full bg-gray-900/60 border border-white/20 rounded-xl px-4 py-2.5 text-white placeholder-white/40 focus:ring-4 focus:ring-violet-500/50 focus:border-violet-400 outline-none disabled:opacity-50"
                  />
                </div>
              </div>

              {/* Bank Details */}
              <h3 className="text-base font-semibold text-violet-300 mt-6 mb-3">
                {t("bankVerification.bankDetails")}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-1">
                    {t("bankVerification.accountNumber")} *
                  </label>
                  <input
                    type="text"
                    value={form.account_number}
                    onChange={(e) =>
                      setForm({ ...form, account_number: e.target.value.replace(/\D/g, "") })
                    }
                    required
                    disabled={saving}
                    className="w-full bg-gray-900/60 border border-white/20 rounded-xl px-4 py-2.5 text-white placeholder-white/40 focus:ring-4 focus:ring-violet-500/50 focus:border-violet-400 outline-none disabled:opacity-50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-1">
                    {t("bankVerification.confirmAccount")} *
                  </label>
                  <input
                    type="text"
                    value={form.confirm_account_number}
                    onChange={(e) =>
                      setForm({ ...form, confirm_account_number: e.target.value.replace(/\D/g, "") })
                    }
                    required
                    disabled={saving}
                    className={`w-full border rounded-xl px-4 py-2.5 text-white focus:ring-4 outline-none disabled:opacity-50 ${
                      form.account_number &&
                      form.confirm_account_number &&
                      form.account_number !== form.confirm_account_number
                        ? "border-rose-400/60 focus:ring-rose-500/50"
                        : "border-white/20 focus:ring-violet-500/50"
                    }`}
                  />
                  {form.account_number &&
                    form.confirm_account_number &&
                    form.account_number !== form.confirm_account_number && (
                      <p className="text-xs text-rose-400 mt-1">
                        {t("bankVerification.accountMismatch")}
                      </p>
                    )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-1">
                    {t("bankVerification.ifsc")} *
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
                    className="w-full bg-gray-900/60 border border-white/20 rounded-xl px-4 py-2.5 text-white placeholder-white/40 focus:ring-4 focus:ring-violet-500/50 focus:border-violet-400 outline-none disabled:opacity-50 uppercase"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-1">
                    {t("bankVerification.bankName")} *
                  </label>
                  <input
                    type="text"
                    value={form.bank_name}
                    onChange={(e) => setForm({ ...form, bank_name: e.target.value })}
                    required
                    disabled={saving}
                    className="w-full bg-gray-900/60 border border-white/20 rounded-xl px-4 py-2.5 text-white placeholder-white/40 focus:ring-4 focus:ring-violet-500/50 focus:border-violet-400 outline-none disabled:opacity-50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-1">
                    {t("bankVerification.branch")} *
                  </label>
                  <input
                    type="text"
                    value={form.branch_name}
                    onChange={(e) => setForm({ ...form, branch_name: e.target.value })}
                    required
                    disabled={saving}
                    className="w-full bg-gray-900/60 border border-white/20 rounded-xl px-4 py-2.5 text-white placeholder-white/40 focus:ring-4 focus:ring-violet-500/50 focus:border-violet-400 outline-none disabled:opacity-50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-1">
                    {t("bankVerification.accountType")} *
                  </label>
                  <select
                    value={form.account_type}
                    onChange={(e) => setForm({ ...form, account_type: e.target.value as any })}
                    disabled={saving}
                    className="w-full bg-gray-900/60 border border-white/20 rounded-xl px-4 py-2.5 text-white focus:ring-4 focus:ring-violet-500/50 focus:border-violet-400 outline-none disabled:opacity-50 appearance-none cursor-pointer"
                  >
                    <option value="savings" className="bg-gray-900">
                      {t("bankVerification.savings")}
                    </option>
                    <option value="current" className="bg-gray-900">
                      {t("bankVerification.current")}
                    </option>
                  </select>
                </div>
              </div>

              {/* Documents */}
              <h3 className="text-base font-semibold text-violet-300 mt-6 mb-3">
                {t("bankVerification.documents")}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-1">
                    {t("bankVerification.bankProof")} *
                  </label>
                  <p className="text-xs text-white/50 mb-1">{t("bankVerification.fileHint")}</p>
                  <label className="cursor-pointer inline-block bg-violet-500/20 hover:bg-violet-500/30 text-violet-300 py-2 px-4 rounded-xl text-sm font-semibold transition border border-violet-400/30">
                    {t("bankVerification.chooseFile")}
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={onBankProofChange}
                      disabled={saving}
                      className="hidden"
                    />
                  </label>
                  {bankProofPreview && (
                    <img
                      src={bankProofPreview}
                      alt="Bank proof"
                      onClick={() => setImageModal(bankProofPreview)}
                      className="mt-2 max-h-32 rounded-xl object-cover border border-white/20 cursor-pointer hover:opacity-90"
                    />
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-1">
                    {t("bankVerification.panCard")} *
                  </label>
                  <p className="text-xs text-white/50 mb-1">{t("bankVerification.fileHint")}</p>
                  <label className="cursor-pointer inline-block bg-violet-500/20 hover:bg-violet-500/30 text-violet-300 py-2 px-4 rounded-xl text-sm font-semibold transition border border-violet-400/30">
                    {t("bankVerification.chooseFile")}
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={onPanCardChange}
                      disabled={saving}
                      className="hidden"
                    />
                  </label>
                  {panCardPreview && (
                    <img
                      src={panCardPreview}
                      alt="PAN card"
                      onClick={() => setImageModal(panCardPreview)}
                      className="mt-2 max-h-32 rounded-xl object-cover border border-white/20 cursor-pointer hover:opacity-90"
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
                  className="mt-0.5 h-4 w-4 rounded border-white/30 bg-transparent text-violet-500 focus:ring-violet-400"
                />
                <label htmlFor="agreed" className="text-sm text-white/70">
                  {t("bankVerification.agreement")}
                </label>
              </div>

              {/* Buttons */}
              <div className="flex justify-end gap-3 mt-8">
                {submitted && (
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    disabled={saving}
                    className="px-5 py-2.5 bg-white/10 hover:bg-white/20 text-white font-medium rounded-xl transition disabled:opacity-50 border border-white/20"
                  >
                    {t("common.cancel")}
                  </button>
                )}
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2.5 bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:from-violet-600 hover:to-fuchsia-600 text-white font-medium rounded-xl transition disabled:opacity-70 flex items-center gap-2 shadow-lg shadow-violet-500/25"
                >
                  {saving
                    ? t("bankVerification.saving")
                    : submitted
                    ? t("bankVerification.update")
                    : t("bankVerification.submit")}
                </button>
              </div>
            </motion.form>
          )}

          {/* Security Note */}
          <p className="text-center text-xs text-white/40 mt-6">
            {t("bankVerification.securityNote")}
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
              className="relative max-w-3xl max-h-[90vh] bg-white/10 backdrop-blur-xl rounded-2xl overflow-hidden border border-white/20"
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