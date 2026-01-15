"use client"

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useTheme } from "next-themes";
import { useUnifiedAuth } from "@/contexts/UnifiedAuthContext";
import { Mail, Phone, MapPin, MessageSquare, Send, ArrowRight } from "lucide-react";

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
              href="/contact"
              className="text-sm font-medium text-foreground hover:shadow-sm hover:scale-105 transition-all duration-300 ease-in-out dark:hover:shadow-blue-500/30 dark:hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              Contact
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
              href="/contact"
              onClick={() => setOpen(false)} 
              className="text-sm font-medium text-foreground hover:shadow-sm hover:scale-105 transition-all duration-300 ease-in-out dark:hover:shadow-blue-500/30 dark:hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background py-3 px-2"
            >
              Contact
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
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold leading-tight tracking-tight mt-4">
            Get in Touch
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mt-6 leading-relaxed">
            Have questions about our AI tutoring platform? Reach out to our team for support, partnerships, or general inquiries.
          </p>
        </div>
      </div>
    </section>
  );
}

function ContactForm() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate form submission
    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitSuccess(true);
      setFormData({ name: "", email: "", subject: "", message: "" });
      
      // Reset success message after 5 seconds
      setTimeout(() => setSubmitSuccess(false), 5000);
    }, 1500);
  };

  return (
    <section className="py-8 md:py-16 bg-transparent">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div>
            <h2 className="text-2xl font-bold text-foreground mb-6">Send us a message</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-foreground mb-2">Name</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 rounded-xl border border-input bg-background focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all duration-300"
                  placeholder="Your name"
                />
              </div>
              
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">Email</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 rounded-xl border border-input bg-background focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all duration-300"
                  placeholder="your.email@example.com"
                />
              </div>
              
              <div>
                <label htmlFor="subject" className="block text-sm font-medium text-foreground mb-2">Subject</label>
                <input
                  type="text"
                  id="subject"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 rounded-xl border border-input bg-background focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all duration-300"
                  placeholder="How can we help you?"
                />
              </div>
              
              <div>
                <label htmlFor="message" className="block text-sm font-medium text-foreground mb-2">Message</label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  required
                  rows={5}
                  className="w-full px-4 py-3 rounded-xl border border-input bg-background focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all duration-300 resize-none"
                  placeholder="Your message here..."
                ></textarea>
              </div>
              
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-4 text-base font-medium text-primary-foreground hover:bg-primary/90 hover:shadow-xl hover:scale-105 transition-all duration-300 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background active:scale-[0.96] min-h-12 disabled:opacity-70"
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Sending...
                  </>
                ) : (
                  <>
                    Send Message
                    <Send className="h-5 w-5" />
                  </>
                )}
              </button>
              
              {submitSuccess && (
                <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-xl text-green-700">
                  Thank you for your message! Our team will get back to you shortly.
                </div>
              )}
            </form>
          </div>
          
          <div>
            <h2 className="text-2xl font-bold text-foreground mb-6">Contact Information</h2>
            <div className="space-y-8">
              <div className="flex items-start">
                <div className="bg-primary/10 p-3 rounded-full mr-4">
                  <Mail className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">General Inquiries</h3>
                  <p className="text-muted-foreground mt-1">contact@lanamind.com</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="bg-primary/10 p-3 rounded-full mr-4">
                  <Phone className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Support</h3>
                  <p className="text-muted-foreground mt-1">support@lanamind.com</p>
                  <p className="text-muted-foreground mt-1">(Available 9AM - 6PM PST)</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="bg-primary/10 p-3 rounded-full mr-4">
                  <MapPin className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Office</h3>
                  <p className="text-muted-foreground mt-1">1234 Education Lane</p>
                  <p className="text-muted-foreground">San Francisco, CA 94107</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="bg-primary/10 p-3 rounded-full mr-4">
                  <MessageSquare className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Live Chat</h3>
                  <p className="text-muted-foreground mt-1">Chat with our support team</p>
                  <p className="text-muted-foreground mt-1">(Available during business hours)</p>
                </div>
              </div>
            </div>
            
            <div className="mt-12 p-6 bg-card rounded-xl border shadow-sm">
              <h3 className="font-bold text-foreground mb-3">Frequently Asked Questions</h3>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>How does the AI tutoring work?</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>What grade levels do you support?</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>How do you ensure student privacy?</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Do you offer institutional pricing?</span>
                </li>
              </ul>
              <Link 
                href="/faq" 
                className="mt-4 inline-flex items-center text-primary hover:underline"
              >
                View Full FAQ
                <ArrowRight className="h-4 w-4 ml-1" />
              </Link>
            </div>
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
          Ready to Transform Learning?
        </h2>
        <p className="text-lg text-muted-foreground/80 mt-4 max-w-2xl mx-auto leading-relaxed">
          Contact us today to learn more about how LANA AI can benefit your educational institution or student.
        </p>
        <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
          <Link 
            href="/demo" 
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-white text-gray-900 px-6 py-4 text-base font-medium hover:bg-gray-100 hover:shadow-xl hover:scale-105 transition-all duration-300 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-background active:scale-[0.96] min-h-12 min-w-44"
          >
            Schedule a Demo
            <ArrowRight className="h-5 w-5" />
          </Link>
          <Link 
            href="/pricing" 
            className="inline-flex items-center justify-center rounded-xl border border-white bg-transparent px-6 py-4 text-base font-medium hover:bg-white hover:text-gray-900 hover:shadow-lg hover:scale-105 transition-all duration-300 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-background active:scale-[0.96] text-white min-h-12 min-w-44"
          >
            View Pricing
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

export default function ContactPage() {
  const { setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); setTheme("light") }, []);
  if (!mounted) { return null }

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-gray-50 via-stone-50 to-gray-100 dark:from-gray-900/20 dark:via-stone-900/20 dark:to-gray-900/20 text-foreground font-sans">
      <Header />
      <main className="flex-grow">
        <HeroSection />
        <ContactForm />
        <CtaSection />
      </main>
      <Footer />
    </div>
  );
}