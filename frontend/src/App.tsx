import { Suspense, useState } from "react";
import { WagmiProvider } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Link, Route, Routes, useLocation } from "react-router-dom";
import { wagmiConfig } from "./config/wagmi";
import ParticleBackground from "./components/ui/ParticleBackground";

// Import custom pages
import LandingPage from "./pages/LandingPage";
import SwapPage from "./pages/SwapPage";
import TrendingPage from "./pages/TrendingPage";
import TransferPage from "./pages/TransferPage";
import ExplorePage from "./pages/ExplorePage";
import AboutPage from "./pages/AboutPage";
import ContactPage from "./pages/ContactPage";
import LiquidityPage from "./pages/LiquidityPage";
import WalletPage from "./pages/WalletPage";

import { Menu, X, Flame } from "lucide-react";

const queryClient = new QueryClient();

function Navigation() {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  const links = [
    { to: "/", label: "Home" },
    { to: "/swap", label: "Swap" },
    { to: "/trending", label: "Trending" },
    { to: "/transfer", label: "Transfer" },
    { to: "/explore", label: "Explore" },
    { to: "/liquidity", label: "Liquidity" },
    { to: "/wallet", label: "Wallet" },
    { to: "/about", label: "About" },
    { to: "/contact", label: "Contact" }
  ];

  return (
    <nav className="sticky top-0 z-50 border-b border-zinc-900 bg-black/60 backdrop-blur-xl transition px-4 py-4 max-w-6xl mx-auto rounded-b-2xl">
      <div className="flex items-center justify-between">
        {/* Logo and Name */}
        <Link to="/" className="flex items-center gap-2 group">
          <img 
            src="/logo.png" 
            alt="MSTSwap Logo" 
            className="h-8 w-8 object-contain group-hover:scale-110 transition duration-300"
          />
          <span className="font-extrabold uppercase tracking-widest text-sm bg-gradient-to-r from-pink-500 to-orange-500 bg-clip-text text-transparent group-hover:text-neon-pink">
            MSTSWAP
          </span>
        </Link>

        {/* Desktop Links */}
        <div className="hidden md:flex items-center gap-6">
          {links.map((link) => {
            const isActive = location.pathname === link.to;
            return (
              <Link 
                key={link.to} 
                to={link.to}
                className={`text-xs uppercase tracking-wider font-semibold transition ${isActive ? "text-pink-500 font-extrabold text-neon-pink" : "text-zinc-400 hover:text-white"}`}
              >
                {link.label}
              </Link>
            );
          })}
        </div>

        {/* Launch DApp CTA on Desktop */}
        <div className="hidden md:block">
          <Link 
            to="/swap" 
            className="flex items-center gap-1.5 rounded-lg gradient-gta px-4 py-2 text-xs font-semibold text-white transition hover:scale-103 shadow-md shadow-pink-500/10"
          >
            <Flame size={12} className="animate-pulse" />
            Launch App
          </Link>
        </div>

        {/* Mobile menu trigger */}
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className="md:hidden text-zinc-400 hover:text-white transition"
        >
          {isOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile Links Dropdown */}
      {isOpen && (
        <div className="md:hidden mt-4 pt-4 border-t border-zinc-900 flex flex-col gap-3">
          {links.map((link) => {
            const isActive = location.pathname === link.to;
            return (
              <Link 
                key={link.to} 
                to={link.to}
                onClick={() => setIsOpen(false)}
                className={`text-xs uppercase tracking-wider font-semibold transition py-1 ${isActive ? "text-pink-500 text-neon-pink" : "text-zinc-400 hover:text-white"}`}
              >
                {link.label}
              </Link>
            );
          })}
          <Link 
            to="/swap"
            onClick={() => setIsOpen(false)}
            className="w-full flex items-center justify-center gap-1.5 rounded-lg gradient-gta py-3 text-xs font-semibold text-white transition mt-2"
          >
            <Flame size={12} className="animate-pulse" />
            Launch App
          </Link>
        </div>
      )}
    </nav>
  );
}

function MainLayout() {
  return (
    <div className="relative min-h-screen text-white select-none">
      {/* Global Canvas Particle Background */}
      <ParticleBackground />

      {/* Navigation Navbar */}
      <Navigation />

      {/* Page Routing */}
      <Suspense fallback={<div className="flex h-[80vh] items-center justify-center text-xs font-semibold uppercase tracking-wider text-zinc-500 animate-pulse">Loading...</div>}>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/swap" element={<SwapPage />} />
          <Route path="/trending" element={<TrendingPage />} />
          <Route path="/transfer" element={<TransferPage />} />
          <Route path="/explore" element={<ExplorePage />} />
          <Route path="/liquidity" element={<LiquidityPage />} />
          <Route path="/wallet" element={<WalletPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/contact" element={<ContactPage />} />
        </Routes>
      </Suspense>
    </div>
  );
}

export default function App() {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <MainLayout />
        </BrowserRouter>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
