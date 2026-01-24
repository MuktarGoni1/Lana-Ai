import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'LanaMind Pricing – Flexible Plans for Every Learning Need',
  description: 'Choose the perfect LanaMind plan for your family. From free access to premium features, our flexible pricing ensures every student can benefit from personalized AI tutoring.',
  keywords: ['AI tutoring pricing', 'education platform pricing', 'student learning plans', 'family subscription', 'AI tutor costs', 'learning platform plans'],
  authors: [{ name: 'LanaMind Team' }],
  creator: 'LanaMind Team',
  publisher: 'LanaMind Team',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://lanamind.com/pricing',
    siteName: 'LanaMind',
    title: 'LanaMind Pricing – Flexible Plans for Every Learning Need',
    description: 'Choose the perfect LanaMind plan for your family. From free access to premium features, our flexible pricing ensures every student can benefit from personalized AI tutoring.',
    images: [
      {
        url: '/icons/icon-512.png',
        width: 512,
        height: 512,
        alt: 'LanaMind Pricing',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'LanaMind Pricing – Flexible Plans for Every Learning Need',
    description: 'Choose the perfect LanaMind plan for your family. From free access to premium features, our flexible pricing ensures every student can benefit from personalized AI tutoring.',
    images: ['/icons/icon-512.png'],
  },
  alternates: {
    canonical: 'https://lanamind.com/pricing',
  },
};