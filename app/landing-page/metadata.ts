import { Metadata } from 'next'
import { SEO_CONFIG } from '@/lib/seo-config'

export const metadata: Metadata = {
  title: {
    template: `%s | ${SEO_CONFIG.site.name}`,
    default: 'LanaMind – AI Tutor for Clear, Structured Learning'
  },
  description: 'Transform your child\'s education with LanaMind\'s AI-powered tutoring platform. Personalized learning, real-time progress tracking, and adaptive teaching methods for students of all ages.',
  keywords: [
    'ai tutoring software',
    'personalized learning platform', 
    'ai homework helper',
    'educational ai tools',
    'smart tutoring system',
    'ai learning assistant',
    'virtual tutoring service',
    'online ai tutor for kids',
    'adaptive learning technology',
    'student progress analytics'
  ],
  authors: [{ name: 'LanaMind Team' }],
  creator: 'LanaMind Team',
  publisher: 'LanaMind Team',
  openGraph: {
    type: 'website',
    locale: SEO_CONFIG.site.locale,
    url: '/landing-page',
    siteName: SEO_CONFIG.site.name,
    title: 'LanaMind – Revolutionary AI Tutoring Platform',
    description: 'Experience the future of education with LanaMind\'s intelligent AI tutor that adapts to each student\'s unique learning style and pace.',
    images: [
      {
        url: '/opengraph-image.png',
        width: 1200,
        height: 630,
        alt: 'LanaMind AI Tutoring Platform - Personalized Learning for Every Student',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'LanaMind – AI-Powered Personalized Learning Platform',
    description: 'Revolutionary AI tutoring that understands and adapts to your child\'s unique learning journey. Try it free today!',
    images: ['/twitter-image.png'],
    creator: SEO_CONFIG.social.twitter,
  },
  alternates: {
    canonical: '/',
  },
}