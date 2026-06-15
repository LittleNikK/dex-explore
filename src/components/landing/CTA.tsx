import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Zap, Shield } from "lucide-react";
import { useThemeStore } from "../../store/themeStore";

export default function CTA() {
  const { theme } = useThemeStore();
  const isDark = theme === "dark";

  const stats = [
    { icon: <Zap size={13} />, label: "Instant execution" },
    { icon: <Shield size={13} />, label: "Non-custodial" },
  ];

  // Grid line animation — 5 expanding rings
  const rings = [0, 1, 2, 3, 4];

  return (
    <section
      className={`relative py-28 px-6 overflow-hidden transition-colors duration-300 ${isDark ? "bg-zinc-950 text-white" : "bg-zinc-950 text-white"
        }`}
    >
      {/* ── Background: dot grid on dark ── */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-0"
        style={{
          backgroundImage:
            "radial-gradient(circle, rgba(255,255,255,0.04) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />

      {/* ── Animated expanding rings from center ── */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-0 flex items-center justify-center overflow-hidden"
      >
        {rings.map((i) => (
          <motion.div
            key={i}
            className="absolute rounded-full border border-cyan-500/[0.07]"
            initial={{ width: 80, height: 80, opacity: 0.6 }}
            animate={{
              width: [80 + i * 140, 160 + i * 200],
              height: [80 + i * 140, 160 + i * 200],
              opacity: [0.5, 0],
            }}
            transition={{
              duration: 4,
              delay: i * 0.8,
              repeat: Infinity,
              ease: "easeOut",
            }}
          />
        ))}
      </div>

      {/* ── Center glow ── */}
      <div
        aria-hidden
        className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] rounded-full blur-[120px] z-0"
        style={{
          background:
            "radial-gradient(ellipse, rgba(6,182,212,0.08) 0%, rgba(99,102,241,0.06) 50%, transparent 100%)",
        }}
      />

      <div className="max-w-[1100px] mx-auto relative z-10">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-12 lg:gap-16">

          {/* ── Left: heading block ── */}
          <div className="flex-1 max-w-2xl">

            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.55, delay: 0.05 }}
              className="text-[32px] md:text-[40px] lg:text-[48px] font-extrabold font-sans tracking-[-0.04em] leading-[1.15] mb-0 text-white"
            >
              The smarter way
              <br />
              <span className="text-zinc-500">to swap tokens.</span>
            </motion.h2>
          </div>

          {/* ── Right: description + CTAs + trust pills ── */}
          <div className="lg:max-w-[380px] flex flex-col gap-7">
            <motion.p
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45, delay: 0.1 }}
              className="text-sm leading-[1.75] text-zinc-400"
            >
              Deep multi-chain liquidity, optimal routing paths, lower gas
              costs, and fully secure peer-to-contract execution — all in one
              place.
            </motion.p>

            {/* CTA buttons */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45, delay: 0.15 }}
              className="flex flex-col sm:flex-row items-center gap-3"
            >
              {/* Primary */}
              <Link
                to="/swap"
                className="blob-btn blob-btn-lg group"
              >
                Launch App
                <ArrowRight
                  size={15}
                  className="ml-2 relative z-10 transition-transform duration-200 group-hover:translate-x-0.5"
                />
                <span className="blob-btn__inner">
                  <span className="blob-btn__blobs">
                    <span className="blob-btn__blob"></span>
                    <span className="blob-btn__blob"></span>
                    <span className="blob-btn__blob"></span>
                    <span className="blob-btn__blob"></span>
                  </span>
                </span>
              </Link>

              {/* Secondary */}
              <Link
                to="/docs"
                className="btn-slice"
              >
                <div className="top"><span>Read the docs</span></div>
                <div className="bottom"><span>Read the docs</span></div>
              </Link>
            </motion.div>

            {/* Trust signal pills */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.22 }}
              className="flex flex-wrap gap-2"
            >
              {stats.map((s) => (
                <span
                  key={s.label}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-zinc-800 bg-zinc-900/60 text-zinc-400 text-[11px] font-medium"
                >
                  <span className="text-cyan-500">{s.icon}</span>
                  {s.label}
                </span>
              ))}
            </motion.div>
          </div>
        </div>

        {/* ── Full-width hairline divider with label ── */}
        <motion.div
          initial={{ scaleX: 0, opacity: 0 }}
          whileInView={{ scaleX: 1, opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.3, ease: "easeOut" }}
          className="mt-16 h-px bg-gradient-to-r from-transparent via-zinc-700 to-transparent origin-left"
        />
      </div>
    </section>
  );
}