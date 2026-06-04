import { Suspense, useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { WagmiProvider, useAccount, useConnect, useDisconnect, useSwitchChain, useChainId } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Link, Route, Routes, useLocation } from "react-router-dom";
import { wagmiConfig } from "./config/wagmi";
import { BackgroundCanvas } from "./components/swap/BackgroundCanvas";

// Import custom pages
import SwapPage from "./pages/SwapPage";
import ExplorePage from "./pages/ExplorePage";
import LiquidityPage from "./pages/LiquidityPage";
import WalletPage from "./pages/WalletPage";
import PortfolioPageWrapper from "./pages/PortfolioPage";

import { Menu, X, Sun, Moon, Wallet, CheckCircle2, AlertCircle, Power, PlugZap, ExternalLink } from "lucide-react";
import { useThemeStore } from "./store/themeStore";
import { mstChain } from "./config/chains";

const queryClient = new QueryClient();

function Navigation() {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const { theme, toggleTheme } = useThemeStore();
  const isDark = theme === "dark";

  const { address, isConnected, connector } = useAccount();
  const { connectors, connect } = useConnect();
  const { disconnect } = useDisconnect();
  const { switchChain, isPending: isSwitching } = useSwitchChain();
  const chainId = useChainId();
  const onMstChain = chainId === mstChain.id;

  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!isConnected) {
      setShowDropdown(false);
    }
  }, [isConnected]);

  const metaMaskConnector =
    connectors.find((item) => item.name.toLowerCase().includes("metamask")) ??
    connectors.find((item) => item.id === "injected");

  const handleWalletClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!isConnected && metaMaskConnector) {
      connect({ connector: metaMaskConnector });
    } else {
      setShowDropdown(!showDropdown);
    }
  };

  const links = [
    { to: "/", label: "Swap" },
    { to: "/explore", label: "Explore" },
    { to: "/liquidity", label: "Pool" },
    { to: "/portfolio", label: "Portfolio" }
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
            <img src="/logo.png" alt="MSWAP Logo" className="h-9 w-9 object-contain" />
            <span className="text-base font-black uppercase tracking-[0.24em] bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">MSWAP</span>
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
                className={`rounded-full px-3 py-1.5 text-[11px] font-extrabold uppercase tracking-[0.16em] transition duration-200
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
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={handleWalletClick}
              className="flex h-9 items-center justify-center gap-1.5 rounded-2xl bg-gradient-to-r from-cyan-500 to-indigo-600 px-4 text-[10px] font-extrabold uppercase tracking-[0.12em] text-white hover:brightness-110 active:scale-[0.98] transition-all shadow-md"
            >
              {isConnected && address ? (
                <>
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  {`${address.slice(0, 6)}...${address.slice(-4)}`}
                </>
              ) : (
                <>
                  <Wallet size={12} />
                  Connect Wallet
                </>
              )}
            </button>

            {/* Dropdown Menu */}
            <AnimatePresence>
              {showDropdown && isConnected && address && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                  className={`absolute right-0 mt-3 w-80 rounded-3xl border p-5 shadow-2xl backdrop-blur-2xl z-50
                    ${isDark 
                      ? "border-zinc-800 bg-zinc-950/95 text-white shadow-black/85" 
                      : "border-zinc-200 bg-white/95 text-zinc-950 shadow-slate-200/50"}`}
                >
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <h2 className="text-sm font-display font-extrabold uppercase tracking-wider">Wallet Hub</h2>
                      <p className="text-[10px] font-bold font-mono text-zinc-500 mt-0.5">
                        {connector?.name ?? "MetaMask"}
                      </p>
                    </div>
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-md shadow-emerald-400/50" />
                  </div>

                  <div className="space-y-4">
                    <div className={`rounded-2xl p-3 border ${isDark ? "bg-white/5 border-white/5" : "bg-zinc-50 border-zinc-200/40"}`}>
                      <div className="text-[9px] font-bold uppercase tracking-wider text-zinc-500 font-mono">Address</div>
                      <div className="mt-1 font-mono text-xs font-bold tracking-wide break-all">
                        {address}
                      </div>
                    </div>

                    <div className={`flex items-center gap-2.5 rounded-2xl p-3 border ${isDark ? "bg-white/5 border-white/5" : "bg-zinc-50 border-zinc-200/40"}`}>
                      {onMstChain ? (
                        <CheckCircle2 className="text-emerald-400 shrink-0" size={16} />
                      ) : (
                        <AlertCircle className="text-amber-400 shrink-0" size={16} />
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="text-[10px] font-bold uppercase tracking-wider font-mono">
                          {onMstChain ? "MST Testnet connected" : "Wrong network"}
                        </div>
                        <div className="text-[9px] font-bold font-mono text-zinc-500 mt-0.5">
                          Current chain ID: {chainId}
                        </div>
                      </div>
                    </div>

                    {!onMstChain && (
                      <button
                        className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-500 to-indigo-600 px-4 py-2.5 text-xs font-display font-bold text-white hover:brightness-110 active:scale-[0.98] transition-all"
                        disabled={isSwitching}
                        onClick={() => switchChain({ chainId: mstChain.id })}
                      >
                        <PlugZap size={14} />
                        {isSwitching ? "Switching..." : "Switch to MST Testnet"}
                      </button>
                    )}

                    <button
                      className={`flex w-full items-center justify-center gap-2 rounded-2xl border px-4 py-2.5 text-xs font-display font-bold transition-all active:scale-[0.98]
                        ${isDark 
                          ? "border-zinc-800 bg-white/5 text-zinc-300 hover:bg-white/10 hover:border-zinc-700" 
                          : "border-zinc-200 bg-zinc-50 text-zinc-800 hover:bg-zinc-100 hover:border-zinc-300"}`}
                      onClick={() => {
                        disconnect();
                        setShowDropdown(false);
                      }}
                    >
                      <Power size={14} />
                      Disconnect
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

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

              <button
                onClick={handleWalletClick}
                className="mt-2 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-500 to-indigo-600 py-3 text-xs font-extrabold uppercase tracking-wider text-white hover:brightness-110 active:scale-[0.98] transition-all"
              >
                {isConnected && address ? (
                  <>
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    {`${address.slice(0, 6)}...${address.slice(-4)}`}
                  </>
                ) : (
                  <>
                    <Wallet size={14} />
                    Connect Wallet
                  </>
                )}
              </button>

              <AnimatePresence>
                {showDropdown && isConnected && address && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className={`overflow-hidden rounded-2xl border p-4 shadow-lg backdrop-blur-xl mt-2
                      ${isDark 
                        ? "border-zinc-800 bg-zinc-950/95 text-white" 
                        : "border-zinc-200 bg-zinc-50 text-zinc-950"}`}
                  >
                    <div className="mb-3 flex items-center justify-between">
                      <div>
                        <h2 className="text-xs font-display font-extrabold uppercase tracking-wider">Wallet Hub</h2>
                        <p className="text-[9px] font-bold font-mono text-zinc-500 mt-0.5">
                          {connector?.name ?? "MetaMask"}
                        </p>
                      </div>
                      <span className="h-2 w-2 rounded-full bg-emerald-400" />
                    </div>

                    <div className="space-y-3">
                      <div className={`rounded-xl p-2.5 border ${isDark ? "bg-white/5 border-white/5" : "bg-white border-zinc-200/50"}`}>
                        <div className="text-[8px] font-bold uppercase tracking-wider text-zinc-500 font-mono">Address</div>
                        <div className="mt-0.5 font-mono text-[11px] font-bold tracking-wide break-all">
                          {address}
                        </div>
                      </div>

                      <div className={`flex items-center gap-2 rounded-xl p-2.5 border ${isDark ? "bg-white/5 border-white/5" : "bg-white border-zinc-200/50"}`}>
                        {onMstChain ? (
                          <CheckCircle2 className="text-emerald-400 shrink-0" size={14} />
                        ) : (
                          <AlertCircle className="text-amber-400 shrink-0" size={14} />
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="text-[9px] font-bold uppercase tracking-wider font-mono">
                            {onMstChain ? "MST Testnet connected" : "Wrong network"}
                          </div>
                          <div className="text-[8px] font-bold font-mono text-zinc-500 mt-0.5">
                            Current chain ID: {chainId}
                          </div>
                        </div>
                      </div>

                      {!onMstChain && (
                        <button
                          className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 px-3 py-2 text-xs font-display font-bold text-white hover:brightness-110 active:scale-[0.98] transition-all"
                          disabled={isSwitching}
                          onClick={() => switchChain({ chainId: mstChain.id })}
                        >
                          <PlugZap size={12} />
                          {isSwitching ? "Switching..." : "Switch to MST Testnet"}
                        </button>
                      )}

                      <button
                        className={`flex w-full items-center justify-center gap-2 rounded-xl border px-3 py-2 text-xs font-display font-bold transition-all active:scale-[0.98]
                          ${isDark 
                            ? "border-zinc-800 bg-white/5 text-zinc-300 hover:bg-white/10 hover:border-zinc-700" 
                            : "border-zinc-200 bg-white text-zinc-800 hover:bg-zinc-100 hover:border-zinc-300"}`}
                        onClick={() => {
                          disconnect();
                          setShowDropdown(false);
                          setIsOpen(false);
                        }}
                      >
                        <Power size={12} />
                        Disconnect
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
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

  // Sync dark class with document element for Tailwind and custom CSS variables
  useEffect(() => {
    const root = window.document.documentElement;
    if (isDark) {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }, [isDark]);

  return (
    <div
      className={`relative min-h-screen transition-colors duration-300 ease-in-out select-none overflow-hidden
        ${isDark ? "text-white" : "text-zinc-950"}`}
      style={{
        background: isDark
          ? "radial-gradient(120% 120% at 50% 0%, #0A1128 0%, #05070F 100%)"
          : "radial-gradient(120% 120% at 50% 0%, #EBF3FF 0%, #F1F5F9 100%)"
      }}
    >
      {/* Dynamic Blue Glowing background spots */}
      <div className="absolute top-[10%] left-[5%] w-[350px] h-[350px] bg-blue-500/10 rounded-full blur-[120px] pointer-events-none z-0" />
      <div className="absolute top-[40%] right-[10%] w-[450px] h-[450px] bg-indigo-500/5 rounded-full blur-[140px] pointer-events-none z-0" />
      <div className="absolute bottom-[10%] left-[15%] w-[400px] h-[400px] bg-cyan-500/10 rounded-full blur-[130px] pointer-events-none z-0" />

      {/* Global persistent 3D WebGL Canvas Background */}
      <BackgroundCanvas />

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
