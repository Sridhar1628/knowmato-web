"use client";

import { motion } from "framer-motion"; // lightweight animation (optional) – or use CSS
import styles from "./Leaderboard.module.css"; // optional CSS module for custom keyframes

export default function LeaderboardPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-4">
      <div className="w-full max-w-md text-center">
        {/* Animated trophy (pure CSS animation) */}
        <div className="mx-auto mb-8 flex h-32 w-32 items-center justify-center rounded-full bg-white/20 shadow-2xl backdrop-blur-sm">
          <span className="animate-bounce text-6xl">🏆</span>
        </div>

        <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
          Leaderboard
        </h1>

        <p className="mt-4 text-lg text-white/80">
          Compete with peers, climb the ranks, and earn recognition.
        </p>

        <div className="mt-8 rounded-3xl bg-white/10 p-6 shadow-2xl backdrop-blur-md">
          <div className="flex items-center justify-center gap-2 text-2xl font-bold text-white">
            <span>🚀</span>
            <span>Coming Soon</span>
            <span>✨</span>
          </div>
          <p className="mt-3 text-sm text-white/70">
            Our team is crafting a powerful leaderboard experience. Stay tuned!
          </p>
          <div className="mt-6 flex justify-center gap-2">
            <span className="inline-block h-2 w-2 rounded-full bg-white/60 animate-pulse" />
            <span className="inline-block h-2 w-2 rounded-full bg-white/60 animate-pulse [animation-delay:200ms]" />
            <span className="inline-block h-2 w-2 rounded-full bg-white/60 animate-pulse [animation-delay:400ms]" />
          </div>
        </div>

        <p className="mt-10 text-sm text-white/50">
          🏅 Top performers will be rewarded. Keep learning, keep shining!
        </p>
      </div>
    </div>
  );
}