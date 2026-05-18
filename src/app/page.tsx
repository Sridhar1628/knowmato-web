'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { RootState } from '@/store/store';

// ============================================
// 1. Animated Gradient Background Component
// ============================================
const AnimatedGradient = () => {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-animate bg-gradient-to-r from-[#6366F1] via-[#8B5CF6] to-[#EC4899] bg-[length:200%_200%] animate-gradient" />
      {/* Overlay for better text readability */}
      <div className="absolute inset-0 bg-black/10" />
    </div>
  );
};

// ============================================
// 2. Floating Particle Component
// ============================================
const Particle = ({ index }: { index: number }) => {
  // Generate random but deterministic values based on index
  const size = 3 + (index % 5); // 3-7px
  const startX = (index * 73) % 100; // vw percentage
  const startY = (index * 37) % 100; // vh percentage
  const duration = 8 + (index % 8); // 8-15s
  const delay = (index * 0.4) % 5; // stagger
  const xOffset = 20 + (index % 40); // 20-60px
  const yOffset = 20 + (index % 50); // 20-70px

  return (
    <motion.div
      className="absolute rounded-full bg-white/70 backdrop-blur-[1px]"
      style={{
        width: size,
        height: size,
        left: `${startX}%`,
        top: `${startY}%`,
      }}
      animate={{
        x: [0, xOffset, -xOffset / 2, xOffset / 3, 0],
        y: [0, -yOffset, yOffset / 2, -yOffset / 3, 0],
        opacity: [0.2, 0.6, 0.3, 0.7, 0.2],
      }}
      transition={{
        duration: duration,
        delay: delay,
        repeat: Infinity,
        repeatType: 'loop',
        ease: 'easeInOut',
        times: [0, 0.25, 0.5, 0.75, 1],
      }}
    />
  );
};

// ============================================
// 3. Main Splash Screen Component
// ============================================
export default function SplashScreen() {
  const router = useRouter();
  const { loading: authLoading } = useAuth();
  const user = useSelector((state: RootState) => state.auth.user);

  // Animation states
  const logoControls = {
    hidden: { opacity: 0, y: 50, scale: 0.8 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        type: 'spring',
        damping: 12,
        stiffness: 100,
        duration: 0.8,
      },
    },
  };

  const taglineControls = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { delay: 0.4, duration: 0.6, ease: 'easeOut' },
    },
  };

  // Redirect logic after splash delay
  useEffect(() => {
    let redirectTimeout: NodeJS.Timeout;

    const handleRedirect = () => {
      if (!authLoading) {
        redirectTimeout = setTimeout(() => {
          if (user) {
            // Role-based routing
            switch (user.role) {
              case 'student':
                router.replace('/student/dashboard');
                break;
              case 'tutor':
                router.replace('/tutor/dashboard');
                break;
              case 'admin':
                router.replace('/admin/dashboard');
                break;
              default:
                router.replace('/entry');
            }
          } else {
            router.replace('/entry');
          }
        }, 2000); // 2 seconds splash display
      }
    };

    handleRedirect();

    return () => {
      if (redirectTimeout) clearTimeout(redirectTimeout);
    };
  }, [authLoading, user, router]);

  // Generate 16 particles for rich effect
  const particles = Array.from({ length: 16 }, (_, i) => (
    <Particle key={i} index={i} />
  ));

  return (
    <div className="relative flex h-screen w-full items-center justify-center overflow-hidden">
      {/* Animated Gradient Background */}
      <AnimatedGradient />

      {/* Floating Particles Layer */}
      <div className="absolute inset-0 pointer-events-none">{particles}</div>

      {/* Content Layer */}
      <div className="relative z-10 flex flex-col items-center justify-center px-4 text-center">
        {/* Animated Logo */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={logoControls}
          className="mb-4"
        >
          <h1 className="text-6xl font-extrabold tracking-wide text-white drop-shadow-2xl sm:text-7xl md:text-8xl">
            Jeblio <span className="inline-block animate-bounce-slow">🚀</span>
          </h1>
        </motion.div>

        {/* Animated Tagline */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={taglineControls}
        >
          <p className="text-xl font-medium text-white/95 drop-shadow-md sm:text-2xl md:text-3xl">
            Learn. Solve. Grow.
          </p>
        </motion.div>

        {/* Optional Loading Indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2, duration: 0.5 }}
          className="mt-12"
        >
          <div className="flex space-x-2">
            <div className="h-2 w-2 animate-pulse rounded-full bg-white/60" />
            <div className="h-2 w-2 animate-pulse rounded-full bg-white/60 delay-150" />
            <div className="h-2 w-2 animate-pulse rounded-full bg-white/60 delay-300" />
          </div>
        </motion.div>
      </div>

      {/* Add custom styles for animations */}
      <style jsx>{`
        @keyframes gradient {
          0% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
          100% {
            background-position: 0% 50%;
          }
        }
        .animate-gradient {
          animation: gradient 8s ease infinite;
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