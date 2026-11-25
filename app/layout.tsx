import type { Metadata } from 'next'
import { ClerkProvider } from '@clerk/nextjs'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'
import ConditionalLayoutHeader from '@/components/ConditionalLayoutHeader'
import Providers from './providers'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

const SITE_TITLE = 'P.R.A.N. \u2013 Public Reputation and Analysis Node'
const SITE_DESCRIPTION =
  'AI-assisted analytics for X (Twitter): scheduled profile scraping, computed engagement metrics, and LLM-written performance reports and content suggestions.'

export const metadata: Metadata = {
  metadataBase: new URL('https://orm-pran.vercel.app'),
  title: { default: SITE_TITLE, template: '%s | P.R.A.N.' },
  description: SITE_DESCRIPTION,
  applicationName: 'P.R.A.N.',
  openGraph: {
    type: 'website',
    siteName: 'P.R.A.N.',
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
  },
  twitter: {
    card: 'summary_large_image',
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
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
            <ConditionalLayoutHeader />
            {children}
          </Providers>
        </body>
      </html>
    </ClerkProvider>
  )
}