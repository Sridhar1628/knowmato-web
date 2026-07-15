// app/student/help-support/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";

export default function HelpSupportPage() {
  const { t } = useTranslation();
  const router = useRouter();

  const [ticket, setTicket] = useState({
    subject: "",
    category: "",
    description: "",
  });
  const [submitting, setSubmitting] = useState(false);

  // Category options for select dropdown
  const categoryOptions = [
    { value: "", label: t("helpSupport.raiseTicket.categoryOptions.selectCategory") },
    { value: "payment", label: t("helpSupport.raiseTicket.categoryOptions.payment") },
    { value: "technical", label: t("helpSupport.raiseTicket.categoryOptions.technical") },
    { value: "session", label: t("helpSupport.raiseTicket.categoryOptions.session") },
    { value: "account", label: t("helpSupport.raiseTicket.categoryOptions.account") },
    { value: "abuse", label: t("helpSupport.raiseTicket.categoryOptions.abuse") },
    { value: "other", label: t("helpSupport.raiseTicket.categoryOptions.other") },
  ];

  const handleTicketSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticket.subject || !ticket.category || !ticket.description) {
      toast.error(t("helpSupport.toast.fillAllFields"));
      return;
    }
    setSubmitting(true);
    // Simulate API call
    setTimeout(() => {
      toast.success(t("helpSupport.toast.ticketRaised"));
      setTicket({ subject: "", category: "", description: "" });
      setSubmitting(false);
    }, 1500);
  };

  const copyEmail = () => {
    navigator.clipboard.writeText("support@knowmato.in");
    toast.success(t("helpSupport.toast.emailCopied"));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e] relative overflow-hidden">
      {/* Animated blobs */}
      <div className="absolute top-0 -left-20 w-72 h-72 bg-purple-500/20 rounded-full mix-blend-multiply filter blur-3xl animate-blob" />
      <div className="absolute top-0 -right-20 w-72 h-72 bg-fuchsia-500/20 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000" />
      <div className="absolute -bottom-20 left-40 w-72 h-72 bg-cyan-500/20 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000" />

      <div className="relative z-10 max-w-3xl mx-auto px-4 py-10 sm:px-6 lg:px-8">
        {/* Back button */}
        <button
          onClick={() => router.back()}
          className="mb-6 flex items-center gap-2 text-white/60 hover:text-white transition"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          {t("common.goBack")}
        </button>

        <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-violet-300 via-fuchsia-300 to-cyan-300 mb-8">
          {t("helpSupport.pageTitle")}
        </h1>

        <div className="space-y-6">
          {/* Contact Support */}
          <div className="rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 p-6 shadow-2xl">
            <h2 className="text-xl font-bold text-white mb-3">
              {t("helpSupport.contactSupport.heading")}
            </h2>
            <p className="text-white/80 text-sm sm:text-base mb-4">
              {t("helpSupport.contactSupport.description")}
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={() => (window.location.href = "mailto:support@knowmato.in")}
                className="flex-1 rounded-xl bg-violet-500/20 border border-violet-400/30 text-violet-300 font-semibold py-3 px-4 hover:bg-violet-500/30 transition text-center"
              >
                {t("helpSupport.contactSupport.sendEmail")}
              </button>
              <button
                onClick={copyEmail}
                className="flex-1 rounded-xl bg-white/10 border border-white/10 text-white/80 font-semibold py-3 px-4 hover:bg-white/20 transition text-center"
              >
                {t("helpSupport.contactSupport.copyEmail")}
              </button>
            </div>
          </div>

          {/* Raise Ticket Form */}
          <div className="rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 p-6 shadow-2xl">
            <h2 className="text-xl font-bold text-white mb-4">
              {t("helpSupport.raiseTicket.heading")}
            </h2>
            <form onSubmit={handleTicketSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white/70 mb-1">
                  {t("helpSupport.raiseTicket.subjectLabel")}
                </label>
                <input
                  type="text"
                  value={ticket.subject}
                  onChange={(e) => setTicket({ ...ticket, subject: e.target.value })}
                  placeholder={t("helpSupport.raiseTicket.subjectPlaceholder")}
                  className="w-full rounded-xl border-2 border-white/20 bg-gray-900/60 px-4 py-3 text-white placeholder-white/40 focus:border-violet-400 focus:ring-4 focus:ring-violet-500/50 outline-none transition"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white/70 mb-1">
                  {t("helpSupport.raiseTicket.categoryLabel")}
                </label>
                <select
                  value={ticket.category}
                  onChange={(e) => setTicket({ ...ticket, category: e.target.value })}
                  className="w-full rounded-xl border-2 border-white/20 bg-gray-900/60 px-4 py-3 text-white placeholder-white/40 focus:border-violet-400 focus:ring-4 focus:ring-violet-500/50 outline-none transition appearance-none"
                >
                  {categoryOptions.map((opt) => (
                    <option key={opt.value} value={opt.value} className="bg-gray-800">
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-white/70 mb-1">
                  {t("helpSupport.raiseTicket.descriptionLabel")}
                </label>
                <textarea
                  rows={4}
                  value={ticket.description}
                  onChange={(e) => setTicket({ ...ticket, description: e.target.value })}
                  placeholder={t("helpSupport.raiseTicket.descriptionPlaceholder")}
                  className="w-full rounded-xl border-2 border-white/20 bg-gray-900/60 px-4 py-3 text-white placeholder-white/40 focus:border-violet-400 focus:ring-4 focus:ring-violet-500/50 outline-none transition"
                />
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-xl bg-gradient-to-r from-violet-500 to-fuchsia-500 py-3 font-bold text-white shadow-lg hover:from-violet-600 hover:to-fuchsia-600 transition disabled:opacity-50"
              >
                {submitting
                  ? t("helpSupport.raiseTicket.submitting")
                  : t("helpSupport.raiseTicket.submitButton")}
              </button>
            </form>
          </div>

          {/* Working Hours */}
          <div className="rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 p-6 shadow-2xl">
            <h2 className="text-xl font-bold text-white mb-3">
              {t("helpSupport.workingHours.heading")}
            </h2>
            <p className="text-white/80 text-sm sm:text-base">
              {t("helpSupport.workingHours.description")}
              <br />
              <span className="text-white font-semibold">
                {t("helpSupport.workingHours.days")}
              </span>
              <br />
              {t("helpSupport.workingHours.time")}
              <br />
              <span className="text-white/50">{t("helpSupport.workingHours.closed")}</span>
            </p>
          </div>

          {/* Quick Actions */}
          <div className="rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 p-6 shadow-2xl">
            <h2 className="text-xl font-bold text-white mb-4">
              {t("helpSupport.quickActions.heading")}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                onClick={() => {
                  setTicket({
                    subject: "Bug Report",
                    category: "technical",
                    description: "Describe the bug...",
                  });
                  toast.success(t("helpSupport.toast.bugReportPreFilled"));
                }}
                className="rounded-xl bg-red-500/10 border border-red-400/30 text-red-300 font-semibold py-3 px-4 hover:bg-red-500/20 transition text-left"
              >
                {t("helpSupport.quickActions.reportBug")}
              </button>
              <button
                onClick={() => {
                  setTicket({
                    subject: "Feature Request",
                    category: "other",
                    description: "I'd like to suggest...",
                  });
                  toast.success(t("helpSupport.toast.featureRequestPreFilled"));
                }}
                className="rounded-xl bg-cyan-500/10 border border-cyan-400/30 text-cyan-300 font-semibold py-3 px-4 hover:bg-cyan-500/20 transition text-left"
              >
                {t("helpSupport.quickActions.featureRequest")}
              </button>
              <button
                onClick={() => {
                  setTicket({
                    subject: "Report Abuse",
                    category: "abuse",
                    description: "User ID or details...",
                  });
                  toast.success(t("helpSupport.toast.reportAbusePreFilled"));
                }}
                className="rounded-xl bg-yellow-500/10 border border-yellow-400/30 text-yellow-300 font-semibold py-3 px-4 hover:bg-yellow-500/20 transition text-left"
              >
                {t("helpSupport.quickActions.reportAbuse")}
              </button>
              <button
                onClick={() => {
                  if (window.confirm(t("helpSupport.toast.deleteAccountConfirm"))) {
                    toast.success(t("helpSupport.toast.deleteAccountSent"));
                  }
                }}
                className="rounded-xl bg-pink-500/10 border border-pink-400/30 text-pink-300 font-semibold py-3 px-4 hover:bg-pink-500/20 transition text-left"
              >
                {t("helpSupport.quickActions.deleteAccount")}
              </button>
            </div>
          </div>

          {/* Business Enquiries */}
          <div className="rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 p-6 shadow-2xl">
            <h2 className="text-xl font-bold text-white mb-3">
              {t("helpSupport.businessEnquiries.heading")}
            </h2>
            <p className="text-white/80 text-sm sm:text-base mb-4">
              {t("helpSupport.businessEnquiries.description")}
            </p>
            <button
              onClick={() => (window.location.href = "mailto:business@knowmato.in")}
              className="rounded-xl bg-emerald-500/10 border border-emerald-400/30 text-emerald-300 font-semibold py-3 px-4 hover:bg-emerald-500/20 transition"
            >
              {t("helpSupport.businessEnquiries.email")}
            </button>
          </div>
        </div>

        <p className="mt-8 text-center text-xs text-white/30">
          {t("common.copyright", { year: new Date().getFullYear() })}
        </p>
      </div>
    </div>
  );
}