import { Metadata } from 'next'
import { SEO_CONFIG } from '@/lib/seo-config'

export const metadata: Metadata = {
  title: {
    template: `%s | ${SEO_CONFIG.site.name}`,
    default: 'Video Explainer | LanaMind'
  },
  description: 'Watch how LanaMind\'s AI tutoring works in action. See our platform explain complex topics, generate personalized lessons, and help students learn effectively.',
  keywords: [
    'ai tutoring demo',
    'educational video',
    'lanamind demo',
    'ai learning video',
    'tutoring platform demo',
    'how it works video',
    'ai education demonstration',
    'personalized learning video',
    'student tutoring demo',
    'ai tutor in action'
  ],
  authors: [{ name: 'LanaMind Team' }],
  creator: 'LanaMind Team',
  publisher: 'LanaMind Team',
  openGraph: {
    type: 'video.other',
    locale: SEO_CONFIG.site.locale,
    url: '/video-explainer',
    siteName: SEO_CONFIG.site.name,
    title: 'See LanaMind in Action | AI Tutoring Video Demo',
    description: 'Watch how LanaMind\'s AI tutor helps students learn faster with personalized explanations and interactive lessons.',
    images: [
      {
        url: '/opengraph-image.png',
        width: 1200,
        height: 630,
        alt: 'LanaMind AI Tutoring Video Demonstration',
      },
    ],
    videos: [
      {
        url: '/video-explainer',
        width: 1280,
        height: 720,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'LanaMind Video Demo | See AI Tutoring in Action',
    description: 'Watch how our AI tutor creates personalized learning experiences for every student.',
    images: ['/opengraph-image.png'],
    creator: SEO_CONFIG.social.twitter,
  },
  alternates: {
    canonical: '/video-explainer',
  },
}