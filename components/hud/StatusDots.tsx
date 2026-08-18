'use client';

import { motion } from 'framer-motion';

const COLORS = ['bg-cyan-400', 'bg-blue-400', 'bg-purple-400'];

export default function StatusDots({ vertical = false }: { vertical?: boolean }) {
  return (
    <div className={`flex ${vertical ? 'flex-col' : ''} gap-1`}>
      {COLORS.map((color, i) => (
        <motion.div
          key={color}
          className={`w-1.5 h-1.5 rounded-full ${color}`}
          animate={{ opacity: i % 2 === 0 ? [1, 0.3, 1] : [0.3, 1, 0.3] }}
          transition={{ duration: 2, repeat: Infinity, delay: i * 0.3 }}
        />
      ))}
    </div>
  );
}
