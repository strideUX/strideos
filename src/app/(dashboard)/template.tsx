'use client';

import { motion, AnimatePresence } from 'motion/react';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function Template({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isMounted, setIsMounted] = useState(false);
  const isDev = process.env.NODE_ENV !== 'production';

  // Defer enabling animations until after first client mount to avoid
  // React Strict Mode development double-mount exit/enter flashes.
  useEffect(() => {
    setIsMounted(true);
  }, []);
  
  if (!isMounted) {
    return (
      <main className="flex flex-1 flex-col">
        {children}
      </main>
    );
  }

  return (
    <AnimatePresence mode={isDev ? 'sync' : 'wait'} initial={false}>
      <motion.main
        key={pathname}
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        {...(!isDev ? { exit: { opacity: 0, y: -4 } } : {})}
        transition={{ 
          duration: 0.2,
          ease: "easeInOut"
        }}
        className="flex flex-1 flex-col"
      >
        {children}
      </motion.main>
    </AnimatePresence>
  );
}