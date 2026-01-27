"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useTheme } from "next-themes";
import { useEnhancedAuth } from '@/hooks/useEnhancedAuth';
import { Header, Footer } from "@/components/navigation";
import { getChildFriendlyClasses } from "@/lib/ui-styles";

/* ---------- TERMS OF SERVICE CONTENT ---------- */
function TermsOfServiceContent() {
  return (
    <section className="py-12 md:py-16 bg-transparent">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3">Terms of Service</h1>
          <p className="text-muted-foreground text-sm md:text-base">Last updated: {new Date().toLocaleDateString()}</p>
        </div>
        
        <div className="bg-slate-50 rounded-3xl p-8 md:p-12 shadow-sm border border-slate-100">
          <p className="text-slate-600 mb-8 leading-relaxed font-medium">
            Please read these terms carefully before using Lana AI. By using our service, you agree to follow these rules.
          </p>

          <h2 className="text-xl md:text-2xl font-bold mt-12 mb-6 text-slate-900 flex items-center gap-2">
            <div className="w-2 h-2 bg-[#FACC15] rounded-full"></div>
            Agreeing to These Terms
          </h2>
          <p className="text-slate-600 mb-8 leading-relaxed font-medium">
            By using our service, you agree to these terms. If you don't agree, please don't use our service.
          </p>

          <h2 className="text-xl md:text-2xl font-bold mt-12 mb-6 text-slate-900 flex items-center gap-2">
            <div className="w-2 h-2 bg-[#FACC15] rounded-full"></div>
            Age Requirements
          </h2>
          <p className="text-slate-600 mb-8 leading-relaxed font-medium">
            Our service is for children 13 and older. If you're between 13-18, you need a parent's permission to use it.
          </p>

          <h2 className="text-xl md:text-2xl font-bold mt-12 mb-6 text-slate-900 flex items-center gap-2">
            <div className="w-2 h-2 bg-[#FACC15] rounded-full"></div>
            Your Account
          </h2>
          <p className="text-slate-600 mb-6 leading-relaxed font-medium">
            When you create an account, please give us accurate information. You're responsible for keeping your account secure.
          </p>
          <p className="text-slate-600 mb-8 leading-relaxed font-medium">
            Parents are responsible for their children's accounts.
          </p>

          <h2 className="text-xl md:text-2xl font-bold mt-12 mb-6 text-slate-900 flex items-center gap-2">
            <div className="w-2 h-2 bg-[#FACC15] rounded-full"></div>
            Our Content
          </h2>
          <p className="text-slate-600 mb-8 leading-relaxed font-medium">
            All content on our service is owned by Lana AI and protected by copyright laws.
          </p>

          <h2 className="text-xl md:text-2xl font-bold mt-12 mb-6 text-slate-900 flex items-center gap-2">
            <div className="w-2 h-2 bg-[#FACC15] rounded-full"></div>
            What You Can't Do
          </h2>
          <p className="text-slate-600 mb-6 leading-relaxed font-medium">
            Please use our service responsibly:
          </p>
          <ul className="list-disc pl-6 mt-3 space-y-3 text-slate-600 mb-8 font-medium">
            <li>Follow all laws and rules</li>
            <li>Don't send spam or ads</li>
            <li>Don't pretend to be someone else</li>
            <li>Don't do anything harmful or illegal</li>
            <li>Don't interfere with others' learning</li>
          </ul>

          <h2 className="text-xl md:text-2xl font-bold mt-12 mb-6 text-slate-900 flex items-center gap-2">
            <div className="w-2 h-2 bg-[#FACC15] rounded-full"></div>
            About Our AI Content
          </h2>
          <p className="text-slate-600 mb-8 leading-relaxed font-medium">
            Our AI provides educational help, but it's not a substitute for professional advice. Always check with qualified teachers or experts when needed.
          </p>

          <h2 className="text-xl md:text-2xl font-bold mt-12 mb-6 text-slate-900 flex items-center gap-2">
            <div className="w-2 h-2 bg-[#FACC15] rounded-full"></div>
            If You Break the Rules
          </h2>
          <p className="text-slate-600 mb-6 leading-relaxed font-medium">
            We may close your account without warning if you break these terms.
          </p>
          <p className="text-slate-600 mb-8 leading-relaxed font-medium">
            When your account is closed, you lose access to our service.
          </p>

          <h2 className="text-xl md:text-2xl font-bold mt-12 mb-6 text-slate-900 flex items-center gap-2">
            <div className="w-2 h-2 bg-[#FACC15] rounded-full"></div>
            Our Liability
          </h2>
          <p className="text-slate-600 mb-8 leading-relaxed font-medium">
            We're not responsible for any indirect damages or losses that might happen from using our service.
          </p>

          <h2 className="text-xl md:text-2xl font-bold mt-12 mb-6 text-slate-900 flex items-center gap-2">
            <div className="w-2 h-2 bg-[#FACC15] rounded-full"></div>
            No Guarantees
          </h2>
          <p className="text-slate-600 mb-8 leading-relaxed font-medium">
            You use our service at your own risk. We provide it "as is" without any promises.
          </p>

          <h2 className="text-xl md:text-2xl font-bold mt-12 mb-6 text-slate-900 flex items-center gap-2">
            <div className="w-2 h-2 bg-[#FACC15] rounded-full"></div>
            Governing Law
          </h2>
          <p className="text-slate-600 mb-8 leading-relaxed font-medium">
            These terms are governed by California law.
          </p>

          <h2 className="text-xl md:text-2xl font-bold mt-12 mb-6 text-slate-900 flex items-center gap-2">
            <div className="w-2 h-2 bg-[#FACC15] rounded-full"></div>
            Changes to These Terms
          </h2>
          <p className="text-slate-600 mb-8 leading-relaxed font-medium">
            We may update these terms when needed. By continuing to use our service, you agree to the updated terms.
          </p>

          <h2 className="text-xl md:text-2xl font-bold mt-12 mb-6 text-slate-900 flex items-center gap-2">
            <div className="w-2 h-2 bg-[#FACC15] rounded-full"></div>
            Questions?
          </h2>
          <p className="text-slate-600 mb-6 leading-relaxed font-medium">
            If you have questions about these terms, contact us:
          </p>
          <ul className="list-disc pl-6 mt-3 space-y-3 text-slate-600 font-medium">
            <li>Email: <a href="mailto:contact@lanamind.com" className="text-slate-900 hover:underline font-bold">contact@lanamind.com</a></li>
            <li>Visit: <a href="/contact" className="text-slate-900 hover:underline font-bold">Contact Us</a></li>
          </ul>
        </div>
      </div>
    </section>
  )
}

/* ---------- PAGE ---------- */
export default function ClientTermsPage() {
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
        <TermsOfServiceContent />
      </main>
      <Footer />
    </div>
  )
}