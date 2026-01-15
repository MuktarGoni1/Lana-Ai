import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'LanaMind – AI Tutor for Clear, Structured Learning',
  description: 'LanaMind is a personalized AI tutor that explains topics step by step, generates quizzes, and helps students master subjects while keeping parents informed.',
  keywords: ['AI tutoring', 'personalized learning', 'education technology', 'student progress tracking', 'parent dashboard'],
  authors: [{ name: 'LanaMind Team' }],
  creator: 'LanaMind Team',
  publisher: 'LanaMind Team',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://lanamind.com/landing-page',
    siteName: 'LanaMind',
    title: 'LanaMind – AI Tutor for Clear, Structured Learning',
    description: 'LanaMind is a personalized AI tutor that explains topics step by step, generates quizzes, and helps students master subjects while keeping parents informed.',
    images: [
      {
        url: '/icons/icon-512.png',
        width: 512,
        height: 512,
        alt: 'LanaMind Logo',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'LanaMind – AI Tutor for Clear, Structured Learning',
    description: 'LanaMind is a personalized AI tutor that explains topics step by step, generates quizzes, and helps students master subjects while keeping parents informed.',
    images: ['/icons/icon-512.png'],
  },
  alternates: {
    canonical: 'https://lanamind.com',
  },
};