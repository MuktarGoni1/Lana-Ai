import { Metadata } from 'next'
import { SEO_CONFIG } from '@/lib/seo-config'

export const metadata: Metadata = {
  title: {
    template: `%s | ${SEO_CONFIG.site.name}`,
    default: 'Contact Us | LanaMind'
  },
  description: 'Get in touch with LanaMind\'s support team. We\'re here to help with questions about our AI tutoring platform, pricing, partnerships, or media inquiries.',
  keywords: [
    'contact lanamind',
    'ai tutoring support',
    'customer service',
    'help center',
    'support team',
    'contact us',
    'get in touch',
    'edtech support',
    'learning platform help',
    'technical support'
  ],
  authors: [{ name: 'LanaMind Team' }],
  creator: 'LanaMind Team',
  publisher: 'LanaMind Team',
  openGraph: {
    type: 'website',
    locale: SEO_CONFIG.site.locale,
    url: '/contact',
    siteName: SEO_CONFIG.site.name,
    title: 'Contact LanaMind | We\'re Here to Help',
    description: 'Reach out to our friendly support team for assistance with LanaMind AI tutoring platform. Quick response guaranteed.',
    images: [
      {
        url: '/opengraph-image.png',
        width: 1200,
        height: 630,
        alt: 'Contact LanaMind Support Team',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Contact LanaMind | Support & Inquiries',
    description: 'Questions about LanaMind? Our team is ready to assist you with any inquiries.',
    images: ['/opengraph-image.png'],
    creator: SEO_CONFIG.social.twitter,
  },
  alternates: {
    canonical: '/contact',
  },
}