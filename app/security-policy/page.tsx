"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useTheme } from "next-themes"
import { useUnifiedAuth } from "@/contexts/UnifiedAuthContext"
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
  const { user } = useUnifiedAuth()

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
    <section className="py-16 md:py-24 bg-transparent">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4">Security Policy</h1>
          <p className="text-muted-foreground text-base md:text-lg">Last updated: {new Date().toLocaleDateString()}</p>
        </div>
        
        <div className="prose prose-gray dark:prose-invert max-w-none bg-card rounded-xl p-6 md:p-8 shadow-sm">
          <p className="text-muted-foreground">
            At Lana AI, we take the security of your personal information and data seriously. This Security Policy outlines the measures we implement to protect your data and maintain the integrity of our platform.
          </p>

          <h2 className="text-2xl font-bold mt-8 mb-4 text-foreground">Data Protection & Encryption</h2>
          <p className="text-muted-foreground">
            We employ industry-standard encryption protocols to protect your data both in transit and at rest. All sensitive information, including personal details and login credentials, is encrypted using advanced cryptographic methods such as AES-256 encryption and TLS 1.3 for data transmission.
          </p>
          <p className="text-muted-foreground">
            Our databases are secured with multiple layers of protection, including access controls, firewalls, and intrusion detection systems. Access to sensitive data is restricted to authorized personnel only, with strict authentication protocols in place.
          </p>

          <h2 className="text-2xl font-bold mt-8 mb-4 text-foreground">Authentication & Access Control</h2>
          <p className="text-muted-foreground">
            We implement robust authentication mechanisms to ensure that only authorized users can access their accounts. This includes:
          </p>
          <ul className="list-disc pl-6 mt-3 space-y-2 text-muted-foreground">
            <li>Multi-factor authentication (MFA) options for enhanced account security</li>
            <li>Secure password policies requiring strong, unique passwords</li>
            <li>Regular session management and automatic logout for inactive sessions</li>
            <li>Role-based access controls limiting data access based on user roles</li>
            <li>IP whitelisting for administrative access to sensitive systems</li>
          </ul>

          <h2 className="text-2xl font-bold mt-8 mb-4 text-foreground">Infrastructure Security</h2>
          <p className="text-muted-foreground">
            Our infrastructure is hosted on secure cloud platforms with enterprise-grade security measures. We utilize:
          </p>
          <ul className="list-disc pl-6 mt-3 space-y-2 text-muted-foreground">
            <li>Redundant servers distributed across multiple geographic locations</li>
            <li>DDoS protection and mitigation services</li>
            <li>Regular vulnerability assessments and penetration testing</li>
            <li>Network segmentation to isolate sensitive data</li>
            <li>24/7 monitoring and alerting systems</li>
            <li>Automated backup and disaster recovery procedures</li>
          </ul>

          <h2 className="text-2xl font-bold mt-8 mb-4 text-foreground">Application Security</h2>
          <p className="text-muted-foreground">
            Our application development follows secure coding practices and industry standards:
          </p>
          <ul className="list-disc pl-6 mt-3 space-y-2 text-muted-foreground">
            <li>Regular security audits and code reviews</li>
            <li>Input validation and sanitization to prevent injection attacks</li>
            <li>Protection against cross-site scripting (XSS) and cross-site request forgery (CSRF)</li>
            <li>Secure API endpoints with rate limiting and authentication</li>
            <li>Regular updates and patching of software dependencies</li>
            <li>Principle of least privilege for all system components</li>
          </ul>

          <h2 className="text-2xl font-bold mt-8 mb-4 text-foreground">Data Handling & Privacy</h2>
          <p className="text-muted-foreground">
            We follow strict data handling procedures aligned with privacy regulations such as GDPR and applicable local laws:
          </p>
          <ul className="list-disc pl-6 mt-3 space-y-2 text-muted-foreground">
            <li>Data minimization: collecting only necessary information</li>
            <li>Pseudonymization and anonymization techniques where appropriate</li>
            <li>Regular data retention reviews and secure deletion procedures</li>
            <li>Transparent data processing with clear consent mechanisms</li>
            <li>Breach notification procedures compliant with regulatory requirements</li>
          </ul>

          <h2 className="text-2xl font-bold mt-8 mb-4 text-foreground">Employee Security Training</h2>
          <p className="text-muted-foreground">
            All employees undergo comprehensive security training covering:
          </p>
          <ul className="list-disc pl-6 mt-3 space-y-2 text-muted-foreground">
            <li>Data protection best practices</li>
            <li>Phishing and social engineering awareness</li>
            <li>Incident response procedures</li>
            <li>Access control responsibilities</li>
            <li>Confidentiality and non-disclosure requirements</li>
          </ul>

          <h2 className="text-2xl font-bold mt-8 mb-4 text-foreground">Compliance & Certifications</h2>
          <p className="text-muted-foreground">
            We maintain compliance with relevant security standards and regulations:
          </p>
          <ul className="list-disc pl-6 mt-3 space-y-2 text-muted-foreground">
            <li>Regular third-party security audits</li>
            <li>Compliance with SOC 2 Type II standards</li>
            <li>GDPR and CCPA compliance measures</li>
            <li>ISO 27001 information security management standards</li>
            <li>Regular security certifications for our team members</li>
          </ul>

          <h2 className="text-2xl font-bold mt-8 mb-4 text-foreground">Incident Response</h2>
          <p className="text-muted-foreground">
            We maintain a comprehensive incident response plan that includes:
          </p>
          <ul className="list-disc pl-6 mt-3 space-y-2 text-muted-foreground">
            <li>24/7 security monitoring and alerting</li>
            <li>Immediate containment and investigation procedures</li>
            <li>Communication protocols for affected users</li>
            <li>Regulatory reporting as required by law</li>
            <li>Post-incident analysis and preventive measures</li>
          </ul>

          <h2 className="text-2xl font-bold mt-8 mb-4 text-foreground">User Responsibilities</h2>
          <p className="text-muted-foreground">
            While we implement extensive security measures, users also play a critical role in maintaining security:
          </p>
          <ul className="list-disc pl-6 mt-3 space-y-2 text-muted-foreground">
            <li>Using strong, unique passwords for their accounts</li>
            <li>Enabling multi-factor authentication when available</li>
            <li>Keeping their login credentials confidential</li>
            <li>Reporting suspicious activities immediately</li>
            <li>Logging out of shared devices</li>
            <li>Keeping their devices and software updated</li>
          </ul>

          <h2 className="text-2xl font-bold mt-8 mb-4 text-foreground">Regular Security Audits</h2>
          <p className="text-muted-foreground">
            We conduct regular security assessments including:
          </p>
          <ul className="list-disc pl-6 mt-3 space-y-2 text-muted-foreground">
            <li>Quarterly penetration testing by certified security professionals</li>
            <li>Monthly vulnerability scans of our systems</li>
            <li>Annual comprehensive security audits</li>
            <li>Continuous monitoring for emerging threats</li>
            <li>Regular updates to our security policies and procedures</li>
          </ul>

          <h2 className="text-2xl font-bold mt-8 mb-4 text-foreground">Contact Information</h2>
          <p className="text-muted-foreground">
            If you have any security concerns or believe you have identified a vulnerability in our system, please contact our security team immediately:
          </p>
          <ul className="list-disc pl-6 mt-3 space-y-2 text-muted-foreground">
            <li>Security email: security@lana.ai</li>
            <li>Security hotline: Available 24/7 for urgent matters</li>
            <li>Report vulnerabilities through our responsible disclosure program</li>
          </ul>

          <h2 className="text-2xl font-bold mt-8 mb-4 text-foreground">Policy Updates</h2>
          <p className="text-muted-foreground">
            This Security Policy is reviewed and updated regularly to address emerging threats and incorporate best practices. Significant changes will be communicated to users through our official channels. The "Last Updated" date at the top of this page indicates the most recent revision.
          </p>
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