"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { RootState } from "@/redux/store";

// ============================================
// 1. Animated Gradient Background (Dark Theme)
// ============================================
const AnimatedGradient = () => (
  <div className="fixed inset-0 -z-10 overflow-hidden">
    {/* Dark gradient matching the app */}
    <div className="absolute inset-0 bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e]" />
    {/* Animated blobs for depth */}
    <div className="absolute top-0 -left-20 w-72 h-72 bg-purple-500/20 rounded-full mix-blend-multiply filter blur-3xl animate-blob" />
    <div className="absolute top-0 -right-20 w-72 h-72 bg-fuchsia-500/20 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000" />
    <div className="absolute -bottom-20 left-40 w-72 h-72 bg-cyan-500/20 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000" />
  </div>
);

// ============================================
// 2. Floating Particle (Themed Colors)
// ============================================
const Particle = ({ index }: { index: number }) => {
  const colors = [
    "bg-violet-400/60",
    "bg-fuchsia-400/60",
    "bg-purple-400/60",
    "bg-cyan-400/60",
  ];
  const color = colors[index % colors.length];
  const size = 4 + (index % 4);
  const startX = (index * 73) % 100;
  const startY = (index * 37) % 100;
  const duration = 10 + (index % 6);
  const delay = (index * 0.5) % 5;
  const xOffset = 30 + (index % 40);
  const yOffset = 30 + (index % 50);

  return (
    <motion.div
      className={`absolute rounded-full backdrop-blur-[2px] ${color}`}
      style={{
        width: size,
        height: size,
        left: `${startX}%`,
        top: `${startY}%`,
      }}
      animate={{
        x: [0, xOffset, -xOffset / 2, xOffset / 3, 0],
        y: [0, -yOffset, yOffset / 2, -yOffset / 3, 0],
        opacity: [0.3, 0.8, 0.4, 0.9, 0.3],
      }}
      transition={{
        duration,
        delay,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    />
  );
};

// ============================================
// 3. Splash Screen Component
// ============================================
export default function SplashScreen() {
  const router = useRouter();
  const { loading: authLoading } = useAuth();
  const user = useSelector((state: RootState) => state.auth.user);

  // Redirect after splash
  useEffect(() => {
    console.log("authLoading =", authLoading);
    console.log("user =", user);

    if (authLoading) return;

    const timer = setTimeout(() => {
      console.log("Inside timer");
      console.log("user =", user);

      if (user) {
        console.log("role =", user.role);
      } else {
        console.log("User is NULL");
      }
      if (user) {
        const role = user.role; // 'student' | 'tutor' | 'admin'
        if (role === "student") {
          router.replace("/student/dashboard");
        } else if (role === "tutor") {
          router.replace("/tutor/dashboard");
        } else if (role === "admin") {
          router.replace("/admin/dashboard");
        } else {
          router.replace("/entry");
        }
      } else {
        router.replace("/entry");
      }
    }, 2200);

    return () => clearTimeout(timer);
  }, [authLoading, user, router]);

  const particles = Array.from({ length: 16 }, (_, i) => (
    <Particle key={i} index={i} />
  ));

  return (
    <div className="relative flex h-screen w-full items-center justify-center overflow-hidden">
      {/* Gradient background */}
      <AnimatedGradient />

      {/* Particles */}
      <div className="absolute inset-0 pointer-events-none">{particles}</div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center px-4 text-center">
        {/* Brand Name with gradient text */}
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{
            type: "spring",
            damping: 12,
            stiffness: 100,
          }}
          className="mb-4"
        >
          <h1 className="text-6xl font-extrabold tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-violet-300 to-fuchsia-300 drop-shadow-2xl sm:text-7xl md:text-8xl">
            KnowMato <span className="inline-block animate-bounce-slow">🚀</span>
          </h1>
        </motion.div>

        {/* Tagline */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.8 }}
        >
          <p className="text-xl font-medium text-white/90 drop-shadow-md sm:text-2xl md:text-3xl">
            Learn. Solve. Grow.
          </p>
        </motion.div>

        {/* Loading dots */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="mt-12"
        >
          <div className="flex space-x-3">
            <div className="h-2.5 w-2.5 animate-pulse rounded-full bg-violet-400" />
            <div className="h-2.5 w-2.5 animate-pulse rounded-full bg-fuchsia-400 delay-150" />
            <div className="h-2.5 w-2.5 animate-pulse rounded-full bg-violet-400 delay-300" />
          </div>
        </motion.div>
      </div>

      {/* Custom animation styles */}
      <style jsx>{`
        @keyframes blob {
          0%,
          100% {
            transform: translate(0, 0) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
        }
        .animate-blob {
          animation: blob 20s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
        @keyframes bounce-slow {
          0%,
          100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-10px);
          }
        }
        .animate-bounce-slow {
          animation: bounce-slow 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}