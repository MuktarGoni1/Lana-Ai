import { MetadataRoute } from 'next'
import { SEO_CONFIG } from '@/lib/seo-config'

// Dynamic content sources (would connect to database in production)
const getBlogPosts = () => {
  // This would fetch from your CMS or database
  return [
    { slug: 'future-of-personalized-learning', lastModified: new Date('2024-01-15') },
    { slug: 'understanding-children-learning-styles', lastModified: new Date('2024-01-10') },
    { slug: 'supporting-child-education-home', lastModified: new Date('2024-01-05') },
    { slug: 'technology-early-childhood-education', lastModified: new Date('2023-12-20') },
    { slug: 'building-confidence-math-science', lastModified: new Date('2023-12-15') },
    { slug: 'learning-friendly-home-environment', lastModified: new Date('2023-12-10') },
  ]
}

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = SEO_CONFIG.site.url
  const currentDate = new Date()
  
  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: currentDate,
      changeFrequency: SEO_CONFIG.sitemap.changefreq.homepage,
      priority: SEO_CONFIG.sitemap.priority.homepage,
    },
    {
      url: `${baseUrl}/landing-page`,
      lastModified: currentDate,
      changeFrequency: SEO_CONFIG.sitemap.changefreq.homepage,
      priority: SEO_CONFIG.sitemap.priority.homepage - 0.1,
    },
    {
      url: `${baseUrl}/homepage`,
      lastModified: currentDate,
      changeFrequency: SEO_CONFIG.sitemap.changefreq.homepage,
      priority: SEO_CONFIG.sitemap.priority.homepage - 0.2,
    },
    {
      url: `${baseUrl}/features`,
      lastModified: currentDate,
      changeFrequency: SEO_CONFIG.sitemap.changefreq.features,
      priority: SEO_CONFIG.sitemap.priority.features,
    },
    {
      url: `${baseUrl}/pricing`,
      lastModified: currentDate,
      changeFrequency: SEO_CONFIG.sitemap.changefreq.pricing,
      priority: SEO_CONFIG.sitemap.priority.pricing,
    },
    {
      url: `${baseUrl}/demo`,
      lastModified: currentDate,
      changeFrequency: SEO_CONFIG.sitemap.changefreq.pages,
      priority: SEO_CONFIG.sitemap.priority.pages + 0.1,
    },
    {
      url: `${baseUrl}/login`,
      lastModified: currentDate,
      changeFrequency: SEO_CONFIG.sitemap.changefreq.pages,
      priority: SEO_CONFIG.sitemap.priority.pages,
    },
    {
      url: `${baseUrl}/register`,
      lastModified: currentDate,
      changeFrequency: SEO_CONFIG.sitemap.changefreq.pages,
      priority: SEO_CONFIG.sitemap.priority.pages,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: currentDate,
      changeFrequency: SEO_CONFIG.sitemap.changefreq.pages,
      priority: SEO_CONFIG.sitemap.priority.pages,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: currentDate,
      changeFrequency: SEO_CONFIG.sitemap.changefreq.pages,
      priority: SEO_CONFIG.sitemap.priority.pages,
    },
    {
      url: `${baseUrl}/blog`,
      lastModified: currentDate,
      changeFrequency: SEO_CONFIG.sitemap.changefreq.blog,
      priority: SEO_CONFIG.sitemap.priority.blog,
    },
    {
      url: `${baseUrl}/careers`,
      lastModified: currentDate,
      changeFrequency: SEO_CONFIG.sitemap.changefreq.pages,
      priority: SEO_CONFIG.sitemap.priority.pages,
    },
    {
      url: `${baseUrl}/privacy-policy`,
      lastModified: currentDate,
      changeFrequency: SEO_CONFIG.sitemap.changefreq.pages,
      priority: SEO_CONFIG.sitemap.priority.pages - 0.1,
    },
    {
      url: `${baseUrl}/terms-of-service`,
      lastModified: currentDate,
      changeFrequency: SEO_CONFIG.sitemap.changefreq.pages,
      priority: SEO_CONFIG.sitemap.priority.pages - 0.1,
    },
  ]

  // Dynamic blog posts
  const blogPosts = getBlogPosts().map(post => ({
    url: `${baseUrl}/blog/${post.slug}`,
    lastModified: post.lastModified,
    changeFrequency: 'monthly' as const,
    priority: 0.6,
  }))

  return [...staticPages, ...blogPosts]
}