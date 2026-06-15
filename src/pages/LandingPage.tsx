import { useEffect } from "react";
import Navbar from "../components/landing/Navbar";
import Hero from "../components/landing/Hero";
import Features from "../components/landing/Features";
import HowItWorks from "../components/landing/HowItWorks";
import Testimonials from "../components/landing/Testimonials";
import FAQ from "../components/landing/FAQ";
import CTA from "../components/landing/CTA";
import Footer from "../components/landing/Footer";
import DexBackground from "../components/landing/background";
import { useThemeStore } from "../store/themeStore";

export default function LandingPage() {
  const { theme } = useThemeStore();
  const isDark = theme === "dark";

  // Sync page metadata titles for SEO and premium feel
  useEffect(() => {
    const originalTitle = document.title;
    document.title = "MSTSwap | Trade Smarter. Swap Faster.";
    
    // Smooth scroll top on enter
    window.scrollTo({ top: 0, behavior: "smooth" });

    return () => {
      document.title = originalTitle;
    };
  }, []);

  return (
    <div className={`w-full flex flex-col min-h-screen transition-colors duration-300 relative ${
      isDark ? "bg-zinc-950 text-white" : "bg-white text-zinc-900"
    }`}>
      {/* Interactive Network Particle Background */}
      <DexBackground />

      {/* Sticky Scroll Navigation Header */}
      <Navbar />

      {/* Main Sections Body */}
      <main className="flex-1 w-full relative z-10">
        <Hero />
        <Features />
        <HowItWorks />
        <Testimonials />
        <FAQ />
        <CTA />
      </main>

      {/* Footer Section links */}
      <Footer />
    </div>
  );
}
