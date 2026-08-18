'use client';

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { SignInButton, SignUpButton } from '@clerk/nextjs';
import TrueFocus from '../TrueFocus';
import TerminalButton from '@/components/hud/TerminalButton';

// Floating particle component
function Particle({ delay, size, left, duration }: { delay: number; size: number; left: string; duration: number }) {
  return (
    <motion.div
      className="absolute rounded-full bg-gradient-to-r from-blue-500/20 to-purple-500/20 blur-sm"
      style={{ width: size, height: size, left, bottom: '-20px' }}
      animate={{
        y: [0, -window?.innerHeight || -800],
        opacity: [0, 0.8, 0.8, 0],
        scale: [0.8, 1, 1.2, 0.9],
      }}
      transition={{ duration, repeat: Infinity, delay, ease: 'easeInOut' }}
    />
  );
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.2 } },
} as const;

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
} as const;

const FEATURES = [
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
    title: 'Real-time X Monitoring',
    description: 'Track every mention, reply, and quote on X instantly',
    code: '01',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
      </svg>
    ),
    title: 'AI-Powered Analysis',
    description: 'Understand sentiment and identify reputation risks',
    code: '02',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
      </svg>
    ),
    title: 'Tweet Intelligence',
    description: 'Optimize your content strategy with data-driven insights',
    code: '03',
  },
];

export default function HomeLanding() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="relative min-h-screen bg-[#030712] text-white overflow-hidden">
      {/* Animated grid background */}
      <motion.div
        className="absolute inset-0 grid-bg"
        style={{ opacity: 0.08 }}
        animate={mounted ? { opacity: [0.08, 0.15, 0.08] } : {}}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut', repeatType: 'loop' }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-blue-900/10 via-transparent to-purple-900/20" />
      <motion.div
        className="absolute top-0 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl"
        animate={{ x: [0, 50, 0], y: [0, 30, 0] }}
        transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl"
        animate={{ x: [0, -50, 0], y: [0, -30, 0] }}
        transition={{ duration: 25, repeat: Infinity, ease: 'easeInOut' }}
      />

      {mounted && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <Particle delay={0} size={6} left="10%" duration={8} />
          <Particle delay={1} size={4} left="25%" duration={10} />
          <Particle delay={2} size={8} left="40%" duration={7} />
          <Particle delay={0.5} size={5} left="55%" duration={9} />
          <Particle delay={1.5} size={6} left="70%" duration={8} />
          <Particle delay={2.5} size={4} left="85%" duration={11} />
        </div>
      )}

      <div className="absolute inset-0 noise-overlay pointer-events-none" />

      <main className="relative z-10 max-w-5xl mx-auto px-6 lg:px-8 pt-32 pb-32 min-h-screen flex flex-col items-center justify-center">
        <motion.div className="w-full text-center" variants={containerVariants} initial="hidden" animate="visible">
          <motion.div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border border-white/10 mb-8"
            variants={itemVariants}
          >
            <motion.span
              className="w-2 h-2 rounded-full bg-emerald-400"
              animate={{ scale: [1, 1.2, 1], opacity: [1, 0.7, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            <span className="text-sm text-gray-300 font-medium">Live</span>
          </motion.div>

          <motion.div className="mb-8" variants={itemVariants}>
            <div className="relative inline-block">
              <motion.div
                className="absolute -inset-4 opacity-30"
                animate={{
                  boxShadow: [
                    '0 0 20px rgba(59, 130, 246, 0.3)',
                    '0 0 40px rgba(59, 130, 246, 0.5)',
                    '0 0 20px rgba(59, 130, 246, 0.3)',
                  ],
                }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              />
              <TrueFocus
                sentence="Reputation. Engineered."
                manualMode={false}
                blurAmount={5}
                borderColor="#3b82f6"
                glowColor="rgba(59, 130, 246, 0.6)"
                animationDuration={2}
                pauseBetweenAnimations={1}
              />
            </div>
          </motion.div>

          <motion.div className="mb-12 max-w-2xl mx-auto" variants={itemVariants}>
            <div className="relative">
              <div className="absolute -left-3 top-0 w-2 h-2 border-l border-t border-cyan-500/40" />
              <div className="absolute -right-3 top-0 w-2 h-2 border-r border-t border-cyan-500/40" />
              <p className="text-base md:text-lg text-gray-300 leading-relaxed tracking-wide px-4 py-2">
                <span className="font-mono text-cyan-400/80 text-xs mr-2">{'//'}</span>
                <span className="font-light">
                  AI-driven reputation intelligence for X. Monitor, analyze, and optimize your presence with surgical precision.
                </span>
                <br />
                <span className="inline-block mt-2 font-mono text-sm text-gray-500">
                  <motion.span
                    className="inline-block text-cyan-400"
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    &gt;
                  </motion.span>
                  {' '}Every tweet. Every reply. Every second.
                </span>
              </p>
            </div>
          </motion.div>

          <motion.div variants={itemVariants} className="flex items-center justify-center gap-4 mb-12">
            <SignInButton mode="modal">
              <button className="font-mono text-sm text-gray-400 hover:text-white transition-colors tracking-widest uppercase px-2">
                Sign In
              </button>
            </SignInButton>
            <SignUpButton mode="modal">
              <TerminalButton>Get Started</TerminalButton>
            </SignUpButton>
          </motion.div>

          <motion.div
            className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-3xl mx-auto"
            variants={containerVariants}
          >
            {FEATURES.map((feature, index) => (
              <motion.div key={index} className="group relative flex" variants={itemVariants} whileHover={{ y: -8 }}>
                <div className="absolute -top-1 -left-1 w-3 h-3 border-l-2 border-t-2 border-cyan-500/60" />
                <div className="absolute -top-1 -right-1 w-3 h-3 border-r-2 border-t-2 border-cyan-500/60" />
                <div className="absolute -bottom-1 -left-1 w-3 h-3 border-l-2 border-b-2 border-cyan-500/60" />
                <div className="absolute -bottom-1 -right-1 w-3 h-3 border-r-2 border-b-2 border-cyan-500/60" />

                <div className="relative flex flex-col w-full bg-[#0a0f1e]/60 backdrop-blur-sm border border-blue-500/20 hover:border-cyan-500/40 transition-all duration-300 p-6">
                  <div className="flex items-center justify-between mb-4 pb-3 border-b border-blue-500/10">
                    <div className="flex items-center gap-2">
                      <motion.div
                        className="w-1.5 h-1.5 rounded-full bg-cyan-400"
                        animate={{ opacity: [0.5, 1, 0.5] }}
                        transition={{ duration: 2, repeat: Infinity, delay: index * 0.2 }}
                      />
                      <span className="font-mono text-[10px] text-gray-500 tracking-wider">MODULE_{feature.code}</span>
                    </div>
                  </div>

                  <div className="relative mb-4 inline-block">
                    <div className="relative w-12 h-12 border border-cyan-500/30 text-cyan-400 flex items-center justify-center bg-gradient-to-br from-white/5 to-transparent">
                      {feature.icon}
                    </div>
                  </div>

                  <h3 className="text-base font-mono font-semibold text-white mb-2 tracking-tight">{feature.title}</h3>
                  <p className="text-xs text-gray-400 leading-relaxed font-light flex-grow">
                    <span className="text-gray-600 font-mono mr-1">&gt;</span>
                    {feature.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </main>

      <footer className="relative z-10">
        <div className="relative bg-[#0a0f1e]/40 backdrop-blur-sm border-t border-cyan-500/10 py-8">
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-3">
                <span className="font-mono text-xs text-gray-600">&gt;</span>
                <p className="text-xs text-gray-500 font-mono">
                  Built by <span className="text-cyan-400 font-semibold">The Notorious Pran</span>
                </p>
              </div>
              <p className="text-[10px] text-gray-600 font-mono tracking-wider uppercase">
                &copy; {new Date().getFullYear()} P.R.A.N. — All rights reserved
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
