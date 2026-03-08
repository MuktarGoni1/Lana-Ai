import { Metadata } from 'next'
import { SEO_CONFIG } from '@/lib/seo-config'

export const metadata: Metadata = {
  title: {
    template: `%s | ${SEO_CONFIG.site.name}`,
    default: 'Lanamind - AI Learning Assistant for Students',
  },
  description:
    'Lanamind helps students learn faster with personalized AI lessons, quizzes, and study plans designed for ages 5 to 18.',
  keywords: [
    'lanamind',
    'lana mind',
    'ai tutoring software',
    'personalized learning platform',
    'ai learning assistant',
    'study app for kids',
  ],
  authors: [{ name: 'Lanamind' }],
  creator: 'Lanamind',
  publisher: 'Lanamind',
  openGraph: {
    type: 'website',
    locale: SEO_CONFIG.site.locale,
    url: 'https://lanamind.com',
    siteName: SEO_CONFIG.site.name,
    title: 'Lanamind - AI Learning Assistant for Students',
    description: 'Personalized AI lessons, quizzes, and study plans for students aged 5 to 18.',
    images: [
      {
        url: '/opengraph-image',
        width: 1200,
        height: 630,
        alt: 'Lanamind',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Lanamind - AI Learning Assistant for Students',
    description: 'Personalized AI lessons, quizzes, and study plans for students aged 5 to 18.',
    images: ['/twitter-image'],
    creator: SEO_CONFIG.social.twitter,
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
