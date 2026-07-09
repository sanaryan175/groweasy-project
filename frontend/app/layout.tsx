import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { ErrorBoundary } from '@/components/error-boundary'
import { DarkModeToggle } from '@/components/dark-mode-toggle'
import './globals.css'

export const metadata: Metadata = {
  title: 'Groweasy — AI-Powered CSV Import',
  description: 'Import and map CSV data to CRM records using AI',
}

export const viewport: Viewport = {
  colorScheme: 'light dark',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: 'white' },
    { media: '(prefers-color-scheme: dark)', color: 'black' },
  ],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased">
        <ErrorBoundary>
          <div className="fixed top-4 right-4 z-50">
            <DarkModeToggle />
          </div>
          {children}
        </ErrorBoundary>
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
