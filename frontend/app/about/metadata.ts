import { Metadata } from 'next'
import { SEO_CONFIG } from '@/lib/seo-config'

export const metadata: Metadata = {
  title: {
    template: `%s | ${SEO_CONFIG.site.name}`,
    default: 'About Us | LanaMind'
  },
  description: 'Learn about LanaMind\'s mission to revolutionize education through AI-powered personalized learning. Meet our team and discover how we\'re helping students worldwide achieve their full potential.',
  keywords: [
    'about lanamind',
    'ai tutoring company',
    'educational technology team',
    'personalized learning mission',
    'ai education startup',
    'lanamind story',
    'edtech company values',
    'ai learning platform founders',
    'education innovation team',
    'student success mission'
  ],
  authors: [{ name: 'LanaMind Team' }],
  creator: 'LanaMind Team',
  publisher: 'LanaMind Team',
  openGraph: {
    type: 'website',
    locale: SEO_CONFIG.site.locale,
    url: '/about',
    siteName: SEO_CONFIG.site.name,
    title: 'About LanaMind | Our Mission to Transform Education',
    description: 'Discover how LanaMind is revolutionizing education with AI-powered personalized learning. Meet our passionate team dedicated to student success.',
    images: [
      {
        url: '/about/opengraph-image.png',
        width: 1200,
        height: 630,
        alt: 'About LanaMind - Our Mission to Transform Education',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'About LanaMind | Revolutionizing Education with AI',
    description: 'Meet the team behind the AI tutoring platform that\'s changing how students learn worldwide.',
    images: ['/about/opengraph-image.png'],
    creator: SEO_CONFIG.social.twitter,
  },
  alternates: {
    canonical: '/about',
  },
}