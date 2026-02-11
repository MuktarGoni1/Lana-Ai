import { Metadata } from 'next'
import { SEO_CONFIG } from '@/lib/seo-config'

export const metadata: Metadata = {
  title: {
    template: `%s | ${SEO_CONFIG.site.name}`,
    default: 'Blog | LanaMind'
  },
  description: 'Explore the latest insights on AI tutoring, personalized learning, educational technology, and student success strategies from the LanaMind team.',
  keywords: [
    'ai tutoring blog',
    'personalized learning articles',
    'educational technology insights',
    'student success tips',
    'ai in education',
    'learning strategies',
    'edtech trends',
    'parent tips education',
    'study techniques',
    'future of learning'
  ],
  authors: [{ name: 'LanaMind Team' }],
  creator: 'LanaMind Team',
  publisher: 'LanaMind Team',
  openGraph: {
    type: 'website',
    locale: SEO_CONFIG.site.locale,
    url: '/blog',
    siteName: SEO_CONFIG.site.name,
    title: 'LanaMind Blog | AI Tutoring & Learning Insights',
    description: 'Stay updated with the latest trends in AI education, personalized learning strategies, and tips for student success.',
    images: [
      {
        url: '/opengraph-image.png',
        width: 1200,
        height: 630,
        alt: 'LanaMind Blog - AI Tutoring and Learning Insights',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'LanaMind Blog | AI Education Insights',
    description: 'Discover articles on AI tutoring, personalized learning, and educational innovation.',
    images: ['/opengraph-image.png'],
    creator: SEO_CONFIG.social.twitter,
  },
  alternates: {
    canonical: '/blog',
  },
}