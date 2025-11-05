"use client"
import { useState } from "react"
import Link from "next/link"
import { useTheme } from "next-themes"
import { Menu, X, Moon, Sun } from "lucide-react"

function ThemeToggle() {
const { resolvedTheme, setTheme } = useTheme()
const [mounted, setMounted] = useState(false)
// Show placeholder to prevent layout shift before mount
if (!mounted) {
return (
<div className="inline-flex items-center justify-center rounded-md w-9 h-9" />
)
}

return (
<button
onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
className="inline-flex items-center justify-center rounded-md w-9 h-9 hover:bg-muted transition relative"
aria-label="Toggle theme"
>
{resolvedTheme === "dark" ? (
<Moon className="h-5 w-5" />
) : (
<Sun className="h-5 w-5" />
)}
</button>
)
}

export default function Header() {
const [open, setOpen] = useState(false)
return (
<header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur">
<div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
<div className="flex h-16 items-center justify-between">
<span className="text-xl font-bold text-foreground">Lana AI</span>

      {/* desktop */}
      <nav className="hidden md:flex items-center gap-6">
        {["Features", "Pricing", "Contact"].map((l) => (
          <Link key={l} href={`#${l.toLowerCase()}`} className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background">
            {l}
          </Link>
        ))}
        <ThemeToggle />
        <Link href="/login" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background">Login</Link>
        <Link href="/register" className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 hover:shadow-md transition-colors transition-shadow duration-200 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background">
          Get Started
        </Link>
      </nav>

      {/* mobile burger */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="md:hidden p-2 rounded-md hover:bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        aria-expanded={open}
        aria-controls="mobile-nav"
      >
        {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>
    </div>

    {/* mobile panel */}
    <div
      id="mobile-nav"
      className={`md:hidden overflow-hidden transition-all duration-300 ${open ? "max-h-64" : "max-h-0"}`}
    >
      <nav className="flex flex-col gap-4 py-4">
        {["Features", "Pricing", "Contact"].map((l) => (
          <Link key={l} href={`#${l.toLowerCase()}`} onClick={() => setOpen(false)} className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background">
            {l}
          </Link>
        ))}
        <div className="mt-2 flex items-center gap-2">
          <ThemeToggle />
          <Link href="/login" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background">Login</Link>
          <Link href="/register" className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 hover:shadow-md transition-colors transition-shadow duration-200 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background">
            Get Started
          </Link>
        </div>
      </nav>
    </div>
  </div>
</header>
  )
}