'use client'

import { SignedIn, SignedOut, SignInButton, SignUpButton, UserButton } from "@clerk/nextjs"
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import ThemeSwitch from "./ThemeSwitch";

const LayoutHeader = () => {
    const [isMounted, setIsMounted] = useState(false);
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        setIsMounted(true);

        const handleScroll = () => {
            setScrolled(window.scrollY > 20);
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    if (!isMounted) {
        return (
            <header className="fixed top-0 left-0 right-0 z-50 h-16 bg-transparent">
                <div className="max-w-7xl mx-auto px-6 h-full" />
            </header>
        );
    }

    return (
        <motion.header
            className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
                scrolled
                    ? 'bg-[#030712]/80 backdrop-blur-xl border-b border-white/5'
                    : 'bg-transparent'
            }`}
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
            <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                {/* Logo */}
                <Link href="/" className="flex items-center gap-3 group">
                    <motion.div
                        className="relative"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        {/* Logo glow */}
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg blur-lg opacity-50 group-hover:opacity-75 transition-opacity" />

                        {/* Logo container */}
                        <div className="relative w-9 h-9 rounded-lg bg-gradient-to-br from-blue-600 via-purple-600 to-cyan-500 flex items-center justify-center shadow-lg">
                            <span className="text-white font-bold text-sm tracking-tight">P</span>

                            {/* Animated ring */}
                            <motion.div
                                className="absolute inset-0 rounded-lg border border-white/20"
                                animate={{ scale: [1, 1.1, 1], opacity: [0.5, 0, 0.5] }}
                                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                            />
                        </div>
                    </motion.div>

                    <div className="flex flex-col">
                        <motion.span
                            className="text-white font-bold text-lg tracking-tight leading-none"
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.2 }}
                        >
                            PRAN
                        </motion.span>
                        <motion.span
                            className="text-gray-500 text-[10px] tracking-widest uppercase leading-none"
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.3 }}
                        >
                            Analysis Node
                        </motion.span>
                    </div>
                </Link>

                {/* Nav Links - Center */}
                <motion.nav
                    className="hidden md:flex items-center gap-1"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                >
                    {[
                        { href: '/dashboard', label: 'Dashboard' },
                        { href: '/analytics', label: 'Analytics' },
                        { href: '/settings', label: 'Settings' },
                    ].map((link) => (
                        <Link
                            key={link.href}
                            href={link.href}
                            className="relative px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors duration-200 group"
                        >
                            <span className="relative z-10">{link.label}</span>
                            <motion.div
                                className="absolute inset-0 rounded-lg bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity"
                                layoutId="navHover"
                            />
                        </Link>
                    ))}
                </motion.nav>

                {/* Right side actions */}
                <motion.div
                    className="flex items-center gap-3"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 }}
                >
                    {/* Status indicator */}
                    <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                        <motion.div
                            className="w-1.5 h-1.5 rounded-full bg-emerald-400"
                            animate={{ scale: [1, 1.2, 1], opacity: [1, 0.7, 1] }}
                            transition={{ duration: 2, repeat: Infinity }}
                        />
                        <span className="text-emerald-400 text-xs font-medium">Online</span>
                    </div>

                    <ThemeSwitch />

                    <SignedOut>
                        <div className="flex items-center gap-2">
                            <SignInButton mode="modal">
                                <motion.button
                                    className="px-4 py-2 text-sm text-gray-300 hover:text-white transition-colors"
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                >
                                    Sign In
                                </motion.button>
                            </SignInButton>
                            <SignUpButton mode="modal">
                                <motion.button
                                    className="relative px-4 py-2 text-sm font-medium text-white rounded-lg overflow-hidden group"
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                >
                                    {/* Button gradient background */}
                                    <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600" />

                                    {/* Shimmer effect */}
                                    <motion.div
                                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full"
                                        animate={{ translateX: ['−100%', '100%'] }}
                                        transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                                    />

                                    <span className="relative z-10">Get Started</span>
                                </motion.button>
                            </SignUpButton>
                        </div>
                    </SignedOut>

                    <SignedIn>
                        <div className="relative">
                            {/* Glow behind avatar */}
                            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/30 to-purple-500/30 rounded-full blur-md" />
                            <UserButton
                                appearance={{
                                    elements: {
                                        avatarBox: "w-9 h-9 ring-2 ring-white/10 hover:ring-purple-500/50 transition-all duration-300"
                                    }
                                }}
                            />
                        </div>
                    </SignedIn>
                </motion.div>
            </div>

            {/* Bottom gradient line */}
            <motion.div
                className="absolute bottom-0 left-0 right-0 h-px"
                style={{
                    background: scrolled
                        ? 'linear-gradient(90deg, transparent, rgba(139, 92, 246, 0.3), rgba(59, 130, 246, 0.3), transparent)'
                        : 'transparent'
                }}
                initial={{ scaleX: 0 }}
                animate={{ scaleX: scrolled ? 1 : 0 }}
                transition={{ duration: 0.5 }}
            />
        </motion.header>
    )
}

export default LayoutHeader
