import { Metadata } from 'next'
import { SEO_CONFIG } from '@/lib/seo-config'

export const metadata: Metadata = {
  title: {
    template: `%s | ${SEO_CONFIG.site.name}`,
    default: 'Privacy Policy | LanaMind'
  },
  description: 'Learn how LanaMind protects your privacy and handles your data. Our commitment to security and transparency in AI-powered education.',
  keywords: [
    'privacy policy',
    'data protection',
    'student data privacy',
    'gdpr compliance',
    'coppa compliance',
    'data security',
    'personal information',
    'cookie policy',
    'privacy rights',
    'data handling'
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
    url: '/privacy-policy',
    siteName: SEO_CONFIG.site.name,
    title: 'Privacy Policy | LanaMind',
    description: 'How we protect your data and respect your privacy at LanaMind.',
    images: [
      {
        url: '/opengraph-image.png',
        width: 1200,
        height: 630,
        alt: 'LanaMind Privacy Policy',
      },
    ],
  },
  twitter: {
    card: 'summary',
    title: 'Privacy Policy | LanaMind',
    description: 'Learn about our data protection and privacy practices.',
  },
  alternates: {
    canonical: '/privacy-policy',
  },
}