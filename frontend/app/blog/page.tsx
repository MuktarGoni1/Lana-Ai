"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useTheme } from "next-themes"
import { useComprehensiveAuth } from '@/contexts/ComprehensiveAuthContext'
import { Moon, Sun, Menu, X, Twitter, Facebook, Instagram, Linkedin } from "lucide-react"

/* ---------- THEME TOGGLE ---------- */
function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])
  // Show placeholder to prevent layout shift before mount
  if (!mounted) {
    return (
      <div className="inline-flex items-center justify-center rounded-md w-9 h-9" />
    )
  }

  return (
    <button
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
      className="inline-flex items-center justify-center rounded-xl w-9 h-9 hover:bg-muted hover:shadow-md hover:scale-105 transition-all duration-300 ease-in-out relative focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background dark:hover:shadow-blue-500/50 dark:hover:shadow-xl"
      aria-label={`Switch to ${resolvedTheme === "dark" ? "light" : "dark"} mode`}
      aria-pressed={resolvedTheme === "dark"}
    >
      {resolvedTheme === "dark" ? (
        <Moon className="h-5 w-5 text-blue-400 dark:text-blue-400 dark:hover:text-blue-300" aria-hidden="true" />
      ) : (
        <Sun className="h-5 w-5 text-yellow-500 dark:text-blue-400 dark:hover:text-blue-300" aria-hidden="true" />
      )}
    </button>
  )
}

/* ---------- HEADER ---------- */
function Header() {
  const [open, setOpen] = useState(false)
  const { user, isAuthenticated, isLoading } = useComprehensiveAuth()

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-gradient-to-b from-blue-50/80 to-cyan-50/80 backdrop-blur">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <Link href="/" className="text-xl font-bold text-foreground">Lana AI</Link>

          {/* desktop */}
          <nav className="hidden md:flex items-center gap-6">
            <Link 
              href="/" 
              className="text-sm font-medium text-muted-foreground hover:text-foreground hover:shadow-sm hover:scale-105 transition-all duration-300 ease-in-out dark:hover:shadow-blue-500/30 dark:hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              Home
            </Link>
            <Link 
              href="/landing-page" 
              className="text-sm font-medium text-muted-foreground hover:text-foreground hover:shadow-sm hover:scale-105 transition-all duration-300 ease-in-out dark:hover:shadow-blue-500/30 dark:hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              Features
            </Link>
            <Link 
              href="/term-plan" 
              className="text-sm font-medium text-muted-foreground hover:text-foreground hover:shadow-sm hover:scale-105 transition-all duration-300 ease-in-out dark:hover:shadow-blue-500/30 dark:hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              Term Plan
            </Link>
            <Link 
              href="/feedback" 
              className="text-sm font-medium text-muted-foreground hover:text-foreground hover:shadow-sm hover:scale-105 transition-all duration-300 ease-in-out dark:hover:shadow-blue-500/30 dark:hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              Feedback
            </Link>
            <Link 
              href="/settings" 
              className="text-sm font-medium text-muted-foreground hover:text-foreground hover:shadow-sm hover:scale-105 transition-all duration-300 ease-in-out dark:hover:shadow-blue-500/30 dark:hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              Settings
            </Link>
            <ThemeToggle />
            {user ? (
              <Link 
                href="/homepage" 
                className="inline-flex items-center justify-center rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 hover:shadow-lg hover:scale-105 transition-all duration-300 ease-in-out dark:hover:shadow-blue-500/50 dark:hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background active:scale-[0.96]"
              >
                Dashboard
              </Link>
            ) : (
              <>
                <Link 
                  href="/login" 
                  className="text-sm font-medium text-muted-foreground hover:text-foreground hover:shadow-sm hover:scale-105 transition-all duration-300 ease-in-out dark:hover:shadow-blue-500/30 dark:hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                >
                  Login
                </Link>
                <Link 
                  href="/register" 
                  className="inline-flex items-center justify-center rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 hover:shadow-lg hover:scale-105 transition-all duration-300 ease-in-out dark:hover:shadow-blue-500/50 dark:hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background active:scale-[0.96]"
                >
                  Get Started
                </Link>
              </>
            )}
          </nav>

          {/* mobile burger */}
          <button
            onClick={() => setOpen((o) => !o)}
            className="md:hidden p-2 rounded-xl hover:bg-muted hover:shadow-md hover:scale-105 transition-all duration-300 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background dark:hover:shadow-blue-500/50 dark:hover:shadow-xl"
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label="Toggle navigation menu"
          >
            {open ? <X className="h-5 w-5 dark:text-blue-400 dark:hover:text-blue-300" /> : <Menu className="h-5 w-5 dark:text-blue-400 dark:hover:text-blue-300" />}
          </button>
        </div>

        {/* mobile panel */}
        <div
          id="mobile-nav"
          className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out ${open ? "max-h-96 opacity-100" : "max-h-0 opacity-0"}`}
        >
          <nav className="flex flex-col gap-4 py-4">
            <Link 
              href="/" 
              onClick={() => setOpen(false)} 
              className="text-sm font-medium text-muted-foreground hover:text-foreground hover:shadow-sm hover:scale-105 transition-all duration-300 ease-in-out dark:hover:shadow-blue-500/30 dark:hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background py-3 px-2"
            >
              Home
            </Link>
            <Link 
              href="/landing-page" 
              onClick={() => setOpen(false)} 
              className="text-sm font-medium text-muted-foreground hover:text-foreground hover:shadow-sm hover:scale-105 transition-all duration-300 ease-in-out dark:hover:shadow-blue-500/30 dark:hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background py-3 px-2"
            >
              Features
            </Link>
            <Link 
              href="/term-plan" 
              onClick={() => setOpen(false)} 
              className="text-sm font-medium text-muted-foreground hover:text-foreground hover:shadow-sm hover:scale-105 transition-all duration-300 ease-in-out dark:hover:shadow-blue-500/30 dark:hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background py-3 px-2"
            >
              Term Plan
            </Link>
            <Link 
              href="/feedback" 
              onClick={() => setOpen(false)} 
              className="text-sm font-medium text-muted-foreground hover:text-foreground hover:shadow-sm hover:scale-105 transition-all duration-300 ease-in-out dark:hover:shadow-blue-500/30 dark:hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background py-3 px-2"
            >
              Feedback
            </Link>
            <Link 
              href="/settings" 
              onClick={() => setOpen(false)} 
              className="text-sm font-medium text-muted-foreground hover:text-foreground hover:shadow-sm hover:scale-105 transition-all duration-300 ease-in-out dark:hover:shadow-blue-500/30 dark:hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background py-3 px-2"
            >
              Settings
            </Link>
            <div className="mt-2 flex items-center gap-2 pt-2 border-t border-border">
              <ThemeToggle />
              {user ? (
                <Link 
                  href="/homepage" 
                  className="inline-flex items-center justify-center rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 hover:shadow-md transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background active:scale-[0.98] w-full"
                  onClick={() => setOpen(false)}
                >
                  Dashboard
                </Link>
              ) : (
                <>
                  <Link 
                    href="/login" 
                    className="text-sm font-medium text-muted-foreground hover:text-foreground hover:shadow-sm hover:scale-105 transition-all duration-300 ease-in-out dark:hover:shadow-blue-500/30 dark:hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background py-3 px-2 flex-1 text-center"
                    onClick={() => setOpen(false)}
                  >
                    Login
                  </Link>
                  <Link 
                    href="/register" 
                    className="inline-flex items-center justify-center rounded-xl bg-primary px-4 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 hover:shadow-lg hover:scale-105 transition-all duration-300 ease-in-out dark:hover:shadow-blue-500/50 dark:hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background active:scale-[0.96] flex-1"
                    onClick={() => setOpen(false)}
                  >
                    Get Started
                  </Link>
                </>
              )}
            </div>
          </nav>
        </div>
      </div>
    </header>
  )
}

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

/* ---------- FOOTER ---------- */
const footerLinks = {
  Product: ["Features", "Pricing", "Demo", "API"],
  Company: ["About", "Blog", "Careers", "Contact"],
  Legal: ["Privacy Policy", "Terms of Service", "Security Policy", "Cookie Policy"],
  Support: ["Term Plan", "Feedback", "Settings"]
}

function Footer() {
  return (
    <footer className="border-t border-border py-8 md:py-16 bg-transparent">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-6 sm:gap-8 md:grid-cols-2 lg:grid-cols-5 md:gap-12">
          <div className="lg:col-span-2">
            <Link href="/" className="text-xl font-bold text-foreground">Lana AI</Link>
            <p className="text-muted-foreground text-sm mt-3 max-w-md">
              Empowering you and your child through personalized AI tutoring while keeping you connected to the learning journey.
            </p>
            <div className="flex gap-3 sm:gap-4 mt-5">
              <Link 
                href="#" 
                aria-label="Twitter" 
                className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background p-3 sm:p-2 rounded-full hover:bg-muted hover:shadow-md hover:scale-105 transition-all duration-300 ease-in-out dark:hover:shadow-blue-500/50 dark:hover:shadow-xl"
              >
                <Twitter className="h-5 w-5 text-muted-foreground hover:text-foreground dark:text-blue-400 dark:hover:text-blue-300" />
              </Link>
              <Link 
                href="#" 
                aria-label="Facebook" 
                className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background p-3 sm:p-2 rounded-full hover:bg-muted hover:shadow-md hover:scale-105 transition-all duration-300 ease-in-out dark:hover:shadow-blue-500/50 dark:hover:shadow-xl"
              >
                <Facebook className="h-5 w-5 text-muted-foreground hover:text-foreground dark:text-blue-400 dark:hover:text-blue-300" />
              </Link>
              <Link 
                href="#" 
                aria-label="Instagram" 
                className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background p-3 sm:p-2 rounded-full hover:bg-muted hover:shadow-md hover:scale-105 transition-all duration-300 ease-in-out dark:hover:shadow-blue-500/50 dark:hover:shadow-xl"
              >
                <Instagram className="h-5 w-5 text-muted-foreground hover:text-foreground dark:text-blue-400 dark:hover:text-blue-300" />
              </Link>
              <Link 
                href="#" 
                aria-label="LinkedIn" 
                className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background p-3 sm:p-2 rounded-full hover:bg-muted hover:shadow-md hover:scale-105 transition-all duration-300 ease-in-out dark:hover:shadow-blue-500/50 dark:hover:shadow-xl"
              >
                <Linkedin className="h-5 w-5 text-muted-foreground hover:text-foreground dark:text-blue-400 dark:hover:text-blue-300" />
              </Link>
            </div>
          </div>
          {Object.entries(footerLinks).map(([cat, links]) => (
            <div key={cat}>
              <h4 className="text-sm font-semibold uppercase tracking-wide text-foreground mb-4">{cat}</h4>
              <ul className="space-y-3 text-sm text-muted-foreground">
                {links.map((l) => (
                  <li key={l}>
                    <Link 
                      href={
                        l === "Term Plan" ? "/term-plan" :
                        l === "Feedback" ? "/feedback" :
                        l === "Settings" ? "/settings" :
                        l === "Privacy Policy" ? "/privacy-policy" :
                        l === "Terms of Service" ? "/terms-of-service" :
                        l === "Security Policy" ? "/security-policy" :
                        l === "Cookie Policy" ? "/cookie-policy" :
                        l === "About" ? "/about" :
                        l === "Blog" ? "/blog" :
                        l === "Careers" ? "/careers" :
                        l === "Contact" ? "/contact" :
                        "#"
                      }
                      className="hover:text-foreground hover:shadow-sm hover:scale-105 transition-all duration-300 ease-in-out dark:hover:shadow-blue-500/30 dark:hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded"
                    >
                      {l}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-12 pt-8 border-t border-border text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} Lana AI. All rights reserved.
        </div>
      </div>
    </footer>
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