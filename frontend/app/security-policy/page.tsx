"use client"

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useTheme } from "next-themes";
import { useUnifiedAuth } from "@/contexts/UnifiedAuthContext";
import { Shield, Lock, AlertTriangle, CheckCircle, ArrowRight } from "lucide-react";

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
              href="/security-policy"
              className="text-sm font-medium text-foreground hover:shadow-sm hover:scale-105 transition-all duration-300 ease-in-out dark:hover:shadow-blue-500/30 dark:hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              Security
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
              href="/security-policy"
              onClick={() => setOpen(false)} 
              className="text-sm font-medium text-foreground hover:shadow-sm hover:scale-105 transition-all duration-300 ease-in-out dark:hover:shadow-blue-500/30 dark:hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background py-3 px-2"
            >
              Security
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
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12 md:mb-16">
          <div className="flex justify-center mb-4">
            <div className="bg-primary/10 p-3 rounded-full">
              <Lock className="h-8 w-8 text-primary" />
            </div>
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold leading-tight tracking-tight mt-4">
            Security Policy
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mt-6 leading-relaxed">
            Our commitment to protecting your data and ensuring the highest level of security across our platform.
          </p>
        </div>
      </div>
    </section>
  );
}

function SecurityMeasures() {
  return (
    <section className="py-8 md:py-16 bg-transparent">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          <div>
            <h2 className="text-2xl font-bold text-foreground mb-6">Our Security Framework</h2>
            <p className="text-muted-foreground mb-6 leading-relaxed">
              At LANA AI, we implement a comprehensive security framework to protect our users' data and ensure the integrity of our platform.
            </p>
            
            <div className="space-y-6">
              <div className="flex items-start">
                <div className="bg-primary/10 p-2 rounded-full mr-4">
                  <Shield className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Data Encryption</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    All data is encrypted in transit using TLS 1.3 and at rest using AES-256 encryption.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="bg-primary/10 p-2 rounded-full mr-4">
                  <Lock className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Secure Infrastructure</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Our infrastructure is hosted on secure cloud platforms with SOC 2 Type II certification.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="bg-primary/10 p-2 rounded-full mr-4">
                  <AlertTriangle className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Regular Audits</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    We conduct quarterly security audits and penetration testing to identify and address vulnerabilities.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="bg-primary/10 p-2 rounded-full mr-4">
                  <CheckCircle className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Access Controls</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Strict role-based access controls limit data access to authorized personnel only.
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-card rounded-xl p-6 border shadow-sm">
            <h3 className="font-bold text-foreground mb-4">Compliance Certifications</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <span className="font-medium">SOC 2 Type II</span>
                <CheckCircle className="h-5 w-5 text-green-500" />
              </div>
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <span className="font-medium">GDPR Compliant</span>
                <CheckCircle className="h-5 w-5 text-green-500" />
              </div>
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <span className="font-medium">COPPA Compliant</span>
                <CheckCircle className="h-5 w-5 text-green-500" />
              </div>
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <span className="font-medium">FERPA Compliant</span>
                <CheckCircle className="h-5 w-5 text-green-500" />
              </div>
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <span className="font-medium">ISO 27001</span>
                <CheckCircle className="h-5 w-5 text-green-500" />
              </div>
            </div>
            
            <div className="mt-6 p-4 bg-primary/5 rounded-lg border border-primary/20">
              <h4 className="font-semibold text-foreground mb-2 flex items-center">
                <AlertTriangle className="h-4 w-4 mr-2 text-primary" />
                Incident Response
              </h4>
              <p className="text-sm text-muted-foreground">
                We maintain a 24/7 security operations center and a documented incident response plan to address potential security events swiftly.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function DataProtectionSection() {
  return (
    <section className="py-16 md:py-24 bg-transparent">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground">Data Protection Practices</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mt-4">
            Our approach to safeguarding your personal and educational data
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="rounded-xl border bg-card bg-gradient-to-br from-gray-50 to-stone-50 dark:from-gray-900/30 dark:to-stone-900/30 p-6 shadow-sm transition-all duration-300 hover:shadow-xl hover:border-primary/60 hover:-translate-y-2 dark:hover:shadow-blue-500/30 dark:hover:shadow-xl">
            <div className="bg-primary/10 p-3 rounded-full w-12 h-12 flex items-center justify-center mb-4 mx-auto">
              <Shield className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2 text-foreground text-center">Data Minimization</h3>
            <p className="text-muted-foreground text-center text-sm">
              We only collect and retain the data necessary for providing our educational services.
            </p>
          </div>
          
          <div className="rounded-xl border bg-card bg-gradient-to-br from-gray-50 to-stone-50 dark:from-gray-900/30 dark:to-stone-900/30 p-6 shadow-sm transition-all duration-300 hover:shadow-xl hover:border-primary/60 hover:-translate-y-2 dark:hover:shadow-blue-500/30 dark:hover:shadow-xl">
            <div className="bg-primary/10 p-3 rounded-full w-12 h-12 flex items-center justify-center mb-4 mx-auto">
              <Lock className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2 text-foreground text-center">Access Monitoring</h3>
            <p className="text-muted-foreground text-center text-sm">
              All access to user data is logged and monitored for unauthorized access attempts.
            </p>
          </div>
          
          <div className="rounded-xl border bg-card bg-gradient-to-br from-gray-50 to-stone-50 dark:from-gray-900/30 dark:to-stone-900/30 p-6 shadow-sm transition-all duration-300 hover:shadow-xl hover:border-primary/60 hover:-translate-y-2 dark:hover:shadow-blue-500/30 dark:hover:shadow-xl">
            <div className="bg-primary/10 p-3 rounded-full w-12 h-12 flex items-center justify-center mb-4 mx-auto">
              <CheckCircle className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2 text-foreground text-center">Regular Updates</h3>
            <p className="text-muted-foreground text-center text-sm">
              We continuously update our systems to patch vulnerabilities and improve security.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function CtaSection() {
  return (
    <section className="py-20 md:py-32 bg-gradient-to-r from-gray-600 to-stone-700 text-white rounded-3xl mx-4 my-16 p-8 md:p-12 shadow-xl">
      <div className="mx-auto max-w-4xl px-4 text-center">
        <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold leading-tight">
          Security You Can Trust
        </h2>
        <p className="text-lg text-muted-foreground/80 mt-4 max-w-2xl mx-auto leading-relaxed">
          Our commitment to security enables you to focus on learning without concern for data protection.
        </p>
        <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
          <Link 
            href="/privacy-policy" 
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-white text-gray-900 px-6 py-4 text-base font-medium hover:bg-gray-100 hover:shadow-xl hover:scale-105 transition-all duration-300 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-background active:scale-[0.96] min-h-12 min-w-44"
          >
            Privacy Policy
            <Shield className="h-5 w-5" />
          </Link>
          <Link 
            href="/contact" 
            className="inline-flex items-center justify-center rounded-xl border border-white bg-transparent px-6 py-4 text-base font-medium hover:bg-white hover:text-gray-900 hover:shadow-lg hover:scale-105 transition-all duration-300 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-background active:scale-[0.96] text-white min-h-12 min-w-44"
          >
            Contact Security Team
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

export default function SecurityPolicyPage() {
  const { setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); setTheme("light") }, []);
  if (!mounted) { return null }

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-gray-50 via-stone-50 to-gray-100 dark:from-gray-900/20 dark:via-stone-900/20 dark:to-gray-900/20 text-foreground font-sans">
      <Header />
      <main className="flex-grow">
        <HeroSection />
        <SecurityMeasures />
        <DataProtectionSection />
        <CtaSection />
      </main>
      <Footer />
    </div>
  );
}