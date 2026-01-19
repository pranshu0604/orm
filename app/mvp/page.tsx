'use client';

import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import { useEffect, useState } from 'react';

// Floating particle component with Framer Motion
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


// Animated counter component
function AnimatedCounter({ value, suffix = '' }: { value: number; suffix?: string }) {
  const count = useMotionValue(0);
  const rounded = useTransform(count, (latest) => Math.round(latest));
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const controls = animate(count, value, { duration: 2, ease: 'easeOut' });
    const unsubscribe = rounded.on('change', (v) => setDisplayValue(v));
    return () => {
      controls.stop();
      unsubscribe();
    };
  }, [count, rounded, value]);

  return <span>{displayValue}{suffix}</span>;
}

// Dashboard card component with Framer Motion
function DashboardCard({
  title,
  value,
  trend,
  icon,
  index,
  color,
}: {
  title: string;
  value: string;
  trend?: string;
  icon: React.ReactNode;
  index: number;
  color: 'blue' | 'purple' | 'cyan' | 'green';
}) {
  const colorClasses = {
    blue: 'from-blue-500/20 to-blue-600/10 border-blue-500/20 hover:border-blue-500/40',
    purple: 'from-purple-500/20 to-purple-600/10 border-purple-500/20 hover:border-purple-500/40',
    cyan: 'from-cyan-500/20 to-cyan-600/10 border-cyan-500/20 hover:border-cyan-500/40',
    green: 'from-emerald-500/20 to-emerald-600/10 border-emerald-500/20 hover:border-emerald-500/40',
  };

  return (
    <motion.div
      className={`group relative bg-gradient-to-br ${colorClasses[color]} backdrop-blur-xl rounded-2xl p-5 border transition-colors duration-300`}
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay: 0.1 * index, ease: [0.25, 0.46, 0.45, 0.94] }}
      whileHover={{ scale: 1.02, y: -4 }}
    >
      <div className="flex items-start justify-between mb-3">
        <motion.div
          className="p-2 rounded-xl bg-white/5"
          whileHover={{ rotate: [0, -10, 10, 0] }}
          transition={{ duration: 0.5 }}
        >
          {icon}
        </motion.div>
        {trend && (
          <span className={`text-xs font-medium px-2 py-1 rounded-full ${trend.startsWith('+') ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
            {trend}
          </span>
        )}
      </div>
      <p className="text-gray-400 text-sm font-medium mb-1">{title}</p>
      <p className="text-2xl font-bold text-white tracking-tight">{value}</p>
      <motion.div
        className="absolute inset-0 rounded-2xl bg-gradient-to-r from-white/0 via-white/5 to-white/0"
        initial={{ opacity: 0, x: '-100%' }}
        whileHover={{ opacity: 1, x: '100%' }}
        transition={{ duration: 0.6 }}
      />
    </motion.div>
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

export default function Home() {
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

      {/* Gradient overlays */}
      <div className="absolute inset-0 bg-gradient-to-b from-blue-900/20 via-transparent to-purple-900/20" />
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

      {/* Noise overlay for texture */}
      <div className="absolute inset-0 noise-overlay pointer-events-none" />

      {/* Main content */}
      <main className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8 pt-20 pb-32">
        {/* Hero Section */}
        <div className="flex flex-col items-center justify-center gap-16 min-h-[80vh]">
          {/* Text content - centered */}
          <motion.div
            className="flex-1 max-w-4xl text-center"
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
              <span className="text-sm text-gray-300 font-medium">Public Relation & Analysis Node</span>
            </motion.div>

            {/* Main headline */}
            <motion.h1
              className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.1] mb-6"
              variants={itemVariants}
            >
              <span className="block text-white">Your Reputation.</span>
              <motion.span
                className="block gradient-text-animated"
                animate={{ backgroundPosition: ['0% center', '200% center'] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
                style={{
                  background: 'linear-gradient(90deg, #3b82f6, #8b5cf6, #06b6d4, #3b82f6)',
                  backgroundSize: '200% auto',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                Optimized.
              </motion.span>
              <span className="block text-white">Every Second.</span>
            </motion.h1>

            {/* Subtext */}
            <motion.p
              className="text-lg md:text-xl text-gray-400 leading-relaxed mb-10 max-w-2xl mx-auto"
              variants={itemVariants}
            >
              AI-driven reputation intelligence that keeps you ahead. Monitor, analyze, and optimize your digital presence with surgical precision.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div className="flex flex-col sm:flex-row gap-4 justify-center" variants={itemVariants}>
              <motion.a
                href="/dashboard"
                className="btn-premium group relative inline-flex items-center justify-center px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl font-semibold text-white"
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
              >
                <span className="relative z-10 flex items-center gap-2">
                  Launch PRAN
                  <motion.svg
                    className="w-5 h-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    whileHover={{ x: 4 }}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </motion.svg>
                </span>
              </motion.a>
              <motion.a
                href="#demo"
                className="group inline-flex items-center justify-center px-8 py-4 rounded-xl font-semibold text-gray-300 border border-white/10 hover:border-white/20 hover:bg-white/5 transition-all duration-300"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <span className="flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Watch Demo
                </span>
              </motion.a>
            </motion.div>

            {/* Trust indicators */}
            <motion.div
              className="mt-12 pt-8 border-t border-white/5"
              variants={itemVariants}
            >
              <p className="text-xs text-gray-500 uppercase tracking-widest mb-4">Trusted by elite operators</p>
              <div className="flex items-center justify-center gap-8 text-gray-400">
                <span className="font-semibold"><AnimatedCounter value={10} suffix="K+" /></span>
                <span className="text-gray-700">|</span>
                <span className="font-semibold"><AnimatedCounter value={99} suffix=".9% Uptime" /></span>
                <span className="text-gray-700">|</span>
                <span className="font-semibold">Real-time</span>
              </div>
            </motion.div>
          </motion.div>
        </div>

        {/* Dashboard preview cards */}
        <div className="mt-24 lg:mt-32">
          <motion.div
            className="text-center mb-12"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">Command Center Intelligence</h2>
            <p className="text-gray-400 max-w-2xl mx-auto">Real-time metrics that matter. Every signal processed. Every threat neutralized.</p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <DashboardCard
              title="Sentiment Score"
              value="94.2%"
              trend="+12.3%"
              color="green"
              index={0}
              icon={
                <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
            />
            <DashboardCard
              title="Active Alerts"
              value="3"
              color="purple"
              index={1}
              icon={
                <svg className="w-5 h-5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              }
            />
            <DashboardCard
              title="Trend Analysis"
              value="Rising"
              trend="+8.7%"
              color="blue"
              index={2}
              icon={
                <svg className="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              }
            />
            <DashboardCard
              title="Account Health"
              value="Optimal"
              color="cyan"
              index={3}
              icon={
                <svg className="w-5 h-5 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              }
            />
          </div>
        </div>

        {/* PRAN Acronym Section */}
        <motion.div
          className="mt-32 text-center"
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
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/5 py-8">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-gray-500">
            Built by <span className="text-purple-400 font-semibold">The Notorious Pran</span>
          </p>
          <p className="text-xs text-gray-600">
            © {new Date().getFullYear()} P.R.A.N. — All rights reserved
          </p>
        </div>
      </footer>
    </div>
  );
}
