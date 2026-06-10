import { motion } from "framer-motion";
import { Wallet, Coins, CheckCircle, ArrowRight } from "lucide-react";

interface StepConfig {
  number: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  illustration: React.ReactNode;
}

export default function HowItWorks() {
  const steps: StepConfig[] = [
    {
      number: "01",
      title: "Connect Wallet",
      description: "Securely link your preferred Web3 wallet (such as MetaMask, Coinbase Wallet, or WalletConnect) via our responsive wallet hub interface.",
      icon: <Wallet className="w-4 h-4" />,
      illustration: (
        <div className="relative w-full h-full flex items-center justify-center">
          {/* Concentric glowing circles */}
          <motion.div
            animate={{ scale: [1, 1.3, 1], opacity: [0.15, 0.4, 0.15] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            className="absolute h-32 w-32 rounded-full border border-cyan-500/20"
          />
          <motion.div
            animate={{ scale: [1, 1.5, 1], opacity: [0.05, 0.2, 0.05] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
            className="absolute h-44 w-44 rounded-full border border-blue-500/10"
          />
          <motion.div
            animate={{ y: [0, -6, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            className="relative z-10 p-5 rounded-3xl border shadow-xl flex items-center gap-3 bg-white border-zinc-200/80 text-zinc-900"
          >
            <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-600">
              <Wallet size={20} />
            </div>
            <div className="text-left">
              <div className="text-xs font-bold font-display">MetaMask</div>
              <div className="text-[9px] font-bold text-zinc-400 font-mono">0x4b8e...79fc</div>
            </div>
            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          </motion.div>
        </div>
      )
    },
    {
      number: "02",
      title: "Choose Tokens",
      description: "Browse the extensive list of supported networks and tokens. Choose the asset pairs you want to trade and key in the transaction size.",
      icon: <Coins className="w-4 h-4" />,
      illustration: (
        <div className="relative w-full h-full flex items-center justify-center gap-4">
          <motion.div
            animate={{ x: [-8, 8, -8] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
            className="p-3 rounded-2xl border shadow-md flex items-center gap-2 max-w-[120px] bg-white border-zinc-200/80"
          >
            <img src="/logo.png" alt="WMST" className="h-5 w-5 rounded-full object-contain grayscale opacity-80" />
            <div className="text-left leading-none">
              <span className="text-[10px] font-bold">WMST</span>
              <span className="text-[8px] font-bold text-zinc-400 block mt-0.5">Pay</span>
            </div>
          </motion.div>

          <div className="text-zinc-400 shrink-0">
            <ArrowRight size={18} className="animate-[scan_1.5s_linear_infinite]" />
          </div>

          <motion.div
            animate={{ x: [8, -8, 8] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
            className="p-3 rounded-2xl border shadow-md flex items-center gap-2 max-w-[120px] bg-white border-zinc-200/80"
          >
            <div className="h-5 w-5 rounded-full bg-cyan-500/10 flex items-center justify-center text-[10px] text-cyan-600 font-bold">$</div>
            <div className="text-left leading-none">
              <span className="text-[10px] font-bold">USDT</span>
              <span className="text-[8px] font-bold text-zinc-400 block mt-0.5">Receive</span>
            </div>
          </motion.div>
        </div>
      )
    },
    {
      number: "03",
      title: "Confirm Swap",
      description: "Inspect the aggregated price rate details, smart-router path, and slippage. Click swap and sign the secure wallet transaction.",
      icon: <CheckCircle className="w-4 h-4" />,
      illustration: (
        <div className="relative w-full h-full flex items-center justify-center">
          <motion.div
            animate={{ scale: [0.96, 1, 0.96] }}
            transition={{ duration: 4, repeat: Infinity }}
            className="p-5 rounded-3xl border shadow-2xl max-w-[200px] text-center bg-white border-zinc-200/80 text-zinc-900"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, ease: "easeOut" }}
              className="mx-auto h-12 w-12 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mb-3 border border-emerald-500/20"
            >
              <CheckCircle size={26} />
            </motion.div>
            <div className="text-xs font-bold font-display">Transaction Success</div>
            <div className="text-[9px] font-semibold text-emerald-500 mt-1">Gas saved: $12.42</div>
            <div className="text-[8px] text-zinc-400 mt-1 font-mono">Tx: 0x8a9...c4b2</div>
          </motion.div>
        </div>
      )
    }
  ];

  return (
    <section className="relative py-28 overflow-hidden border-b border-zinc-100">
      <div className="max-w-[1280px] mx-auto px-6 relative z-10">
        
        {/* Section Heading */}
        <div className="text-center max-w-3xl mx-auto mb-20">
          <h2 className="text-4xl md:text-5xl font-black font-display tracking-[-0.03em] leading-[1.1] mb-5 text-zinc-900">
            How It Works in 3 Steps
          </h2>
        </div>

        {/* Timeline Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 relative">
          
          {/* Connector line (Desktop only) */}
          <div className="hidden lg:block absolute top-[110px] left-[15%] right-[15%] h-[2px] bg-gradient-to-r from-cyan-500/15 via-indigo-500/15 to-violet-500/15 -z-10" />

          {steps.map((step, index) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: index * 0.12, ease: [0.16, 1, 0.3, 1] }}
              className="flex flex-col items-center text-center group"
            >
              {/* Step Illustration Holder */}
              <div className="h-[220px] w-full max-w-[280px] rounded-3xl border border-zinc-200/80 bg-zinc-50/30 flex items-center justify-center relative mb-8 overflow-hidden transition-all duration-500 group-hover:bg-white group-hover:border-zinc-300 group-hover:shadow-[0_20px_45px_rgba(0,0,0,0.04)]">
                {/* Dot grid inside illustration container */}
                <div 
                  className="absolute inset-0 opacity-[0.03] group-hover:opacity-[0.05] transition-opacity duration-500" 
                  style={{
                    backgroundImage: `radial-gradient(circle at 1px 1px, black 1px, transparent 0)`,
                    backgroundSize: '16px 16px'
                  }}
                />
                
                {/* Soft ambient background spotlight flare on hover */}
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-transparent to-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

                {step.illustration}
              </div>

              {/* Step Number and Icon Indicator */}
              <div className="flex items-center gap-3 mb-5">
                <span className="text-sm font-black font-display text-cyan-600">
                  {step.number}
                </span>
                <div className="h-8 w-8 rounded-full border border-zinc-200 bg-white text-zinc-500 flex items-center justify-center transition-all duration-500 group-hover:bg-cyan-500 group-hover:text-white group-hover:border-cyan-500 shadow-sm">
                  {step.icon}
                </div>
              </div>

              {/* Title & Description */}
              <h3 className="text-xl font-bold font-display mb-2.5 text-zinc-900 group-hover:text-cyan-600 transition-colors duration-300">
                {step.title}
              </h3>
              <p className="text-[14px] leading-relaxed max-w-xs font-sans text-zinc-500 group-hover:text-zinc-600 transition-colors duration-300">
                {step.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
