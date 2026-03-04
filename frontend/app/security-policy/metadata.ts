import { Metadata } from 'next'
import { SEO_CONFIG } from '@/lib/seo-config'

export const metadata: Metadata = {
  title: {
    template: `%s | ${SEO_CONFIG.site.name}`,
    default: 'Security Policy | LanaMind'
  },
  description: 'Learn about LanaMind\'s comprehensive security measures. We protect student data with enterprise-grade encryption, secure infrastructure, and strict access controls.',
  keywords: [
    'security policy',
    'data security',
    'encryption standards',
    'secure infrastructure',
    'student data protection',
    'cybersecurity',
    'data breach prevention',
    'ssl encryption',
    'secure hosting',
    'access controls'
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
    url: '/security-policy',
    siteName: SEO_CONFIG.site.name,
    title: 'Security Policy | LanaMind',
    description: 'Enterprise-grade security measures protecting your educational data.',
    images: [
      {
        url: '/opengraph-image.png',
        width: 1200,
        height: 630,
        alt: 'LanaMind Security Policy',
      },
    ],
  },
  twitter: {
    card: 'summary',
    title: 'Security Policy | LanaMind',
    description: 'Learn about our comprehensive security and data protection measures.',
  },
  alternates: {
    canonical: '/security-policy',
  },
}