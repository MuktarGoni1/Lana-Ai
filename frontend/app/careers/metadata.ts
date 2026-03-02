import { Metadata } from 'next'
import { SEO_CONFIG } from '@/lib/seo-config'

export const metadata: Metadata = {
  title: {
    template: `%s | ${SEO_CONFIG.site.name}`,
    default: 'Careers | LanaMind'
  },
  description: 'Join the LanaMind team and help shape the future of education. Explore open positions in engineering, product, design, and more. Remote-first culture.',
  keywords: [
    'lanamind careers',
    'edtech jobs',
    'ai education careers',
    'remote work',
    'software engineering jobs',
    'product manager jobs',
    'design jobs',
    'education technology careers',
    'startup jobs',
    'join our team'
  ],
  authors: [{ name: 'LanaMind Team' }],
  creator: 'LanaMind Team',
  publisher: 'LanaMind Team',
  openGraph: {
    type: 'website',
    locale: SEO_CONFIG.site.locale,
    url: '/careers',
    siteName: SEO_CONFIG.site.name,
    title: 'Careers at LanaMind | Shape the Future of Education',
    description: 'Join our mission to revolutionize education with AI. Explore exciting career opportunities in a remote-first, innovative environment.',
    images: [
      {
        url: '/opengraph-image.png',
        width: 1200,
        height: 630,
        alt: 'Careers at LanaMind - Join Our Team',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Careers at LanaMind | Join Our Mission',
    description: 'Help us revolutionize education. Check out our open positions and join our remote-first team.',
    images: ['/opengraph-image.png'],
    creator: SEO_CONFIG.social.twitter,
  },
  alternates: {
    canonical: '/careers',
  },
}