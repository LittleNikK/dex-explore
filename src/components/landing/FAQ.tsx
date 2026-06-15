import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus } from "lucide-react";
import { useThemeStore } from "../../store/themeStore";

interface FAQItem {
  question: string;
  answer: string;
}

export default function FAQ() {
  const { theme } = useThemeStore();
  const isDark = theme === "dark";
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const faqs: FAQItem[] = [
    {
      question: "What is MSTSwap?",
      answer:
        "MSTSwap is a next-generation decentralized exchange aggregator built to query and optimize trading paths across multiple liquidity sources simultaneously — delivering the best possible rates, low fees, and secure non-custodial execution.",
    },
    {
      question: "How does swapping work?",
      answer:
        "When you execute a trade, our smart aggregator analyzes pricing across all connected pools and splits your order into optimal fractions (e.g. 60% via V3, 40% via V2) in a single transaction — minimizing price impact and slippage automatically.",
    },
    {
      question: "Is MSTSwap secure?",
      answer:
        "Yes. MSTSwap is fully non-custodial — you retain complete custody of your keys and funds at all times. Our smart contracts are independently audited, immutable, and transparently verified on-chain. We never touch your assets.",
    },
    {
      question: "Which wallets are supported?",
      answer:
        "We natively support MetaMask and all major browser extension wallets, plus WalletConnect v2 which bridges to hundreds of mobile wallets including Trust Wallet, Rainbow, and Ledger Live.",
    },
    {
      question: "What networks are available?",
      answer:
        "MSTSwap currently runs on the MST Testnet. Our cross-chain roadmap includes Ethereum Mainnet, BNB Chain, Polygon, Arbitrum, Optimism, and Base — each with native liquidity aggregation.",
    },
    {
      question: "How are fees calculated?",
      answer:
        "You only pay standard network gas costs plus minimal protocol fees, both shown transparently before you confirm. Our routing engine also factors gas into route selection — so a cheaper route is never sacrificed for a marginally better price.",
    },
  ];

  const toggleFAQ = (index: number) =>
    setOpenIndex((prev) => (prev === index ? null : index));

  return (
    <section
      className={`relative py-28 overflow-hidden border-b transition-colors duration-300 bg-transparent ${isDark
        ? "text-white border-zinc-900"
        : "text-zinc-900 border-zinc-200/50"
        }`}
    >
      <div className={`max-w-[1100px] mx-auto px-8 md:px-12 py-16 rounded-3xl relative z-20 border transition-all duration-300 backdrop-blur-md ${isDark
        ? "bg-zinc-950/95 border-zinc-900 shadow-[0_20px_50px_rgba(0,0,0,0.3)]"
        : "bg-white/95 border-zinc-200/50 shadow-[0_20px_50px_rgba(0,0,0,0.04)]"
        }`}>
        {/* ── Two-column layout: sticky heading left, accordion right ── */}
        <div className="flex flex-col lg:flex-row gap-16 lg:gap-24">

          {/* Left: heading block */}
          <div className="lg:w-[300px] shrink-0 lg:pt-1">
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4 }}
              className={`text-xs font-semibold tracking-[0.18em] uppercase mb-4 ${isDark ? "text-zinc-500" : "text-zinc-400"
                }`}
            >
              Common questions
            </motion.p>

            <motion.h2
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.05 }}
              className={`text-[32px] md:text-[40px] lg:text-[48px] font-extrabold font-sans tracking-[-0.04em] leading-[1.15] mb-6 ${isDark ? "text-zinc-50" : "text-zinc-900"
                }`}
            >
              Questions,
              <br />
              <span className={isDark ? "text-zinc-500" : "text-zinc-400"}>
                answered.
              </span>
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className={`text-sm leading-relaxed ${isDark ? "text-zinc-500" : "text-zinc-500"
                }`}
            >
              Everything you need to know about routing, security, wallets, and
              fees
            </motion.p>


          </div>

          {/* Right: accordion — unified container with dividers */}
          <div className="flex-1">
            {/* Top border of the whole block */}
            <div
              className={`h-px w-full mb-0 ${isDark ? "bg-zinc-800" : "bg-zinc-200"
                }`}
            />

            {faqs.map((faq, index) => {
              const isOpen = openIndex === index;
              const num = String(index + 1).padStart(2, "0");

              return (
                <motion.div
                  key={faq.question}
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-40px" }}
                  transition={{
                    duration: 0.4,
                    delay: index * 0.05,
                  }}
                >
                  {/* Trigger row */}
                  <button
                    onClick={() => toggleFAQ(index)}
                    className={`group w-full flex items-start gap-5 py-6 text-left transition-colors duration-200 ${isDark ? "hover:text-zinc-100" : "hover:text-zinc-900"
                      }`}
                    aria-expanded={isOpen}
                  >
                    {/* Sequential number */}
                    <span
                      className={`shrink-0 text-xs font-bold font-sans mt-[3px] transition-colors duration-200 ${isOpen
                        ? "text-cyan-500"
                        : isDark
                          ? "text-zinc-600"
                          : "text-zinc-400"
                        }`}
                    >
                      {num}
                    </span>

                    {/* Question text */}
                    <span
                      className={`flex-1 text-[15px] font-bold font-sans tracking-[-0.04em] leading-[1.15] transition-colors duration-200 ${isOpen
                        ? isDark
                          ? "text-zinc-100"
                          : "text-zinc-900"
                        : isDark
                          ? "text-zinc-300"
                          : "text-zinc-700"
                        }`}
                    >
                      {faq.question}
                    </span>

                    {/* Plus / X indicator */}
                    <motion.div
                      animate={{ rotate: isOpen ? 45 : 0 }}
                      transition={{ duration: 0.25, ease: "easeInOut" }}
                      className={`shrink-0 mt-[2px] transition-colors duration-200 ${isOpen
                        ? "text-cyan-500"
                        : isDark
                          ? "text-zinc-600 group-hover:text-zinc-400"
                          : "text-zinc-400 group-hover:text-zinc-600"
                        }`}
                    >
                      <Plus size={16} />
                    </motion.div>
                  </button>

                  {/* Answer panel */}
                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.28, ease: "easeInOut" }}
                        className="overflow-hidden"
                      >
                        {/* Left cyan accent bar + answer text */}
                        <motion.div
                          initial={{ x: -6, opacity: 0 }}
                          animate={{ x: 0, opacity: 1 }}
                          exit={{ x: -6, opacity: 0 }}
                          transition={{ duration: 0.22, delay: 0.06 }}
                          className="flex gap-5 pb-6"
                        >
                          {/* Accent bar aligned under the number */}
                          <div className="shrink-0 w-[2px] ml-[9px] rounded-full bg-cyan-500/60 self-stretch" />

                          <p
                            className={`text-[14px] leading-[1.75] font-sans ${isDark ? "text-zinc-400" : "text-zinc-600"
                              }`}
                          >
                            {faq.answer}
                          </p>
                        </motion.div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Hairline divider */}
                  <div
                    className={`h-px w-full transition-colors duration-200 ${isOpen
                      ? isDark
                        ? "bg-zinc-700/70"
                        : "bg-zinc-300/80"
                      : isDark
                        ? "bg-zinc-800"
                        : "bg-zinc-200"
                      }`}
                  />
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}