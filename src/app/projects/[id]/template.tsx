'use client';

import { motion, AnimatePresence } from 'motion/react';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

export default function Template({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const prevPathname = useRef(pathname);
  const [direction, setDirection] = useState<'forward' | 'back'>('forward');

  useEffect(() => {
    // Determine navigation direction
    // If coming from dashboard (e.g., /projects, /my-work, etc.) to project detail, it's forward
    // If going from project detail back to dashboard, it's back
    const isGoingToProject = pathname.includes('/projects/') && !prevPathname.current.includes('/projects/');
    const isLeavingProject = !pathname.includes('/projects/') && prevPathname.current.includes('/projects/');
    
    if (isGoingToProject) {
      setDirection('forward');
    } else if (isLeavingProject) {
      setDirection('back');
    }
    
    prevPathname.current = pathname;
  }, [pathname]);

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={pathname}
        initial={{ 
          opacity: 0, 
          x: direction === 'forward' ? -40 : 40 
        }}
        animate={{ 
          opacity: 1, 
          x: 0 
        }}
        exit={{ 
          opacity: 0, 
          x: direction === 'forward' ? 40 : -40 
        }}
        transition={{ 
          duration: 0.3,
          ease: [0.25, 0.1, 0.25, 1],
          opacity: { duration: 0.2 }
        }}
        className="h-full"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}