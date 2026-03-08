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
import { GoogleAnalytics } from '@/components/google-analytics'
import { SEO_CONFIG } from '@/lib/seo-config'
import { generateOrganizationSchema, serializeJsonLd } from '@/lib/structured-data'

export const metadata: Metadata = {
  metadataBase: new URL(SEO_CONFIG.site.url),
  title: {
    default: 'Lanamind - AI Learning Assistant for Students',
    template: '%s | Lanamind',
  },
  description:
    'Lanamind is an AI-powered learning assistant that creates personalized lessons, quizzes, and study plans for students aged 5 to 18.',
  keywords: [
    'lanamind',
    'lana mind',
    'LanaMind',
    'AI tutor',
    'AI learning assistant',
    'personalized lessons',
    'study app for kids',
  ],
  authors: [{ name: 'Lanamind' }],
  creator: 'Lanamind',
  publisher: 'Lanamind',
  openGraph: {
    type: 'website',
    locale: 'en_GB',
    url: 'https://lanamind.com',
    siteName: 'Lanamind',
    title: 'Lanamind - AI Learning Assistant for Students',
    description: 'Personalized AI lessons, quizzes, and study plans for students aged 5 to 18.',
    images: [
      {
        url: '/opengraph-image',
        width: 1200,
        height: 630,
        alt: 'Lanamind',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Lanamind - AI Learning Assistant for Students',
    description: 'Personalized AI lessons, quizzes, and study plans for students aged 5 to 18.',
    images: ['/twitter-image'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
  alternates: {
    canonical: 'https://lanamind.com',
    languages: {
      en: 'https://lanamind.com',
      'en-GB': 'https://lanamind.com',
    },
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
        <style>{`html{font-family:${GeistSans.style.fontFamily};--font-sans:${GeistSans.variable};--font-mono:${GeistMono.variable};}`}</style>
        <link rel="manifest" href="/manifest.json" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: serializeJsonLd(generateOrganizationSchema())
          }}
        />
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
              <GoogleAnalytics />
            </ClientProviders>
          </UnifiedAuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
