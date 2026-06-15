import { motion, useMotionValue, useTransform, useSpring } from "framer-motion";
import { useThemeStore } from "../../store/themeStore";
import { useRef, MouseEvent } from "react";

interface FeatureConfig {
  icon: React.ReactNode;
  title: string;
  description: string;
  accentLight: string;
  accentDark: string;
  glowLight: string;
  glowDark: string;
  borderHoverLight: string;
  borderHoverDark: string;
  iconBgLight: string;
  iconBgDark: string;
  iconRingLight: string;
}

function TiltCard({ children, className }: { children: React.ReactNode; className?: string }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const rotateX = useSpring(useTransform(y, [-0.5, 0.5], [6, -6]), { stiffness: 300, damping: 30 });
  const rotateY = useSpring(useTransform(x, [-0.5, 0.5], [-6, 6]), { stiffness: 300, damping: 30 });

  function handleMouseMove(e: MouseEvent<HTMLDivElement>) {
    const rect = cardRef.current?.getBoundingClientRect();
    if (!rect) return;
    x.set((e.clientX - rect.left) / rect.width - 0.5);
    y.set((e.clientY - rect.top) / rect.height - 0.5);
  }

  function handleMouseLeave() { x.set(0); y.set(0); }

  return (
    <motion.div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ rotateX, rotateY, transformStyle: "preserve-3d", perspective: 800 }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export default function Features() {
  const { theme } = useThemeStore();
  const isDark = theme === "dark";

  const features: FeatureConfig[] = [
    {
      icon: <img src="/Best Price.png" alt="Best Prices" className="w-6 h-6 object-contain" />,
      title: "Best Prices",
      description: "Aggregates liquidity sources across various decentralized protocols to deliver the most competitive swap rates automatically.",
      accentLight: "text-cyan-700",
      accentDark: "text-cyan-400",
      glowLight: "rgba(6,182,212,0.2)",
      glowDark: "rgba(6,182,212,0.35)",
      borderHoverLight: "group-hover:border-cyan-400/70",
      borderHoverDark: "group-hover:border-cyan-500/50",
      iconBgLight: "bg-cyan-100",
      iconBgDark: "bg-cyan-950/60 group-hover:bg-cyan-900/60",
      iconRingLight: "ring-2 ring-cyan-200/80",
    },
    {
      icon: <img src="/Deep Liquidity.png" alt="Deep Liquidity" className="w-6 h-6 object-contain" />,
      title: "Deep Liquidity",
      description: "Tap into massive, combined liquidity reserves instantly. Perform large trades with minimal price slippage.",
      accentLight: "text-indigo-700",
      accentDark: "text-indigo-400",
      glowLight: "rgba(99,102,241,0.2)",
      glowDark: "rgba(99,102,241,0.35)",
      borderHoverLight: "group-hover:border-indigo-400/70",
      borderHoverDark: "group-hover:border-indigo-500/50",
      iconBgLight: "bg-indigo-100",
      iconBgDark: "bg-indigo-950/60 group-hover:bg-indigo-900/60",
      iconRingLight: "ring-2 ring-indigo-200/80",
    },
    {
      icon: <img src="/Non Custodial.png" alt="Non-Custodial" className="w-6 h-6 object-contain" />,
      title: "Non-Custodial",
      description: "Retain 100% custody and absolute control of your digital funds. Your keys, your crypto — always trade directly from your wallet.",
      accentLight: "text-violet-700",
      accentDark: "text-violet-400",
      glowLight: "rgba(139,92,246,0.2)",
      glowDark: "rgba(139,92,246,0.35)",
      borderHoverLight: "group-hover:border-violet-400/70",
      borderHoverDark: "group-hover:border-violet-500/50",
      iconBgLight: "bg-violet-100",
      iconBgDark: "bg-violet-950/60 group-hover:bg-violet-900/60",
      iconRingLight: "ring-2 ring-violet-200/80",
    },
    {
      icon: <img src="/Fast execution2.png" alt="Fast Execution" className="w-6 h-6 object-contain" />,
      title: "Fast Execution",
      description: "Engineered with optimized routing pathways, enabling lightning-fast confirmation times and near-instant trade completion.",
      accentLight: "text-fuchsia-700",
      accentDark: "text-fuchsia-400",
      glowLight: "rgba(217,70,239,0.2)",
      glowDark: "rgba(217,70,239,0.35)",
      borderHoverLight: "group-hover:border-fuchsia-400/70",
      borderHoverDark: "group-hover:border-fuchsia-500/50",
      iconBgLight: "bg-fuchsia-100",
      iconBgDark: "bg-fuchsia-950/60 group-hover:bg-fuchsia-900/60",
      iconRingLight: "ring-2 ring-fuchsia-200/80",
    },
    {
      icon: <img src="/Secure Protocol.png" alt="Secure Protocol" className="w-6 h-6 object-contain" />,
      title: "Secure Protocol",
      description: "Fully powered by robust, audited, and immutable smart contracts — offering completely decentralized execution with zero trust requirements.",
      accentLight: "text-emerald-700",
      accentDark: "text-emerald-400",
      glowLight: "rgba(16,185,129,0.2)",
      glowDark: "rgba(16,185,129,0.35)",
      borderHoverLight: "group-hover:border-emerald-400/70",
      borderHoverDark: "group-hover:border-emerald-500/50",
      iconBgLight: "bg-emerald-100",
      iconBgDark: "bg-emerald-950/60 group-hover:bg-emerald-900/60",
      iconRingLight: "ring-2 ring-emerald-200/80",
    },
    {
      icon: <img src="/low fees.png" alt="Low Fees" className="w-9 h-9 object-contain" />,
      title: "Low Fees",
      description: "Save on gas and trading friction with optimized contract interactions and intelligent multi-split gas routing engines.",
      accentLight: "text-amber-700",
      accentDark: "text-amber-400",
      glowLight: "rgba(245,158,11,0.2)",
      glowDark: "rgba(245,158,11,0.35)",
      borderHoverLight: "group-hover:border-amber-400/70",
      borderHoverDark: "group-hover:border-amber-500/50",
      iconBgLight: "bg-amber-100",
      iconBgDark: "bg-amber-950/60 group-hover:bg-amber-900/60",
      iconRingLight: "ring-2 ring-amber-200/80",
    },
  ];

  const containerVariants = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.08 } },
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 24 },
    visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 90, damping: 18 } },
  };

  return (
    <section className={`relative py-28 overflow-hidden transition-colors duration-300 bg-transparent ${isDark ? "text-white" : "text-zinc-900"}`}>
      <div className="max-w-[1280px] mx-auto px-6 relative z-10">

        {/* Heading */}
        <div className="text-center max-w-2xl mx-auto mb-20">
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
            className={`text-[32px] md:text-[40px] lg:text-[48px] font-extrabold font-sans tracking-[-0.04em] leading-[1.15] transition-colors duration-300 ${isDark ? "text-zinc-50" : "text-zinc-900"}`}
          >
            Next Generation
            <br />
            <span className={isDark ? "text-zinc-400" : "text-zinc-400"}>
              Exchange Features
            </span>
          </motion.h2>
        </div>

        {/* Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
        >
          {features.map((feature) => (
            <motion.div key={feature.title} variants={cardVariants}>
              <TiltCard className="h-full">
                <div
                  className={`group relative h-full rounded-2xl border p-7 flex flex-col gap-5 cursor-pointer overflow-hidden transition-all duration-300
                    ${isDark
                      ? `border-zinc-800/80 bg-zinc-900/40 backdrop-blur-sm ${feature.borderHoverDark}`
                      : `border-zinc-300 bg-white shadow-[0_2px_12px_rgba(0,0,0,0.06)] ${feature.borderHoverLight}`
                    }
                  `}
                  style={{ transition: "border-color 0.3s, box-shadow 0.3s" }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLDivElement).style.boxShadow = isDark
                      ? `0 0 0 1px ${feature.glowDark}, 0 20px 40px -8px ${feature.glowDark}`
                      : `0 0 0 1px ${feature.glowLight}, 0 20px 40px -8px ${feature.glowLight}, 0 4px 16px rgba(0,0,0,0.08)`;
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLDivElement).style.boxShadow = isDark
                      ? "none"
                      : "0 2px 12px rgba(0,0,0,0.06)";
                  }}
                >
                  {/* Shimmer line top */}
                  <div
                    aria-hidden
                    className={`absolute top-0 left-0 right-0 h-px opacity-0 group-hover:opacity-100 transition-opacity duration-500
                      bg-gradient-to-r from-transparent via-current to-transparent
                      ${isDark ? feature.accentDark : feature.accentLight}
                    `}
                  />

                  {/* Icon */}
                  <div
                    className={`relative shrink-0 self-start h-11 w-11 rounded-xl flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:rotate-[8deg]
                      ${isDark
                        ? `${feature.iconBgDark} ${feature.accentDark}`
                        : `${feature.iconBgLight} ${feature.iconRingLight} ${feature.accentLight}`
                      }
                    `}
                  >
                    {feature.icon}
                  </div>

                  {/* Text */}
                  <div className="flex-1 flex flex-col">
                    <h3
                      className={`text-[17px] font-bold font-sans tracking-[-0.03em] leading-[1.2] mb-2 transition-colors duration-300
                        ${isDark ? "text-zinc-100" : "text-zinc-800"}
                      `}
                    >
                      {feature.title}
                    </h3>
                    <p
                      className={`text-[13.5px] leading-relaxed font-sans transition-colors duration-300
                        ${isDark ? "text-zinc-500" : "text-zinc-600"}
                      `}
                    >
                      {feature.description}
                    </p>
                  </div>
                </div>
              </TiltCard>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}