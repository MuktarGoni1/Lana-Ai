import type { Metadata } from "next";
import LandingPageContent from './landing-page/LandingPageContent';
import { SEO_CONFIG } from "@/lib/seo-config";

export const metadata: Metadata = {
  title: "Lanamind - AI Learning Assistant for Students",
  description:
    "Lanamind helps students learn faster with personalized AI lessons, quizzes, and study plans designed for ages 5 to 18.",
  keywords: [
    "lanamind",
    "lana mind",
    "ai tutoring software",
    "personalized learning platform",
    "ai learning assistant",
    "study app for kids",
  ],
  openGraph: {
    type: "website",
    locale: SEO_CONFIG.site.locale,
    url: "https://lanamind.com",
    siteName: SEO_CONFIG.site.name,
    title: "Lanamind - AI Learning Assistant for Students",
    description:
      "Personalized AI lessons, quizzes, and study plans for students aged 5 to 18.",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "Lanamind",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Lanamind - AI Learning Assistant for Students",
    description:
      "Personalized AI lessons, quizzes, and study plans for students aged 5 to 18.",
    images: ["/twitter-image"],
  },
  alternates: {
    canonical: "https://lanamind.com",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootPage() {
  return <LandingPageContent />;
}
