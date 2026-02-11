// Structured Data (JSON-LD) Implementation
import { SEO_CONFIG } from './seo-config';

// Base types for structured data
interface JsonLdBase {
  '@context': 'https://schema.org';
  '@type': string;
}

// Organization Schema
export interface OrganizationSchema extends JsonLdBase {
  '@type': 'Organization';
  name: string;
  url: string;
  logo: string;
  sameAs: string[];
  description: string;
}

// Product Schema
export interface ProductSchema extends JsonLdBase {
  '@type': 'Product';
  name: string;
  description: string;
  brand: {
    '@type': 'Brand';
    name: string;
  };
  offers: {
    '@type': 'Offer';
    priceCurrency: string;
    price: number;
    priceValidUntil?: string;
    availability: string;
    url: string;
  }[];
}

// FAQ Schema
export interface FaqSchema extends JsonLdBase {
  '@type': 'FAQPage';
  mainEntity: {
    '@type': 'Question';
    name: string;
    acceptedAnswer: {
      '@type': 'Answer';
      text: string;
    };
  }[];
}

// Breadcrumb Schema
export interface BreadcrumbSchema extends JsonLdBase {
  '@type': 'BreadcrumbList';
  itemListElement: {
    '@type': 'ListItem';
    position: number;
    name: string;
    item: string;
  }[];
}

// Article Schema
export interface ArticleSchema extends JsonLdBase {
  '@type': 'Article';
  headline: string;
  description: string;
  author: {
    '@type': 'Person';
    name: string;
  };
  publisher: OrganizationSchema;
  datePublished: string;
  dateModified: string;
  image: string[];
  articleBody?: string;
}

// Generate Organization Schema
export function generateOrganizationSchema(): OrganizationSchema {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SEO_CONFIG.site.name,
    url: SEO_CONFIG.site.url,
    logo: `${SEO_CONFIG.site.url}/icons/icon-512.png`,
    sameAs: [
      `https://twitter.com/${SEO_CONFIG.social.twitter}`,
      `https://facebook.com/${SEO_CONFIG.social.facebook}`
    ],
    description: SEO_CONFIG.site.description
  };
}

// Generate Product Schema for pricing plans
export function generateProductSchema(
  planName: string,
  monthlyPrice: number,
  yearlyPrice: number,
  description: string,
  features: string[]
): ProductSchema {
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: `${SEO_CONFIG.site.name} ${planName} Plan`,
    description: description,
    brand: {
      '@type': 'Brand',
      name: SEO_CONFIG.site.name
    },
    offers: [
      {
        '@type': 'Offer',
        priceCurrency: 'USD',
        price: monthlyPrice,
        availability: 'https://schema.org/InStock',
        url: `${SEO_CONFIG.site.url}/pricing#${planName.toLowerCase().replace(/\s+/g, '-')}-monthly`
      },
      {
        '@type': 'Offer',
        priceCurrency: 'USD',
        price: yearlyPrice,
        priceValidUntil: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString(),
        availability: 'https://schema.org/InStock',
        url: `${SEO_CONFIG.site.url}/pricing#${planName.toLowerCase().replace(/\s+/g, '-')}-yearly`
      }
    ]
  };
}

// Generate FAQ Schema
export function generateFaqSchema(questions: Array<{ question: string; answer: string }>): FaqSchema {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: questions.map((qa, index) => ({
      '@type': 'Question',
      name: qa.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: qa.answer
      }
    }))
  };
}

// Generate Breadcrumb Schema
export function generateBreadcrumbSchema(items: Array<{ name: string; url: string }>): BreadcrumbSchema {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: `${SEO_CONFIG.site.url}${item.url}`
    }))
  };
}

// Generate Article Schema
export function generateArticleSchema(
  title: string,
  description: string,
  publishedDate: string,
  modifiedDate: string,
  author: string = 'LanaMind Team'
): ArticleSchema {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: title,
    description: description,
    author: {
      '@type': 'Person',
      name: author
    },
    publisher: generateOrganizationSchema(),
    datePublished: publishedDate,
    dateModified: modifiedDate,
    image: [`${SEO_CONFIG.site.url}${SEO_CONFIG.site.defaultImage}`]
  };
}

// Helper to serialize JSON-LD for Next.js Head component
export function serializeJsonLd(data: any): string {
  return JSON.stringify(data, null, 2);
}