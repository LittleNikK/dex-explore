import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Star, Plus, Send, Check } from "lucide-react";
import { useThemeStore } from "../../store/themeStore";

interface Testimonial {
  name: string; handle: string; role: string; quote: string;
  rating: number; initials: string; avatarGradient: string;
}

const DEFAULT_TESTIMONIALS: Testimonial[] = [
  { name: "OM P", handle: "@om", role: "DeFi Yield Farmer", quote: "MSTSwap aggregator has completely changed my daily routine. The smart routing splits have saved me thousands of dollars on slippage across large trades. Execution is instant, and fees are always optimized.", rating: 5, initials: "OP", avatarGradient: "from-cyan-400 to-blue-500" },
  { name: "Aditya", handle: "@Aditya", role: "Protocol Engineer", quote: "I love the clean UX and deep glassmorphic interface. It feels like a premium DeFi tool. The non-custodial nature gives me peace of mind, and the router consistently matches or beats other aggregators.", rating: 5, initials: "AD", avatarGradient: "from-violet-500 to-indigo-500" },
  { name: "Marc", handle: "@Marc", role: "Crypto Portfolio Manager", quote: "The analytics dashboards and portfolio tracker are extremely polished. Incredibly convenient to monitor my liquidity pools and current position rewards all in one hub. Highly recommended DEX.", rating: 5, initials: "MA", avatarGradient: "from-amber-400 to-orange-500" },
];

const AVATAR_GRADIENTS = [
  "from-cyan-400 to-blue-500", "from-violet-500 to-indigo-500",
  "from-amber-400 to-orange-500", "from-emerald-400 to-teal-500", "from-rose-400 to-pink-500",
];

const ACCENT_COLORS: Record<string, { bar: string; glow: string; textDark: string; textLight: string }> = {
  "from-cyan-400 to-blue-500": { bar: "bg-cyan-500", glow: "rgba(6,182,212,0.18)", textDark: "text-cyan-400", textLight: "text-cyan-600" },
  "from-violet-500 to-indigo-500": { bar: "bg-violet-500", glow: "rgba(139,92,246,0.18)", textDark: "text-violet-400", textLight: "text-violet-600" },
  "from-amber-400 to-orange-500": { bar: "bg-amber-500", glow: "rgba(245,158,11,0.18)", textDark: "text-amber-400", textLight: "text-amber-600" },
  "from-emerald-400 to-teal-500": { bar: "bg-emerald-500", glow: "rgba(16,185,129,0.18)", textDark: "text-emerald-400", textLight: "text-emerald-600" },
  "from-rose-400 to-pink-500": { bar: "bg-rose-500", glow: "rgba(244,63,94,0.18)", textDark: "text-rose-400", textLight: "text-rose-600" },
};

const GOOGLE_SHEETS_URL = (import.meta.env.VITE_GOOGLE_SHEETS_URL as string) || "https://script.google.com/macros/s/AKfycbz5tOaUnHJNtYlgEcc-I8W-Yt_IXGpw_cof8RG7B27EGnTTqWGrl3Jst1wRgYM220aYdA/exec";

function mergeReviews(base: Testimonial[], incoming: Testimonial[]): Testimonial[] {
  const merged = [...base];
  incoming.forEach(item => { if (!merged.some(x => x.quote.trim().toLowerCase() === item.quote.trim().toLowerCase())) merged.push(item); });
  return merged;
}
function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (!parts.length) return "U";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}
function getVisibleIndices(active: number, total: number) {
  if (total === 1) return [active];
  if (total === 2) return [active, (active + 1) % total];
  return [(active - 1 + total) % total, active, (active + 1) % total];
}

export default function Testimonials() {
  const { theme } = useThemeStore();
  const isDark = theme === "dark";

  const [list, setList] = useState<Testimonial[]>(DEFAULT_TESTIMONIALS);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [formData, setFormData] = useState({ name: "", handle: "", role: "", quote: "", rating: 5 });

  useEffect(() => {
    const local = localStorage.getItem("mstswap_local_reviews");
    let init = [...DEFAULT_TESTIMONIALS];
    if (local) { try { init = mergeReviews(init, JSON.parse(local)); } catch (_) { } }
    setList(init);
    if (GOOGLE_SHEETS_URL) {
      fetch(GOOGLE_SHEETS_URL).then(r => r.json()).then(data => {
        if (Array.isArray(data)) {
          const fmt = data.map((d: any) => ({ name: String(d.name || d.Name || ""), handle: String(d.handle || d.Handle || ""), role: String(d.role || d.Role || ""), quote: String(d.quote || d.Quote || ""), rating: Number(d.rating || d.Rating || 5), initials: String(d.initials || d.Initials || ""), avatarGradient: String(d.avatarGradient || d.AvatarGradient || AVATAR_GRADIENTS[0]) })).filter(x => x.name && x.quote);
          setList(prev => mergeReviews(prev, fmt));
        }
      }).catch(() => { });
    }
  }, []);

  useEffect(() => {
    const t = setInterval(() => setActiveIndex(p => (p + 1) % list.length), 8000);
    return () => clearInterval(t);
  }, [list.length]);

  const handlePrev = () => setActiveIndex(p => p === 0 ? list.length - 1 : p - 1);
  const handleNext = () => setActiveIndex(p => (p + 1) % list.length);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.quote) return;
    setIsSubmitting(true);
    const newR: Testimonial = { name: formData.name, handle: formData.handle.startsWith("@") ? formData.handle : `@${formData.handle}`, role: formData.role, quote: formData.quote, rating: formData.rating, initials: getInitials(formData.name), avatarGradient: AVATAR_GRADIENTS[Math.floor(Math.random() * AVATAR_GRADIENTS.length)] };
    const updated = mergeReviews(list, [newR]);
    setList(updated);
    const ni = updated.findIndex(x => x.quote.trim().toLowerCase() === newR.quote.trim().toLowerCase());
    if (ni !== -1) setActiveIndex(ni);
    const local = localStorage.getItem("mstswap_local_reviews");
    let ll: Testimonial[] = [];
    if (local) { try { ll = JSON.parse(local); } catch (_) { } }
    ll.push(newR);
    localStorage.setItem("mstswap_local_reviews", JSON.stringify(ll));
    if (GOOGLE_SHEETS_URL) { try { await fetch(GOOGLE_SHEETS_URL, { method: "POST", mode: "no-cors", headers: { "Content-Type": "application/json" }, body: JSON.stringify(newR) }); } catch (_) { } }
    setIsSubmitting(false);
    setSubmitSuccess(true);
    setTimeout(() => { setFormData({ name: "", handle: "", role: "", quote: "", rating: 5 }); setSubmitSuccess(false); setIsFormOpen(false); }, 2000);
  };

  const visibleIndices = getVisibleIndices(activeIndex, list.length);

  return (
    <section className={`relative py-28 overflow-hidden border-b transition-colors duration-300 bg-transparent ${isDark ? "text-white border-zinc-900" : "text-zinc-900 border-zinc-200"}`}>
      <div className="max-w-[1200px] mx-auto px-6 relative z-10">

        {/* Heading */}
        <div className="text-center mb-16">
          {/* <motion.p initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.4 }} className={`text-xs font-semibold tracking-[0.18em] uppercase mb-4 ${isDark ? "text-zinc-500" : "text-zinc-400"}`}>
            From the community
          </motion.p> */}
          <motion.h2 initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.05 }} className={`text-[32px] md:text-[40px] lg:text-[48px] font-extrabold font-sans tracking-[-0.04em] leading-[1.15] ${isDark ? "text-zinc-50" : "text-zinc-900"}`}>
            Trusted by Traders
            <br />
            <span className={isDark ? "text-zinc-500" : "text-zinc-400"}>Worldwide</span>
          </motion.h2>
        </div>

        {/* 3-card layout */}
        <div className="relative flex items-center gap-4 md:gap-6 justify-center min-h-[320px]">

          {/* Prev button */}
          <button onClick={handlePrev} aria-label="Previous"
            className={`shrink-0 p-2.5 rounded-full border transition-all duration-300 hover:scale-105 active:scale-95 ${isDark
              ? "border-zinc-700 bg-zinc-800 text-zinc-400 hover:border-zinc-600 hover:text-zinc-200"
              : "border-zinc-300 bg-white text-zinc-600 hover:border-zinc-400 hover:text-zinc-900 shadow-sm"
              }`}>
            <ChevronLeft size={18} />
          </button>

          {/* Cards */}
          <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
            {visibleIndices.map((idx) => {
              const t = list[idx];
              const isActive = idx === activeIndex;
              const accent = ACCENT_COLORS[t.avatarGradient] ?? ACCENT_COLORS["from-cyan-400 to-blue-500"];

              return (
                <motion.div
                  key={`${idx}-${activeIndex}`}
                  initial={{ opacity: 0, y: 16, scale: 0.97 }}
                  animate={{ opacity: isActive ? 1 : isDark ? 0.45 : 0.6, y: 0, scale: isActive ? 1 : 0.97 }}
                  transition={{ type: "spring", stiffness: 200, damping: 24 }}
                  onClick={() => !isActive && setActiveIndex(idx)}
                  className={`relative rounded-2xl border overflow-hidden cursor-pointer transition-all duration-300 ${isDark
                    ? `border-zinc-800/80 bg-zinc-950/90 backdrop-blur-md ${isActive ? "border-zinc-700/80" : "hover:opacity-70"}`
                    : `${isActive
                      ? "border-zinc-300 bg-white shadow-[0_4px_24px_rgba(0,0,0,0.1)]"
                      : "border-zinc-300 bg-zinc-50 shadow-[0_2px_10px_rgba(0,0,0,0.06)] hover:opacity-80"
                    }`
                    }`}
                  style={isActive ? {
                    boxShadow: isDark
                      ? `0 0 0 1px ${accent.glow}, 0 20px 48px -8px ${accent.glow}`
                      : `0 0 0 1px ${accent.glow}, 0 20px 48px -8px ${accent.glow}, 0 4px 24px rgba(0,0,0,0.08)`
                  } : undefined}
                >
                  {/* Left accent bar */}
                  {isActive && <div className={`absolute left-0 top-4 bottom-4 w-[3px] rounded-full ${accent.bar}`} />}

                  <div className="p-6 md:p-7 flex flex-col gap-5">
                    {/* Stars */}
                    <div className="flex gap-0.5 text-amber-400">
                      {Array.from({ length: t.rating }).map((_, i) => <Star key={i} size={13} fill="currentColor" />)}
                    </div>

                    {/* Quote */}
                    <p className={`text-[14px] leading-relaxed font-sans line-clamp-4 ${isDark
                      ? isActive ? "text-zinc-200" : "text-zinc-400"
                      : isActive ? "text-zinc-700" : "text-zinc-500"
                      }`}>
                      "{t.quote}"
                    </p>

                    {/* Divider */}
                    <div className={`h-px ${isDark ? "bg-zinc-800" : "bg-zinc-200"}`} />

                    {/* Author */}
                    <div className="flex items-center gap-3">
                      {/* Avatar — light mode uses zinc-100 inner bg so initials are readable */}
                      <div className={`h-10 w-10 rounded-full bg-gradient-to-br ${t.avatarGradient} p-[1.5px] shrink-0`}>
                        <div className={`h-full w-full rounded-full flex items-center justify-center font-bold text-[11px] tracking-wider ${isDark ? "bg-zinc-900 text-zinc-100" : "bg-zinc-100 text-zinc-800"}`}>
                          {t.initials}
                        </div>
                      </div>
                      <div className="min-w-0">
                        <p className={`text-sm font-bold font-sans truncate ${isDark ? "text-zinc-100" : "text-zinc-800"}`}>{t.name}</p>
                        <p className={`text-[11px] font-mono truncate ${isDark ? accent.textDark : accent.textLight}`}>{t.handle}</p>
                        <p className={`text-[11px] truncate mt-0.5 ${isDark ? "text-zinc-500" : "text-zinc-500"}`}>{t.role}</p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Next button */}
          <button onClick={handleNext} aria-label="Next"
            className={`shrink-0 p-2.5 rounded-full border transition-all duration-300 hover:scale-105 active:scale-95 ${isDark
              ? "border-zinc-700 bg-zinc-800 text-zinc-400 hover:border-zinc-600 hover:text-zinc-200"
              : "border-zinc-300 bg-white text-zinc-600 hover:border-zinc-400 hover:text-zinc-900 shadow-sm"
              }`}>
            <ChevronRight size={18} />
          </button>
        </div>

        {/* Progress track */}
        <div className="mt-10 flex justify-center items-center gap-3">
          <span className={`text-xs font-mono tabular-nums ${isDark ? "text-zinc-600" : "text-zinc-400"}`}>{String(activeIndex + 1).padStart(2, "0")}</span>
          <div className={`relative h-[2px] w-40 rounded-full overflow-hidden ${isDark ? "bg-zinc-800" : "bg-zinc-300"}`}>
            <motion.div className="absolute left-0 top-0 h-full bg-gradient-to-r from-cyan-500 to-indigo-500 rounded-full" animate={{ width: `${((activeIndex + 1) / list.length) * 100}%` }} transition={{ type: "spring", stiffness: 120, damping: 20 }} />
          </div>
          <span className={`text-xs font-mono tabular-nums ${isDark ? "text-zinc-600" : "text-zinc-400"}`}>{String(list.length).padStart(2, "0")}</span>
        </div>

        {/* Dots */}
        <div className="flex justify-center gap-1.5 mt-4">
          {list.map((_, i) => (
            <button key={i} onClick={() => setActiveIndex(i)}
              className={`h-1.5 rounded-full transition-all duration-300 ${i === activeIndex ? "w-6 bg-cyan-500" : isDark ? "w-1.5 bg-zinc-700 hover:bg-zinc-600" : "w-1.5 bg-zinc-400 hover:bg-zinc-500"}`}
              aria-label={`Go to ${i + 1}`} />
          ))}
        </div>

        {/* Share button */}
        <div className="mt-10 flex justify-center">
          <button onClick={() => setIsFormOpen(!isFormOpen)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl border transition-all duration-300 text-xs font-semibold ${isDark
              ? "border-zinc-800 bg-zinc-900/80 text-zinc-400 hover:text-cyan-400 hover:border-cyan-900"
              : "border-zinc-300 bg-white text-zinc-600 hover:text-cyan-600 hover:border-cyan-300 shadow-sm"
              }`}>
            <Plus size={13} className={`transition-transform duration-300 ${isFormOpen ? "rotate-45" : ""}`} />
            {isFormOpen ? "Close form" : "Share your experience"}
          </button>
        </div>

        {/* Review form */}
        <AnimatePresence>
          {isFormOpen && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.3 }} className="overflow-hidden mt-6">
              <form onSubmit={handleSubmit}
                className={`w-full max-w-[560px] mx-auto rounded-2xl border p-6 flex flex-col gap-4 text-left ${isDark ? "border-zinc-800 bg-zinc-900/60 backdrop-blur-sm" : "border-zinc-300 bg-white shadow-[0_4px_20px_rgba(0,0,0,0.07)]"}`}>

                <div className="flex items-center justify-between">
                  <h3 className={`text-base font-bold font-sans ${isDark ? "text-zinc-100" : "text-zinc-900"}`}>Write a review</h3>
                  <div className="flex items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map(star => (
                      <button key={star} type="button" onClick={() => setFormData({ ...formData, rating: star })}>
                        <Star size={16} fill={star <= formData.rating ? "#fbbf24" : "transparent"} className={star <= formData.rating ? "text-amber-400" : isDark ? "text-zinc-700" : "text-zinc-300"} />
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {[
                    { label: "Full Name", key: "name", placeholder: "Your name", type: "text", req: true },
                    { label: "Handle", key: "handle", placeholder: "@twitter", type: "text", req: true },
                    { label: "Role", key: "role", placeholder: "DeFi Trader", type: "text", req: true },
                  ].map(({ label, key, placeholder, type, req }) => (
                    <div key={key} className="flex flex-col gap-1">
                      <label className={`text-[10px] font-semibold uppercase tracking-wider ${isDark ? "text-zinc-500" : "text-zinc-500"}`}>{label}</label>
                      <input type={type} required={req} value={(formData as any)[key]} onChange={e => setFormData({ ...formData, [key]: e.target.value })} placeholder={placeholder}
                        className={`px-3 py-2 rounded-lg border text-xs focus:outline-none focus:border-cyan-500 transition-colors ${isDark ? "border-zinc-800 bg-zinc-950/80 text-zinc-100 placeholder:text-zinc-700" : "border-zinc-300 bg-white text-zinc-800 placeholder:text-zinc-400 shadow-sm"}`} />
                    </div>
                  ))}
                </div>

                <div className="flex flex-col gap-1">
                  <label className={`text-[10px] font-semibold uppercase tracking-wider ${isDark ? "text-zinc-500" : "text-zinc-500"}`}>Your review</label>
                  <textarea required value={formData.quote} onChange={e => setFormData({ ...formData, quote: e.target.value })} placeholder="Share your experience..." rows={3}
                    className={`px-3 py-2.5 rounded-lg border text-xs focus:outline-none focus:border-cyan-500 transition-colors resize-none ${isDark ? "border-zinc-800 bg-zinc-950/80 text-zinc-100 placeholder:text-zinc-700" : "border-zinc-300 bg-white text-zinc-800 placeholder:text-zinc-400 shadow-sm"}`} />
                </div>

                <button type="submit" disabled={isSubmitting}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-500 text-white font-semibold text-xs shadow-sm hover:brightness-110 hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                  {isSubmitting ? "Submitting..." : submitSuccess ? <><Check size={14} /> Submitted!</> : <><Send size={13} /> Submit review</>}
                </button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}