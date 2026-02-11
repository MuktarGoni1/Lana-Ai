import { Metadata } from 'next';
import { SEO_CONFIG } from '@/lib/seo-config';

export const metadata: Metadata = {
  title: {
    template: `%s | ${SEO_CONFIG.site.name}`,
    default: 'LanaMind Features – Advanced AI Tutoring Capabilities'
  },
  description: 'Explore LanaMind\'s powerful features including adaptive lessons, real-time progress tracking, crystal-clear explanations, and personalized AI tutoring designed for students and parents.',
  keywords: [
    'AI tutoring features',
    'adaptive learning',
    'progress tracking',
    'personalized education',
    'student learning tools',
    'AI tutor capabilities',
    'real-time feedback',
    'learning analytics',
    'ai lesson generation',
    'smart tutoring system'
  ],
  authors: [{ name: 'LanaMind Team' }],
  creator: 'LanaMind Team',
  publisher: 'LanaMind Team',
  openGraph: {
    type: 'website',
    locale: SEO_CONFIG.site.locale,
    url: '/features',
    siteName: SEO_CONFIG.site.name,
    title: 'LanaMind Features – Advanced AI Tutoring Capabilities',
    description: 'Explore LanaMind\'s powerful features including adaptive lessons, real-time progress tracking, crystal-clear explanations, and personalized AI tutoring designed for students and parents.',
    images: [
      {
        url: '/features/opengraph-image.png',
        width: 1200,
        height: 630,
        alt: 'LanaMind Features - Advanced AI Tutoring Capabilities',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'LanaMind Features – Advanced AI Tutoring Capabilities',
    description: 'Explore LanaMind\'s powerful features including adaptive lessons, real-time progress tracking, crystal-clear explanations, and personalized AI tutoring designed for students and parents.',
    images: ['/features/opengraph-image.png'],
    creator: SEO_CONFIG.social.twitter,
  },
  alternates: {
    canonical: '/features',
  },
}