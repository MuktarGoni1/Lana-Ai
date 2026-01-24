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
import StructuredData from './structured-data'

export const metadata: Metadata = {
  title: 'LanaMind – AI Tutor for Clear, Structured Learning',
  description: 'LanaMind is a personalized AI tutor that explains topics step by step, generates quizzes, and helps students master subjects while keeping parents informed.',
  keywords: ['AI tutoring', 'personalized learning', 'education technology', 'student progress tracking', 'parent dashboard'],
  authors: [{ name: 'LanaMind Team' }],
  creator: 'LanaMind Team',
  publisher: 'LanaMind Team',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://lanamind.com',
    siteName: 'LanaMind',
    title: 'LanaMind – AI Tutor for Clear, Structured Learning',
    description: 'LanaMind is a personalized AI tutor that explains topics step by step, generates quizzes, and helps students master subjects while keeping parents informed.',
    images: [
      {
        url: '/icons/icon-512.png',
        width: 512,
        height: 512,
        alt: 'LanaMind Logo',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'LanaMind – AI Tutor for Clear, Structured Learning',
    description: 'LanaMind is a personalized AI tutor that explains topics step by step, generates quizzes, and helps students master subjects while keeping parents informed.',
    images: ['/icons/icon-512.png'],
  },
  icons: {
    icon: '/icons/icon-192.png',
    shortcut: '/icons/icon-16.png',
    apple: '/icons/icon-192.png',
  },
  manifest: '/manifest.json',
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={GeistSans.variable} suppressHydrationWarning>
      <head>
        <meta httpEquiv="Cache-Control" content="no-cache, no-store, must-revalidate" />
        <meta httpEquiv="Pragma" content="no-cache" />
        <meta httpEquiv="Expires" content="0" />
        <style>{`html{font-family:${GeistSans.style.fontFamily};--font-sans:${GeistSans.variable};--font-mono:${GeistMono.variable};}`}</style>
        <link rel="manifest" href="/manifest.json" />
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
        <StructuredData />
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
