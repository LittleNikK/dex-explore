import { Link } from "react-router-dom";
import { MessageSquare, Twitter, Send } from "lucide-react";
import { useThemeStore } from "../../store/themeStore";

export default function Footer() {
  const { theme } = useThemeStore();
  const isDark = theme === "dark";

  return (
    <footer className={`border-t py-16 px-6 overflow-hidden ${
      isDark ? "bg-zinc-950/40 border-white/5 text-zinc-400" : "bg-white border-zinc-200 text-zinc-600"
    }`}>
      <div className="max-w-[1280px] mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-10">
        
        {/* Brand Column */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <Link to="/" className="flex items-center gap-2.5">
            <img src="/logo.png" alt="MSTSwap Logo" className="h-8 w-8 object-contain brightness-110" />
            <span className={`text-lg font-bold font-display tracking-wider ${
              isDark ? "text-white" : "text-zinc-950"
            }`}>
              MSTSwap
            </span>
          </Link>
          
          <p className="text-xs leading-relaxed max-w-sm">
            MSTSwap is the leading decentralized exchange aggregator. We scan multiple routing paths and liquidity pools to deliver optimized swap rates with low slippage and minimal fees.
          </p>

          {/* Social Icons */}
          <div className="flex items-center gap-4 mt-2">
            {[
              { icon: <Twitter size={15} />, href: "https://x.com", label: "X" },
              { icon: <Send size={15} />, href: "https://t.me", label: "Telegram" },
              { icon: <MessageSquare size={15} />, href: "https://discord.com", label: "Discord" }
            ].map((social) => (
              <a
                key={social.label}
                href={social.href}
                target="_blank"
                rel="noreferrer"
                aria-label={social.label}
                className={`p-2.5 rounded-full border transition-all ${
                  isDark
                    ? "border-white/5 bg-white/5 text-zinc-400 hover:text-white hover:border-white/20 hover:bg-white/10"
                    : "border-zinc-200 bg-zinc-50 text-zinc-600 hover:text-zinc-950 hover:border-zinc-300 hover:bg-zinc-100"
                }`}
              >
                {social.icon}
              </a>
            ))}
          </div>
        </div>

        {/* Links Column 1: Product */}
        <div>
          <h4 className={`text-xs font-bold uppercase tracking-[0.2em] mb-5 ${
            isDark ? "text-white" : "text-zinc-950"
          }`}>
            Product
          </h4>
          <ul className="flex flex-col gap-3 text-xs font-semibold">
            <li>
              <Link to="/swap" className="hover:text-cyan-400 transition-colors">
                Swap
              </Link>
            </li>
            <li>
              <Link to="/explore" className="hover:text-cyan-400 transition-colors">
                Pools
              </Link>
            </li>
            <li>
              <Link to="/explore" className="hover:text-cyan-400 transition-colors">
                Analytics
              </Link>
            </li>
          </ul>
        </div>

        {/* Links Column 2: Developers */}
        <div>
          <h4 className={`text-xs font-bold uppercase tracking-[0.2em] mb-5 ${
            isDark ? "text-white" : "text-zinc-950"
          }`}>
            Developers
          </h4>
          <ul className="flex flex-col gap-3 text-xs font-semibold">
            <li>
              <a href="https://docs.mstswap.finance" target="_blank" rel="noreferrer" className="hover:text-cyan-400 transition-colors">
                Docs
              </a>
            </li>
            <li>
              <a href="https://docs.mstswap.finance" target="_blank" rel="noreferrer" className="hover:text-cyan-400 transition-colors">
                API Integration
              </a>
            </li>
          </ul>
        </div>

        {/* Links Column 3: Community */}
        <div>
          <h4 className={`text-xs font-bold uppercase tracking-[0.2em] mb-5 ${
            isDark ? "text-white" : "text-zinc-950"
          }`}>
            Community
          </h4>
          <ul className="flex flex-col gap-3 text-xs font-semibold">
            <li>
              <a href="https://discord.gg" target="_blank" rel="noreferrer" className="hover:text-cyan-400 transition-colors">
                Discord
              </a>
            </li>
            <li>
              <a href="https://t.me" target="_blank" rel="noreferrer" className="hover:text-cyan-400 transition-colors">
                Telegram
              </a>
            </li>
            <li>
              <a href="https://x.com" target="_blank" rel="noreferrer" className="hover:text-cyan-400 transition-colors">
                X (Twitter)
              </a>
            </li>
          </ul>
        </div>

        {/* Links Column 4: Legal */}
        <div>
          <h4 className={`text-xs font-bold uppercase tracking-[0.2em] mb-5 ${
            isDark ? "text-white" : "text-zinc-950"
          }`}>
            Legal
          </h4>
          <ul className="flex flex-col gap-3 text-xs font-semibold">
            <li>
              <Link to="#" className="hover:text-cyan-400 transition-colors">
                Privacy Policy
              </Link>
            </li>
            <li>
              <Link to="#" className="hover:text-cyan-400 transition-colors">
                Terms of Service
              </Link>
            </li>
          </ul>
        </div>

      </div>

      {/* Bottom Separator & Copyright */}
      <div className={`max-w-[1280px] mx-auto mt-12 pt-8 border-t flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] ${
        isDark ? "border-white/5 text-zinc-600" : "border-zinc-200 text-zinc-400"
      }`}>
        <span>© {new Date().getFullYear()} MSTSwap. All rights reserved.</span>
        <span>Trade Smarter. Swap Faster.</span>
      </div>
    </footer>
  );
}
