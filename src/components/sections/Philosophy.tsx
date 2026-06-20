'use client';

import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';

export default function Philosophy() {
  const containerRef = useRef<HTMLDivElement>(null);
  
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"]
  });

  const opacity1 = useTransform(scrollYProgress, [0.1, 0.3], [0, 1]);
  const y1 = useTransform(scrollYProgress, [0.1, 0.3], [100, 0]);
  
  const opacity2 = useTransform(scrollYProgress, [0.2, 0.4], [0, 1]);
  const scale2 = useTransform(scrollYProgress, [0.2, 0.4], [0.8, 1]);
  
  const opacity3 = useTransform(scrollYProgress, [0.3, 0.5], [0, 1]);
  const scale3 = useTransform(scrollYProgress, [0.3, 0.5], [0.9, 1]);
  
  const opacity4 = useTransform(scrollYProgress, [0.4, 0.6], [0, 1]);

  return (
    <section ref={containerRef} className="w-full min-h-[150vh] flex flex-col items-center justify-center relative z-10 py-32 mix-blend-plus-lighter">
      <div className="max-w-[1400px] mx-auto px-8 lg:px-16 w-full text-center flex flex-col items-center">
        
        <span className="text-[10px] font-bold tracking-[0.4em] uppercase text-indigo-400 mb-20 flex items-center justify-center gap-4">
          <span className="w-12 h-px bg-indigo-500/30" />
          MANIFESTO
          <span className="w-12 h-px bg-indigo-500/30" />
        </span>

        <div className="flex flex-col items-center justify-center gap-8 max-w-5xl mx-auto">
          <motion.h2 style={{ opacity: opacity1, y: y1 }} className="text-4xl md:text-5xl lg:text-7xl font-light text-white/80 tracking-tight leading-tight">
            I don&apos;t just build software.
          </motion.h2>

          <motion.h2 style={{ opacity: opacity2, scale: scale2 }} className="text-5xl md:text-7xl lg:text-8xl font-bold text-white tracking-tighter leading-none mt-4 drop-shadow-2xl">
            I build <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400 italic">leverage.</span>
          </motion.h2>

          <motion.h2 style={{ opacity: opacity3, scale: scale3 }} className="text-4xl md:text-6xl lg:text-7xl font-light text-white/90 tracking-tight leading-tight mt-8">
            I engineer systems that <span className="font-bold text-emerald-400">scale.</span>
          </motion.h2>

          <motion.h2 style={{ opacity: opacity4 }} className="text-3xl md:text-5xl lg:text-6xl font-light text-white/70 tracking-tight leading-tight mt-12 max-w-4xl mx-auto">
            I create infrastructure that outlives trends and generates global <span className="font-bold text-amber-500 italic drop-shadow-[0_0_20px_rgba(245,158,11,0.5)]">impact.</span>
          </motion.h2>
        </div>

        <div className="mt-32 flex flex-wrap justify-center gap-8 text-[10px] font-bold tracking-[0.3em] uppercase text-white/30">
          <span>AMBITION</span>
          <span>•</span>
          <span>EXECUTION</span>
          <span>•</span>
          <span>CRAFT</span>
          <span>•</span>
          <span>LONG-TERM THINKING</span>
        </div>

      </div>
    </section>
  );
}
