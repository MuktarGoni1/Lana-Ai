"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useTheme } from "next-themes";
import { useUnifiedAuth } from '@/contexts/UnifiedAuthContext';
import { Header, Footer } from "@/components/navigation";
import { getAllBlogPosts, type BlogPost } from "@/lib/blog-data";
import { getChildFriendlyClasses, getPastelBg } from "@/lib/ui-styles";

/* ---------- BLOG CONTENT ---------- */
function BlogContent() {
  const [posts] = useState<BlogPost[]>(getAllBlogPosts());
  
  return (
    <section className="py-12 md:py-16 bg-transparent">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8 md:mb-12">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3">Lana AI Blog</h1>
          <p className="text-muted-foreground text-base md:text-lg">Insights, tips, and stories about education and learning</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts.map((post, index) => (
            <div key={post.id} className={`rounded-3xl border border-slate-100 p-6 shadow-sm transition-all duration-300 transform hover:scale-105 overflow-hidden ${getPastelBg(index)}`}>
              <div className="bg-white rounded-xl h-36 mb-4 overflow-hidden shadow-sm">
                <div className="w-full h-full flex items-center justify-center">
                  <span className="text-slate-600 text-sm font-medium">Blog Image</span>
                </div>
              </div>
              <h3 className="text-xl font-bold mb-3 text-slate-900">{post.title}</h3>
              <p className="text-slate-600 text-sm mb-4 font-medium">{post.excerpt}</p>
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-500 font-medium">{new Date(post.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                <Link href={`/blog/${post.slug}`} className="text-sm text-slate-900 font-bold hover:underline">Read more</Link>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-8 md:mt-12 text-center">
          <div className={getChildFriendlyClasses.buttonSmall}>
            {posts.length} Articles Available
          </div>
        </div>
      </div>
    </section>
  )
}

/* ---------- PAGE ---------- */
export default function ClientBlogPage() {
  const { setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true); setTheme("light") }, [])
  if (!mounted) { return null }

  return (
    <div className="flex min-h-screen flex-col bg-white text-foreground font-sans selection:bg-yellow-200">
      {/* Skip to main content link for accessibility */}
      <a 
        href="#main-content" 
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:bg-background focus:text-foreground focus:px-4 focus:py-2 focus:rounded-md focus:ring-2 focus:ring-primary"
      >
        Skip to main content
      </a>
      
      <Header />
      <main id="main-content" className="flex-grow">
        <BlogContent />
      </main>
      <Footer />
    </div>
  )
}