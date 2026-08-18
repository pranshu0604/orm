'use client'

import { ThemeProvider } from "next-themes"
import CommandPalette from "@/components/hud/CommandPalette"

export default function Providers({ children } : { children: React.ReactNode }){
    return (
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            <CommandPalette />
            {children}
        </ThemeProvider>
    )
}