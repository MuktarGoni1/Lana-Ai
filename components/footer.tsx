import Link from "next/link";
import { Twitter, Facebook, Instagram, Linkedin } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-slate-50 border-t border-slate-200 py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          <div className="col-span-1 md:col-span-1">
            <span className="text-2xl font-extrabold text-slate-900">LanaMind</span>
            <p className="mt-4 text-slate-500 font-medium">Delivering clear, AI-powered learning experiences.</p>
            <div className="flex gap-4 mt-6">
              {[Twitter, Facebook, Instagram, Linkedin].map((Icon, i) => (
                <a key={i} href="#" className="p-2 bg-white rounded-full shadow-sm text-slate-400 hover:text-purple-600 transition-colors">
                  <Icon className="h-5 w-5" />
                </a>
              ))}
            </div>
          </div>
          
          {[
            { head: "Product", links: ["Features", "Pricing", "Demo"] },
            { head: "Company", links: ["About", "Blog", "Careers", "Contact"] },
            { head: "Legal", links: ["Privacy", "Terms", "Security"] }
          ].map((col) => (
            <div key={col.head}>
              <h4 className="font-bold text-slate-900 mb-4">{col.head}</h4>
              <ul className="space-y-3">
                {col.links.map(l => (
                  <li key={l}>
                    <Link 
                      href={
                        l === 'Features' ? '/features' : 
                        l === 'Pricing' ? '/pricing' : 
                        l === 'Demo' ? '/demo' : 
                        l === 'About' ? '/about' : 
                        l === 'Blog' ? '/blog' : 
                        l === 'Careers' ? '/careers' : 
                        l === 'Contact' ? '/contact' : 
                        l === 'Privacy' ? '/privacy-policy' : 
                        l === 'Terms' ? '/terms-of-service' : 
                        l === 'Security' ? '/security-policy' : 
                        `/${l.toLowerCase().replace(' ', '-')}`
                      }
                      className="text-slate-600 hover:text-purple-600 font-medium transition-colors"
                    >
                      {l}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-12 pt-8 border-t border-slate-200 text-center text-slate-500 font-medium">
          © {new Date().getFullYear()} Lana AI. All rights reserved.
        </div>
      </div>
    </footer>
  )
}