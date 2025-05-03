'use client'

import { SignedIn, SignedOut, SignInButton, SignUpButton, UserButton } from "@clerk/nextjs"
import { useState, useEffect } from 'react';
import ThemeSwitch from "./ThemeSwitch"; // Import ThemeSwitch


const LayoutHeader = () => {
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    // Define base classes + theme-specific background/border
    // Light theme: white background, light gray bottom border
    // Dark theme: dark gray background, slightly darker gray bottom border
    const headerClasses = "flex justify-end items-center p-4 gap-4 h-16 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700";

    if (!isMounted) {
        // Render an empty header placeholder with the same base styles
        // This ensures the <header> tag exists on initial render and prevents layout shift
        return <header className={headerClasses}></header>;
    }

    return (
        <header className={headerClasses}>
            <ThemeSwitch /> {/* Add the theme switch */}
            <SignedOut>
              {/* Clerk buttons might adapt automatically or need custom styling via Clerk props */}
              <SignInButton />
              <SignUpButton />
            </SignedOut>
            <SignedIn>
              <UserButton />
            </SignedIn>
        </header>
    )
}
export default LayoutHeader