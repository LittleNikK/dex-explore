import { motion } from "framer-motion";
import { Sparkles, Layers, KeyRound, Zap, ShieldCheck, CircleDollarSign } from "lucide-react";

interface FeatureConfig {
  icon: React.ReactNode;
  title: string;
  description: string;
  gradient: string;
  borderColor: string;
  textColor: string;
}

export default function Features() {
  const features: FeatureConfig[] = [
    {
      icon: <Sparkles className="w-5 h-5" />,
      title: "Best Prices",
      description: "Aggregates liquidity sources across various decentralized protocols to deliver the most competitive swap rates automatically.",
      gradient: "from-cyan-600 to-blue-600",
      borderColor: "group-hover:border-cyan-500/30",
      textColor: "text-cyan-600"
    },
    {
      icon: <Layers className="w-5 h-5" />,
      title: "Deep Liquidity",
      description: "Tap into massive, combined liquidity reserves instantly. Perform large trades with minimal price slippage.",
      gradient: "from-blue-600 to-indigo-600",
      borderColor: "group-hover:border-blue-500/30",
      textColor: "text-blue-600"
    },
    {
      icon: <KeyRound className="w-5 h-5" />,
      title: "Non-Custodial",
      description: "Retain 100% custody and absolute control of your digital funds. Your keys, your crypto, always trade directly from your wallet.",
      gradient: "from-violet-600 to-fuchsia-600",
      borderColor: "group-hover:border-violet-500/30",
      textColor: "text-violet-600"
    },
    {
      icon: <Zap className="w-5 h-5" />,
      title: "Fast Execution",
      description: "Engineered with optimized routing pathways, enabling lightning-fast confirmation times and near-instant trade completion.",
      gradient: "from-fuchsia-600 to-pink-600",
      borderColor: "group-hover:border-fuchsia-500/30",
      textColor: "text-fuchsia-600"
    },
    {
      icon: <ShieldCheck className="w-5 h-5" />,
      title: "Secure Protocol",
      description: "Fully powered by robust, audited, and immutable smart contracts, offering completely decentralized execution with zero trust requirements.",
      gradient: "from-emerald-600 to-cyan-600",
      borderColor: "group-hover:border-emerald-500/30",
      textColor: "text-emerald-600"
    },
    {
      icon: <CircleDollarSign className="w-5 h-5" />,
      title: "Low Fees",
      description: "Save on gas and trading friction with optimized contract interactions and intelligent multi-split gas routing engines.",
      gradient: "from-amber-600 to-orange-600",
      borderColor: "group-hover:border-amber-400/30",
      textColor: "text-amber-600"
    }
  ];

  // Container variants for stagger animation
  const containerVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.06
      }
    }
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 30, scale: 0.97 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 20
      }
    }
  };

  return (
    <section className="relative py-28 overflow-hidden bg-white">
      {/* Subtle section connector layout lighting */}
      <div className="absolute top-[20%] left-1/2 -translate-x-1/2 w-[800px] h-[350px] bg-gradient-to-r from-blue-50/30 via-indigo-50/20 to-cyan-50/30 rounded-full blur-[120px] pointer-events-none z-0" />

      <div className="max-w-[1280px] mx-auto px-6 relative z-10">
        
        {/* Section Heading */}
        <div className="text-center max-w-3xl mx-auto mb-20">
          <motion.h2
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl md:text-5xl font-black font-display tracking-[-0.03em] leading-[1.1] mb-5 text-zinc-900"
          >
            Next Generation Exchange Features
          </motion.h2>
        </div>

        {/* Feature Cards Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
        >
          {features.map((feature) => (
            <motion.div
              key={feature.title}
              variants={cardVariants}
              whileHover={{ y: -6, scale: 1.015 }}
              className="group relative rounded-3xl border border-zinc-200/80 bg-zinc-50/30 p-8 flex flex-col gap-6 transition-all duration-500 hover:bg-white hover:border-zinc-300/80 hover:shadow-[0_20px_50px_rgba(0,0,0,0.05)] cursor-pointer overflow-hidden"
            >
              {/* Subtle accent color backdrop flare inside the card on hover */}
              <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-[0.02] transition-opacity duration-500 rounded-3xl pointer-events-none`} />

              {/* Glowing Icon Frame */}
              <div className="relative shrink-0 self-start">
                {/* Backing color aura behind the icon frame on hover */}
                <div className={`absolute -inset-1 rounded-2xl bg-gradient-to-r ${feature.gradient} opacity-0 group-hover:opacity-30 blur-md transition-opacity duration-500 pointer-events-none`} />

                <div className={`relative h-12 w-12 rounded-2xl bg-gradient-to-r ${feature.gradient} p-[1px] flex items-center justify-center text-white`}>
                  <div className="h-full w-full rounded-[15px] bg-white flex items-center justify-center transition-all duration-500 group-hover:bg-zinc-50">
                    <span className={`${feature.textColor} transition-transform duration-300 group-hover:scale-110 flex items-center justify-center`}>
                      {feature.icon}
                    </span>
                  </div>
                </div>
              </div>

              {/* Text Area */}
              <div className="relative z-10 flex-1 flex flex-col">
                <h3 className="text-xl font-bold font-display tracking-tight mb-2.5 text-zinc-900 group-hover:text-cyan-600 transition-colors duration-300">
                  {feature.title}
                </h3>
                <p className="text-[14px] leading-relaxed font-sans text-zinc-500 group-hover:text-zinc-600 transition-colors duration-300">
                  {feature.description}
                </p>
              </div>

            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
