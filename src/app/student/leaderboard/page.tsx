"use client";

import { motion } from "framer-motion";

export default function LeaderboardPage() {
  return (
    <div className="relative min-h-screen bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e] flex items-center justify-center p-4 overflow-hidden">
      {/* Animated background blobs */}
      <div className="absolute top-0 -left-20 w-72 h-72 bg-purple-500/20 rounded-full mix-blend-multiply filter blur-3xl animate-blob" />
      <div className="absolute top-0 -right-20 w-72 h-72 bg-fuchsia-500/20 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000" />
      <div className="absolute -bottom-20 left-40 w-72 h-72 bg-cyan-500/20 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000" />

      <div className="relative z-10 w-full max-w-md text-center">
        {/* Animated trophy */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="mx-auto mb-8 flex h-32 w-32 items-center justify-center rounded-full bg-white/10 backdrop-blur-md border border-white/20 shadow-2xl"
        >
          <motion.span
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="text-6xl"
          >
            🏆
          </motion.span>
        </motion.div>

        <motion.h1
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="text-4xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-violet-300 via-fuchsia-300 to-cyan-300 sm:text-5xl"
        >
          Leaderboard
        </motion.h1>

        <motion.p
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="mt-4 text-lg text-white/70"
        >
          Compete with peers, climb the ranks, and earn recognition.
        </motion.p>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="mt-8 rounded-3xl bg-white/5 backdrop-blur-xl border border-white/10 p-8 shadow-2xl"
        >
          <div className="flex items-center justify-center gap-2 text-2xl font-bold text-white">
            <span>🚀</span>
            <span>Coming Soon</span>
            <span>✨</span>
          </div>
          <p className="mt-3 text-sm text-white/60">
            Our team is crafting a powerful leaderboard experience. Stay tuned!
          </p>
          <div className="mt-6 flex justify-center gap-2">
            <span className="inline-block h-2 w-2 rounded-full bg-violet-400 animate-pulse" />
            <span className="inline-block h-2 w-2 rounded-full bg-fuchsia-400 animate-pulse [animation-delay:200ms]" />
            <span className="inline-block h-2 w-2 rounded-full bg-cyan-400 animate-pulse [animation-delay:400ms]" />
          </div>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.5 }}
          className="mt-10 text-sm text-white/40"
        >
          🏅 Top performers will be rewarded. Keep learning, keep shining!
        </motion.p>
      </div>
    </div>
  );
}