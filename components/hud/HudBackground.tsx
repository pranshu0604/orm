'use client';

import { motion } from 'framer-motion';
import { ReactNode } from 'react';

export default function HudBackground({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-screen bg-[#030712] text-white overflow-hidden">
      <motion.div
        className="fixed inset-0 grid-bg pointer-events-none"
        style={{ opacity: 0.06 }}
        animate={{ opacity: [0.06, 0.1, 0.06] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
      />
      <div className="fixed inset-0 bg-gradient-to-b from-blue-900/5 via-transparent to-purple-900/10 pointer-events-none" />
      <div className="fixed inset-0 noise-overlay pointer-events-none" />
      <div className="relative z-10">{children}</div>
    </div>
  );
}
