'use client'

import { SignedIn, SignedOut, SignInButton, SignUpButton, UserButton } from "@clerk/nextjs"
import { UseSyncClient } from "@/app/hooks/useSyncClient"


const LayoutHeader = () => {

    UseSyncClient()

    return (
        <header className="flex justify-end items-center p-4 gap-4 h-16">
        <SignedOut>
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