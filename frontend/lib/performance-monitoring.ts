// Core Web Vitals Monitoring and Performance Optimization
'use client'

import { useEffect } from 'react'

interface WebVitalsMetrics {
  lcp?: number;  // Largest Contentful Paint
  fid?: number;  // First Input Delay (now INP)
  cls?: number;  // Cumulative Layout Shift
  fcp?: number;  // First Contentful Paint
  ttfb?: number; // Time to First Byte
}

// Report Web Vitals to analytics
export function reportWebVitals(metric: any) {
  // Send to analytics service (Google Analytics, etc.)
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('event', metric.name, {
      event_category: 'Web Vitals',
      value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
      event_label: metric.id,
      non_interaction: true,
    });
  }
  
  // Also send to custom analytics endpoint
  if (process.env.NEXT_PUBLIC_ANALYTICS_URL) {
    fetch(process.env.NEXT_PUBLIC_ANALYTICS_URL, {
      method: 'POST',
      body: JSON.stringify({ 
        metric: metric.name,
        value: metric.value,
        id: metric.id,
        pathname: window.location.pathname,
      }),
      headers: {
        'Content-Type': 'application/json'
      }
    }).catch(() => {
      // Silently fail to avoid breaking the app
    });
  }
}

// Performance monitoring hook
export function usePerformanceMonitoring() {
  useEffect(() => {
    // Custom performance monitoring
    if ('performance' in window) {
      // Monitor long tasks
      if ('PerformanceObserver' in window) {
        const observer = new PerformanceObserver((list) => {
          list.getEntries().forEach((entry) => {
            if (entry.entryType === 'longtask' && (entry as any).duration > 50) {
              console.warn('Long task detected:', entry);
              // Report long tasks that impact INP
            }
          });
        });
        observer.observe({ entryTypes: ['longtask'] });
      }

      // Monitor resource loading
      window.addEventListener('load', () => {
        const perfData = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        
        // Report key performance metrics
        const metrics: WebVitalsMetrics = {
          lcp: perfData.loadEventEnd - perfData.fetchStart,
          fcp: perfData.domContentLoadedEventStart - perfData.fetchStart,
          ttfb: perfData.responseStart - perfData.requestStart,
          cls: 0, // Will be measured separately
        };

        // Calculate approximate CLS from layout shifts
        let cls = 0;
        const layoutShiftObserver = new PerformanceObserver((list) => {
          list.getEntries().forEach((entry) => {
            if (!(entry as any).hadRecentInput) {
              cls += (entry as any).value;
            }
          });
        });
        
        try {
          layoutShiftObserver.observe({ entryTypes: ['layout-shift'] });
          setTimeout(() => {
            layoutShiftObserver.disconnect();
            metrics.cls = cls;
            // Report final CLS
          }, 5000);
        } catch (e) {
          console.warn('Layout shift observation not supported');
        }

        console.log('Performance Metrics:', metrics);
      });
    }
  }, []);
}

// Image optimization utilities
export const imageOptimization = {
  // Responsive image breakpoints
  breakpoints: {
    xs: 320,
    sm: 640,
    md: 768,
    lg: 1024,
    xl: 1280,
    '2xl': 1536,
  },
  
  // Quality settings
  quality: {
    low: 60,
    medium: 75,
    high: 85,
    maximum: 90,
  },
  
  // Format priorities (modern browsers first)
  formats: ['avif', 'webp', 'jpg'],
  
  // Generate srcSet for responsive images
  generateSrcSet(src: string, sizes: number[] = [320, 640, 768, 1024, 1280]) {
    return sizes.map(size => `${src}?w=${size}&q=${this.quality.medium} ${size}w`).join(', ');
  }
};

// Font optimization
export const fontOptimization = {
  // Preload critical fonts
  preloadFonts: [
    '/fonts/inter-var.woff2',
    '/fonts/geist-sans.woff2'
  ],
  
  // Font display strategy
  fontDisplay: 'swap',
  
  // CSS font loading utilities
  loadFont(fontFamily: string, url: string) {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'font';
    link.type = 'font/woff2';
    link.crossOrigin = 'anonymous';
    link.href = url;
    document.head.appendChild(link);
  }
};

// Export everything for easy import
export default {
  reportWebVitals,
  usePerformanceMonitoring,
  imageOptimization,
  fontOptimization
};