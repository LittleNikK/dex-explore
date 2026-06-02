import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Sun, Moon, Search, ChevronDown } from "lucide-react";
import { useAccount, useConnect, useDisconnect } from "wagmi";
import { MstBrandLogo, TokenLogo } from "../components/swap/TokenLogos";
import { SwapWidget } from "../components/swap/SwapWidget";
import { useThemeStore } from "../store/themeStore";

export default function SwapPage() {
  const { theme, toggleTheme } = useThemeStore();
  const [searchFocused, setSearchFocused] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Real WAGMI account connections
  const { address, isConnected } = useAccount();
  const { connectors, connect } = useConnect();
  const { disconnect } = useDisconnect();

  const searchInputRef = useRef<HTMLInputElement>(null);

  // Focus search input when user presses "/"
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "/" && document.activeElement?.tagName !== "INPUT" && document.activeElement?.tagName !== "TEXTAREA") {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleConnectWallet = () => {
    if (isConnected) {
      disconnect();
    } else {
      const metaMaskConnector =
        connectors.find((item) => item.name.toLowerCase().includes("metamask")) ??
        connectors.find((item) => item.id === "injected");

      if (metaMaskConnector) {
        connect({ connector: metaMaskConnector });
      } else {
        const first = connectors[0];
        if (first) connect({ connector: first });
      }
    }
  };

  const walletAddress = address ? `${address.slice(0, 6)}...${address.slice(-4)}` : null;
  const isDark = theme === "dark";

  return (
    <div
      className={`min-h-[calc(100vh-72px)] relative font-sans transition-colors duration-300 ease-in-out select-none overflow-x-hidden`}
    >

      {/* Blurred glow background behind the centerpiece swap card for light mode */}
      {!isDark && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
          <motion.div
            animate={{
              scale: [1, 1.1, 1],
              x: [0, 20, 0],
              y: [0, -20, 0],
            }}
            transition={{
              duration: 12,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="absolute left-[50%] top-[25%] -translate-x-1/2 w-[480px] h-[480px] rounded-full blur-[140px] opacity-20 bg-gradient-to-r from-[#FF81C5] to-[#B07EFF]"
          />
        </div>
      )}

      {/* Main swap card positioning viewport */}
      <main className="relative z-10 px-4 pt-16 md:pt-24 pb-20 max-w-[1200px] mx-auto flex flex-col items-center">
        <SwapWidget theme={theme} />
      </main>

      {/* Footer */}
      <footer className="w-full text-center py-6 text-xs font-semibold select-none z-10 relative pointer-events-none">
      </footer>
    </div>
  );
}
