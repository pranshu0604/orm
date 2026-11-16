'use client'

import { usePathname } from 'next/navigation'
import LayoutHeader from './LayoutHeader'

export default function ConditionalLayoutHeader() {
  const pathname = usePathname()

  // Don't show LayoutHeader on the focused onboarding wizard
  if (pathname.startsWith('/onboarding')) {
    return null
  }

  return <LayoutHeader />
}
