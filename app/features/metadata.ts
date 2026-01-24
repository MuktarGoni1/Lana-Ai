import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'LanaMind Features – Advanced AI Tutoring Capabilities',
  description: 'Explore LanaMind\'s powerful features including adaptive lessons, real-time progress tracking, crystal-clear explanations, and personalized AI tutoring designed for students and parents.',
  keywords: ['AI tutoring features', 'adaptive learning', 'progress tracking', 'personalized education', 'student learning tools', 'AI tutor capabilities'],
  authors: [{ name: 'LanaMind Team' }],
  creator: 'LanaMind Team',
  publisher: 'LanaMind Team',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://lanamind.com/features',
    siteName: 'LanaMind',
    title: 'LanaMind Features – Advanced AI Tutoring Capabilities',
    description: 'Explore LanaMind\'s powerful features including adaptive lessons, real-time progress tracking, crystal-clear explanations, and personalized AI tutoring designed for students and parents.',
    images: [
      {
        url: '/icons/icon-512.png',
        width: 512,
        height: 512,
        alt: 'LanaMind Features',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'LanaMind Features – Advanced AI Tutoring Capabilities',
    description: 'Explore LanaMind\'s powerful features including adaptive lessons, real-time progress tracking, crystal-clear explanations, and personalized AI tutoring designed for students and parents.',
    images: ['/icons/icon-512.png'],
  },
  alternates: {
    canonical: 'https://lanamind.com/features',
  },
};