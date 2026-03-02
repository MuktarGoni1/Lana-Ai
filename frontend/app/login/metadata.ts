import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Log in to LanaMind – Access Your AI Learning Dashboard',
  description: 'Log in to your LanaMind account to access personalized AI tutoring, track learning progress, and continue your educational journey.',
  keywords: ['AI tutoring login', 'student dashboard access', 'learning platform login', 'AI tutor account', 'educational platform'],
  authors: [{ name: 'LanaMind Team' }],
  creator: 'LanaMind Team',
  publisher: 'LanaMind Team',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://lanamind.com/login',
    siteName: 'LanaMind',
    title: 'Log in to LanaMind – Access Your AI Learning Dashboard',
    description: 'Log in to your LanaMind account to access personalized AI tutoring, track learning progress, and continue your educational journey.',
    images: [
      {
        url: '/icons/icon-512.png',
        width: 512,
        height: 512,
        alt: 'LanaMind Login',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Log in to LanaMind – Access Your AI Learning Dashboard',
    description: 'Log in to your LanaMind account to access personalized AI tutoring, track learning progress, and continue your educational journey.',
    images: ['/icons/icon-512.png'],
  },
  alternates: {
    canonical: 'https://lanamind.com/login',
  },
};