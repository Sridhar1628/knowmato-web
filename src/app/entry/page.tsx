'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, useAnimation, useInView } from 'framer-motion';

// ============================================
// 1. Animated Dark Gradient Background with blobs
// ============================================
const AnimatedGradient = () => {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      {/* Deep space gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e]" />
      {/* Animated color blobs */}
      <div className="absolute top-0 -left-20 w-72 h-72 bg-purple-500/20 rounded-full mix-blend-multiply filter blur-3xl animate-blob" />
      <div className="absolute top-0 -right-20 w-72 h-72 bg-fuchsia-500/20 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000" />
      <div className="absolute -bottom-20 left-40 w-72 h-72 bg-cyan-500/20 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000" />
    </div>
  );
};

// ============================================
// 2. Floating Shape Component (Neon circles, squares, triangles)
// ============================================
interface FloatingShapeProps {
  index: number;
  type: 'circle' | 'square' | 'triangle';
  color: string;
  size: number;
  startX: number; // vw percentage
  startY: number; // vh percentage
  opacityRange: [number, number];
}

const FloatingShape = ({
  index,
  type,
  color,
  size,
  startX,
  startY,
  opacityRange,
}: FloatingShapeProps) => {
  const xDrift = 40 + (index % 5) * 10;
  const yDrift = 30 + (index % 6) * 15;
  const duration = 10 + (index % 10);
  const delay = (index * 0.5) % 6;

  const getShapeStyle = () => {
    switch (type) {
      case 'circle':
        return { borderRadius: '50%' };
      case 'square':
        return { borderRadius: '12px' };
      case 'triangle':
        return {
          width: 0,
          height: 0,
          backgroundColor: 'transparent',
          borderLeftWidth: `${size / 2}px`,
          borderRightWidth: `${size / 2}px`,
          borderBottomWidth: `${size}px`,
          borderLeftColor: 'transparent',
          borderRightColor: 'transparent',
          borderBottomColor: color,
        };
      default:
        return {};
    }
  };

  const shapeBaseStyle = {
    width: type === 'triangle' ? 0 : size,
    height: type === 'triangle' ? 0 : size,
    backgroundColor: type !== 'triangle' ? color : undefined,
    ...getShapeStyle(),
  };

  if (type === 'triangle') {
    return (
      <motion.div
        className="absolute"
        style={{
          left: `${startX}%`,
          top: `${startY}%`,
        }}
        animate={{
          x: [0, xDrift, -xDrift / 2, xDrift / 3, 0],
          y: [0, -yDrift, yDrift / 2, -yDrift / 3, 0],
          opacity: opacityRange,
          rotate: [0, 360],
        }}
        transition={{
          duration: duration,
          delay: delay,
          repeat: Infinity,
          repeatType: 'loop',
          ease: 'easeInOut',
          times: [0, 0.25, 0.5, 0.75, 1],
        }}
      >
        <div
          style={{
            ...shapeBaseStyle,
            borderBottomColor: color,
          }}
        />
      </motion.div>
    );
  }

  return (
    <motion.div
      className="absolute"
      style={{
        ...shapeBaseStyle,
        left: `${startX}%`,
        top: `${startY}%`,
      }}
      animate={{
        x: [0, xDrift, -xDrift / 2, xDrift / 3, 0],
        y: [0, -yDrift, yDrift / 2, -yDrift / 3, 0],
        opacity: opacityRange,
        rotate: type !== 'circle' ? [0, 360] : undefined,
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
// 3. Main Entry Page Component
// ============================================
export default function EntryPage() {
  const router = useRouter();

  const titleControls = useAnimation();
  const subtitleControls = useAnimation();
  const loginButtonControls = useAnimation();
  const registerLinkControls = useAnimation();

  useEffect(() => {
    const animateEntrance = async () => {
      await titleControls.start({ opacity: 1, y: 0, transition: { type: 'spring', damping: 12, stiffness: 100 } });
      await subtitleControls.start({ opacity: 1, transition: { duration: 0.6, ease: 'easeOut' } });
      await loginButtonControls.start({ opacity: 1, scale: 1, transition: { delay: 0.2, type: 'spring', damping: 10, stiffness: 120 } });
      await registerLinkControls.start({ opacity: 1, transition: { delay: 0.3, duration: 0.5 } });
    };
    animateEntrance();
  }, [titleControls, subtitleControls, loginButtonControls, registerLinkControls]);

  // Neon floating shapes – colors now brighter and translucent
  const shapes: FloatingShapeProps[] = [
    { index: 0, type: 'circle', color: '#A78BFA', size: 80, startX: 15, startY: 70, opacityRange: [0.15, 0.35] },
    { index: 1, type: 'circle', color: '#F472B6', size: 60, startX: 85, startY: 20, opacityRange: [0.12, 0.3] },
    { index: 2, type: 'square', color: '#34D399', size: 70, startX: 45, startY: 85, opacityRange: [0.15, 0.35] },
    { index: 3, type: 'square', color: '#60A5FA', size: 50, startX: 10, startY: 30, opacityRange: [0.12, 0.28] },
    { index: 4, type: 'triangle', color: '#FBBF24', size: 90, startX: 75, startY: 60, opacityRange: [0.1, 0.25] },
    { index: 5, type: 'triangle', color: '#F87171', size: 65, startX: 30, startY: 15, opacityRange: [0.12, 0.3] },
    { index: 6, type: 'circle', color: '#C084FC', size: 100, startX: 90, startY: 45, opacityRange: [0.1, 0.25] },
    { index: 7, type: 'square', color: '#38BDF8', size: 55, startX: 5, startY: 50, opacityRange: [0.15, 0.35] },
    { index: 8, type: 'triangle', color: '#FB923C', size: 75, startX: 55, startY: 10, opacityRange: [0.12, 0.28] },
    { index: 9, type: 'circle', color: '#4ADE80', size: 45, startX: 70, startY: 90, opacityRange: [0.18, 0.4] },
  ];

  const handleLogin = () => router.push('/login');
  const handleRegister = () => router.push('/register');

  return (
    <div className="relative flex h-screen w-full items-center justify-center overflow-hidden">
      {/* Animated Dark Gradient Background */}
      <AnimatedGradient />

      {/* Floating Shapes Layer */}
      <div className="absolute inset-0 pointer-events-none">
        {shapes.map((shape, i) => (
          <FloatingShape key={i} {...shape} />
        ))}
      </div>

      {/* Foreground Content – Glass card */}
      <div className="relative z-10 w-full max-w-md px-6">
        <motion.div
          className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 sm:p-10 shadow-2xl flex flex-col items-center"
        >
          {/* Animated Title */}
          <motion.h1
            initial={{ opacity: 0, y: 40 }}
            animate={titleControls}
            className="mb-4 text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-violet-300 via-fuchsia-300 to-cyan-300"
          >
            Welcome to Knowmato 🎓
          </motion.h1>

          {/* Animated Subtitle */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={subtitleControls}
            className="mb-10 text-lg sm:text-xl md:text-2xl font-medium text-white/80 drop-shadow-md"
          >
            Solve doubts with top tutors
          </motion.p>

          {/* Login Button */}
          <motion.button
            initial={{ opacity: 0, scale: 0.9 }}
            animate={loginButtonControls}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleLogin}
            className="mb-6 w-full rounded-2xl bg-gradient-to-r from-violet-500 to-fuchsia-500 py-4 font-bold text-white shadow-lg shadow-violet-500/25 hover:shadow-xl transition-all text-xl"
          >
            Login
          </motion.button>

          {/* Register Link */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={registerLinkControls}
            className="text-center text-white/80"
          >
            Don't have an account?
            <button
              onClick={handleRegister}
              className="ml-2 font-bold text-violet-300 hover:text-violet-200 underline underline-offset-2 transition"
            >
              Register
            </button>
          </motion.div>
        </motion.div>
      </div>

      {/* Custom CSS for blob animation */}
      <style jsx>{`
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
}