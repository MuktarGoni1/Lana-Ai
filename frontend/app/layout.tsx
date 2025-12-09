import type { Metadata } from 'next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import './globals.css'
import { ClientProviders } from './providers'
import { ThemeProvider } from 'next-themes'
import { LocalChildrenManager } from '@/components/local-children-manager'
import { UnifiedAuthProvider } from '@/contexts/UnifiedAuthContext'
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
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js')
                    .then(function(registration) {
                      console.log('[Service Worker] Registered with scope:', registration.scope);
                    })
                    .catch(function(error) {
                      console.log('[Service Worker] Registration failed:', error);
                    });
                });
              }
            `,
          }}
        />
      </head>
      <body>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <UnifiedAuthProvider>
            <ClientProviders>
              {children}
              <LocalChildrenManager />
              <SessionTimeoutHandler />
              <SessionMonitor />
            </ClientProviders>
          </UnifiedAuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}