'use client';

import { motion, useMotionValue, useSpring } from 'framer-motion';
import { useEffect, useState } from 'react';

export default function CustomCursor() {
  const [isHovering, setIsHovering] = useState(false);
  const cursorX = useMotionValue(-100);
  const cursorY = useMotionValue(-100);

  // Use springs for ultra-smooth movement
  const springX = useSpring(cursorX, { damping: 25, stiffness: 200, mass: 0.5 });
  const springY = useSpring(cursorY, { damping: 25, stiffness: 200, mass: 0.5 });

  useEffect(() => {
    // Only run on desktop/devices with a precise pointing device
    if (window.matchMedia('(pointer: coarse)').matches) return;

    const moveCursor = (e: MouseEvent) => {
      cursorX.set(e.clientX - 16);
      cursorY.set(e.clientY - 16);
    };

    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName.toLowerCase() === 'a' || target.tagName.toLowerCase() === 'button' || target.closest('a') || target.closest('button')) {
        setIsHovering(true);
      } else {
        setIsHovering(false);
      }
    };

    window.addEventListener('mousemove', moveCursor);
    window.addEventListener('mouseover', handleMouseOver);

    return () => {
      window.removeEventListener('mousemove', moveCursor);
      window.removeEventListener('mouseover', handleMouseOver);
    };
  }, [cursorX, cursorY]);

  // Hide on mobile via CSS
  return (
    <motion.div
      className="fixed top-0 left-0 w-8 h-8 rounded-full border border-white/40 pointer-events-none z-50 hidden md:flex items-center justify-center mix-blend-difference"
      style={{
        x: springX,
        y: springY,
      }}
      animate={{
        scale: isHovering ? 1.5 : 1,
        backgroundColor: isHovering ? 'rgba(255,255,255,1)' : 'rgba(255,255,255,0)',
      }}
      transition={{ type: 'tween', ease: 'easeOut', duration: 0.2 }}
    >
      <motion.div 
        className="w-1 h-1 bg-white rounded-full"
        animate={{ opacity: isHovering ? 0 : 1 }}
      />
    </motion.div>
  );
}
