'use client'

import { useTheme } from "next-themes"
import { useEffect, useState } from "react"


export default function ThemeSwitch() {

    const [mounted, setMounted] = useState(false) // Corrected useState usage
    const { setTheme, resolvedTheme } = useTheme()

    useEffect(() => {
        setMounted(true)
    }, [])

    if (!mounted) {
        return null // Avoid rendering server-side to prevent hydration mismatch
    }

    return (
        <div>
            <button onClick={() => setTheme('light')} disabled={resolvedTheme === 'light'}>
                Light
            </button>
            <button onClick={() => setTheme('dark')} disabled={resolvedTheme === 'dark'}>
                Dark
            </button>
            <button onClick={() => setTheme('system')}>
                System
            </button>
            <p>Current theme: {resolvedTheme}</p> {/* Optional: Display current theme */}
        </div>
    )
}