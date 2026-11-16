'use client';

import { motion } from 'framer-motion';
import { ReactNode } from 'react';

const VARIANTS = {
  primary: 'border-cyan-500/40 hover:border-cyan-400/60 text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10',
  danger: 'border-red-500/30 hover:border-red-400/50 text-red-400 hover:text-red-300 hover:bg-red-500/10',
  ghost: 'border-white/10 hover:border-white/20 text-gray-400 hover:text-white hover:bg-white/5',
} as const;

export default function TerminalButton({
  children,
  onClick,
  type = 'button',
  disabled = false,
  loading = false,
  variant = 'primary',
  className = '',
}: {
  children: ReactNode;
  onClick?: () => void;
  type?: 'button' | 'submit';
  disabled?: boolean;
  loading?: boolean;
  variant?: keyof typeof VARIANTS;
  className?: string;
}) {
  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`relative px-4 py-2 bg-[#0a0f1e]/60 border transition-colors duration-300 font-mono text-xs uppercase tracking-widest disabled:opacity-40 disabled:cursor-not-allowed ${VARIANTS[variant]} ${className}`}
      whileHover={disabled || loading ? {} : { scale: 1.02 }}
      whileTap={disabled || loading ? {} : { scale: 0.98 }}
    >
      <span className="flex items-center justify-center gap-2">
        <span className="opacity-50">[</span>
        {loading ? (
          <motion.span animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 1, repeat: Infinity }}>
            ...
          </motion.span>
        ) : (
          children
        )}
        <span className="opacity-50">]</span>
      </span>
    </motion.button>
  );
}
