import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'LanaMind Demo – Experience AI-Powered Learning',
  description: 'Try LanaMind\'s AI-powered tutoring platform firsthand. Experience personalized lessons, adaptive learning, and real-time progress tracking with our interactive demo.',
  keywords: ['AI tutoring demo', 'education platform demo', 'student learning trial', 'AI tutor experience', 'personalized learning demo'],
  authors: [{ name: 'LanaMind Team' }],
  creator: 'LanaMind Team',
  publisher: 'LanaMind Team',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://lanamind.com/demo',
    siteName: 'LanaMind',
    title: 'LanaMind Demo – Experience AI-Powered Learning',
    description: 'Try LanaMind\'s AI-powered tutoring platform firsthand. Experience personalized lessons, adaptive learning, and real-time progress tracking with our interactive demo.',
    images: [
      {
        url: '/icons/icon-512.png',
        width: 512,
        height: 512,
        alt: 'LanaMind Demo',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'LanaMind Demo – Experience AI-Powered Learning',
    description: 'Try LanaMind\'s AI-powered tutoring platform firsthand. Experience personalized lessons, adaptive learning, and real-time progress tracking with our interactive demo.',
    images: ['/icons/icon-512.png'],
  },
  alternates: {
    canonical: 'https://lanamind.com/demo',
  },
};