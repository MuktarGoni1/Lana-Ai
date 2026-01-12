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

/* ---------- COOKIE POLICY CONTENT ---------- */
function CookiePolicyContent() {
  return (
    <section className="py-16 md:py-24 bg-transparent">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4">Cookie Policy</h1>
          <p className="text-muted-foreground text-base md:text-lg">Last updated: {new Date().toLocaleDateString()}</p>
        </div>
        
        <div className="prose prose-gray dark:prose-invert max-w-none bg-card rounded-xl p-6 md:p-8 shadow-sm">
          <p className="text-muted-foreground">
            This Cookie Policy explains how Lana AI ("Company", "we", "us", and "our") uses cookies and similar technologies to recognize you when you visit our website at https://www.lanamind.com ("Website"). It explains what these technologies are and why we use them, as well as your rights to control our use of them.
          </p>

          <h2 className="text-2xl font-bold mt-8 mb-4 text-foreground">What are cookies?</h2>
          <p className="text-muted-foreground">
            Cookies are small data files that are placed on your computer or mobile device when you visit a website. Cookies are widely used by website owners in order to make their websites work, or to work more efficiently, as well as to provide reporting information.
          </p>
          <p className="text-muted-foreground">
            Cookies set by the website owner (in this case, Lana AI) are called "first-party cookies". Cookies set by parties other than the website owner are called "third-party cookies". Third-party cookies enable third-party features or functionality to be provided on or through the website (e.g., advertising, interactive content, and analytics). The parties that set these third-party cookies can recognize your computer both when it visits the website in question and also when it visits certain other websites.
          </p>

          <h2 className="text-2xl font-bold mt-8 mb-4 text-foreground">Why do we use cookies?</h2>
          <p className="text-muted-foreground">
            We use first- and third-party cookies for several reasons. Some cookies are required for technical reasons in order for our Website to operate, and we refer to these as "essential" or "strictly necessary" cookies. Other cookies also enable us to track and target the interests of our users to enhance the experience on our Online Properties. Third parties serve cookies through our Website for advertising, analytics, and other purposes.
          </p>

          <h2 className="text-2xl font-bold mt-8 mb-4 text-foreground">What types of cookies do we use?</h2>
          
          <h3 className="text-xl font-semibold mt-6 mb-3 text-foreground">Essential website cookies</h3>
          <p className="text-muted-foreground">
            These cookies are strictly necessary to provide you with services available through our Website and to use some of its features, such as access to secure areas.
          </p>
          <ul className="list-disc pl-6 mt-3 space-y-2 text-muted-foreground">
            <li><strong>Session ID:</strong> This cookie stores a unique session identifier to allow the server to recognize your browser. It expires when you close your browser.</li>
            <li><strong>Security token:</strong> This cookie is used to prevent cross-site request forgery attacks. It expires when your session ends.</li>
            <li><strong>Authentication:</strong> This cookie stores authentication information to allow the server to recognize you when you visit secure areas of the website. It expires when you log out.</li>
          </ul>

          <h3 className="text-xl font-semibold mt-6 mb-3 text-foreground">Performance and functionality cookies</h3>
          <p className="text-muted-foreground">
            These cookies are used to enhance the performance and functionality of our website but are non-essential to its use. However, without these cookies, certain functionality may become unavailable.
          </p>
          <ul className="list-disc pl-6 mt-3 space-y-2 text-muted-foreground">
            <li><strong>UI preference:</strong> These cookies store information about your preferences and settings to provide you with enhanced, more personal features. These cookies may be set by us or by third-party providers whose services we have added to our pages. The cookies are persistent and may remain in your browser for up to 1 year.</li>
            <li><strong>Font preferences:</strong> These cookies store information about your font preferences to provide a better reading experience. The cookies are persistent and may remain in your browser for up to 1 year.</li>
          </ul>

          <h3 className="text-xl font-semibold mt-6 mb-3 text-foreground">Analytics and customization cookies</h3>
          <p className="text-muted-foreground">
            These cookies collect information that is used either in aggregate form to help us understand how our Website is being used or how effective our marketing campaigns are, or to help us customize our Website for you.
          </p>
          <ul className="list-disc pl-6 mt-3 space-y-2 text-muted-foreground">
            <li><strong>Google Analytics:</strong> These cookies help us understand how visitors interact with our website by collecting and reporting information anonymously. The cookies are persistent and may remain in your browser for up to 2 years.</li>
            <li><strong>Hotjar:</strong> These cookies allow us to track user behavior and collect feedback to improve our website experience. The cookies are persistent and may remain in your browser for up to 1 year.</li>
            <li><strong>User behavior tracking:</strong> These cookies store anonymous information about how you navigate our website to help us improve the user experience. The cookies are persistent and may remain in your browser for up to 2 years.</li>
          </ul>

          <h3 className="text-xl font-semibold mt-6 mb-3 text-foreground">Advertising cookies</h3>
          <p className="text-muted-foreground">
            These cookies are used to make advertising messages more relevant to you. They perform functions like preventing the same ad from continuously reappearing, ensuring that ads are properly displayed for advertisers, and in some cases selecting advertisements that are based on your interests.
          </p>
          <ul className="list-disc pl-6 mt-3 space-y-2 text-muted-foreground">
            <li><strong>Ad performance:</strong> These cookies track visits, conversions, and actions so that we can measure and improve the performance of our advertising campaigns. The cookies are persistent and may remain in your browser for up to 1 year.</li>
            <li><strong>Retargeting:</strong> These cookies collect information about your browsing habits to make advertising relevant to you and your interests. The cookies are persistent and may remain in your browser for up to 1 year.</li>
          </ul>

          <h3 className="text-xl font-semibold mt-6 mb-3 text-foreground">Social networking cookies</h3>
          <p className="text-muted-foreground">
            These cookies are used to enable you to share pages and content that you find interesting on our Website through third-party social networking and other websites. These cookies may also be used for advertising purposes too.
          </p>
          <ul className="list-disc pl-6 mt-3 space-y-2 text-muted-foreground">
            <li><strong>Social sharing:</strong> These cookies allow you to share content on social networks like Facebook, Twitter, and LinkedIn. The cookies are set by the social networks themselves.</li>
          </ul>

          <h2 className="text-2xl font-bold mt-8 mb-4 text-foreground">How can you control cookies?</h2>
          <p className="text-muted-foreground">
            You have the right to decide whether to accept or reject cookies. You can exercise your cookie rights by setting your preferences in the Cookie Consent Manager. The Cookie Consent Manager allows you to select which categories of cookies you accept.
          </p>
          <p className="text-muted-foreground">
            You can also set or amend your web browser controls to accept or refuse cookies. As the means by which you can refuse cookies through your web browser controls vary from browser to browser, you should visit your browser's help menu for more information.
          </p>
          <p className="text-muted-foreground">
            The specific types of first and third-party cookies on our Website and the purposes they perform are described in the table above (although you should note that the specific cookies may vary depending on the particular services you use).
          </p>

          <h2 className="text-2xl font-bold mt-8 mb-4 text-foreground">How can you manage your cookie preferences?</h2>
          <p className="text-muted-foreground">
            When you access our Website, you will be asked to consent to the placement of certain categories of cookies on your device. You can manage your cookie preferences by:
          </p>
          <ul className="list-disc pl-6 mt-3 space-y-2 text-muted-foreground">
            <li>Accepting all cookies</li>
            <li>Rejecting all non-essential cookies</li>
            <li>Customizing your cookie preferences</li>
            <li>Withdrawing your consent at any time by using the Cookie Settings link in our footer</li>
          </ul>

          <h2 className="text-2xl font-bold mt-8 mb-4 text-foreground">What about other tracking technologies, like web beacons?</h2>
          <p className="text-muted-foreground">
            Cookies are not the only way to recognize or track visitors to a website. We may use other, similar technologies from time to time, like web beacons (sometimes called "tracking pixels" or "clear gifs"). These are tiny graphics files that contain a unique identifier that enables us to recognize when someone has visited our Website or opened an e-mail including those files. This allows us, for example, to monitor the traffic patterns of users from one page within a website to another, to deliver or communicate with cookies, to understand whether you have come to the website from an online advertisement displayed on a third-party website, to improve site performance, and to measure the success of e-mail marketing campaigns. In many instances, these technologies are reliant on cookies to function properly, and so declining cookies will impair their functioning.
          </p>

          <h2 className="text-2xl font-bold mt-8 mb-4 text-foreground">Do you use Flash cookies or Local Shared Objects?</h2>
          <p className="text-muted-foreground">
            Websites may also use so-called "Flash cookies" (also known as Local Shared Objects or "LSOs") to, among other things, collect and store information about your use of our services, fraud prevention, and for other site operations. If you do not want Flash cookies stored on your computer, you can adjust the settings of your Flash player to block Flash cookies storage using the tools contained in the Website Storage Settings Panel. You can also control Flash cookies by going to the Global Storage Settings Panel and following the instructions (which may include instructions that explain, for example, how to delete existing Flash cookies, how to prevent Flash LSOs from being placed on your computer without your being asked, and (for Flash Player 8 and later) how to block Flash cookies that are not being delivered by the operator of the page you are on at the time). Please note that setting the Flash Player to restrict or limit acceptance of Flash cookies may reduce or impede the functionality of some Flash applications.
          </p>

          <h2 className="text-2xl font-bold mt-8 mb-4 text-foreground">Do you serve targeted advertising?</h2>
          <p className="text-muted-foreground">
            Third parties may serve cookies on your computer or mobile device to serve advertising through our Website. These companies may use information about your visits to this and other websites in order to provide relevant advertisements about goods and services that you may be interested in. They may also employ technology that is used to measure the effectiveness of advertisements. This can be accomplished by them using cookies or web beacons to collect information about your visits to this and other sites in order to provide relevant advertisements about goods and services of potential interest to you. The information collected through this process does not enable us or them to identify your name, contact details, or other details that directly identify you unless you choose to provide these.
          </p>

          <h2 className="text-2xl font-bold mt-8 mb-4 text-foreground">How often will you update this Cookie Policy?</h2>
          <p className="text-muted-foreground">
            We may update this Cookie Policy from time to time in order to reflect, for example, changes to the cookies we use or for other operational, legal, or regulatory reasons. Please therefore revisit this Cookie Policy regularly to stay informed about our use of cookies and related technologies.
          </p>
          <p className="text-muted-foreground">
            The date at the top of this Cookie Policy indicates when it was last updated.
          </p>

          <h2 className="text-2xl font-bold mt-8 mb-4 text-foreground">Where can you get further information?</h2>
          <p className="text-muted-foreground">
            If you have any questions about our use of cookies or other technologies, please email us at:
          </p>
          <ul className="list-disc pl-6 mt-3 space-y-2 text-muted-foreground">
            <li>By email: privacy@lana.ai</li>
            <li>By visiting this page on our website: https://www.lanamind.com/contact</li>
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
export default function CookiePolicyPage() {
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
        <CookiePolicyContent />
      </main>
      <Footer />
    </div>
  )
}