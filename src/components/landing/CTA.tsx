import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useAccount, useConnect } from "wagmi";
import { Wallet, Check, ChevronRight } from "lucide-react";
import { useThemeStore } from "../../store/themeStore";
import { mstChain } from "../../config/chains";

export default function CTA() {
  const { theme } = useThemeStore();
  const isDark = theme === "dark";

  const { isConnected, address } = useAccount();
  const { connectors, connect } = useConnect();

  const metaMaskConnector =
    connectors.find((item) => item.name.toLowerCase().includes("metamask")) ??
    connectors.find((item) => item.id === "injected");

  const handleConnect = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!isConnected && metaMaskConnector) {
      connect({ connector: metaMaskConnector, chainId: mstChain.id });
    }
  };

  return (
    <section className="relative py-24 px-6 overflow-hidden">
      {/* Background glowing gradients */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-gradient-to-tr from-cyan-500/10 via-indigo-500/10 to-violet-500/10 blur-[140px] animate-pulse-slow" />
      </div>

      <div className="max-w-[1100px] mx-auto relative z-10">
        
        {/* Main CTA Frame */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 30 }}
          whileInView={{ opacity: 1, scale: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className={`relative glass rounded-[3rem] border overflow-hidden p-8 md:p-16 text-center flex flex-col items-center gap-8 ${
            isDark
              ? "bg-zinc-950/80 border-white/10"
              : "bg-white/80 border-zinc-200"
          }`}
        >
          {/* Decorative floating blur spheres inside card */}
          <div className="absolute top-[-10%] right-[-10%] w-60 h-60 rounded-full bg-cyan-500/10 blur-[40px] pointer-events-none" />
          <div className="absolute bottom-[-10%] left-[-10%] w-60 h-60 rounded-full bg-indigo-600/10 blur-[40px] pointer-events-none" />

          {/* Heading */}
          <div className="max-w-2xl flex flex-col items-center">
            <span className={`inline-block text-xs font-black uppercase tracking-[0.2em] mb-4 px-3 py-1 rounded-full border ${
              isDark ? "bg-white/5 border-white/10 text-cyan-400" : "bg-zinc-100 border-zinc-200 text-cyan-600"
            }`}>
              Get Started Instantly
            </span>
            
            <h2 className={`text-3xl md:text-5xl font-black font-display tracking-tight mb-4 leading-tight ${
              isDark ? "text-white" : "text-zinc-950"
            }`}>
              Start Trading on <br />
              <span className="bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-400 bg-clip-text text-transparent">
                MSTSwap Today
              </span>
            </h2>
            
            <p className={`text-base md:text-lg leading-relaxed font-sans max-w-xl ${
              isDark ? "text-zinc-400" : "text-zinc-600"
            }`}>
              Access deep multi-chain liquidity, optimal routing paths, lower gas costs, and fully secure peer-to-contract transactions.
            </p>
          </div>

          {/* CTAs Button row */}
          <div className="flex flex-col sm:flex-row items-center gap-4 relative z-10 w-full justify-center">
            {/* Primary Swap Launch Button */}
            <Link
              to="/swap"
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-gradient-to-r from-cyan-500 to-indigo-500 text-white font-bold font-sans hover:brightness-110 shadow-[0_8px_24px_rgba(6,182,212,0.3)] hover:scale-[1.03] active:scale-[0.98] transition-all"
            >
              Launch App
              <ChevronRight size={16} />
            </Link>

            {/* Wallet Connect Button */}
            {isConnected ? (
              <div className={`w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 rounded-2xl border font-bold font-sans font-mono text-sm ${
                isDark ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-400" : "border-emerald-500/20 bg-emerald-500/5 text-emerald-600"
              }`}>
                <Check size={16} />
                {`${address?.slice(0, 6)}...${address?.slice(-4)}`}
              </div>
            ) : (
              <button
                onClick={handleConnect}
                className={`w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 rounded-2xl border font-bold font-sans transition-all hover:scale-[1.03] active:scale-[0.98] ${
                  isDark
                    ? "border-white/10 bg-white/5 text-white hover:bg-white/10 hover:border-white/20"
                    : "border-zinc-200 bg-zinc-50 text-zinc-800 hover:bg-zinc-100"
                }`}
              >
                <Wallet size={16} />
                Connect Wallet
              </button>
            )}
          </div>

        </motion.div>
      </div>
    </section>
  );
}
