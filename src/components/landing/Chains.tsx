import { motion } from "framer-motion";
import { useThemeStore } from "../../store/themeStore";

interface ChainConfig {
  name: string;
  color: string;
  glow: string;
  tagline: string;
  svg: React.ReactNode;
}

export default function Chains() {
  const { theme } = useThemeStore();
  const isDark = theme === "dark";

  const chains: ChainConfig[] = [
    {
      name: "Ethereum",
      color: "#627EEA",
      glow: "rgba(98, 126, 234, 0.15)",
      tagline: "Primary Layer 1",
      svg: (
        <svg className="w-8 h-8" viewBox="0 0 784 1277" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M392 0L383.5 28.5V870.5L392 879L784 647.5L392 0Z" fill="#8C8C8C"/>
          <path d="M392 0L0 647.5L392 879V470V0Z" fill="#3C3C3D"/>
          <path d="M392 956L387 962V1268.5L392 1277L784 724.5L392 956Z" fill="#8C8C8C"/>
          <path d="M392 1277V956L0 724.5L392 1277Z" fill="#3C3C3D"/>
          <path d="M392 879L784 647.5L392 470V879Z" fill="#E0E0E0"/>
          <path d="M0 647.5L392 879V470L0 647.5Z" fill="#1C1C1D"/>
        </svg>
      )
    },
    {
      name: "BNB Chain",
      color: "#F0B90B",
      glow: "rgba(240, 185, 11, 0.15)",
      tagline: "Low Fee Swap",
      svg: (
        <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2L6.5 7.5L9.25 10.25L12 7.5L14.75 10.25L17.5 7.5L12 2Z" fill="#F0B90B"/>
          <path d="M2 12L7.5 17.5L10.25 14.75L7.5 12L10.25 9.25L7.5 6.5L2 12Z" fill="#F0B90B"/>
          <path d="M12 22L17.5 16.5L14.75 13.75L12 16.5L9.25 13.75L6.5 16.5L12 22Z" fill="#F0B90B"/>
          <path d="M22 12L16.5 6.5L13.75 9.25L16.5 12L13.75 14.75L16.5 17.5L22 12Z" fill="#F0B90B"/>
          <path d="M12 14.5L14.5 12L12 9.5L9.5 12L12 14.5Z" fill="#F0B90B"/>
        </svg>
      )
    },
    {
      name: "Arbitrum",
      color: "#28A0F0",
      glow: "rgba(40, 160, 240, 0.15)",
      tagline: "Fast Rollup",
      svg: (
        <svg className="w-8 h-8" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M50 5L5 83.04H95L50 5ZM50 24.28L80.12 76.5H19.88L50 24.28Z" fill="#28A0F0"/>
          <path d="M50 37.35L68.83 70H31.17L50 37.35Z" fill="#12AAFF"/>
          <circle cx="50" cy="70" r="8" fill="#FFFFFF"/>
        </svg>
      )
    },
    {
      name: "Polygon",
      color: "#8247E5",
      glow: "rgba(130, 71, 229, 0.15)",
      tagline: "EVM Sidechain",
      svg: (
        <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path fillRule="evenodd" clipRule="evenodd" d="M16.5 4.5L19.5 6.25V9.75L16.5 11.5L13.5 9.75V6.25L16.5 4.5ZM7.5 12.5L10.5 14.25V17.75L7.5 19.5L4.5 17.75V14.25L7.5 12.5ZM16.5 12.5L19.5 14.25V17.75L16.5 19.5L13.5 17.75V14.25L16.5 12.5ZM7.5 4.5L10.5 6.25V9.75L7.5 11.5L4.5 9.75V6.25L7.5 4.5Z" fill="#8247E5"/>
          <path d="M12 9.5L13.5 10.37V12.13L12 13L10.5 12.13V10.37L12 9.5Z" fill="#9F70EC"/>
        </svg>
      )
    },
    {
      name: "Optimism",
      color: "#FF0420",
      glow: "rgba(255, 4, 32, 0.15)",
      tagline: "Optimistic Rollup",
      svg: (
        <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="12" cy="12" r="10" stroke="#FF0420" strokeWidth="2.5"/>
          <path d="M7 12C7 9.24 9.24 7 12 7C14.76 7 17 9.24 17 12C17 14.76 14.76 17 12 17C9.24 17 7 14.76 7 12ZM9.5 12C9.5 13.38 10.62 14.5 12 14.5C13.38 14.5 14.5 13.38 14.5 12C14.5 10.62 13.38 9.5 12 9.5C10.62 9.5 9.5 10.62 9.5 12Z" fill="#FF0420"/>
        </svg>
      )
    },
    {
      name: "Base",
      color: "#0052FF",
      glow: "rgba(0, 82, 255, 0.15)",
      tagline: "Coinbase Layer 2",
      svg: (
        <svg className="w-8 h-8" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="50" cy="50" r="45" fill="#0052FF"/>
          <path d="M50 15C30.67 15 15 30.67 15 50C15 69.33 30.67 85 50 85C69.33 85 85 69.33 85 50" stroke="#FFFFFF" strokeWidth="10" strokeLinecap="round"/>
        </svg>
      )
    }
  ];

  return (
    <section className="relative py-12 overflow-hidden border-t border-b border-white/[0.04] bg-zinc-950/20">
      <div className="max-w-[1280px] mx-auto px-6">
        
        {/* Section Heading */}
        <div className="text-center mb-10">
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className={`text-xs font-bold uppercase tracking-[0.2em] mb-2 ${
              isDark ? "text-zinc-500" : "text-zinc-400"
            }`}
          >
            Multi-Chain Routing Ecosystem
          </motion.p>
          <motion.h3
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className={`text-xl md:text-2xl font-bold font-display ${
              isDark ? "text-white" : "text-zinc-900"
            }`}
          >
            Supported Liquidity Hubs & Networks
          </motion.h3>
        </div>

        {/* Chains Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-5">
          {chains.map((chain, index) => (
            <motion.div
              key={chain.name}
              initial={{ opacity: 0, scale: 0.9, y: 15 }}
              whileInView={{ opacity: 1, scale: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.08, type: "spring", stiffness: 100 }}
              whileHover={{ y: -6, scale: 1.02 }}
              style={{
                shadow: `0 8px 30px ${chain.glow}`
              }}
              className={`glass rounded-2xl border p-5 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-300 relative group overflow-hidden ${
                isDark
                  ? "border-white/5 bg-zinc-900/40 hover:border-white/20 hover:bg-zinc-900/80"
                  : "border-zinc-200 bg-white/50 hover:border-zinc-300 hover:bg-white"
              }`}
            >
              {/* Inner glowing hover sphere */}
              <div
                className="absolute inset-0 -z-10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-2xl"
                style={{
                  background: `radial-gradient(circle at center, ${chain.color}33 0%, transparent 70%)`
                }}
              />

              {/* Logo container with scale effect */}
              <div className="mb-4 transform group-hover:scale-110 transition-transform duration-300 relative">
                {chain.svg}
              </div>

              {/* Chain Name */}
              <h4 className={`text-base font-bold font-display tracking-wide ${
                isDark ? "text-white group-hover:text-cyan-400" : "text-zinc-800 group-hover:text-cyan-600"
              } transition-colors duration-300`}>
                {chain.name}
              </h4>

              {/* Tagline */}
              <span className={`text-[10px] font-semibold uppercase mt-1 tracking-wider ${
                isDark ? "text-zinc-500 group-hover:text-zinc-300" : "text-zinc-400 group-hover:text-zinc-600"
              } transition-colors duration-300`}>
                {chain.tagline}
              </span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
