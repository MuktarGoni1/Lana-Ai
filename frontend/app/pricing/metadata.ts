import { Metadata } from 'next'
import { SEO_CONFIG } from '@/lib/seo-config'
import { generateProductSchema } from '@/lib/structured-data'

export const metadata: Metadata = {
  title: {
    template: `%s | ${SEO_CONFIG.site.name}`,
    default: 'LanaMind Pricing – Flexible Plans for Every Learning Need'
  },
  description: 'Choose the perfect LanaMind plan for your family. From free access to premium features, our flexible pricing ensures every student can benefit from personalized AI tutoring.',
  keywords: ['AI tutoring pricing', 'education platform pricing', 'student learning plans', 'family subscription', 'AI tutor costs', 'learning platform plans', 'affordable AI education'],
  authors: [{ name: 'LanaMind Team' }],
  creator: 'LanaMind Team',
  publisher: 'LanaMind Team',
  openGraph: {
    type: 'website',
    locale: SEO_CONFIG.site.locale,
    url: '/pricing',
    siteName: SEO_CONFIG.site.name,
    title: 'LanaMind Pricing – Flexible Plans for Every Learning Need',
    description: 'Choose the perfect LanaMind plan for your family. From free access to premium features, our flexible pricing ensures every student can benefit from personalized AI tutoring.',
    images: [
      {
        url: '/pricing/opengraph-image.png',
        width: 1200,
        height: 630,
        alt: 'LanaMind Pricing Plans - Flexible Plans for Every Learning Need',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'LanaMind Pricing – Flexible Plans for Every Learning Need',
    description: 'Choose the perfect LanaMind plan for your family. From free access to premium features, our flexible pricing ensures every student can benefit from personalized AI tutoring.',
    images: ['/twitter-image.png'],
    creator: SEO_CONFIG.social.twitter,
  },
  alternates: {
    canonical: '/pricing',
  },
}

// Export structured data for use in client component
export const pricingStructuredData = [
  generateProductSchema(
    'Free',
    0,
    0,
    'Get started with LanaMind at no cost. Perfect for trying our AI tutoring platform.',
    ['Basic AI tutoring', 'Limited lesson access', 'Progress tracking', 'Parent dashboard']
  ),
  generateProductSchema(
    'Family',
    6,
    5,
    'Ideal for families wanting comprehensive AI-powered learning support with parental oversight.',
    ['Unlimited AI tutoring', 'All subjects covered', 'Advanced progress analytics', 'Parent dashboard', 'Quiz generation', 'Learning style adaptation']
  ),
  generateProductSchema(
    'Family Plus',
    35,
    29,
    'Premium plan with enhanced features for serious learners and families committed to academic excellence.',
    ['Everything in Family plan', 'Priority support', 'Advanced analytics', 'Custom learning paths', 'Video explanations', 'Offline access', 'Dedicated success manager']
  )
]