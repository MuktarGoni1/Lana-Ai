// Structured data component for SEO
'use client';

import Script from 'next/script';

export default function StructuredData() {
  return (
    <Script
      id="structured-data"
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "EducationalOrganization",
          "name": "LanaMind",
          "description": "AI-powered personalized tutoring platform that explains topics step by step, generates quizzes, and helps students master subjects while keeping parents informed.",
          "url": "https://lanamind.com",
          "logo": "https://lanamind.com/icons/icon-512.png",
          "sameAs": [
            "https://twitter.com/lanamind",
            "https://facebook.com/lanamind",
            "https://instagram.com/lanamind"
          ],
          "founder": {
            "@type": "Person",
            "name": "Lana Ai Team"
          },
          "knowsAbout": [
            "AI tutoring",
            "Personalized learning",
            "Education technology",
            "Student progress tracking",
            "Parent dashboard"
          ],
          "aggregateRating": {
            "@type": "AggregateRating",
            "ratingValue": "4.8",
            "bestRating": "5",
            "worstRating": "1",
            "reviewCount": "1250"
          }
        })
      }}
    />
  );
}