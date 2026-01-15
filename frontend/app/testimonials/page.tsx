"use client"

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useTheme } from "next-themes";
import { useUnifiedAuth } from "@/contexts/UnifiedAuthContext";
import { Star, Quote, ArrowRight } from "lucide-react";

function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true) }, []);
  if (!mounted) {
    return (
      <div className="inline-flex items-center justify-center rounded-md w-9 h-9" />
    );
  }

  return (
    <button
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
      className="inline-flex items-center justify-center rounded-xl w-9 h-9 hover:bg-muted hover:shadow-md hover:scale-105 transition-all duration-300 ease-in-out relative focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background dark:hover:shadow-blue-500/50 dark:hover:shadow-xl"
      aria-label={`Switch to ${resolvedTheme === "dark" ? "light" : "dark"} mode`}
      aria-pressed={resolvedTheme === "dark"}
    >
      {resolvedTheme === "dark" ? (
        <span className="h-5 w-5 text-blue-400 dark:text-blue-400 dark:hover:text-blue-300">🌙</span>
      ) : (
        <span className="h-5 w-5 text-yellow-500 dark:text-blue-400 dark:hover:text-blue-300">☀️</span>
      )}
    </button>
  );
}

function Header() {
  const [open, setOpen] = useState(false);
  const { user } = useUnifiedAuth();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-gradient-to-b from-gray-50/80 to-stone-50/80 backdrop-blur">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center space-x-2">
            <Image 
              src="/images/lana-logo-transparent.png" 
              alt="Lana AI Logo" 
              width={40}
              height={40}
              className="object-contain"
            />
            <span className="text-xl font-bold text-foreground">Lana AI</span>
          </div>

          {/* desktop */}
          <nav className="hidden md:flex items-center gap-6">
            <Link 
              href="/"
              className="text-sm font-medium text-muted-foreground hover:text-foreground hover:shadow-sm hover:scale-105 transition-all duration-300 ease-in-out dark:hover:shadow-blue-500/30 dark:hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              Home
            </Link>
            <Link 
              href="/about"
              className="text-sm font-medium text-muted-foreground hover:text-foreground hover:shadow-sm hover:scale-105 transition-all duration-300 ease-in-out dark:hover:shadow-blue-500/30 dark:hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              About
            </Link>
            <Link 
              href="/testimonials"
              className="text-sm font-medium text-foreground hover:shadow-sm hover:scale-105 transition-all duration-300 ease-in-out dark:hover:shadow-blue-500/30 dark:hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              Testimonials
            </Link>
            <Link 
              href="/features"
              className="text-sm font-medium text-muted-foreground hover:text-foreground hover:shadow-sm hover:scale-105 transition-all duration-300 ease-in-out dark:hover:shadow-blue-500/30 dark:hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              Features
            </Link>
            <Link 
              href="/pricing"
              className="text-sm font-medium text-muted-foreground hover:text-foreground hover:shadow-sm hover:scale-105 transition-all duration-300 ease-in-out dark:hover:shadow-blue-500/30 dark:hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              Pricing
            </Link>
            <Link 
              href="/contact"
              className="text-sm font-medium text-muted-foreground hover:text-foreground hover:shadow-sm hover:scale-105 transition-all duration-300 ease-in-out dark:hover:shadow-blue-500/30 dark:hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              Contact
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
                  className="inline-flex items-center justify-center rounded-xl bg-primary px-4 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 hover:shadow-lg hover:scale-105 transition-all duration-300 ease-in-out dark:hover:shadow-blue-500/50 dark:hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background active:scale-[0.96] min-h-12 min-w-32"
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
            <span>☰</span>
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
              href="/about"
              onClick={() => setOpen(false)} 
              className="text-sm font-medium text-muted-foreground hover:text-foreground hover:shadow-sm hover:scale-105 transition-all duration-300 ease-in-out dark:hover:shadow-blue-500/30 dark:hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background py-3 px-2"
            >
              About
            </Link>
            <Link 
              href="/testimonials"
              onClick={() => setOpen(false)} 
              className="text-sm font-medium text-foreground hover:shadow-sm hover:scale-105 transition-all duration-300 ease-in-out dark:hover:shadow-blue-500/30 dark:hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background py-3 px-2"
            >
              Testimonials
            </Link>
            <Link 
              href="/features"
              onClick={() => setOpen(false)} 
              className="text-sm font-medium text-muted-foreground hover:text-foreground hover:shadow-sm hover:scale-105 transition-all duration-300 ease-in-out dark:hover:shadow-blue-500/30 dark:hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background py-3 px-2"
            >
              Features
            </Link>
            <Link 
              href="/pricing"
              onClick={() => setOpen(false)} 
              className="text-sm font-medium text-muted-foreground hover:text-foreground hover:shadow-sm hover:scale-105 transition-all duration-300 ease-in-out dark:hover:shadow-blue-500/30 dark:hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background py-3 px-2"
            >
              Pricing
            </Link>
            <Link 
              href="/contact"
              onClick={() => setOpen(false)} 
              className="text-sm font-medium text-muted-foreground hover:text-foreground hover:shadow-sm hover:scale-105 transition-all duration-300 ease-in-out dark:hover:shadow-blue-500/30 dark:hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background py-3 px-2"
            >
              Contact
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
                    className="text-sm font-medium text-muted-foreground hover:text-foreground hover:shadow-sm hover:scale-105 transition-all duration-300 ease-in-out dark:hover:shadow-blue-500/30 dark:hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background py-3 px-2 flex-1 text-center min-h-12 flex items-center justify-center"
                    onClick={() => setOpen(false)}
                  >
                    Login
                  </Link>
                  <Link 
                    href="/register" 
                    className="inline-flex items-center justify-center rounded-xl bg-primary px-4 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 hover:shadow-lg hover:scale-105 transition-all duration-300 ease-in-out dark:hover:shadow-blue-500/50 dark:hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background active:scale-[0.96] flex-1 min-h-12"
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
  );
}

function HeroSection() {
  return (
    <section className="py-16 md:py-24 lg:py-32 bg-transparent">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12 md:mb-16">
          <span className="rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">What Our Users Say</span>
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-extrabold leading-tight tracking-tight mt-4">
            Real Stories from Real Learners
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto mt-6 leading-relaxed">
            Hear from students, parents, and educators who have transformed their learning experience with LANA AI.
          </p>
        </div>
      </div>
    </section>
  );
}

function TestimonialsGrid() {
  const testimonials = [
    {
      id: 1,
      name: "Emma Rodriguez",
      role: "High School Student",
      content: "LANA AI helped me understand calculus concepts that my teacher couldn't explain clearly. My grades improved from a C to an A in just two months!",
      rating: 5,
      avatar: "/Avatar frontface.png",
      verified: true
    },
    {
      id: 2,
      name: "David Thompson",
      role: "Parent",
      content: "As a parent, I love being able to track my daughter's progress in real-time. She's become more confident in math since using LANA AI.",
      rating: 5,
      avatar: "/Avatar frontface.png",
      verified: true
    },
    {
      id: 3,
      name: "Mrs. Jennifer Park",
      role: "8th Grade Math Teacher",
      content: "My students are more engaged and asking deeper questions since using LANA AI. It's become an invaluable supplement to my classroom teaching.",
      rating: 5,
      avatar: "/Avatar frontface.png",
      verified: true
    },
    {
      id: 4,
      name: "James Wilson",
      role: "College Freshman",
      content: "The step-by-step explanations for complex problems have been a game-changer for me. I wish I had this tool in high school!",
      rating: 4,
      avatar: "/Avatar frontface.png",
      verified: true
    },
    {
      id: 5,
      name: "Sophia Chen",
      role: "Middle School Student",
      content: "I used to hate math, but LANA AI makes it fun and easy to understand. I actually look forward to my homework now!",
      rating: 5,
      avatar: "/Avatar frontface.png",
      verified: true
    },
    {
      id: 6,
      name: "Robert Garcia",
      role: "Parent",
      content: "The personalized learning approach has helped my son overcome his anxiety around math. His confidence has grown tremendously.",
      rating: 5,
      avatar: "/Avatar frontface.png",
      verified: true
    }
  ];

  return (
    <section className="py-16 md:py-24 bg-transparent">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {testimonials.map((testimonial) => (
            <div 
              key={testimonial.id} 
              className="rounded-xl border bg-card bg-gradient-to-br from-gray-50 to-stone-50 dark:from-gray-900/30 dark:to-stone-900/30 p-6 shadow-sm transition-all duration-300 hover:shadow-xl hover:border-primary/60 hover:-translate-y-2 dark:hover:shadow-blue-500/30 dark:hover:shadow-xl"
            >
              <div className="flex items-center mb-4">
                <div className="relative w-12 h-12 rounded-full overflow-hidden mr-4">
                  <Image 
                    src={testimonial.avatar} 
                    alt={testimonial.name} 
                    width={48}
                    height={48}
                    className="object-cover"
                  />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">{testimonial.name}</h3>
                  <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                </div>
              </div>
              
              <div className="flex mb-3">
                {[...Array(5)].map((_, i) => (
                  <Star 
                    key={i} 
                    className={`h-4 w-4 ${i < testimonial.rating ? 'text-yellow-400 fill-current' : 'text-muted-foreground'}`} 
                  />
                ))}
              </div>
              
              <div className="relative">
                <Quote className="absolute top-0 left-0 h-6 w-6 text-primary/20 -mt-2 -ml-2" />
                <p className="text-muted-foreground pl-6 mt-2 leading-relaxed">
                  "{testimonial.content}"
                </p>
              </div>
              
              {testimonial.verified && (
                <div className="flex items-center mt-4 text-sm text-green-600">
                  <span className="mr-1">✓</span>
                  <span>Verified User</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function StatsSection() {
  const stats = [
    { number: "98%", label: "User Satisfaction" },
    { number: "4.9/5", label: "Average Rating" },
    { number: "10K+", label: "Active Users" },
    { number: "2M+", label: "Lessons Completed" }
  ];

  return (
    <section className="py-16 md:py-24 bg-gradient-to-r from-gray-600 to-stone-700 text-white rounded-3xl mx-4 my-16 p-8 md:p-12 shadow-xl">
      <div className="mx-auto max-w-6xl px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Trusted by Thousands of Learners</h2>
          <p className="text-muted-foreground/80 max-w-2xl mx-auto">
            Our impact on education continues to grow as more students discover the power of personalized learning.
          </p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {stats.map((stat, index) => (
            <div key={index}>
              <div className="text-4xl md:text-5xl font-bold mb-2">{stat.number}</div>
              <div className="text-muted-foreground/80">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CtaSection() {
  return (
    <section className="py-20 md:py-32 bg-transparent">
      <div className="mx-auto max-w-4xl px-4 text-center">
        <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground leading-tight">
          Join Our Community of Successful Learners
        </h2>
        <p className="text-muted-foreground mt-4 max-w-2xl mx-auto leading-relaxed">
          Experience the difference that personalized AI tutoring can make in your educational journey.
        </p>
        <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
          <Link 
            href="/register" 
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-4 text-base font-medium text-primary-foreground hover:bg-primary/90 hover:shadow-xl hover:scale-105 transition-all duration-300 ease-in-out dark:hover:shadow-blue-500/50 dark:hover:shadow-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background active:scale-[0.96] min-h-12 min-w-44"
          >
            Start Free Trial
            <ArrowRight className="h-5 w-5" />
          </Link>
          <Link 
            href="/features" 
            className="inline-flex items-center justify-center rounded-xl border border-input bg-background px-6 py-4 text-base font-medium hover:bg-accent hover:text-accent-foreground hover:shadow-md hover:scale-105 transition-all duration-300 ease-in-out dark:hover:shadow-blue-500/50 dark:hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background active:scale-[0.96] text-foreground min-h-12 min-w-44"
          >
            Explore Features
          </Link>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  const footerLinks = {
    Product: ["Features", "Pricing", "Demo", "API"],
    Company: ["About", "Testimonials", "Blog", "Careers", "Contact"],
    Legal: ["Privacy Policy", "Terms of Service", "Security Policy", "Cookie Policy"],
    Support: ["Help Center", "Feedback", "Settings"]
  };

  return (
    <footer className="border-t border-border py-8 md:py-16 bg-transparent">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-6 sm:gap-8 md:grid-cols-2 lg:grid-cols-5 md:gap-12">
          <div className="lg:col-span-2">
            <div className="flex items-center space-x-2">
              <Image 
                src="/images/lana-logo-transparent.png" 
                alt="Lana AI Logo" 
                width={40}
                height={40}
                className="object-contain"
              />
              <span className="text-xl font-bold text-foreground">Lana AI</span>
            </div>
            <p className="text-muted-foreground text-sm mt-3 max-w-md leading-relaxed">
              Empowering students worldwide through personalized AI tutoring that adapts to each learner's unique needs.
            </p>
            <div className="flex gap-3 sm:gap-4 mt-5">
              <Link 
                href="https://twitter.com/LANAAI" 
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Twitter" 
                className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background p-3 sm:p-2 rounded-full hover:bg-muted hover:shadow-md hover:scale-105 transition-all duration-300 ease-in-out dark:hover:shadow-blue-500/50 dark:hover:shadow-xl"
              >
                <span className="h-5 w-5 text-muted-foreground hover:text-foreground">🐦</span>
              </Link>
              <Link 
                href="https://www.facebook.com/LANAAI" 
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook" 
                className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background p-3 sm:p-2 rounded-full hover:bg-muted hover:shadow-md hover:scale-105 transition-all duration-300 ease-in-out dark:hover:shadow-blue-500/50 dark:hover:shadow-xl"
              >
                <span className="h-5 w-5 text-muted-foreground hover:text-foreground">📘</span>
              </Link>
              <Link 
                href="https://www.instagram.com/LANAAI" 
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram" 
                className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background p-3 sm:p-2 rounded-full hover:bg-muted hover:shadow-md hover:scale-105 transition-all duration-300 ease-in-out dark:hover:shadow-blue-500/50 dark:hover:shadow-xl"
              >
                <span className="h-5 w-5 text-muted-foreground hover:text-foreground">📸</span>
              </Link>
              <Link 
                href="https://www.linkedin.com/company/lana-ai" 
                target="_blank"
                rel="noopener noreferrer"
                aria-label="LinkedIn" 
                className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background p-3 sm:p-2 rounded-full hover:bg-muted hover:shadow-md hover:scale-105 transition-all duration-300 ease-in-out dark:hover:shadow-blue-500/50 dark:hover:shadow-xl"
              >
                <span className="h-5 w-5 text-muted-foreground hover:text-foreground">💼</span>
              </Link>
            </div>
          </div>
          {Object.entries(footerLinks).map(([cat, links]) => (
            <div key={cat}>
              <h4 className="text-sm font-semibold uppercase tracking-wide text-foreground mb-4 leading-tight">{cat}</h4>
              <ul className="space-y-3 text-sm text-muted-foreground">
                {links.map((l) => (
                  <li key={l}>
                    <Link 
                      href={
                        l === "About" ? "/about" :
                        l === "Testimonials" ? "/testimonials" :
                        l === "Privacy Policy" ? "/privacy-policy" :
                        l === "Terms of Service" ? "/terms-of-service" :
                        l === "Security Policy" ? "/security-policy" :
                        l === "Cookie Policy" ? "/cookie-policy" :
                        l === "Blog" ? "/blog" :
                        l === "Careers" ? "/careers" :
                        l === "Contact" ? "/contact" :
                        l === "Demo" ? "/demo" :
                        l === "API" ? "/api" :
                        l === "Help Center" ? "/help" :
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
          <p>© {new Date().getFullYear()} LANA AI Education Technologies Inc. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}

export default function TestimonialsPage() {
  const { setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); setTheme("light") }, []);
  if (!mounted) { return null }

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-gray-50 via-stone-50 to-gray-100 dark:from-gray-900/20 dark:via-stone-900/20 dark:to-gray-900/20 text-foreground font-sans">
      <Header />
      <main className="flex-grow">
        <HeroSection />
        <TestimonialsGrid />
        <StatsSection />
        <CtaSection />
      </main>
      <Footer />
    </div>
  );
}