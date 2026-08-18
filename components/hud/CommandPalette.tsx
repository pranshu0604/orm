'use client';

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { useClerk, useUser } from '@clerk/nextjs';
import { motion, AnimatePresence } from 'framer-motion';

type Command = {
  id: string;
  label: string;
  group: 'Navigate' | 'Theme' | 'Session';
  run: () => void;
};

export default function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const { setTheme } = useTheme();
  const { signOut } = useClerk();
  const { isSignedIn } = useUser();

  const close = useCallback(() => {
    setOpen(false);
    setQuery('');
    setActiveIndex(0);
  }, []);

  const commands = useMemo<Command[]>(() => {
    const nav: Command[] = [
      { id: 'nav-home', label: 'Go to Dashboard', group: 'Navigate', run: () => router.push('/') },
      { id: 'nav-settings', label: 'Go to Settings / Connections', group: 'Navigate', run: () => router.push('/settings/connections') },
    ];
    const theme: Command[] = [
      { id: 'theme-dark', label: 'Switch to Dark theme', group: 'Theme', run: () => setTheme('dark') },
      { id: 'theme-light', label: 'Switch to Light theme', group: 'Theme', run: () => setTheme('light') },
      { id: 'theme-system', label: 'Switch to System theme', group: 'Theme', run: () => setTheme('system') },
    ];
    const session: Command[] = isSignedIn
      ? [{ id: 'sign-out', label: 'Sign out', group: 'Session', run: () => signOut({ redirectUrl: '/' }) }]
      : [];
    return [...nav, ...theme, ...session];
  }, [router, setTheme, signOut, isSignedIn]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return commands;
    return commands.filter((c) => c.label.toLowerCase().includes(q));
  }, [commands, query]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  useEffect(() => {
    const handleGlobalKeydown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen((o) => !o);
      } else if (e.key === 'Escape') {
        close();
      }
    };
    const handleOpenEvent = () => setOpen(true);
    window.addEventListener('keydown', handleGlobalKeydown);
    window.addEventListener('open-command-palette', handleOpenEvent);
    return () => {
      window.removeEventListener('keydown', handleGlobalKeydown);
      window.removeEventListener('open-command-palette', handleOpenEvent);
    };
  }, [close]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 0);
  }, [open]);

  const runCommand = (cmd: Command) => {
    cmd.run();
    close();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filtered[activeIndex]) runCommand(filtered[activeIndex]);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-start justify-center pt-[15vh] px-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={close}
        >
          <motion.div
            className="relative w-full max-w-lg bg-[#0a0f1e] border border-cyan-500/20"
            initial={{ opacity: 0, y: -10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="absolute -top-1 -left-1 w-3 h-3 border-l-2 border-t-2 border-cyan-500/60" />
            <div className="absolute -top-1 -right-1 w-3 h-3 border-r-2 border-t-2 border-cyan-500/60" />
            <div className="absolute -bottom-1 -left-1 w-3 h-3 border-l-2 border-b-2 border-cyan-500/60" />
            <div className="absolute -bottom-1 -right-1 w-3 h-3 border-r-2 border-b-2 border-cyan-500/60" />

            <div className="flex items-center gap-2 px-4 py-3 border-b border-white/10">
              <span className="font-mono text-cyan-400/80 text-sm">&gt;</span>
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type a command…"
                className="flex-1 bg-transparent text-white font-mono text-sm placeholder-gray-600 focus:outline-none"
              />
              <span className="font-mono text-[10px] text-gray-600 border border-white/10 px-1.5 py-0.5">ESC</span>
            </div>

            <div className="max-h-72 overflow-y-auto py-2">
              {filtered.length === 0 ? (
                <p className="font-mono text-xs text-gray-600 px-4 py-6 text-center">No matching commands</p>
              ) : (
                filtered.map((cmd, i) => (
                  <button
                    key={cmd.id}
                    onClick={() => runCommand(cmd)}
                    onMouseEnter={() => setActiveIndex(i)}
                    className={`w-full flex items-center justify-between px-4 py-2 text-left transition-colors ${
                      i === activeIndex ? 'bg-cyan-500/10 text-white' : 'text-gray-400'
                    }`}
                  >
                    <span className="text-sm font-light">{cmd.label}</span>
                    <span className="font-mono text-[10px] text-gray-600 uppercase tracking-widest">{cmd.group}</span>
                  </button>
                ))
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
