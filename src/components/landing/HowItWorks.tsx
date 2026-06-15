import { motion } from "framer-motion";
import { Wallet, Coins, CheckCircle, ArrowRight } from "lucide-react";
import { useThemeStore } from "../../store/themeStore";

interface StepConfig {
  number: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  illustration: (isDark: boolean) => React.ReactNode;
}

export default function HowItWorks() {
  const { theme } = useThemeStore();
  const isDark = theme === "dark";

  const steps: StepConfig[] = [
    {
      number: "01",
      title: "Connect Wallet",
      description: "Securely link your preferred Web3 wallet (such as MetaMask, Coinbase Wallet, or WalletConnect) via our responsive wallet hub interface.",
      icon: <Wallet className="w-4 h-4" />,
      illustration: (isDark: boolean) => (
        <div className="relative w-full h-full flex items-center justify-center">
          <motion.div
            animate={{ scale: [1, 1.3, 1], opacity: [0.2, 0.5, 0.2] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            className={`absolute h-32 w-32 rounded-full border ${isDark ? "border-cyan-500/20" : "border-cyan-400/40"}`}
          />
          <motion.div
            animate={{ scale: [1, 1.5, 1], opacity: [0.1, 0.3, 0.1] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
            className={`absolute h-44 w-44 rounded-full border ${isDark ? "border-blue-500/10" : "border-blue-400/25"}`}
          />
          <motion.div
            animate={{ y: [0, -6, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            className={`relative z-10 p-4 rounded-2xl border flex items-center gap-3 ${isDark
              ? "bg-zinc-800 border-zinc-700 text-zinc-100 shadow-[0_8px_24px_rgba(0,0,0,0.4)]"
              : "bg-white border-zinc-300 text-zinc-900 shadow-[0_8px_24px_rgba(0,0,0,0.12)]"
              }`}
          >
            <div className={`p-2.5 rounded-xl ${isDark ? "bg-cyan-500/15 text-cyan-400" : "bg-cyan-100 text-cyan-700"}`}>
              <Wallet size={18} />
            </div>
            <div className="text-left">
              <div className={`text-xs font-bold ${isDark ? "text-zinc-100" : "text-zinc-800"}`}>Crypto Wallet</div>
              <div className="text-[9px] font-bold text-zinc-400 font-mono">0x4b8e...79fc</div>
            </div>
            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          </motion.div>

          {/* wallet option pills */}
          <div className="absolute bottom-7 flex items-center gap-2">
            {["MM", "WC", "CB"].map((label) => (
              <div key={label} className={`h-7 w-7 rounded-lg border flex items-center justify-center text-[8px] font-bold ${isDark
                ? "border-zinc-700 bg-zinc-800 text-zinc-500"
                : "border-zinc-300 bg-zinc-100 text-zinc-500"
                }`}>{label}</div>
            ))}
          </div>
        </div>
      )
    },
    {
      number: "02",
      title: "Choose Tokens",
      description: "Browse the extensive list of supported networks and tokens. Choose the asset pairs you want to trade and key in the transaction size.",
      icon: <Coins className="w-4 h-4" />,
      illustration: (isDark: boolean) => (
        <div className="relative w-full h-full flex flex-col items-center justify-center gap-3">
          <motion.div
            animate={{ x: [-4, 4, -4] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
            className={`flex items-center gap-3 px-4 py-2.5 rounded-xl border w-[180px] ${isDark
              ? "bg-zinc-800 border-zinc-700 shadow-[0_4px_16px_rgba(0,0,0,0.3)]"
              : "bg-white border-zinc-300 shadow-[0_4px_16px_rgba(0,0,0,0.1)]"
              }`}
          >
            <img src="/logo.png" alt="WMST" className="h-6 w-6 rounded-full object-contain" />
            <div className="leading-none">
              <div className={`text-[12px] font-bold ${isDark ? "text-zinc-100" : "text-zinc-800"}`}>WMST</div>
              <div className="text-[9px] text-zinc-400 mt-0.5">You pay</div>
            </div>
            <div className={`ml-auto text-[12px] font-bold ${isDark ? "text-zinc-300" : "text-zinc-700"}`}>100</div>
          </motion.div>

          <motion.div
            animate={{ x: [-6, 6, -6] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            className={`h-7 w-7 rounded-full border flex items-center justify-center ${isDark ? "border-cyan-500/40 bg-cyan-500/10 text-cyan-400" : "border-cyan-400/60 bg-cyan-50 text-cyan-600"
              }`}
          >
            <ArrowRight size={13} />
          </motion.div>

          <motion.div
            animate={{ x: [4, -4, 4] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
            className={`flex items-center gap-3 px-4 py-2.5 rounded-xl border w-[180px] ${isDark
              ? "bg-zinc-800 border-cyan-500/30 shadow-[0_4px_16px_rgba(0,0,0,0.3)]"
              : "bg-white border-cyan-400/50 shadow-[0_4px_16px_rgba(6,182,212,0.12)]"
              }`}
          >
            <div className={`h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold ${isDark ? "bg-cyan-500/15 text-cyan-400" : "bg-cyan-100 text-cyan-700"
              }`}>$</div>
            <div className="leading-none">
              <div className={`text-[12px] font-bold ${isDark ? "text-cyan-300" : "text-cyan-700"}`}>USDT</div>
              <div className="text-[9px] text-zinc-400 mt-0.5">You receive</div>
            </div>
            <div className={`ml-auto text-[12px] font-bold ${isDark ? "text-cyan-300" : "text-cyan-600"}`}>4.99</div>
          </motion.div>

          {/* <div className={`absolute bottom-5 text-[10px] font-mono flex items-center gap-1.5 ${isDark ? "text-zinc-600" : "text-zinc-400"}`}>
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Best rate · 3 routes found
          </div> */}
        </div>
      )
    },
    {
      number: "03",
      title: "Confirm Swap",
      description: "Inspect the aggregated price rate details, smart-router path, and slippage. Click swap and sign the secure wallet transaction.",
      icon: <CheckCircle className="w-4 h-4" />,
      illustration: (isDark: boolean) => (
        <div className="relative w-full h-full p-4 flex items-center justify-center">
          <motion.div
            animate={{ scale: [0.99, 1.01, 0.99] }}
            transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
            className={`flex flex-col items-center justify-center gap-3 px-5 py-4 rounded-2xl border w-full h-full ${isDark
              ? "bg-zinc-900 border-zinc-800 text-zinc-100 shadow-[0_8px_24px_rgba(0,0,0,0.3)]"
              : "bg-white border-zinc-300 text-zinc-900 shadow-[0_8px_24px_rgba(0,0,0,0.06)]"
              }`}
          >
            <motion.div
              initial={{ scale: 0, rotate: -30 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 200, damping: 14, delay: 0.3 }}
              className={`h-11 w-11 rounded-full border flex items-center justify-center ${isDark
                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                : "border-emerald-400/40 bg-emerald-50 text-emerald-600"
                }`}
            >
              <CheckCircle size={22} />
            </motion.div>

            <div className={`text-[12px] font-bold text-center ${isDark ? "text-zinc-100" : "text-zinc-800"}`}>
              Transaction Confirmed
            </div>

            <div className="w-full flex flex-col gap-2">
              {[
                { label: "Gas saved", value: "$12.42", green: true },
                { label: "Slippage", value: "0.05%", green: false },
              ].map((row) => (
                <div key={row.label} className="flex items-center justify-between w-full text-[10px]">
                  <span className="text-zinc-400">{row.label}</span>
                  <span className={`font-bold font-mono ${row.green ? "text-emerald-500" : isDark ? "text-zinc-300" : "text-zinc-700"}`}>
                    {row.value}
                  </span>
                </div>
              ))}
            </div>

            <div className={`text-[9px] font-mono pt-1.5 border-t w-full text-center ${isDark ? "border-zinc-850 text-zinc-500" : "border-zinc-200 text-zinc-400"
              }`}>
              Tx: 0x8a9...c4b2
            </div>
          </motion.div>

          {/* bg glow */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className={`w-28 h-28 rounded-full blur-2xl ${isDark ? "bg-emerald-500/5" : "bg-emerald-400/10"}`} />
          </div>
        </div>
      )
    }
  ];

  return (
    <section className={`relative py-28 overflow-hidden border-b transition-colors duration-300 bg-transparent ${isDark ? "text-white border-zinc-900" : "text-zinc-900 border-zinc-100"
      }`}>
      <div className="max-w-[1280px] mx-auto px-6 relative z-10">

        {/* Heading */}
        <div className="text-center max-w-3xl mx-auto mb-20">
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
            className={`text-xs font-semibold tracking-[0.18em] uppercase mb-4 ${isDark ? "text-zinc-500" : "text-zinc-400"}`}
          >
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.05 }}
            className={`text-[32px] md:text-[40px] lg:text-[48px] font-extrabold font-sans tracking-[-0.04em] leading-[1.15] transition-colors duration-300 ${isDark ? "text-zinc-50" : "text-zinc-900"
              }`}
          >
            How It Works in 3 Steps
          </motion.h2>
        </div>

        {/* Steps grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 relative">

          {/* Connector line — visible in both modes */}
          <div className={`hidden lg:block absolute top-[110px] left-[16%] right-[16%] h-[1.5px] z-0 transition-colors duration-300 ${isDark
            ? "bg-gradient-to-r from-cyan-500/20 via-indigo-500/20 to-violet-500/20"
            : "bg-gradient-to-r from-cyan-400/50 via-indigo-400/50 to-violet-400/50"
            }`} />

          {steps.map((step, index) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: index * 0.12, ease: [0.16, 1, 0.3, 1] }}
              className="flex flex-col items-center text-center group relative z-10"
            >
              {/* Illustration box */}
              <div className={`h-[220px] w-full max-w-[280px] rounded-3xl border flex items-center justify-center relative z-20 mb-8 overflow-hidden transition-all duration-500 ${isDark
                ? "border-zinc-800 bg-zinc-950/90 group-hover:border-zinc-700 shadow-[0_15px_35px_rgba(0,0,0,0.2)]"
                : "border-zinc-300 bg-zinc-50 group-hover:border-zinc-400 shadow-[0_4px_20px_rgba(0,0,0,0.08)] group-hover:shadow-[0_8px_32px_rgba(0,0,0,0.12)]"
                }`}>

                {/* Inner dot grid */}
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    backgroundImage: isDark
                      ? "radial-gradient(circle, rgba(255,255,255,0.03) 1px, transparent 1px)"
                      : "radial-gradient(circle, rgba(0,0,0,0.06) 1px, transparent 1px)",
                    backgroundSize: "16px 16px",
                  }}
                />

                {/* Hover spotlight */}
                <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none ${isDark
                  ? "bg-gradient-to-br from-cyan-500/5 via-transparent to-indigo-500/5"
                  : "bg-gradient-to-br from-cyan-500/4 via-transparent to-indigo-500/4"
                  }`} />

                {step.illustration(isDark)}
              </div>

              {/* Step indicator */}
              <div className="flex items-center gap-3 mb-5">
                <span className={`text-sm font-bold font-sans ${isDark ? "text-cyan-500" : "text-cyan-600"}`}>
                  {step.number}
                </span>
                <div className={`h-8 w-8 rounded-full border flex items-center justify-center transition-all duration-500 group-hover:bg-cyan-500 group-hover:text-white group-hover:border-cyan-500 ${isDark
                  ? "border-zinc-800 bg-zinc-900 text-zinc-400"
                  : "border-zinc-300 bg-white text-zinc-500 shadow-sm"
                  }`}>
                  {step.icon}
                </div>
              </div>

              {/* Title */}
              <h3 className={`text-xl font-bold font-sans tracking-[-0.04em] leading-[1.15] mb-2.5 transition-colors duration-300 group-hover:text-cyan-600 ${isDark ? "text-zinc-50" : "text-zinc-800"
                }`}>
                {step.title}
              </h3>

              {/* Description */}
              <p className={`text-[14px] leading-relaxed max-w-xs font-sans ${isDark ? "text-zinc-400 group-hover:text-zinc-300" : "text-zinc-600"
                }`}>
                {step.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
