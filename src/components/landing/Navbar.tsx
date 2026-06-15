import { useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Sun, Moon } from "lucide-react";
import { useThemeStore } from "../../store/themeStore";

export default function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { theme, toggleTheme } = useThemeStore();
  const isDark = theme === "dark";

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 border-b backdrop-blur-md py-2.5 transition-colors duration-300 ${isDark ? "bg-zinc-950/95 border-zinc-800/50 text-white" : "bg-white/95 border-zinc-200/50 text-zinc-900"
        }`}
    >
      <div className="max-w-[1280px] mx-auto px-6 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 group -ml-3">
          <div className="relative">
            <div className="absolute inset-0 bg-cyan-400/20 rounded-full blur-[10px] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <img
              src={isDark ? "/WhiteRapidLogo.png" : "/RapidLogo.png"}
              alt="MSTSwap Logo"
              className="object-contain relative z-10 transition-transform duration-300 group-hover:scale-105"
              style={{ width: "7.3rem", height: "3.5rem" }}
            />
          </div>
          {/* <span className={`text-xl font-bold font-sans tracking-wider transition-colors duration-300 group-hover:text-cyan-600 ${isDark ? "text-zinc-50" : "text-zinc-900"
            }`}>
            MSTSwap
          </span> */}
        </Link>

        {/* Right Buttons (Desktop) */}
        <div className="hidden md:flex items-center gap-4">
          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            className={`flex h-10 w-10 items-center justify-center rounded-full border transition-all hover:scale-105 active:scale-95 ${isDark
              ? "border-zinc-800 bg-zinc-900/60 text-amber-400 hover:bg-zinc-850"
              : "border-zinc-200 bg-zinc-50 text-zinc-600 hover:bg-zinc-100"
              }`}
            aria-label="Toggle theme"
          >
            {isDark ? <Sun size={16} /> : <Moon size={16} />}
          </button>

          {/* Launch App Button */}
          <Link
            to="/swap"
            className="blob-btn"
          >
            Launch App
            <span className="blob-btn__inner">
              <span className="blob-btn__blobs">
                <span className="blob-btn__blob"></span>
                <span className="blob-btn__blob"></span>
                <span className="blob-btn__blob"></span>
                <span className="blob-btn__blob"></span>
              </span>
            </span>
          </Link>
        </div>

        {/* Mobile Menu Actions */}
        <div className="flex md:hidden items-center gap-3">
          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            className={`flex h-8 w-8 items-center justify-center rounded-full border transition-all ${isDark
              ? "border-zinc-800 bg-zinc-900/60 text-amber-400"
              : "border-zinc-200 bg-zinc-50 text-zinc-600"
              }`}
            aria-label="Toggle theme"
          >
            {isDark ? <Sun size={14} /> : <Moon size={14} />}
          </button>

          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className={`p-2 rounded-full border transition-colors ${isDark ? "border-zinc-850 bg-zinc-900 text-zinc-400" : "border-zinc-200 bg-zinc-50 text-zinc-600"
              }`}
          >
            {isMobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className={`md:hidden border-b w-full overflow-hidden transition-colors duration-300 ${isDark ? "bg-zinc-950/95 border-zinc-850 text-zinc-50" : "bg-white/95 border-zinc-200 text-zinc-950"
              }`}
          >
            <div className="flex flex-col p-6 gap-5">
              <div className="flex flex-col gap-3 pt-4">
                <Link
                  to="/swap"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center justify-center w-full py-3 rounded-2xl font-semibold bg-gradient-to-r from-cyan-500 to-indigo-500 text-white"
                >
                  Launch App
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Gooey filter for blob button */}
      <svg xmlns="http://www.w3.org/2000/svg" version="1.1" style={{ position: 'absolute', width: 0, height: 0, pointerEvents: 'none' }}>
        <defs>
          <filter id="goo">
            <feGaussianBlur in="SourceGraphic" result="blur" stdDeviation="10" />
            <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 21 -7" result="goo" />
            <feBlend in2="goo" in="SourceGraphic" result="mix" />
          </filter>
        </defs>
      </svg>
    </header>
  );
}
