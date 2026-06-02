import { Suspense, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { WagmiProvider } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Link, Route, Routes, useLocation } from "react-router-dom";
import { wagmiConfig } from "./config/wagmi";
import { BackgroundCanvas } from "./components/swap/BackgroundCanvas";

// Import custom pages
import SwapPage from "./pages/SwapPage";
import TrendingPage from "./pages/TrendingPage";
import TransferPage from "./pages/TransferPage";
import ExplorePage from "./pages/ExplorePage";
import LiquidityPage from "./pages/LiquidityPage";
import WalletPage from "./pages/WalletPage";
import PortfolioPageWrapper from "./pages/PortfolioPage";

import { Menu, X, Sun, Moon } from "lucide-react";
import { useThemeStore } from "./store/themeStore";

const queryClient = new QueryClient();

function Navigation() {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const { theme, toggleTheme } = useThemeStore();
  const isDark = theme === "dark";

  const links = [
    { to: "/", label: "Swap" },
    { to: "/trending", label: "Trending" },
    { to: "/transfer", label: "Transfer" },
    { to: "/explore", label: "Explore" },
    { to: "/liquidity", label: "Pool" },
    { to: "/portfolio", label: "Portfolio" },
    { to: "/wallet", label: "Wallet" }
  ];

  return (
    <motion.nav
      initial={{ y: -16, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.45, ease: "easeOut" }}
      className="sticky top-0 z-50 px-4 pt-4"
    >
      <div
        className={`mx-auto flex w-full max-w-[calc(100%-2rem)] items-center justify-between gap-4 rounded-3xl border px-5 py-3 shadow-[0_18px_60px_-40px_rgba(15,23,42,0.18)] backdrop-blur-xl transition duration-300
          ${isDark ? "border-zinc-800/70 bg-zinc-950/55 text-white" : "border-slate-250 bg-white/45 text-zinc-950"}`}
      >
        <div className="flex items-center gap-3">
          <Link
            to="/"
            className={`flex items-center gap-2 transition duration-200 ${isDark ? "text-white" : "text-zinc-950"}`}
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-cyan-500/15 text-cyan-500 shadow-sm border border-cyan-500/10">
              <span className="text-base font-extrabold tracking-tight">M</span>
            </div>
            <span className="text-xs font-black uppercase tracking-[0.24em] bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">MSTSwap</span>
          </Link>
        </div>

        {/* Desktop Links */}
        <div className="hidden lg:flex items-center gap-1.5">
          {links.map((link) => {
            const isActive = link.to === "/"
              ? location.pathname === "/" || location.pathname === "/swap"
              : location.pathname === link.to;
            return (
              <Link
                key={link.to}
                to={link.to}
                className={`rounded-full px-3 py-1.5 text-[9px] font-extrabold uppercase tracking-[0.16em] transition duration-200
                  ${isActive 
                    ? "bg-cyan-500/10 text-cyan-400 shadow-[0_8px_28px_-22px_rgba(34,211,238,0.7)] border border-cyan-500/10" 
                    : isDark 
                      ? "text-zinc-400 hover:text-white hover:bg-white/5" 
                      : "text-zinc-600 hover:text-zinc-950 hover:bg-slate-100/50"}`}
              >
                {link.label}
              </Link>
            );
          })}
        </div>

        {/* Right tools */}
        <div className="flex items-center gap-2">
          <button
            onClick={toggleTheme}
            className={`flex h-9 w-9 items-center justify-center rounded-2xl border transition duration-200 focus:outline-none focus:ring-2 focus:ring-cyan-400/40
              ${isDark ? "border-zinc-800 bg-zinc-900 text-cyan-300 hover:bg-zinc-800" : "border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50"}`}
            aria-label="Toggle theme"
          >
            {isDark ? <Sun size={15} /> : <Moon size={15} />}
          </button>

          <button
            onClick={() => setIsOpen(!isOpen)}
            className={`lg:hidden flex h-9 w-9 items-center justify-center rounded-2xl border transition duration-200 focus:outline-none focus:ring-2 focus:ring-cyan-400/40
              ${isDark ? "border-zinc-800 bg-zinc-900 text-cyan-300 hover:bg-zinc-800" : "border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50"}`}
            aria-label="Toggle navigation menu"
          >
            {isOpen ? <X size={16} /> : <Menu size={16} />}
          </button>
        </div>
      </div>

      {/* Mobile menu dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className={`mx-auto mt-3 max-w-[calc(100%-2rem)] overflow-hidden rounded-3xl border p-4 shadow-[0_22px_60px_-44px_rgba(15,23,42,0.25)] backdrop-blur-xl lg:hidden
              ${isDark ? "border-zinc-800/70 bg-zinc-950/85" : "border-slate-200/80 bg-white/85"}`}
          >
            <div className="flex flex-col gap-2">
              {links.map((link) => {
                const isActive = link.to === "/"
                  ? location.pathname === "/" || location.pathname === "/swap"
                  : location.pathname === link.to;
                return (
                  <Link
                    key={link.to}
                    to={link.to}
                    onClick={() => setIsOpen(false)}
                    className={`rounded-2xl px-4 py-2.5 text-xs font-extrabold uppercase tracking-[0.16em] transition duration-200
                      ${isActive ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/10" : isDark ? "text-zinc-300 hover:bg-white/5" : "text-zinc-700 hover:bg-slate-100"}`}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}

function MainLayout() {
  const { theme } = useThemeStore();
  const isDark = theme === "dark";

  return (
    <div
      className={`relative min-h-screen transition-colors duration-300 ease-in-out select-none
        ${isDark ? "text-white" : "text-zinc-950"}`}
      style={{
        background: isDark
          ? "radial-gradient(100% 100% at 50% 0%, #131A2A 0%, #0D111C 100%)"
          : "radial-gradient(100% 100% at 50% 0%, #FFF4F8 0%, #F9FAFB 100%)"
      }}
    >
      {/* Global persistent 3D WebGL Canvas Background */}
      {isDark && <BackgroundCanvas />}

      {/* Navigation Navbar */}
      <Navigation />

      {/* Page Routing */}
      <div className="relative z-10">
        <Suspense fallback={
          <div className="flex h-[80vh] items-center justify-center text-xs font-bold uppercase tracking-[0.2em] text-zinc-500 animate-pulse">
            Loading System Console...
          </div>
        }>
          <Routes>
            <Route path="/" element={<SwapPage />} />
            <Route path="/swap" element={<SwapPage />} />
            <Route path="/trending" element={<TrendingPage />} />
            <Route path="/transfer" element={<TransferPage />} />
            <Route path="/explore" element={<ExplorePage />} />
            <Route path="/liquidity" element={<LiquidityPage />} />
            <Route path="/portfolio" element={<PortfolioPageWrapper />} />
            <Route path="/wallet" element={<WalletPage />} />
          </Routes>
        </Suspense>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <MainLayout />
        </BrowserRouter>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
