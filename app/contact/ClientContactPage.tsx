"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useTheme } from "next-themes";
import { useEnhancedAuth } from '@/hooks/useEnhancedAuth';
import { Mail, Phone, MapPin, Clock } from "lucide-react";
import { Header, Footer } from "@/components/navigation";
import { getChildFriendlyClasses } from "@/lib/ui-styles";

/* ---------- CONTACT CONTENT ---------- */
function ContactContent() {
  return (
    <section className="py-12 md:py-16 bg-transparent">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8 md:mb-12">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3">Get in Touch</h1>
          <p className="text-muted-foreground text-base md:text-lg max-w-xl mx-auto">
            Have questions about Lana AI? We'd love to hear from you. Reach out to our team for support, partnerships, or general inquiries.
          </p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Contact Information */}
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-slate-900 mb-6 flex items-center gap-2">
              <span className="inline-block w-2 h-2 rounded-full bg-[#FACC15]"></span>
              Contact Information
            </h2>
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="bg-slate-100 p-3 rounded-xl flex-shrink-0">
                  <Mail className="h-5 w-5 text-slate-900" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 mb-1">General Inquiries</h3>
                  <p className="text-slate-600 text-sm font-medium">contact@lanamind.com</p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="bg-slate-100 p-3 rounded-xl flex-shrink-0">
                  <Phone className="h-5 w-5 text-slate-900" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 mb-1">Phone</h3>
                  <p className="text-slate-600 text-sm font-medium">+2347034983424</p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="bg-slate-100 p-3 rounded-xl flex-shrink-0">
                  <MapPin className="h-5 w-5 text-slate-900" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 mb-1">Address</h3>
                  <p className="text-slate-600 text-sm font-medium">
                    Don Ethebet<br />
                    Yobe state, Nigeria.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="bg-slate-100 p-3 rounded-xl flex-shrink-0">
                  <Clock className="h-5 w-5 text-slate-900" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 mb-1">Business Hours</h3>
                  <p className="text-slate-600 text-sm font-medium">
                    Monday - Friday: 9:00 AM - 6:00 PM<br />
                    Saturday: 10:00 AM - 2:00 PM<br />
                    Sunday: Closed
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Contact Form */}
          <div className="bg-slate-50 rounded-3xl p-8 md:p-10 shadow-sm border border-slate-100">
            <h2 className="text-xl md:text-2xl font-bold text-slate-900 mb-6 flex items-center gap-2">
              <span className="inline-block w-2 h-2 rounded-full bg-[#FACC15]"></span>
              Send us a Message
            </h2>
            <form className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-bold text-slate-900 mb-2">Name</label>
                <input
                  type="text"
                  id="name"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  placeholder="Your name"
                />
              </div>
              
              <div>
                <label htmlFor="email" className="block text-sm font-bold text-slate-900 mb-2">Email</label>
                <input
                  type="email"
                  id="email"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  placeholder="your.email@example.com"
                />
              </div>
              
              <div>
                <label htmlFor="subject" className="block text-sm font-bold text-slate-900 mb-2">Subject</label>
                <input
                  type="text"
                  id="subject"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  placeholder="How can we help you?"
                />
              </div>
              
              <div>
                <label htmlFor="message" className="block text-sm font-bold text-slate-900 mb-2">Message</label>
                <textarea
                  id="message"
                  rows={5}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all resize-none"
                  placeholder="Your message here..."
                ></textarea>
              </div>
              
              <button
                type="submit"
                className={getChildFriendlyClasses.button}
              >
                Send Message
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ---------- PAGE ---------- */
export default function ClientContactPage() {
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
        <ContactContent />
      </main>
      <Footer />
    </div>
  )
}