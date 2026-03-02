import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Register for LanaMind – AI-Powered Learning Platform',
  description: 'Sign up for LanaMind to access personalized AI tutoring, track learning progress, and connect with an educational experience designed for students and parents.',
  keywords: ['AI tutoring sign up', 'education platform registration', 'student learning account', 'AI tutor signup', 'personalized learning'],
  authors: [{ name: 'LanaMind Team' }],
  creator: 'LanaMind Team',
  publisher: 'LanaMind Team',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://lanamind.com/register',
    siteName: 'LanaMind',
    title: 'Register for LanaMind – AI-Powered Learning Platform',
    description: 'Sign up for LanaMind to access personalized AI tutoring, track learning progress, and connect with an educational experience designed for students and parents.',
    images: [
      {
        url: '/icons/icon-512.png',
        width: 512,
        height: 512,
        alt: 'LanaMind Registration',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Register for LanaMind – AI-Powered Learning Platform',
    description: 'Sign up for LanaMind to access personalized AI tutoring, track learning progress, and connect with an educational experience designed for students and parents.',
    images: ['/icons/icon-512.png'],
  },
  alternates: {
    canonical: 'https://lanamind.com/register',
  },
};