import type { Metadata } from 'next'
import { ClerkProvider } from '@clerk/nextjs'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'
import LayoutHeader from '@/components/LayoutHeader'
import Providers from './providers'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'P.R.A.N. \u2013 Public Reputation and Analysis Node',
  description: 'Online Reputation Management',
  icons: {
    icon: '/PRAN-icon.png',
    shortcut: '/PRAN-icon.png',
    apple: '/PRAN-icon.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
          <Providers>
            <LayoutHeader />
            {children}
          </Providers>
        </body>
      </html>
    </ClerkProvider>
  )
}