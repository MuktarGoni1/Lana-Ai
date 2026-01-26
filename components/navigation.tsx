"use client";

import { useState } from "react";
import Link from "next/link";
import { useUnifiedAuth } from "@/contexts/UnifiedAuthContext";
import { Menu, X, LogOut } from "lucide-react";
import { getChildFriendlyClasses } from "@/lib/child-friendly-ui";

export function Navigation() {
  const [open, setOpen] = useState(false);
  const { user, logout } = useUnifiedAuth();

  const navLinks = [
    { label: 'Features', href: '/features' },
    { label: 'Pricing', href: '/pricing' },
    { label: 'Demo', href: '/demo' },
    { label: 'About', href: '/about' },
    { label: 'Blog', href: '/blog' },
    { label: 'Careers', href: '/careers' },
    { label: 'Contact', href: '/contact' },
    { label: 'Privacy', href: '/privacy-policy' },
    { label: 'Terms', href: '/terms-of-service' },
    { label: 'Security', href: '/security-policy' }
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-gradient-to-b from-blue-50/80 to-cyan-50/80 backdrop-blur">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <Link href="/" className="text-xl font-bold text-foreground">Lana AI</Link>

          {/* desktop */}
          <nav className="hidden md:flex items-center gap-6 lg:gap-8">
            {navLinks.map((l) => (
              <Link 
                key={l.label} 
                href={l.href}
                className="text-sm font-semibold text-slate-600 hover:text-purple-600 transition-colors"
              >
                {l.label}
              </Link>
            ))}
            
            {user ? (
              <div className="flex items-center gap-4">
                <Link 
                  href="/homepage" 
                  className={getChildFriendlyClasses.buttonSmall}
                >
                  My Dashboard
                </Link>
                <button
                  onClick={async () => {
                    try {
                      await logout();
                    } catch (error) {
                      console.error('Error logging out:', error);
                    }
                  }}
                  className="text-sm font-bold text-slate-900 hover:text-purple-600 transition-colors flex items-center gap-1"
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-4">
                <Link 
                  href="/login" 
                  className="text-sm font-bold text-slate-900 hover:text-purple-600"
                >
                  Login
                </Link>
                <Link 
                  href="/register" 
                  className={getChildFriendlyClasses.buttonSmall}
                >
                  Get Started
                </Link>
              </div>
            )}
          </nav>

          {/* mobile burger */}
          <button
            onClick={() => setOpen((o) => !o)}
            className="md:hidden p-2 rounded-lg text-slate-900"
          >
            {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* mobile panel */}
        <div className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out ${open ? "max-h-96 opacity-100 bg-white border-t border-slate-100" : "max-h-0 opacity-0"}`}>
          <nav className="flex flex-col gap-4 py-6 px-4">
            {navLinks.map((l) => (
              <Link 
                key={l.label} 
                href={l.href}
                onClick={() => setOpen(false)} 
                className="text-base font-semibold text-slate-600 hover:text-purple-600 transition-colors"
              >
                {l.label}
              </Link>
            ))}
            {user ? (
              <div className="flex flex-col gap-3">
                <Link href="/homepage" className={getChildFriendlyClasses.button} onClick={() => setOpen(false)}>
                  Dashboard
                </Link>
                <button
                  onClick={async () => {
                    setOpen(false);
                    try {
                      await logout();
                    } catch (error) {
                      console.error('Error logging out:', error);
                    }
                  }}
                  className="text-base font-semibold text-slate-600 hover:text-purple-600 transition-colors flex items-center gap-2"
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                <Link href="/login" className={getChildFriendlyClasses.buttonSecondary} onClick={() => setOpen(false)}>
                  Login
                </Link>
                <Link href="/register" className={getChildFriendlyClasses.button} onClick={() => setOpen(false)}>
                  Get Started
                </Link>
              </div>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}