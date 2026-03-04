// Google Analytics 4 Configuration
// Replace with your actual GA4 Measurement ID after creating account at https://analytics.google.com

export const GA_TRACKING_ID = process.env.NEXT_PUBLIC_GA_ID || 'G-XXXXXXXXXX' // Replace with your actual ID

// Initialize Google Analytics
declare global {
  interface Window {
    gtag: (...args: any[]) => void
    dataLayer: any[]
  }
}

export const pageview = (url: string) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('config', GA_TRACKING_ID, {
      page_path: url,
    })
  }
}

export const event = ({ action, category, label, value }: {
  action: string
  category: string
  label?: string
  value?: number
}) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', action, {
      event_category: category,
      event_label: label,
      value: value,
    })
  }
}

// Conversion events
export const trackConversion = (conversionName: string, value?: number) => {
  event({
    action: conversionName,
    category: 'conversion',
    label: conversionName,
    value: value,
  })
}

// Lead generation events
export const trackLead = (source: string) => {
  trackConversion('generate_lead')
  event({
    action: 'lead_generated',
    category: 'lead_generation',
    label: source,
  })
}

// E-commerce events (for subscriptions)
export const trackPurchase = (plan: string, value: number) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'purchase', {
      transaction_id: Date.now().toString(),
      value: value,
      currency: 'USD',
      items: [{
        item_name: plan,
        item_category: 'subscription',
        price: value,
        quantity: 1
      }]
    })
  }
}
