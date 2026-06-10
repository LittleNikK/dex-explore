import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Quote, Star } from "lucide-react";

interface Testimonial {
  name: string;
  handle: string;
  role: string;
  quote: string;
  rating: number;
  initials: string;
  avatarGradient: string;
}

export default function Testimonials() {
  const isDark = false; // Forced false for white background landing page
  const [activeIndex, setActiveIndex] = useState(0);
  const [direction, setDirection] = useState(0); // -1 for left, 1 for right

  const testimonials: Testimonial[] = [
    {
      name: "Alex Rivers",
      handle: "@alex_crypto_trade",
      role: "DeFi Yield Farmer",
      quote: "MSTSwap aggregator has completely changed my daily routine. The smart routing splits have saved me thousands of dollars on slippage across large trades. Execution is instant, and fees are always optimized.",
      rating: 5,
      initials: "AR",
      avatarGradient: "from-cyan-400 to-blue-500"
    },
    {
      name: "Sarah Chen",
      handle: "@schen_web3",
      role: "Protocol Engineer",
      quote: "I love the clean UX and deep glassmorphic interface. It feels like a premium DeFi tool. The non-custodial nature gives me peace of mind, and the router consistently matches or beats other aggregators.",
      rating: 5,
      initials: "SC",
      avatarGradient: "from-violet-500 to-indigo-500"
    },
    {
      name: "Marcus Vane",
      handle: "@marcusv_capital",
      role: "Crypto Portfolio Manager",
      quote: "The analytics dashboards and portfolio tracker are extremely polished. It's incredibly convenient to monitor my liquidity pools and current position rewards all in one hub. Highly recommended DEX!",
      rating: 5,
      initials: "MV",
      avatarGradient: "from-amber-400 to-orange-500"
    }
  ];

  // Auto rotate testimonials
  useEffect(() => {
    const timer = setInterval(() => {
      handleNext();
    }, 8000);
    return () => clearInterval(timer);
  }, [activeIndex]);

  const handlePrev = () => {
    setDirection(-1);
    setActiveIndex((prev) => (prev === 0 ? testimonials.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setDirection(1);
    setActiveIndex((prev) => (prev === testimonials.length - 1 ? 0 : prev + 1));
  };

  // Slide animation variants
  const slideVariants = {
    enter: (dir: number) => ({
      x: dir > 0 ? 100 : -100,
      opacity: 0
    }),
    center: {
      x: 0,
      opacity: 1,
      transition: {
        x: { type: "spring", stiffness: 300, damping: 30 },
        opacity: { duration: 0.3 }
      }
    },
    exit: (dir: number) => ({
      x: dir < 0 ? 100 : -100,
      opacity: 0,
      transition: {
        x: { type: "spring", stiffness: 300, damping: 30 },
        opacity: { duration: 0.3 }
      }
    })
  };

  const current = testimonials[activeIndex];

  return (
    <section className="relative py-24 overflow-hidden border-b border-zinc-200/50">
      <div className="max-w-[800px] mx-auto px-6 relative z-10 text-center">
        
        {/* Section Heading */}
        <div className="mb-14">
          <span className="inline-block text-xs font-bold uppercase tracking-[0.2em] mb-3 text-cyan-600">
            Community Feedback
          </span>
          <h2 className="text-3xl md:text-4xl font-extrabold font-display tracking-tight text-zinc-950">
            Trusted by Traders
          </h2>
        </div>

        {/* Carousel Card Container */}
        <div className="relative min-h-[340px] flex items-center justify-center">
          
          <AnimatePresence initial={false} custom={direction} mode="wait">
            <motion.div
              key={activeIndex}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              className="w-full glass rounded-[2.5rem] border p-8 md:p-12 shadow-[0_12px_40px_rgba(0,0,0,0.05)] flex flex-col items-center gap-6 relative bg-white border-zinc-200"
            >
              {/* Quote Icon watermark */}
              <div className="absolute top-8 left-8 text-cyan-500/5 pointer-events-none">
                <Quote size={80} />
              </div>

              {/* Star Rating */}
              <div className="flex gap-1 text-amber-400">
                {Array.from({ length: current.rating }).map((_, i) => (
                  <Star key={i} size={16} fill="currentColor" />
                ))}
              </div>

              {/* Testimonial Quote */}
              <p className="text-base md:text-lg leading-relaxed italic max-w-2xl font-sans relative z-10 text-zinc-800">
                "{current.quote}"
              </p>

              {/* User Bio Details */}
              <div className="flex items-center gap-4 mt-4">
                {/* Custom Initials Avatar */}
                <div className={`h-12 w-12 rounded-full bg-gradient-to-r ${current.avatarGradient} p-[1px] shadow-lg flex items-center justify-center text-white shrink-0`}>
                  <div className="h-full w-full rounded-full bg-white text-zinc-950 flex items-center justify-center font-bold text-sm tracking-wider">
                    {current.initials}
                  </div>
                </div>

                <div className="text-left leading-none">
                  <h4 className="text-base font-extrabold font-display text-zinc-950">
                    {current.name}
                  </h4>
                  <span className="text-[11px] font-bold font-mono text-cyan-600 block mt-1">
                    {current.handle}
                  </span>
                  <span className="text-[10px] font-semibold text-zinc-500 block mt-1">
                    {current.role}
                  </span>
                </div>
              </div>

            </motion.div>
          </AnimatePresence>

          {/* Navigation Arrows */}
          <button
            onClick={handlePrev}
            className="absolute left-[-20px] md:left-[-60px] p-3 rounded-full border transition-all hover:scale-105 active:scale-95 z-20 bg-white border-zinc-200 text-zinc-600 hover:text-zinc-950 hover:border-zinc-300"
            aria-label="Previous testimonial"
          >
            <ChevronLeft size={20} />
          </button>
          
          <button
            onClick={handleNext}
            className="absolute right-[-20px] md:right-[-60px] p-3 rounded-full border transition-all hover:scale-105 active:scale-95 z-20 bg-white border-zinc-200 text-zinc-600 hover:text-zinc-950 hover:border-zinc-300"
            aria-label="Next testimonial"
          >
            <ChevronRight size={20} />
          </button>

        </div>

        {/* Indicator dots */}
        <div className="flex justify-center gap-2 mt-8">
          {testimonials.map((_, index) => (
            <button
              key={index}
              onClick={() => {
                setDirection(index > activeIndex ? 1 : -1);
                setActiveIndex(index);
              }}
              className={`h-2.5 rounded-full transition-all duration-300 ${
                index === activeIndex
                  ? "w-8 bg-cyan-500"
                  : "w-2.5 bg-zinc-300 hover:bg-zinc-400"
              }`}
              aria-label={`Go to testimonial ${index + 1}`}
            />
          ))}
        </div>

      </div>
    </section>
  );
}
