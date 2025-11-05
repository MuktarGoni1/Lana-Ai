import type { Metadata } from 'next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import './globals.css'
import { ClientProviders } from './providers'
import { ThemeProvider } from 'next-themes'
import ErrorBoundary from '@/components/error-boundary'

export const metadata: Metadata = {
  title: 'lana-ai',
  description: 'Created for students',
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={GeistSans.variable} suppressHydrationWarning>
      <head>
        <style dangerouslySetInnerHTML={{ __html: `html{font-family:${GeistSans.style.fontFamily};--font-sans:${GeistSans.variable};--font-mono:${GeistMono.variable};}` }} />
      </head>
      <body>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <ErrorBoundary>
            <ClientProviders>{children}</ClientProviders>
          </ErrorBoundary>
        </ThemeProvider>
      </body>
    </html>
  )
}