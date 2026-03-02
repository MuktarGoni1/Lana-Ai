"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useTheme } from "next-themes";
import { useUnifiedAuth } from '@/contexts/UnifiedAuthContext';
import { Briefcase, MapPin, Clock, Users, Award, Globe } from "lucide-react";
import { Header, Footer } from "@/components/navigation";
import { getChildFriendlyClasses, getPastelBg } from "@/lib/ui-styles";

/* ---------- CAREERS CONTENT ---------- */
function CareersContent() {
  return (
    <section className="py-12 md:py-16 bg-transparent">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8 md:mb-12">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3">Join Our Team</h1>
          <p className="text-muted-foreground text-base md:text-lg max-w-xl mx-auto">Be part of revolutionizing education through innovative technology and personalized learning experiences.</p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="bg-slate-50 rounded-3xl border border-slate-100 p-8 shadow-sm">
              <h2 className="text-xl md:text-2xl font-bold mb-6 text-slate-900 flex items-center gap-2">
                <span className="inline-block w-2 h-2 rounded-full bg-[#FACC15]"></span>
                Why Work With Us?
              </h2>
              <p className="text-slate-600 mb-8 font-medium">
                At Lana AI, we're building the future of education. We bring together passionate educators, 
                innovative technologists, and creative designers to create transformative learning experiences 
                for children worldwide. Join us in our mission to make personalized education accessible to all.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="flex items-start gap-3">
                  <div className="bg-white p-3 rounded-xl shadow-sm">
                    <Users className="h-5 w-5 text-slate-900" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900">Collaborative Culture</h3>
                    <p className="text-sm text-slate-600 font-medium">Work with diverse, talented individuals who share your passion for education.</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="bg-white p-3 rounded-xl shadow-sm">
                    <Award className="h-5 w-5 text-slate-900" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900">Meaningful Impact</h3>
                    <p className="text-sm text-slate-600 font-medium">Directly contribute to improving children's learning outcomes globally.</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="bg-white p-3 rounded-xl shadow-sm">
                    <Globe className="h-5 w-5 text-slate-900" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900">Global Reach</h3>
                    <p className="text-sm text-slate-600 font-medium">Our platform serves learners in multiple countries and languages.</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="bg-white p-3 rounded-xl shadow-sm">
                    <Briefcase className="h-5 w-5 text-slate-900" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900">Growth Opportunities</h3>
                    <p className="text-sm text-slate-600 font-medium">Continuous learning and advancement in a fast-growing field.</p>
                  </div>
                </div>
              </div>
              
              <h3 className="text-lg md:text-xl font-bold mb-6 text-slate-900 flex items-center gap-2">
                <span className="inline-block w-2 h-2 rounded-full bg-[#FACC15]"></span>
                Current Openings
              </h3>
              
              <div className="space-y-4">
                {/* Job Opening 1 */}
                <div className="bg-white border rounded-2xl p-6 hover:border-slate-300 transition-colors">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-bold text-base md:text-lg text-slate-900">Senior AI Engineer</h4>
                      <p className="text-slate-600 text-sm mt-2 font-medium">Develop and implement advanced machine learning algorithms for personalized learning.</p>
                    </div>
                    <span className="bg-[#FACC15] text-slate-900 text-xs font-bold px-3 py-1 rounded-full">Full-time</span>
                  </div>
                  <div className="flex flex-wrap gap-4 mt-4 text-sm text-slate-500">
                    <div className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      <span>Remote</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      <span>3+ Years Experience</span>
                    </div>
                  </div>
                  <button className="mt-4 text-slate-900 hover:underline text-sm font-bold">View Details</button>
                </div>
                
                {/* Job Opening 2 */}
                <div className="bg-white border rounded-2xl p-6 hover:border-slate-300 transition-colors">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-bold text-base md:text-lg text-slate-900">Educational Content Designer</h4>
                      <p className="text-slate-600 text-sm mt-2 font-medium">Create engaging, age-appropriate educational content for our platform.</p>
                    </div>
                    <span className="bg-[#FACC15] text-slate-900 text-xs font-bold px-3 py-1 rounded-full">Full-time</span>
                  </div>
                  <div className="flex flex-wrap gap-4 mt-4 text-sm text-slate-500">
                    <div className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      <span>Lagos, Nigeria</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      <span>2+ Years Experience</span>
                    </div>
                  </div>
                  <button className="mt-4 text-slate-900 hover:underline text-sm font-bold">View Details</button>
                </div>
                
                {/* Job Opening 3 */}
                <div className="bg-white border rounded-2xl p-6 hover:border-slate-300 transition-colors">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-bold text-base md:text-lg text-slate-900">UX/UI Designer</h4>
                      <p className="text-slate-600 text-sm mt-2 font-medium">Design intuitive interfaces for both children and adult users.</p>
                    </div>
                    <span className="bg-[#FACC15] text-slate-900 text-xs font-bold px-3 py-1 rounded-full">Full-time</span>
                  </div>
                  <div className="flex flex-wrap gap-4 mt-4 text-sm text-slate-500">
                    <div className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      <span>Remote</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      <span>4+ Years Experience</span>
                    </div>
                  </div>
                  <button className="mt-4 text-slate-900 hover:underline text-sm font-bold">View Details</button>
                </div>
              </div>
            </div>
          </div>
          
          <div>
            <div className="bg-slate-50 rounded-3xl border border-slate-100 p-8 shadow-sm sticky top-24">
              <h3 className="font-bold text-base md:text-lg text-slate-900 mb-6 flex items-center gap-2">
                <span className="inline-block w-2 h-2 rounded-full bg-[#FACC15]"></span>
                Benefits & Perks
              </h3>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <div className="bg-white text-slate-900 rounded-full p-1 mt-0.5 shadow-sm">
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                  </div>
                  <span className="text-slate-600 text-sm font-medium">Competitive salary and equity packages</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="bg-white text-slate-900 rounded-full p-1 mt-0.5 shadow-sm">
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                  </div>
                  <span className="text-slate-600 text-sm font-medium">Comprehensive health, dental, and vision insurance</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="bg-white text-slate-900 rounded-full p-1 mt-0.5 shadow-sm">
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                  </div>
                  <span className="text-slate-600 text-sm font-medium">Flexible working arrangements</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="bg-white text-slate-900 rounded-full p-1 mt-0.5 shadow-sm">
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                  </div>
                  <span className="text-slate-600 text-sm font-medium">Professional development budget</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="bg-white text-slate-900 rounded-full p-1 mt-0.5 shadow-sm">
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                  </div>
                  <span className="text-slate-600 text-sm font-medium">Unlimited PTO policy</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="bg-white text-slate-900 rounded-full p-1 mt-0.5 shadow-sm">
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                  </div>
                  <span className="text-slate-600 text-sm font-medium">Learning and conference allowances</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="bg-white text-slate-900 rounded-full p-1 mt-0.5 shadow-sm">
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                  </div>
                  <span className="text-slate-600 text-sm font-medium">Childcare support and family-friendly policies</span>
                </li>
              </ul>
              
              <div className="mt-8 pt-6 border-t border-slate-200">
                <h4 className="font-bold text-slate-900 mb-3">Culture & Values</h4>
                <p className="text-slate-600 text-sm font-medium">
                  We foster an environment of continuous learning, collaboration, and innovation. 
                  Our values of empathy, excellence, and impact guide everything we do.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ---------- PAGE ---------- */
export default function ClientCareersPage() {
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
        <CareersContent />
      </main>
      <Footer />
    </div>
  )
}