'use client';

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import TrueFocus from './TrueFocus';

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
      transition={{
        duration,
        repeat: Infinity,
        delay,
        ease: 'easeInOut',
      }}
    />
  );
}


// Stagger container variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.2 },
  },
} as const;

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6 }
  },
} as const;

export default function WaitlistPage() {
  const [mounted, setMounted] = useState(false);
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/waitlist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to join waitlist');
      }

      setIsSubmitted(true);
      setEmail('');

      // Reset after 3 seconds
      setTimeout(() => {
        setIsSubmitted(false);
        setIsExpanded(false);
      }, 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      // Clear error after 5 seconds
      setTimeout(() => setError(null), 5000);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-[#030712] text-white overflow-hidden">
      {/* Custom Top Bar */}
      <motion.nav
        className="fixed top-0 left-0 right-0 z-50"
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      >
        {/* Solid background with elevated shadow */}
        <div className="absolute inset-0 bg-[#030712]/95 backdrop-blur-md border-b border-cyan-500/10" />

        {/* Animated bottom line */}
        <motion.div
          className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent"
          animate={{
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />

        <div className="relative max-w-7xl mx-auto px-6 lg:px-8 h-14 flex items-center justify-between">
          {/* Logo */}
          <motion.div
            className="flex items-center gap-3 group cursor-pointer"
            whileHover={{ x: 2 }}
            transition={{ duration: 0.2 }}
          >
            {/* Logo mark with tech styling */}
            <div className="relative">
              {/* Corner brackets */}
              <div className="absolute -top-1 -left-1 w-2 h-2 border-l border-t border-cyan-500/60" />
              <div className="absolute -top-1 -right-1 w-2 h-2 border-r border-t border-cyan-500/60" />
              <div className="absolute -bottom-1 -left-1 w-2 h-2 border-l border-b border-cyan-500/60" />
              <div className="absolute -bottom-1 -right-1 w-2 h-2 border-r border-b border-cyan-500/60" />

              <div className="w-7 h-7 border border-cyan-500/30 bg-gradient-to-br from-cyan-500/10 to-blue-500/10 flex items-center justify-center relative">
                {/* Pulse effect */}
                <motion.div
                  className="absolute inset-0 bg-cyan-500/20"
                  animate={{ opacity: [0, 0.3, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
                <span className="text-cyan-400 font-mono text-xs font-bold relative z-10">P</span>
              </div>
            </div>

            {/* Text logo */}
            <div className="flex items-center gap-1.5">
              <span className="text-base font-mono font-bold tracking-wider text-white group-hover:text-cyan-400 transition-colors duration-300">
                P.R.A.N.
              </span>
              <motion.span
                className="text-cyan-400 font-mono text-xs"
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                _
              </motion.span>
            </div>
          </motion.div>

          {/* Status Badge */}
          <motion.div
            className="flex items-center gap-2.5 px-3 py-1.5 bg-[#0a0f1e]/80 backdrop-blur-sm border border-cyan-500/20"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            {/* Status indicator dots */}
            <div className="flex gap-1">
              <motion.div
                className="w-1.5 h-1.5 bg-cyan-400 rounded-full"
                animate={{ opacity: [1, 0.3, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
              <motion.div
                className="w-1.5 h-1.5 bg-blue-400 rounded-full"
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{ duration: 2, repeat: Infinity, delay: 0.3 }}
              />
              <motion.div
                className="w-1.5 h-1.5 bg-purple-400 rounded-full"
                animate={{ opacity: [1, 0.3, 1] }}
                transition={{ duration: 2, repeat: Infinity, delay: 0.6 }}
              />
            </div>
            <span className="text-[10px] text-gray-400 font-mono tracking-wider uppercase">Status: Coming Soon</span>
          </motion.div>
        </div>
      </motion.nav>

      {/* Top gradient fade */}
      <div className="fixed top-16 left-0 right-0 h-24 bg-gradient-to-b from-[#030712]/80 via-[#030712]/40 to-transparent z-40 pointer-events-none" />

      {/* Animated grid background */}
      <motion.div
        className="absolute inset-0 grid-bg"
        animate={{ opacity: [0.03, 0.08, 0.03] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Gradient overlays */}
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

      {/* Floating particles */}
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

      {/* Noise overlay */}
      <div className="absolute inset-0 noise-overlay pointer-events-none" />

      {/* Main content */}
      <main className="relative z-10 max-w-5xl mx-auto px-6 lg:px-8 pt-20 pb-32 min-h-screen flex flex-col items-center justify-center">
        <motion.div
          className="w-full text-center"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Badge */}
          <motion.div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border border-white/10 mb-8"
            variants={itemVariants}
          >
            <motion.span
              className="w-2 h-2 rounded-full bg-emerald-400"
              animate={{ scale: [1, 1.2, 1], opacity: [1, 0.7, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            <span className="text-sm text-gray-300 font-medium">Coming Soon</span>
          </motion.div>

          {/* Main headline with TrueFocus */}
          <motion.div
            className="mb-8"
            variants={itemVariants}
          >
            <div className="relative inline-block">
              {/* Glitch effect container */}
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

          {/* Subtext with tech styling */}
          <motion.div
            className="mb-12 max-w-2xl mx-auto"
            variants={itemVariants}
          >
            <div className="relative">
              {/* Top accent line */}
              <motion.div
                className="absolute -top-3 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent"
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 1, delay: 0.5 }}
              />

              {/* Corner brackets */}
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

              {/* Bottom accent line */}
              <motion.div
                className="absolute -bottom-3 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-blue-500/30 to-transparent"
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 1, delay: 0.7 }}
              />
            </div>
          </motion.div>

          {/* Waitlist form */}
          <motion.div variants={itemVariants} className="max-w-md mx-auto mb-12">
            {!isExpanded ? (
              <motion.button
                onClick={() => setIsExpanded(true)}
                className="group relative px-8 py-3.5 overflow-hidden"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {/* Outer glow */}
                <motion.div
                  className="absolute -inset-[2px] bg-gradient-to-r from-blue-500/50 via-cyan-500/50 to-blue-500/50 rounded-[4px] opacity-0 group-hover:opacity-100 blur-md"
                  animate={{
                    backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
                  }}
                  transition={{
                    backgroundPosition: { duration: 2, repeat: Infinity, ease: 'linear' },
                    opacity: { duration: 0.3 }
                  }}
                  style={{ backgroundSize: '200% 100%' }}
                />

                {/* Main border */}
                <div className="absolute inset-0 rounded-[3px] bg-gradient-to-r from-blue-500/20 via-cyan-500/20 to-blue-500/20 p-[1px]">
                  <div className="absolute inset-[1px] bg-[#030712] rounded-[2px]" />
                </div>

                {/* Animated scan line */}
                <motion.div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100"
                  initial={{ y: '100%' }}
                  whileHover={{ y: '-100%' }}
                  transition={{ duration: 0.8, ease: 'easeInOut' }}
                >
                  <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_10px_rgba(34,211,238,0.8)]" />
                </motion.div>

                {/* Content */}
                <span className="relative flex items-center gap-2.5 font-mono text-sm tracking-wider uppercase">
                  <motion.span
                    className="text-gray-400 group-hover:text-cyan-400 transition-colors duration-300"
                  >
                    [
                  </motion.span>
                  <span className="text-white font-medium">
                    Enter Waitlist
                  </span>
                  <motion.span
                    className="text-gray-400 group-hover:text-cyan-400 transition-colors duration-300"
                  >
                    ]
                  </motion.span>
                  <motion.div
                    className="flex gap-0.5"
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                  >
                    <div className="w-1 h-1 bg-cyan-400 rounded-full" />
                    <div className="w-1 h-1 bg-cyan-400 rounded-full" />
                    <div className="w-1 h-1 bg-cyan-400 rounded-full" />
                  </motion.div>
                </span>
              </motion.button>
            ) : (
              <motion.form
                onSubmit={handleSubmit}
                className="relative"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
              >
                {/* Corner brackets */}
                <motion.div
                  className="absolute -left-2 -top-2 w-4 h-4 border-l-2 border-t-2 border-cyan-500/60"
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2, type: 'spring', stiffness: 500, damping: 30 }}
                />
                <motion.div
                  className="absolute -right-2 -top-2 w-4 h-4 border-r-2 border-t-2 border-cyan-500/60"
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.25, type: 'spring', stiffness: 500, damping: 30 }}
                />
                <motion.div
                  className="absolute -left-2 -bottom-2 w-4 h-4 border-l-2 border-b-2 border-cyan-500/60"
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3, type: 'spring', stiffness: 500, damping: 30 }}
                />
                <motion.div
                  className="absolute -right-2 -bottom-2 w-4 h-4 border-r-2 border-b-2 border-cyan-500/60"
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.35, type: 'spring', stiffness: 500, damping: 30 }}
                />

                {/* Scanning line effect */}
                <motion.div
                  className="absolute inset-0 pointer-events-none"
                  initial={{ y: 0 }}
                  animate={{ y: ['0%', '100%', '0%'] }}
                  transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                >
                  <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent" />
                </motion.div>

                <div className="relative bg-[#0a0f1e]/80 backdrop-blur-sm border border-blue-500/20 rounded-[2px] p-1.5">
                  <div className="flex items-center gap-2">
                    {/* Status indicator */}
                    <div className="flex flex-col gap-1 px-2">
                      <motion.div
                        className="w-1.5 h-1.5 bg-cyan-400 rounded-full"
                        animate={{ opacity: [1, 0.3, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      />
                      <motion.div
                        className="w-1.5 h-1.5 bg-blue-400 rounded-full"
                        animate={{ opacity: [0.3, 1, 0.3] }}
                        transition={{ duration: 2, repeat: Infinity, delay: 0.3 }}
                      />
                      <motion.div
                        className="w-1.5 h-1.5 bg-purple-400 rounded-full"
                        animate={{ opacity: [1, 0.3, 1] }}
                        transition={{ duration: 2, repeat: Infinity, delay: 0.6 }}
                      />
                    </div>

                    {/* Input field */}
                    <div className="flex-1 relative">
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="user@domain.com"
                        required
                        autoFocus
                        disabled={isSubmitting || isSubmitted}
                        className="w-full px-4 py-3 bg-transparent border-l border-blue-500/20 text-white font-mono text-sm placeholder-gray-600 focus:outline-none focus:placeholder-gray-500 transition-all duration-300 disabled:opacity-50"
                      />
                    </div>

                    {/* Submit button */}
                    <motion.button
                      type="submit"
                      disabled={isSubmitting || isSubmitted}
                      className="relative px-5 py-3 bg-gradient-to-r from-blue-600/10 to-cyan-600/10 border border-cyan-500/40 hover:border-cyan-400/60 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-300 group/btn"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      {/* Button glow */}
                      <div className="absolute inset-0 bg-cyan-500/0 group-hover/btn:bg-cyan-500/10 transition-colors duration-300" />

                      <span className="relative font-mono text-xs uppercase tracking-widest text-cyan-400 group-hover/btn:text-cyan-300">
                        {isSubmitting ? (
                          <motion.span
                            animate={{ opacity: [0.5, 1, 0.5] }}
                            transition={{ duration: 1, repeat: Infinity }}
                          >
                            [...]
                          </motion.span>
                        ) : isSubmitted ? (
                          '[OK]'
                        ) : (
                          '[→]'
                        )}
                      </span>
                    </motion.button>
                  </div>
                </div>

                {isSubmitted && (
                  <motion.div
                    className="mt-3 flex items-center gap-2 font-mono text-xs text-emerald-400"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                  >
                    <motion.span
                      animate={{ opacity: [0.5, 1, 0.5] }}
                      transition={{ duration: 1, repeat: Infinity }}
                    >
                      &gt;
                    </motion.span>
                    <span>ACCESS_GRANTED {'//'} You&apos;re on the list</span>
                  </motion.div>
                )}

                {error && (
                  <motion.div
                    className="mt-3 flex items-center gap-2 font-mono text-xs text-red-400"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                  >
                    <motion.span
                      animate={{ opacity: [0.5, 1, 0.5] }}
                      transition={{ duration: 1, repeat: Infinity }}
                    >
                      !
                    </motion.span>
                    <span>ERROR // {error}</span>
                  </motion.div>
                )}
              </motion.form>
            )}
          </motion.div>


          {/* Feature highlights */}
          <motion.div
            className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-3xl mx-auto"
            variants={containerVariants}
          >
            {[
              {
                icon: (
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                ),
                title: 'Real-time X Monitoring',
                description: 'Track every mention, reply, and quote on X instantly',
                code: '01',
                accent: 'cyan',
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
                accent: 'blue',
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
                accent: 'purple',
              },
            ].map((feature, index) => (
              <motion.div
                key={index}
                className="group relative flex"
                variants={itemVariants}
                whileHover={{ y: -8 }}
              >
                {/* Corner notches */}
                <div className="absolute -top-1 -left-1 w-3 h-3 border-l-2 border-t-2 border-cyan-500/60" />
                <div className="absolute -top-1 -right-1 w-3 h-3 border-r-2 border-t-2 border-cyan-500/60" />
                <div className="absolute -bottom-1 -left-1 w-3 h-3 border-l-2 border-b-2 border-cyan-500/60" />
                <div className="absolute -bottom-1 -right-1 w-3 h-3 border-r-2 border-b-2 border-cyan-500/60" />

                {/* Scan line effect */}
                <motion.div
                  className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100"
                  initial={{ y: '100%' }}
                  whileHover={{ y: '-100%' }}
                  transition={{ duration: 1, ease: 'linear' }}
                >
                  <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-cyan-400/60 to-transparent" />
                </motion.div>

                {/* Main card */}
                <div className="relative flex flex-col w-full bg-[#0a0f1e]/60 backdrop-blur-sm border border-blue-500/20 hover:border-cyan-500/40 transition-all duration-300 p-6">
                  {/* Top status bar */}
                  <div className="flex items-center justify-between mb-4 pb-3 border-b border-blue-500/10">
                    <div className="flex items-center gap-2">
                      <motion.div
                        className={`w-1.5 h-1.5 rounded-full ${
                          feature.accent === 'cyan' ? 'bg-cyan-400' :
                          feature.accent === 'blue' ? 'bg-blue-400' : 'bg-purple-400'
                        }`}
                        animate={{ opacity: [0.5, 1, 0.5] }}
                        transition={{ duration: 2, repeat: Infinity, delay: index * 0.2 }}
                      />
                      <span className="font-mono text-[10px] text-gray-500 tracking-wider">
                        MODULE_{feature.code}
                      </span>
                    </div>
                    <div className="flex gap-1">
                      <div className="w-1 h-1 bg-gray-600 rounded-full" />
                      <div className="w-1 h-1 bg-gray-600 rounded-full" />
                      <div className="w-1 h-1 bg-gray-600 rounded-full" />
                    </div>
                  </div>

                  {/* Icon with glow effect */}
                  <div className="relative mb-4 inline-block">
                    <motion.div
                      className={`absolute inset-0 blur-xl opacity-0 group-hover:opacity-60 transition-opacity duration-300 ${
                        feature.accent === 'cyan' ? 'bg-cyan-500/50' :
                        feature.accent === 'blue' ? 'bg-blue-500/50' : 'bg-purple-500/50'
                      }`}
                    />
                    <div className={`relative w-12 h-12 border ${
                      feature.accent === 'cyan' ? 'border-cyan-500/30 text-cyan-400' :
                      feature.accent === 'blue' ? 'border-blue-500/30 text-blue-400' : 'border-purple-500/30 text-purple-400'
                    } flex items-center justify-center bg-gradient-to-br from-white/5 to-transparent group-hover:border-opacity-60 transition-all duration-300`}>
                      {feature.icon}
                    </div>
                  </div>

                  {/* Title */}
                  <h3 className="text-base font-mono font-semibold text-white mb-2 tracking-tight">
                    {feature.title}
                  </h3>

                  {/* Description with terminal style */}
                  <p className="text-xs text-gray-400 leading-relaxed font-light flex-grow">
                    <span className="text-gray-600 font-mono mr-1">&gt;</span>
                    {feature.description}
                  </p>

                  {/* Bottom accent line */}
                  <motion.div
                    className={`absolute bottom-0 left-0 right-0 h-[1px] ${
                      feature.accent === 'cyan' ? 'bg-cyan-500/30' :
                      feature.accent === 'blue' ? 'bg-blue-500/30' : 'bg-purple-500/30'
                    }`}
                    initial={{ scaleX: 0 }}
                    whileInView={{ scaleX: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8, delay: index * 0.1 }}
                  />
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* PRAN Acronym */}
          <motion.div
            className="mt-20"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <motion.div
              className="inline-flex items-center gap-3 text-sm text-gray-500 tracking-widest"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <span className="text-blue-400 font-bold">P</span>ublic
              <span className="text-gray-700">•</span>
              <span className="text-purple-400 font-bold">R</span>elation
              <span className="text-gray-700">•</span>
              <span className="text-cyan-400 font-bold">A</span>nalysis
              <span className="text-gray-700">•</span>
              <span className="text-emerald-400 font-bold">N</span>ode
            </motion.div>
          </motion.div>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 mt-20">
        {/* Top border with animation */}
        <motion.div
          className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent"
          initial={{ scaleX: 0 }}
          whileInView={{ scaleX: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1 }}
        />

        <div className="relative bg-[#0a0f1e]/40 backdrop-blur-sm border-t border-cyan-500/10 py-8">
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            {/* Main footer content */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
              {/* Left side - Creator */}
              <div className="flex items-center gap-3">
                <span className="font-mono text-xs text-gray-600">&gt;</span>
                <p className="text-xs text-gray-500 font-mono">
                  Built by{' '}
                  <span className="text-cyan-400 font-semibold">The Notorious Pran</span>
                </p>
              </div>

              {/* Center - Status indicators */}
              <div className="flex items-center gap-2">
                <motion.div
                  className="w-1 h-1 bg-cyan-400 rounded-full"
                  animate={{ opacity: [1, 0.3, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
                <motion.div
                  className="w-1 h-1 bg-blue-400 rounded-full"
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 2, repeat: Infinity, delay: 0.3 }}
                />
                <motion.div
                  className="w-1 h-1 bg-purple-400 rounded-full"
                  animate={{ opacity: [1, 0.3, 1] }}
                  transition={{ duration: 2, repeat: Infinity, delay: 0.6 }}
                />
              </div>

              {/* Right side - Copyright */}
              <div className="flex items-center gap-3">
                <p className="text-[10px] text-gray-600 font-mono tracking-wider uppercase">
                  © {new Date().getFullYear()} P.R.A.N.
                </p>
                <span className="text-gray-700">|</span>
                <p className="text-[10px] text-gray-600 font-mono tracking-wider uppercase">
                  All rights reserved
                </p>
              </div>
            </div>

            {/* Bottom accent */}
            <div className="mt-6 flex items-center justify-center gap-2">
              <div className="h-[1px] w-16 bg-gradient-to-r from-transparent to-cyan-500/20" />
              <div className="flex gap-1">
                <div className="w-1 h-1 bg-cyan-500/40 rounded-full" />
                <div className="w-1 h-1 bg-blue-500/40 rounded-full" />
                <div className="w-1 h-1 bg-purple-500/40 rounded-full" />
              </div>
              <div className="h-[1px] w-16 bg-gradient-to-l from-transparent to-cyan-500/20" />
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
