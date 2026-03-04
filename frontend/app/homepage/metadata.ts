import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'LanaMind Dashboard – Your Personalized AI Learning Space',
  description: 'Access your personalized AI tutoring dashboard. Track progress, explore lessons, and continue your learning journey with LanaMind AI.',
  keywords: ['AI tutoring dashboard', 'learning progress', 'personalized education', 'student tracking', 'AI learning companion'],
  authors: [{ name: 'LanaMind Team' }],
  creator: 'LanaMind Team',
  publisher: 'LanaMind Team',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://lanamind.com/homepage',
    siteName: 'LanaMind',
    title: 'LanaMind Dashboard – Your Personalized AI Learning Space',
    description: 'Access your personalized AI tutoring dashboard. Track progress, explore lessons, and continue your learning journey with LanaMind AI.',
    images: [
      {
        url: '/icons/icon-512.png',
        width: 512,
        height: 512,
        alt: 'LanaMind Dashboard',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'LanaMind Dashboard – Your Personalized AI Learning Space',
    description: 'Access your personalized AI tutoring dashboard. Track progress, explore lessons, and continue your learning journey with LanaMind AI.',
    images: ['/icons/icon-512.png'],
  },
  alternates: {
    canonical: 'https://lanamind.com/homepage',
  },
};