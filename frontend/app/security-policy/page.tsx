"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useTheme } from "next-themes"
import { useComprehensiveAuth } from '@/contexts/ComprehensiveAuthContext'
import { Shield, Lock, Eye, FileText, Moon, Sun, Menu, X, Twitter, Facebook, Instagram, Linkedin } from "lucide-react"

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

/* ---------- SECURITY POLICY CONTENT ---------- */
function SecurityPolicyContent() {
  return (
    <section className="py-12 md:py-16 bg-transparent">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3">Security Policy</h1>
          <p className="text-muted-foreground text-sm md:text-base">Last updated: {new Date().toLocaleDateString()}</p>
        </div>
        
        <div className="bg-card rounded-xl p-6 md:p-8 shadow-sm border border-border/50">
          <p className="text-muted-foreground mb-6 leading-relaxed">
            At Lana AI, we take the security of your personal information seriously. This Security Policy outlines the measures we implement to protect your data and maintain the integrity of our services.
          </p>

          <h2 className="text-xl md:text-2xl font-bold mt-8 mb-4 text-foreground flex items-center gap-2">
            <div className="w-2 h-2 bg-primary rounded-full"></div>
            Data Protection
          </h2>
          <p className="text-muted-foreground mb-4 leading-relaxed">
            We employ industry-standard security measures to protect your personal information from unauthorized access, alteration, disclosure, or destruction. These measures include:
          </p>
          <ul className="list-disc pl-6 mt-3 space-y-2 text-muted-foreground mb-6">
            <li><span className="font-semibold text-foreground">Encryption:</span> All data transmitted between your device and our servers is encrypted using TLS (Transport Layer Security).</li>
            <li><span className="font-semibold text-foreground">Secure Storage:</span> Personal information is stored on secure servers with restricted physical and digital access.</li>
            <li><span className="font-semibold text-foreground">Regular Audits:</span> We conduct regular security audits to identify and address potential vulnerabilities.</li>
            <li><span className="font-semibold text-foreground">Access Controls:</span> Strict access controls ensure that only authorized personnel can access sensitive data.</li>
          </ul>

          <h2 className="text-xl md:text-2xl font-bold mt-8 mb-4 text-foreground flex items-center gap-2">
            <div className="w-2 h-2 bg-primary rounded-full"></div>
            Account Security
          </h2>
          <p className="text-muted-foreground mb-4 leading-relaxed">
            We implement multiple layers of security to protect your account:
          </p>
          <ul className="list-disc pl-6 mt-3 space-y-2 text-muted-foreground mb-6">
            <li><span className="font-semibold text-foreground">Password Protection:</span> All passwords are hashed using bcrypt encryption.</li>
            <li><span className="font-semibold text-foreground">Two-Factor Authentication:</span> We support two-factor authentication for additional account security.</li>
            <li><span className="font-semibold text-foreground">Session Management:</span> Secure session tokens with automatic expiration help prevent unauthorized access.</li>
            <li><span className="font-semibold text-foreground">Activity Monitoring:</span> We monitor account activity for suspicious behavior and alert users when necessary.</li>
          </ul>

          <h2 className="text-xl md:text-2xl font-bold mt-8 mb-4 text-foreground flex items-center gap-2">
            <div className="w-2 h-2 bg-primary rounded-full"></div>
            Data Access & Control
          </h2>
          <p className="text-muted-foreground mb-4 leading-relaxed">
            We believe in transparency and user control over personal data:
          </p>
          <ul className="list-disc pl-6 mt-3 space-y-2 text-muted-foreground mb-6">
            <li>You have the right to access, update, or delete your personal information at any time through your account settings.</li>
            <li>We provide clear information about what data we collect and how it's used.</li>
            <li>You can opt out of certain data collection practices where legally permissible.</li>
            <li>We comply with applicable data protection regulations including GDPR and CCPA.</li>
          </ul>

          <h2 className="text-xl md:text-2xl font-bold mt-8 mb-4 text-foreground flex items-center gap-2">
            <div className="w-2 h-2 bg-primary rounded-full"></div>
            Incident Response
          </h2>
          <p className="text-muted-foreground mb-4 leading-relaxed">
            In the unlikely event of a security incident:
          </p>
          <ul className="list-disc pl-6 mt-3 space-y-2 text-muted-foreground mb-6">
            <li>We have established incident response procedures to quickly address and contain security breaches.</li>
            <li>Users will be notified of any security incidents that may affect their personal information within 72 hours of detection.</li>
            <li>We conduct post-incident reviews to improve our security measures.</li>
            <li>We maintain insurance coverage for cybersecurity incidents.</li>
          </ul>

          <h2 className="text-xl md:text-2xl font-bold mt-8 mb-4 text-foreground flex items-center gap-2">
            <div className="w-2 h-2 bg-primary rounded-full"></div>
            Employee Training & Security Culture
          </h2>
          <p className="text-muted-foreground mb-4 leading-relaxed">
            Security is everyone's responsibility at Lana AI:
          </p>
          <ul className="list-disc pl-6 mt-3 space-y-2 text-muted-foreground mb-6">
            <li>All employees undergo comprehensive security training during onboarding and annually thereafter.</li>
            <li>We maintain strict confidentiality agreements with all staff members.</li>
            <li>Access to sensitive data is granted on a need-to-know basis only.</li>
            <li>We regularly update our security policies and procedures based on emerging threats and best practices.</li>
          </ul>

          <h2 className="text-xl md:text-2xl font-bold mt-8 mb-4 text-foreground flex items-center gap-2">
            <div className="w-2 h-2 bg-primary rounded-full"></div>
            Third-Party Security
          </h2>
          <p className="text-muted-foreground mb-4 leading-relaxed">
            We carefully vet all third-party vendors and service providers:
          </p>
          <ul className="list-disc pl-6 mt-3 space-y-2 text-muted-foreground mb-6">
            <li>All third-party services must meet our security standards and sign data protection agreements.</li>
            <li>We regularly assess vendor security practices and compliance.</li>
            <li>We limit data sharing with third parties to what is necessary for service provision.</li>
            <li>We maintain contracts that hold third parties accountable for data protection.</li>
          </ul>

          <h2 className="text-xl md:text-2xl font-bold mt-8 mb-4 text-foreground flex items-center gap-2">
            <div className="w-2 h-2 bg-primary rounded-full"></div>
            Contact Security Team
          </h2>
          <p className="text-muted-foreground mb-4 leading-relaxed">
            If you have security concerns or wish to report a vulnerability, please contact our security team:
          </p>
          <ul className="list-disc pl-6 mt-3 space-y-2 text-muted-foreground">
            <li>By email: <a href="mailto:contact@lanamind.com" className="text-primary hover:underline">contact@lanamind.com</a></li>
            <li>By encrypted message: security@lana.ai (PGP key available upon request)</li>
            <li>Please include detailed information about the security concern or vulnerability</li>
            <li>We commit to responding to security reports within 48 hours</li>
          </ul>
        </div>
      </div>
    </section>
  )
}

const footerLinks = {
  Product: ["Features", "Pricing", "Demo", "API"],
  Company: ["About", "Blog", "Careers", "Contact"],
  Legal: ["Privacy Policy", "Terms of Service", "Security Policy", "Cookie Policy"],
  Support: ["Term Plan", "Feedback", "Settings"]
}

/* ---------- FOOTER ---------- */
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
export default function SecurityPolicyPage() {
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
        <SecurityPolicyContent />
      </main>
      <Footer />
    </div>
  )
}