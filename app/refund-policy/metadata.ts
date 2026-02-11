import { Metadata } from 'next'
import { SEO_CONFIG } from '@/lib/seo-config'

export const metadata: Metadata = {
  title: {
    template: `%s | ${SEO_CONFIG.site.name}`,
    default: 'Refund Policy | LanaMind'
  },
  description: 'Learn about LanaMind\'s refund policy. We offer a 30-day money-back guarantee on all premium subscriptions. Your satisfaction is our priority.',
  keywords: [
    'refund policy',
    'money back guarantee',
    'cancellation policy',
    'subscription refund',
    'return policy',
    'satisfaction guarantee',
    'refund request',
    'billing terms',
    'payment policy',
    'subscription terms'
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
    url: '/refund-policy',
    siteName: SEO_CONFIG.site.name,
    title: 'Refund Policy | LanaMind',
    description: 'Our 30-day money-back guarantee and refund process explained.',
    images: [
      {
        url: '/opengraph-image.png',
        width: 1200,
        height: 630,
        alt: 'LanaMind Refund Policy',
      },
    ],
  },
  twitter: {
    card: 'summary',
    title: 'Refund Policy | LanaMind',
    description: '30-day money-back guarantee on all premium subscriptions.',
  },
  alternates: {
    canonical: '/refund-policy',
  },
}