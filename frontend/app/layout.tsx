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
    template: '%s | LANA AI - Personalized Learning',
  },
  description: 'Personalized AI tutoring platform helping students excel with adaptive lessons, real-time progress tracking, and expert math support.',
  keywords: ['AI tutor', 'personalized learning', 'education technology', 'student success', 'adaptive learning', 'math tutoring', 'homework help', 'online tutoring'],
  authors: [{ name: 'LANA AI Team', url: 'https://www.lanamind.com' }],
  creator: 'LANA AI',
  publisher: 'LANA AI',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://www.lanamind.com'),
  other: {
    'google-site-verification': 'AbCdEfGhIjKlMnOpQrStUvWxYz',
    'facebook-domain-verification': 'AbCdEfGhIjKlMnOpQrStUvWxYz'
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: process.env.NEXT_PUBLIC_APP_URL || 'https://www.lanamind.com',
    title: 'LANA AI - Personalized AI Tutor for Students',
    description: 'Personalized AI tutoring platform helping students excel with adaptive lessons, real-time progress tracking, and expert math support.',
    siteName: 'LANA AI',
    images: [
      {
        url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://www.lanamind.com'}/og-image.jpg`,
        width: 1200,
        height: 630,
        alt: 'LANA AI - Personalized Learning Platform',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'LANA AI - Personalized AI Tutor for Students',
    description: 'Personalized AI tutoring platform helping students excel with adaptive lessons, real-time progress tracking, and expert math support.',
    images: [`${process.env.NEXT_PUBLIC_APP_URL || 'https://www.lanamind.com'}/twitter-image.jpg`],
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
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
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
              "legalName": "LANA AI Education Technologies Inc.",
              "alternateName": "LANA AI - Personalized AI Tutor for Students",
              "description": "Personalized AI tutoring platform helping students excel with adaptive lessons, real-time progress tracking, and expert math support.",
              "url": process.env.NEXT_PUBLIC_APP_URL || "https://www.lanamind.com",
              "logo": (process.env.NEXT_PUBLIC_APP_URL || "https://www.lanamind.com") + "/images/lana-logo-transparent.png",
              "image": (process.env.NEXT_PUBLIC_APP_URL || "https://www.lanamind.com") + "/og-image.jpg",
              "foundingDate": "2024",
              "knowsAbout": ["AI Tutoring", "Education Technology", "Personalized Learning", "Mathematics", "Homework Help"],
              "contactPoint": {
                "@type": "ContactPoint",
                "contactType": "customer service",
                "email": "contact@lanamind.com",
                "areaServed": "Worldwide",
                "availableLanguage": ["en"]
              },
              "address": {
                "@type": "PostalAddress",
                "addressCountry": "US"
              },
              "sameAs": [
                "https://X.com/Lana-ai",
                "https://www.facebook.com/Lana Ai",
                "https://www.instagram.com/Lanamind",
                "https://www.linkedin.com/company/lana-ai"
              ]
            })
          }}
        />
        {/* JSON-LD for FAQ */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "FAQPage",
              "mainEntity": [
                {
                  "@type": "Question",
                  "name": "How does LANA AI personalize learning?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "LANA AI adapts to each student's unique learning style, pace, and preferences to provide personalized lessons and explanations."
                  }
                },
                {
                  "@type": "Question",
                  "name": "Is LANA AI suitable for all ages?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Yes, LANA AI offers age-appropriate content and adjusts difficulty based on the student's grade level and learning needs."
                  }
                }
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
