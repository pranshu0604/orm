'use client'

import { SignedIn, SignedOut, SignInButton, SignUpButton, UserButton } from "@clerk/nextjs"
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import StatusDots from "./hud/StatusDots";
import TerminalButton from "./hud/TerminalButton";

const NAV_LINKS = [
    { href: '/settings/connections', label: 'Settings' },
];

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
            <header className="fixed top-0 left-0 right-0 z-50 h-14 bg-transparent">
                <div className="max-w-7xl mx-auto px-6 h-full" />
            </header>
        );
    }

    return (
        <motion.header
            className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
                scrolled
                    ? 'bg-[#030712]/95 backdrop-blur-md border-b border-cyan-500/10'
                    : 'bg-[#030712]/60 backdrop-blur-sm'
            }`}
            initial={{ y: -100 }}
            animate={{ y: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
        >
            <motion.div
                className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-cyan-500/40 to-transparent"
                animate={{ opacity: [0.3, 0.6, 0.3] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            />

            <div className="relative max-w-7xl mx-auto px-6 lg:px-8 h-14 flex items-center justify-between">
                {/* Logo */}
                <Link href="/" className="flex items-center gap-3 group">
                    <div className="relative">
                        <div className="absolute -top-1 -left-1 w-2 h-2 border-l border-t border-cyan-500/60" />
                        <div className="absolute -top-1 -right-1 w-2 h-2 border-r border-t border-cyan-500/60" />
                        <div className="absolute -bottom-1 -left-1 w-2 h-2 border-l border-b border-cyan-500/60" />
                        <div className="absolute -bottom-1 -right-1 w-2 h-2 border-r border-b border-cyan-500/60" />

                        <div className="w-7 h-7 border border-cyan-500/30 bg-gradient-to-br from-cyan-500/10 to-blue-500/10 flex items-center justify-center relative">
                            <motion.div
                                className="absolute inset-0 bg-cyan-500/20"
                                animate={{ opacity: [0, 0.3, 0] }}
                                transition={{ duration: 2, repeat: Infinity }}
                            />
                            <span className="text-cyan-400 font-mono text-xs font-bold relative z-10">P</span>
                        </div>
                    </div>

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
                </Link>

                {/* Nav Links - Center */}
                <nav className="hidden md:flex items-center gap-8">
                    {NAV_LINKS.map((link) => (
                        <Link
                            key={link.href}
                            href={link.href}
                            className="relative py-2 font-mono text-xs text-gray-400 hover:text-white transition-colors duration-200 tracking-widest uppercase group"
                        >
                            {link.label}
                            <span className="absolute -bottom-px left-0 right-0 h-px bg-cyan-400/60 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
                        </Link>
                    ))}
                </nav>

                {/* Right side actions */}
                <div className="flex items-center gap-3">
                    <div className="hidden sm:flex items-center gap-2.5 px-3 py-1.5 bg-[#0a0f1e]/80 border border-cyan-500/20">
                        <StatusDots />
                        <span className="font-mono text-[10px] text-gray-400 tracking-wider uppercase">System: Online</span>
                    </div>

                    <button
                        onClick={() => window.dispatchEvent(new CustomEvent('open-command-palette'))}
                        className="hidden md:flex items-center gap-1 px-2 py-1.5 border border-white/10 hover:border-cyan-500/30 text-gray-500 hover:text-cyan-400 transition-colors"
                        aria-label="Open command palette"
                    >
                        <span className="font-mono text-[10px] tracking-widest">&#8984;K</span>
                    </button>

                    <SignedOut>
                        <div className="flex items-center gap-2">
                            <SignInButton mode="modal">
                                <button className="font-mono text-xs text-gray-400 hover:text-white transition-colors tracking-widest uppercase px-2">
                                    Sign In
                                </button>
                            </SignInButton>
                            <SignUpButton mode="modal">
                                <TerminalButton>Get Started</TerminalButton>
                            </SignUpButton>
                        </div>
                    </SignedOut>

                    <SignedIn>
                        <div className="relative">
                            <div className="absolute inset-0 bg-cyan-500/10 blur-md" />
                            <UserButton
                                appearance={{
                                    elements: {
                                        avatarBox: "w-8 h-8 ring-1 ring-cyan-500/30 hover:ring-cyan-400/60 transition-all duration-300 rounded-none"
                                    }
                                }}
                            />
                        </div>
                    </SignedIn>
                </div>
            </div>
        </motion.header>
    )
}

export default LayoutHeader
