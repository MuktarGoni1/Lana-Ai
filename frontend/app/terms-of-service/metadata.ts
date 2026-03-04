import { Metadata } from 'next'
import { SEO_CONFIG } from '@/lib/seo-config'

export const metadata: Metadata = {
  title: {
    template: `%s | ${SEO_CONFIG.site.name}`,
    default: 'Terms of Service | LanaMind'
  },
  description: 'Read LanaMind\'s Terms of Service. Understand your rights and responsibilities when using our AI tutoring platform and educational services.',
  keywords: [
    'terms of service',
    'terms and conditions',
    'user agreement',
    'service terms',
    'legal terms',
    'user rights',
    'platform usage',
    'acceptance terms',
    'service agreement',
    'educational services terms'
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
    url: '/terms-of-service',
    siteName: SEO_CONFIG.site.name,
    title: 'Terms of Service | LanaMind',
    description: 'Terms and conditions for using the LanaMind AI tutoring platform.',
    images: [
      {
        url: '/opengraph-image.png',
        width: 1200,
        height: 630,
        alt: 'LanaMind Terms of Service',
      },
    ],
  },
  twitter: {
    card: 'summary',
    title: 'Terms of Service | LanaMind',
    description: 'Legal terms and conditions for using LanaMind services.',
  },
  alternates: {
    canonical: '/terms-of-service',
  },
}