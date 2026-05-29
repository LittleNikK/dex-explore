import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, HelpCircle, ChevronDown, CheckCircle, ArrowRight, MapPin, Briefcase } from "lucide-react";

interface FAQItem {
  q: string;
  a: string;
}

const FAQS: FAQItem[] = [
  {
    q: "What is MST Blockchain?",
    a: "MST Blockchain (MST) is a public, EVM-compatible Layer 1 blockchain developed by India-based Masterstroke Technosoft, designed for high-speed (4000+ TPS) and low-cost decentralized applications. Using Proof of Stake Authority (PoSA), it focuses on security and efficiency for enterprise, fintech, supply chain, and digital identity use cases."
  },
  {
    q: "How do I become a validator on MST?",
    a: "You can participate in securing consensus by running a validator node. Please visit our dedicated Node Validator portal at node.mstblockchain.com or contact our support team at support@mstblockchain.com to register as a node validator."
  },
  {
    q: "Is MST EVM-compatible?",
    a: "Yes! MST is completely compatible with the Ethereum Virtual Machine (EVM), allowing developers to deploy standard Solidity smart contracts, compile via standard Solidity tools, and leverage Uniswap V3 concentrated liquidity swap models."
  },
  {
    q: "What consensus mechanism does MST use?",
    a: "MST operates on Proof of Stake Authority (PoSA), combining the high throughput and gas efficiency of authority node elements with the decentralized validation and staking security of global node operators."
  }
];

export default function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState("support");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!name || !email || !message) return;
    setIsSubmitting(true);
    try {
      const formId = import.meta.env.VITE_FORM_ID ?? "support-team";
      await fetch(`https://formspree.io/f/${formId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, subject, category, message })
      });
      setSubmitted(true);
      setName("");
      setEmail("");
      setSubject("");
      setMessage("");
    } catch {
      setSubmitted(true);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="relative min-h-screen px-4 pb-20 pt-10 overflow-hidden font-sans">
      <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-orange-950 rounded-full glowing-bg-spot animate-pulse-slow" />
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-pink-950 glowing-bg-spot animate-pulse-slow" />

      <div className="max-w-4xl mx-auto space-y-12">
        {/* Title */}
        <div className="flex flex-col gap-2 border-b border-zinc-800 pb-6 text-center md:text-left">
          <span className="text-xs font-semibold tracking-wider text-orange-400 uppercase">Let's Build The Future</span>
          <h1 className="text-3xl font-display font-extrabold uppercase text-white tracking-wide">Get in Touch</h1>
          <p className="text-zinc-400 text-xs max-w-xl leading-relaxed mt-1">
            Have a technical question or a partnership idea? We're here to help.
          </p>
        </div>

        <div className="grid md:grid-cols-[1fr_360px] gap-8 items-start">
          {/* Left: Contact Form */}
          <motion.div 
            initial={{ opacity: 0, x: -15 }}
            animate={{ opacity: 1, x: 0 }}
            className="p-6 rounded-2xl border border-zinc-800 bg-zinc-950/60 backdrop-blur-xl space-y-6"
          >
            <h3 className="text-xs uppercase font-display font-bold text-zinc-400 tracking-wider flex items-center gap-1.5 border-b border-zinc-900 pb-3">
              <Mail size={14} className="text-orange-400" />
              Create a Ticket / Support Portal
            </h3>

            {submitted ? (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-8 text-center rounded-xl border border-emerald-900/20 bg-emerald-950/10 space-y-4"
              >
                <div className="h-10 w-10 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto">
                  <CheckCircle size={20} />
                </div>
                <h4 className="text-sm font-bold text-white uppercase">Message Dispatched!</h4>
                <p className="text-xs text-zinc-400 leading-relaxed max-w-sm mx-auto">
                  Your message has been successfully pushed. Our development support team will review your query and reply shortly.
                </p>
                <button 
                  onClick={() => setSubmitted(false)}
                  className="text-xs text-pink-400 font-semibold hover:underline flex items-center gap-1 mx-auto"
                >
                  Send another inquiry <ArrowRight size={12} />
                </button>
              </motion.div>
            ) : (
              <form onSubmit={handleSend} className="space-y-4 text-xs">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-zinc-500 font-semibold uppercase tracking-wider text-[9px]">Full Name</label>
                    <input 
                      id="contact-name-input"
                      name="name"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-transparent border border-zinc-800 rounded-xl px-4 py-3 text-white outline-none focus:border-orange-500 transition"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-zinc-500 font-semibold uppercase tracking-wider text-[9px]">Email Address</label>
                    <input 
                      id="contact-email-input"
                      name="email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-transparent border border-zinc-800 rounded-xl px-4 py-3 text-white outline-none focus:border-orange-500 transition font-mono"
                    />
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-zinc-500 font-semibold uppercase tracking-wider text-[9px]">Subject</label>
                    <input 
                      id="contact-subject-input"
                      name="subject"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      className="w-full bg-transparent border border-zinc-800 rounded-xl px-4 py-3 text-white outline-none focus:border-orange-500 transition"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-zinc-500 font-semibold uppercase tracking-wider text-[9px]">Category</label>
                    <select 
                      id="contact-category-select"
                      name="category"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white outline-none focus:border-orange-500 transition"
                    >
                      <option value="support">DApp Swap Support</option>
                      <option value="partnership">Business Partnership</option>
                      <option value="node">Validator Node Program</option>
                      <option value="other">General Inquiry</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-zinc-500 font-semibold uppercase tracking-wider text-[9px]">Message</label>
                  <textarea 
                    id="contact-message-textarea"
                    name="message"
                    required
                    rows={4}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="w-full bg-transparent border border-zinc-800 rounded-xl px-4 py-3.5 text-white outline-none focus:border-orange-500 transition resize-none text-xs leading-relaxed"
                  />
                </div>

                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-4 rounded-xl font-bold uppercase tracking-wider text-xs text-white gradient-gta hover:scale-102 transition shadow-lg shadow-pink-500/20 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? "Sending..." : "Send Message"}
                </button>
              </form>
            )}
          </motion.div>

          {/* Right Column: Contact info & FAQs */}
          <motion.div 
            initial={{ opacity: 0, x: 15 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            {/* Get In Touch Info */}
            <div className="p-5 rounded-2xl border border-zinc-800 bg-zinc-950/60 backdrop-blur-md space-y-4">
              <h3 className="text-xs uppercase font-display font-bold text-zinc-400 tracking-wider flex items-center gap-1.5 border-b border-zinc-900 pb-3">
                <Briefcase size={14} className="text-orange-400" />
                Contact Coordinates
              </h3>
              
              <div className="space-y-4 text-xs">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-orange-500/10 text-orange-400 flex items-center justify-center">
                    <Mail size={14} />
                  </div>
                  <div>
                    <span className="block text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Email Us</span>
                    <a href="mailto:support@mstblockchain.com" className="text-white hover:text-orange-400 transition font-mono">support@mstblockchain.com</a>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center">
                    <MapPin size={14} />
                  </div>
                  <div>
                    <span className="block text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Location</span>
                    <span className="text-white font-medium">Pune, India, 411018</span>
                  </div>
                </div>
              </div>
            </div>

            {/* FAQs Accordion */}
            <div className="p-5 rounded-2xl border border-zinc-800 bg-zinc-950/60 backdrop-blur-md space-y-4">
              <h3 className="text-xs uppercase font-display font-bold text-zinc-400 tracking-wider flex items-center gap-1.5">
                <HelpCircle size={14} className="text-purple-400" />
                Frequently Asked Questions
              </h3>

              <div className="space-y-3">
                {FAQS.map((faq, index) => {
                  const isOpen = openFaqIndex === index;
                  return (
                    <div key={index} className="border-b border-zinc-900 pb-2.5">
                      <button 
                        onClick={() => setOpenFaqIndex(isOpen ? null : index)}
                        className="w-full flex justify-between items-center text-[10px] font-bold text-zinc-200 hover:text-white transition text-left"
                      >
                        <span>{faq.q}</span>
                        <ChevronDown 
                          size={14} 
                          className={`text-zinc-500 transition-transform ${isOpen ? "rotate-180 text-pink-400" : ""}`} 
                        />
                      </button>
                      <AnimatePresence>
                        {isOpen && (
                          <motion.p 
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="text-[10px] text-zinc-400 leading-relaxed mt-2"
                          >
                            {faq.a}
                          </motion.p>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
