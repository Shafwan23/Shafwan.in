'use client';

import { motion, AnimatePresence, useTime, useTransform, useMotionValue, useReducedMotion } from 'framer-motion';
import { useAppStore } from '@/store/useAppStore';
import { useEffect, useState } from 'react';

const portals = [
  { id: 'portfolio', label: 'Portfolio', href: 'https://portfolio.shafwan.in', orbit: 3, angle: 315, description: 'Structured, precise, geometric showcase.', color: 'bg-white', glow: 'shadow-[0_0_20px_rgba(255,255,255,0.8)]' },
  { id: 'projects', label: 'Projects', href: 'https://projects.shafwan.in', orbit: 2, angle: 45, description: 'Dynamic, energetic, builder-focused.', color: 'bg-amber-400', glow: 'shadow-[0_0_20px_rgba(251,191,36,0.6)]' },
  { id: 'cv', label: 'CV', href: 'https://cv.shafwan.in', orbit: 1, angle: 135, description: 'Professional, elegant, minimal history.', color: 'bg-zinc-300', glow: 'shadow-[0_0_20px_rgba(212,212,216,0.4)]' },
  { id: 'blog', label: 'Blog', href: 'https://blog.shafwan.in', orbit: 3, angle: 90, description: 'Thoughtful, editorial, intellectual essays.', color: 'bg-rose-400', glow: 'shadow-[0_0_20px_rgba(251,113,133,0.5)]' },
  { id: 'labs', label: 'Labs', href: 'https://labs.shafwan.in', orbit: 2, angle: 225, description: 'Experimental, creative, exploratory code.', color: 'bg-emerald-400', glow: 'shadow-[0_0_20px_rgba(52,211,153,0.6)]' },
  { id: 'contact', label: 'Contact', href: 'https://contact.shafwan.in', orbit: 1, angle: 270, description: 'Clean, personal, welcoming communication.', color: 'bg-blue-400', glow: 'shadow-[0_0_20px_rgba(96,165,250,0.5)]' },
];

const orbitRadii = [140, 240, 360];

export default function SpatialNav() {
  const { activePortal, setActivePortal } = useAppStore();
  const [isTransitioning, setIsTransitioning] = useState(false);
  const time = useTime();
  const prefersReducedMotion = useReducedMotion();
  
  // Conditionally disable rotation based on a11y preferences
  const dynamicRotation = useTransform(time, [0, 120000], [0, prefersReducedMotion ? 0 : 360], { clamp: false });
  const invertedRotation = useTransform(dynamicRotation, r => -r);
  
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  useEffect(() => {
    if (prefersReducedMotion) return;
    const handleMouseMove = (e: MouseEvent) => {
      mouseX.set((e.clientX / window.innerWidth - 0.5) * 50);
      mouseY.set((e.clientY / window.innerHeight - 0.5) * 50);
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [mouseX, mouseY, prefersReducedMotion]);

  const handlePortalClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    if (prefersReducedMotion) {
      window.open(href, '_blank');
      return;
    }
    setIsTransitioning(true);
    setTimeout(() => {
      window.open(href, '_blank');
      setIsTransitioning(false);
      setActivePortal(null);
    }, 1200);
  };

  return (
    <motion.div 
      className="relative w-full max-w-[800px] aspect-square mx-auto mt-12 flex items-center justify-center perspective-1000 scale-50 sm:scale-75 md:scale-100 transition-transform duration-500"
      animate={{ scale: isTransitioning ? 5 : undefined, opacity: isTransitioning ? 0 : 1 }}
      transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
      aria-label="Spatial Navigation Constellation"
    >
      <motion.svg style={{ rotate: dynamicRotation, x: mouseX, y: mouseY }} className="absolute inset-0 w-full h-full pointer-events-none opacity-20" viewBox="-400 -400 800 800">
        {orbitRadii.map((r, i) => (
          <circle key={i} cx="0" cy="0" r={r} fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="4 8" className="text-muted/50" />
        ))}
        {activePortal && portals.map(p => {
           if (p.id !== activePortal) return null;
           const rad = (p.angle * Math.PI) / 180;
           return (
             <motion.line 
               key={`line-${p.id}`}
               x1="0" y1="0" x2={Math.cos(rad) * orbitRadii[p.orbit - 1]} y2={Math.sin(rad) * orbitRadii[p.orbit - 1]} 
               stroke="currentColor" strokeWidth="1" className="text-white/40"
               initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
             />
           )
        })}
      </motion.svg>

      <div className="absolute z-0 flex flex-col items-center justify-center pointer-events-none">
        <motion.div 
          animate={prefersReducedMotion ? {} : { scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }} 
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
          className="w-24 h-24 rounded-full bg-foreground blur-[30px]"
        />
        <div className="absolute w-2 h-2 rounded-full bg-foreground shadow-[0_0_20px_rgba(255,255,255,1)]" />
      </div>

      <motion.div style={{ rotate: dynamicRotation }} className="absolute inset-0 w-full h-full pointer-events-none">
        {portals.map((portal, i) => {
          const isActive = activePortal === portal.id;
          const isDimmed = activePortal !== null && !isActive;
          const rad = (portal.angle * Math.PI) / 180;
          const radius = orbitRadii[portal.orbit - 1];

          return (
            <motion.div
              key={portal.id}
              className="absolute z-10 flex flex-col items-center justify-center pointer-events-auto"
              style={{ left: '50%', top: '50%', x: Math.cos(rad) * radius, y: Math.sin(rad) * radius }}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: isDimmed ? 0.3 : 1 }}
              transition={prefersReducedMotion ? { duration: 0 } : { type: 'spring', stiffness: 300, damping: 30, delay: i * 0.1 }}
              onMouseEnter={() => setActivePortal(portal.id)}
              onMouseLeave={() => setActivePortal(null)}
            >
              <motion.a 
                href={portal.href} 
                onClick={(e) => handlePortalClick(e, portal.href)}
                style={{ rotate: invertedRotation }}
                className="relative group flex flex-col items-center"
                aria-label={`Navigate to ${portal.label}`}
              >
                <motion.div animate={{ scale: isActive ? 1.8 : 1 }} className={`w-3 h-3 rounded-full ${portal.color} transition-all duration-500 relative z-20 ${isActive ? portal.glow : 'shadow-none'}`} />
                <motion.div className="absolute w-12 h-12 rounded-full border border-white/20 -mt-[1.1rem]" animate={{ scale: isActive ? 1.4 : 0, opacity: isActive ? 1 : 0 }} />
                <div className="absolute top-6 flex flex-col items-center whitespace-nowrap">
                  <span className={`text-xs font-semibold tracking-[0.15em] uppercase transition-colors duration-300 ${isActive ? 'text-foreground' : 'text-muted'}`}>{portal.label}</span>
                  <AnimatePresence>
                    {isActive && (
                      <motion.div initial={{ opacity: 0, y: -5, filter: 'blur(5px)' }} animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }} exit={{ opacity: 0, filter: 'blur(5px)' }} className="mt-2 glass px-4 py-2 rounded-md">
                        <p className="text-[10px] text-muted/80 font-light tracking-wide max-w-[150px] whitespace-normal text-center">{portal.description}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.a>
            </motion.div>
          );
        })}
      </motion.div>
    </motion.div>
  );
}
