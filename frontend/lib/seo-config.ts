// SEO Configuration Constants
export const SEO_CONFIG = {
  site: {
    name: 'LanaMind',
    url: 'https://lanamind.com',
    title: 'LanaMind – AI Tutor for Clear, Structured Learning',
    description: 'LanaMind is a personalized AI tutor that explains topics step by step, generates quizzes, and helps students master subjects while keeping parents informed.',
    locale: 'en_US',
    defaultImage: '/images/lana-logo-og.png',
  },
  
  social: {
    twitter: '@LanaMindAI',
    facebook: 'LanaMindAI',
  },
  
  branding: {
    primaryColor: '#FACC15',
    secondaryColor: '#3B82F6',
  },

  // Core Web Vitals targets
  performance: {
    lcpTarget: 2500, // ms
    clsTarget: 0.1,
    inpTarget: 200, // ms
  },

  // Sitemap configuration
  sitemap: {
    changefreq: {
      homepage: 'daily',
      pricing: 'weekly',
      features: 'weekly',
      blog: 'weekly',
      pages: 'monthly',
    },
    priority: {
      homepage: 1.0,
      pricing: 0.9,
      features: 0.8,
      blog: 0.7,
      pages: 0.5,
    }
  }
} as const;

// Type definitions
export type SeoConfig = typeof SEO_CONFIG;
export type SiteConfig = typeof SEO_CONFIG.site;
export type SitemapConfig = typeof SEO_CONFIG.sitemap;