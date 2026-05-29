import { motion } from "framer-motion";
import SwapCard from "../components/swap/SwapCard";
import { Link } from "react-router-dom";
import { Info, ShieldAlert, Cpu, ExternalLink } from "lucide-react";

export default function SwapPage() {
  return (
    <div className="relative min-h-screen px-4 pb-20 pt-10 overflow-hidden font-sans">
      {/* Glow highlight spots */}
      <div className="absolute top-1/3 left-10 w-96 h-96 bg-purple-900 glowing-bg-spot animate-pulse-slow" />
      <div className="absolute bottom-1/3 right-10 w-96 h-96 bg-pink-900 glowing-bg-spot animate-pulse-slow" style={{ animationDelay: "2.5s" }} />

      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header Title */}
        <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4 border-b border-zinc-800 pb-6">
          <div>
            <span className="text-xs font-semibold tracking-wider text-pink-400 uppercase">Interactive DApp</span>
            <h1 className="text-3xl font-display font-extrabold uppercase text-white tracking-wide mt-1">Concentrated Swap</h1>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/trending" className="text-xs text-zinc-400 hover:text-white transition">Live Tickers</Link>
            <span className="text-zinc-700">|</span>
            <Link to="/transfer" className="text-xs text-zinc-400 hover:text-white transition">Gas Calculator</Link>
            <span className="text-zinc-700">|</span>
            <Link to="/explore" className="text-xs text-zinc-400 hover:text-white transition">Wallet Explorer</Link>
          </div>
        </div>

        {/* Dashboard Grid */}
        <div className="grid md:grid-cols-[1fr_380px] gap-8 items-start">
          {/* Main Swap Column */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="p-1 rounded-2xl bg-gradient-to-r from-pink-500/20 via-purple-500/10 to-orange-500/20 border-neon-glow"
          >
            <div className="bg-zinc-950 p-6 rounded-2xl">
              <SwapCard />
            </div>
          </motion.div>

          {/* Sidebar Columns */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="space-y-6"
          >
            {/* Promo / Staking Box */}
            <div className="p-5 rounded-2xl border border-zinc-800 bg-zinc-900/60 backdrop-blur-md relative overflow-hidden">
              <div className="absolute top-0 right-0 w-16 h-16 bg-pink-500 glowing-bg-spot" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-pink-400 flex items-center gap-2 mb-2">
                <Flame size={16} className="text-pink-500" />
                Featured Pool Staking
              </h3>
              <p className="text-xs text-zinc-300 leading-relaxed mb-4">
                The WMST / USDC concentrated liquidity pool currently offers boosted reward weights on MST Testnet. Setup tick ranges to start gathering swapping fees atomically.
              </p>
              <Link
                to="/liquidity"
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-zinc-850 border border-zinc-700 py-3 text-xs font-semibold text-zinc-200 hover:bg-zinc-800 transition"
              >
                Provide Liquidity
              </Link>
            </div>

            {/* Contract addresses widget */}
            <div className="p-5 rounded-2xl border border-zinc-800 bg-zinc-950/40 backdrop-blur-md space-y-4">
              <h3 className="text-xs uppercase font-bold text-zinc-400 tracking-wider flex items-center gap-2">
                <Info size={14} className="text-purple-400" />
                Network Information
              </h3>
              <div className="space-y-3 text-[11px] font-mono text-zinc-400">
                <div className="flex justify-between border-b border-zinc-900 pb-2">
                  <span>Network</span>
                  <span className="text-zinc-200">MST Testnet</span>
                </div>
                <div className="flex justify-between border-b border-zinc-900 pb-2">
                  <span>Chain ID</span>
                  <span className="text-zinc-200">91562037</span>
                </div>
                <div className="flex justify-between border-b border-zinc-900 pb-2">
                  <span>Fee Spacing</span>
                  <span className="text-zinc-200">60 Ticks (0.3%)</span>
                </div>
                <div className="space-y-1">
                  <div className="text-zinc-500">Router Address</div>
                  <a
                    href="https://testnet.mstscan.com/address/0xefa02641c27ec527a09f8484dc491b525cb035f6"
                    target="_blank"
                    rel="noreferrer"
                    className="text-pink-400 hover:underline flex items-center gap-1 leading-none"
                  >
                    0xefa02641c27...35f6
                    <ExternalLink size={10} />
                  </a>
                </div>
              </div>
            </div>

            {/* Quick tips */}
            <div className="p-5 rounded-2xl border border-zinc-900 bg-zinc-950/20 text-xs text-zinc-500 flex gap-3">
              <ShieldAlert size={28} className="text-orange-500 shrink-0 mt-0.5 animate-pulse" />
              <div className="leading-relaxed">
                Make sure you have registered native MST wrapped tokens prior to routing, or swap MST directly to auto-wrap through the SwapRouter.
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

// Inline helper for icons
function Flame({ size, className }: { size: number; className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
    </svg>
  );
}
