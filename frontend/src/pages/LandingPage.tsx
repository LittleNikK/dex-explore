import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { 
  ArrowRight, Cpu, Layers, DollarSign, Users, ChevronDown, CheckCircle, 
  Smartphone, Wallet, ArrowUpRight, Flame, Database, Radio, Bookmark, Calendar
} from "lucide-react";

interface BlockItem {
  id: number;
  height: string;
  txs: number;
  value: string;
  time: string;
}

interface TxItem {
  hash: string;
  confirmed: boolean;
  amount: string;
  time: string;
}

export default function LandingPage() {
  // Real-time block explorer simulated streams
  const [blocks, setBlocks] = useState<BlockItem[]>([
    { id: 4, height: "#17346138", txs: 0, value: "0.0000 MST", time: "Just now" },
    { id: 3, height: "#17346137", txs: 2, value: "1.4500 MST", time: "12s ago" },
    { id: 2, height: "#17346136", txs: 1, value: "0.0050 MST", time: "25s ago" },
    { id: 1, height: "#17346135", txs: 0, value: "0.0000 MST", time: "38s ago" },
  ]);

  const [txs, setTxs] = useState<TxItem[]>([
    { hash: "0xAd8f...1000", confirmed: true, amount: "0.0001 MST", time: "41s ago" },
    { hash: "0x8805...f623", confirmed: true, amount: "0.0000 MST", time: "41s ago" },
    { hash: "0x0553...1000", confirmed: true, amount: "0.0050 MST", time: "1m ago" },
    { hash: "0xD51D...A6A0", confirmed: true, amount: "0.0000 MST", time: "1m ago" },
  ]);

  // Tick helper for simulation
  useEffect(() => {
    const blockInterval = setInterval(() => {
      // 1. Generate new block
      setBlocks((prev) => {
        const nextBlockNum = parseInt(prev[0].height.replace("#", "")) + 1;
        const txsCount = Math.floor(Math.random() * 4);
        const totalValue = txsCount > 0 ? `${(Math.random() * 2).toFixed(4)} MST` : "0.0000 MST";
        const newBlock: BlockItem = {
          id: Date.now(),
          height: `#${nextBlockNum}`,
          txs: txsCount,
          value: totalValue,
          time: "Just now",
        };
        // Keep only top 4
        return [newBlock, ...prev.map(b => ({ ...b, time: updateTime(b.time) })).slice(0, 3)];
      });

      // 2. Generate new transaction randomly
      if (Math.random() > 0.4) {
        setTxs((prev) => {
          const hexChars = "0123456789ABCDEF";
          let randomHash = "0x";
          for (let i = 0; i < 4; i++) randomHash += hexChars[Math.floor(Math.random() * 16)];
          randomHash += "...";
          for (let i = 0; i < 4; i++) randomHash += hexChars[Math.floor(Math.random() * 16)];
          
          const newTx: TxItem = {
            hash: randomHash.toLowerCase(),
            confirmed: true,
            amount: `${(Math.random() * 0.2).toFixed(4)} MST`,
            time: "Just now",
          };
          return [newTx, ...prev.map(t => ({ ...t, time: updateTime(t.time) })).slice(0, 3)];
        });
      }
    }, 4500);

    return () => clearInterval(blockInterval);
  }, []);

  function updateTime(prevTime: string): string {
    if (prevTime === "Just now") return "4s ago";
    if (prevTime.includes("s ago")) {
      const secs = parseInt(prevTime) + 4;
      return secs >= 60 ? "1m ago" : `${secs}s ago`;
    }
    if (prevTime === "1m ago") return "2m ago";
    return prevTime;
  }

  // FAQ Accordion State
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);
  const faqs = [
    {
      q: "What is MST Blockchain?",
      a: "MST Blockchain (MST) is a public, EVM-compatible Layer 1 blockchain developed by India-based Masterstroke Technosoft, designed for high-speed (4000+ TPS) and low-cost decentralized applications. Using Proof of Stake Authority (PoSA), it focuses on security and efficiency for enterprise, fintech, supply chain, and digital identity use cases."
    },
    {
      q: "How do I become a validator on MST?",
      a: "You can participate in securing consensus by running a validator node fraction. Go to our dedicated Validator Page, choose your fraction configuration, compute pricing dynamically including local GST, and register / log into your Node Operator Dashboard."
    },
    {
      q: "Is MST EVM-compatible?",
      a: "Yes! MST is completely compatible with the Ethereum Virtual Machine (EVM), allowing developers to deploy standard Solidity smart contracts, compile via standard tools, and leverage Uniswap V3 concentrated liquidity factory models seamlessly."
    },
    {
      q: "What consensus mechanism does MST use?",
      a: "MST operates on Proof of Stake Authority (PoSA), combining the high throughput and gas efficiency of authority node elements with the decentralized validation and staking security of global node operators."
    }
  ];

  // Partner list for marquee
  const partners = [
    "MasterStroke", "SafePal", "Ledger", "Viem Network", "WASMify", "SARAL SDK", 
    "BridgeKey Wallet", "Post-quantum Sec", "Metamask", "QuickNode", "Alchemy Nodes", 
    "Infura", "CoinGecko", "CoinMarketCap", "Etherscan", "Safe MultiSig", "Web3Auth", "Trika Protocol"
  ];

  return (
    <div className="relative min-h-screen px-4 pb-20 pt-10 overflow-hidden font-sans">
      {/* Background Radial Glow spots */}
      <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-pink-950 rounded-full glowing-bg-spot animate-pulse-slow" />
      <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-orange-950 rounded-full glowing-bg-spot animate-pulse-slow" style={{ animationDelay: "2s" }} />

      <div className="max-w-6xl mx-auto space-y-24">
        
        {/* HERO SECTION */}
        <section className="text-center space-y-6 pt-16 md:pt-24 relative">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-pink-500/30 bg-pink-950/20 text-xs font-semibold tracking-wide text-pink-300 uppercase">
            <Radio size={12} className="text-pink-500 animate-pulse" />
            9+ Active Nodes &bull; POSA Consensus
          </div>

          <h1 className="text-4xl sm:text-6xl md:text-7xl font-display font-extrabold tracking-tight leading-none bg-gradient-to-r from-pink-500 via-purple-500 to-orange-500 bg-clip-text text-transparent uppercase select-none text-neon-pink max-w-4xl mx-auto">
            MST BLOCKCHAIN
          </h1>

          <h2 className="text-xl sm:text-3xl md:text-4xl font-display font-semibold tracking-normal text-zinc-200">
            DESIGNED FOR SCALE. BUILT FOR THE FUTURE.
          </h2>

          <p className="max-w-2xl mx-auto text-xs sm:text-sm leading-relaxed text-zinc-400">
            Institutional Web3 data visualization and decentralized infrastructure abstract network. Redefining digital systems with speed, trust, and decentralization.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-6">
            <Link 
              to="/swap" 
              className="group flex items-center gap-2 rounded-xl gradient-gta px-8 py-4 font-semibold text-white transition hover:scale-105 shadow-lg shadow-pink-500/20 text-xs uppercase"
            >
              Launch Exchange
              <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
            </Link>
            <a 
              href="https://docs.mstblockchain.com" 
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-950/60 px-8 py-4 font-semibold text-zinc-200 backdrop-blur-md transition hover:bg-zinc-900 hover:border-zinc-700 text-xs uppercase"
            >
              Documentation
            </a>
          </div>
        </section>

        {/* METRICS / STATS SECTION */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6 rounded-2xl border border-zinc-900 bg-zinc-950/40 backdrop-blur-xl">
          <div className="text-center p-4">
            <div className="text-2xl md:text-3xl font-mono font-extrabold tracking-tight text-transparent bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-neon-pink">3.0 s</div>
            <div className="text-[10px] uppercase text-zinc-500 mt-1 font-bold tracking-wider">Average Block Time</div>
          </div>
          <div className="text-center p-4 border-l border-zinc-900/60">
            <div className="text-2xl md:text-3xl font-mono font-extrabold tracking-tight text-transparent bg-gradient-to-r from-purple-500 to-orange-500 bg-clip-text text-neon-orange">72,000+</div>
            <div className="text-[10px] uppercase text-zinc-500 mt-1 font-bold tracking-wider">Active Validators</div>
          </div>
          <div className="text-center p-4 border-l border-zinc-900/60">
            <div className="text-2xl md:text-3xl font-mono font-extrabold tracking-tight text-transparent bg-gradient-to-r from-pink-500 to-orange-500 bg-clip-text text-neon-pink">0.001 MSTC</div>
            <div className="text-[10px] uppercase text-zinc-500 mt-1 font-bold tracking-wider">Average Txn Fees</div>
          </div>
          <div className="text-center p-4 border-l border-zinc-900/60">
            <div className="text-2xl md:text-3xl font-mono font-extrabold tracking-tight text-emerald-400">4,000+</div>
            <div className="text-[10px] uppercase text-zinc-500 mt-1 font-bold tracking-wider">TPS Capable</div>
          </div>
        </section>

        {/* PARTNER LOGO MARQUEE */}
        <section className="space-y-4 overflow-hidden">
          <h4 className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold text-center">Powering Trusted Integrations Across the Ecosystem</h4>
          
          <div className="relative w-full flex items-center overflow-x-hidden py-3 bg-zinc-950/20 border-y border-zinc-900">
            <div className="flex gap-12 whitespace-nowrap animate-slow-marquee">
              {partners.concat(partners).map((partner, index) => (
                <span 
                  key={index} 
                  className="text-xs uppercase font-extrabold tracking-widest text-zinc-500 hover:text-white transition duration-300 select-none cursor-default"
                >
                  {partner}
                </span>
              ))}
            </div>
            
            {/* Infinite scrolling helper animation */}
            <style>{`
              @keyframes slowMarquee {
                0% { transform: translate3d(0, 0, 0); }
                100% { transform: translate3d(-50%, 0, 0); }
              }
              .animate-slow-marquee {
                animation: slowMarquee 35s linear infinite;
              }
            `}</style>
          </div>
        </section>

        {/* WHAT IS MST & PRODUCTS SHOWCASE */}
        <section className="space-y-12">
          <div className="text-center space-y-3">
            <span className="text-[10px] font-semibold text-pink-400 uppercase tracking-wider">Ecosystem Overview</span>
            <h2 className="text-3xl font-display font-bold uppercase tracking-wide text-white">What is MST?</h2>
            <p className="text-xs text-zinc-400 max-w-xl mx-auto leading-relaxed">
              MST Blockchain (MST) is a public, EVM-compatible Layer 1 blockchain developed by India-based Masterstroke Technosoft, designed for high-speed (4000+ TPS) and low-cost decentralized applications. Using Proof of Stake Authority (PoSA), it focuses on security and efficiency for enterprise, fintech, supply chain, and digital identity use cases.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* BridgeKey */}
            <div className="p-6 rounded-2xl border border-zinc-900 bg-zinc-950/60 backdrop-blur-md flex flex-col justify-between transition hover:-translate-y-1 hover:border-pink-500/20">
              <div className="space-y-4">
                <div className="h-10 w-10 rounded-lg bg-pink-500/10 flex items-center justify-center text-pink-400">
                  <Wallet size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-white uppercase tracking-wider">BridgeKey Wallet</h3>
                  <p className="text-[10px] text-pink-400 font-bold uppercase mt-0.5">Secure Multi-Chain App</p>
                </div>
                <p className="text-[11px] text-zinc-400 leading-relaxed">
                  A secure, multi-chain wallet designed for seamless digital asset transfers, downloads, and cross-chain operations.
                </p>
              </div>
              <div className="border-t border-zinc-900 pt-3 mt-4 grid grid-cols-3 text-center text-[10px]">
                <div>
                  <span className="block font-bold text-white">15K+</span>
                  <span className="text-[9px] text-zinc-500 uppercase font-semibold">Users</span>
                </div>
                <div className="border-x border-zinc-900">
                  <span className="block font-bold text-white">20K</span>
                  <span className="text-[9px] text-zinc-500 uppercase font-semibold">DLs</span>
                </div>
                <div>
                  <span className="block font-bold text-emerald-400">99.9%</span>
                  <span className="text-[9px] text-zinc-500 uppercase font-semibold">Reliability</span>
                </div>
              </div>
            </div>

            {/* SARAL Protocol */}
            <div className="p-6 rounded-2xl border border-zinc-900 bg-zinc-950/60 backdrop-blur-md flex flex-col justify-between transition hover:-translate-y-1 hover:border-purple-500/20">
              <div className="space-y-4">
                <div className="h-10 w-10 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-400">
                  <Smartphone size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-white uppercase tracking-wider">SARAL Protocol</h3>
                  <p className="text-[10px] text-purple-400 font-bold uppercase mt-0.5">Simplified SDK & Auth</p>
                </div>
                <p className="text-[11px] text-zinc-400 leading-relaxed">
                  Enables users to access blockchain apps using phone numbers and Single Sign-On (SSO) credentials, streamlining Web3 onboarding.
                </p>
              </div>
              <div className="pt-4 border-t border-zinc-900 mt-4 text-right">
                <span className="text-[9px] text-zinc-500 uppercase font-bold tracking-wider hover:text-white transition cursor-pointer">Explore Now &rarr;</span>
              </div>
            </div>

            {/* WASMify */}
            <div className="p-6 rounded-2xl border border-zinc-900 bg-zinc-950/60 backdrop-blur-md flex flex-col justify-between transition hover:-translate-y-1 hover:border-orange-500/20">
              <div className="space-y-4">
                <div className="h-10 w-10 rounded-lg bg-orange-500/10 flex items-center justify-center text-orange-400">
                  <Cpu size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-white uppercase tracking-wider">WASMify</h3>
                  <p className="text-[10px] text-orange-400 font-bold uppercase mt-0.5">Logical Bridge Network</p>
                </div>
                <p className="text-[11px] text-zinc-400 leading-relaxed">
                  Bridges Web2 and Web3 processing by executing computational logic securely with complete blockchain transparency.
                </p>
              </div>
              <div className="pt-4 border-t border-zinc-900 mt-4 text-right">
                <span className="text-[9px] text-zinc-500 uppercase font-bold tracking-wider hover:text-white transition cursor-pointer">Explore Now &rarr;</span>
              </div>
            </div>

            {/* Post-quantum */}
            <div className="p-6 rounded-2xl border border-zinc-900 bg-zinc-950/60 backdrop-blur-md flex flex-col justify-between transition hover:-translate-y-1 hover:border-emerald-500/20">
              <div className="space-y-4">
                <div className="h-10 w-10 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                  <Database size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-white uppercase tracking-wider">Post-quantum</h3>
                  <p className="text-[10px] text-emerald-400 font-bold uppercase mt-0.5">Resilient Encryption</p>
                </div>
                <p className="text-[11px] text-zinc-400 leading-relaxed">
                  Robust protocol cryptography designed to block quantum computing attacks and safeguard ecosystem registry accounts.
                </p>
              </div>
              <div className="pt-4 border-t border-zinc-900 mt-4 text-right">
                <span className="text-[9px] text-zinc-500 uppercase font-bold tracking-wider hover:text-white transition cursor-pointer">Explore Now &rarr;</span>
              </div>
            </div>

          </div>
        </section>

        {/* INTERACTIVE LIVE BLOCK EXPLORER SIMULATOR */}
        <section className="grid md:grid-cols-[1fr_1fr] gap-8 items-start">
          <div className="space-y-6">
            <span className="text-[10px] font-bold text-orange-400 uppercase tracking-widest block">MST Mainnet Ledger</span>
            <h2 className="text-3xl font-display font-extrabold uppercase tracking-wide text-white leading-tight">
              Real-time Ledger <br/> & Transaction Flow
            </h2>
            <p className="text-xs text-zinc-400 leading-relaxed max-w-md">
              Watch consensus finalization streams directly from our PoSA master routers. Every validated block is packaged and distributed instantly across global validator nodes.
            </p>
            <div className="pt-2">
              <Link 
                to="/explore" 
                className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-950/60 px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-zinc-200 backdrop-blur-md hover:bg-zinc-900 transition"
              >
                Launch Live MST Explorer
                <ArrowUpRight size={12} />
              </Link>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            
            {/* Live Blocks Stream Card */}
            <div className="p-5 rounded-2xl border border-zinc-900 bg-zinc-950/60 backdrop-blur-md space-y-4">
              <h3 className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider flex items-center gap-1.5 border-b border-zinc-900 pb-3">
                <Database size={12} className="text-pink-400 animate-pulse" />
                Latest Block Ledger
              </h3>
              
              <div className="space-y-3 min-h-[220px]">
                <AnimatePresence initial={false}>
                  {blocks.map((block) => (
                    <motion.div 
                      key={block.id}
                      initial={{ opacity: 0, x: -10, y: -5 }}
                      animate={{ opacity: 1, x: 0, y: 0 }}
                      exit={{ opacity: 0, height: 0, marginBottom: 0, overflow: "hidden" }}
                      className="p-3 rounded-xl border border-zinc-900 bg-zinc-950/30 flex justify-between items-center text-[10px]"
                    >
                      <div>
                        <div className="font-bold text-white flex items-center gap-1.5">
                          <span className="h-1.5 w-1.5 rounded-full bg-pink-500 animate-ping" />
                          {block.height}
                        </div>
                        <div className="text-[9px] text-zinc-500 font-semibold uppercase mt-0.5">{block.txs} Transactions</div>
                      </div>
                      <div className="text-right">
                        <div className="font-mono font-bold text-zinc-300">{block.value}</div>
                        <div className="text-[9px] text-zinc-500 font-mono mt-0.5">{block.time}</div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>

            {/* Live Transactions Stream Card */}
            <div className="p-5 rounded-2xl border border-zinc-900 bg-zinc-950/60 backdrop-blur-md space-y-4">
              <h3 className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider flex items-center gap-1.5 border-b border-zinc-900 pb-3">
                <Radio size={12} className="text-orange-400 animate-ping" />
                Confirmed Transactions
              </h3>
              
              <div className="space-y-3 min-h-[220px]">
                <AnimatePresence initial={false}>
                  {txs.map((tx) => (
                    <motion.div 
                      key={tx.hash}
                      initial={{ opacity: 0, x: 10, y: -5 }}
                      animate={{ opacity: 1, x: 0, y: 0 }}
                      exit={{ opacity: 0, height: 0, marginBottom: 0, overflow: "hidden" }}
                      className="p-3 rounded-xl border border-zinc-900 bg-zinc-950/30 flex justify-between items-center text-[10px]"
                    >
                      <div>
                        <span className="font-mono font-bold text-white block">{tx.hash}</span>
                        <span className="inline-flex px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[8px] font-bold uppercase mt-1">Confirmed</span>
                      </div>
                      <div className="text-right">
                        <div className="font-mono font-bold text-zinc-300">{tx.amount}</div>
                        <div className="text-[9px] text-zinc-500 font-mono mt-0.5">{tx.time}</div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>

          </div>
        </section>

        {/* BECOME AN OPERATOR CTA */}
        <section className="p-8 rounded-3xl border border-zinc-900 bg-gradient-to-tr from-zinc-950 via-zinc-950 to-pink-950/20 backdrop-blur-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-pink-500 glowing-bg-spot" />
          <div className="grid md:grid-cols-[1fr_300px] gap-8 items-center relative z-10">
            <div className="space-y-4">
              <span className="text-[10px] font-bold text-pink-400 uppercase tracking-widest block">JOIN OUR ECOSYSTEM</span>
              <h3 className="text-2xl font-bold uppercase text-white tracking-wide">Ready to Secure the Protocol?</h3>
              <p className="text-xs text-zinc-400 leading-relaxed max-w-xl">
                Become a validator, ambassador, or build with developer grants. Earn protocol-determined block validation distributions by strengthening node operations globally.
              </p>
              
              <div className="grid sm:grid-cols-3 gap-4 pt-2 text-[10px] text-zinc-400">
                <div className="space-y-1">
                  <span className="font-bold text-white block uppercase">Validator Program</span>
                  <span>Stake MSTC and support node infrastructure.</span>
                </div>
                <div className="space-y-1">
                  <span className="font-bold text-white block uppercase">Ambassador Hub</span>
                  <span>Onboard local communities and devs.</span>
                </div>
                <div className="space-y-1">
                  <span className="font-bold text-white block uppercase">Funding Grants</span>
                  <span>Apply for tech building backing.</span>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col gap-3">
              <a 
                href="https://node.mstblockchain.com" 
                target="_blank"
                rel="noreferrer"
                className="w-full py-4 rounded-xl font-bold text-xs uppercase tracking-wider text-center text-white gradient-gta hover:scale-103 transition shadow-lg shadow-pink-500/20 block"
              >
                Join Validator Node
              </a>
              <Link 
                to="/contact" 
                className="w-full py-4 rounded-xl border border-zinc-800 bg-zinc-950/60 font-bold text-xs uppercase tracking-wider text-center text-zinc-300 hover:bg-zinc-900 transition"
              >
                Become a Partner
              </Link>
            </div>
          </div>
        </section>

        {/* LATEST BLOGS SECTION */}
        <section className="space-y-10">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <span className="text-[10px] font-bold text-pink-400 uppercase tracking-wider">Newsroom Updates</span>
              <h2 className="text-2xl font-bold uppercase tracking-wide text-white">Latest Blogs & Research</h2>
            </div>
            <a 
              href="https://mstblockchain.com/blogs" 
              target="_blank"
              rel="noreferrer"
              className="text-[10px] font-bold text-pink-400 uppercase tracking-wider hover:underline"
            >
              View All Blogs &rarr;
            </a>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            
            {/* Blog 1 */}
            <div className="p-6 rounded-2xl border border-zinc-900 bg-zinc-950/40 backdrop-blur-md flex flex-col justify-between transition hover:border-zinc-800">
              <div className="space-y-3">
                <div className="flex justify-between items-center text-[9px] text-zinc-500 font-bold uppercase tracking-wider">
                  <span>Report</span>
                  <span>May 13, 2026</span>
                </div>
                <h4 className="text-xs font-bold text-white uppercase tracking-wider leading-relaxed">
                  MST Blockchain Q1 2026 Report: 72,000+ Validators, BridgeKey Wallet & India's Web3 Expansion
                </h4>
                <p className="text-[11px] text-zinc-500 leading-relaxed">
                  India's first Layer-1 blockchain reached a defining milestone in Q1 2026 with historic validation levels.
                </p>
              </div>
              <div className="pt-4 border-t border-zinc-900/60 mt-4 text-right">
                <span className="text-[9px] text-pink-400 font-bold uppercase tracking-wider cursor-pointer hover:underline">Read More</span>
              </div>
            </div>

            {/* Blog 2 */}
            <div className="p-6 rounded-2xl border border-zinc-900 bg-zinc-950/40 backdrop-blur-md flex flex-col justify-between transition hover:border-zinc-800">
              <div className="space-y-3">
                <div className="flex justify-between items-center text-[9px] text-zinc-500 font-bold uppercase tracking-wider">
                  <span>Partnership</span>
                  <span>Apr 3, 2026</span>
                </div>
                <h4 className="text-xs font-bold text-white uppercase tracking-wider leading-relaxed">
                  MST Blockchain Goes Live on SafePal: A Big Step for India's Web3 Future
                </h4>
                <p className="text-[11px] text-zinc-500 leading-relaxed">
                  SafePal integrates native support, bringing hardware-grade safety keys to every MSTC holder.
                </p>
              </div>
              <div className="pt-4 border-t border-zinc-900/60 mt-4 text-right">
                <span className="text-[9px] text-pink-400 font-bold uppercase tracking-wider cursor-pointer hover:underline">Read More</span>
              </div>
            </div>

            {/* Blog 3 */}
            <div className="p-6 rounded-2xl border border-zinc-900 bg-zinc-950/40 backdrop-blur-md flex flex-col justify-between transition hover:border-zinc-800">
              <div className="space-y-3">
                <div className="flex justify-between items-center text-[9px] text-zinc-500 font-bold uppercase tracking-wider">
                  <span>Roadmap 2026</span>
                  <span>Feb 27, 2026</span>
                </div>
                <h4 className="text-xs font-bold text-white uppercase tracking-wider leading-relaxed">
                  MST Blockchain Roadmap 2026: Building the Future of Layer-1 Infrastructure
                </h4>
                <p className="text-[11px] text-zinc-500 leading-relaxed">
                  Detailing the six pillars including Trika Consensus, RWA Orbitals, SARAL, and quantum-ready cryptographic keys.
                </p>
              </div>
              <div className="pt-4 border-t border-zinc-900/60 mt-4 text-right">
                <span className="text-[9px] text-pink-400 font-bold uppercase tracking-wider cursor-pointer hover:underline">Read More</span>
              </div>
            </div>

          </div>
        </section>

        {/* EVENTS SECTION */}
        <section className="grid md:grid-cols-2 gap-8 items-start">
          <div className="p-6 rounded-2xl border border-zinc-900 bg-zinc-950/30 space-y-4">
            <h3 className="text-xs uppercase font-extrabold text-zinc-400 tracking-wider flex items-center gap-1.5">
              <Calendar size={14} className="text-pink-400" />
              Upcoming Events
            </h3>
            <div className="p-4 rounded-xl border border-zinc-900 bg-zinc-950/40 space-y-2">
              <div className="flex justify-between items-center text-[9px] text-pink-400 font-bold uppercase tracking-wider">
                <span>CampusVerse 2026</span>
                <span>May 10, 2026 &bull; 10:00 AM ITC</span>
              </div>
              <p className="text-xs font-bold text-white uppercase">University Onboarding Hub</p>
              <p className="text-[10px] text-zinc-500 leading-relaxed">
                Students and builders are trained on running nodes and compiling Solidity directly against MST protocol modules.
              </p>
            </div>
          </div>

          <div className="p-6 rounded-2xl border border-zinc-900 bg-zinc-950/30 space-y-4">
            <h3 className="text-xs uppercase font-extrabold text-zinc-400 tracking-wider flex items-center gap-1.5">
              <Calendar size={14} className="text-zinc-600" />
              Past Events
            </h3>
            <div className="p-4 rounded-xl border border-zinc-900 bg-zinc-950/40 space-y-2">
              <div className="flex justify-between items-center text-[9px] text-zinc-500 font-bold uppercase tracking-wider">
                <span>IGNITE 2026</span>
                <span>MAR 27, 2026 &bull; 04:00 PM ITC</span>
              </div>
              <p className="text-xs font-bold text-white uppercase">Validator Community Round</p>
              <p className="text-[10px] text-zinc-500 leading-relaxed">
                Our validator and developer community gathered for consensus speed benchmarks and network scaling roundtables.
              </p>
            </div>
          </div>
        </section>

        {/* FREQUENTLY ASKED QUESTIONS */}
        <section className="space-y-8 max-w-4xl mx-auto">
          <div className="text-center space-y-2">
            <span className="text-[10px] font-bold text-pink-400 uppercase tracking-widest block">GOT QUESTIONS?</span>
            <h2 className="text-2xl font-display font-bold uppercase text-white tracking-wide">Frequently Asked Questions</h2>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, index) => {
              const isOpen = openFaqIndex === index;
              return (
                <div 
                  key={index}
                  className="rounded-xl border border-zinc-900 bg-zinc-950/40 transition hover:border-zinc-800"
                >
                  <button 
                    onClick={() => setOpenFaqIndex(isOpen ? null : index)}
                    className="w-full flex justify-between items-center px-5 py-4 text-xs font-bold text-zinc-200 hover:text-white transition text-left"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown 
                      size={14} 
                      className={`text-zinc-500 transition-transform ${isOpen ? "rotate-180 text-pink-400" : ""}`} 
                    />
                  </button>
                  <AnimatePresence>
                    {isOpen && (
                      <motion.div 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <p className="text-[11px] text-zinc-400 leading-relaxed px-5 pb-5 border-t border-zinc-950 pt-3">
                          {faq.a}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </section>

      </div>
    </div>
  );
}
