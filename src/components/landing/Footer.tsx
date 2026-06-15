import { Link } from "react-router-dom";
import { MessageSquare, Twitter, Send } from "lucide-react";
import { useThemeStore } from "../../store/themeStore";

export default function Footer() {
  const { theme } = useThemeStore();
  const isDark = theme === "dark";

  return (
    <footer className={`border-t py-16 px-6 overflow-hidden backdrop-blur-md ${isDark ? "bg-zinc-950/40 border-white/5 text-zinc-400" : "bg-white/40 border-zinc-200 text-zinc-600"
      }`}>
      <div className="max-w-[1280px] mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">

        {/* Brand Column */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <Link to="/" className="flex items-center gap-2.5">
            <span className={`text-lg font-bold font-sans tracking-wider ${isDark ? "text-white" : "text-zinc-950"
              }`}>
              MSTSwap
            </span>
          </Link>

          <p className="text-xs leading-relaxed max-w-sm">
            MSTSwap is the leading decentralized exchange aggregator. We scan multiple routing paths and liquidity pools to deliver optimized swap rates with low slippage and minimal fees.
          </p>

          {/* Social Icons */}
          <div className="flex items-center gap-3 mt-2">
            {[
              { icon: <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z" /></svg>, label: "Twitter", href: "https://x.com" },
              { icon: <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" /></svg>, label: "GitHub", href: "https://github.com" },
              { icon: <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.094 13.094 0 0 1-1.873-.894.077.077 0 0 1-.008-.128c.126-.093.252-.19.372-.287a.075.075 0 0 1 .077-.011c3.92 1.793 8.18 1.793 12.061 0a.073.073 0 0 1 .078.009c.12.099.246.195.373.289a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.894.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.156-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.156 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.156-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.156 2.418z" /></svg>, label: "Discord", href: "https://discord.gg" }
            ].map((social) => (
              <a
                key={social.label}
                href={social.href}
                target="_blank"
                rel="noreferrer"
                aria-label={social.label}
                className={`p-2.5 rounded-full border transition-all ${isDark
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
          <h4 className={`text-xs font-bold uppercase tracking-[0.2em] mb-5 ${isDark ? "text-white" : "text-zinc-950"
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


        {/* Links Column 3: Community */}
        <div>
          <h4 className={`text-xs font-bold uppercase tracking-[0.2em] mb-5 ${isDark ? "text-white" : "text-zinc-950"
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
          <h4 className={`text-xs font-bold uppercase tracking-[0.2em] mb-5 ${isDark ? "text-white" : "text-zinc-950"
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
      <div className={`max-w-[1280px] mx-auto mt-12 pt-8 border-t flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] ${isDark ? "border-white/5 text-zinc-600" : "border-zinc-200 text-zinc-400"
        }`}>
        <span>© {new Date().getFullYear()} MSTSwap. All rights reserved.</span>
        <span>Trade Smarter. Swap Faster.</span>
      </div>
    </footer>
  );
}
