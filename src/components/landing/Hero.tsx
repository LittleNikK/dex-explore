import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

export default function Hero() {
  return (
    <section className="relative min-h-[85vh] flex flex-col items-center justify-center pt-36 pb-20 overflow-hidden bg-white">
      {/* Background Decorative Grid and Glows */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        {/* Ambient Radial Lights */}
        <div className="absolute top-[-10%] left-[15%] w-[600px] h-[600px] bg-gradient-to-br from-cyan-200/40 to-transparent rounded-full blur-[140px]" />
        <div className="absolute bottom-[5%] right-[15%] w-[650px] h-[650px] bg-gradient-to-br from-indigo-200/30 to-transparent rounded-full blur-[140px]" />
        <div className="absolute top-[30%] left-[50%] -translate-x-1/2 w-[500px] h-[500px] bg-gradient-to-br from-blue-100/30 to-transparent rounded-full blur-[120px]" />

        {/* Elegant Dot Matrix Grid */}
        <div 
          className="absolute inset-0 opacity-[0.07]" 
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, black 1px, transparent 0)`,
            backgroundSize: '32px 32px'
          }}
        />
        
        {/* Subtly moving light stream */}
        <motion.div
          animate={{
            x: ["-100%", "100%"],
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: "linear",
          }}
          className="absolute top-[25%] left-0 w-[60%] h-[1px] bg-gradient-to-r from-transparent via-cyan-500/15 to-transparent"
        />
      </div>

      <div className="max-w-[1280px] w-full mx-auto px-6 flex flex-col items-center justify-center text-center relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col items-center justify-center max-w-4xl"
        >
          {/* Centered Premium Headline */}
          <h1 className="text-5xl sm:text-7xl md:text-8xl font-black tracking-[-0.04em] leading-[1.05] mb-12 text-zinc-900 font-display">
            Swap crypto tokens <br />
            <span className="relative inline-block text-transparent bg-clip-text bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 pb-2">
              at the best rates
            </span>
          </h1>

          {/* Centered Interactive Action Button */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="mt-2"
          >
            <div className="relative group">
              {/* Premium Glow Aura (Behind the button) */}
              <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-500 opacity-20 blur-md group-hover:opacity-40 transition-opacity duration-300 pointer-events-none" />

              <Link
                to="/swap"
                className="relative inline-flex items-center justify-center px-8 py-3.5 sm:px-10 sm:py-4 rounded-2xl font-extrabold font-sans text-base sm:text-lg text-white bg-black transition-all duration-300 shadow-[0_10px_30px_rgba(0,0,0,0.12)] hover:shadow-[0_14px_42px_rgba(0,0,0,0.22)] hover:scale-[1.02] active:scale-[0.98] overflow-hidden"
              >
                {/* Custom Gradient Background Overlay */}
                <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-zinc-900 to-black pointer-events-none" />
                
                {/* Inner shiny border */}
                <div className="absolute inset-0 rounded-2xl border border-white/10 pointer-events-none" />
                
                {/* Shimmer line scanning on hover */}
                <div className="absolute inset-0 w-[200%] h-full bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 ease-out pointer-events-none" />

                <span className="relative z-10 flex items-center gap-2.5 tracking-wide">
                  Get started
                  <ArrowRight size={18} className="transition-transform duration-300 group-hover:translate-x-1.5" />
                </span>
              </Link>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
