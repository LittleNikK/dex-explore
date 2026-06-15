import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { useThemeStore } from "../../store/themeStore";

export default function Hero() {
  const { theme } = useThemeStore();
  const isDark = theme === "dark";

  return (
    <section className={`relative min-h-[85vh] flex flex-col items-center justify-center pt-36 pb-20 overflow-hidden transition-colors duration-300 ${isDark ? "text-white" : "text-zinc-900"
      }`}>
      {/* Background Decorative Glows */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        {/* Ambient Radial Lights */}
        <div className={`absolute top-[-10%] left-[15%] w-[600px] h-[600px] rounded-full blur-[140px] transition-colors duration-300 ${isDark ? "bg-gradient-to-br from-cyan-500/10 to-transparent" : "bg-gradient-to-br from-cyan-200/40 to-transparent"
          }`} />
        <div className={`absolute bottom-[5%] right-[15%] w-[650px] h-[650px] rounded-full blur-[140px] transition-colors duration-300 ${isDark ? "bg-gradient-to-br from-indigo-500/10 to-transparent" : "bg-gradient-to-br from-indigo-200/30 to-transparent"
          }`} />
        <div className={`absolute top-[30%] left-[50%] -translate-x-1/2 w-[500px] h-[500px] rounded-full blur-[120px] transition-colors duration-300 ${isDark ? "bg-gradient-to-br from-blue-500/5 to-transparent" : "bg-gradient-to-br from-blue-100/30 to-transparent"
          }`} />

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
          className={`absolute top-[25%] left-0 w-[60%] h-[1px] bg-gradient-to-r from-transparent via-cyan-500/${isDark ? "30" : "15"} to-transparent`}
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
          <h1
            className={`text-[35px] sm:text-[56px] md:text-[72px] font-black tracking-[-0.05em] leading-[0.95] mb-12 transition-colors duration-300 ${isDark ? "text-zinc-50" : "text-zinc-900"
              }`}
            style={{ fontFamily: '"Poppins", "Helvetica Neue", Helvetica, Roboto, Arial, sans-serif' }}
          >
            Swap crypto tokens <br />
            <span className={`relative inline-block mt-4 pb-2 transition-colors duration-300 ${isDark ? "text-white" : "text-black"}`}>
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
            <div className="gs-wrapper">
              <div className="gs-link-wrapper">
                <Link to="/swap" className="gs-btn">
                  Get started
                </Link>
                <div className="gs-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 268.832 268.832">
                    <path d="M265.17 125.577l-80-80c-4.88-4.88-12.796-4.88-17.677 0-4.882 4.882-4.882 12.796 0 17.678l58.66 58.66H12.5c-6.903 0-12.5 5.598-12.5 12.5 0 6.903 5.597 12.5 12.5 12.5h213.654l-58.66 58.662c-4.88 4.882-4.88 12.796 0 17.678 2.44 2.44 5.64 3.66 8.84 3.66s6.398-1.22 8.84-3.66l79.997-80c4.883-4.882 4.883-12.796 0-17.678z" />
                  </svg>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
