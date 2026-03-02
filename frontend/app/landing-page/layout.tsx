import { ClientProviders } from '@/app/providers'
import { ThemeProvider } from 'next-themes'
import { UnifiedAuthProvider } from '@/contexts/UnifiedAuthContext'
import SessionTimeoutHandler from '@/components/session-timeout-handler'
import { SessionMonitor } from '@/components/auth/SessionMonitor'
import { LocalChildrenManager } from '@/components/local-children-manager'
import { Header } from '@/components/navigation'
import { Footer } from '@/components/footer'

export default function LandingPageLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="font-sans" suppressHydrationWarning>
      <head>
        <meta httpEquiv="Cache-Control" content="no-cache, no-store, must-revalidate" />
        <meta httpEquiv="Pragma" content="no-cache" />
        <meta httpEquiv="Expires" content="0" />
        <link rel="manifest" href="/manifest.json" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js')
                    .then(function(registration) {
                      console.log('[Service Worker] Registered with scope:', registration.scope);
                    })
                    .catch(function(error) {
                      console.log('[Service Worker] Registration failed:', error);
                    });
                });
              }
            `,
          }}
        />
      </head>
      <body>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <UnifiedAuthProvider>
            <Header />
            <ClientProviders>
              {children}
              <LocalChildrenManager />
              <SessionTimeoutHandler />
              <SessionMonitor />
            </ClientProviders>
            <Footer />
          </UnifiedAuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}