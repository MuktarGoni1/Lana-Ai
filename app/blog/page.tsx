// Server-side rendered blog page for optimal SEO
// No "use client" - content visible to Googlebot immediately

import { Metadata } from 'next'
import Link from 'next/link'
import { SEO_CONFIG } from '@/lib/seo-config'
import { Calendar, User, ArrowRight } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Blog | LanaMind – AI Education Insights',
  description: 'Read the latest articles, insights, and tips on personalized learning, AI-powered education, and student success strategies from the LanaMind team.',
  keywords: [
    'ai education blog',
    'personalized learning articles',
    'student success tips',
    'educational technology insights',
    'parenting tips education',
    'ai tutoring news'
  ],
  openGraph: {
    title: 'LanaMind Blog - AI Education Insights & Tips',
    description: 'Expert articles on personalized learning, AI education technology, and student success strategies.',
    url: 'https://lanamind.com/blog',
  },
  alternates: {
    canonical: 'https://lanamind.com/blog',
  },
  robots: {
    index: true,
    follow: true,
  },
}

// Static blog posts for SSR
const BLOG_POSTS = [
  {
    slug: 'future-of-personalized-learning',
    title: 'The Future of Personalized Learning with AI',
    excerpt: 'Discover how artificial intelligence is revolutionizing education by creating truly personalized learning experiences for every student.',
    date: '2024-01-15',
    author: 'LanaMind Team',
    category: 'AI Education',
    readTime: '5 min read'
  },
  {
    slug: 'understanding-children-learning-styles',
    title: 'Understanding Your Child\'s Learning Style',
    excerpt: 'Learn how to identify whether your child is a visual, auditory, or kinesthetic learner and how to support their unique needs.',
    date: '2024-01-10',
    author: 'Dr. Sarah Chen',
    category: 'Learning Strategies',
    readTime: '7 min read'
  },
  {
    slug: 'supporting-child-education-home',
    title: 'How to Support Your Child\'s Education at Home',
    excerpt: 'Practical tips for parents to create a supportive learning environment and help their children succeed academically.',
    date: '2024-01-05',
    author: 'LanaMind Team',
    category: 'Parent Tips',
    readTime: '6 min read'
  },
  {
    slug: 'technology-early-childhood-education',
    title: 'Technology in Early Childhood Education',
    excerpt: 'Exploring the benefits and best practices of integrating technology into early learning experiences.',
    date: '2023-12-20',
    author: 'Michael Roberts',
    category: 'EdTech',
    readTime: '8 min read'
  },
  {
    slug: 'building-confidence-math-science',
    title: 'Building Confidence in Math and Science',
    excerpt: 'Strategies to help students overcome math anxiety and develop confidence in STEM subjects.',
    date: '2023-12-15',
    author: 'Emily Watson',
    category: 'STEM Learning',
    readTime: '6 min read'
  },
  {
    slug: 'learning-friendly-home-environment',
    title: 'Creating a Learning-Friendly Home Environment',
    excerpt: 'Design tips and organization strategies to create the perfect study space for your child.',
    date: '2023-12-10',
    author: 'LanaMind Team',
    category: 'Parent Tips',
    readTime: '5 min read'
  }
]

export default function BlogPage() {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      <main className="flex-grow">
        {/* Hero Section */}
        <section className="py-20 bg-gradient-to-b from-purple-50 to-white">
          <div className="container mx-auto px-4 max-w-7xl">
            <div className="text-center max-w-3xl mx-auto">
              <h1 className="text-4xl md:text-6xl font-bold mb-6 text-slate-900">
                LanaMind <span className="text-purple-600">Blog</span>
              </h1>
              <p className="text-xl text-slate-600">
                Insights, tips, and stories about AI-powered education, personalized learning, 
                and helping students reach their full potential.
              </p>
            </div>
          </div>
        </section>

        {/* Blog Grid */}
        <section className="py-20">
          <div className="container mx-auto px-4 max-w-7xl">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {BLOG_POSTS.map((post) => (
                <article 
                  key={post.slug}
                  className="bg-slate-50 rounded-3xl overflow-hidden hover:shadow-xl transition-all duration-300 group"
                >
                  <div className="h-48 bg-gradient-to-br from-purple-100 to-blue-100 flex items-center justify-center">
                    <span className="text-4xl">📝</span>
                  </div>
                  <div className="p-8">
                    <div className="flex items-center gap-4 text-sm text-slate-500 mb-4">
                      <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full font-medium">
                        {post.category}
                      </span>
                      <span>{post.readTime}</span>
                    </div>
                    <h2 className="text-xl font-bold mb-3 text-slate-900 group-hover:text-purple-600 transition-colors">
                      <Link href={`/blog/${post.slug}`}>
                        {post.title}
                      </Link>
                    </h2>
                    <p className="text-slate-600 mb-4 line-clamp-3">
                      {post.excerpt}
                    </p>
                    <div className="flex items-center justify-between pt-4 border-t border-slate-200">
                      <div className="flex items-center gap-2 text-sm text-slate-500">
                        <User className="h-4 w-4" />
                        {post.author}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-slate-500">
                        <Calendar className="h-4 w-4" />
                        {new Date(post.date).toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric', 
                          year: 'numeric' 
                        })}
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* Newsletter Section */}
        <section className="py-20 bg-slate-900 text-white">
          <div className="container mx-auto px-4 max-w-4xl text-center">
            <h2 className="text-3xl font-bold mb-4">
              Stay Updated
            </h2>
            <p className="text-slate-300 mb-8">
              Get the latest articles on AI education and personalized learning delivered to your inbox.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-md mx-auto">
              <input 
                type="email" 
                placeholder="Enter your email"
                className="flex-1 px-6 py-4 rounded-full text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#FACC15]"
              />
              <button className="rounded-full bg-[#FACC15] text-slate-900 font-bold py-4 px-8 hover:bg-[#EAB308] transition-all whitespace-nowrap">
                Subscribe
              </button>
            </div>
          </div>
        </section>

        {/* Categories */}
        <section className="py-20">
          <div className="container mx-auto px-4 max-w-7xl">
            <h2 className="text-3xl font-bold text-center mb-12 text-slate-900">
              Browse by Category
            </h2>
            <div className="flex flex-wrap justify-center gap-4">
              {['All', 'AI Education', 'Learning Strategies', 'Parent Tips', 'EdTech', 'STEM Learning'].map((category) => (
                <button
                  key={category}
                  className="px-6 py-3 rounded-full bg-slate-100 text-slate-700 font-medium hover:bg-purple-100 hover:text-purple-700 transition-all"
                >
                  {category}
                </button>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
