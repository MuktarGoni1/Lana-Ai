"use client"

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useTheme } from "next-themes";
import { useUnifiedAuth } from "@/contexts/UnifiedAuthContext";
import { FileText, Scale, Clock, Shield, ArrowRight } from "lucide-react";

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
              href="/terms-of-service"
              className="text-sm font-medium text-foreground hover:shadow-sm hover:scale-105 transition-all duration-300 ease-in-out dark:hover:shadow-blue-500/30 dark:hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              Terms
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
              href="/terms-of-service"
              onClick={() => setOpen(false)} 
              className="text-sm font-medium text-foreground hover:shadow-sm hover:scale-105 transition-all duration-300 ease-in-out dark:hover:shadow-blue-500/30 dark:hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background py-3 px-2"
            >
              Terms
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
              <Scale className="h-8 w-8 text-primary" />
            </div>
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold leading-tight tracking-tight mt-4">
            Terms of Service
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mt-6 leading-relaxed">
            Guidelines and policies governing your use of LANA AI services
          </p>
        </div>
      </div>
    </section>
  );
}

function TermsOfServiceContent() {
  return (
    <section className="py-8 md:py-16 bg-transparent">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div className="prose prose-lg dark:prose-invert max-w-none">
          <div className="mb-8 p-6 bg-card rounded-xl border shadow-sm">
            <h2 className="text-2xl font-bold text-foreground mb-4 flex items-center">
              <Clock className="h-6 w-6 mr-2 text-primary" />
              Effective Date: January 15, 2024
            </h2>
            <p className="text-muted-foreground">
              These Terms of Service govern your use of LANA AI's educational platform. By accessing or using our services, you agree to be bound by these terms.
            </p>
          </div>

          <h2 className="text-2xl font-bold text-foreground mt-12 mb-6">Acceptance of Terms</h2>
          <p className="text-muted-foreground">
            By accessing or using the LANA AI platform, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service and our Privacy Policy. If you do not agree to these terms, you must not access or use our services.
          </p>

          <h2 className="text-2xl font-bold text-foreground mt-12 mb-6">Description of Service</h2>
          <p className="text-muted-foreground">
            LANA AI provides personalized AI tutoring services designed to assist students with their educational needs. Our platform offers adaptive learning experiences, structured lessons, math tutoring, and quick explanations to support student learning.
          </p>

          <h2 className="text-2xl font-bold text-foreground mt-12 mb-6">Eligibility</h2>
          <p className="text-muted-foreground">
            Our services are intended for educational purposes. Users under the age of 13 must have parental consent to use our services. Parents or guardians of minors are responsible for supervising their child's use of our platform.
          </p>

          <h2 className="text-2xl font-bold text-foreground mt-12 mb-6">User Responsibilities</h2>
          <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
            <li>Provide accurate and current information during registration</li>
            <li>Maintain the security of your account credentials</li>
            <li>Use the service in compliance with applicable laws and regulations</li>
            <li>Not misuse the service by interfering with its proper functioning</li>
            <li>Respect the intellectual property rights of others</li>
          </ul>

          <h2 className="text-2xl font-bold text-foreground mt-12 mb-6">Intellectual Property</h2>
          <p className="text-muted-foreground">
            All content, features, and functionality of the LANA AI platform are owned by LANA AI Education Technologies Inc. and are protected by intellectual property laws. You may not reproduce, distribute, or create derivative works from our content without explicit permission.
          </p>

          <h2 className="text-2xl font-bold text-foreground mt-12 mb-6">Privacy and Data Protection</h2>
          <p className="text-muted-foreground">
            We are committed to protecting your privacy. Please refer to our Privacy Policy for information about how we collect, use, and protect your personal information. By using our services, you consent to the collection and use of your information as described in our Privacy Policy.
          </p>

          <h2 className="text-2xl font-bold text-foreground mt-12 mb-6">Limitation of Liability</h2>
          <p className="text-muted-foreground">
            LANA AI shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of our services. Our total liability to you for any claims arising from these terms shall not exceed the amount you paid to LANA AI in the six (6) months preceding the claim.
          </p>

          <h2 className="text-2xl font-bold text-foreground mt-12 mb-6">Modifications to Service</h2>
          <p className="text-muted-foreground">
            We reserve the right to modify or discontinue our services at any time, with or without notice. We are not liable to you or any third party for any modification, suspension, or discontinuation of our services.
          </p>

          <h2 className="text-2xl font-bold text-foreground mt-12 mb-6">Termination</h2>
          <p className="text-muted-foreground">
            We may terminate or suspend your access to our services immediately, without prior notice, for any reason, including violation of these Terms of Service. Upon termination, all licenses granted to you will cease, and you must discontinue all use of our services.
          </p>

          <h2 className="text-2xl font-bold text-foreground mt-12 mb-6">Governing Law</h2>
          <p className="text-muted-foreground">
            These Terms of Service shall be governed by and construed in accordance with the laws of the State of California, without regard to its conflict of law provisions. Any disputes arising from these terms shall be resolved through binding arbitration in accordance with the Commercial Dispute Resolution Procedures of the American Arbitration Association.
          </p>

          <h2 className="text-2xl font-bold text-foreground mt-12 mb-6">Contact Information</h2>
          <p className="text-muted-foreground">
            If you have questions about these Terms of Service, please contact us at:
          </p>
          <div className="mt-4 p-4 bg-muted rounded-lg">
            <p className="font-medium">Email: legal@lanamind.com</p>
            <p className="mt-1">Address: 1234 Education Lane, San Francisco, CA 94107</p>
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
          Committed to Ethical Service Delivery
        </h2>
        <p className="text-lg text-muted-foreground/80 mt-4 max-w-2xl mx-auto leading-relaxed">
          Our terms are designed to protect both our users and our educational mission.
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
            Contact Our Team
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

export default function TermsOfServicePage() {
  const { setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); setTheme("light") }, []);
  if (!mounted) { return null }

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-gray-50 via-stone-50 to-gray-100 dark:from-gray-900/20 dark:via-stone-900/20 dark:to-gray-900/20 text-foreground font-sans">
      <Header />
      <main className="flex-grow">
        <HeroSection />
        <TermsOfServiceContent />
        <CtaSection />
      </main>
      <Footer />
    </div>
  );
}