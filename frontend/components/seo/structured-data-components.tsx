// Reusable SEO Component for consistent metadata implementation
import Script from 'next/script'
import { serializeJsonLd } from '@/lib/structured-data'

interface SeoComponentProps {
  organizationSchema?: any;
  productSchemas?: any[];
  faqSchema?: any;
  breadcrumbSchema?: any;
  articleSchema?: any;
}

export function SeoStructuredData({ 
  organizationSchema, 
  productSchemas = [], 
  faqSchema, 
  breadcrumbSchema, 
  articleSchema 
}: SeoComponentProps) {
  const schemas = [
    ...(organizationSchema ? [organizationSchema] : []),
    ...productSchemas,
    ...(faqSchema ? [faqSchema] : []),
    ...(breadcrumbSchema ? [breadcrumbSchema] : []),
    ...(articleSchema ? [articleSchema] : [])
  ];

  if (schemas.length === 0) return null;

  return (
    <>
      {schemas.map((schema, index) => (
        <Script
          key={index}
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: serializeJsonLd(schema)
          }}
        />
      ))}
    </>
  );
}

// Pre-built SEO components for common use cases

// FAQ Page SEO Component
interface FaqSeoProps {
  questions: Array<{ question: string; answer: string }>;
  pageTitle: string;
}

export function FaqSeo({ questions, pageTitle }: FaqSeoProps) {
  // This would generate FAQ schema - implementation depends on your FAQ structure
  return null;
}

// Blog Post SEO Component
interface BlogSeoProps {
  title: string;
  description: string;
  author: string;
  publishedDate: string;
  modifiedDate: string;
  imageUrl?: string;
}

export function BlogSeo({ 
  title, 
  description, 
  author, 
  publishedDate, 
  modifiedDate,
  imageUrl 
}: BlogSeoProps) {
  // This would generate Article schema
  return null;
}

// Landing Page SEO Component
interface LandingPageSeoProps {
  features: string[];
  testimonials?: Array<{ name: string; quote: string }>;
}

export function LandingPageSeo({ features, testimonials = [] }: LandingPageSeoProps) {
  // Generate appropriate schemas for landing pages
  return null;
}