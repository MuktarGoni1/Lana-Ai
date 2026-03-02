import { Metadata } from 'next'
import { SEO_CONFIG } from '@/lib/seo-config'

export const metadata: Metadata = {
  title: {
    template: `%s | ${SEO_CONFIG.site.name}`,
    default: 'Testimonials | LanaMind'
  },
  description: 'See what parents and students are saying about LanaMind. Real success stories from families using our AI tutoring platform to achieve academic excellence.',
  keywords: [
    'lanamind reviews',
    'ai tutoring testimonials',
    'parent reviews',
    'student success stories',
    'educational platform reviews',
    'customer testimonials',
    'learning outcomes',
    'academic improvement',
    'user experiences',
    'family reviews'
  ],
  authors: [{ name: 'LanaMind Team' }],
  creator: 'LanaMind Team',
  publisher: 'LanaMind Team',
  openGraph: {
    type: 'website',
    locale: SEO_CONFIG.site.locale,
    url: '/testimonials',
    siteName: SEO_CONFIG.site.name,
    title: 'LanaMind Testimonials | Success Stories from Real Families',
    description: 'Discover how LanaMind has helped thousands of students improve their grades and confidence. Read real reviews from parents and students.',
    images: [
      {
        url: '/opengraph-image.png',
        width: 1200,
        height: 630,
        alt: 'LanaMind Testimonials and Success Stories',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'LanaMind Testimonials | Real Success Stories',
    description: 'See what families are saying about their experience with LanaMind AI tutoring.',
    images: ['/opengraph-image.png'],
    creator: SEO_CONFIG.social.twitter,
  },
  alternates: {
    canonical: '/testimonials',
  },
}