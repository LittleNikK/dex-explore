import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Compass, Users2, ShieldCheck, Twitter, ExternalLink, Award, Globe, BookOpen } from "lucide-react";

type ActiveTab = "team" | "vision" | "infrastructure";

interface TeamMember {
  name: string;
  role: string;
  bio: string;
  twitter?: string;
}

const TEAM: TeamMember[] = [
  {
    name: "Pramod Borate",
    role: "Chairman & Founder Director",
    bio: "He leads MST Blockchain with a strong focus on building a scalable, reliable, and user-centric blockchain ecosystem. He drives the vision across protocol development, product innovation, and ecosystem growth, ensuring MST remains production-ready and accessible for real-world adoption. Beyond his leadership role, Pramod is passionate about simplifying complex systems into practical solutions and actively mentors emerging builders in the Web3 space, helping them turn ideas into impactful products.",
    twitter: "Pramod_Borate"
  },
  {
    name: "Swapnil Dere",
    role: "Co-Founder & Director",
    bio: "He plays a key role in shaping the technical vision and system architecture of MST Blockchain, ensuring the platform is scalable, secure, and future-ready. He focuses on building a robust foundation that balances performance, reliability, and seamless composability for developers and users. Driven by precision and innovation, he is committed to providing a developer-friendly ecosystem that supports continuous growth and real-world adoption.",
    twitter: "swapnil_Dere"
  },
  {
    name: "Mahendra Dhomase",
    role: "Chief Financial Officer (CFO)",
    bio: "He oversees financial strategy and operations at MST Blockchain, ensuring sustainable growth, capital efficiency, and long-term value creation. He manages financial planning, investor relations, and regulatory compliance, aligning financial decisions with MST’s strategic vision. With a focus on scaling Web3 ventures, he plays a critical role in budgeting, fundraising, and risk management, helping position MST Blockchain as a financially resilient and growth-driven ecosystem.",
    twitter: "Mahendra_Dhomase"
  },
  {
    name: "Kamlesh Nagware",
    role: "Director",
    bio: "He plays a vital role in strengthening the security, reliability, and core infrastructure of MST Blockchain. He focuses on developing secure smart contract patterns and robust system primitives that enable teams to build with confidence and efficiency on the MST ecosystem. Beyond development, he contributes by creating reference implementations, testing frameworks, and practical guides, turning best practices into scalable and repeatable development processes.",
    twitter: "kamlesh_Nagware"
  },
  {
    name: "Kalika Mishra",
    role: "Chief Technology Officer (CTO)",
    bio: "He leads the technical vision at MST Blockchain, driving the development of a scalable, secure, and high-performance blockchain infrastructure. He works across protocol engineering, system architecture, and integrations to ensure MST remains robust, efficient, and future-ready. Passionate about building cutting-edge systems, he is committed to advancing MST as a developer-friendly and production-grade Web3 ecosystem.",
    twitter: "kalika_Prasad"
  },
  {
    name: "Ashish Kumar Jain",
    role: "Chief Marketing Officer (CMO)",
    bio: "He leads the marketing vision at MST Blockchain, driving brand strategy, growth initiatives, and global outreach. He focuses on positioning MST as a trusted and innovative Web3 ecosystem, bridging technology with real-world adoption. Passionate about building impactful brands, he is committed to creating a premium, accessible, and growth-driven presence for MST in the global blockchain landscape.",
    twitter: "Ashish_Kumar_Jain"
  },
  {
    name: "Suresh Nair",
    role: "Chief Operating Officer (COO)",
    bio: "He oversees operations at MST Blockchain, ensuring seamless alignment between product strategy, execution, and user experience. He plays a key role in shaping how builders and community members interact with the ecosystem, making MST intuitive, accessible, and efficient at every touchpoint. Driven by a vision of providing a premium and user-centric experience, he ensures that every interaction within MST reflects quality, precision, and ease of use.",
    twitter: "mst_Suresh"
  },
  {
    name: "Prasanna Lohar",
    role: "Technical Advisor",
    bio: "He supports MST Blockchain by bringing deep technical insights and strategic direction to the platform’s development and ecosystem growth. He focuses on strengthening the technical foundation, guiding architecture decisions, and ensuring the scalability, security, and long-term sustainability of the blockchain infrastructure."
  },
  {
    name: "Adv. Ishita Sharma",
    role: "Legal Advisor",
    bio: "Ishita Sharma advises MST Blockchain on legal frameworks, compliance strategies, and regulatory alignment within the evolving Web3 ecosystem. Her expertise ensures that innovation is backed by robust legal foundations, enabling secure, compliant, and scalable growth across markets."
  }
];

export default function AboutPage() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("vision");

  return (
    <div className="relative min-h-screen px-4 pb-20 pt-10 overflow-hidden font-sans">
      {/* Background Radial Glow spots */}
      <div className="absolute top-1/4 right-1/4 w-[400px] h-[400px] bg-pink-950 rounded-full glowing-bg-spot animate-pulse-slow" />
      <div className="absolute bottom-1/4 left-1/4 w-[400px] h-[400px] bg-orange-950 glowing-bg-spot animate-pulse-slow" />

      <div className="max-w-6xl mx-auto space-y-16">
        {/* Title / Header */}
        <div className="flex flex-col gap-2 border-b border-zinc-800 pb-6 text-center md:text-left">
          <span className="text-xs font-semibold tracking-wider text-pink-400 uppercase">Powering the Decentralized Future</span>
          <h1 className="text-3xl font-display font-extrabold uppercase text-white tracking-wide">About MST Blockchain</h1>
          <p className="text-zinc-400 text-xs max-w-2xl leading-relaxed mt-2">
            Redefining digital systems with speed, trust, and decentralization. We provide the robust, high-performance infrastructure needed to power the next generation of global decentralized economies.
          </p>
        </div>

        {/* Real Ecosystem Statistics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6 rounded-2xl border border-zinc-900/60 bg-zinc-950/40 backdrop-blur-xl">
          <div className="text-center p-3">
            <div className="text-2xl md:text-3xl font-mono font-extrabold tracking-tight text-transparent bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-neon-pink">72,000+</div>
            <div className="text-[10px] uppercase text-zinc-500 mt-1 font-bold tracking-wider">Active Validators</div>
          </div>
          <div className="text-center p-3 border-l border-zinc-900/60">
            <div className="text-2xl md:text-3xl font-mono font-extrabold tracking-tight text-transparent bg-gradient-to-r from-purple-500 to-orange-500 bg-clip-text text-neon-orange">4,000+</div>
            <div className="text-[10px] uppercase text-zinc-500 mt-1 font-bold tracking-wider">TPS Capable</div>
          </div>
          <div className="text-center p-3 border-l border-zinc-900/60">
            <div className="text-2xl md:text-3xl font-mono font-extrabold tracking-tight text-transparent bg-gradient-to-r from-pink-500 to-orange-500 bg-clip-text text-neon-pink">21+</div>
            <div className="text-[10px] uppercase text-zinc-500 mt-1 font-bold tracking-wider">Global Nodes</div>
          </div>
          <div className="text-center p-3 border-l border-zinc-900/60">
            <div className="text-2xl md:text-3xl font-mono font-extrabold tracking-tight text-emerald-400">3s</div>
            <div className="text-[10px] uppercase text-zinc-500 mt-1 font-bold tracking-wider">Avg Block Time</div>
          </div>
        </div>

        {/* Premium Sliding Navigation Tabs */}
        <div className="flex justify-center border border-zinc-900 bg-zinc-950/60 p-1.5 rounded-xl max-w-lg mx-auto backdrop-blur-md relative">
          <button 
            onClick={() => setActiveTab("vision")}
            className={`flex-1 py-3 text-[10px] font-bold uppercase tracking-wider rounded-lg transition relative ${activeTab === "vision" ? "text-white" : "text-zinc-500 hover:text-zinc-300"}`}
          >
            {activeTab === "vision" && (
              <motion.div layoutId="about-active" className="absolute inset-0 bg-zinc-900 rounded-lg -z-10" />
            )}
            Our Mission & Vision
          </button>
          <button 
            onClick={() => setActiveTab("team")}
            className={`flex-1 py-3 text-[10px] font-bold uppercase tracking-wider rounded-lg transition relative ${activeTab === "team" ? "text-white" : "text-zinc-500 hover:text-zinc-300"}`}
          >
            {activeTab === "team" && (
              <motion.div layoutId="about-active" className="absolute inset-0 bg-zinc-900 rounded-lg -z-10" />
            )}
            Meet the Builders
          </button>
          <button 
            onClick={() => setActiveTab("infrastructure")}
            className={`flex-1 py-3 text-[10px] font-bold uppercase tracking-wider rounded-lg transition relative ${activeTab === "infrastructure" ? "text-white" : "text-zinc-500 hover:text-zinc-300"}`}
          >
            {activeTab === "infrastructure" && (
              <motion.div layoutId="about-active" className="absolute inset-0 bg-zinc-900 rounded-lg -z-10" />
            )}
            Core Infrastructure
          </button>
        </div>

        {/* Tab Contents Block */}
        <div className="min-h-[400px]">
          <AnimatePresence mode="wait">
            
            {/* 1. MISSION & VISION TAB */}
            {activeTab === "vision" && (
              <motion.div 
                key="vision"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.4 }}
                className="grid md:grid-cols-2 gap-8"
              >
                <div className="p-6 rounded-2xl border border-zinc-900 bg-zinc-950/40 backdrop-blur-md space-y-4">
                  <div className="h-10 w-10 rounded-lg bg-pink-500/10 flex items-center justify-center text-pink-400">
                    <Compass size={20} />
                  </div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">Our Mission</h3>
                  <p className="text-zinc-400 text-xs leading-relaxed">
                    We are here to make blockchain practical. Not just for crypto enthusiasts or expert developers, but for any business or individual who wants a reliable digital network they can actually use. MST gives developers the tools to build fast, businesses the infrastructure they can count on, and everyday users a secure place to participate in the growing Web3 world.
                  </p>
                </div>

                <div className="p-6 rounded-2xl border border-zinc-900 bg-zinc-950/40 backdrop-blur-md space-y-4">
                  <div className="h-10 w-10 rounded-lg bg-orange-500/10 flex items-center justify-center text-orange-400">
                    <Globe size={20} />
                  </div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">Our Vision</h3>
                  <p className="text-zinc-400 text-xs leading-relaxed">
                    We see a future where digital systems are open, transparent, and built on trust. MST is working to bridge traditional tech with decentralized networks so that neither world has to compromise. Our goal is to create a global platform where developers and companies can build the next generation of digital services—ones that are fast, fair, and built to last.
                  </p>
                </div>
              </motion.div>
            )}

            {/* 2. THE TEAM TAB */}
            {activeTab === "team" && (
              <motion.div 
                key="team"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.4 }}
                className="space-y-6"
              >
                <div className="text-center space-y-2 pb-2">
                  <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest">Founding Visionaries & Advisors</span>
                  <h2 className="text-xl font-bold uppercase text-white tracking-wide">Meet the Architects</h2>
                </div>

                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {TEAM.map((member) => (
                    <div 
                      key={member.name}
                      className="p-6 rounded-2xl border border-zinc-900 bg-zinc-950/60 backdrop-blur-md flex flex-col justify-between relative overflow-hidden transition hover:border-pink-500/20"
                    >
                      <div className="absolute top-0 right-0 w-12 h-12 bg-pink-500 glowing-bg-spot" />
                      
                      <div className="space-y-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="text-sm font-bold text-white uppercase tracking-wider">{member.name}</h3>
                            <div className="text-[9px] text-pink-400 uppercase font-bold tracking-wider mt-0.5">{member.role}</div>
                          </div>
                          <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-pink-500/10 to-orange-500/10 flex items-center justify-center font-bold text-white text-xs border border-zinc-800">
                            {member.name.split(" ").map(n => n[0]).join("")}
                          </div>
                        </div>

                        <p className="text-zinc-400 text-[11px] leading-relaxed pt-2">
                          {member.bio}
                        </p>
                      </div>

                      {member.twitter && (
                        <div className="pt-4 border-t border-zinc-900 mt-4 flex items-center justify-between">
                          <a 
                            href={`https://twitter.com/${member.twitter}`} 
                            target="_blank" 
                            rel="noreferrer" 
                            className="flex items-center gap-1 text-[10px] text-zinc-500 hover:text-white font-semibold transition"
                          >
                            <Twitter size={12} className="text-pink-400" />
                            @{member.twitter}
                          </a>
                          <span className="text-[9px] text-zinc-600 font-bold uppercase tracking-wider">Connect &rarr;</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* 3. CORE INFRASTRUCTURE TAB */}
            {activeTab === "infrastructure" && (
              <motion.div 
                key="infrastructure"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.4 }}
                className="grid sm:grid-cols-2 gap-6"
              >
                <div className="p-6 rounded-2xl border border-zinc-900 bg-zinc-950/40 backdrop-blur-md space-y-3">
                  <div className="h-8 w-8 rounded-lg bg-pink-500/10 flex items-center justify-center text-pink-400">
                    <Award size={18} />
                  </div>
                  <h3 className="text-xs font-extrabold text-white uppercase tracking-wider">Scalable Infrastructure</h3>
                  <p className="text-[11px] text-zinc-400 leading-relaxed">
                    MST is a Layer 1 blockchain that runs on its dedicated network. As the ecosystem grows, the chain keeps pace. More users, more transactions, and the same smooth performance everywhere.
                  </p>
                </div>

                <div className="p-6 rounded-2xl border border-zinc-900 bg-zinc-950/40 backdrop-blur-md space-y-3">
                  <div className="h-8 w-8 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-400">
                    <ShieldCheck size={18} />
                  </div>
                  <h3 className="text-xs font-extrabold text-white uppercase tracking-wider">Secure Transactions</h3>
                  <p className="text-[11px] text-zinc-400 leading-relaxed">
                    Every transaction on MST is validated by a distributed network of nodes working together. Think of it as a team of record-keepers where no entry can ever be faked or changed.
                  </p>
                </div>

                <div className="p-6 rounded-2xl border border-zinc-900 bg-zinc-950/40 backdrop-blur-md space-y-3">
                  <div className="h-8 w-8 rounded-lg bg-orange-500/10 flex items-center justify-center text-orange-400">
                    <BookOpen size={18} />
                  </div>
                  <h3 className="text-xs font-extrabold text-white uppercase tracking-wider">Developer Friendly</h3>
                  <p className="text-[11px] text-zinc-400 leading-relaxed">
                    Clean APIs, proper documentation, and ready-to-use testing environments. We built MST so developers can go from idea to live product without spending weeks on setup and configuration.
                  </p>
                </div>

                <div className="p-6 rounded-2xl border border-zinc-900 bg-zinc-950/40 backdrop-blur-md space-y-3">
                  <div className="h-8 w-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                    <Users2 size={18} />
                  </div>
                  <h3 className="text-xs font-extrabold text-white uppercase tracking-wider">Decentralized World</h3>
                  <p className="text-[11px] text-zinc-400 leading-relaxed">
                    MST isn't controlled by any single company or server. It runs on a global network of node operators and developers working together. That shared ownership makes the network stronger and more reliable over time.
                  </p>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
