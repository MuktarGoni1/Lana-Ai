// This file configures the initialization of Sentry on the client.
// The added config here will be used whenever a users loads a page in their browser.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

// Only initialize Sentry in production to avoid development overhead
if (process.env.NODE_ENV === 'production') {
  Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN || "https://d68bb2a6dff253e4c3cd5d0bbd7edd26@o4510461990469632.ingest.us.sentry.io/4510461997809664",

    // Reduce traces sample rate in production to reduce overhead
    tracesSampleRate: 0.2,
    
    // Reduce replay sampling rates to minimize performance impact
    replaysSessionSampleRate: 0.05,
    replaysOnErrorSampleRate: 0.2,

    // Optimize integrations for performance
    integrations: [
      Sentry.replayIntegration({
        maskAllText: true,
        blockAllMedia: true,
        // Reduce network payloads
        networkDetailAllowUrls: [],
        networkCaptureBodies: false,
      }),
    ],

    // Environment
    environment: process.env.NODE_ENV,
    
    // Disable verbose logging in production
    debug: false,
    
    // Optimize performance
    beforeSend: (event) => {
      // Limit the size of events to reduce network overhead
      if (event.extra) {
        const extraSize = JSON.stringify(event.extra).length;
        if (extraSize > 50000) {
          event.extra = { truncated: true, originalSize: extraSize };
        }
      }
      return event;
    }
  });
} else {
  // Minimal Sentry setup for development
  Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN || "https://d68bb2a6dff253e4c3cd5d0bbd7edd26@o4510461990469632.ingest.us.sentry.io/4510461997809664",
    tracesSampleRate: 0.0,
    replaysSessionSampleRate: 0.0,
    replaysOnErrorSampleRate: 0.0,
    debug: false,
    environment: process.env.NODE_ENV,
  });
}

export const onRouterTransitionStart = process.env.NODE_ENV === 'production' 
  ? Sentry.captureRouterTransitionStart 
  : () => {};