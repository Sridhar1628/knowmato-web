// app/student/help-support/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

export default function HelpSupportPage() {
  const router = useRouter();

  const [ticket, setTicket] = useState({
    subject: "",
    category: "",
    description: "",
  });
  const [submitting, setSubmitting] = useState(false);

  const handleTicketSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticket.subject || !ticket.category || !ticket.description) {
      toast.error("Please fill all fields.");
      return;
    }
    setSubmitting(true);
    // Simulate API call
    setTimeout(() => {
      toast.success("Ticket raised successfully! We'll get back to you soon.");
      setTicket({ subject: "", category: "", description: "" });
      setSubmitting(false);
    }, 1500);
  };

  const copyEmail = () => {
    navigator.clipboard.writeText("support@knowmato.in");
    toast.success("Email copied to clipboard!");
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
          Back
        </button>

        <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-violet-300 via-fuchsia-300 to-cyan-300 mb-8">
          ❓ Help & Support
        </h1>

        <div className="space-y-6">
          {/* Contact Support */}
          <div className="rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 p-6 shadow-2xl">
            <h2 className="text-xl font-bold text-white mb-3">📞 Contact Support</h2>
            <p className="text-white/80 text-sm sm:text-base mb-4">
              Need immediate help? Reach out via email or raise a support ticket below.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={() => (window.location.href = "mailto:support@knowmato.in")}
                className="flex-1 rounded-xl bg-violet-500/20 border border-violet-400/30 text-violet-300 font-semibold py-3 px-4 hover:bg-violet-500/30 transition text-center"
              >
                ✉️ Send Email
              </button>
              <button
                onClick={copyEmail}
                className="flex-1 rounded-xl bg-white/10 border border-white/10 text-white/80 font-semibold py-3 px-4 hover:bg-white/20 transition text-center"
              >
                📋 Copy Email
              </button>
            </div>
          </div>

          {/* Raise Ticket Form */}
          <div className="rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 p-6 shadow-2xl">
            <h2 className="text-xl font-bold text-white mb-4">🎫 Raise a Ticket</h2>
            <form onSubmit={handleTicketSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white/70 mb-1">Subject *</label>
                <input
                  type="text"
                  value={ticket.subject}
                  onChange={(e) => setTicket({ ...ticket, subject: e.target.value })}
                  placeholder="e.g., Payment issue, Doubt not answered"
                  className="w-full rounded-xl border-2 border-white/20 bg-gray-900/60 px-4 py-3 text-white placeholder-white/40 focus:border-violet-400 focus:ring-4 focus:ring-violet-500/50 outline-none transition"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white/70 mb-1">Category *</label>
                <select
                  value={ticket.category}
                  onChange={(e) => setTicket({ ...ticket, category: e.target.value })}
                  className="w-full rounded-xl border-2 border-white/20 bg-gray-900/60 px-4 py-3 text-white placeholder-white/40 focus:border-violet-400 focus:ring-4 focus:ring-violet-500/50 outline-none transition appearance-none"
                >
                  <option value="" className="bg-gray-800">Select a category</option>
                  <option value="payment" className="bg-gray-800">Payment / Credits</option>
                  <option value="technical" className="bg-gray-800">Technical Issue</option>
                  <option value="session" className="bg-gray-800">Session / Mentor Problem</option>
                  <option value="account" className="bg-gray-800">Account / Login</option>
                  <option value="abuse" className="bg-gray-800">Report Abuse</option>
                  <option value="other" className="bg-gray-800">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-white/70 mb-1">Description *</label>
                <textarea
                  rows={4}
                  value={ticket.description}
                  onChange={(e) => setTicket({ ...ticket, description: e.target.value })}
                  placeholder="Describe your issue in detail..."
                  className="w-full rounded-xl border-2 border-white/20 bg-gray-900/60 px-4 py-3 text-white placeholder-white/40 focus:border-violet-400 focus:ring-4 focus:ring-violet-500/50 outline-none transition"
                />
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-xl bg-gradient-to-r from-violet-500 to-fuchsia-500 py-3 font-bold text-white shadow-lg hover:from-violet-600 hover:to-fuchsia-600 transition disabled:opacity-50"
              >
                {submitting ? "Submitting..." : "Submit Ticket"}
              </button>
            </form>
          </div>

          {/* Working Hours */}
          <div className="rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 p-6 shadow-2xl">
            <h2 className="text-xl font-bold text-white mb-3">🕘 Working Hours</h2>
            <p className="text-white/80 text-sm sm:text-base">
              Our support team is available:
              <br />
              <span className="text-white font-semibold">Monday – Saturday</span>
              <br />
              09:00 AM – 06:00 PM (IST)
              <br />
              <span className="text-white/50">We are closed on Sundays and public holidays.</span>
            </p>
          </div>

          {/* Additional Quick Links */}
          <div className="rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 p-6 shadow-2xl">
            <h2 className="text-xl font-bold text-white mb-4">⚡ Quick Actions</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                onClick={() => {
                  setTicket({ subject: "Bug Report", category: "technical", description: "Describe the bug..." });
                  toast.success("Bug report form pre-filled. Scroll up to submit.");
                }}
                className="rounded-xl bg-red-500/10 border border-red-400/30 text-red-300 font-semibold py-3 px-4 hover:bg-red-500/20 transition text-left"
              >
                🐛 Report a Bug
              </button>
              <button
                onClick={() => {
                  setTicket({ subject: "Feature Request", category: "other", description: "I'd like to suggest..." });
                  toast.success("Feature request form pre-filled.");
                }}
                className="rounded-xl bg-cyan-500/10 border border-cyan-400/30 text-cyan-300 font-semibold py-3 px-4 hover:bg-cyan-500/20 transition text-left"
              >
                💡 Feature Request
              </button>
              <button
                onClick={() => {
                  setTicket({ subject: "Report Abuse", category: "abuse", description: "User ID or details..." });
                  toast.success("Report abuse form pre-filled.");
                }}
                className="rounded-xl bg-yellow-500/10 border border-yellow-400/30 text-yellow-300 font-semibold py-3 px-4 hover:bg-yellow-500/20 transition text-left"
              >
                🚨 Report Abuse
              </button>
              <button
                onClick={() => {
                  if (window.confirm("Are you sure you want to delete your account? This action is irreversible.")) {
                    // Replace with actual account deletion flow
                    toast.success("Account deletion request sent. Support will contact you.");
                  }
                }}
                className="rounded-xl bg-pink-500/10 border border-pink-400/30 text-pink-300 font-semibold py-3 px-4 hover:bg-pink-500/20 transition text-left"
              >
                🗑️ Delete Account
              </button>
            </div>
          </div>

          {/* Business Enquiries */}
          <div className="rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 p-6 shadow-2xl">
            <h2 className="text-xl font-bold text-white mb-3">💼 Business Enquiries</h2>
            <p className="text-white/80 text-sm sm:text-base mb-4">
              For partnerships, institutional tie‑ups, bulk credits, or media inquiries, please contact us at:
            </p>
            <button
              onClick={() => (window.location.href = "mailto:business@knowmato.in")}
              className="rounded-xl bg-emerald-500/10 border border-emerald-400/30 text-emerald-300 font-semibold py-3 px-4 hover:bg-emerald-500/20 transition"
            >
              ✉️ business@knowmato.in
            </button>
          </div>
        </div>

        <p className="mt-8 text-center text-xs text-white/30">
          © {new Date().getFullYear()} Jeblio Corporation Private Limited. All rights reserved.
        </p>
      </div>
    </div>
  );
}