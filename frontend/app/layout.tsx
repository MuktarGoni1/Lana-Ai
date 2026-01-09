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
  title: {
    default: 'LANA AI - Personalized AI Tutor for Students',
    template: '%s | LANA AI',
  },
  description: 'LANA AI provides personalized AI tutoring to help students learn more effectively. Get structured lessons, quizzes, and math help.',
  keywords: ['education', 'AI tutor', 'learning', 'students', 'math', 'lessons'],
  authors: [{ name: 'LANA AI Team' }],
  creator: 'LANA AI',
  publisher: 'LANA AI',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://www.lanamind.com'), // Replace with your actual domain
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: process.env.NEXT_PUBLIC_APP_URL || 'https://www.lanamind.com', // Replace with your actual domain
    title: 'LANA AI - Personalized AI Tutor for Students',
    description: 'LANA AI provides personalized AI tutoring to help students learn more effectively. Get structured lessons, quizzes, and math help.',
    siteName: 'LANA AI',
    images: [
      {
        url: '/images/lana-logo-transparent.png', // For best results, create a 1200x630 version of your logo
        width: 1200,
        height: 630,
        alt: 'LANA AI Logo',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'LANA AI - Personalized AI Tutor for Students',
    description: 'LANA AI provides personalized AI tutoring to help students learn more effectively. Get structured lessons, quizzes, and math help.',
    images: ['/images/lana-logo-transparent.png'], // Twitter recommends 1200x600 or 1200x628
    creator: '@LANAAI',
  },
  icons: {
    icon: '/favicon.ico',
  },
  manifest: '/manifest.json',
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={GeistSans.variable} suppressHydrationWarning>
      <head>
        <style>{`html{font-family:${GeistSans.style.fontFamily};--font-sans:${GeistSans.variable};--font-mono:${GeistMono.variable};}`}</style>
        <link rel="manifest" href="/manifest.json" />
        {/* JSON-LD Structured Data for Organization */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "EducationalOrganization",
              "name": "LANA AI",
              "alternateName": "LANA AI - Personalized AI Tutor for Students",
              "description": "Personalized AI tutoring to help students learn more effectively",
              "url": process.env.NEXT_PUBLIC_APP_URL || "https://www.lanamind.com", // Replace with your actual domain
              "logo": (process.env.NEXT_PUBLIC_APP_URL || "https://www.lanamind.com") + "/images/lana-logo-transparent.png", // Replace with your actual domain
              "image": (process.env.NEXT_PUBLIC_APP_URL || "https://www.lanamind.com") + "/images/lana-logo-transparent.png", // Same as logo for consistency
              "foundingDate": "2024", // Replace with your actual founding date
              "contactPoint": {
                "@type": "ContactPoint",
                "contactType": "customer service",
                "areaServed": "Worldwide",
                "availableLanguage": "en"
              },
              "sameAs": [
                "https://twitter.com/LANAAI", // Replace with your social media links
                "https://www.facebook.com/LANAAI",
                "https://www.instagram.com/LANAAI"
              ]
            })
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
            </ClientProviders>
          </UnifiedAuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
