'use client'

import { useTheme } from "next-themes"
import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { FiSun, FiMoon, FiMonitor } from 'react-icons/fi'

export default function ThemeSwitch() {
    const [mounted, setMounted] = useState(false)
    const { theme, setTheme } = useTheme()

    useEffect(() => {
        setMounted(true)
    }, [])

    if (!mounted) {
        return (
            <div className="flex items-center p-1 rounded-full bg-white/5 border border-white/10 h-8 w-[84px]" />
        );
    }

    const themes = [
        { value: 'light', icon: FiSun, label: 'Light' },
        { value: 'dark', icon: FiMoon, label: 'Dark' },
        { value: 'system', icon: FiMonitor, label: 'System' },
    ] as const;

    return (
        <div className="flex items-center p-1 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm">
            {themes.map(({ value, icon: Icon, label }) => {
                const isActive = theme === value;
                return (
                    <motion.button
                        key={value}
                        onClick={() => setTheme(value)}
                        className={`relative rounded-full p-1.5 transition-colors duration-200 focus:outline-none ${
                            isActive
                                ? 'text-white'
                                : 'text-gray-500 hover:text-gray-300'
                        }`}
                        aria-label={`Switch to ${label} theme`}
                        title={`${label} Theme`}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                    >
                        {isActive && (
                            <motion.div
                                className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-600/80 to-purple-600/80"
                                layoutId="themeIndicator"
                                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                            />
                        )}
                        <Icon size={14} className="relative z-10" />
                    </motion.button>
                );
            })}
        </div>
    )
}
