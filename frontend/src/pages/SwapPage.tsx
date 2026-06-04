import React from "react";
import { motion } from "framer-motion";
import { SwapWidget } from "../components/swap/SwapWidget";
import { useThemeStore } from "../store/themeStore";

export default function SwapPage() {
  const { theme } = useThemeStore();
  const isDark = theme === "dark";

  return (
    <div
      className={`min-h-[calc(100vh-72px)] relative font-sans transition-colors duration-300 ease-in-out select-none overflow-x-hidden`}
    >

      {/* Blurred glow background behind the centerpiece swap card for light mode */}
      {!isDark && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
          <motion.div
            animate={{
              scale: [1, 1.1, 1],
              x: [0, 20, 0],
              y: [0, -20, 0],
            }}
            transition={{
              duration: 12,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="absolute left-[50%] top-[25%] -translate-x-1/2 w-[480px] h-[480px] rounded-full blur-[140px] opacity-20 bg-gradient-to-r from-[#FF81C5] to-[#B07EFF]"
          />
        </div>
      )}

      {/* Main swap card positioning viewport */}
      <main className="relative z-10 px-4 pt-16 md:pt-24 pb-20 max-w-[1200px] mx-auto flex flex-col items-center">
        <SwapWidget theme={theme} />
      </main>

      {/* Footer */}
      <footer className="w-full text-center py-6 text-xs font-semibold select-none z-10 relative pointer-events-none">
      </footer>
    </div>
  );
}
