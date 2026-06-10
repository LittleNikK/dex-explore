import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, HelpCircle } from "lucide-react";

interface FAQItem {
  question: string;
  answer: string;
}

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const faqs: FAQItem[] = [
    {
      question: "What is MSTSwap?",
      answer: "MSTSwap is a next-generation decentralized exchange (DEX) aggregator built to query and optimize trading paths across multiple liquidity sources simultaneously, delivering the best possible rates, low fees, and secure execution."
    },
    {
      question: "How does swapping work?",
      answer: "When you execute a trade, our smart aggregator algorithm analyzes pricing across various pools. It splits your order into fractions (e.g. 60% via V3, 40% via V2) and routes it optimally in a single transaction, minimizing price impact and slippage."
    },
    {
      question: "Is MSTSwap secure?",
      answer: "Yes, security is our primary focus. MSTSwap operates in a completely non-custodial manner, meaning you retain full custody of your private keys and digital funds. Our smart contracts are audited, immutable, and transparently verified on-chain."
    },
    {
      question: "Which wallets are supported?",
      answer: "We natively support popular Web3 browser extension wallets like MetaMask, alongside WalletConnect which allows connections to hundreds of mobile wallets (such as Trust Wallet, Rainbow, and Ledger Live)."
    },
    {
      question: "What networks are available?",
      answer: "MSTSwap currently supports the MST Testnet ecosystem. Our cross-chain roadmap includes deployments and aggregation across Ethereum Mainnet, BNB Chain, Polygon, Arbitrum, Optimism, and Base."
    },
    {
      question: "How are fees calculated?",
      answer: "Our engine performs gas-estimation routing to ensure gas fees do not erode your trading gains. Swaps only incur standard block network gas costs and minimal protocol fees that are displayed transparently prior to confirmation."
    }
  ];

  const toggleFAQ = (index: number) => {
    setOpenIndex((prev) => (prev === index ? null : index));
  };

  return (
    <section className="relative py-28 overflow-hidden bg-white border-b border-zinc-100">
      {/* Background Accent Glow */}
      <div className="absolute top-[30%] left-1/2 -translate-x-1/2 w-[700px] h-[300px] bg-gradient-to-r from-cyan-50/20 via-indigo-50/15 to-violet-50/20 rounded-full blur-[100px] pointer-events-none z-0" />

      <div className="max-w-[850px] mx-auto px-6 relative z-10">
        
        {/* Section Heading */}
        <div className="text-center max-w-3xl mx-auto mb-20">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-[0.18em] mb-4 bg-cyan-50 text-cyan-600 border border-cyan-100/50">
            Got Questions?
          </span>
          <h2 className="text-4xl md:text-5xl font-black font-display tracking-[-0.03em] leading-[1.1] mb-5 text-zinc-900">
            Frequently Asked Questions
          </h2>
          <p className="text-base sm:text-lg font-sans text-zinc-500 max-w-xl mx-auto">
            Have questions about routing pools, wallet support, or fees? Explore our direct answers below.
          </p>
        </div>

        {/* Accordions Stack */}
        <div className="flex flex-col gap-4.5">
          {faqs.map((faq, index) => {
            const isOpen = openIndex === index;
            return (
              <div
                key={faq.question}
                className={`rounded-3xl transition-all duration-300 border-2 ${
                  isOpen
                    ? "bg-white border-zinc-950 shadow-[0_12px_30px_rgba(0,0,0,0.04)]"
                    : "bg-zinc-50/50 border-zinc-300 hover:border-zinc-400 hover:bg-zinc-50"
                }`}
              >
                {/* Accordion Trigger Header */}
                <button
                  onClick={() => toggleFAQ(index)}
                  className="w-full flex items-center justify-between p-6 text-left focus:outline-none"
                  aria-expanded={isOpen}
                >
                  <div className="flex items-center gap-4.5 pr-4">
                    <HelpCircle className={`w-5 h-5 shrink-0 transition-colors duration-300 ${
                      isOpen
                        ? "text-cyan-600"
                        : "text-zinc-400"
                    }`} />
                    <span className={`text-[15px] font-extrabold font-display transition-colors duration-300 ${
                      isOpen ? "text-zinc-950" : "text-zinc-850"
                    }`}>
                      {faq.question}
                    </span>
                  </div>
                  <motion.div
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ duration: 0.3 }}
                    className="text-zinc-400 shrink-0"
                  >
                    <ChevronDown size={18} />
                  </motion.div>
                </button>

                {/* Collapsible Content */}
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                      className="overflow-hidden"
                    >
                      <div className="px-6 pb-6 pt-0 text-[14px] leading-relaxed font-sans text-zinc-500 border-t border-zinc-100">
                        <div className="pt-4 text-zinc-600">
                          {faq.answer}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
