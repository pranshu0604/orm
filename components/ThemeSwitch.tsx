'use client'

import { useTheme } from "next-themes"
import { useEffect, useState } from "react"
import { FiSun, FiMoon, FiMonitor } from 'react-icons/fi'

export default function ThemeSwitch() {
    const [mounted, setMounted] = useState(false)
    const { theme, setTheme, resolvedTheme } = useTheme() // Get 'theme' to check for 'system' explicitly

    useEffect(() => {
        setMounted(true)
    }, [])

    if (!mounted) { // Prevents SSR mismatch. finally ahh!
        return <div className="flex items-center space-x-1 rounded-full p-1 bg-gray-200 dark:bg-gray-700 h-8 w-[76px]"></div>;
    }

    // Helper function for button classes
    const getButtonClasses = (buttonTheme: string) => {
        const isActive = theme === buttonTheme; // Check against 'theme', not 'resolvedTheme' for system
        return `
            rounded-full p-1 transition-colors duration-200 ease-in-out
            focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-emerald-500 dark:focus:ring-offset-gray-800
            ${isActive
                ? 'bg-white dark:bg-gray-800 text-emerald-600 dark:text-emerald-400 shadow-sm' // Active styles
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200' // Inactive styles
            }
        `;
    };

    return (
        <div className="flex items-center space-x-1 rounded-full p-1 bg-gray-200 dark:bg-gray-700">
            <button
                onClick={() => setTheme('light')}
                className={getButtonClasses('light')}
                aria-label="Switch to light theme"
                title="Light Theme"
            >
                <FiSun size={16} />
            </button>
            <button
                onClick={() => setTheme('dark')}
                className={getButtonClasses('dark')}
                aria-label="Switch to dark theme"
                title="Dark Theme"
            >
                <FiMoon size={16} />
            </button>
            <button
                onClick={() => setTheme('system')}
                className={getButtonClasses('system')}
                aria-label="Switch to system theme"
                title="System Theme"
            >
                <FiMonitor size={16} />
            </button>
            {/* Debug */}
            {/* <p className="ml-4 text-xs">Current: {resolvedTheme}</p> */}
        </div>
    )
}