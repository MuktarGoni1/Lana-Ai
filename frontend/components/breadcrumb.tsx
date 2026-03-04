'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight, Home } from 'lucide-react';
import { generateBreadcrumbSchema, serializeJsonLd } from '@/lib/structured-data';
import Script from 'next/script';

interface BreadcrumbItem {
  name: string;
  url: string;
}

interface BreadcrumbNavProps {
  items?: BreadcrumbItem[];
  className?: string;
  showHome?: boolean;
}

// Map path segments to readable names
const pathNameMap: Record<string, string> = {
  'about': 'About Us',
  'features': 'Features',
  'pricing': 'Pricing',
  'blog': 'Blog',
  'contact': 'Contact',
  'careers': 'Careers',
  'demo': 'Demo',
  'login': 'Login',
  'register': 'Register',
  'homepage': 'Dashboard',
  'landing-page': 'Home',
  'privacy-policy': 'Privacy Policy',
  'terms-of-service': 'Terms of Service',
  'refund-policy': 'Refund Policy',
  'security-policy': 'Security Policy',
  'cookie-policy': 'Cookie Policy',
  'testimonials': 'Testimonials',
  'video-explainer': 'Video Explainer',
  'faq': 'FAQ',
  'support': 'Support',
  'help': 'Help Center',
};

export function BreadcrumbNav({ 
  items: customItems, 
  className = '',
  showHome = true 
}: BreadcrumbNavProps) {
  const pathname = usePathname();
  
  // Generate breadcrumb items from current path if not provided
  const breadcrumbItems: BreadcrumbItem[] = customItems || (() => {
    if (!pathname || pathname === '/') {
      return [];
    }

    const segments = pathname.split('/').filter(Boolean);
    const items: BreadcrumbItem[] = [];
    let currentPath = '';

    // Add home if requested
    if (showHome) {
      items.push({ name: 'Home', url: '/' });
    }

    // Build breadcrumb from path segments
    segments.forEach((segment, index) => {
      currentPath += `/${segment}`;
      
      // Check if it's a blog post (slug)
      if (segments[0] === 'blog' && index === 1) {
        // For blog posts, use a generic name or fetch actual title
        items.push({ 
          name: 'Article', 
          url: currentPath 
        });
      } else {
        items.push({
          name: pathNameMap[segment] || segment.charAt(0).toUpperCase() + segment.slice(1),
          url: currentPath
        });
      }
    });

    return items;
  })();

  // Don't render if only home or no items
  if (breadcrumbItems.length <= 1) {
    return null;
  }

  // Generate structured data
  const breadcrumbSchema = generateBreadcrumbSchema(breadcrumbItems);

  return (
    <>
      {/* Breadcrumb Structured Data */}
      <Script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: serializeJsonLd(breadcrumbSchema)
        }}
      />
      
      {/* Visual Breadcrumb Navigation */}
      <nav 
        aria-label="Breadcrumb" 
        className={`py-4 ${className}`}
      >
        <ol className="flex flex-wrap items-center gap-2 text-sm">
          {breadcrumbItems.map((item, index) => {
            const isLast = index === breadcrumbItems.length - 1;
            const isFirst = index === 0;

            return (
              <li 
                key={item.url} 
                className="flex items-center"
              >
                {index > 0 && (
                  <ChevronRight 
                    className="w-4 h-4 mx-2 text-muted-foreground flex-shrink-0" 
                    aria-hidden="true"
                  />
                )}
                
                {isLast ? (
                  <span 
                    className="font-medium text-foreground"
                    aria-current="page"
                  >
                    {isFirst && showHome && (
                      <Home className="w-4 h-4 inline mr-1" />
                    )}
                    {item.name}
                  </span>
                ) : (
                  <Link
                    href={item.url}
                    className="text-muted-foreground hover:text-foreground transition-colors flex items-center"
                  >
                    {isFirst && showHome && (
                      <Home className="w-4 h-4 inline mr-1" />
                    )}
                    {item.name}
                  </Link>
                )}
              </li>
            );
          })}
        </ol>
      </nav>
    </>
  );
}

// Pre-defined breadcrumb configurations for common pages
export const breadcrumbConfigs = {
  blog: [
    { name: 'Home', url: '/' },
    { name: 'Blog', url: '/blog' },
  ],
  pricing: [
    { name: 'Home', url: '/' },
    { name: 'Pricing', url: '/pricing' },
  ],
  features: [
    { name: 'Home', url: '/' },
    { name: 'Features', url: '/features' },
  ],
  about: [
    { name: 'Home', url: '/' },
    { name: 'About Us', url: '/about' },
  ],
  contact: [
    { name: 'Home', url: '/' },
    { name: 'Contact', url: '/contact' },
  ],
  careers: [
    { name: 'Home', url: '/' },
    { name: 'Careers', url: '/careers' },
  ],
  testimonials: [
    { name: 'Home', url: '/' },
    { name: 'Testimonials', url: '/testimonials' },
  ],
  policies: [
    { name: 'Home', url: '/' },
    { name: 'Legal', url: '#' },
  ],
};

export default BreadcrumbNav;
