'use client'

import { usePathname } from 'next/navigation'
import LayoutHeader from './LayoutHeader'

export default function ConditionalLayoutHeader() {
  const pathname = usePathname()

  // Don't show LayoutHeader on the homepage (waitlist page)
  if (pathname === '/') {
    return null
  }

  return <LayoutHeader />
}
