import { Metadata } from 'next'
import { SEO_CONFIG } from '@/lib/seo-config'

export const metadata: Metadata = {
  title: {
    template: `%s | ${SEO_CONFIG.site.name}`,
    default: 'Cookie Policy | LanaMind'
  },
  description: 'Learn how LanaMind uses cookies and similar technologies to improve your experience. Understand your choices regarding cookie settings and data collection.',
  keywords: [
    'cookie policy',
    'cookies',
    'tracking technologies',
    'cookie consent',
    'cookie settings',
    'web beacons',
    'local storage',
    'privacy preferences',
    'data collection',
    'cookie management'
  ],
  robots: {
    index: true,
    follow: true,
    nocache: true,
    googleBot: {
      index: true,
      follow: true,
      noimageindex: true,
    },
  },
  authors: [{ name: 'LanaMind Team' }],
  creator: 'LanaMind Team',
  publisher: 'LanaMind Team',
  openGraph: {
    type: 'website',
    locale: SEO_CONFIG.site.locale,
    url: '/cookie-policy',
    siteName: SEO_CONFIG.site.name,
    title: 'Cookie Policy | LanaMind',
    description: 'How we use cookies and tracking technologies to enhance your experience.',
    images: [
      {
        url: '/opengraph-image.png',
        width: 1200,
        height: 630,
        alt: 'LanaMind Cookie Policy',
      },
    ],
  },
  twitter: {
    card: 'summary',
    title: 'Cookie Policy | LanaMind',
    description: 'Learn about our cookie usage and privacy preferences.',
  },
  alternates: {
    canonical: '/cookie-policy',
  },
}