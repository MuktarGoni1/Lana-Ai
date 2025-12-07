import type { Metadata } from 'next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import './globals.css'
import { ClientProviders } from './providers'
import { ThemeProvider } from 'next-themes'
import { LocalChildrenManager } from '@/components/local-children-manager'
import { AuthProvider } from '@/contexts/AuthContext'
import { RobustAuthProvider } from '@/contexts/RobustAuthContext'
import SessionTimeoutHandler from '@/components/session-timeout-handler'
import { SessionMonitor } from '@/components/auth/SessionMonitor'

export const metadata: Metadata = {
  title: 'lana-ai',
  description: 'Created for students',
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={GeistSans.variable} suppressHydrationWarning>
      <head>
        <style>{`html{font-family:${GeistSans.style.fontFamily};--font-sans:${GeistSans.variable};--font-mono:${GeistMono.variable};}`}</style>
      </head>
      <body>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <AuthProvider>
            <RobustAuthProvider>
              <ClientProviders>
                {children}
                <LocalChildrenManager />
                <SessionTimeoutHandler />
                <SessionMonitor />
              </ClientProviders>
            </RobustAuthProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}