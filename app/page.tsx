// Root page - serves landing page content directly for optimal SEO
// This ensures Googlebot sees content immediately without redirects

import { Metadata } from 'next'
import { SEO_CONFIG } from '@/lib/seo-config'
import LandingPageServer from '@/components/landing-page-server'

export const metadata: Metadata = {
  metadataBase: new URL(SEO_CONFIG.site.url),
  title: 'LanaMind – AI Tutor for Clear, Structured Learning',
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
    locale: 'en_US',
    url: 'https://lanamind.com',
    siteName: 'LanaMind',
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
  },
  alternates: {
    canonical: 'https://lanamind.com',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
}

export default function Home() {
  return <LandingPageServer />
}
