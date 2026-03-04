'use client'

import Script from 'next/script'
import { usePathname } from 'next/navigation'
import { useEffect } from 'react'
import { GA_TRACKING_ID, pageview } from '@/lib/analytics'

export function GoogleAnalytics() {
  const pathname = usePathname()

  useEffect(() => {
    if (pathname) {
      pageview(pathname)
    }
  }, [pathname])

  return (
    <>
      <Script
        strategy="afterInteractive"
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_TRACKING_ID}`}
      />
      <Script
        id="google-analytics"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${GA_TRACKING_ID}', {
              page_path: window.location.pathname,
              send_page_view: true,
              cookie_flags: 'SameSite=None;Secure',
              cookie_expires: 63072000, // 2 years
              allow_google_signals: true,
              allow_ad_personalization_signals: true,
              transport_type: 'beacon'
            });
          `,
        }}
      />
    </>
  )
}
