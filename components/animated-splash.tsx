"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Capacitor } from "@capacitor/core";

interface AnimatedSplashProps {
  onComplete?: () => void;
  minDuration?: number; // Minimum duration to show splash in ms
}

export function AnimatedSplash({ onComplete, minDuration = 2500 }: AnimatedSplashProps) {
  const [phase, setPhase] = useState<"logo" | "text" | "complete">("logo");
  const [isVisible, setIsVisible] = useState(true);

  const handleComplete = useCallback(() => {
    setIsVisible(false);
    setTimeout(() => {
      onComplete?.();
    }, 500); // Wait for fade out animation
  }, [onComplete]);

  useEffect(() => {
    // Phase 1: Logo animation (0-1000ms)
    const logoTimer = setTimeout(() => {
      setPhase("text");
    }, 1000);

    // Phase 2: Text animation + hold (1000-2500ms)
    const completeTimer = setTimeout(() => {
      setPhase("complete");
      handleComplete();
    }, minDuration);

    return () => {
      clearTimeout(logoTimer);
      clearTimeout(completeTimer);
    };
  }, [minDuration, handleComplete]);

  const isNative = Capacitor.isNativePlatform();

  if (!isNative) {
    // Don't show animated splash on web
    return null;
  }

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#0a0a0a]"
          style={{ 
            paddingTop: "env(safe-area-inset-top)",
            paddingBottom: "env(safe-area-inset-bottom)" 
          }}
        >
          {/* Background gradient */}
          <div className="absolute inset-0 overflow-hidden">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.3 }}
              transition={{ duration: 1.5 }}
              className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full"
              style={{
                background: "radial-gradient(circle, rgba(99,102,241,0.3) 0%, rgba(139,92,246,0.2) 40%, transparent 70%)",
                filter: "blur(60px)",
              }}
            />
          </div>

          {/* Logo container */}
          <div className="relative flex flex-col items-center justify-center">
            {/* Animated rings */}
            <div className="absolute">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: [0.8, 1.5, 1.5], opacity: [0, 0.3, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
                className="w-32 h-32 rounded-full border-2 border-indigo-500/30"
              />
            </div>
            <div className="absolute">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: [0.8, 1.8, 1.8], opacity: [0, 0.2, 0] }}
                transition={{ duration: 2, delay: 0.3, repeat: Infinity, ease: "easeOut" }}
                className="w-32 h-32 rounded-full border-2 border-purple-500/20"
              />
            </div>

            {/* Logo */}
            <motion.div
              initial={{ scale: 0.5, opacity: 0, rotate: -180 }}
              animate={{ scale: 1, opacity: 1, rotate: 0 }}
              transition={{ 
                duration: 0.8, 
                ease: [0.34, 1.56, 0.64, 1], // Spring-like bounce
                opacity: { duration: 0.4 }
              }}
              className="relative z-10"
            >
              <motion.svg 
                width="96" 
                height="96" 
                viewBox="0 0 48 48" 
                fill="none" 
                xmlns="http://www.w3.org/2000/svg"
                animate={{ 
                  filter: ["drop-shadow(0 0 20px rgba(99,102,241,0.5))", "drop-shadow(0 0 40px rgba(139,92,246,0.6))", "drop-shadow(0 0 20px rgba(99,102,241,0.5))"]
                }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <defs>
                  <linearGradient id="splash-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#6366f1" />
                    <stop offset="50%" stopColor="#8b5cf6" />
                    <stop offset="100%" stopColor="#a855f7" />
                  </linearGradient>
                  <linearGradient id="splash-glow" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#818cf8" stopOpacity="0.5" />
                    <stop offset="100%" stopColor="#c4b5fd" stopOpacity="0.2" />
                  </linearGradient>
                </defs>
                
                {/* Glow effect background */}
                <motion.circle 
                  cx="24" 
                  cy="24" 
                  r="22" 
                  fill="url(#splash-glow)"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                />
                
                {/* First F - with draw animation */}
                <motion.path
                  d="M14 10 L26 10 L26 13 L18 13 L18 21 L24 21 L24 24 L18 24 L18 36"
                  stroke="url(#splash-gradient)"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 1 }}
                  transition={{ duration: 0.8, delay: 0.2, ease: "easeInOut" }}
                />
                
                {/* Second F */}
                <motion.path
                  d="M22 12 L34 12 L34 15 L26 15 L26 23 L32 23 L32 26 L26 26 L26 38"
                  stroke="url(#splash-gradient)"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                  opacity="0.7"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 0.7 }}
                  transition={{ duration: 0.8, delay: 0.4, ease: "easeInOut" }}
                />
                
                {/* Flow lines */}
                <motion.path
                  d="M20 18 Q22 18, 24 16"
                  stroke="url(#splash-gradient)"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  fill="none"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 0.4 }}
                  transition={{ duration: 0.5, delay: 0.8 }}
                />
                <motion.path
                  d="M20 28 Q23 28, 26 26"
                  stroke="url(#splash-gradient)"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  fill="none"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 0.4 }}
                  transition={{ duration: 0.5, delay: 0.9 }}
                />
              </motion.svg>
            </motion.div>

            {/* App name */}
            <AnimatePresence>
              {(phase === "text" || phase === "complete") && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                  className="mt-8 flex flex-col items-center"
                >
                  <motion.h1
                    className="text-4xl font-bold bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.4, delay: 0.1 }}
                  >
                    FinFlow
                  </motion.h1>
                  <motion.p
                    className="mt-2 text-sm text-gray-400"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.4, delay: 0.3 }}
                  >
                    Smart Finance Manager
                  </motion.p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Loading indicator */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.5 }}
              className="mt-12"
            >
              <div className="flex gap-1.5">
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    className="w-2 h-2 rounded-full bg-indigo-500"
                    animate={{
                      scale: [1, 1.5, 1],
                      opacity: [0.5, 1, 0.5],
                    }}
                    transition={{
                      duration: 0.8,
                      repeat: Infinity,
                      delay: i * 0.15,
                    }}
                  />
                ))}
              </div>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default AnimatedSplash;
