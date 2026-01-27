"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useTheme } from "next-themes"
import { useEnhancedAuth } from '@/hooks/useEnhancedAuth'
import { Header, Footer } from "@/components/navigation"

/* ---------- BLOG CONTENT ---------- */
function BlogContent() {
  return (
    <section className="py-12 md:py-16 bg-transparent">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8 md:mb-12">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3">Lana AI Blog</h1>
          <p className="text-muted-foreground text-base md:text-lg">Insights, tips, and stories about education and learning</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Blog Post 1 */}
          <div className="bg-card rounded-lg border p-5 shadow-sm transition-all duration-300 hover:shadow-lg hover:border-primary/60 hover:-translate-y-1 dark:hover:shadow-blue-500/30 dark:hover:shadow-lg">
            <div className="bg-muted rounded-lg h-36 mb-3 overflow-hidden">
              <div className="w-full h-full bg-gradient-to-r from-blue-100 to-cyan-100 dark:from-blue-900/30 dark:to-cyan-900/30 flex items-center justify-center">
                <span className="text-muted-foreground text-sm">Blog Image</span>
              </div>
            </div>
            <h3 className="text-lg font-semibold mb-2 text-foreground">The Future of Personalized Learning</h3>
            <p className="text-muted-foreground text-sm mb-3">Discover how AI is transforming education and making learning more personalized than ever before.</p>
            <div className="flex justify-between items-center">
              <span className="text-xs text-muted-foreground">May 15, 2024</span>
              <Link href="/blog/personalized-learning" className="text-sm text-primary hover:underline">Read more</Link>
            </div>
          </div>
          
          {/* Blog Post 2 */}
          <div className="bg-card rounded-lg border p-5 shadow-sm transition-all duration-300 hover:shadow-lg hover:border-primary/60 hover:-translate-y-1 dark:hover:shadow-blue-500/30 dark:hover:shadow-lg">
            <div className="bg-muted rounded-lg h-36 mb-3 overflow-hidden">
              <div className="w-full h-full bg-gradient-to-r from-blue-100 to-cyan-100 dark:from-blue-900/30 dark:to-cyan-900/30 flex items-center justify-center">
                <span className="text-muted-foreground text-sm">Blog Image</span>
              </div>
            </div>
            <h3 className="text-lg font-semibold mb-2 text-foreground">Understanding How Children Learn Best</h3>
            <p className="text-muted-foreground text-sm mb-3">Research-backed insights into different learning styles and how to support your child's unique needs.</p>
            <div className="flex justify-between items-center">
              <span className="text-xs text-muted-foreground">April 28, 2024</span>
              <Link href="/blog/learning-styles" className="text-sm text-primary hover:underline">Read more</Link>
            </div>
          </div>
          
          {/* Blog Post 3 */}
          <div className="bg-card rounded-lg border p-5 shadow-sm transition-all duration-300 hover:shadow-lg hover:border-primary/60 hover:-translate-y-1 dark:hover:shadow-blue-500/30 dark:hover:shadow-lg">
            <div className="bg-muted rounded-lg h-36 mb-3 overflow-hidden">
              <div className="w-full h-full bg-gradient-to-r from-blue-100 to-cyan-100 dark:from-blue-900/30 dark:to-cyan-900/30 flex items-center justify-center">
                <span className="text-muted-foreground text-sm">Blog Image</span>
              </div>
            </div>
            <h3 className="text-lg font-semibold mb-2 text-foreground">Tips for Supporting Your Child's Education</h3>
            <p className="text-muted-foreground text-sm mb-3">Practical advice for parents on how to stay engaged with their child's learning journey.</p>
            <div className="flex justify-between items-center">
              <span className="text-xs text-muted-foreground">April 12, 2024</span>
              <Link href="/blog/parent-support" className="text-sm text-primary hover:underline">Read more</Link>
            </div>
          </div>
          
          {/* Blog Post 4 */}
          <div className="bg-card rounded-lg border p-5 shadow-sm transition-all duration-300 hover:shadow-lg hover:border-primary/60 hover:-translate-y-1 dark:hover:shadow-blue-500/30 dark:hover:shadow-lg">
            <div className="bg-muted rounded-lg h-36 mb-3 overflow-hidden">
              <div className="w-full h-full bg-gradient-to-r from-blue-100 to-cyan-100 dark:from-blue-900/30 dark:to-cyan-900/30 flex items-center justify-center">
                <span className="text-muted-foreground text-sm">Blog Image</span>
              </div>
            </div>
            <h3 className="text-lg font-semibold mb-2 text-foreground">Technology in Early Childhood Education</h3>
            <p className="text-muted-foreground text-sm mb-3">Exploring the benefits and considerations of introducing technology to young learners.</p>
            <div className="flex justify-between items-center">
              <span className="text-xs text-muted-foreground">March 30, 2024</span>
              <Link href="/blog/technology-early-ed" className="text-sm text-primary hover:underline">Read more</Link>
            </div>
          </div>
          
          {/* Blog Post 5 */}
          <div className="bg-card rounded-lg border p-5 shadow-sm transition-all duration-300 hover:shadow-lg hover:border-primary/60 hover:-translate-y-1 dark:hover:shadow-blue-500/30 dark:hover:shadow-lg">
            <div className="bg-muted rounded-lg h-36 mb-3 overflow-hidden">
              <div className="w-full h-full bg-gradient-to-r from-blue-100 to-cyan-100 dark:from-blue-900/30 dark:to-cyan-900/30 flex items-center justify-center">
                <span className="text-muted-foreground text-sm">Blog Image</span>
              </div>
            </div>
            <h3 className="text-lg font-semibold mb-2 text-foreground">Building Confidence in Math and Science</h3>
            <p className="text-muted-foreground text-sm mb-3">Strategies to help your child develop confidence and interest in STEM subjects.</p>
            <div className="flex justify-between items-center">
              <span className="text-xs text-muted-foreground">March 18, 2024</span>
              <Link href="/blog/stem-confidence" className="text-sm text-primary hover:underline">Read more</Link>
            </div>
          </div>
          
          {/* Blog Post 6 */}
          <div className="bg-card rounded-lg border p-5 shadow-sm transition-all duration-300 hover:shadow-lg hover:border-primary/60 hover:-translate-y-1 dark:hover:shadow-blue-500/30 dark:hover:shadow-lg">
            <div className="bg-muted rounded-lg h-36 mb-3 overflow-hidden">
              <div className="w-full h-full bg-gradient-to-r from-blue-100 to-cyan-100 dark:from-blue-900/30 dark:to-cyan-900/30 flex items-center justify-center">
                <span className="text-muted-foreground text-sm">Blog Image</span>
              </div>
            </div>
            <h3 className="text-lg font-semibold mb-2 text-foreground">Creating a Learning-Friendly Home Environment</h3>
            <p className="text-muted-foreground text-sm mb-3">Simple changes you can make at home to support your child's learning and development.</p>
            <div className="flex justify-between items-center">
              <span className="text-xs text-muted-foreground">February 25, 2024</span>
              <Link href="/blog/home-learning" className="text-sm text-primary hover:underline">Read more</Link>
            </div>
          </div>
        </div>
        
        <div className="mt-8 md:mt-12 text-center">
          <button className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 hover:shadow-lg hover:scale-105 transition-all duration-300 ease-in-out dark:hover:shadow-blue-500/50 dark:hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background active:scale-[0.96]">
            Load More Articles
          </button>
        </div>
      </div>
    </section>
  )
}

/* ---------- PAGE ---------- */
export default function BlogPage() {
  const { setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true); setTheme("light") }, [])
  if (!mounted) { return null }

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-blue-50 via-indigo-50 to-cyan-50 dark:from-blue-900/20 dark:via-indigo-900/20 dark:to-cyan-900/20 text-foreground font-sans">
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