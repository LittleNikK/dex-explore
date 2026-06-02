import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import CandlestickChart from "../components/charts/CandlestickChart";
import { TrendingUp, BarChart3, Clock, DollarSign, Activity } from "lucide-react";
import { useThemeStore } from "../store/themeStore";

interface TradeLog {
  id: string;
  time: string;
  type: "buy" | "sell";
  price: number;
  amount: string;
}

// Generate premium mock candlestick data for WMST/USDC 0.3% Pool
const CANDLE_MOCK = Array.from({ length: 30 }, (_, i) => {
  const day = i + 1;
  const time = `2026-05-${day < 10 ? "0" + day : day}`;
  const base = 56 + Math.sin(i / 3) * 3;
  const open = base;
  const close = base + (Math.random() - 0.5) * 2;
  const high = Math.max(open, close) + Math.random() * 0.8;
  const low = Math.min(open, close) - Math.random() * 0.8;
  return { time, open, high, low, close };
});

export default function TrendingPage() {
  const { theme } = useThemeStore();
  const isDark = theme === "dark";
  const [logs, setLogs] = useState<TradeLog[]>([]);

  // Periodically stream simulated order book swap events
  useEffect(() => {
    const initialLogs: TradeLog[] = Array.from({ length: 5 }, (_, i) => ({
      id: Math.random().toString(),
      time: new Date(Date.now() - i * 60000).toLocaleTimeString(),
      type: Math.random() > 0.4 ? "buy" : "sell",
      price: Number((56 + (Math.random() - 0.5) * 0.5).toFixed(4)),
      amount: (Math.random() * 50 + 2).toFixed(4)
    }));
    setLogs(initialLogs);

    const interval = setInterval(() => {
      const newLog: TradeLog = {
        id: Math.random().toString(),
        time: new Date().toLocaleTimeString(),
        type: Math.random() > 0.55 ? "buy" : "sell",
        price: Number((56 + (Math.random() - 0.5) * 0.4).toFixed(4)),
        amount: (Math.random() * 80 + 1).toFixed(4)
      };
      setLogs((prev) => [newLog, ...prev.slice(0, 9)]);
    }, 4500);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className={`relative min-h-[calc(100vh-72px)] px-4 pb-20 pt-10 font-sans transition-colors duration-500 ${isDark ? "text-slate-100" : "text-slate-900"}`}>
      
      <div className="max-w-5xl mx-auto space-y-8 relative z-10">
        
        {/* Main Header */}
        <div className={`flex flex-col md:flex-row md:justify-between md:items-end gap-4 border-b pb-6 transition-colors ${isDark ? "border-slate-800" : "border-slate-300"}`}>
          <div>
            <span className={`text-xs font-semibold tracking-wider uppercase flex items-center gap-1.5 font-mono ${isDark ? "text-cyan-300" : "text-indigo-500"}`}>
              <Activity size={14} className="animate-pulse" />
              Live Pricing Tickers
            </span>
            <h1 className={`text-3xl font-display font-extrabold uppercase tracking-wide mt-1 ${isDark ? "text-white" : "text-slate-950"}`}>Trending Pools</h1>
          </div>
          <div className="text-xs font-bold font-mono text-zinc-500">
            Feed updated every 4s via WebSocket RPC
          </div>
        </div>

        {/* Live Pool metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className={`p-5 rounded-3xl border shadow-lg transition-all backdrop-blur-md ${isDark ? "border-slate-800/80 bg-slate-950/60 hover:bg-slate-900/30" : "border-slate-200/50 bg-white/70 hover:bg-slate-50/50"}`}>
            <div className="text-xs font-semibold font-mono text-zinc-500 flex items-center gap-1.5">
              <TrendingUp size={12} className="text-cyan-400" /> Active Pair
            </div>
            <div className="text-lg font-display font-bold mt-1">WMST / USDC</div>
          </div>
          <div className={`p-5 rounded-3xl border shadow-lg transition-all backdrop-blur-md ${isDark ? "border-slate-800/80 bg-slate-950/60 hover:bg-slate-900/30" : "border-slate-200/50 bg-white/70 hover:bg-slate-50/50"}`}>
            <div className="text-xs font-semibold font-mono text-zinc-500 flex items-center gap-1.5">
              <DollarSign size={12} className="text-indigo-400" /> Pool Price
            </div>
            <div className="text-lg font-mono font-bold mt-1">56.4200 USDC</div>
          </div>
          <div className={`p-5 rounded-3xl border shadow-lg transition-all backdrop-blur-md ${isDark ? "border-slate-800/80 bg-slate-950/60 hover:bg-slate-900/30" : "border-slate-200/50 bg-white/70 hover:bg-slate-50/50"}`}>
            <div className="text-xs font-semibold font-mono text-zinc-500 flex items-center gap-1.5">
              <BarChart3 size={12} className="text-teal-400" /> 24h Vol
            </div>
            <div className="text-lg font-mono font-bold text-emerald-500 dark:text-emerald-400 mt-1">+$420,500.00</div>
          </div>
          <div className={`p-5 rounded-3xl border shadow-lg transition-all backdrop-blur-md ${isDark ? "border-slate-800/80 bg-slate-950/60 hover:bg-slate-900/30" : "border-slate-200/50 bg-white/70 hover:bg-slate-50/50"}`}>
            <div className="text-xs font-semibold font-mono text-zinc-500 flex items-center gap-1.5">
              <Clock size={12} className="text-purple-400" /> Fee Tier
            </div>
            <div className="text-lg font-mono font-bold mt-1">3000 Bps</div>
          </div>
        </div>

        {/* Live Exchange layout */}
        <div className="grid md:grid-cols-[1fr_320px] gap-8 items-start">
          
          {/* Chart column */}
          <div className={`p-5 rounded-3xl border shadow-[0_35px_120px_-55px_rgba(15,23,42,0.55)] backdrop-blur-2xl transition-all duration-500 space-y-4 ${isDark ? "border-slate-700/70 bg-slate-950/85" : "border-slate-200/80 bg-white/90"}`}>
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-display font-bold uppercase tracking-wide">Historical OHLC Price</h3>
              <span className={`text-[10px] uppercase font-mono font-bold px-2 py-0.5 rounded ${isDark ? "bg-slate-900 text-slate-400" : "bg-slate-100 text-slate-600"}`}>1D Candles</span>
            </div>
            <div className="border-none p-2 rounded-2xl bg-black/40">
              <CandlestickChart data={CANDLE_MOCK} />
            </div>
          </div>

          {/* Real-time Buy/Sell Trades Feed */}
          <div className={`p-5 rounded-3xl border shadow-[0_35px_120px_-55px_rgba(15,23,42,0.55)] backdrop-blur-2xl transition-all duration-500 space-y-4 h-[390px] flex flex-col ${isDark ? "border-slate-700/70 bg-slate-950/85" : "border-slate-200/80 bg-white/90"}`}>
            <h3 className={`text-xs uppercase font-display font-bold tracking-wider flex items-center gap-1.5 border-b pb-3 ${isDark ? "border-slate-800 text-cyan-400" : "border-slate-200 text-cyan-600"}`}>
              <Activity size={14} className="animate-pulse" />
              Live Order Book Stream
            </h3>
            <div className="flex justify-between text-[10px] text-zinc-500 uppercase font-mono font-bold pb-2">
              <span>Time</span>
              <span>Price</span>
              <span>Amount</span>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 text-xs font-mono">
              <AnimatePresence initial={false}>
                {logs.map((log) => (
                  <motion.div
                    key={log.id}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="flex justify-between items-center font-bold"
                  >
                    <span className="text-zinc-550 font-bold">{log.time}</span>
                    <span className={log.type === "buy" ? "text-emerald-500 font-bold" : "text-rose-500 font-bold"}>
                      ${log.price.toFixed(4)}
                    </span>
                    <span className={`font-bold ${isDark ? "text-zinc-300" : "text-zinc-700"}`}>{log.amount} WMST</span>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
