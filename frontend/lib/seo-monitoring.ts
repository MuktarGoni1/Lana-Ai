// SEO Analytics and Monitoring Integration
'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'

interface SeoMetrics {
  pageViews: number;
  bounceRate: number;
  avgSessionDuration: number;
  keywordRankings: Record<string, number>;
  organicTraffic: number;
  conversionRate: number;
  coreWebVitals: {
    lcp: number;
    cls: number;
    inp: number;
  };
}

interface SearchConsoleData {
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
  queries: Array<{
    query: string;
    clicks: number;
    impressions: number;
    ctr: number;
    position: number;
  }>;
}

// Google Search Console API Integration
class SearchConsoleAPI {
  private apiKey: string;
  private siteUrl: string;

  constructor(apiKey: string, siteUrl: string) {
    this.apiKey = apiKey;
    this.siteUrl = siteUrl;
  }

  async getSearchAnalytics(
    startDate: string,
    endDate: string,
    dimensions: string[] = ['query', 'page']
  ): Promise<SearchConsoleData> {
    try {
      const response = await fetch('/api/search-console/analytics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          startDate,
          endDate,
          dimensions,
          siteUrl: this.siteUrl
        })
      });

      if (!response.ok) {
        throw new Error(`Search Console API error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to fetch Search Console data:', error);
      return {
        clicks: 0,
        impressions: 0,
        ctr: 0,
        position: 0,
        queries: []
      };
    }
  }

  async getIndexedPages(): Promise<number> {
    try {
      const response = await fetch('/api/search-console/indexed-pages');
      if (!response.ok) throw new Error('Failed to fetch indexed pages');
      const data = await response.json();
      return data.totalIndexed;
    } catch (error) {
      console.error('Failed to fetch indexed pages:', error);
      return 0;
    }
  }

  async getCrawlErrors(): Promise<any[]> {
    try {
      const response = await fetch('/api/search-console/crawl-errors');
      if (!response.ok) throw new Error('Failed to fetch crawl errors');
      return await response.json();
    } catch (error) {
      console.error('Failed to fetch crawl errors:', error);
      return [];
    }
  }
}

// SEO Monitoring Hook
export function useSeoMonitoring() {
  const pathname = usePathname();
  const [metrics, setMetrics] = useState<SeoMetrics | null>(null);
  const [searchConsoleData, setSearchConsoleData] = useState<SearchConsoleData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeSeoMonitoring = async () => {
      setLoading(true);
      
      try {
        // Initialize Search Console API
        const searchConsole = new SearchConsoleAPI(
          process.env.NEXT_PUBLIC_GOOGLE_SEARCH_CONSOLE_API_KEY || '',
          'https://lanamind.com'
        );

        // Get current page SEO data
        const [analyticsData, searchAnalytics] = await Promise.all([
          fetchPageAnalytics(pathname),
          searchConsole.getSearchAnalytics(
            new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days ago
            new Date().toISOString().split('T')[0] // today
          )
        ]);

        setMetrics(analyticsData);
        setSearchConsoleData(searchAnalytics);

        // Track page view for SEO purposes
        trackSeoPageView(pathname);

      } catch (error) {
        console.error('SEO monitoring initialization failed:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeSeoMonitoring();
  }, [pathname]);

  return {
    metrics,
    searchConsoleData,
    loading
  };
}

// Page Analytics Fetcher
async function fetchPageAnalytics(pathname: string): Promise<SeoMetrics> {
  try {
    const response = await fetch(`/api/seo/analytics?page=${encodeURIComponent(pathname)}`);
    if (!response.ok) throw new Error('Failed to fetch page analytics');
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch page analytics:', error);
    // Return default values
    return {
      pageViews: 0,
      bounceRate: 0,
      avgSessionDuration: 0,
      keywordRankings: {},
      organicTraffic: 0,
      conversionRate: 0,
      coreWebVitals: {
        lcp: 0,
        cls: 0,
        inp: 0
      }
    };
  }
}

// SEO Page View Tracking
function trackSeoPageView(pathname: string) {
  // Track page view for SEO analysis
  if (typeof window !== 'undefined') {
    // Google Analytics event
    if ((window as any).gtag) {
      (window as any).gtag('event', 'page_view', {
        page_title: document.title,
        page_location: window.location.href,
        page_path: pathname,
        send_to: process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID
      });
    }

    // Custom SEO tracking
    fetch('/api/seo/track-page-view', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        pathname,
        title: document.title,
        referrer: document.referrer,
        userAgent: navigator.userAgent
      })
    }).catch(() => {
      // Silent failure
    });
  }
}

// Keyword Ranking Tracker
export class KeywordTracker {
  private keywords: string[];
  private apiKey: string;

  constructor(keywords: string[], apiKey: string) {
    this.keywords = keywords;
    this.apiKey = apiKey;
  }

  async getKeywordRankings(): Promise<Record<string, number>> {
    try {
      const response = await fetch('/api/seo/keyword-rankings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          keywords: this.keywords,
          apiKey: this.apiKey
        })
      });

      if (!response.ok) throw new Error('Failed to fetch keyword rankings');
      
      const data = await response.json();
      return data.rankings;
    } catch (error) {
      console.error('Failed to fetch keyword rankings:', error);
      return {};
    }
  }

  async trackKeyword(keyword: string, position: number) {
    try {
      await fetch('/api/seo/track-keyword', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          keyword,
          position,
          timestamp: new Date().toISOString()
        })
      });
    } catch (error) {
      console.error('Failed to track keyword:', error);
    }
  }
}

// SEO Health Checker
export class SeoHealthChecker {
  static async checkPageSeo(url: string): Promise<any> {
    try {
      const response = await fetch('/api/seo/health-check', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url })
      });

      if (!response.ok) throw new Error('SEO health check failed');
      return await response.json();
    } catch (error) {
      console.error('SEO health check failed:', error);
      return null;
    }
  }

  static getSeoScore(metrics: SeoMetrics): number {
    let score = 100;
    
    // Core Web Vitals scoring (50% of score)
    if (metrics.coreWebVitals.lcp > 2500) score -= 15;
    if (metrics.coreWebVitals.cls > 0.1) score -= 15;
    if (metrics.coreWebVitals.inp > 200) score -= 10;
    
    // Engagement metrics (30% of score)
    if (metrics.bounceRate > 70) score -= 10;
    if (metrics.avgSessionDuration < 60) score -= 10;
    if (metrics.conversionRate < 2) score -= 5;
    
    // Traffic metrics (20% of score)
    if (metrics.organicTraffic < 100) score -= 5;
    if (Object.keys(metrics.keywordRankings).length < 5) score -= 5;
    
    return Math.max(0, Math.min(100, score));
  }
}

// Export main monitoring hook
export default useSeoMonitoring;