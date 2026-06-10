import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X } from "lucide-react";

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Handle scroll detection
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? "bg-white/80 border-b border-zinc-200/50 backdrop-blur-md py-4"
          : "bg-transparent py-6"
      }`}
    >
      <div className="max-w-[1280px] mx-auto px-6 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="relative">
            <div className="absolute inset-0 bg-cyan-400/20 rounded-full blur-[10px] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <img
              src="/logo.png"
              alt="MSTSwap Logo"
              className="h-9 w-9 object-contain relative z-10 transition-transform duration-300 group-hover:scale-105"
            />
          </div>
          <span className="text-xl font-bold font-display tracking-wider text-zinc-900 group-hover:text-cyan-600 transition-colors duration-300">
            MSTSwap
          </span>
        </Link>

        {/* Right Buttons (Desktop) */}
        <div className="hidden md:flex items-center gap-4">
          {/* Launch App Button */}
          <Link
            to="/swap"
            className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-cyan-500 to-indigo-500 text-white font-bold font-sans text-sm hover:brightness-110 transition-all shadow-[0_4px_16px_rgba(6,182,212,0.25)] hover:scale-[1.02] active:scale-[0.98]"
          >
            Launch App
          </Link>
        </div>

        {/* Mobile Menu Actions */}
        <div className="flex md:hidden items-center gap-3">
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 rounded-full border border-zinc-200 bg-zinc-50 text-zinc-600"
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
            className="md:hidden border-b w-full overflow-hidden bg-white/95 border-zinc-200 text-zinc-950"
          >
            <div className="flex flex-col p-6 gap-5">
              <div className="flex flex-col gap-3 pt-4">
                <Link
                  to="/swap"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center justify-center w-full py-3 rounded-2xl font-bold bg-gradient-to-r from-cyan-500 to-indigo-500 text-white"
                >
                  Launch App
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
